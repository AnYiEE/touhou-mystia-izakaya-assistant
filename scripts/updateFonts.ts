import { randomUUID } from 'node:crypto';
import {
	copyFile,
	mkdir,
	mkdtemp,
	rename,
	rm,
	writeFile,
} from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';

const DOWNLOAD_CONCURRENCY = 8;
const FONT_LICENSE_COMMIT = '684b69db51d59a3137ec0152fa3a3afc6f1b3814';
const GOOGLE_FONTS_CSS_HOST = 'fonts.googleapis.com';
const GOOGLE_FONTS_STATIC_HOST = 'fonts.gstatic.com';
const USER_AGENT =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
	'(KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36';
const WOFF2_SIGNATURE = 'wOF2';

const fontsPath = resolve(import.meta.dirname, '../app/assets/fonts');
const fontsParentPath = dirname(fontsPath);

const FONT_CONFIGS = [
	{
		cssUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@100..900&display=swap',
		family: 'Noto Sans',
		slug: 'noto-sans',
	},
	{
		cssUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Mono:wght@100..900&display=swap',
		family: 'Noto Sans Mono',
		slug: 'noto-sans-mono',
	},
	{
		cssUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@100..900&display=swap',
		family: 'Noto Sans SC',
		slug: 'noto-sans-sc',
	},
] as const;

const STATIC_FILES = [
	'index.css',
	'OFL-Noto-Sans-and-Mono.txt',
	'OFL-Noto-Sans-SC.txt',
] as const;

interface IFontDownloadResult {
	bytes: number;
	css: string;
	files: number;
}

function assertExpectedHost(url: string, expectedHost: string) {
	const parsedUrl = new URL(url);

	if (
		parsedUrl.protocol !== 'https:' ||
		parsedUrl.hostname !== expectedHost
	) {
		throw new Error(`拒绝非预期字体地址：${url}`);
	}
}

async function fetchChecked(url: string, expectedHost: string) {
	assertExpectedHost(url, expectedHost);

	const response = await fetch(url, {
		headers: { 'User-Agent': USER_AGENT },
	});

	if (!response.ok) {
		throw new Error(`请求失败（${response.status}）：${url}`);
	}

	assertExpectedHost(response.url, expectedHost);

	return response;
}

function getFontUrls(css: string) {
	const matches = css.matchAll(
		/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/gu
	);
	const urls = new Set<string>();

	for (const match of matches) {
		const [, url] = match;

		if (!url) {
			throw new Error('Google Fonts CSS 中存在无法解析的字体地址');
		}

		assertExpectedHost(url, GOOGLE_FONTS_STATIC_HOST);
		urls.add(url);
	}

	if (urls.size === 0) {
		throw new Error('Google Fonts CSS 中没有 WOFF2 字体地址');
	}

	return [...urls];
}

function getFontFileName(url: string) {
	const fileName = basename(new URL(url).pathname);

	if (!/^[A-Za-z0-9._-]+\.woff2$/u.test(fileName)) {
		throw new Error(`字体文件名不安全：${fileName}`);
	}

	return fileName;
}

function assertWoff2(buffer: Buffer, url: string) {
	if (
		buffer.length < WOFF2_SIGNATURE.length ||
		buffer.subarray(0, WOFF2_SIGNATURE.length).toString('ascii') !==
			WOFF2_SIGNATURE
	) {
		throw new Error(`响应不是有效的 WOFF2 字体：${url}`);
	}
}

async function downloadFontFiles(urls: string[], outputPath: string) {
	let bytes = 0;

	for (let index = 0; index < urls.length; index += DOWNLOAD_CONCURRENCY) {
		const batch = urls.slice(index, index + DOWNLOAD_CONCURRENCY);
		const batchBytes = await Promise.all(
			batch.map(async (url) => {
				const response = await fetchChecked(
					url,
					GOOGLE_FONTS_STATIC_HOST
				);
				const buffer = Buffer.from(await response.arrayBuffer());
				assertWoff2(buffer, url);
				await writeFile(join(outputPath, getFontFileName(url)), buffer);

				return buffer.length;
			})
		);

		bytes += batchBytes.reduce(
			(sum, currentBytes) => sum + currentBytes,
			0
		);
	}

	return bytes;
}

async function downloadFont(
	config: (typeof FONT_CONFIGS)[number],
	stagingPath: string
): Promise<IFontDownloadResult> {
	console.log(`正在更新 ${config.family}...`);

	const cssResponse = await fetchChecked(
		config.cssUrl,
		GOOGLE_FONTS_CSS_HOST
	);
	const sourceCss = await cssResponse.text();
	const fontUrls = getFontUrls(sourceCss);
	const outputPath = join(stagingPath, config.slug);
	await mkdir(outputPath);

	const bytes = await downloadFontFiles(fontUrls, outputPath);
	let localCss = sourceCss;

	for (const url of fontUrls) {
		localCss = localCss.replaceAll(
			url,
			`./${config.slug}/${getFontFileName(url)}`
		);
	}

	if (localCss.includes('https://')) {
		throw new Error(`${config.family} CSS 中仍存在外部地址`);
	}

	console.log(`已获取 ${config.family}：${fontUrls.length} 个分片`);

	return { bytes, css: localCss.trim(), files: fontUrls.length };
}

