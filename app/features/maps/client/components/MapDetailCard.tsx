'use client';

import { type ReactNode, memo, useCallback } from 'react';

import {
	faArrowRight,
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

import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TDayMapLabel, TDayMapPoint } from '@/domain/data/maps/types';

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
import { mapsMessages } from '@/features/maps/client/messages';
import {
	type IDayMapCharacterEntity,
	type IDayMapCollectableEntity,
	type IDayMapTransitionEntity,
	type TDayMapEntity,
	getMerchantGoods,
} from '@/features/maps/client/model/dayMapEntities';
import {
	checkDayMapLabel,
	getDayMapLabel,
} from '@/features/maps/client/model/dayMapLabels';
import { getMapSurfaceClassName } from '@/features/maps/client/model/mapStyles';
import { getProductName } from '@/features/maps/client/model/productNames';
import { useDayMapEntityName } from '@/features/maps/client/model/useDayMapEntityName';
import type { IDayMapVisibility } from '@/features/maps/client/model/useDayMapVisibility';

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
	visibility: IDayMapVisibility;
}

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

function CollectableDetail({
	entity,
	onPopoverOpenChange,
}: Pick<IProps, 'onPopoverOpenChange'> & { entity: IDayMapCollectableEntity }) {
	const { t } = useI18n(mapsMessages);
	useCatalogLocalizationRevision();

	const { products } = entity;
	if (products.length === 0) {
		return null;
	}

	return (
		<Section label={t('maps.detail.products')}>
			<ul className="-mx-1">
				{products.map((product) => (
					<li
						key={`${product.kind}:${product.productType}:${product.productId}:${product.amount}`}
					>
						<MapItemPopover
							product={product}
							onOpenChange={onPopoverOpenChange}
							className="flex w-full items-center gap-2 px-1 py-0.5 text-left"
						>
							<ProductSprite product={product} size={1.5} />
							<span className="text-foreground">
								{getProductName(product)}
							</span>
							<span>×{product.amount}</span>
							{product.kind === 'secondary' &&
								product.probability !== undefined && (
									<span>
										{t('maps.detail.probability', {
											probability: product.probability,
										})}
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
				animationUnderline={false}
				color="primary"
				endContent={<FontAwesomeIcon icon={faArrowRight} />}
				href={`/special-guests/${guest}?${GUEST_INFO_QUERY_PARAM}`}
				role="link"
				size="sm"
				variant="flat"
			>
				{t('maps.detail.viewGuest')}
			</Button>
		</>
	);
}

function CharacterDetail({
	entity,
	map,
	onFocusPoint,
	onPopoverOpenChange,
	onShowCharacter,
	visibility,
}: Pick<
	IProps,
	| 'map'
	| 'onFocusPoint'
	| 'onPopoverOpenChange'
	| 'onShowCharacter'
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
								key={`${product.productType}:${product.productId}`}
								product={product}
								onOpenChange={onPopoverOpenChange}
								className="p-0.5"
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

	const kind = (
		<Field label={t('maps.detail.kind')}>
			{t(`maps.kind.${entity.layer}`)}
		</Field>
	);

	switch (entity.layer) {
		case 'collectable': {
			const { isOffByDefault, regenerateHours, showTime } =
				entity.collectable;
			return (
				<div className="flex flex-wrap gap-x-4 gap-y-1">
					{kind}
					<Field label={t('maps.detail.showTime')}>
						{t('maps.detail.timeRange', {
							from: showTime[0],
							to: showTime[1],
						})}
					</Field>
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
		case 'resident':
		case 'specialGuest': {
			const { isOffByDefault, showTime } = entity.character;
			return (
				<div className="flex flex-wrap gap-x-4 gap-y-1">
					{kind}
					<Field label={t('maps.detail.showTime')}>
						{t('maps.detail.timeRange', {
							from: showTime[0],
							to: showTime[1],
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
	visibility,
}) {
	const { t } = useI18n(mapsMessages);
	const { isHighAppearance } = useDesignPreferences();
	const getName = useDayMapEntityName();

	const name = getName(entity);

	const handleLocate = useCallback(() => {
		onFocusPoint(entity.position);
	}, [entity.position, onFocusPoint]);

	return (
		<section
			aria-label={name}
			className={cn(
				'pointer-events-auto max-h-full space-y-2 overflow-y-auto rounded-large p-3 text-tiny text-default-800 shadow-medium',
				getMapSurfaceClassName(isHighAppearance)
			)}
		>
			<header className="flex items-center gap-2 text-small text-foreground">
				<DayMapEntityIcon
					entity={entity}
					size={'character' in entity ? 2.5 : 2}
				/>
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
				/>
			)}
			{'character' in entity && (
				<CharacterDetail
					entity={entity}
					map={map}
					onFocusPoint={onFocusPoint}
					onPopoverOpenChange={onPopoverOpenChange}
					onShowCharacter={onShowCharacter}
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
