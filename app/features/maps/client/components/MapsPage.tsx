'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { faChevronRight, faEarthAsia } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { motion } from 'framer-motion';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import FadeMotionDiv from '@/design/ui/components/fadeMotionDiv';
import Loading from '@/design/ui/components/loading';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import { DAY_MAP_LAYOUTS } from '@/domain/data/maps/dayMapLayouts';
import type { TDayMapLabel, TDayMapPoint } from '@/domain/data/maps/types';
import { WORLD_MAP_FACTS } from '@/domain/data/maps/worldMapFacts';

import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import { useCatalogLocalizationReady } from '@/features/catalog/shared/client/localization/useCatalogLocalizationReady';
import { mapsMessages } from '@/features/maps/client/messages';
import {
	DEFAULT_HIDDEN_DAY_MAP_LAYERS,
	type TDayMapLayer,
	buildDayMapEntities,
	toContentPoint,
} from '@/features/maps/client/model/dayMapEntities';
import {
	checkDayMapLabel,
	getDayMapLabel,
} from '@/features/maps/client/model/dayMapLabels';
import {
	MAP_FADE_ANIMATE,
	MAP_FADE_HIDDEN,
	getMapTransition,
} from '@/features/maps/client/model/motion';
import {
	filterVisibleDayMapEntities,
	useDayMapVisibility,
} from '@/features/maps/client/model/useDayMapVisibility';
import { MAPS_PAGE_PATH } from '@/features/maps/links';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { useI18n } from '@/shared/i18n/useI18n';
import { useHydrated } from '@/shared/react/useHydrated';

import DayMapMarkers from './DayMapMarkers';
import DayMapTiles from './DayMapTiles';
import MapDetailCard from './MapDetailCard';
import MapSidebar from './MapSidebar';
import MapViewport, {
	type IMapFocusRequest,
	type IMapView,
} from './MapViewport';
import WorldMapLayer from './WorldMapLayer';

/** @description Screen pixels per world unit used when focusing a marker. */
const FOCUS_PX_PER_UNIT = 30;
/** @description Highest zoom: two screen pixels per level-0 art pixel. */
const DAY_MAP_MAX_ZOOM = 2;
const WORLD_MAP_MAX_ZOOM = 2;
/** @description Keeps world-map labels legible on phones; wider screens fit as usual. */
const WORLD_MAP_MIN_FIT_ZOOM = 0.45;
const ARRIVAL_HIGHLIGHT_MS = 4000;
const POPOVER_DISMISS_WINDOW_MS = 100;

