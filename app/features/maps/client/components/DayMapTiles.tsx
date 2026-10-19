'use client';

import { type ReactNode, memo, useEffect, useMemo, useState } from 'react';

import type { IDayMapArt, TDayMapLabel } from '@/domain/data/maps/types';

import {
	getDayMapPreviewUrl,
	getDayMapTileUrl,
} from '@/features/maps/client/model/assets';

import { type IMapView } from './MapViewport';

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

function getVisibleTileUrls(
	art: IDayMapArt,
	map: TDayMapLabel,
	level: number,
	view: IMapView
) {
	const levelInfo = art.levels[level];
	if (levelInfo === undefined) {
		return [];
	}

	const tileScreenSize = art.tileSize * 2 ** level * view.zoom;
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
	const tileSet = new Set(
		levelInfo.tiles.map(([column, row]) => `${column}_${row}`)
	);
	const urls: string[] = [];
	for (let row = firstRow; row <= lastRow; row++) {
		for (let column = firstColumn; column <= lastColumn; column++) {
			if (tileSet.has(`${column}_${row}`)) {
				urls.push(getDayMapTileUrl(map, level, column, row));
			}
		}
	}
	return urls;
}

function preloadImage(url: string) {
	return new Promise<void>((resolve) => {
		const image = new Image();
		image.decoding = 'async';
		image.addEventListener(
			'load',
			() => {
				if (typeof image.decode === 'function') {
					void image.decode().then(
						() => {
							resolve();
						},
						() => {
							resolve();
						}
					);
				} else {
					resolve();
				}
			},
			{ once: true }
		);
		image.addEventListener(
			'error',
			() => {
				resolve();
			},
			{ once: true }
		);
		image.src = url;
	});
}

export default memo<IProps>(function DayMapTiles({ art, map, view }) {
	const targetLevel = selectLevel(art, view.zoom);
	const [displayedLevel, setDisplayedLevel] = useState(targetLevel);

	useEffect(() => {
		if (targetLevel === displayedLevel) {
			return;
		}

		let isCancelled = false;
		let timer: ReturnType<typeof setTimeout> | undefined;
		const switchLevel = () => {
			const urls = getVisibleTileUrls(art, map, targetLevel, view);
			void Promise.all(urls.map(preloadImage)).then(() => {
				if (!isCancelled) {
					setDisplayedLevel(targetLevel);
				}
			});
		};

		if (targetLevel < displayedLevel) {
			// Readying a sharper level only after the zoom settles avoids fetching
			// every intermediate level during a continuous gesture.
			timer = setTimeout(switchLevel, SHARPER_LEVEL_DELAY_MS);
		} else {
			switchLevel();
		}

		return () => {
			isCancelled = true;
			if (timer !== undefined) {
				clearTimeout(timer);
			}
		};
	}, [art, displayedLevel, map, targetLevel, view]);

	const levelInfo = art.levels[displayedLevel];
	const levelScale = 2 ** displayedLevel;

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

	const tileScreenSize = art.tileSize * levelScale * view.zoom;
	const firstColumn = Math.max(
		0,
		Math.floor((-view.x - PRELOAD_MARGIN_PX) / tileScreenSize)
	);
	const lastColumn =
		levelInfo === undefined
			? -1
			: Math.min(
					levelInfo.columns - 1,
					Math.floor(
						(view.width - view.x + PRELOAD_MARGIN_PX) /
							tileScreenSize
					)
				);
	const firstRow = Math.max(
		0,
		Math.floor((-view.y - PRELOAD_MARGIN_PX) / tileScreenSize)
	);
	const lastRow =
		levelInfo === undefined
			? -1
			: Math.min(
					levelInfo.rows - 1,
					Math.floor(
						(view.height - view.y + PRELOAD_MARGIN_PX) /
							tileScreenSize
					)
				);

	// Panning within the same tile bounds only moves the parent container.
	const tiles = useMemo(() => {
		const tiles: ReactNode[] = [];
		if (levelInfo === undefined) {
			return tiles;
		}
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
					Math.min(
						art.tileSize,
						levelInfo.height - row * art.tileSize
					) *
					levelScale *
					view.zoom;
				tiles.push(
					<span
						key={`${displayedLevel}:${key}`}
						className="image-rendering-pixelated absolute bg-[length:100%_100%] bg-no-repeat"
						style={{
							backgroundImage: `url('${getDayMapTileUrl(map, displayedLevel, column, row)}')`,
							height: Math.ceil(height) + 1,
							left: Math.floor(column * tileScreenSize),
							top: Math.floor(row * tileScreenSize),
							width: Math.ceil(width) + 1,
						}}
					/>
				);
			}
		}
		return tiles;
	}, [
		art.tileSize,
		firstColumn,
		firstRow,
		lastColumn,
		lastRow,
		displayedLevel,
		levelInfo,
		levelScale,
		map,
		tileScreenSize,
		tileSet,
		view.zoom,
	]);

	if (levelInfo === undefined) {
		return null;
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
