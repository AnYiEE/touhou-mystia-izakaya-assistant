'use client';

import {
	type RefObject,
	memo,
	useCallback,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import {
	faChevronDown,
	faChevronLeft,
	faChevronRight,
	faEarthAsia,
	faEye,
	faEyeSlash,
	faMagnifyingGlass,
	faShuffle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { AnimatePresence, motion } from 'framer-motion';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import FadeMotionDiv from '@/design/ui/components/fadeMotionDiv';
import Input from '@/design/ui/components/input';
import ScrollShadow from '@/design/ui/components/scrollShadow';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';
import { MOTION_DURATION_S, MOTION_EASE } from '@/design/ui/motion';

import { getDlcLabel } from '@/domain/availability/localizedLabels';
import { DAY_MAP_EXTRA_FACTS } from '@/domain/data/maps/dayMapExtraFacts';
import type { TDayMapLabel } from '@/domain/data/maps/types';
import { ALL_MAP_LABELS } from '@/domain/data/places/placeFacts';

import { useCatalogLocalizationRevision } from '@/features/catalog/shared/client/localization/catalogLocalizationRevision';
import { mapsMessages } from '@/features/maps/client/messages';
import { trackMapEvent } from '@/features/maps/client/model/analytics';
import { getDayMapPreviewUrl } from '@/features/maps/client/model/assets';
import {
	DAY_MAP_LAYERS,
	type TDayMapEntity,
	type TDayMapLayer,
	checkTimeLimited,
} from '@/features/maps/client/model/dayMapEntities';
import {
	EXTRA_DAY_MAP_LABELS,
	checkExtraDayMapLabel,
	getDayMapDlc,
	getDayMapLabel,
} from '@/features/maps/client/model/dayMapLabels';
import { DAY_MAP_LAYER_COLORS } from '@/features/maps/client/model/mapStyles';
import {
	MAP_COLLAPSE_ANIMATE,
	MAP_COLLAPSE_HIDDEN,
	getMapTransition,
} from '@/features/maps/client/model/motion';
import { useDayMapEntityName } from '@/features/maps/client/model/useDayMapEntityName';
import { getDrawerControlsClassName } from '@/features/specialGuestPlans/client/specialGuestPlanDrawer/drawerLayout';

import { useI18n } from '@/shared/i18n/useI18n';
import { getPinyin } from '@/shared/utilities/pinyin/getPinyin';
import { matchNameByLocale } from '@/shared/utilities/search/localeNameMatch';

import DayMapEntityIcon from './DayMapEntityIcon';

interface IProps {
	entities: ReadonlyArray<TDayMapEntity>;
	hiddenLayers: ReadonlySet<TDayMapLayer>;
	/** @description A narrow strip on wide screens; only the title row on narrow ones. */
	isCollapsed: boolean;
	isMapVisible: (map: TDayMapLabel) => boolean;
	map: TDayMapLabel | null;
	onEnterMap: (map: TDayMapLabel) => void;
	onOpenWorldMap: () => void;
	onQueryChange: (query: string) => void;
	onSelect: (id: string) => void;
	onToggleCollapsed: () => void;
	onToggleLayer: (layer: TDayMapLayer) => void;
	query: string;
	selectedId: string | null;
}

interface IMapCardProps {
	map: TDayMapLabel;
	onEnterMap: (map: TDayMapLabel) => void;
}

const MapCard = memo<IMapCardProps>(function MapCard({ map, onEnterMap }) {
	const { t } = useI18n(mapsMessages);
	useCatalogLocalizationRevision();

	const dlc = getDayMapDlc(map);
	const kind = checkExtraDayMapLabel(map)
		? DAY_MAP_EXTRA_FACTS[map].kind
		: null;

	const handleClick = useCallback(() => {
		onEnterMap(map);
	}, [map, onEnterMap]);

	return (
		<button
			type="button"
			onClick={handleClick}
			className={cn(
				'group w-full overflow-hidden rounded-medium bg-content2 text-left shadow-sm ring-1 ring-default-200 transition hover:ring-2 hover:ring-[#ffa800] motion-reduce:transition-none',
				CLASSNAME_FOCUS_VISIBLE_OUTLINE
			)}
		>
			<span className="relative block aspect-[16/9] overflow-hidden bg-[#14110d]">
				{/* Lazy: most cards start below the fold of the scrolling list. */}
				{/* eslint-disable-next-line @next/next/no-img-element -- Pre-sized static thumbnail; static export cannot optimise `next/image`, and CSS backgrounds cannot load lazily. */}
				<img
					alt=""
					decoding="async"
					loading="lazy"
					src={getDayMapPreviewUrl(map)}
					className="image-rendering-pixelated block h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
				/>
				{kind !== null && kind !== 'place' && (
					<span className="absolute left-1 top-1 rounded-full bg-black/70 px-1.5 text-tiny font-medium text-white">
						{t(`maps.kind.${kind}`)}
					</span>
				)}
			</span>
			<span className="flex items-center justify-between gap-1 px-2 py-1">
				<span className="truncate text-small font-medium">
					{getDayMapLabel(map)}
				</span>
				{dlc !== 0 && (
					<span className="shrink-0 text-tiny text-default-500">
						DLC{dlc}
					</span>
				)}
			</span>
		</button>
	);
});

const WorldMapList = memo<Pick<IProps, 'isMapVisible' | 'onEnterMap'>>(
	function WorldMapList({ isMapVisible, onEnterMap }) {
		const { t } = useI18n(mapsMessages);

		return (
			<div className="space-y-3 p-1">
				{(
					[
						['maps.world.regions', ALL_MAP_LABELS],
						['maps.world.otherPlaces', EXTRA_DAY_MAP_LABELS],
					] as const
				).map(([title, maps]) => (
					<section key={title}>
						<h2 className="mb-1.5 px-0.5 text-tiny font-semibold text-default-600">
							{t(title)}
						</h2>
						<ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2">
							{maps.filter(isMapVisible).map((map) => (
								<li key={map}>
									<MapCard
										map={map}
										onEnterMap={onEnterMap}
									/>
								</li>
							))}
						</ul>
					</section>
				))}
			</div>
		);
	}
);

interface IEntityRowProps {
	entity: TDayMapEntity;
	isSelected: boolean;
	name: string;
	onSelect: (id: string) => void;
}

const EntityRow = memo<IEntityRowProps>(function EntityRow({
	entity,
	isSelected,
	name,
	onSelect,
}) {
	const { t } = useI18n(mapsMessages);
	const handleClick = useCallback(() => {
		onSelect(entity.id);
	}, [entity.id, onSelect]);
	return (
		<li>
			<button
				aria-pressed={isSelected}
				type="button"
				onClick={handleClick}
				className={cn(
					'flex w-full items-center gap-2 rounded-medium px-1.5 py-1 text-left text-small transition-colors motion-reduce:transition-none',
					CLASSNAME_FOCUS_VISIBLE_OUTLINE,
					isSelected
						? 'bg-[#ffa800]/15 font-medium text-foreground ring-1 ring-inset ring-[#ffa800]/60'
						: 'hover:bg-default-100'
				)}
			>
				<DayMapEntityIcon entity={entity} size={2} />
				<span className="min-w-0 flex-1 truncate">
					{entity.layer === 'transition'
						? t('maps.toTarget', { map: name })
						: name}
				</span>
				{entity.layer === 'collectable' &&
					checkTimeLimited(entity.collectable.showTime) && (
						<span className="shrink-0 rounded-full bg-[#ffa800]/15 px-1.5 text-tiny font-medium text-foreground">
							{t('maps.detail.timeRange', {
								from: entity.collectable.showTime[0],
								to: entity.collectable.showTime[1],
							})}
						</span>
					)}
				{'spots' in entity && entity.spots.length > 1 && (
					<span className="shrink-0 text-tiny text-default-500">
						<FontAwesomeIcon icon={faShuffle} size="xs" />
						{entity.spots.length}
					</span>
				)}
			</button>
		</li>
	);
});

interface IEntityGroupProps {
	isExpanded: boolean;
	items: ReadonlyArray<TDayMapEntity>;
	layer: TDayMapLayer;
	onSelect: (id: string) => void;
	onToggleExpanded: (layer: TDayMapLayer) => void;
	selectedId: string | null;
}

const EntityGroup = memo<IEntityGroupProps>(function EntityGroup({
	isExpanded,
	items,
	layer,
	onSelect,
	onToggleExpanded,
	selectedId,
}) {
	const { t } = useI18n(mapsMessages);
	const isReducedMotion = useReducedMotion();
	const getName = useDayMapEntityName();

	const namedItems = useMemo(
		() => items.map((entity) => ({ entity, name: getName(entity) })),
		[getName, items]
	);
	const handleToggleExpanded = useCallback(() => {
		onToggleExpanded(layer);
	}, [layer, onToggleExpanded]);
	const transition = getMapTransition(isReducedMotion);

	return (
		<section className="pb-2">
			<h2>
				<button
					aria-expanded={isExpanded}
					type="button"
					onClick={handleToggleExpanded}
					className={cn(
						'flex w-full items-center gap-1.5 rounded-medium px-1 py-0.5 text-left text-tiny font-semibold text-default-600 transition-colors hover:bg-default-100 motion-reduce:transition-none',
						CLASSNAME_FOCUS_VISIBLE_OUTLINE
					)}
				>
					<span
						aria-hidden
						className={cn(
							'h-2 w-2 rounded-full',
							DAY_MAP_LAYER_COLORS[layer].dot
						)}
					/>
					{t(`maps.kind.${layer}`)}
					<span className="font-normal">
						{t('maps.list.count', { count: items.length })}
					</span>
					<FontAwesomeIcon
						icon={faChevronDown}
						size="xs"
						className={cn(
							'ml-auto text-default-400 transition-transform motion-reduce:transition-none',
							{ '-rotate-90': !isExpanded }
						)}
					/>
				</button>
			</h2>
			<AnimatePresence initial={false}>
				{isExpanded && (
					<motion.ul
						animate={MAP_COLLAPSE_ANIMATE}
						exit={MAP_COLLAPSE_HIDDEN}
						initial={MAP_COLLAPSE_HIDDEN}
						transition={transition}
						className="space-y-0.5 pt-1"
					>
						{namedItems.map(({ entity, name }) => (
							<EntityRow
								key={entity.id}
								entity={entity}
								isSelected={entity.id === selectedId}
								name={name}
								onSelect={onSelect}
							/>
						))}
					</motion.ul>
				)}
			</AnimatePresence>
		</section>
	);
});

interface IMapPanelProps extends Omit<
	IProps,
	| 'isCollapsed'
	| 'isMapVisible'
	| 'onEnterMap'
	| 'onOpenWorldMap'
	| 'onToggleCollapsed'
> {
	map: TDayMapLabel;
}

/** @description Search, layer filters and the entity list; only the list scrolls. */
const MapPanel = memo(function MapPanel({
	entities,
	hiddenLayers,
	onQueryChange,
	onSelect,
	onToggleLayer,
	query,
	selectedId,
}: IMapPanelProps) {
	const { locale, t } = useI18n(mapsMessages);
	const isReducedMotion = useReducedMotion();
	const getName = useDayMapEntityName();

	const [collapsedLayers, setCollapsedLayers] = useState<
		ReadonlySet<TDayMapLayer>
	>(() => new Set());

	const handleToggleExpanded = useCallback(
		(layer: TDayMapLayer) => {
			trackMapEvent(
				'Map Layer Button',
				`${collapsedLayers.has(layer) ? 'Expand' : 'Collapse'} Group:${layer}`
			);
			setCollapsedLayers((previous) => {
				const next = new Set(previous);
				if (!next.delete(layer)) {
					next.add(layer);
				}
				return next;
			});
		},
		[collapsedLayers]
	);

	const layerCounts = useMemo(() => {
		const counts = new Map<TDayMapLayer, number>();
		for (const entity of entities) {
			counts.set(entity.layer, (counts.get(entity.layer) ?? 0) + 1);
		}
		return counts;
	}, [entities]);

	const searchableEntities = useMemo(
		() =>
			entities.map((entity) => {
				const name = getName(entity);
				return { entity, name, pinyin: getPinyin(name) };
			}),
		[entities, getName]
	);
	const trimmedQuery = query.trim();
	const groups = useMemo(() => {
		const layerItems = new Map<TDayMapLayer, TDayMapEntity[]>();
		for (const item of searchableEntities) {
			const { entity } = item;
			if (
				hiddenLayers.has(entity.layer) ||
				(trimmedQuery !== '' &&
					!matchNameByLocale(trimmedQuery, item, locale))
			) {
				continue;
			}
			const items = layerItems.get(entity.layer);
			if (items === undefined) {
				layerItems.set(entity.layer, [entity]);
			} else {
				items.push(entity);
			}
		}
		return DAY_MAP_LAYERS.flatMap((layer) => {
			const items = layerItems.get(layer);
			return items === undefined ? [] : [{ items, layer }];
		});
	}, [hiddenLayers, locale, searchableEntities, trimmedQuery]);

	const transition = getMapTransition(isReducedMotion);

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-3">
			<Input
				isClearable
				aria-label={t('maps.search.placeholder')}
				placeholder={t('maps.search.placeholder')}
				size="sm"
				startContent={
					<FontAwesomeIcon
						icon={faMagnifyingGlass}
						className="text-default-400"
					/>
				}
				value={query}
				onValueChange={onQueryChange}
				className="shrink-0"
			/>
			<div className="shrink-0">
				<p className="mb-1 text-tiny font-semibold text-default-600">
					{t('maps.layers')}
				</p>
				<div className="flex flex-wrap gap-1.5">
					{DAY_MAP_LAYERS.filter((layer) =>
						layerCounts.has(layer)
					).map((layer) => {
						const isVisible = !hiddenLayers.has(layer);
						return (
							<button
								key={layer}
								aria-pressed={isVisible}
								type="button"
								onClick={() => {
									onToggleLayer(layer);
								}}
								className={cn(
									'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-tiny font-medium transition motion-reduce:transition-none',
									CLASSNAME_FOCUS_VISIBLE_OUTLINE,
									isVisible
										? 'bg-default-200 text-foreground'
										: 'bg-default-100 text-default-500 line-through'
								)}
							>
								<span
									aria-hidden
									className={cn(
										'h-2 w-2 rounded-full',
										isVisible
											? DAY_MAP_LAYER_COLORS[layer].dot
											: 'bg-default-300'
									)}
								/>
								{t(`maps.kind.${layer}`)}
								<span className="text-default-500">
									{layerCounts.get(layer)}
								</span>
								<FontAwesomeIcon
									icon={isVisible ? faEye : faEyeSlash}
									className="text-default-400"
									size="xs"
								/>
							</button>
						);
					})}
				</div>
			</div>
			<ScrollShadow size={16} className="-mx-1 min-h-0 flex-1 px-1">
				<AnimatePresence initial={false}>
					{groups.map(({ items, layer }) => (
						<motion.div
							key={layer}
							animate={MAP_COLLAPSE_ANIMATE}
							exit={MAP_COLLAPSE_HIDDEN}
							initial={MAP_COLLAPSE_HIDDEN}
							transition={transition}
						>
							<EntityGroup
								isExpanded={!collapsedLayers.has(layer)}
								items={items}
								layer={layer}
								onSelect={onSelect}
								onToggleExpanded={handleToggleExpanded}
								selectedId={selectedId}
							/>
						</motion.div>
					))}
				</AnimatePresence>
				{groups.length === 0 && (
					<p className="py-6 text-center text-small text-default-500">
						{t('maps.list.empty')}
					</p>
				)}
			</ScrollShadow>
		</div>
	);
});

/**
 * @description The world list keeps its own scroll position, so going back
 * from a map shows the card that was used to enter it.
 */
const WorldMapScroller = memo(function WorldMapScroller({
	isMapVisible,
	onEnterMap,
	scrollTopRef,
}: Pick<IProps, 'isMapVisible' | 'onEnterMap'> & {
	scrollTopRef: RefObject<number>;
}) {
	const scrollRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		if (scrollRef.current !== null) {
			scrollRef.current.scrollTop = scrollTopRef.current;
		}
	}, [scrollTopRef]);

	const handleScroll = useCallback(() => {
		if (scrollRef.current !== null) {
			scrollTopRef.current = scrollRef.current.scrollTop;
		}
	}, [scrollTopRef]);

	// Read when a card is pressed, before the list starts to leave.
	const handleEnterMap = useCallback(
		(map: TDayMapLabel) => {
			if (scrollRef.current !== null) {
				scrollTopRef.current = scrollRef.current.scrollTop;
			}
			onEnterMap(map);
		},
		[onEnterMap, scrollTopRef]
	);

	return (
		<ScrollShadow
			ref={scrollRef}
			size={16}
			onScroll={handleScroll}
			className="min-h-0 flex-1"
		>
			<WorldMapList
				isMapVisible={isMapVisible}
				onEnterMap={handleEnterMap}
			/>
		</ScrollShadow>
	);
});

