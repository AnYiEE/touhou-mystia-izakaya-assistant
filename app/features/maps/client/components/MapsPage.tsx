'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	faArrowLeft,
	faChevronRight,
	faEarthAsia,
	faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { motion, useAnimationControls } from 'framer-motion';
import { useRouter } from 'next/navigation';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import FadeMotionDiv from '@/design/ui/components/fadeMotionDiv';
import FontAwesomeIconButton from '@/design/ui/components/fontAwesomeIconButton';
import Link from '@/design/ui/components/link';
import SiteInfo from '@/design/ui/components/siteInfo';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';
import {
	MOTION_DURATION_MS,
	MOTION_DURATION_S,
	MOTION_EASE,
} from '@/design/ui/motion';

import { DAY_MAP_LAYOUTS } from '@/domain/data/maps/dayMapLayouts';
import type { TDayMapLabel, TDayMapPoint } from '@/domain/data/maps/types';
import { WORLD_MAP_FACTS } from '@/domain/data/maps/worldMapFacts';

import { appShellMessages } from '@/features/appShell/client/messages';
import { replaceHistoryEntryUrl } from '@/features/appShell/client/navigation/historyEntryState';
import { useParams } from '@/features/appShell/client/navigation/useParams';
import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import { SITE_LINKS } from '@/features/appShell/links';
import { useCatalogLocalizationReady } from '@/features/catalog/shared/client/localization/useCatalogLocalizationReady';
import { trackSupportMapDetail } from '@/features/donations/client/state/supportNudgeStore';
import { mapsMessages } from '@/features/maps/client/messages';
import {
	getMapEntityTrackName,
	trackMapEvent,
} from '@/features/maps/client/model/analytics';
import {
	type TDayMapEntity,
	type TDayMapLayer,
	buildDayMapEntities,
	findDayMapEntity,
	toContentPoint,
} from '@/features/maps/client/model/dayMapEntities';
import {
	checkDayMapLabel,
	getDayMapLabel,
} from '@/features/maps/client/model/dayMapLabels';
import {
	type IMapsVisit,
	type IOpenedMapItem,
	clearOpenedMapItem,
	getMapsRoutePathname,
	initializeMapsVisit,
	isCurrentMapsRoute,
	persistMapsVisitPreferences,
	pushMapsHistoryEntry,
	readMapsVisit,
	readOpenedMapItem,
	shouldAnimateMapsEntrance,
} from '@/features/maps/client/model/mapsHistory';
import {
	MAP_FADE_ANIMATE,
	MAP_FADE_HIDDEN,
	getMapTransition,
} from '@/features/maps/client/model/motion';
import {
	DayMapIgnorePreferencesContext,
	filterVisibleDayMapEntities,
	useDayMapVisibility,
} from '@/features/maps/client/model/useDayMapVisibility';
import { mapViewStore } from '@/features/maps/client/state/mapViewStore';
import {
	MAPS_PAGE_PATH,
	MAP_SELECT_PARAM_NAME,
	getMapsPageHref,
} from '@/features/maps/links';
import { useVibrate } from '@/features/preferences/client/useVibrate';
import {
	getDrawerLayoutClassName,
	getDrawerResultsClassName,
} from '@/features/specialGuestPlans/client/specialGuestPlanDrawer/drawerLayout';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

import { useI18n } from '@/shared/i18n/useI18n';
import { useDocumentTitle } from '@/shared/react/useDocumentTitle';
import { useHydrated } from '@/shared/react/useHydrated';
import { siteMessages } from '@/shared/site/messages';
import { SITE_METADATA } from '@/shared/site/metadata';

import DayMapMarkers from './DayMapMarkers';
import DayMapTiles from './DayMapTiles';
import MapDetailCard from './MapDetailCard';
import MapSidebar from './MapSidebar';
import MapsPageSkeleton from './MapsPageSkeleton';
import MapsSidebarBootScript from './MapsSidebarBootScript';
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
const MAP_ENTER_CONTENT_DELAY_MS = MOTION_DURATION_MS.slow + 20;
const MAP_ENTER_HIDDEN = { x: '-100%' } as const;
const MAP_ENTER_VISIBLE = { x: 0 } as const;
const MAP_ENTER_TRANSITION = {
	duration: MOTION_DURATION_S.slow,
	ease: MOTION_EASE.standard,
	type: 'tween',
} as const;
const REDUCED_MOTION_TRANSITION = { duration: 0 } as const;
const { enName } = SITE_METADATA;

