import { relative, resolve } from 'node:path';

import {
	DAY_MAP_CHARACTERS,
	DAY_MAP_CHARACTER_SPRITE_HASHES,
} from '@/domain/data/maps/dayMapCharacters';
import { DAY_MAP_LAYOUTS } from '@/domain/data/maps/dayMapLayouts';
import {
	DAY_MAP_FACILITY_SPRITES,
	DAY_MAP_FISHING_SPRITES,
	DAY_MAP_INTERACTION_SPRITES,
	DAY_MAP_PRAYER_SPRITES,
	DAY_MAP_TASK_SPRITES,
	DAY_MAP_TELEPORT_SPRITES,
} from '@/domain/data/maps/dayMapOverlaySprites';
import type {
	IDayMapOverlaySprite,
	TDayMapLabel,
} from '@/domain/data/maps/types';
import { WORLD_MAP_FACTS } from '@/domain/data/maps/worldMapFacts';
import { WORLD_MAP_PREVIEW_FACTS } from '@/domain/data/maps/worldMapPreviewFacts';

export interface IMapAssetAccess {
	isPreview: boolean;
	relativePath: string;
}

const MAP_ASSET_ACCESS = new Map<string, boolean>();

function addAsset(path: string, isPreview: boolean) {
	if (MAP_ASSET_ACCESS.has(path)) {
		throw new Error(`duplicate-map-asset-path:${path}`);
	}
	MAP_ASSET_ACCESS.set(path, isPreview);
}

function addImageVariants(pathWithoutExtension: string, isPreview: boolean) {
	addAsset(`${pathWithoutExtension}.png`, isPreview);
	addAsset(`${pathWithoutExtension}.webp`, isPreview);
}

function addSprite(path: string, sprite: IDayMapOverlaySprite | undefined) {
	if (sprite !== undefined) {
		addAsset(`${path}/${sprite.hash}/${sprite.file}`, true);
	}
}

for (const [map, layout] of Object.entries(DAY_MAP_LAYOUTS) as Array<
	[TDayMapLabel, (typeof DAY_MAP_LAYOUTS)[TDayMapLabel]]
>) {
	const dayDirectory = `day/${map}/${layout.art.hash}`;
	addImageVariants(`${dayDirectory}/preview`, true);
	layout.art.levels.forEach((level, index) => {
		const isPreview = index === layout.art.levels.length - 1;
		for (const [column, row] of level.tiles) {
			addImageVariants(
				`${dayDirectory}/${index}/${column}_${row}`,
				isPreview
			);
		}
	});
}

for (const character of DAY_MAP_CHARACTERS) {
	const { sprite } = character;
	if (sprite !== null) {
		addAsset(
			`characters/${sprite.source}/${DAY_MAP_CHARACTER_SPRITE_HASHES[sprite.source]}/${sprite.file}`,
			true
		);
	}
}

for (const [kind, spritesByMap] of Object.entries(
	DAY_MAP_INTERACTION_SPRITES
)) {
	for (const [map, sprite] of Object.entries(spritesByMap) as Array<
		[string, IDayMapOverlaySprite]
	>) {
		addSprite(`interactions/${kind}-${map}`, sprite);
	}
}
for (const [map, spritesByKey] of Object.entries(DAY_MAP_TASK_SPRITES)) {
	for (const [key, sprite] of Object.entries(spritesByKey) as Array<
		[string, IDayMapOverlaySprite]
	>) {
		addSprite(`tasks/${map}-${key}`, sprite);
	}
}
for (const [map, sprites] of Object.entries(DAY_MAP_FISHING_SPRITES)) {
	sprites.forEach((sprite, index) => {
		addSprite(`fishing/${map}-${index}`, sprite);
	});
}
for (const [map, spritesByKey] of Object.entries(DAY_MAP_FACILITY_SPRITES)) {
	for (const [key, sprite] of Object.entries(spritesByKey) as Array<
		[string, IDayMapOverlaySprite]
	>) {
		addSprite(`facilities/${map}-${key}`, sprite);
	}
}
for (const [map, spritesByLabel] of Object.entries(DAY_MAP_PRAYER_SPRITES)) {
	for (const [label, sprite] of Object.entries(spritesByLabel) as Array<
		[string, IDayMapOverlaySprite]
	>) {
		addSprite(`prayers/${map}-${label}`, sprite);
	}
}
for (const [map, sprites] of Object.entries(DAY_MAP_TELEPORT_SPRITES)) {
	sprites.forEach((sprite, index) => {
		addSprite(`teleports/${map}-${index}`, sprite);
	});
}

addImageVariants(
	`world/${WORLD_MAP_FACTS.hash}/${WORLD_MAP_FACTS.image}`,
	false
);
addImageVariants(
	`previews/world/${WORLD_MAP_PREVIEW_FACTS.hash}/${WORLD_MAP_PREVIEW_FACTS.image}`,
	true
);

function checkSafePathSegment(segment: unknown): segment is string {
	return (
		typeof segment === 'string' &&
		/^[a-z0-9_.-]+$/iu.test(segment) &&
		segment !== '.' &&
		segment !== '..'
	);
}

export function resolveMapAssetAccess(
	segments: ReadonlyArray<unknown>
): IMapAssetAccess | null {
	if (segments.length === 0 || !segments.every(checkSafePathSegment)) {
		return null;
	}
	const relativePath = segments.join('/');
	const isPreview = MAP_ASSET_ACCESS.get(relativePath);

	return isPreview === undefined ? null : { isPreview, relativePath };
}

export function resolveMapAssetFilePath(
	rootDirectory: string,
	relativePath: string
) {
	const root = resolve(rootDirectory);
	const target = resolve(root, ...relativePath.split('/'));
	const targetRelativePath = relative(root, target);

	return targetRelativePath !== '' &&
		!targetRelativePath.startsWith('..') &&
		!targetRelativePath.includes('/../')
		? target
		: null;
}
