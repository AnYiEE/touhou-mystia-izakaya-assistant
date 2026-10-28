import { readFile, writeFile } from 'node:fs/promises';
import {
	dirname,
	extname,
	isAbsolute,
	relative,
	resolve,
	sep,
} from 'node:path';
import { cwd } from 'node:process';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import ts from 'typescript';

interface IImportEntry {
	declaration: ts.ImportDeclaration;
	groupKey: string;
	groupOrder: number;
	moduleSpecifier: string;
}

interface IImportRun {
	end: number;
	start: number;
}

interface ITypeBinding {
	name: string;
	symbol: ts.Symbol | null;
	typeOnly: boolean;
}

interface ITypedImportState {
	canTransformTypes: boolean;
	isRuntimeFree: boolean;
	valueReferencedSymbols: ReadonlySet<ts.Symbol>;
}

interface ITypeNodeHelper {
	isPartOfTypeNode?: (node: ts.Node) => boolean;
}

const PROJECT_ROOT = resolve(cwd());
const APP_ROOT = resolve(PROJECT_ROOT, 'app');
const CONFIG_PATH = resolve(PROJECT_ROOT, 'tsconfig.json');
const THEME_ROOT = resolve(APP_ROOT, 'design/theme');
const SCRIPT_EXTENSIONS = [
	'.cjs',
	'.cts',
	'.js',
	'.jsx',
	'.mjs',
	'.mts',
	'.ts',
	'.tsx',
] as const;
const SCRIPT_EXTENSION_SET = new Set<string>(SCRIPT_EXTENSIONS);
const IGNORED_DIRECTORIES = [
	'**/.deploy/**',
	'**/.git/**',
	'**/.next/**',
	'**/.tmp/**',
	'**/node_modules/**',
	'**/out/**',
] as const;
const runtimeFreeSourceFileCache = new Map<string, boolean>();

function compareText(left: string, right: string) {
	return left < right ? -1 : left > right ? 1 : 0;
}

function checkWithin(parentPath: string, childPath: string) {
	const relativePath = relative(parentPath, childPath);
	return (
		relativePath === '' ||
		(!relativePath.startsWith(`..${sep}`) &&
			relativePath !== '..' &&
			!isAbsolute(relativePath))
	);
}

function getScriptKind(filePath: string) {
	switch (extname(filePath)) {
		case '.js':
		case '.mjs':
		case '.cjs':
			return ts.ScriptKind.JS;
		case '.jsx':
			return ts.ScriptKind.JSX;
		case '.tsx':
			return ts.ScriptKind.TSX;
		default:
			return ts.ScriptKind.TS;
	}
}

function isTypeScriptFile(filePath: string) {
	return ['.cts', '.mts', '.ts', '.tsx'].includes(extname(filePath));
}

function isProcessableFile(filePath: string) {
	if (
		!SCRIPT_EXTENSION_SET.has(extname(filePath)) ||
		filePath.endsWith('.d.ts')
	) {
		return false;
	}
	return (
		checkWithin(PROJECT_ROOT, filePath) &&
		!filePath.includes(`${sep}node_modules${sep}`) &&
		!filePath.includes(`${sep}.next${sep}`)
	);
}

function getDiagnosticText(diagnostic: ts.Diagnostic) {
	return ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
}

function getParsedConfig() {
	const parsedConfig = ts.getParsedCommandLineOfConfigFile(
		CONFIG_PATH,
		{},
		{
			fileExists: ts.sys.fileExists,
			getCurrentDirectory: () => PROJECT_ROOT,
			onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
				throw new Error(getDiagnosticText(diagnostic));
			},
			readDirectory: ts.sys.readDirectory,
			readFile: ts.sys.readFile,
			useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
		}
	);
	if (parsedConfig === undefined) {
		throw new Error(`Unable to read ${CONFIG_PATH}.`);
	}
	const configErrors = parsedConfig.errors.filter(
		({ category }) => category === ts.DiagnosticCategory.Error
	);
	if (configErrors.length > 0) {
		throw new Error(configErrors.map(getDiagnosticText).join('\n'));
	}
	return parsedConfig;
}

function getDefaultFiles(parsedConfig: ts.ParsedCommandLine) {
	return parsedConfig.fileNames.filter(isProcessableFile).sort(compareText);
}