interface IMapRoute {
	entity: TDayMapEntity | null;
	map: TDayMapLabel | null;
}

/** @description Map and entity named by the URL; unknown names are dropped. */
function resolveMapRoute(
	mapSegment: string | undefined,
	entityId: string | null
): IMapRoute {
	if (mapSegment === undefined || !checkDayMapLabel(mapSegment)) {
		return { entity: null, map: null };
	}

	return {
		entity:
			entityId === null ? null : findDayMapEntity(mapSegment, entityId),
		map: mapSegment,
	};
}

function createFocusRequest(
	map: TDayMapLabel,
	point: TDayMapPoint,
	key: number
): IMapFocusRequest {
	const { art } = DAY_MAP_LAYOUTS[map];
	const [x, y] = toContentPoint(art, point);

	return { key, minZoom: FOCUS_PX_PER_UNIT / art.pixelsPerUnit, x, y };
}

export default function MapsPage() {
	const { locale, t } = useI18n(mapsMessages);
	const { t: tAppShell } = useI18n(appShellMessages);
	const { t: tSite } = useI18n(siteMessages);
	const isEnglish = locale === 'en';
	const { isHighAppearance } = useDesignPreferences();
	const router = useRouter();
	const isHydrated = useHydrated();
	const isReducedMotion = useReducedMotion();
	const enterTransition = isReducedMotion
		? REDUCED_MOTION_TRANSITION
		: MAP_ENTER_TRANSITION;
	const panelControls = useAnimationControls();
	const isClosingRef = useRef(false);
	const [shouldAnimateEntrance] = useState(() => shouldAnimateMapsEntrance());
	const [isEntranceSettled, setIsEntranceSettled] = useState(
		!shouldAnimateEntrance || isReducedMotion
	);
	const isLocalizationReady = useCatalogLocalizationReady();
	const vibrate = useVibrate();
	const { pathname } = usePathname();
	const { params } = useParams();
	const [visit, setVisit] = useState<IMapsVisit | null>(null);
	const shouldIgnorePreferences = visit?.shouldIgnorePreferences ?? false;
	const visibility = useDayMapVisibility(shouldIgnorePreferences);
	const { isMapVisible } = visibility;

	const [, , routeMapSegment] = getMapsRoutePathname(pathname).split('/');
	const routeEntityId = params.get(MAP_SELECT_PARAM_NAME);
	const routeHref = getMapsPageHref(routeMapSegment ?? null, routeEntityId);

	const route = useMemo(
		() => resolveMapRoute(routeMapSegment, routeEntityId),
		[routeMapSegment, routeEntityId]
	);
	const { entity: routeEntity, map } = route;
	const showSiteInfo = map !== null || !isEnglish;
	const siteInfoClassName = cn(
		'pointer-events-auto h-full max-w-28 select-auto font-bold text-foreground md:max-w-[13rem] lg:hidden',
		map !== null && (isEnglish ? 'hidden md:flex' : 'hidden sm:flex')
	);
	const dividerClassName = cn(
		'h-8 w-px shrink-0 bg-divider',
		map === null
			? isEnglish && 'hidden lg:block'
			: isEnglish
				? 'hidden md:block'
				: 'hidden sm:block'
	);
	const siteName = tSite('site.name');
	const siteTitle =
		siteName === enName ? siteName : `${siteName} - ${enName}`;
	const title = `${
		map === null || !isLocalizationReady ? '' : `${getDayMapLabel(map)} | `
	}${t('maps.world.title')} | ${siteTitle}`;

	useDocumentTitle(title, MAPS_PAGE_PATH);

	const selectedId = routeEntity?.id ?? null;
	const persistedHiddenLayerList =
		mapViewStore.persistence.hiddenLayers.use();
	const isTaskLayerVisible =
		mapViewStore.persistence.isTaskLayerVisible.use();
	const ignoredPreferencesHiddenLayers =
		mapViewStore.shared.ignoredPreferencesHiddenLayers.use();
	const hiddenLayers = useMemo(() => {
		const layers = new Set(
			shouldIgnorePreferences
				? (ignoredPreferencesHiddenLayers ?? [])
				: persistedHiddenLayerList
		);
		if (!shouldIgnorePreferences && !isTaskLayerVisible) {
			layers.add('task');
		}
		return layers;
	}, [
		ignoredPreferencesHiddenLayers,
		isTaskLayerVisible,
		persistedHiddenLayerList,
		shouldIgnorePreferences,
	]);
	const query = mapViewStore.shared.query.use();
	const [focusRequest, setFocusRequest] = useState(() =>
		map === null || routeEntity === null
			? null
			: createFocusRequest(map, routeEntity.position, 0)
	);
	const [arrival, setArrival] = useState<TDayMapPoint | null>(null);
	const isSidebarCollapsed =
		mapViewStore.persistence.isSidebarCollapsed.use();
	const isMapViewStoreHydrated = mapViewStore.shared.isHydrated.use();
	const [restoredItem, setRestoredItem] = useState<IOpenedMapItem | null>(
		null
	);
	const focusKeyRef = useRef(0);
	const ignoredPreferencesRef = useRef<boolean | null>(null);
	/** @description Last URL the page state was read from or written to. */
	const syncedHrefRef = useRef(routeHref);
	const isPopoverOpenRef = useRef(false);
	const popoverClosedAtRef = useRef(Number.NEGATIVE_INFINITY);

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

	const requestFocus = useCallback(
		(targetMap: TDayMapLabel, point: TDayMapPoint) => {
			focusKeyRef.current += 1;
			setFocusRequest(
				createFocusRequest(targetMap, point, focusKeyRef.current)
			);
		},
		[]
	);

	useEffect(() => {
		if (!shouldAnimateEntrance || isEntranceSettled) {
			return;
		}
		if (isReducedMotion) {
			setIsEntranceSettled(true);
			return;
		}
		const timeoutId = setTimeout(() => {
			setIsEntranceSettled(true);
		}, MAP_ENTER_CONTENT_DELAY_MS);

		return () => {
			clearTimeout(timeoutId);
		};
	}, [isEntranceSettled, isReducedMotion, shouldAnimateEntrance]);

	useEffect(() => {
		if (!shouldAnimateEntrance) {
			return;
		}
		void panelControls.start(MAP_ENTER_VISIBLE, enterTransition);
	}, [enterTransition, panelControls, shouldAnimateEntrance]);

	useEffect(() => {
		const container = document.querySelector('[data-app-shell-container]');
		if (container === null) {
			return;
		}
		const shellElements = [...container.children].filter(
			(child): child is HTMLElement =>
				child instanceof HTMLElement && child.tagName !== 'MAIN'
		);
		const previousInertStates = shellElements.map(
			(element) => element.inert
		);
		for (const element of shellElements) {
			element.inert = true;
		}

		return () => {
			shellElements.forEach((element, index) => {
				element.inert = previousInertStates[index] ?? false;
			});
		};
	}, []);

	useEffect(() => {
		if (!isMapViewStoreHydrated || !isCurrentMapsRoute(routeHref)) {
			return;
		}
		const nextVisit = initializeMapsVisit();
		if (
			ignoredPreferencesRef.current !== nextVisit.shouldIgnorePreferences
		) {
			ignoredPreferencesRef.current = nextVisit.shouldIgnorePreferences;
			if (nextVisit.shouldIgnorePreferences) {
				mapViewStore.initializeIgnoredPreferencesLayers(routeEntity);
			} else {
				mapViewStore.setIgnoredPreferencesHiddenLayers(null);
			}
		}
		if (!nextVisit.shouldIgnorePreferences) {
			mapViewStore.revealForEntity(routeEntity);
		}
		setVisit((previous) =>
			previous?.depth === nextVisit.depth &&
			previous.hasOrigin === nextVisit.hasOrigin &&
			previous.shouldIgnorePreferences ===
				nextVisit.shouldIgnorePreferences
				? previous
				: nextVisit
		);
	}, [isMapViewStoreHydrated, routeEntity, routeHref]);

	const selectEntity = useCallback(
		(id: string | null) => {
			if (
				getMapsRoutePathname(location.pathname) !== getMapsPageHref(map)
			) {
				return;
			}
			clearOpenedMapItem();
			const href = getMapsPageHref(map, id);
			if (isCurrentMapsRoute(href)) {
				return;
			}
			syncedHrefRef.current = href;
			replaceHistoryEntryUrl(href);
		},
		[map]
	);

	const navigateMap = useCallback(
		(targetMap: TDayMapLabel | null, id: string | null = null) => {
			const href = getMapsPageHref(targetMap, id);
			syncedHrefRef.current = href;
			pushMapsHistoryEntry(href);
		},
		[]
	);

	// Back to an entry left through a link in an item popover: open it again.
	useEffect(() => {
		if (!isCurrentMapsRoute(routeHref)) {
			return;
		}
		const item = readOpenedMapItem();
		setRestoredItem(item);
	}, [routeHref]);

	useEffect(() => {
		if (restoredItem !== null && restoredItem.entityId !== selectedId) {
			setRestoredItem(null);
		}
	}, [restoredItem, selectedId]);

	// Follow links to another map or entity while the page stays mounted.
	useEffect(() => {
		if (
			syncedHrefRef.current === routeHref ||
			!isCurrentMapsRoute(routeHref)
		) {
			return;
		}
		syncedHrefRef.current = routeHref;

		const { entity: nextEntity, map: nextMap } = resolveMapRoute(
			routeMapSegment,
			routeEntityId
		);
		mapViewStore.resetQuery();
		setArrival(null);
		if (nextMap === null || nextEntity === null) {
			setFocusRequest(null);
		} else {
			requestFocus(nextMap, nextEntity.position);
		}
	}, [requestFocus, routeEntityId, routeHref, routeMapSegment]);

	// Canonicalize aliases and hidden maps without adding a history entry.
	useEffect(() => {
		if (
			visit === null ||
			!isCurrentMapsRoute(routeHref) ||
			readMapsVisit()?.shouldIgnorePreferences !==
				visit.shouldIgnorePreferences
		) {
			return;
		}
		const href = getMapsPageHref(
			map !== null && isMapVisible(map) ? map : null,
			selectedId
		);
		if (href !== routeHref) {
			replaceHistoryEntryUrl(href);
		}
	}, [isMapVisible, map, routeHref, selectedId, visit]);

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

	const enterMap = useCallback(
		(nextMap: TDayMapLabel, source: 'List' | 'World Map') => {
			vibrate();
			trackMapEvent(
				'Map Navigation Button',
				`Enter:${nextMap}:${source}`
			);
			navigateMap(nextMap);
			mapViewStore.resetQuery();
			setArrival(null);
			setFocusRequest(null);
		},
		[navigateMap, vibrate]
	);

	const handleEnterFromList = useCallback(
		(nextMap: TDayMapLabel) => {
			enterMap(nextMap, 'List');
		},
		[enterMap]
	);

	const handleEnterFromWorldMap = useCallback(
		(nextMap: TDayMapLabel) => {
			enterMap(nextMap, 'World Map');
		},
		[enterMap]
	);

	const openWorldMap = useCallback(
		(source: 'Header' | 'Teleport') => {
			vibrate();
			trackMapEvent('Map Navigation Button', `World:${source}`);
			navigateMap(null);
			mapViewStore.resetQuery();
			setArrival(null);
			setFocusRequest(null);
		},
		[navigateMap, vibrate]
	);

	const handleOpenWorldMapFromHeader = useCallback(() => {
		openWorldMap('Header');
	}, [openWorldMap]);

	const handleOpenWorldMapFromTeleport = useCallback(() => {
		openWorldMap('Teleport');
	}, [openWorldMap]);

	const completeClose = useCallback(() => {
		const currentVisit = readMapsVisit();
		if (currentVisit?.hasOrigin === true) {
			trackMapEvent('Map Navigation Button', 'Close:Origin');
			globalThis.history.go(-(currentVisit.depth + 1));
		} else {
			trackMapEvent('Map Navigation Button', 'Close:Home');
			router.push(SITE_LINKS.index.href);
		}
	}, [router]);

	const handleClose = useCallback(() => {
		if (isClosingRef.current) {
			return;
		}
		isClosingRef.current = true;
		vibrate();
		if (isReducedMotion) {
			completeClose();
			return;
		}
		void panelControls.start(MAP_ENTER_HIDDEN, enterTransition).then(() => {
			completeClose();
		});
	}, [
		completeClose,
		enterTransition,
		isReducedMotion,
		panelControls,
		vibrate,
	]);

	const handleBack = useCallback(() => {
		if ((readMapsVisit()?.depth ?? 0) > 0) {
			vibrate();
			trackMapEvent('Map Navigation Button', 'Back:Map');
			router.back();
		}
	}, [router, vibrate]);

	const handleLogoPress = useCallback(() => {
		trackMapEvent('Map Navigation Button', 'Logo');
	}, []);

	const handleGoTo = useCallback(
		(targetMap: TDayMapLabel, point: TDayMapPoint | null) => {
			vibrate();
			if (map !== null) {
				trackMapEvent(
					'Map Navigation Button',
					`Go:${map}->${targetMap}`
				);
			}
			navigateMap(targetMap);
			mapViewStore.resetQuery();
			setArrival(point);
			if (point !== null) {
				requestFocus(targetMap, point);
			}
		},
		[map, navigateMap, requestFocus, vibrate]
	);

	const handleSelect = useCallback(
		(id: string) => {
			vibrate();
			if (map !== null) {
				trackMapEvent(
					'Map Entity Button',
					`Select:${getMapEntityTrackName(map, id)}:Marker`
				);
				trackSupportMapDetail(map, id);
			}
			selectEntity(id);
		},
		[map, selectEntity, vibrate]
	);

	const handleListSelect = useCallback(
		(id: string) => {
			const entity = entities.find((item) => item.id === id);
			if (entity === undefined || map === null) {
				return;
			}
			vibrate();
			trackMapEvent(
				'Map Entity Button',
				`Select:${getMapEntityTrackName(map, id)}:${query.trim() === '' ? 'List' : 'Search'}`
			);
			trackSupportMapDetail(map, id);
			selectEntity(id);
			requestFocus(map, entity.position);
		},
		[entities, map, query, requestFocus, selectEntity, vibrate]
	);

	const handleQuickTravel = useCallback(
		(entity: TDayMapEntity) => {
			if (entity.layer === 'transition') {
				if (checkDayMapLabel(entity.transition.target)) {
					handleGoTo(
						entity.transition.target,
						entity.transition.arrival
					);
				}
				return;
			}
			if (entity.layer === 'teleport') {
				handleOpenWorldMapFromTeleport();
			}
		},
		[handleGoTo, handleOpenWorldMapFromTeleport]
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
			trackMapEvent(
				'Map Navigation Button',
				`Character:${getMapEntityTrackName(targetMap, entityId)}`
			);
			trackSupportMapDetail(targetMap, entityId);
			navigateMap(targetMap, entityId);
			mapViewStore.resetQuery();
			setArrival(null);
			requestFocus(targetMap, point);
		},
		[navigateMap, requestFocus, vibrate]
	);

	const handleCloseDetail = useCallback(() => {
		if (map !== null && selectedId !== null) {
			trackMapEvent(
				'Map Entity Button',
				`Close:${getMapEntityTrackName(map, selectedId)}:Button`
			);
		}
		selectEntity(null);
	}, [map, selectEntity, selectedId]);

	const handleBackgroundPress = useCallback(() => {
		if (selectedId === null) {
			return;
		}
		if (map !== null) {
			trackMapEvent(
				'Map Entity Button',
				`Close:${getMapEntityTrackName(map, selectedId)}:Background`
			);
		}
		selectEntity(null);
	}, [map, selectEntity, selectedId]);

	const handlePopoverOpenChange = useCallback((isOpen: boolean) => {
		isPopoverOpenRef.current = isOpen;
		if (!isOpen) {
			popoverClosedAtRef.current = performance.now();
			setRestoredItem(null);
		}
	}, []);

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

	const handleQueryChange = useCallback(
		(value: string) => {
			if (value === '' && query !== '') {
				trackMapEvent('Map Search Button', `Clear:${map}`);
			}
			mapViewStore.setQuery(value);
		},
		[map, query]
	);

	useEffect(() => {
		if (query.trim() === '' || map === null) {
			return;
		}
		const timer = setTimeout(() => {
			trackMapEvent('Map Search Button', `Search:${map}`);
		}, 500);
		return () => {
			clearTimeout(timer);
		};
	}, [map, query]);

	const handleToggleSidebar = useCallback(() => {
		vibrate();
		trackMapEvent(
			'Map Sidebar Button',
			isSidebarCollapsed ? 'Expand' : 'Collapse'
		);
		mapViewStore.toggleSidebar();
	}, [isSidebarCollapsed, vibrate]);

	const handleToggleLayer = useCallback(
		(layer: TDayMapLayer) => {
			vibrate();
			trackMapEvent(
				'Map Layer Button',
				`${hiddenLayers.has(layer) ? 'Show' : 'Hide'}:${layer}`
			);
			if (shouldIgnorePreferences) {
				mapViewStore.commitIgnoredPreferences();
				persistMapsVisitPreferences();
				setVisit((previous) =>
					previous === null
						? previous
						: { ...previous, shouldIgnorePreferences: false }
				);
			}
			mapViewStore.toggleLayer(layer);
		},
		[hiddenLayers, shouldIgnorePreferences, vibrate]
	);

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
						onEnter={handleEnterFromWorldMap}
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
							map={map}
							onQuickTravel={handleQuickTravel}
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
			entities,
			handleEnterFromWorldMap,
			handleQuickTravel,
			handleSelect,
			hiddenLayers,
			isMapVisible,
			layout,
			map,
			mapTransition,
			selectedId,
		]
	);

	const isReady =
		isHydrated &&
		isLocalizationReady &&
		isMapViewStoreHydrated &&
		visit !== null;
	const isContentReady = isReady && isEntranceSettled;

	const header = (
		<header
			className={cn(
				'flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-divider px-4 py-3',
				isHighAppearance
					? 'bg-content1/50 backdrop-blur-lg'
					: 'bg-content1 dark:bg-content1/70'
			)}
		>
			<div className="flex min-w-0 items-center gap-3">
				<Link
					animationUnderline={false}
					color="foreground"
					href={SITE_LINKS.index.href}
					onPress={handleLogoPress}
					aria-label={tAppShell('appShell.links.index')}
					className="flex min-w-0 shrink-0 select-none items-center justify-start gap-1 rounded-small hover:brightness-100 active:opacity-disabled"
				>
					<span
						aria-hidden
						title={tSite('site.shortName')}
						className="image-rendering-pixelated h-10 w-10 shrink-0 rounded-full bg-logo bg-cover bg-no-repeat"
					/>
					<>
						<p className="hidden truncate font-bold lg:inline-block">
							{tSite('site.name')}
						</p>
						{showSiteInfo && (
							<SiteInfo
								baseUrl={PUBLIC_RUNTIME_CONFIG.baseURL}
								aria-hidden="false"
								fontSize={16}
								name={tSite('site.shortName')}
								className={siteInfoClassName}
							/>
						)}
					</>
				</Link>
				<span aria-hidden className={dividerClassName} />
				<nav
					aria-label={t('maps.title')}
					className="flex min-w-0 items-center gap-1.5"
				>
					<FontAwesomeIcon
						icon={faEarthAsia}
						size="sm"
						className="shrink-0 text-primary"
					/>
					{map === null || !isReady ? (
						<h2 className="min-w-0 truncate font-bold">
							{t('maps.world.title')}
						</h2>
					) : (
						<>
							<button
								type="button"
								onClick={handleOpenWorldMapFromHeader}
								className={cn(
									'min-w-0 truncate rounded-small font-bold text-default-500 transition-colors hover:text-foreground motion-reduce:transition-none',
									CLASSNAME_FOCUS_VISIBLE_OUTLINE
								)}
							>
								{t('maps.world.title')}
							</button>
							<FontAwesomeIcon
								icon={faChevronRight}
								size="xs"
								className="shrink-0 text-default-400"
							/>
							<h2 className="min-w-0 truncate font-bold">
								{getDayMapLabel(map)}
							</h2>
						</>
					)}
				</nav>
			</div>
			<div className="flex shrink-0 items-center gap-1">
				{visit !== null && visit.depth > 0 && (
					<FontAwesomeIconButton
						icon={faArrowLeft}
						variant="light"
						aria-label={t('maps.back')}
						onPress={handleBack}
					/>
				)}
				<FontAwesomeIconButton
					icon={faXmark}
					variant="light"
					aria-label={t('maps.close')}
					onPress={handleClose}
				/>
			</div>
		</header>
	);

	const overlay = (
		<div
			{...(selectedEntity === null
				? {}
				: { 'data-support-nudge-blocker': '' })}
			className="pointer-events-none absolute bottom-3 left-3 top-3 flex w-[min(23rem,calc(100%-4.5rem))] flex-col justify-end"
		>
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
						onOpenWorldMap={handleOpenWorldMapFromTeleport}
						onPopoverOpenChange={handlePopoverOpenChange}
						onShowCharacter={handleShowCharacter}
						restoredItemKey={
							restoredItem?.entityId === selectedEntity.id
								? restoredItem.itemKey
								: null
						}
						visibility={visibility}
					/>
				) : null}
			</FadeMotionDiv>
		</div>
	);

	const surfaceClassName = isHighAppearance
		? 'bg-blend-mystia'
		: 'bg-background dark:bg-content1';

	return (
		// A full-screen view like the plan drawer. The app shell stays
		// painted underneath so sliding the panel out does not re-create it.
		<DayMapIgnorePreferencesContext value={shouldIgnorePreferences}>
			<MapsSidebarBootScript />
			<div
				data-fullscreen-page
				className={cn(
					'fixed inset-0 z-[45] overflow-hidden',
					surfaceClassName
				)}
			>
				<motion.div
					animate={panelControls}
					className={cn('flex h-full flex-col', surfaceClassName)}
					initial={
						shouldAnimateEntrance && !isReducedMotion
							? MAP_ENTER_HIDDEN
							: false
					}
				>
					{header}
					{isContentReady ? (
						<div className={getDrawerLayoutClassName()}>
							<MapSidebar
								entities={entities}
								hiddenLayers={hiddenLayers}
								isCollapsed={isSidebarCollapsed}
								isMapVisible={isMapVisible}
								map={map}
								onEnterMap={handleEnterFromList}
								onQueryChange={handleQueryChange}
								onSelect={handleListSelect}
								onToggleCollapsed={handleToggleSidebar}
								onToggleLayer={handleToggleLayer}
								query={query}
								selectedId={selectedId}
							/>
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
									layout === null
										? WORLD_MAP_MAX_ZOOM
										: DAY_MAP_MAX_ZOOM
								}
								minFitZoom={
									layout === null ? WORLD_MAP_MIN_FIT_ZOOM : 0
								}
								onBackgroundPress={handleBackgroundPress}
								overlay={overlay}
								resetKey={map ?? 'world'}
								shouldIgnoreBackgroundPress={
									checkPopoverDismissPress
								}
								className={cn(
									getDrawerResultsClassName(isHighAppearance),
									'bg-[#14110d] dark:bg-[#14110d]'
								)}
							>
								{renderView}
							</MapViewport>
						</div>
					) : (
						<MapsPageSkeleton map={map} />
					)}
				</motion.div>
			</div>
		</DayMapIgnorePreferencesContext>
	);
}
