'use client';

import { memo, useCallback, useMemo, useState } from 'react';

import {
	faChevronDown,
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

import { getDlcLabel } from '@/domain/availability/localizedLabels';
import { DAY_MAP_EXTRA_FACTS } from '@/domain/data/maps/dayMapExtraFacts';
import type { TDayMapLabel } from '@/domain/data/maps/types';
import { ALL_MAP_LABELS } from '@/domain/data/places/placeFacts';

import { mapsMessages } from '@/features/maps/client/messages';
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

import { useI18n } from '@/shared/i18n/useI18n';

import DayMapEntityIcon from './DayMapEntityIcon';

interface IProps {
	className?: string;
	entities: ReadonlyArray<TDayMapEntity>;
	hiddenLayers: ReadonlySet<TDayMapLayer>;
	isMapVisible: (map: TDayMapLabel) => boolean;
	map: TDayMapLabel | null;
	onEnterMap: (map: TDayMapLabel) => void;
	onOpenWorldMap: () => void;
	onQueryChange: (query: string) => void;
	onSelect: (id: string) => void;
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
						<ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
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

	const transition = getMapTransition(isReducedMotion);

	return (
		<section className="pb-2">
			<h2>
				<button
					aria-expanded={isExpanded}
					type="button"
					onClick={() => {
						onToggleExpanded(layer);
					}}
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
						{items.map((entity) => {
							const name = getName(entity);
							const isSelected = entity.id === selectedId;
							return (
								<li key={entity.id}>
									<button
										aria-pressed={isSelected}
										type="button"
										onClick={() => {
											onSelect(entity.id);
										}}
										className={cn(
											'flex w-full items-center gap-2 rounded-medium px-1.5 py-1 text-left text-small transition-colors motion-reduce:transition-none',
											CLASSNAME_FOCUS_VISIBLE_OUTLINE,
											isSelected
												? 'bg-[#ffa800]/15 font-medium text-foreground ring-1 ring-inset ring-[#ffa800]/60'
												: 'hover:bg-default-100'
										)}
									>
										<DayMapEntityIcon
											entity={entity}
											size={2}
										/>
										<span className="min-w-0 flex-1 truncate">
											{entity.layer === 'transition'
												? t('maps.toTarget', {
														map: name,
													})
												: name}
										</span>
										{entity.layer === 'collectable' &&
											checkTimeLimited(
												entity.collectable.showTime
											) && (
												<span className="shrink-0 rounded-full bg-[#ffa800]/15 px-1.5 text-tiny font-medium text-foreground">
													{t(
														'maps.detail.timeRange',
														{
															from: entity
																.collectable
																.showTime[0],
															to: entity
																.collectable
																.showTime[1],
														}
													)}
												</span>
											)}
										{'spots' in entity &&
											entity.spots.length > 1 && (
												<span className="shrink-0 text-tiny text-default-500">
													<FontAwesomeIcon
														icon={faShuffle}
														size="xs"
													/>
													{entity.spots.length}
												</span>
											)}
									</button>
								</li>
							);
						})}
					</motion.ul>
				)}
			</AnimatePresence>
		</section>
	);
});

interface IMapPanelProps extends Omit<IProps, 'className' | 'isMapVisible'> {
	map: TDayMapLabel;
}

function MapPanel({
	entities,
	hiddenLayers,
	map,
	onOpenWorldMap,
	onQueryChange,
	onSelect,
	onToggleLayer,
	query,
	selectedId,
}: IMapPanelProps) {
	const { t } = useI18n(mapsMessages);
	const isReducedMotion = useReducedMotion();
	const getName = useDayMapEntityName();

	const [collapsedLayers, setCollapsedLayers] = useState<
		ReadonlySet<TDayMapLayer>
	>(() => new Set());

	const handleToggleExpanded = useCallback((layer: TDayMapLayer) => {
		setCollapsedLayers((previous) => {
			const next = new Set(previous);
			if (!next.delete(layer)) {
				next.add(layer);
			}
			return next;
		});
	}, []);

	const layerCounts = useMemo(() => {
		const counts = new Map<TDayMapLayer, number>();
		for (const entity of entities) {
			counts.set(entity.layer, (counts.get(entity.layer) ?? 0) + 1);
		}
		return counts;
	}, [entities]);

	const normalizedQuery = query.trim().toLowerCase();
	const groups = useMemo(
		() =>
			DAY_MAP_LAYERS.map((layer) => ({
				items: entities.filter(
					(entity) =>
						entity.layer === layer &&
						!hiddenLayers.has(layer) &&
						(normalizedQuery === '' ||
							getName(entity)
								.toLowerCase()
								.includes(normalizedQuery))
				),
				layer,
			})).filter(({ items }) => items.length > 0),
		[entities, getName, hiddenLayers, normalizedQuery]
	);

	const dlc = getDayMapDlc(map);
	const extraFact = checkExtraDayMapLabel(map)
		? DAY_MAP_EXTRA_FACTS[map]
		: null;
	const note =
		map === 'DLC3_HakureiFestival'
			? t('maps.note.DLC3_HakureiFestival', { map: getDayMapLabel(map) })
			: map === 'PartyStage'
				? t('maps.note.PartyStage')
				: extraFact?.parent
					? t('maps.note.parent', {
							map: getDayMapLabel(extraFact.parent),
						})
					: null;
	const transition = getMapTransition(isReducedMotion);

	return (
		<>
			<header className="flex items-start gap-2">
				<div className="min-w-0 flex-1">
					<h1 className="truncate text-large font-semibold">
						{getDayMapLabel(map)}
					</h1>
					{dlc !== 0 && (
						<p className="text-tiny text-default-600">
							{getDlcLabel(dlc)}
						</p>
					)}
				</div>
				<Button
					size="sm"
					variant="flat"
					startContent={<FontAwesomeIcon icon={faEarthAsia} />}
					onPress={onOpenWorldMap}
				>
					{t('maps.world.title')}
				</Button>
			</header>
			{note !== null && (
				<p className="-mt-1 rounded-medium bg-default-100 px-2 py-1 text-tiny text-default-700">
					{note}
				</p>
			)}
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
			/>
			<div>
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
			<ScrollShadow className="-mx-1 min-h-40 flex-1 px-1">
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
		</>
	);
}

export default memo<IProps>(function MapSidebar({
	className,
	isMapVisible,
	map,
	onEnterMap,
	...props
}) {
	const { t } = useI18n(mapsMessages);
	const { isHighAppearance } = useDesignPreferences();

	return (
		<aside
			className={cn(
				'relative flex min-h-0 flex-col rounded-large p-3 shadow-medium',
				isHighAppearance
					? 'bg-content1/70 backdrop-blur-lg'
					: 'bg-content1',
				className
			)}
		>
			<FadeMotionDiv
				target={map ?? 'world'}
				className="flex min-h-0 flex-1 flex-col gap-3"
			>
				{map === null ? (
					<>
						<header className="px-1">
							<h1 className="text-large font-semibold">
								{t('maps.world.title')}
							</h1>
							<p className="text-small text-default-600">
								{t('maps.world.hint')}
							</p>
						</header>
						<ScrollShadow className="min-h-0 flex-1">
							<WorldMapList
								isMapVisible={isMapVisible}
								onEnterMap={onEnterMap}
							/>
						</ScrollShadow>
					</>
				) : (
					<MapPanel map={map} onEnterMap={onEnterMap} {...props} />
				)}
			</FadeMotionDiv>
		</aside>
	);
});