export default memo<IProps>(function MapSidebar({
	isCollapsed,
	isMapVisible,
	map,
	onEnterMap,
	onOpenWorldMap,
	onToggleCollapsed,
	...props
}) {
	const { t } = useI18n(mapsMessages);
	useCatalogLocalizationRevision();
	const { isHighAppearance } = useDesignPreferences();
	const isReducedMotion = useReducedMotion();
	const worldScrollTopRef = useRef(0);

	const title = map === null ? t('maps.world.title') : getDayMapLabel(map);
	const dlc = map === null ? 0 : getDayMapDlc(map);
	const subtitle =
		map === null
			? t('maps.world.hint')
			: dlc === 0
				? null
				: getDlcLabel(dlc);

	// The plan drawer's controls panel: a strip on wide screens, the title row
	// on narrow ones.
	const contentMotionAnimate = useMemo(
		() => ({
			height: isCollapsed ? 0 : 'auto',
			opacity: isCollapsed ? 0 : 1,
		}),
		[isCollapsed]
	);
	const contentMotionTransition = useMemo(
		() => ({
			duration: isReducedMotion ? 0 : MOTION_DURATION_S.base,
			ease: MOTION_EASE.linear,
			type: 'tween' as const,
		}),
		[isReducedMotion]
	);

	return (
		<aside
			className={cn(
				getDrawerControlsClassName({
					isControlsCollapsed: isCollapsed,
					isHighAppearance,
				}),
				// The header stays put and only the list below scrolls.
				'flex flex-col overflow-hidden',
				// Leaves most of a phone screen to the map below.
				'max-md:max-h-[50dvh] max-md:shrink-0'
			)}
		>
			<div
				className={cn(
					'relative flex min-h-9 shrink-0 items-center justify-between gap-2',
					isCollapsed && 'md:h-9 md:min-h-9 md:justify-center'
				)}
			>
				<div
					className={cn(
						'min-w-0 flex-1',
						isCollapsed &&
							'md:pointer-events-none md:absolute md:left-1/2 md:top-12 md:z-10 md:flex md:max-h-[calc(100dvh-12rem)] md:w-8 md:-translate-x-1/2 md:flex-col md:items-center md:gap-2 md:overflow-hidden'
					)}
				>
					<h1
						className={cn(
							'truncate text-small font-medium',
							isCollapsed && 'md:[writing-mode:vertical-rl]'
						)}
					>
						{title}
					</h1>
					{subtitle !== null && (
						<p
							className={cn(
								'truncate text-tiny text-foreground-500',
								isCollapsed && 'md:[writing-mode:vertical-rl]'
							)}
						>
							{subtitle}
						</p>
					)}
				</div>
				{map !== null && (
					<Button
						size="sm"
						variant="flat"
						startContent={<FontAwesomeIcon icon={faEarthAsia} />}
						onPress={onOpenWorldMap}
						className={cn('shrink-0', isCollapsed && 'md:hidden')}
					>
						{t('maps.world.title')}
					</Button>
				)}
				<Button
					isIconOnly
					radius="full"
					size="sm"
					variant={isCollapsed ? 'flat' : 'light'}
					aria-expanded={!isCollapsed}
					aria-label={t(
						isCollapsed
							? 'maps.sidebar.expand'
							: 'maps.sidebar.collapse'
					)}
					onPress={onToggleCollapsed}
					className="shrink-0"
				>
					<span
						className={cn(
							'inline-flex transition-transform duration-200 ease-linear motion-reduce:transition-none md:hidden',
							{ 'rotate-180': !isCollapsed }
						)}
					>
						<FontAwesomeIcon icon={faChevronDown} />
					</span>
					<span className="hidden md:inline-flex">
						<FontAwesomeIcon
							icon={isCollapsed ? faChevronRight : faChevronLeft}
						/>
					</span>
				</Button>
			</div>
			<motion.div
				aria-hidden={isCollapsed}
				animate={contentMotionAnimate}
				initial={false}
				transition={contentMotionTransition}
				inert={isCollapsed ? true : undefined}
				className="flex min-h-0 flex-initial flex-col overflow-hidden md:!h-auto md:w-[19rem] md:min-w-[19rem] md:flex-1 md:!opacity-100"
			>
				<div
					className={cn(
						'flex min-h-0 flex-1 flex-col pt-4 motion-reduce:transition-none md:w-[19rem] md:min-w-[19rem] md:transition-[transform,opacity] md:duration-200 md:ease-linear md:will-change-transform',
						isCollapsed
							? 'md:-translate-x-[calc(100%+1rem)] md:opacity-0'
							: 'md:translate-x-0 md:opacity-100'
					)}
				>
					{/* Keyed by map: each list starts at its top, and only fades in place. */}
					<FadeMotionDiv
						target={map ?? 'world'}
						variant="placeholder"
						className="flex min-h-0 flex-1 flex-col"
					>
						{map === null ? (
							<WorldMapScroller
								isMapVisible={isMapVisible}
								onEnterMap={onEnterMap}
								scrollTopRef={worldScrollTopRef}
							/>
						) : (
							<MapPanel map={map} {...props} />
						)}
					</FadeMotionDiv>
				</div>
			</motion.div>
		</aside>
	);
});
