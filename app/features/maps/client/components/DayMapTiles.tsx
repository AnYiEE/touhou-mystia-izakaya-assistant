'use client';

import { faRotate } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import {
	type MouseEvent,
	type ReactNode,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';

import type { IDayMapArt, TDayMapLabel } from '@/domain/data/maps/types';

import {
	type TMapAssetPriority,
	useMapAsset,
	useMapAssetPreloader,
} from '@/features/maps/client/assets/MapAssetContext';
import { mapsMessages } from '@/features/maps/client/messages';
import {
	getDayMapPreviewUrl,
	getDayMapTileUrl,
} from '@/features/maps/client/model/assets';
import { limitDayMapTileLevel } from '@/features/maps/client/model/mapAccessPolicy';

import { useI18n } from '@/shared/i18n/useI18n';

import { type IMapView } from './MapViewport';

interface IProps {
	art: IDayMapArt;
	map: TDayMapLabel;
	maxTileLevel: number | null;
	view: IMapView;
}

interface IMapTileProps {
	height: number;
	left: number;
	priority: TMapAssetPriority;
	top: number;
	url: string;
	width: number;
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

const MapAssetRetryButton = memo<{ className?: string; onRetry: () => void }>(
	function MapAssetRetryButton({ className, onRetry }) {
		const { t } = useI18n(mapsMessages);
		const handleClick = useCallback(
			(event: MouseEvent<HTMLButtonElement>) => {
				event.preventDefault();
				event.stopPropagation();
				onRetry();
			},
			[onRetry]
		);

		return (
			<button
				aria-label={t('maps.asset.retry')}
				title={t('maps.asset.error')}
				type="button"
				onClick={handleClick}
				className={cn(
					'pointer-events-auto absolute left-1/2 top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/75 text-white shadow-md',
					CLASSNAME_FOCUS_VISIBLE_OUTLINE,
					className
				)}
			>
				<FontAwesomeIcon icon={faRotate} />
			</button>
		);
	}
);

const MapTile = memo<IMapTileProps>(function MapTile({
	height,
	left,
	priority,
	top,
	url,
	width,
}) {
	const asset = useMapAsset(url, { priority });

	return (
		<span
			className="image-rendering-pixelated absolute block bg-no-repeat"
			style={{
				backgroundImage:
					asset.objectUrl === null
						? undefined
						: `url('${asset.objectUrl}')`,
				backgroundSize: '100% 100%',
				height,
				left,
				top,
				width,
			}}
		>
			{asset.status === 'error' && (
				<MapAssetRetryButton onRetry={asset.retry} />
			)}
		</span>
	);
});

const DayMapPreview = memo<{ map: TDayMapLabel }>(function DayMapPreview({
	map,
}) {
	const asset = useMapAsset(getDayMapPreviewUrl(map), {
		priority: 'critical',
	});

	return (
		<span
			aria-hidden
			className="image-rendering-pixelated pointer-events-none absolute left-0 top-0 block bg-cover bg-center bg-no-repeat blur-[1px]"
			style={{
				backgroundImage:
					asset.objectUrl === null
						? undefined
						: `url('${asset.objectUrl}')`,
				inset: 0,
			}}
		/>
	);
});

export default memo<IProps>(function DayMapTiles({
	art,
	map,
	maxTileLevel,
	view,
}) {
	const preloadAssets = useMapAssetPreloader();
	const targetLevel = limitDayMapTileLevel(
		selectLevel(art, view.zoom),
		maxTileLevel
	);
	const [displayedLevel, setDisplayedLevel] = useState(targetLevel);

	useEffect(() => {
		if (targetLevel === displayedLevel) {
			return;
		}

		let timer: ReturnType<typeof setTimeout> | undefined;
		const controller = new AbortController();
		const switchLevel = () => {
			const urls = getVisibleTileUrls(art, map, targetLevel, view);
			void preloadAssets(urls, controller.signal, 'high').then(() => {
				if (!controller.signal.aborted) {
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
			controller.abort();
			if (timer !== undefined) {
				clearTimeout(timer);
			}
		};
	}, [art, displayedLevel, map, preloadAssets, targetLevel, view]);

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
				const left = Math.floor(column * tileScreenSize);
				const top = Math.floor(row * tileScreenSize);
				tiles.push(
					<MapTile
						key={`${displayedLevel}:${key}`}
						height={Math.ceil(height) + 1}
						left={left}
						priority={
							left < view.width &&
							left + Math.ceil(width) + 1 > 0 &&
							top < view.height &&
							top + Math.ceil(height) + 1 > 0
								? 'critical'
								: 'high'
						}
						top={top}
						url={getDayMapTileUrl(map, displayedLevel, column, row)}
						width={Math.ceil(width) + 1}
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
		view.height,
		view.width,
		view.zoom,
	]);

	if (levelInfo === undefined) {
		return null;
	}

	return (
		<div
			className="pointer-events-none absolute left-0 top-0"
			style={{
				height: art.height * view.zoom,
				width: art.width * view.zoom,
			}}
		>
			<DayMapPreview map={map} />
			{tiles}
		</div>
	);
});
