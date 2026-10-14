'use client';

import { memo, useMemo } from 'react';

import { cn } from '@heroui/theme';

import type { IDayMapArt, TDayMapLabel } from '@/domain/data/maps/types';

import { getDayMapAssetUrl } from '@/features/maps/client/model/assets';

import type { IMapView } from './MapViewport';

interface IProps {
	art: IDayMapArt;
	map: TDayMapLabel;
	view: IMapView;
}

/** @description Extra tiles kept around the viewport to hide loading while panning. */
const TILE_MARGIN = 1;

function selectLevel(art: IDayMapArt, zoom: number) {
	// Use the smallest level whose pixels are still at least as dense as the screen.
	const level = Math.floor(Math.log2(1 / zoom));

	return Math.min(Math.max(level, 0), art.levels.length - 1);
}

export default memo<IProps>(function DayMapTiles({ art, map, view }) {
	const level = selectLevel(art, view.zoom);
	const levelInfo = art.levels[level];
	const levelScale = 2 ** level;

	const tileSet = useMemo(
		() =>
			levelInfo === undefined
				? new Set<string>()
				: new Set(
						levelInfo.tiles.map(
							([column, row]) => `${column}_${row}`
						)
					),
		[levelInfo]
	);

	if (levelInfo === undefined) {
		return null;
	}

	const tileScreenSize = art.tileSize * levelScale * view.zoom;
	const firstColumn = Math.max(
		0,
		Math.floor(-view.x / tileScreenSize) - TILE_MARGIN
	);
	const lastColumn = Math.min(
		levelInfo.columns - 1,
		Math.floor((view.width - view.x) / tileScreenSize) + TILE_MARGIN
	);
	const firstRow = Math.max(
		0,
		Math.floor(-view.y / tileScreenSize) - TILE_MARGIN
	);
	const lastRow = Math.min(
		levelInfo.rows - 1,
		Math.floor((view.height - view.y) / tileScreenSize) + TILE_MARGIN
	);
	const isPixelated = view.zoom * levelScale > 1;

	const tiles = [];
	for (let row = firstRow; row <= lastRow; row++) {
		for (let column = firstColumn; column <= lastColumn; column++) {
			const key = `${column}_${row}`;
			if (!tileSet.has(key)) {
				continue;
			}
			const width =
				Math.min(
					art.tileSize,
					levelInfo.width - column * art.tileSize
				) *
				levelScale *
				view.zoom;
			const height =
				Math.min(art.tileSize, levelInfo.height - row * art.tileSize) *
				levelScale *
				view.zoom;
			tiles.push(
				<span
					key={`${level}:${key}`}
					className={cn(
						'absolute bg-[length:100%_100%] bg-no-repeat',
						{ 'image-rendering-pixelated': isPixelated }
					)}
					style={{
						backgroundImage: `url('${getDayMapAssetUrl(map, `${level}/${key}.webp`)}')`,
						height: Math.ceil(height) + 1,
						left: Math.floor(column * tileScreenSize),
						top: Math.floor(row * tileScreenSize),
						width: Math.ceil(width) + 1,
					}}
				/>
			);
		}
	}

	return (
		<div aria-hidden className="pointer-events-none absolute left-0 top-0">
			<span
				className="absolute left-0 top-0 bg-[length:100%_100%] bg-no-repeat blur-[1px]"
				style={{
					backgroundImage: `url('${getDayMapAssetUrl(map, 'preview.webp')}')`,
					height: art.height * view.zoom,
					width: art.width * view.zoom,
				}}
			/>
			{tiles}
		</div>
	);
});