function getRequestedFiles(paths: ReadonlyArray<string>) {
	const files = new Set<string>();
	for (const pathArgument of paths) {
		const absolutePath = resolve(PROJECT_ROOT, pathArgument);
		const entries = ts.sys.directoryExists(absolutePath)
			? ts.sys.readDirectory(
					absolutePath,
					SCRIPT_EXTENSIONS,
					IGNORED_DIRECTORIES
				)
			: [absolutePath];
		for (const filePath of entries) {
			if (isProcessableFile(filePath)) {
				files.add(resolve(filePath));
			}
		}
	}
	return [...files].sort(compareText);
}

function isSideEffectImport(declaration: ts.ImportDeclaration) {
	if (declaration.importClause === undefined) {
		return true;
	}
	const { namedBindings } = declaration.importClause;
	return (
		declaration.importClause.name === undefined &&
		namedBindings !== undefined &&
		ts.isNamedImports(namedBindings) &&
		namedBindings.elements.length === 0
	);
}

function hasCommentInRange(
	sourceFile: ts.SourceFile,
	start: number,
	end: number
) {
	if (start >= end) {
		return false;
	}
	const scanner = ts.createScanner(
		ts.ScriptTarget.Latest,
		false,
		ts.LanguageVariant.Standard,
		sourceFile.text.slice(start, end)
	);
	for (
		let token = scanner.scan();
		token !== ts.SyntaxKind.EndOfFileToken;
		token = scanner.scan()
	) {
		if (
			token === ts.SyntaxKind.SingleLineCommentTrivia ||
			token === ts.SyntaxKind.MultiLineCommentTrivia
		) {
			return true;
		}
	}
	return false;
}

function canRewriteImport(
	declaration: ts.ImportDeclaration,
	sourceFile: ts.SourceFile
) {
	return !hasCommentInRange(
		sourceFile,
		declaration.getStart(sourceFile),
		declaration.end
	);
}

function collectImportRuns(sourceFile: ts.SourceFile) {
	const runs: IImportRun[] = [];
	let current: ts.ImportDeclaration[] = [];

	const flush = () => {
		const [first] = current;
		const [last] = current.slice(-1);
		if (first !== undefined && last !== undefined) {
			runs.push({ end: last.end, start: first.getStart(sourceFile) });
		}
		current = [];
	};

	for (const statement of sourceFile.statements) {
		if (
			!ts.isImportDeclaration(statement) ||
			isSideEffectImport(statement) ||
			!canRewriteImport(statement, sourceFile)
		) {
			flush();
			continue;
		}

		const previous = current.at(-1);
		if (
			(previous !== undefined &&
				hasCommentInRange(
					sourceFile,
					previous.end,
					statement.getStart(sourceFile)
				)) ||
			hasCommentInRange(
				sourceFile,
				statement.getFullStart(),
				statement.getStart(sourceFile)
			)
		) {
			flush();
			continue;
		}
		current.push(statement);
	}
	flush();

	return runs;
}

function hasDeclareModifier(node: ts.Node) {
	return ts.canHaveModifiers(node)
		? (ts
				.getModifiers(node)
				?.some(
					(modifier) => modifier.kind === ts.SyntaxKind.DeclareKeyword
				) ?? false)
		: false;
}

function getImportBindingNames(declaration: ts.ImportDeclaration) {
	const { importClause } = declaration;
	if (importClause === undefined) {
		return [];
	}
	const names: ts.Identifier[] = [];
	if (importClause.name !== undefined) {
		names.push(importClause.name);
	}
	if (importClause.namedBindings !== undefined) {
		if (ts.isNamedImports(importClause.namedBindings)) {
			for (const element of importClause.namedBindings.elements) {
				names.push(element.name);
			}
		} else {
			names.push(importClause.namedBindings.name);
		}
	}
	return names;
}