export default function MapsPage() {
	const { t } = useI18n(mapsMessages);
	const isHydrated = useHydrated();
	const isReducedMotion = useReducedMotion();
	const isLocalizationReady = useCatalogLocalizationReady();
	const vibrate = useVibrate();
	const { pathname, replaceState } = usePathname();
	const visibility = useDayMapVisibility();
	const { isMapVisible } = visibility;

	const [, , routeMapSegment] = pathname.split('/');
	const [map, setMap] = useState<TDayMapLabel | null>(() =>
		routeMapSegment !== undefined && checkDayMapLabel(routeMapSegment)
			? routeMapSegment
			: null
	);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [hiddenLayers, setHiddenLayers] = useState<ReadonlySet<TDayMapLayer>>(
		DEFAULT_HIDDEN_DAY_MAP_LAYERS
	);
	const [query, setQuery] = useState('');
	const [focusRequest, setFocusRequest] = useState<IMapFocusRequest | null>(
		null
	);
	const [arrival, setArrival] = useState<TDayMapPoint | null>(null);
	const focusKeyRef = useRef(0);
	const isPopoverOpenRef = useRef(false);
	const popoverClosedAtRef = useRef(Number.NEGATIVE_INFINITY);
	const viewportSectionRef = useRef<HTMLDivElement>(null);

	const layout = map === null ? null : DAY_MAP_LAYOUTS[map];
	const entities = useMemo(
		() =>
			map === null
				? []
				: filterVisibleDayMapEntities(
						buildDayMapEntities(map),
						visibility
					),
		[map, visibility]
	);
	const selectedEntity = useMemo(
		() => entities.find(({ id }) => id === selectedId) ?? null,
		[entities, selectedId]
	);

	useEffect(() => {
		replaceState(MAPS_PAGE_PATH, map ?? '');
	}, [map, replaceState]);

	// A map from a dataset the player turned off falls back to the world map.
	useEffect(() => {
		if (map !== null && !isMapVisible(map)) {
			setMap(null);
			setSelectedId(null);
		}
	}, [isMapVisible, map]);

	useEffect(() => {
		if (arrival === null) {
			return;
		}
		const timer = setTimeout(() => {
			setArrival(null);
		}, ARRIVAL_HIGHLIGHT_MS);

		return () => {
			clearTimeout(timer);
		};
	}, [arrival]);

	const requestFocus = useCallback(
		(targetMap: TDayMapLabel, point: TDayMapPoint) => {
			const { art } = DAY_MAP_LAYOUTS[targetMap];
			const [x, y] = toContentPoint(art, point);
			focusKeyRef.current += 1;
			setFocusRequest({
				key: focusKeyRef.current,
				minZoom: FOCUS_PX_PER_UNIT / art.pixelsPerUnit,
				x,
				y,
			});
		},
		[]
	);

	const enterMap = useCallback(
		(nextMap: TDayMapLabel) => {
			vibrate();
			setMap(nextMap);
			setSelectedId(null);
			setQuery('');
			setArrival(null);
			setFocusRequest(null);
		},
		[vibrate]
	);

	const openWorldMap = useCallback(() => {
		vibrate();
		setSelectedId(null);
		setArrival(null);
		setFocusRequest(null);
		setMap(null);
	}, [vibrate]);

	const handleGoTo = useCallback(
		(targetMap: TDayMapLabel, point: TDayMapPoint | null) => {
			vibrate();
			setMap(targetMap);
			setSelectedId(null);
			setQuery('');
			setArrival(point);
			if (point !== null) {
				requestFocus(targetMap, point);
			}
		},
		[requestFocus, vibrate]
	);

	const handleSelect = useCallback(
		(id: string) => {
			vibrate();
			setSelectedId(id);
		},
		[vibrate]
	);

	const handleListSelect = useCallback(
		(id: string) => {
			const entity = entities.find((item) => item.id === id);
			if (entity === undefined || map === null) {
				return;
			}
			vibrate();
			setSelectedId(id);
			requestFocus(map, entity.position);
			// On narrow screens the list sits below the map; bring the map back.
			const section = viewportSectionRef.current;
			if (section !== null && section.getBoundingClientRect().top < 0) {
				section.scrollIntoView({
					behavior: isReducedMotion ? 'auto' : 'smooth',
					block: 'start',
				});
			}
		},
		[entities, isReducedMotion, map, requestFocus, vibrate]
	);

	const handleFocusPoint = useCallback(
		(point: TDayMapPoint) => {
			if (map !== null) {
				requestFocus(map, point);
			}
		},
		[map, requestFocus]
	);

	const handleShowCharacter = useCallback(
		(targetMap: TDayMapLabel, entityId: string, point: TDayMapPoint) => {
			vibrate();
			setMap(targetMap);
			setQuery('');
			setArrival(null);
			setSelectedId(entityId);
			requestFocus(targetMap, point);
		},
		[requestFocus, vibrate]
	);

	const handleCloseDetail = useCallback(() => {
		setSelectedId(null);
	}, []);

	const handlePopoverOpenChange = useCallback((isOpen: boolean) => {
		isPopoverOpenRef.current = isOpen;
		if (!isOpen) {
			popoverClosedAtRef.current = performance.now();
		}
	}, []);

	// Popovers unmount with the card without reporting that they closed.
	useEffect(() => {
		isPopoverOpenRef.current = false;
	}, [selectedId]);

	/**
	 * @description A press that only dismisses an item popover must not also
	 * close the detail card. The popover may close before the map sees the
	 * press (its outside-press listener runs first), hence the short window.
	 */
	const checkPopoverDismissPress = useCallback(
		() =>
			isPopoverOpenRef.current ||
			performance.now() - popoverClosedAtRef.current <
				POPOVER_DISMISS_WINDOW_MS,
		[]
	);

	const handleToggleLayer = useCallback((layer: TDayMapLayer) => {
		setHiddenLayers((previous) => {
			const next = new Set(previous);
			if (!next.delete(layer)) {
				next.add(layer);
			}
			return next;
		});
	}, []);

	const mapTransition = getMapTransition(isReducedMotion);
	const renderView = useCallback(
		(view: IMapView) => (
			// Zero-sized so empty map space still reaches the viewport's background press.
			<motion.div
				key={map ?? 'world'}
				animate={MAP_FADE_ANIMATE}
				initial={MAP_FADE_HIDDEN}
				transition={mapTransition}
				className="absolute left-0 top-0"
			>
				{map === null || layout === null ? (
					<WorldMapLayer
						isMapVisible={isMapVisible}
						onEnter={enterMap}
						view={view}
					/>
				) : (
					<div
						className="absolute left-0 top-0"
						style={{
							transform: `translate3d(${view.x}px, ${view.y}px, 0)`,
						}}
					>
						<DayMapTiles art={layout.art} map={map} view={view} />
						<DayMapMarkers
							arrival={arrival}
							art={layout.art}
							entities={entities}
							hiddenLayers={hiddenLayers}
							onSelect={handleSelect}
							selectedId={selectedId}
							zoom={view.zoom}
						/>
					</div>
				)}
			</motion.div>
		),
		[
			arrival,
			enterMap,
			entities,
			handleSelect,
			hiddenLayers,
			isMapVisible,
			layout,
			map,
			mapTransition,
			selectedId,
		]
	);

	if (!isHydrated || !isLocalizationReady) {
		return <Loading />;
	}

	const overlay = (
		<>
			<nav
				aria-label={t('maps.title')}
				className="pointer-events-none absolute left-3 top-3 flex items-center gap-1 text-small"
			>
				<button
					type="button"
					onClick={openWorldMap}
					className={cn(
						'pointer-events-auto flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 font-medium text-white shadow-md backdrop-blur transition-colors hover:bg-black/75 motion-reduce:transition-none',
						CLASSNAME_FOCUS_VISIBLE_OUTLINE
					)}
				>
					<FontAwesomeIcon icon={faEarthAsia} />
					{t('maps.world.title')}
				</button>
				{map !== null && (
					<>
						<FontAwesomeIcon
							icon={faChevronRight}
							size="xs"
							className="text-white/80 drop-shadow"
						/>
						<span className="rounded-full bg-black/60 px-3 py-1 font-semibold text-white shadow-md backdrop-blur">
							{getDayMapLabel(map)}
						</span>
					</>
				)}
			</nav>
			<div className="pointer-events-none absolute bottom-3 left-3 top-14 flex w-[min(23rem,calc(100%-4.5rem))] flex-col justify-end">
				<FadeMotionDiv
					target={selectedEntity?.id ?? ''}
					className="flex max-h-full min-h-0 flex-col"
				>
					{selectedEntity !== null && map !== null ? (
						<MapDetailCard
							entity={selectedEntity}
							map={map}
							onClose={handleCloseDetail}
							onFocusPoint={handleFocusPoint}
							onGoTo={handleGoTo}
							onOpenWorldMap={openWorldMap}
							onPopoverOpenChange={handlePopoverOpenChange}
							onShowCharacter={handleShowCharacter}
							visibility={visibility}
						/>
					) : null}
				</FadeMotionDiv>
			</div>
		</>
	);

	return (
		<div className="flex flex-col gap-4 lg:grid lg:h-[calc(var(--safe-h-dvh)-8rem)] lg:min-h-[32rem] lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
			<div
				ref={viewportSectionRef}
				className="h-[65dvh] min-h-80 scroll-mt-20 lg:h-full"
			>
				<MapViewport
					contentHeight={
						layout === null
							? WORLD_MAP_FACTS.height
							: layout.art.height
					}
					contentWidth={
						layout === null
							? WORLD_MAP_FACTS.width
							: layout.art.width
					}
					focusRequest={focusRequest}
					maxZoom={
						layout === null ? WORLD_MAP_MAX_ZOOM : DAY_MAP_MAX_ZOOM
					}
					minFitZoom={layout === null ? WORLD_MAP_MIN_FIT_ZOOM : 0}
					onBackgroundPress={handleCloseDetail}
					overlay={overlay}
					resetKey={map ?? 'world'}
					shouldIgnoreBackgroundPress={checkPopoverDismissPress}
					className="h-full rounded-large bg-[#14110d] shadow-medium"
				>
					{renderView}
				</MapViewport>
			</div>
			<MapSidebar
				entities={entities}
				hiddenLayers={hiddenLayers}
				isMapVisible={isMapVisible}
				map={map}
				onEnterMap={enterMap}
				onOpenWorldMap={openWorldMap}
				onQueryChange={setQuery}
				onSelect={handleListSelect}
				onToggleLayer={handleToggleLayer}
				query={query}
				selectedId={selectedId}
				className="lg:h-full"
			/>
		</div>
	);
}
