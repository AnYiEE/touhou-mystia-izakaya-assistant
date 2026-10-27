import { createHash } from 'node:crypto';
import {
	mkdir,
	readFile,
	readdir,
	rename,
	rm,
	writeFile,
} from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

import { WORLD_MAP_FACTS } from '../../../app/domain/data/maps/worldMapFacts';

const ASSET_HASH_LENGTH = 12;
const PNG_COMPRESSION_LEVEL = 9;
const WORLD_PREVIEW_SCALE = 0.5;

const projectPath = resolve(import.meta.dirname, '../../..');
const mapAssetsPath = resolve(projectPath, 'app/assets/maps');
const sourcePath = resolve(
	mapAssetsPath,
	'world',
	WORLD_MAP_FACTS.hash,
	`${WORLD_MAP_FACTS.image}.webp`
);
const previewRootPath = resolve(mapAssetsPath, 'previews/world');
const factsPath = resolve(
	projectPath,
	'app/domain/data/maps/worldMapPreviewFacts.ts'
);

function formatFacts({
	hash,
	height,
	image,
	width,
}: {
	hash: string;
	height: number;
	image: string;
	width: number;
}) {
	return `import type { IWorldMapPreviewFacts } from './types';

/**
 * @description Generated from the published world map by
 * \`scripts/assets/maps/generatePreviewAssets.ts\`. Do not edit by hand.
 */
export const WORLD_MAP_PREVIEW_FACTS: IWorldMapPreviewFacts = {
\thash: '${hash}',
\theight: ${height},
\timage: '${image}',
\twidth: ${width},
};
`;
}

async function writeIfChanged(path: string, content: string) {
	const current = await readFile(path, 'utf8').catch(() => null);
	if (current !== content) {
		await writeFile(path, content, 'utf8');
	}
}

async function cleanupStalePreviews(currentHash: string) {
	const entries = await readdir(previewRootPath, { withFileTypes: true });
	await Promise.all(
		entries
			.filter(
				(entry) => entry.isDirectory() && entry.name !== currentHash
			)
			.map((entry) =>
				rm(resolve(previewRootPath, entry.name), {
					force: true,
					recursive: true,
				})
			)
	);
}

async function main() {
	const sourceBuffer = await readFile(sourcePath);
	const metadata = await sharp(sourceBuffer).metadata();

	const width = Math.max(1, Math.round(metadata.width * WORLD_PREVIEW_SCALE));
	const height = Math.max(
		1,
		Math.round(metadata.height * WORLD_PREVIEW_SCALE)
	);
	const resized = sharp(sourceBuffer).resize({
		height,
		kernel: 'lanczos3',
		width,
	});
	const webpBuffer = await resized.clone().webp({ quality: 78 }).toBuffer();
	const pngBuffer = await resized
		.clone()
		.png({ compressionLevel: PNG_COMPRESSION_LEVEL })
		.toBuffer();
	const hash = createHash('sha256')
		.update(webpBuffer)
		.digest('hex')
		.slice(0, ASSET_HASH_LENGTH);
	const outputPath = resolve(previewRootPath, hash);
	const temporaryPath = `${outputPath}.tmp-${process.pid}`;

	await mkdir(dirname(outputPath), { recursive: true });
	await rm(temporaryPath, { force: true, recursive: true });
	try {
		await mkdir(temporaryPath);
		await Promise.all([
			writeFile(
				resolve(temporaryPath, `${WORLD_MAP_FACTS.image}.webp`),
				webpBuffer
			),
			writeFile(
				resolve(temporaryPath, `${WORLD_MAP_FACTS.image}.png`),
				pngBuffer
			),
		]);
		await rm(outputPath, { force: true, recursive: true });
		await rename(temporaryPath, outputPath);
	} finally {
		await rm(temporaryPath, { force: true, recursive: true });
	}

	await writeIfChanged(
		factsPath,
		formatFacts({ hash, height, image: WORLD_MAP_FACTS.image, width })
	);
	await cleanupStalePreviews(hash);

	console.log(
		`World map preview generated: previews/world/${hash}/${WORLD_MAP_FACTS.image}.webp`
	);
}

await main();