function isRuntimeFreeSourceFile(
	sourceFile: ts.SourceFile,
	checker: ts.TypeChecker,
	valueReferencedSymbols: ReadonlySet<ts.Symbol>
) {
	if (sourceFile.isDeclarationFile) {
		return true;
	}

	for (const statement of sourceFile.statements) {
		if (
			ts.isInterfaceDeclaration(statement) ||
			ts.isTypeAliasDeclaration(statement) ||
			ts.isEmptyStatement(statement)
		) {
			continue;
		}
		if (ts.isImportDeclaration(statement)) {
			const { importClause } = statement;
			if (importClause === undefined) {
				return false;
			}
			if (importClause.phaseModifier === ts.SyntaxKind.TypeKeyword) {
				continue;
			}
			if (importClause.phaseModifier === ts.SyntaxKind.DeferKeyword) {
				return false;
			}
			if (
				getImportBindingNames(statement).some((name) => {
					const symbol = checker.getSymbolAtLocation(name);
					return (
						symbol !== undefined &&
						valueReferencedSymbols.has(symbol)
					);
				})
			) {
				return false;
			}
			continue;
		}
		if (ts.isExportDeclaration(statement)) {
			if (statement.isTypeOnly) {
				continue;
			}
			const { exportClause } = statement;
			if (exportClause === undefined) {
				return false;
			}
			if (ts.isNamespaceExport(exportClause)) {
				return false;
			}
			if (
				!ts.isNamedExports(exportClause) ||
				exportClause.elements.some(({ isTypeOnly }) => !isTypeOnly)
			) {
				return false;
			}
			continue;
		}
		if (
			ts.isModuleDeclaration(statement) &&
			(statement.flags & ts.NodeFlags.GlobalAugmentation) !== 0
		) {
			continue;
		}
		if (!hasDeclareModifier(statement)) {
			return false;
		}
	}

	return true;
}

function getImportedSourceFile(
	declaration: ts.ImportDeclaration,
	checker: ts.TypeChecker
) {
	const moduleSymbol = checker.getSymbolAtLocation(
		declaration.moduleSpecifier
	);
	const symbol =
		moduleSymbol === undefined ||
		(moduleSymbol.flags & ts.SymbolFlags.Alias) === 0
			? moduleSymbol
			: checker.getAliasedSymbol(moduleSymbol);
	const declarationNode =
		symbol?.valueDeclaration ?? symbol?.declarations?.[0] ?? null;
	if (declarationNode === null) {
		return null;
	}
	const sourceFile = declarationNode.getSourceFile();
	return checkWithin(PROJECT_ROOT, sourceFile.fileName) &&
		!sourceFile.fileName.includes(`${sep}node_modules${sep}`)
		? sourceFile
		: null;
}

function collectValueReferencedSymbols(
	sourceFile: ts.SourceFile,
	checker: ts.TypeChecker
) {
	const importSymbols = new Set<ts.Symbol>();
	for (const statement of sourceFile.statements) {
		if (!ts.isImportDeclaration(statement)) {
			continue;
		}
		for (const name of getImportBindingNames(statement)) {
			const symbol = checker.getSymbolAtLocation(name);
			if (symbol !== undefined) {
				importSymbols.add(symbol);
				if ((symbol.flags & ts.SymbolFlags.Alias) !== 0) {
					importSymbols.add(checker.getAliasedSymbol(symbol));
				}
			}
		}
	}

	const valueReferencedSymbols = new Set<ts.Symbol>();
	const typeNodeHelper = ts as unknown as ITypeNodeHelper;
	const visit = (node: ts.Node) => {
		if (ts.isImportDeclaration(node)) {
			return;
		}
		if (ts.isIdentifier(node)) {
			const { parent } = node;
			const symbol =
				ts.isShorthandPropertyAssignment(parent) && parent.name === node
					? (checker.getShorthandAssignmentValueSymbol(parent) ??
						checker.getSymbolAtLocation(node))
					: ts.isExportSpecifier(parent) &&
						  parent.propertyName === undefined &&
						  parent.name === node
						? (checker.getExportSpecifierLocalTargetSymbol(
								parent
							) ?? checker.getSymbolAtLocation(node))
						: checker.getSymbolAtLocation(node);
			let isInTypeQuery = false;
			let ancestor: ts.Node = parent;
			while (!ts.isSourceFile(ancestor)) {
				if (ts.isTypeQueryNode(ancestor)) {
					isInTypeQuery = true;
					break;
				}
				ancestor = ancestor.parent;
			}
			if (
				symbol !== undefined &&
				importSymbols.has(symbol) &&
				!isInTypeQuery &&
				!(typeNodeHelper.isPartOfTypeNode?.(node) ?? false)
			) {
				valueReferencedSymbols.add(symbol);
			}
		}
		ts.forEachChild(node, visit);
	};
	visit(sourceFile);

	return valueReferencedSymbols;
}

function getTypeBinding(
	name: ts.Identifier,
	isExplicitlyTypeOnly: boolean,
	canTransformTypes: boolean,
	checker: ts.TypeChecker,
	valueReferencedSymbols: ReadonlySet<ts.Symbol>
): ITypeBinding {
	const symbol = checker.getSymbolAtLocation(name) ?? null;
	return {
		name: name.text,
		symbol,
		typeOnly:
			isExplicitlyTypeOnly ||
			(canTransformTypes &&
				(symbol === null || !valueReferencedSymbols.has(symbol))),
	};
}

