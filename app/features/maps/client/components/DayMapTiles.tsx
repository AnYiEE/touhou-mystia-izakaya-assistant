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
	useRef,
	useState,
} from 'react';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';

import type { IDayMapArt, TDayMapLabel } from '@/domain/data/maps/types';

import {
	type TMapAssetPriority,
	checkMapAssetsCached,
	useMapAsset,
	useMapAssetPreloader,
} from '@/features/maps/client/assets/MapAssetContext';
import { mapsMessages } from '@/features/maps/client/messages';
import {
	getDayMapPreviewUrl,
	getDayMapTileUrl,
} from '@/features/maps/client/model/assets';
import { getDayMapTileLevelForZoom } from '@/features/maps/client/model/dayMapTileLevels';
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

const PRELOAD_MARGIN_MIN_PX = 64;
const PRELOAD_MARGIN_MAX_PX = 128;
const PRELOAD_MARGIN_RATIO = 0.16;
/** Coalesces cache probes while a wheel or pinch gesture is still active. */
const CACHE_PROBE_DELAY_MS = 40;
/**
 * @description Sharper levels start loading after zooming rests this long, so
 * animations do not download every level they pass through.
 */
const ZOOM_SETTLE_DELAY_MS = 200;

function selectLevel(art: IDayMapArt, zoom: number, currentLevel?: number) {
	return getDayMapTileLevelForZoom(art.levels.length, zoom, currentLevel);
}

function getPreloadMarginPx(view: IMapView) {
	return Math.round(
		Math.min(
			PRELOAD_MARGIN_MAX_PX,
			Math.max(
				PRELOAD_MARGIN_MIN_PX,
				Math.min(view.width, view.height) * PRELOAD_MARGIN_RATIO
			)
		)
	);
}

function getVisibleTileBounds(
	art: IDayMapArt,
	level: number,
	view: IMapView,
	marginPx: number
) {
	const levelInfo = art.levels[level];
	if (levelInfo === undefined) {
		return null;
	}

	const levelScale = 2 ** level;
	const tileSize = art.tileSize * levelScale;
	const margin = marginPx / view.zoom;
	const contentLeft = -view.x / view.zoom;
	const contentTop = -view.y / view.zoom;
	const contentRight = (view.width - view.x) / view.zoom;
	const contentBottom = (view.height - view.y) / view.zoom;
	const firstColumn = Math.max(
		0,
		Math.floor((contentLeft - margin) / tileSize)
	);
	const lastColumn = Math.min(
		levelInfo.columns - 1,
		Math.floor((contentRight + margin) / tileSize)
	);
	const firstRow = Math.max(0, Math.floor((contentTop - margin) / tileSize));
	const lastRow = Math.min(
		levelInfo.rows - 1,
		Math.floor((contentBottom + margin) / tileSize)
	);
	return { firstColumn, firstRow, lastColumn, lastRow, levelInfo, tileSize };
}

function getVisibleTileUrls(
	art: IDayMapArt,
	map: TDayMapLabel,
	level: number,
	view: IMapView,
	marginPx = 0
) {
	const bounds = getVisibleTileBounds(art, level, view, marginPx);
	if (bounds === null) {
		return [];
	}
	const { firstColumn, firstRow, lastColumn, lastRow, levelInfo } = bounds;
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
			className="image-rendering-pixelated pointer-events-none absolute left-0 top-0 block bg-cover bg-center bg-no-repeat"
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
	const latestViewRef = useRef(view);
	latestViewRef.current = view;
	const [displayedLevel, setDisplayedLevel] = useState(() =>
		limitDayMapTileLevel(selectLevel(art, view.zoom), maxTileLevel)
	);
	const targetLevel = limitDayMapTileLevel(
		selectLevel(art, view.zoom, displayedLevel),
		maxTileLevel
	);
	const [settledZoom, setSettledZoom] = useState(view.zoom);
	const isZoomSettled = settledZoom === view.zoom;

	useEffect(() => {
		if (isZoomSettled) {
			return;
		}
		const controller = new AbortController();
		const settleTimer = setTimeout(() => {
			setSettledZoom(view.zoom);
		}, ZOOM_SETTLE_DELAY_MS);
		let cacheProbeTimer: ReturnType<typeof setTimeout> | undefined;
		if (targetLevel < displayedLevel) {
			cacheProbeTimer = setTimeout(() => {
				const currentView = latestViewRef.current;
				const urls = getVisibleTileUrls(
					art,
					map,
					targetLevel,
					currentView
				);
				void checkMapAssetsCached(urls, controller.signal).then(
					(allCached) => {
						if (!allCached || controller.signal.aborted) {
							return;
						}
						clearTimeout(settleTimer);
						setSettledZoom(currentView.zoom);
					}
				);
			}, CACHE_PROBE_DELAY_MS);
		}
		return () => {
			controller.abort();
			clearTimeout(settleTimer);
			if (cacheProbeTimer !== undefined) {
				clearTimeout(cacheProbeTimer);
			}
		};
	}, [art, displayedLevel, isZoomSettled, map, targetLevel, view.zoom]);

	useEffect(() => {
		if (targetLevel === displayedLevel) {
			return;
		}
		if (targetLevel < displayedLevel && !isZoomSettled) {
			return;
		}

		const controller = new AbortController();
		const switchLevel = () => {
			const currentView = latestViewRef.current;
			const visibleUrls = getVisibleTileUrls(
				art,
				map,
				targetLevel,
				currentView
			);
			const preloadUrls = getVisibleTileUrls(
				art,
				map,
				targetLevel,
				currentView,
				getPreloadMarginPx(currentView)
			);
			const visibleUrlSet = new Set(visibleUrls);
			const deferredUrls = preloadUrls.filter(
				(url) => !visibleUrlSet.has(url)
			);
			void preloadAssets(visibleUrls, controller.signal, 'critical').then(
				() => {
					if (controller.signal.aborted) {
						return;
					}
					void preloadAssets(deferredUrls, undefined, 'high');
					setDisplayedLevel(targetLevel);
				}
			);
		};

		switchLevel();

		return () => {
			controller.abort();
		};
	}, [art, displayedLevel, isZoomSettled, map, preloadAssets, targetLevel]);

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

	const tileScreenSize = art.tileSize * levelScale;
	const visibleTileBounds = getVisibleTileBounds(
		art,
		displayedLevel,
		view,
		getPreloadMarginPx(view)
	);
	const firstColumn = visibleTileBounds?.firstColumn ?? 0;
	const lastColumn = visibleTileBounds?.lastColumn ?? -1;
	const firstRow = visibleTileBounds?.firstRow ?? 0;
	const lastRow = visibleTileBounds?.lastRow ?? -1;

	// Tile geometry stays in level coordinates; the root transform applies zoom.
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
					) * levelScale;
				const height =
					Math.min(
						art.tileSize,
						levelInfo.height - row * art.tileSize
					) * levelScale;
				const left = column * tileScreenSize;
				const top = row * tileScreenSize;
				tiles.push(
					<MapTile
						key={`${displayedLevel}:${key}`}
						height={Math.ceil(height) + 1}
						left={left}
						priority="critical"
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
	]);

	if (levelInfo === undefined) {
		return null;
	}

	return (
		<div
			className="pointer-events-none absolute left-0 top-0"
			style={{ height: art.height, width: art.width }}
		>
			<DayMapPreview map={map} />
			{tiles}
		</div>
	);
});
