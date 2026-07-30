export interface ISqliteAcceptedCreateTableColumn {
	constraint: string;
	name: string;
	type: string;
}

export interface ISqliteAcceptedCreateTableShape {
	columns: ReadonlyArray<ISqliteAcceptedCreateTableColumn>;
	tableName: string;
}

type TSqliteDefinitionToken =
	| { kind: 'identifier'; value: string }
	| { kind: 'string'; value: string }
	| { kind: 'symbol'; value: '(' | ')' | ',' | ';' };

interface ISqliteCreateTableShape {
	columns: ISqliteAcceptedCreateTableColumn[];
	tableName: string;
}

function checkSqliteDefinitionSymbol(
	value: string
): value is '(' | ')' | ',' | ';' {
	return ['(', ')', ',', ';'].includes(value);
}

function tokenizeSqliteDefinition(value: string) {
	const tokens: TSqliteDefinitionToken[] = [];
	let index = 0;
	while (index < value.length) {
		const character = value[index];
		if (character === undefined) {
			return null;
		}
		if (/\s/u.test(character)) {
			index++;
			continue;
		}
		if (checkSqliteDefinitionSymbol(character)) {
			tokens.push({ kind: 'symbol', value: character });
			index++;
			continue;
		}
		if (character === '"' || character === "'") {
			const isIdentifier = character === '"';
			let tokenValue = '';
			let isClosed = false;
			index++;
			while (index < value.length) {
				const quotedCharacter = value[index];
				if (quotedCharacter === undefined) {
					return null;
				}
				if (quotedCharacter !== character) {
					tokenValue += quotedCharacter;
					index++;
					continue;
				}
				if (value[index + 1] === character) {
					tokenValue += character;
					index += 2;
					continue;
				}

				index++;
				isClosed = true;
				break;
			}
			if (!isClosed) {
				return null;
			}
			tokens.push(
				isIdentifier
					? { kind: 'identifier', value: tokenValue.toLowerCase() }
					: { kind: 'string', value: tokenValue }
			);
			continue;
		}
		if (/[a-z_]/iu.test(character)) {
			const startIndex = index;
			index++;
			while (
				index < value.length &&
				/[a-z0-9_]/iu.test(value[index] ?? '')
			) {
				index++;
			}
			tokens.push({
				kind: 'identifier',
				value: value.slice(startIndex, index).toLowerCase(),
			});
			continue;
		}

		return null;
	}

	return tokens;
}

function getConstraintTokenValue(token: TSqliteDefinitionToken) {
	if (token.kind === 'identifier') {
		return token.value;
	}
	if (token.kind === 'string') {
		return `'${token.value.replace(/'/gu, "''")}'`;
	}

	return null;
}

function parseSqliteCreateTableShape(
	createTableSql: string
): ISqliteCreateTableShape | null {
	const tokens = tokenizeSqliteDefinition(createTableSql);
	if (tokens === null) {
		return null;
	}

	let index = 0;
	const readIdentifier = (expected?: string) => {
		const token = tokens[index];
		if (
			token?.kind !== 'identifier' ||
			(expected !== undefined && token.value !== expected)
		) {
			return null;
		}
		index++;
		return token.value;
	};
	const readSymbol = (expected: '(' | ')' | ',' | ';') => {
		const token = tokens[index];
		if (token?.kind !== 'symbol' || token.value !== expected) {
			return false;
		}
		index++;
		return true;
	};

	if (readIdentifier('create') === null || readIdentifier('table') === null) {
		return null;
	}
	const optionalIfToken = tokens[index];
	if (
		optionalIfToken?.kind === 'identifier' &&
		optionalIfToken.value === 'if'
	) {
		index++;
		if (
			readIdentifier('not') === null ||
			readIdentifier('exists') === null
		) {
			return null;
		}
	}
	const tableName = readIdentifier();
	if (tableName === null || !readSymbol('(')) {
		return null;
	}

	const columns: ISqliteAcceptedCreateTableColumn[] = [];
	for (;;) {
		const name = readIdentifier();
		const type = readIdentifier();
		if (name === null || type === null) {
			return null;
		}

		const constraintTokens: string[] = [];
		for (;;) {
			const token = tokens[index];
			if (
				token?.kind === 'symbol' &&
				(token.value === ',' || token.value === ')')
			) {
				break;
			}
			if (token === undefined) {
				return null;
			}
			const constraintToken = getConstraintTokenValue(token);
			if (constraintToken === null) {
				return null;
			}
			constraintTokens.push(constraintToken);
			index++;
		}
		columns.push({ constraint: constraintTokens.join(' '), name, type });

		if (readSymbol(')')) {
			break;
		}
		if (!readSymbol(',')) {
			return null;
		}
	}

	if (tokens[index] !== undefined && !readSymbol(';')) {
		return null;
	}
	if (tokens[index] !== undefined) {
		return null;
	}

	return { columns, tableName };
}

function checkColumnShapeEqual(
	actual: ISqliteAcceptedCreateTableColumn,
	expected: ISqliteAcceptedCreateTableColumn
) {
	return (
		actual.constraint === expected.constraint &&
		actual.name === expected.name &&
		actual.type === expected.type
	);
}

export function checkSqliteCreateTableShapeAccepted(
	createTableSql: string,
	acceptedShapes: ReadonlyArray<ISqliteAcceptedCreateTableShape>
) {
	const actualShape = parseSqliteCreateTableShape(createTableSql);
	if (actualShape === null) {
		return false;
	}

	return acceptedShapes.some(
		(expectedShape) =>
			actualShape.tableName === expectedShape.tableName &&
			actualShape.columns.length === expectedShape.columns.length &&
			actualShape.columns.every((column, index) => {
				const expectedColumn = expectedShape.columns[index];
				return (
					expectedColumn !== undefined &&
					checkColumnShapeEqual(column, expectedColumn)
				);
			})
	);
}