function isRuntimeFreeProjectSourceFile(
	sourceFile: ts.SourceFile,
	checker: ts.TypeChecker
) {
	const cached = runtimeFreeSourceFileCache.get(sourceFile.fileName);
	if (cached !== undefined) {
		return cached;
	}
	const result = isRuntimeFreeSourceFile(
		sourceFile,
		checker,
		collectValueReferencedSymbols(sourceFile, checker)
	);
	runtimeFreeSourceFileCache.set(sourceFile.fileName, result);
	return result;
}

function getTypedImportState(
	declaration: ts.ImportDeclaration,
	sourceFile: ts.SourceFile,
	checker: ts.TypeChecker,
	valueReferencedSymbols: ReadonlySet<ts.Symbol>
): ITypedImportState {
	const importedSourceFile = getImportedSourceFile(declaration, checker);
	const canTransformTypes =
		isTypeScriptFile(sourceFile.fileName) && importedSourceFile !== null;
	return {
		canTransformTypes,
		isRuntimeFree:
			canTransformTypes &&
			importedSourceFile !== sourceFile &&
			isRuntimeFreeProjectSourceFile(importedSourceFile, checker),
		valueReferencedSymbols,
	};
}

function rewriteModuleSpecifier(filePath: string, moduleSpecifier: string) {
	const isProjectSpecifier =
		moduleSpecifier.startsWith('@/') ||
		moduleSpecifier.startsWith('./') ||
		moduleSpecifier.startsWith('../');
	if (!isProjectSpecifier) {
		return moduleSpecifier;
	}

	const withoutIndex = moduleSpecifier.replace(/\/(?:index)$/u, '');
	if (
		!checkWithin(APP_ROOT, filePath) ||
		checkWithin(THEME_ROOT, filePath) ||
		!moduleSpecifier.startsWith('../')
	) {
		return withoutIndex;
	}

	const fileDirectory = dirname(filePath);
	const targetPath = resolve(fileDirectory, moduleSpecifier);
	if (!checkWithin(APP_ROOT, targetPath)) {
		return withoutIndex;
	}
	const targetWithoutIndex = targetPath.replace(
		new RegExp(`${sep}index$`, 'u'),
		''
	);
	if (checkWithin(fileDirectory, targetWithoutIndex)) {
		const localPath = relative(fileDirectory, targetWithoutIndex)
			.split(sep)
			.join('/');
		return localPath === '' ? '.' : `./${localPath}`;
	}
	const aliasPath = relative(APP_ROOT, targetWithoutIndex)
		.split(sep)
		.join('/');
	return `@/${aliasPath}`;
}

