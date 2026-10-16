'use client';

import { type ReactNode, memo, useCallback } from 'react';

import {
	faArrowRight,
	faArrowUpRightFromSquare,
	faEarthAsia,
	faLocationCrosshairs,
	faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import FontAwesomeIconButton from '@/design/ui/components/fontAwesomeIconButton';
import Link from '@/design/ui/components/link';
import Tooltip from '@/design/ui/components/tooltip';

import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { PartnerCatalog } from '@/domain/catalog/items/PartnerCatalog';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type {
	TDayMapHourRange,
	TDayMapLabel,
	TDayMapPoint,
} from '@/domain/data/maps/types';
import type { TPartnerId } from '@/domain/data/partners/types';
import { type ICollectionPointYieldProduct } from '@/domain/data/places/collectionYieldFacts';

import { GUEST_INFO_QUERY_PARAM } from '@/features/catalog/guests/shared/navigation';
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
	type IDayMapCharacterEntity,
	type IDayMapCollectableEntity,
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
import { getMapItemKey } from '@/features/maps/client/model/mapsHistory';
import { getMapSurfaceClassName } from '@/features/maps/client/model/mapStyles';
import { getProductName } from '@/features/maps/client/model/productNames';
import { useDayMapEntityName } from '@/features/maps/client/model/useDayMapEntityName';
import { type IDayMapVisibility } from '@/features/maps/client/model/useDayMapVisibility';

import { useI18n } from '@/shared/i18n/useI18n';

import DayMapEntityIcon from './DayMapEntityIcon';
import MapItemPopover from './MapItemPopover';
import ProductSprite from './ProductSprite';

interface IProps {
	entity: TDayMapEntity;
	map: TDayMapLabel;
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
function Field({ children, label }: { children: ReactNode; label: string }) {
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
}

function Section({ children, label }: { children: ReactNode; label: string }) {
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
}

function ShowTime({ showTime }: { showTime: TDayMapHourRange }) {
	const { t } = useI18n(mapsMessages);

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
}

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

function CollectableDetail({
	entity,
	onPopoverOpenChange,
	restoredItemKey,
}: Pick<IProps, 'onPopoverOpenChange' | 'restoredItemKey'> & {
	entity: IDayMapCollectableEntity;
}) {
	const { t } = useI18n(mapsMessages);
	useCatalogLocalizationRevision();

	const { id, products } = entity;
	if (products.length === 0) {
		return null;
	}

	const rows = groupProducts(products);
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
}

function SpecialGuestDetail({ guest }: { guest: TSpecialGuestId }) {
	const handleViewGuest = useCallback(() => {
		trackMapEvent('Map Entity Button', `View Guest:${guest}`);
	}, [guest]);

	const { t } = useI18n(mapsMessages);
	useCatalogLocalizationRevision();

	const { beverageTags, negativeTags, positiveTags } =
		specialGuestCatalog.getDisplayPropsById(guest);

	return (
		<>
			{(
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
			)
				.filter(([, tags]) => tags.length > 0)
				.map(([label, tags, tagStyle]) => (
					<Section key={label} label={t(label)}>
						<div className="flex flex-wrap gap-x-2 gap-y-1">
							<Tags tags={[...tags]} tagStyle={tagStyle} />
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
}

function PartnerDetail({ partner }: { partner: TPartnerId }) {
	const { t } = useI18n(mapsMessages);
	const openWindow = useViewInNewWindow();
	useCatalogLocalizationRevision();

	const name = partnerCatalog.getDisplayPropsById(partner, 'name');

	return (
		<Button
			fullWidth
			color="primary"
			size="sm"
			variant="flat"
			endContent={<FontAwesomeIcon icon={faArrowUpRightFromSquare} />}
			onPress={() => {
				openWindow('partners', partner, name);
			}}
		>
			{t('maps.detail.viewPartner')}
		</Button>
	);
}

function CharacterDetail({
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
	const goods =
		character.merchant === null
			? null
			: getMerchantGoods(character.merchant);
	const goodsProducts =
		goods === null
			? []
			: [
					...goods.ingredients.map(
						(productId) => ({ productId, productType: 1 }) as const
					),
					...goods.beverages.map(
						(productId) => ({ productId, productType: 2 }) as const
					),
				].filter(visibility.isProductVisible);
	const otherPlaces = character.destinations.filter(
		(destination, index, destinations) =>
			destination.map !== map &&
			visibility.isMapVisible(destination.map) &&
			destinations.findIndex((item) => item.map === destination.map) ===
				index
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
					<p>{t('maps.detail.itemHint')}</p>
				</Section>
			)}
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
							<Button
								key={destination.map}
								size="sm"
								variant="flat"
								endContent={
									<FontAwesomeIcon
										icon={faArrowRight}
										size="xs"
									/>
								}
								onPress={() => {
									onShowCharacter(
										destination.map,
										id,
										destination.position
									);
								}}
								className="h-7 min-w-0 px-2 text-tiny"
							>
								{getDayMapLabel(destination.map)}
							</Button>
						))}
					</div>
				</Section>
			)}
		</>
	);
}

function TransitionDetail({
	entity,
	name,
	onGoTo,
}: Pick<IProps, 'onGoTo'> & { entity: IDayMapTransitionEntity; name: string }) {
	const { t } = useI18n(mapsMessages);

	const {
		transition: { arrival, target },
	} = entity;
	const targetMap = checkDayMapLabel(target) ? target : null;

	if (targetMap === null) {
		return <p>{t('maps.detail.noMap')}</p>;
	}

	return (
		<>
			<p>{t('maps.detail.arrival', { map: name })}</p>
			<Button
				fullWidth
				color="primary"
				size="sm"
				endContent={<FontAwesomeIcon icon={faArrowRight} />}
				onPress={() => {
					onGoTo(targetMap, arrival);
				}}
			>
				{t('maps.detail.goTo', { map: name })}
			</Button>
		</>
	);
}

function EntityFields({ entity }: { entity: TDayMapEntity }) {
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
}

export default memo<IProps>(function MapDetailCard({
	entity,
	map,
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
		<section
			aria-label={name}
			className={cn(
				'pointer-events-auto max-h-full space-y-2 overflow-y-auto rounded-large p-3 text-tiny text-default-800 shadow-medium',
				getMapSurfaceClassName(isHighAppearance)
			)}
		>
			<header className="flex items-center gap-2 text-small text-foreground">
				<Tooltip showArrow content={name} offset={4}>
					<span className="shrink-0">
						<DayMapEntityIcon
							entity={entity}
							size={'character' in entity ? 2.5 : 2}
						/>
					</span>
				</Tooltip>
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
				<TransitionDetail entity={entity} name={name} onGoTo={onGoTo} />
			)}
			{entity.layer === 'teleport' && (
				<>
					<p>
						{t('maps.detail.teleport', {
							first: getDayMapLabel('DLC4_ShiningNeedleCastle'),
							second: getDayMapLabel('DLC5_LunarCapital'),
						})}
					</p>
					<Button
						fullWidth
						color="secondary"
						size="sm"
						startContent={<FontAwesomeIcon icon={faEarthAsia} />}
						onPress={onOpenWorldMap}
					>
						{t('maps.detail.openWorldMap')}
					</Button>
				</>
			)}
			{entity.layer === 'fishing' && <p>{t('maps.detail.fishing')}</p>}
		</section>
	);
});
