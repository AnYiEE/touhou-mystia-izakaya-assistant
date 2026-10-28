'use client';

import {
	faArrowRight,
	faArrowUpRightFromSquare,
	faEarthAsia,
	faLocationCrosshairs,
	faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { type ReactNode, memo, useCallback, useMemo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import FontAwesomeIconButton from '@/design/ui/components/fontAwesomeIconButton';
import Link from '@/design/ui/components/link';
import ScrollMask from '@/design/ui/components/scrollMask';

import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { PartnerCatalog } from '@/domain/catalog/items/PartnerCatalog';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import { PRAYER_REWARD_FACTS } from '@/domain/data/labels/prayerFacts';
import type {
	TDayMapHourRange,
	TDayMapLabel,
	TDayMapPoint,
} from '@/domain/data/maps/types';
import type { TPartnerId } from '@/domain/data/partners/types';
import { type ICollectionPointYieldProduct } from '@/domain/data/places/collectionYieldFacts';
import { DYNAMIC_FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import { getCollaborationLabel } from '@/domain/labels/localizedCollaborationLabels';

import {
	APP_SHELL_NAV_LABEL_KEYS,
	appShellMessages,
} from '@/features/appShell/client/messages';
import { GUEST_INFO_QUERY_PARAM } from '@/features/catalog/guests/shared/navigation';
import { catalogItemsMessages } from '@/features/catalog/items/shared/messages';
import { SPECIAL_GUEST_TAG_STYLE } from '@/features/catalog/presentation/tagStyles';
import Tags from '@/features/catalog/shared/client/components/Tags';
import { useCatalogLocalizationRevision } from '@/features/catalog/shared/client/localization/catalogLocalizationRevision';
import {
	compareFoodTagLabels,
	getBeverageTagLabel,
	getFoodTagLabel,
} from '@/features/catalog/shared/client/localization/tagLabels';
import { catalogSharedMessages } from '@/features/catalog/shared/client/messages';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';
import { mapsMessages } from '@/features/maps/client/messages';
import {
	getMapEntityTrackName,
	trackMapEvent,
} from '@/features/maps/client/model/analytics';
import {
	type TMapCatalogItem,
	getCollaborationRewardGroups,
	getInteractionCatalogItem,
	getInteractionCatalogPath,
} from '@/features/maps/client/model/dayMapCatalogItems';
import {
	type IDayMapCharacterEntity,
	type IDayMapCollectableEntity,
	type IDayMapFishingEntity,
	type IDayMapInteractionEntity,
	type IDayMapPrayerEntity,
	type IDayMapTaskEntity,
	type IDayMapTransitionEntity,
	type TDayMapEntity,
	type TDayMapLayer,
	checkTimeLimited,
	getMerchantGoods,
} from '@/features/maps/client/model/dayMapEntities';
import {
	checkDayMapLabel,
	getDayMapLabel,
} from '@/features/maps/client/model/dayMapLabels';
import { getMapSurfaceClassName } from '@/features/maps/client/model/mapStyles';
import { getMapItemKey } from '@/features/maps/client/model/mapsHistory';
import { getProductName } from '@/features/maps/client/model/productNames';
import { useDayMapEntityName } from '@/features/maps/client/model/useDayMapEntityName';
import { type IDayMapVisibility } from '@/features/maps/client/model/useDayMapVisibility';

import { useI18n } from '@/shared/i18n/useI18n';

import DayMapEntityIcon from './DayMapEntityIcon';
import MapCatalogItems from './MapCatalogItems';
import MapFullAccessButton from './MapFullAccessButton';
import MapItemPopover from './MapItemPopover';
import ProductSprite from './ProductSprite';

interface IProps {
	accessPromptRequest: number | null;
	entity: TDayMapEntity;
	map: TDayMapLabel;
	onAccessPromptOpened: () => void;
	onClose: () => void;
	onFocusPoint: (point: TDayMapPoint) => void;
	onGoTo: (map: TDayMapLabel, arrival: TDayMapPoint | null) => void;
	onOpenWorldMap: () => void;
	onPopoverOpenChange: (isOpen: boolean) => void;
	onShowCharacter: (
		map: TDayMapLabel,
		entityId: string,
		point: TDayMapPoint
	) => void;
	/** @description Item popover to open again, after going back to this entry. */
	restoredItemKey: string | null;
	visibility: IDayMapVisibility;
}

const partnerCatalog = PartnerCatalog.getInstance();
const specialGuestCatalog = SpecialGuestCatalog.getInstance();

/** @description `label：value`, as on the catalog item cards. */
const Field = memo(function Field({
	children,
	label,
}: {
	children: ReactNode;
	label: string;
}) {
	const { t } = useI18n(catalogSharedMessages);

	return (
		<p>
			<span className="font-semibold">
				{label}
				{t('catalog.itemPopover.labelSuffix')}
			</span>
			{children}
		</p>
	);
});

const Section = memo(function Section({
	children,
	label,
}: {
	children: ReactNode;
	label: string;
}) {
	const { t } = useI18n(catalogSharedMessages);

	return (
		<div className="space-y-1">
			<p className="font-semibold">
				{label}
				{t('catalog.itemPopover.labelSuffix')}
			</p>
			{children}
		</div>
	);
});

const ShowTime = memo(function ShowTime({
	showTime,
}: {
	showTime: TDayMapHourRange;
}) {
	const { t } = useI18n(mapsMessages);
	useCatalogLocalizationRevision();

	return (
		<Field label={t('maps.detail.showTime')}>
			{checkTimeLimited(showTime)
				? t('maps.detail.timeRange', {
						from: showTime[0],
						to: showTime[1],
					})
				: t('maps.detail.allDay')}
		</Field>
	);
});

interface IProductRow {
	/** @description Identical entries are separate rolls in the game. */
	count: number;
	key: string;
	product: ICollectionPointYieldProduct;
}

function groupProducts(products: ReadonlyArray<ICollectionPointYieldProduct>) {
	const rows = new Map<string, IProductRow>();
	for (const product of products) {
		const key = `${product.kind}:${product.productType}:${product.productId}:${product.amount}:${product.probability ?? ''}`;
		const row = rows.get(key);
		if (row === undefined) {
			rows.set(key, { count: 1, key, product });
		} else {
			row.count += 1;
		}
	}

	return [...rows.values()];
}

const PrayerDetail = memo(function PrayerDetail({
	entity,
	onPopoverOpenChange,
	restoredItemKey,
}: Pick<IProps, 'onPopoverOpenChange' | 'restoredItemKey'> & {
	entity: IDayMapPrayerEntity;
}) {
	const { t } = useI18n(mapsMessages);
	useCatalogLocalizationRevision();

	const rewards = PRAYER_REWARD_FACTS[entity.prayer.label];
	const restoredIndex = rewards.findIndex(
		(reward) => getMapItemKey(reward) === restoredItemKey
	);

	return (
		<Section label={t('maps.detail.rewards')}>
			<ul className="-mx-1">
				{rewards.map((reward, index) => (
					<li key={`${reward.productType}:${reward.productId}`}>
						<MapItemPopover
							defaultOpen={index === restoredIndex}
							entityId={entity.id}
							product={reward}
							onOpenChange={onPopoverOpenChange}
							className="flex w-full items-center gap-2 px-1 py-0.5 text-left"
						>
							<ProductSprite
								isDecorative
								product={reward}
								size={1.5}
								className="shrink-0"
							/>
							<span className="text-foreground">
								{getProductName(reward)}
							</span>
							<span>×{reward.amount}</span>
							<span>
								{t('maps.detail.probability', {
									probability: reward.probability,
								})}
							</span>
						</MapItemPopover>
					</li>
				))}
			</ul>
			<p>{t('maps.detail.itemHint')}</p>
		</Section>
	);
});

const FishingProductIcons = memo(function FishingProductIcons({
	entityId,
	onPopoverOpenChange,
	products,
	restoredItemKey,
}: Pick<IProps, 'onPopoverOpenChange' | 'restoredItemKey'> & {
	entityId: IDayMapFishingEntity['id'];
	products: IDayMapFishingEntity['normalProducts'];
}) {
	useCatalogLocalizationRevision();

	return (
		<div className="-mx-0.5 flex flex-wrap">
			{products.map((product) => {
				const key = getMapItemKey(product);
				return (
					<MapItemPopover
						key={key}
						defaultOpen={key === restoredItemKey}
						entityId={entityId}
						product={product}
						onOpenChange={onPopoverOpenChange}
						// A flex box drops the line box, so the button stays square.
						className="flex p-0.5"
					>
						<ProductSprite product={product} size={1.75} />
					</MapItemPopover>
				);
			})}
		</div>
	);
});

const FishingProductGroup = memo(function FishingProductGroup({
	label,
	...props
}: Pick<IProps, 'onPopoverOpenChange' | 'restoredItemKey'> & {
	entityId: IDayMapFishingEntity['id'];
	label: string;
	products: IDayMapFishingEntity['normalProducts'];
}) {
	return (
		<div className="space-y-1">
			<p className="font-medium text-default-600">{label}</p>
			<FishingProductIcons {...props} />
		</div>
	);
});

const FishingDetail = memo(function FishingDetail({
	entity,
	onPopoverOpenChange,
	restoredItemKey,
}: Pick<IProps, 'onPopoverOpenChange' | 'restoredItemKey'> & {
	entity: IDayMapFishingEntity;
}) {
	const { t } = useI18n(mapsMessages);
	const { t: tCatalogItems } = useI18n(catalogItemsMessages);
	const { t: tAppShell } = useI18n(appShellMessages);

	const { advancedProducts, collectibles, id, normalProducts } = entity;
	const hasFishingProducts =
		normalProducts.length > 0 || advancedProducts.length > 0;

	return (
		<>
			{hasFishingProducts && (
				<Section label={t('maps.detail.products')}>
					<div className="space-y-2">
						{normalProducts.length > 0 && (
							<FishingProductGroup
								label={tCatalogItems(
									'items.source.fishingRod.normal'
								)}
								entityId={id}
								products={normalProducts}
								restoredItemKey={restoredItemKey}
								onPopoverOpenChange={onPopoverOpenChange}
							/>
						)}
						{advancedProducts.length > 0 && (
							<FishingProductGroup
								label={tCatalogItems(
									'items.source.fishingRod.super'
								)}
								entityId={id}
								products={advancedProducts}
								restoredItemKey={restoredItemKey}
								onPopoverOpenChange={onPopoverOpenChange}
							/>
						)}
					</div>
				</Section>
			)}
			{collectibles.length > 0 && (
				<Section label={tAppShell('appShell.nav.fishingCollectibles')}>
					<FishingProductIcons
						entityId={id}
						products={collectibles}
						restoredItemKey={restoredItemKey}
						onPopoverOpenChange={onPopoverOpenChange}
					/>
				</Section>
			)}
			{(hasFishingProducts || collectibles.length > 0) && (
				<p>{t('maps.detail.itemHint')}</p>
			)}
		</>
	);
});

const InteractionDescription = memo(function InteractionDescription({
	entity,
}: {
	entity: IDayMapInteractionEntity;
}) {
	const { t } = useI18n(mapsMessages);

	switch (entity.interaction.kind) {
		case '200k-congratulation-pic':
		case 'congratulation-pic':
			return <p>{t('maps.detail.interaction.celebrationArtwork')}</p>;
		case 'bed':
			return <p>{t('maps.detail.interaction.bed')}</p>;
		case 'beverage-storage':
			return <p>{t('maps.detail.interaction.beverageStorage')}</p>;
		case 'cg-gallery':
			return <p>{t('maps.detail.interaction.cgGallery')}</p>;
		case 'closet':
			return <p>{t('maps.detail.interaction.closet')}</p>;
		case 'comic-book':
			return <p>{t('maps.detail.interaction.comicBook')}</p>;
		case 'cooking-table':
			return <p>{t('maps.detail.interaction.cookingTable')}</p>;
		case 'creator-box':
			return <p>{t('maps.detail.interaction.creatorBox')}</p>;
		case 'donation-box':
			return (
				<div className="space-y-1">
					<p>{t('maps.detail.interaction.donationBox')}</p>
					<ul className="list-disc space-y-0.5 pl-4">
						<li>{t('maps.detail.interaction.donationBox100')}</li>
						<li>{t('maps.detail.interaction.donationBox500')}</li>
						<li>
							{t('maps.detail.interaction.donationBox1000', {
								tag: getFoodTagLabel(
									DYNAMIC_FOOD_TAG_MAP.economical
								),
							})}
						</li>
						<li>{t('maps.detail.interaction.donationBoxFinal')}</li>
					</ul>
					<p>{t('maps.detail.interaction.donationBoxCumulative')}</p>
				</div>
			);
		case 'fanart':
			return <p>{t('maps.detail.interaction.fanart')}</p>;
		case 'food-storage':
			return <p>{t('maps.detail.interaction.foodStorage')}</p>;
		case 'jizo-doll':
			return <p>{t('maps.detail.interaction.jizoDoll')}</p>;
		case 'lunar-console':
			return <p>{t('maps.detail.interaction.lunarConsole')}</p>;
		case 'music-machine':
			return <p>{t('maps.detail.interaction.musicMachine')}</p>;
		case 'music-player':
			return <p>{t('maps.detail.interaction.musicPlayer')}</p>;
		case 'repeat-challenge':
			return <p>{t('maps.detail.interaction.repeatChallenge')}</p>;
		case 'showcase':
			return <p>{t('maps.detail.interaction.showcase')}</p>;
		case 'slot-machine':
			return <p>{t('maps.detail.interaction.slotMachine')}</p>;
		case 'telephone':
			return <p>{t('maps.detail.interaction.telephone')}</p>;
		case 'ten-thousand-sales':
			return <p>{t('maps.detail.interaction.tenThousandSales')}</p>;
	}
});

const InteractionDetail = memo(function InteractionDetail({
	entity,
	onPopoverOpenChange,
}: Pick<IProps, 'onPopoverOpenChange'> & { entity: IDayMapInteractionEntity }) {
	const { t } = useI18n(mapsMessages);
	const { t: tAppShell } = useI18n(appShellMessages);

	const { kind } = entity.interaction;
	const catalogItem = getInteractionCatalogItem(kind);
	const catalogPath = getInteractionCatalogPath(kind);

	return (
		<>
			<InteractionDescription entity={entity} />
			{catalogItem !== null && (
				<Section label={t('maps.detail.relatedCatalogItem')}>
					<MapCatalogItems
						items={[catalogItem]}
						onPopoverOpenChange={onPopoverOpenChange}
					/>
					<p>{t('maps.detail.itemHint')}</p>
				</Section>
			)}
			{catalogPath !== null && (
				<Button
					as={Link}
					fullWidth
					isExternal
					animationUnderline={false}
					color="primary"
					endContent={
						<FontAwesomeIcon icon={faArrowUpRightFromSquare} />
					}
					href={catalogPath}
					role="link"
					size="sm"
					variant="flat"
					onPress={() => {
						trackMapEvent(
							'Map Entity Button',
							`View Catalog Page:${kind}`
						);
					}}
				>
					{t('maps.detail.viewCatalogPage', {
						category: tAppShell(
							APP_SHELL_NAV_LABEL_KEYS[catalogPath]
						),
					})}
				</Button>
			)}
		</>
	);
});

const TaskDetail = memo(function TaskDetail({
	entity,
}: {
	entity: IDayMapTaskEntity;
}) {
	const { t } = useI18n(mapsMessages);
	const { key } = entity.task;
	if (key.startsWith('Bottle_')) {
		return <p>{t('maps.detail.task.bottle')}</p>;
	}
	if (key.startsWith('Lantern_')) {
		return <p>{t('maps.detail.task.lantern')}</p>;
	}
	if (key.endsWith('_Clue')) {
		return <p>{t('maps.detail.task.trace')}</p>;
	}
	return <p>{t('maps.detail.task')}</p>;
});

const CollectableDetail = memo(function CollectableDetail({
	entity,
	onPopoverOpenChange,
	restoredItemKey,
}: Pick<IProps, 'onPopoverOpenChange' | 'restoredItemKey'> & {
	entity: IDayMapCollectableEntity;
}) {
	const { t } = useI18n(mapsMessages);
	useCatalogLocalizationRevision();

	const { id, products } = entity;
	const rows = useMemo(() => groupProducts(products), [products]);
	if (products.length === 0) {
		return null;
	}

	// A product may have several rows; its first one stands for it.
	const restoredIndex = rows.findIndex(
		({ product }) => getMapItemKey(product) === restoredItemKey
	);

	return (
		<Section label={t('maps.detail.products')}>
			<ul className="-mx-1">
				{rows.map(({ count, key, product }, index) => (
					<li key={key}>
						<MapItemPopover
							defaultOpen={index === restoredIndex}
							entityId={id}
							product={product}
							onOpenChange={onPopoverOpenChange}
							className="flex w-full items-center gap-2 px-1 py-0.5 text-left"
						>
							<ProductSprite
								isDecorative
								product={product}
								size={1.5}
								className="shrink-0"
							/>
							<span className="text-foreground">
								{getProductName(product)}
							</span>
							<span>
								×
								{product.kind === 'primary'
									? product.amount * count
									: product.amount}
							</span>
							{product.kind === 'secondary' &&
								product.probability !== undefined && (
									<span>
										{count === 1
											? t('maps.detail.probability', {
													probability:
														product.probability,
												})
											: t(
													'maps.detail.probabilityRolls',
													{
														count,
														probability:
															product.probability,
													}
												)}
									</span>
								)}
						</MapItemPopover>
					</li>
				))}
			</ul>
			<p>{t('maps.detail.itemHint')}</p>
		</Section>
	);
});

const SpecialGuestDetail = memo(function SpecialGuestDetail({
	guest,
}: {
	guest: TSpecialGuestId;
}) {
	const handleViewGuest = useCallback(() => {
		trackMapEvent('Map Entity Button', `View Guest:${guest}`);
	}, [guest]);

	const localizationRevision = useCatalogLocalizationRevision();
	const { t } = useI18n(mapsMessages);

	const tagGroups = useMemo(() => {
		void localizationRevision;
		const { beverageTags, negativeTags, positiveTags } =
			specialGuestCatalog.getDisplayPropsById(guest);
		return (
			[
				[
					'maps.detail.tagsLike',
					positiveTags
						.toSorted(compareFoodTagLabels)
						.map((tag) => getFoodTagLabel(tag)),
					SPECIAL_GUEST_TAG_STYLE.positive,
				],
				[
					'maps.detail.tagsDislike',
					negativeTags
						.toSorted(compareFoodTagLabels)
						.map((tag) => getFoodTagLabel(tag)),
					SPECIAL_GUEST_TAG_STYLE.negative,
				],
				[
					'maps.detail.tagsBeverage',
					beverageTags.map((tag) => getBeverageTagLabel(tag)),
					SPECIAL_GUEST_TAG_STYLE.beverage,
				],
			] as const
		).filter(([, tags]) => tags.length > 0);
	}, [guest, localizationRevision]);

	return (
		<>
			{tagGroups.map(([label, tags, tagStyle]) => (
				<Section key={label} label={t(label)}>
					<div className="flex flex-wrap gap-x-2 gap-y-1">
						<Tags tags={tags} tagStyle={tagStyle} />
					</div>
				</Section>
			))}
			<Button
				as={Link}
				fullWidth
				isExternal
				animationUnderline={false}
				color="primary"
				endContent={<FontAwesomeIcon icon={faArrowUpRightFromSquare} />}
				href={`/special-guests/${guest}?${GUEST_INFO_QUERY_PARAM}`}
				role="link"
				size="sm"
				variant="flat"
				onPress={handleViewGuest}
			>
				{t('maps.detail.viewGuest')}
			</Button>
		</>
	);
});

const PartnerDetail = memo(function PartnerDetail({
	partner,
}: {
	partner: TPartnerId;
}) {
	useCatalogLocalizationRevision();
	const { t } = useI18n(mapsMessages);
	const openWindow = useViewInNewWindow();

	const name = partnerCatalog.getDisplayPropsById(partner, 'name');
	const handleViewPartner = useCallback(() => {
		openWindow('partners', partner, name);
	}, [name, openWindow, partner]);

	return (
		<Button
			fullWidth
			color="primary"
			size="sm"
			variant="flat"
			endContent={<FontAwesomeIcon icon={faArrowUpRightFromSquare} />}
			onPress={handleViewPartner}
		>
			{t('maps.detail.viewPartner')}
		</Button>
	);
});

const OtherMapPlaceButton = memo(function OtherMapPlaceButton({
	entityId,
	map,
	onPopoverOpenChange,
	onShowCharacter,
	point,
}: {
	entityId: string;
	map: TDayMapLabel;
	onPopoverOpenChange: IProps['onPopoverOpenChange'];
	onShowCharacter: IProps['onShowCharacter'];
	point: TDayMapPoint;
}) {
	return (
		<MapFullAccessButton
			onPopoverOpenChange={onPopoverOpenChange}
			endContent={<FontAwesomeIcon icon={faArrowRight} size="xs" />}
			size="sm"
			variant="flat"
			onAllowed={() => {
				onShowCharacter(map, entityId, point);
			}}
			className="h-7 min-w-0 px-2 text-tiny"
		>
			{getDayMapLabel(map)}
		</MapFullAccessButton>
	);
});

const CharacterDetail = memo(function CharacterDetail({
	entity,
	map,
	onFocusPoint,
	onPopoverOpenChange,
	onShowCharacter,
	restoredItemKey,
	visibility,
}: Pick<
	IProps,
	| 'map'
	| 'onFocusPoint'
	| 'onPopoverOpenChange'
	| 'onShowCharacter'
	| 'restoredItemKey'
	| 'visibility'
> & { entity: IDayMapCharacterEntity }) {
	const { t } = useI18n(mapsMessages);
	useCatalogLocalizationRevision();

	const { character, id, spots } = entity;
	const { isCookerVisible, isFoodVisible, isMapVisible, isProductVisible } =
		visibility;
	const goods =
		character.merchant === null
			? null
			: getMerchantGoods(character.merchant);
	const goodsProducts = useMemo(
		() =>
			goods === null
				? []
				: [
						...goods.ingredients.map(
							(productId) =>
								({ productId, productType: 1 }) as const
						),
						...goods.beverages.map(
							(productId) =>
								({ productId, productType: 2 }) as const
						),
					].filter(isProductVisible),
		[goods, isProductVisible]
	);
	const recipes = useMemo<ReadonlyArray<TMapCatalogItem>>(
		() =>
			goods?.foods
				.filter(isFoodVisible)
				.map((id) => ({ id, target: 'food' })) ?? [],
		[goods, isFoodVisible]
	);
	const cookers = useMemo<ReadonlyArray<TMapCatalogItem>>(
		() =>
			goods?.cookers
				.filter(isCookerVisible)
				.map((id) => ({ id, target: 'cooker' })) ?? [],
		[goods, isCookerVisible]
	);

	const otherPlaces = useMemo(
		() =>
			character.destinations.filter(
				(destination, index, destinations) =>
					destination.map !== map &&
					isMapVisible(destination.map) &&
					destinations.findIndex(
						(item) => item.map === destination.map
					) === index
			),
		[character.destinations, map, isMapVisible]
	);

	return (
		<>
			{spots.length > 1 && (
				<Section
					label={t('maps.detail.randomSpots', {
						count: spots.length,
					})}
				>
					<div className="flex flex-wrap gap-1">
						{spots.map((spot, index) => (
							<Button
								key={`${spot[0]},${spot[1]}`}
								size="sm"
								variant="flat"
								startContent={
									<FontAwesomeIcon
										icon={faLocationCrosshairs}
									/>
								}
								onPress={() => {
									trackMapEvent(
										'Map Entity Button',
										`Spot ${index + 1}:${getMapEntityTrackName(map, id)}`
									);
									onFocusPoint(spot);
								}}
								className="h-7 min-w-0 px-2 text-tiny"
							>
								{t('maps.detail.spot', { index: index + 1 })}
							</Button>
						))}
					</div>
				</Section>
			)}
			{goodsProducts.length > 0 && (
				<Section label={t('maps.detail.goods')}>
					<div className="-mx-0.5 flex flex-wrap">
						{goodsProducts.map((product) => (
							<MapItemPopover
								key={getMapItemKey(product)}
								defaultOpen={
									getMapItemKey(product) === restoredItemKey
								}
								entityId={id}
								product={product}
								onOpenChange={onPopoverOpenChange}
								// A flex box drops the line box, so the button stays square.
								className="flex p-0.5"
							>
								<ProductSprite product={product} size={1.75} />
							</MapItemPopover>
						))}
					</div>
				</Section>
			)}
			{recipes.length > 0 && (
				<Section label={t('maps.detail.recipes')}>
					<MapCatalogItems
						items={recipes}
						onPopoverOpenChange={onPopoverOpenChange}
					/>
				</Section>
			)}
			{cookers.length > 0 && (
				<Section label={t('maps.detail.cookers')}>
					<MapCatalogItems
						items={cookers}
						onPopoverOpenChange={onPopoverOpenChange}
					/>
				</Section>
			)}
			{(goodsProducts.length > 0 ||
				recipes.length > 0 ||
				cookers.length > 0) && <p>{t('maps.detail.itemHint')}</p>}
			{character.specialGuest !== null && (
				<SpecialGuestDetail guest={character.specialGuest} />
			)}
			{character.partner !== undefined && (
				<PartnerDetail partner={character.partner} />
			)}
			{otherPlaces.length > 0 && (
				<Section label={t('maps.detail.otherPlaces')}>
					<div className="flex flex-wrap gap-1">
						{otherPlaces.map((destination) => (
							<OtherMapPlaceButton
								key={destination.map}
								entityId={id}
								map={destination.map}
								onPopoverOpenChange={onPopoverOpenChange}
								onShowCharacter={onShowCharacter}
								point={destination.position}
							/>
						))}
					</div>
				</Section>
			)}
		</>
	);
});

const CollaborationDetail = memo(function CollaborationDetail({
	onPopoverOpenChange,
	visibility,
}: Pick<IProps, 'onPopoverOpenChange' | 'visibility'>) {
	useCatalogLocalizationRevision();
	const { t } = useI18n(mapsMessages);
	const { isDlcVisible } = visibility;
	const groups = useMemo(
		() =>
			getCollaborationRewardGroups()
				.map(({ items, label }) => ({
					items: items.filter(({ dlc }) => isDlcVisible(dlc)),
					label,
				}))
				.filter(({ items }) => items.length > 0),
		[isDlcVisible]
	);

	return (
		<>
			{groups.map(({ items, label }) => (
				<Section key={label} label={getCollaborationLabel(label)}>
					<MapCatalogItems
						items={items}
						onPopoverOpenChange={onPopoverOpenChange}
					/>
				</Section>
			))}
			{groups.length > 0 && <p>{t('maps.detail.itemHint')}</p>}
		</>
	);
});

const TransitionDetail = memo(function TransitionDetail({
	accessPromptRequest,
	entity,
	name,
	onAccessPromptOpened,
	onGoTo,
	onPopoverOpenChange,
}: Pick<IProps, 'onAccessPromptOpened' | 'onGoTo' | 'onPopoverOpenChange'> & {
	accessPromptRequest: number | null;
	entity: IDayMapTransitionEntity;
	name: string;
}) {
	const { t } = useI18n(mapsMessages);

	const {
		transition: { arrival, target },
	} = entity;
	const targetMap = checkDayMapLabel(target) ? target : null;
	const handleGoTo = useCallback(() => {
		if (targetMap !== null) {
			onGoTo(targetMap, arrival);
		}
	}, [arrival, onGoTo, targetMap]);

	if (targetMap === null) {
		return <p>{t('maps.detail.noMap')}</p>;
	}

	return (
		<>
			<p>{t('maps.detail.arrival', { map: name })}</p>
			<MapFullAccessButton
				autoOpenRequest={accessPromptRequest}
				onAutoOpen={onAccessPromptOpened}
				onPopoverOpenChange={onPopoverOpenChange}
				fullWidth
				color="primary"
				size="sm"
				endContent={<FontAwesomeIcon icon={faArrowRight} />}
				onAllowed={handleGoTo}
			>
				{t('maps.detail.goTo', { map: name })}
			</MapFullAccessButton>
			<p>{t('maps.detail.doubleClickTransition', { map: name })}</p>
		</>
	);
});

const EntityFields = memo(function EntityFields({
	entity,
}: {
	entity: TDayMapEntity;
}) {
	const { t } = useI18n(mapsMessages);

	const layers: TDayMapLayer[] = [entity.layer];
	if ('character' in entity) {
		const { merchant, partner, specialGuest } = entity.character;
		if (specialGuest !== null && entity.layer !== 'specialGuest') {
			layers.push('specialGuest');
		}
		if (merchant !== null && entity.layer !== 'merchant') {
			layers.push('merchant');
		}
		if (partner !== undefined && entity.layer !== 'partner') {
			layers.push('partner');
		}
	}

	const kind = (
		<Field label={t('maps.detail.kind')}>
			{layers.map((layer) => t(`maps.kind.${layer}`)).join(' / ')}
		</Field>
	);

	switch (entity.layer) {
		case 'collectable': {
			const { isOffByDefault, regenerateHours, showTime } =
				entity.collectable;
			return (
				<div className="flex flex-wrap gap-x-4 gap-y-1">
					{kind}
					<ShowTime showTime={showTime} />
					<Field label={t('maps.detail.refresh')}>
						{t('maps.detail.refreshValue', {
							hours: regenerateHours,
						})}
					</Field>
					{isOffByDefault && (
						<Field label={t('maps.detail.condition')}>
							{t('maps.detail.offByDefault')}
						</Field>
					)}
				</div>
			);
		}
		case 'merchant':
		case 'partner':
		case 'resident':
		case 'specialGuest': {
			const { isOffByDefault, showTime } = entity.character;
			return (
				<div className="flex flex-wrap gap-x-4 gap-y-1">
					{kind}
					<ShowTime showTime={showTime} />
					{isOffByDefault && (
						<Field label={t('maps.detail.condition')}>
							{t('maps.detail.offByDefault')}
						</Field>
					)}
				</div>
			);
		}
		case 'transition':
			return (
				<div className="flex flex-wrap gap-x-4 gap-y-1">
					{kind}
					{entity.transition.costsAction && (
						<Field label={t('maps.detail.passage')}>
							{t('maps.detail.costsAction')}
						</Field>
					)}
				</div>
			);
		default:
			return <div className="flex flex-wrap gap-x-4 gap-y-1">{kind}</div>;
	}
});

export default memo<IProps>(function MapDetailCard({
	accessPromptRequest,
	entity,
	map,
	onAccessPromptOpened,
	onClose,
	onFocusPoint,
	onGoTo,
	onOpenWorldMap,
	onPopoverOpenChange,
	onShowCharacter,
	restoredItemKey,
	visibility,
}) {
	const { t } = useI18n(mapsMessages);
	const { isHighAppearance } = useDesignPreferences();
	const getName = useDayMapEntityName();

	const name = getName(entity);

	const handleLocate = useCallback(() => {
		trackMapEvent(
			'Map Entity Button',
			`Locate:${getMapEntityTrackName(map, entity.id)}`
		);
		onFocusPoint(entity.position);
	}, [entity.id, entity.position, map, onFocusPoint]);

	return (
		<ScrollMask
			containerClassName={cn(
				'pointer-events-auto max-h-full rounded-large text-tiny text-default-800 shadow-medium',
				getMapSurfaceClassName(isHighAppearance)
			)}
			className="max-h-full"
		>
			<section aria-label={name} className="space-y-2 p-3">
				<header className="flex items-center gap-2 text-small text-foreground">
					<span className="shrink-0">
						<DayMapEntityIcon
							entity={entity}
							size={'character' in entity ? 2.5 : 2}
						/>
					</span>
					<p className="min-w-0 flex-1 font-bold">
						{entity.layer === 'transition'
							? t('maps.toTarget', { map: name })
							: name}
					</p>
					<FontAwesomeIconButton
						icon={faLocationCrosshairs}
						aria-label={t('maps.detail.locate')}
						size="sm"
						variant="light"
						onPress={handleLocate}
						className="shrink-0 text-default-600"
					/>
					<FontAwesomeIconButton
						icon={faXmark}
						aria-label={t('maps.detail.close')}
						size="sm"
						variant="light"
						onPress={onClose}
						className="shrink-0 text-default-600"
					/>
				</header>
				<EntityFields entity={entity} />
				{entity.layer === 'collectable' && (
					<CollectableDetail
						entity={entity}
						onPopoverOpenChange={onPopoverOpenChange}
						restoredItemKey={restoredItemKey}
					/>
				)}
				{entity.layer === 'prayer' && (
					<PrayerDetail
						entity={entity}
						onPopoverOpenChange={onPopoverOpenChange}
						restoredItemKey={restoredItemKey}
					/>
				)}
				{entity.layer === 'interaction' && (
					<InteractionDetail
						entity={entity}
						onPopoverOpenChange={onPopoverOpenChange}
					/>
				)}
				{entity.layer === 'task' && <TaskDetail entity={entity} />}
				{'character' in entity && (
					<CharacterDetail
						entity={entity}
						map={map}
						onFocusPoint={onFocusPoint}
						onPopoverOpenChange={onPopoverOpenChange}
						onShowCharacter={onShowCharacter}
						restoredItemKey={restoredItemKey}
						visibility={visibility}
					/>
				)}
				{entity.layer === 'transition' && (
					<TransitionDetail
						accessPromptRequest={accessPromptRequest ?? null}
						entity={entity}
						name={name}
						onAccessPromptOpened={onAccessPromptOpened}
						onGoTo={onGoTo}
						onPopoverOpenChange={onPopoverOpenChange}
					/>
				)}
				{entity.layer === 'teleport' && (
					<>
						<p>
							{t('maps.detail.teleport', {
								first: getDayMapLabel(
									'DLC4_ShiningNeedleCastle'
								),
								second: getDayMapLabel('DLC5_LunarCapital'),
							})}
						</p>
						<p>{t('maps.detail.doubleClickTeleport')}</p>
						<Button
							fullWidth
							color="secondary"
							size="sm"
							startContent={
								<FontAwesomeIcon icon={faEarthAsia} />
							}
							onPress={onOpenWorldMap}
						>
							{t('maps.detail.openWorldMap')}
						</Button>
					</>
				)}
				{entity.layer === 'fishing' && (
					<FishingDetail
						entity={entity}
						onPopoverOpenChange={onPopoverOpenChange}
						restoredItemKey={restoredItemKey}
					/>
				)}
				{entity.layer === 'facility' && (
					<CollaborationDetail
						onPopoverOpenChange={onPopoverOpenChange}
						visibility={visibility}
					/>
				)}
			</section>
		</ScrollMask>
	);
});