function transformImportDeclaration(
	declaration: ts.ImportDeclaration,
	sourceFile: ts.SourceFile,
	checker: ts.TypeChecker,
	valueReferencedSymbols: ReadonlySet<ts.Symbol>
) {
	const { importClause } = declaration;
	if (importClause === undefined) {
		return declaration;
	}
	if (importClause.phaseModifier === ts.SyntaxKind.DeferKeyword) {
		return declaration;
	}
	const isTypeOnlyClause =
		importClause.phaseModifier === ts.SyntaxKind.TypeKeyword;
	const typeState = getTypedImportState(
		declaration,
		sourceFile,
		checker,
		valueReferencedSymbols
	);
	const namedImports =
		importClause.namedBindings !== undefined &&
		ts.isNamedImports(importClause.namedBindings)
			? importClause.namedBindings
			: null;
	const namespaceImport =
		importClause.namedBindings !== undefined &&
		ts.isNamespaceImport(importClause.namedBindings)
			? importClause.namedBindings
			: null;
	const defaultBinding =
		importClause.name === undefined
			? null
			: getTypeBinding(
					importClause.name,
					isTypeOnlyClause,
					typeState.canTransformTypes,
					checker,
					valueReferencedSymbols
				);
	const namespaceBinding =
		namespaceImport === null
			? null
			: getTypeBinding(
					namespaceImport.name,
					isTypeOnlyClause,
					typeState.canTransformTypes,
					checker,
					valueReferencedSymbols
				);
	const namedBindings =
		namedImports === null
			? []
			: namedImports.elements.map((element) => ({
					element,
					typeBinding: getTypeBinding(
						element.name,
						isTypeOnlyClause || element.isTypeOnly,
						typeState.canTransformTypes,
						checker,
						valueReferencedSymbols
					),
				}));
	const allBindings = [
		...(defaultBinding === null ? [] : [defaultBinding]),
		...(namespaceBinding === null ? [] : [namespaceBinding]),
		...namedBindings.map(({ typeBinding }) => typeBinding),
	];
	const allTypeOnly = allBindings.every(({ typeOnly }) => typeOnly);
	const isNamedOnly =
		defaultBinding === null &&
		namespaceBinding === null &&
		namedBindings.length > 0;
	const shouldUseInlineTypes =
		isNamedOnly && allTypeOnly && !typeState.isRuntimeFree;
	const shouldMarkInlineTypes = !allTypeOnly || shouldUseInlineTypes;

	let nextNamedImports = namedImports;
	if (namedImports !== null) {
		const elements = namedBindings
			.sort(({ typeBinding: left }, { typeBinding: right }) =>
				compareText(left.name, right.name)
			)
			.map(({ element, typeBinding }) =>
				ts.factory.updateImportSpecifier(
					element,
					shouldMarkInlineTypes && typeBinding.typeOnly,
					element.propertyName,
					element.name
				)
			);
		nextNamedImports = ts.factory.updateNamedImports(
			namedImports,
			elements
		);
	}

	let nextImportClause = importClause;
	if (nextNamedImports !== null) {
		nextImportClause = ts.factory.updateImportClause(
			importClause,
			allTypeOnly && !shouldUseInlineTypes
				? ts.SyntaxKind.TypeKeyword
				: undefined,
			importClause.name,
			nextNamedImports
		);
	} else if (allTypeOnly && !isTypeOnlyClause) {
		nextImportClause = ts.factory.updateImportClause(
			importClause,
			ts.SyntaxKind.TypeKeyword,
			importClause.name,
			importClause.namedBindings
		);
	}

	const { attributes, modifiers, moduleSpecifier } = declaration;
	const originalSpecifierText = moduleSpecifier.getText(sourceFile);
	const originalSpecifier = originalSpecifierText.slice(1, -1);
	const nextModuleSpecifier = rewriteModuleSpecifier(
		sourceFile.fileName,
		originalSpecifier
	);
	if (
		nextImportClause === importClause &&
		nextModuleSpecifier === originalSpecifier
	) {
		return declaration;
	}

	return ts.factory.updateImportDeclaration(
		declaration,
		modifiers,
		nextImportClause,
		ts.factory.createStringLiteral(
			nextModuleSpecifier,
			originalSpecifierText.startsWith("'")
		),
		attributes
	);
}

function getImportGroup(moduleSpecifier: string) {
	if (moduleSpecifier === '#package-json') {
		return { groupKey: '#package-json', groupOrder: 1 };
	}
	if (moduleSpecifier.startsWith('@/')) {
		const [, owner = ''] = moduleSpecifier.split('/');
		return { groupKey: `@/${owner}`, groupOrder: 2 };
	}
	if (moduleSpecifier.startsWith('./') || moduleSpecifier.startsWith('../')) {
		return { groupKey: './', groupOrder: 3 };
	}
	return { groupKey: '', groupOrder: 0 };
}

function getImportText(
	declaration: ts.ImportDeclaration,
	sourceFile: ts.SourceFile
) {
	const printer = ts.createPrinter({
		newLine: ts.NewLineKind.LineFeed,
		removeComments: false,
	});
	return printer.printNode(ts.EmitHint.Unspecified, declaration, sourceFile);
}

function buildImportRun(
	run: IImportRun,
	sourceFile: ts.SourceFile,
	checker: ts.TypeChecker,
	valueReferencedSymbols: ReadonlySet<ts.Symbol>
) {
	const entries: IImportEntry[] = [];
	for (const statement of sourceFile.statements) {
		if (
			!ts.isImportDeclaration(statement) ||
			statement.getStart(sourceFile) < run.start ||
			statement.end > run.end ||
			isSideEffectImport(statement)
		) {
			continue;
		}
		const transformed = transformImportDeclaration(
			statement,
			sourceFile,
			checker,
			valueReferencedSymbols
		);
		if (!ts.isStringLiteral(transformed.moduleSpecifier)) {
			continue;
		}
		const { text: moduleSpecifier } = transformed.moduleSpecifier;
		entries.push({
			declaration: transformed,
			moduleSpecifier,
			...getImportGroup(moduleSpecifier),
		});
	}

	entries.sort(
		(left, right) =>
			left.groupOrder - right.groupOrder ||
			compareText(left.groupKey, right.groupKey) ||
			compareText(left.moduleSpecifier, right.moduleSpecifier)
	);

	const groups = new Map<string, string[]>();
	for (const entry of entries) {
		const identity = `${entry.groupOrder}:${entry.groupKey}`;
		const group = groups.get(identity) ?? [];
		group.push(getImportText(entry.declaration, sourceFile));
		groups.set(identity, group);
	}
	return [...groups.values()].map((group) => group.join('\n')).join('\n\n');
}

