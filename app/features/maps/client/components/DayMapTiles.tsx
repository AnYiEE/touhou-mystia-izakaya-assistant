'use client';

import { memo, useEffect, useMemo, useState } from 'react';

import type { IDayMapArt, TDayMapLabel } from '@/domain/data/maps/types';

import {
	getDayMapPreviewUrl,
	getDayMapTileUrl,
} from '@/features/maps/client/model/assets';

import type { IMapView } from './MapViewport';

interface IProps {
	art: IDayMapArt;
	map: TDayMapLabel;
	view: IMapView;
}

/** @description Screen pixels kept loaded around the viewport to hide loading while panning. */
const PRELOAD_MARGIN_PX = 128;
/**
 * @description A sharper level is only fetched once the zoom has rested this
 * long, so zoom animations do not download every level they pass through.
 */
const SHARPER_LEVEL_DELAY_MS = 200;

function selectLevel(art: IDayMapArt, zoom: number) {
	// Use the smallest level whose pixels are still at least as dense as the screen.
	const level = Math.floor(Math.log2(1 / zoom));

	return Math.min(Math.max(level, 0), art.levels.length - 1);
}

export default memo<IProps>(function DayMapTiles({ art, map, view }) {
	const targetLevel = selectLevel(art, view.zoom);
	const [settledLevel, setSettledLevel] = useState(targetLevel);
	// Coarser levels apply at once: they are cheap and cover more ground.
	const level = Math.max(targetLevel, settledLevel);

	useEffect(() => {
		if (targetLevel >= settledLevel) {
			if (targetLevel > settledLevel) {
				setSettledLevel(targetLevel);
			}
			return;
		}
		// Restarted by every zoom change, so it fires once the zoom has rested.
		const timer = setTimeout(() => {
			setSettledLevel(targetLevel);
		}, SHARPER_LEVEL_DELAY_MS);

		return () => {
			clearTimeout(timer);
		};
	}, [settledLevel, targetLevel, view.zoom]);

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
		Math.floor((-view.x - PRELOAD_MARGIN_PX) / tileScreenSize)
	);
	const lastColumn = Math.min(
		levelInfo.columns - 1,
		Math.floor((view.width - view.x + PRELOAD_MARGIN_PX) / tileScreenSize)
	);
	const firstRow = Math.max(
		0,
		Math.floor((-view.y - PRELOAD_MARGIN_PX) / tileScreenSize)
	);
	const lastRow = Math.min(
		levelInfo.rows - 1,
		Math.floor((view.height - view.y + PRELOAD_MARGIN_PX) / tileScreenSize)
	);

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
					className="image-rendering-pixelated absolute bg-[length:100%_100%] bg-no-repeat"
					style={{
						backgroundImage: `url('${getDayMapTileUrl(map, level, column, row)}')`,
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
				className="image-rendering-pixelated absolute left-0 top-0 bg-[length:100%_100%] bg-no-repeat blur-[1px]"
				style={{
					backgroundImage: `url('${getDayMapPreviewUrl(map)}')`,
					height: art.height * view.zoom,
					width: art.width * view.zoom,
				}}
			/>
			{tiles}
		</div>
	);
});