function getLocalDate() {
	const parts = new Intl.DateTimeFormat('en-CA', {
		day: '2-digit',
		month: '2-digit',
		timeZone: 'Asia/Shanghai',
		year: 'numeric',
	}).formatToParts(new Date());
	// eslint-disable-next-line compat/compat -- This script runs only in Node.js 24.
	const values = Object.fromEntries(
		parts.map(({ type, value }) => [type, value])
	);

	return `${values['year']}-${values['month']}-${values['day']}`;
}

function createReadme(files: number, bytes: number) {
	return `# 本地字体资源

本目录保存根布局使用的 Noto Sans、Noto Sans Mono 和 Noto Sans SC 可变字体。字体 CSS 与其引用的全部 ${files} 个 WOFF2 Unicode 分片于 ${getLocalDate()} 从 Google Fonts CSS API 获取，共 ${bytes.toLocaleString('en-US')} 字节：

- \`Noto Sans\`: \`family=Noto+Sans:wght@100..900&display=swap\`
- \`Noto Sans Mono\`: \`family=Noto+Sans+Mono:wght@100..900&display=swap\`
- \`Noto Sans SC\`: \`family=Noto+Sans+SC:wght@100..900&display=swap\`

\`google-fonts.css\` 和三个字体子目录由脚本管理。需要更新字体时，在可访问 Google Fonts 的环境中运行：

\`\`\`bash
pnpm fonts:update
\`\`\`

脚本先在临时目录下载并校验所有资源，确认 CSS 仅引用本地文件、每个文件都具有 WOFF2 文件头后，才替换当前目录。下载或校验失败时会保留原有字体。

\`index.css\` 中的度量兼容回退和 CSS 变量由人工维护，不会被脚本生成。Google Fonts 更新字形后，如果字体度量发生变化，需要另行核对其中的 \`size-adjust\`、\`ascent-override\` 和 \`descent-override\`。

字体使用 SIL Open Font License 1.1。Noto Sans 与 Noto Sans Mono 的许可证见 \`OFL-Noto-Sans-and-Mono.txt\`，Noto Sans SC 的许可证见 \`OFL-Noto-Sans-SC.txt\`。许可证文本取自 Google Fonts 仓库提交 \`${FONT_LICENSE_COMMIT}\`。
`;
}

async function copyStaticFiles(stagingPath: string) {
	await Promise.all(
		STATIC_FILES.map((fileName) =>
			copyFile(join(fontsPath, fileName), join(stagingPath, fileName))
		)
	);
}

async function replaceFonts(stagingPath: string) {
	const backupPath = join(fontsParentPath, `.fonts-backup-${randomUUID()}`);

	await rename(fontsPath, backupPath);

	try {
		await rename(stagingPath, fontsPath);
	} catch (error) {
		await rename(backupPath, fontsPath);
		throw error;
	}

	await rm(backupPath, { force: true, recursive: true });
}

async function updateFonts() {
	const stagingPath = await mkdtemp(join(fontsParentPath, '.fonts-update-'));

	try {
		await copyStaticFiles(stagingPath);

		const results: IFontDownloadResult[] = [];
		for (const config of FONT_CONFIGS) {
			results.push(await downloadFont(config, stagingPath));
		}

		const files = results.reduce((sum, result) => sum + result.files, 0);
		const bytes = results.reduce((sum, result) => sum + result.bytes, 0);
		const outputCssPath = join(stagingPath, 'google-fonts.css');
		const generatedCss = `/* 此文件由 pnpm fonts:update 生成，请勿手动编辑。 */\n\n${results
			.map((result) => result.css)
			.join('\n\n')}\n`;

		await writeFile(outputCssPath, generatedCss, 'utf8');
		await writeFile(
			join(stagingPath, 'README.md'),
			createReadme(files, bytes),
			'utf8'
		);

		const localReferences = generatedCss.match(/\.woff2/gu)?.length ?? 0;
		if (localReferences !== files) {
			throw new Error(
				`CSS 引用数（${localReferences}）与字体文件数（${files}）不一致`
			);
		}

		await replaceFonts(stagingPath);
		console.log(`字体更新完成：${files} 个分片，共 ${bytes} 字节`);
	} finally {
		await rm(stagingPath, { force: true, recursive: true });
	}
}

try {
	await updateFonts();
} catch (error) {
	console.error(
		'字体更新失败：',
		error instanceof Error ? error.message : error
	);
	process.exitCode = 1;
}