async function formatSource(filePath: string, sourceText: string) {
	const config = await resolveConfig(filePath);
	const options =
		config === null
			? { filepath: filePath }
			: { ...config, filepath: filePath };
	return format(sourceText, options);
}

async function processFile(
	filePath: string,
	program: ts.Program,
	checker: ts.TypeChecker
) {
	const originalText = await readFile(filePath, 'utf8');
	const programSourceFile = program.getSourceFile(filePath);
	const sourceFile =
		programSourceFile ??
		ts.createSourceFile(
			filePath,
			originalText,
			ts.ScriptTarget.Latest,
			true,
			getScriptKind(filePath)
		);
	const valueReferencedSymbols = collectValueReferencedSymbols(
		sourceFile,
		checker
	);
	const edits = collectImportRuns(sourceFile)
		.map((run) => ({
			...run,
			text: buildImportRun(
				run,
				sourceFile,
				checker,
				valueReferencedSymbols
			),
		}))
		.filter(({ text }) => text.length > 0);

	let fixedText = originalText;
	for (const { end, start, text } of edits.toReversed()) {
		fixedText = `${fixedText.slice(0, start)}${text}${fixedText.slice(end)}`;
	}
	if (fixedText !== originalText) {
		fixedText = await formatSource(filePath, fixedText);
	}
	return { fixedText, originalText };
}

async function main() {
	const argumentsList = process.argv.slice(2);
	const unknownOptions = argumentsList.filter(
		(argument) =>
			argument.startsWith('-') &&
			argument !== '--' &&
			argument !== '--fix'
	);
	if (unknownOptions.length > 0) {
		throw new Error(`Unknown options: ${unknownOptions.join(', ')}`);
	}
	const shouldFix = argumentsList.includes('--fix');
	const requestedPaths = argumentsList.filter(
		(argument) => argument !== '--' && argument !== '--fix'
	);
	const parsedConfig = getParsedConfig();
	const filePaths =
		requestedPaths.length === 0
			? getDefaultFiles(parsedConfig)
			: getRequestedFiles(requestedPaths);
	if (filePaths.length === 0) {
		throw new Error('No source files matched.');
	}
	const programRootNames =
		requestedPaths.length === 0 ? parsedConfig.fileNames : filePaths;
	const program =
		parsedConfig.projectReferences === undefined
			? ts.createProgram({
					options: parsedConfig.options,
					rootNames: programRootNames,
				})
			: ts.createProgram({
					options: parsedConfig.options,
					projectReferences: parsedConfig.projectReferences,
					rootNames: programRootNames,
				});
	const checker = program.getTypeChecker();
	const changedFiles: string[] = [];

	for (const filePath of filePaths) {
		const { fixedText, originalText } = await processFile(
			filePath,
			program,
			checker
		);
		if (fixedText !== originalText) {
			changedFiles.push(filePath);
			if (shouldFix) {
				await writeFile(filePath, fixedText);
			}
		}
	}

	if (shouldFix) {
		console.log(`Fixed imports in ${changedFiles.length} file(s).`);
		return;
	}
	if (changedFiles.length === 0) {
		console.log(`Checked imports in ${filePaths.length} file(s).`);
		return;
	}

	const MAX_REPORTED_FILES = 50;
	for (const filePath of changedFiles.slice(0, MAX_REPORTED_FILES)) {
		console.error(
			`${relative(PROJECT_ROOT, filePath)}: import declarations do not match the repository convention.`
		);
	}
	if (changedFiles.length > MAX_REPORTED_FILES) {
		console.error(
			`... ${changedFiles.length - MAX_REPORTED_FILES} additional file(s) omitted.`
		);
	}
	process.exitCode = 1;
}

const [, entryPath] = process.argv;
if (
	entryPath !== undefined &&
	resolve(entryPath) === fileURLToPath(import.meta.url)
) {
	await main();
}
