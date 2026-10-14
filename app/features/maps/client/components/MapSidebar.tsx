'use client';

import { memo, useMemo } from 'react';

import {
	faChevronDown,
	faDoorOpen,
	faEarthAsia,
	faEye,
	faEyeSlash,
	faFish,
	faMagnifyingGlass,
	faShuffle,
	faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import Dropdown, {
	DropdownItem,
	DropdownMenu,
	DropdownSection,
	DropdownTrigger,
} from '@/design/ui/components/dropdown';
import Input from '@/design/ui/components/input';
import ScrollShadow from '@/design/ui/components/scrollShadow';

import { getDlcLabel } from '@/domain/availability/localizedLabels';
import { DAY_MAP_EXTRA_FACTS } from '@/domain/data/maps/dayMapExtraFacts';
import type { TDayMapLabel } from '@/domain/data/maps/types';
import { ALL_MAP_LABELS } from '@/domain/data/places/placeFacts';

import { mapsMessages } from '@/features/maps/client/messages';
import {
	getCharacterSpriteUrl,
	getDayMapAssetUrl,
} from '@/features/maps/client/model/assets';
import {
	DAY_MAP_LAYERS,
	type TDayMapEntity,
	type TDayMapLayer,
} from '@/features/maps/client/model/dayMapEntities';
import {
	EXTRA_DAY_MAP_LABELS,
	checkExtraDayMapLabel,
	getDayMapDlc,
	getDayMapLabel,
} from '@/features/maps/client/model/dayMapLabels';
import { useDayMapEntityName } from '@/features/maps/client/model/useDayMapEntityName';

import { useI18n } from '@/shared/i18n/useI18n';

import ProductSprite from './ProductSprite';

interface IProps {
	className?: string;
	entities: ReadonlyArray<TDayMapEntity>;
	hiddenLayers: ReadonlySet<TDayMapLayer>;
	map: TDayMapLabel | null;
	onEnterMap: (map: TDayMapLabel) => void;
	onOpenWorldMap: () => void;
	onQueryChange: (query: string) => void;
	onSelect: (id: string) => void;
	onToggleLayer: (layer: TDayMapLayer) => void;
	query: string;
	selectedId: string | null;
}

const LAYER_DOT_CLASS_NAMES = {
	collectable: 'bg-default-500',
	fishing: 'bg-sky-500',
	merchant: 'bg-success',
	resident: 'bg-default-400',
	specialGuest: 'bg-warning',
	teleport: 'bg-secondary',
	transition: 'bg-primary',
} as const satisfies Record<TDayMapLayer, string>;

const ICON_CLASS_NAME =
	'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-tiny';

function EntityIcon({ entity }: { entity: TDayMapEntity }) {
	switch (entity.layer) {
		case 'collectable': {
			const [product] = entity.products;
			return (
				<span
					className={cn(
						ICON_CLASS_NAME,
						'bg-content2 ring-1 ring-default-200'
					)}
				>
					{product !== undefined && (
						<ProductSprite
							isDecorative
							product={product}
							size={1.25}
						/>
					)}
				</span>
			);
		}
		case 'fishing':
			return (
				<span className={cn(ICON_CLASS_NAME, 'bg-sky-500 text-white')}>
					<FontAwesomeIcon icon={faFish} />
				</span>
			);
		case 'teleport':
			return (
				<span
					className={cn(
						ICON_CLASS_NAME,
						'bg-secondary text-secondary-foreground'
					)}
				>
					<FontAwesomeIcon icon={faWandMagicSparkles} />
				</span>
			);
		case 'transition':
			return (
				<span
					className={cn(
						ICON_CLASS_NAME,
						'bg-primary text-primary-foreground'
					)}
				>
					<FontAwesomeIcon icon={faDoorOpen} />
				</span>
			);
		default:
			return entity.character.sprite === null ? (
				<span className={cn(ICON_CLASS_NAME, 'bg-default-200')} />
			) : (
				<span className={cn(ICON_CLASS_NAME, 'overflow-hidden')}>
					<span
						aria-hidden
						className="image-rendering-pixelated block h-9 w-9 translate-y-1 bg-contain bg-top bg-no-repeat"
						style={{
							backgroundImage: `url('${getCharacterSpriteUrl(entity.character.sprite.file)}')`,
						}}
					/>
				</span>
			);
	}
}

interface IMapCardProps {
	isCurrent: boolean;
	map: TDayMapLabel;
	onEnterMap: (map: TDayMapLabel) => void;
}

const MapCard = memo<IMapCardProps>(function MapCard({
	isCurrent,
	map,
	onEnterMap,
}) {
	const { t } = useI18n(mapsMessages);

	const dlc = getDayMapDlc(map);
	const kind = checkExtraDayMapLabel(map)
		? DAY_MAP_EXTRA_FACTS[map].kind
		: null;

	return (
		<button
			type="button"
			onClick={() => {
				onEnterMap(map);
			}}
			className={cn(
				'group w-full overflow-hidden rounded-medium bg-content2 text-left shadow-sm ring-1 ring-default-200 transition hover:ring-2 hover:ring-[#ffa800] motion-reduce:transition-none',
				CLASSNAME_FOCUS_VISIBLE_OUTLINE,
				{ 'ring-2 ring-[#ffa800]': isCurrent }
			)}
		>
			<span className="relative block aspect-[16/9] overflow-hidden bg-[#14110d]">
				<span
					aria-hidden
					className="block h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
					style={{
						backgroundImage: `url('${getDayMapAssetUrl(map, 'preview.webp')}')`,
					}}
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

const WorldMapList = memo<Pick<IProps, 'map' | 'onEnterMap'>>(
	function WorldMapList({ map: currentMap, onEnterMap }) {
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
							{maps.map((map) => (
								<li key={map}>
									<MapCard
										isCurrent={map === currentMap}
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

export default memo<IProps>(function MapSidebar({
	className,
	entities,
	hiddenLayers,
	map,
	onEnterMap,
	onOpenWorldMap,
	onQueryChange,
	onSelect,
	onToggleLayer,
	query,
	selectedId,
}) {
	const { t } = useI18n(mapsMessages);
	const { isHighAppearance } = useDesignPreferences();
	const getName = useDayMapEntityName();

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

	const surfaceClassName = isHighAppearance
		? 'bg-content1/70 backdrop-blur-lg'
		: 'bg-content1';

	if (map === null) {
		return (
			<aside
				className={cn(
					'flex min-h-0 flex-col gap-2 rounded-large p-3 shadow-medium',
					surfaceClassName,
					className
				)}
			>
				<header className="px-1">
					<h1 className="text-large font-semibold">
						{t('maps.world.title')}
					</h1>
					<p className="text-small text-default-600">
						{t('maps.world.hint')}
					</p>
				</header>
				<ScrollShadow className="min-h-0 flex-1">
					<WorldMapList map={map} onEnterMap={onEnterMap} />
				</ScrollShadow>
			</aside>
		);
	}

	const dlc = getDayMapDlc(map);
	const extraFact = checkExtraDayMapLabel(map)
		? DAY_MAP_EXTRA_FACTS[map]
		: null;
	const note =
		map === 'DLC3_HakureiFestival' || map === 'PartyStage'
			? t(`maps.note.${map}`)
			: extraFact?.parent
				? t('maps.note.parent', {
						map: getDayMapLabel(extraFact.parent),
					})
				: null;

	return (
		<aside
			className={cn(
				'flex min-h-0 flex-col gap-3 rounded-large p-3 shadow-medium',
				surfaceClassName,
				className
			)}
		>
			<header className="flex items-start gap-2">
				<div className="min-w-0 flex-1">
					<Dropdown>
						<DropdownTrigger>
							<button
								aria-label={t('maps.switchMap')}
								type="button"
								className={cn(
									'-mx-1 flex max-w-full items-center gap-1.5 rounded-medium px-1 text-left transition-colors hover:bg-default-100 motion-reduce:transition-none',
									CLASSNAME_FOCUS_VISIBLE_OUTLINE
								)}
							>
								<h1 className="truncate text-large font-semibold">
									{getDayMapLabel(map)}
								</h1>
								<FontAwesomeIcon
									icon={faChevronDown}
									size="xs"
									className="text-default-500"
								/>
							</button>
						</DropdownTrigger>
						<DropdownMenu
							aria-label={t('maps.switchMap')}
							disallowEmptySelection
							selectedKeys={[map]}
							selectionMode="single"
							onAction={(key) => {
								onEnterMap(key as TDayMapLabel);
							}}
							className="max-h-[60vh] overflow-y-auto"
						>
							<DropdownSection
								showDivider
								title={t('maps.world.regions')}
							>
								{ALL_MAP_LABELS.map((item) => (
									<DropdownItem key={item}>
										{getDayMapLabel(item)}
									</DropdownItem>
								))}
							</DropdownSection>
							<DropdownSection
								title={t('maps.world.otherPlaces')}
							>
								{EXTRA_DAY_MAP_LABELS.map((item) => (
									<DropdownItem key={item}>
										{getDayMapLabel(item)}
									</DropdownItem>
								))}
							</DropdownSection>
						</DropdownMenu>
					</Dropdown>
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
				<p className="mb-1 text-tiny font-medium text-default-600">
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
										: 'bg-default-100 text-default-400 line-through'
								)}
							>
								<span
									aria-hidden
									className={cn(
										'h-2 w-2 rounded-full',
										isVisible
											? LAYER_DOT_CLASS_NAMES[layer]
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
				{groups.length === 0 ? (
					<p className="py-6 text-center text-small text-default-400">
						{t('maps.list.empty')}
					</p>
				) : (
					groups.map(({ items, layer }) => (
						<section key={layer} className="mb-3">
							<h2 className="mb-1 flex items-center gap-1.5 px-1 text-tiny font-semibold text-default-600">
								<span
									aria-hidden
									className={cn(
										'h-2 w-2 rounded-full',
										LAYER_DOT_CLASS_NAMES[layer]
									)}
								/>
								{t(`maps.kind.${layer}`)}
								<span className="font-normal">
									{t('maps.list.count', {
										count: items.length,
									})}
								</span>
							</h2>
							<ul className="space-y-0.5">
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
												<EntityIcon entity={entity} />
												<span className="min-w-0 flex-1 truncate">
													{entity.layer ===
													'transition'
														? t('maps.toTarget', {
																map: name,
															})
														: name}
												</span>
												{entity.layer ===
													'collectable' &&
													(entity.collectable
														.showTime[0] !== 10 ||
														entity.collectable
															.showTime[1] !==
															18) && (
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
														<span className="shrink-0 text-tiny text-default-400">
															<FontAwesomeIcon
																icon={faShuffle}
																size="xs"
															/>
															{
																entity.spots
																	.length
															}
														</span>
													)}
											</button>
										</li>
									);
								})}
							</ul>
						</section>
					))
				)}
			</ScrollShadow>
		</aside>
	);
});
