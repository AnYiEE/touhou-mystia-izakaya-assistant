'use client';

import { memo, useCallback } from 'react';

import {
	faArrowRight,
	faChevronRight,
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

import { SPECIAL_GUEST_TAG_STYLE } from '@/features/catalog/presentation/tagStyles';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import Tags from '@/features/catalog/shared/client/components/Tags';
import { useCatalogLocalizationRevision } from '@/features/catalog/shared/client/localization/catalogLocalizationRevision';
import {
	compareFoodTagLabels,
	getBeverageTagLabel,
	getFoodTagLabel,
} from '@/features/catalog/shared/client/localization/tagLabels';
import { mapsMessages } from '@/features/maps/client/messages';
import { getCharacterSpriteUrl } from '@/features/maps/client/model/assets';
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
import { getProductName } from '@/features/maps/client/model/productNames';
import { useDayMapEntityName } from '@/features/maps/client/model/useDayMapEntityName';

import { useI18n } from '@/shared/i18n/useI18n';

import MapItemPopover from './MapItemPopover';
import ProductSprite from './ProductSprite';

interface IProps {
	entity: TDayMapEntity;
	map: TDayMapLabel;
	onClose: () => void;
	onFocusPoint: (point: TDayMapPoint) => void;
	onGoTo: (map: TDayMapLabel, arrival: TDayMapPoint | null) => void;
	onOpenWorldMap: () => void;
	onShowCharacter: (
		map: TDayMapLabel,
		entityId: string,
		point: TDayMapPoint
	) => void;
}

const specialGuestCatalog = SpecialGuestCatalog.getInstance();

const KIND_CLASS_NAMES = {
	collectable: 'bg-[#f3d28b] text-[#3b2a14]',
	fishing: 'bg-sky-500 text-white',
	merchant: 'bg-success text-success-foreground',
	resident: 'bg-default-200 text-default-800',
	specialGuest: 'bg-[#ffa800] text-black',
	teleport: 'bg-fuchsia-500 text-white',
	transition: 'bg-default-800 text-default-50',
} as const;

const SECTION_TITLE_CLASS_NAME =
	'mb-1 text-tiny font-semibold uppercase tracking-wide text-default-600';

function InfoRow({
	children,
	label,
}: {
	children: ReactNodeWithoutBoolean;
	label: string;
}) {
	return (
		<div className="flex gap-3">
			<dt className="w-16 shrink-0 text-default-600">{label}</dt>
			<dd className="font-medium text-foreground">{children}</dd>
		</div>
	);
}

function Note({ children }: { children: ReactNodeWithoutBoolean }) {
	return (
		<p className="rounded-medium bg-default-100 px-2 py-1 text-default-700">
			{children}
		</p>
	);
}

function CollectableDetail({ entity }: { entity: IDayMapCollectableEntity }) {
	const { t } = useI18n(mapsMessages);
	useCatalogLocalizationRevision();

	const {
		collectable: { isOffByDefault, regenerateHours, showTime },
		products,
	} = entity;

	return (
		<div className="space-y-3">
			<dl className="space-y-1">
				<InfoRow label={t('maps.detail.showTime')}>
					{t('maps.detail.timeRange', {
						from: showTime[0],
						to: showTime[1],
					})}
				</InfoRow>
				<InfoRow label={t('maps.detail.refresh')}>
					{t('maps.detail.refreshValue', { hours: regenerateHours })}
				</InfoRow>
			</dl>
			{isOffByDefault && <Note>{t('maps.detail.offByDefault')}</Note>}
			{products.length > 0 && (
				<div>
					<p className={SECTION_TITLE_CLASS_NAME}>
						{t('maps.detail.products')}
					</p>
					<ul className="-mx-1 space-y-0.5">
						{products.map((product) => (
							<li
								key={`${product.kind}:${product.productType}:${product.productId}:${product.amount}`}
							>
								<MapItemPopover
									product={product}
									className="flex w-full items-center gap-2 px-1 py-1 text-left"
								>
									<ProductSprite
										product={product}
										size={1.5}
									/>
									<span className="font-medium text-foreground">
										{getProductName(product)}
									</span>
									<span className="text-default-600">
										×{product.amount}
									</span>
									{product.kind === 'secondary' &&
										product.probability !== undefined && (
											<span className="rounded-full bg-default-100 px-1.5 text-tiny font-medium text-default-700">
												{product.probability}%
											</span>
										)}
									<FontAwesomeIcon
										icon={faChevronRight}
										size="xs"
										className="ml-auto text-default-400"
									/>
								</MapItemPopover>
							</li>
						))}
					</ul>
					<p className="mt-1 text-tiny text-default-500">
						{t('maps.detail.itemHint')}
					</p>
				</div>
			)}
		</div>
	);
}

function SpecialGuestDetail({ guest }: { guest: TSpecialGuestId }) {
	const { t } = useI18n(mapsMessages);
	useCatalogLocalizationRevision();

	const { beverageTags, negativeTags, positiveTags } =
		specialGuestCatalog.getDisplayPropsById(guest);

	return (
		<div className="space-y-2">
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
					<div key={label}>
						<p className={SECTION_TITLE_CLASS_NAME}>{t(label)}</p>
						<div className="flex flex-wrap gap-1 text-tiny">
							<Tags tags={[...tags]} tagStyle={tagStyle} />
						</div>
					</div>
				))}
			<Button
				as={Link}
				fullWidth
				animationUnderline={false}
				color="primary"
				endContent={<FontAwesomeIcon icon={faArrowRight} />}
				href={`/special-guests/${guest}`}
				role="link"
				size="sm"
				variant="flat"
			>
				{t('maps.detail.viewGuest')}
			</Button>
		</div>
	);
}

function CharacterDetail({
	entity,
	map,
	onFocusPoint,
	onShowCharacter,
}: {
	entity: IDayMapCharacterEntity;
	map: TDayMapLabel;
	onFocusPoint: IProps['onFocusPoint'];
	onShowCharacter: IProps['onShowCharacter'];
}) {
	const { t } = useI18n(mapsMessages);
	useCatalogLocalizationRevision();

	const { character, id, spots } = entity;
	const goods =
		character.merchant === null
			? null
			: getMerchantGoods(character.merchant);
	const otherPlaces = character.destinations.filter(
		(destination, index, destinations) =>
			destination.map !== map &&
			destinations.findIndex((item) => item.map === destination.map) ===
				index
	);

	return (
		<div className="space-y-3">
			<dl className="space-y-1">
				<InfoRow label={t('maps.detail.showTime')}>
					{t('maps.detail.timeRange', {
						from: character.showTime[0],
						to: character.showTime[1],
					})}
				</InfoRow>
			</dl>
			{character.isOffByDefault && (
				<Note>{t('maps.detail.offByDefault')}</Note>
			)}
			{spots.length > 1 && (
				<div>
					<p className={SECTION_TITLE_CLASS_NAME}>
						{t('maps.detail.randomSpots', { count: spots.length })}
					</p>
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
				</div>
			)}
			{goods !== null &&
				(goods.ingredients.length > 0 ||
					goods.beverages.length > 0) && (
					<div>
						<p className={SECTION_TITLE_CLASS_NAME}>
							{t('maps.detail.goods')}
						</p>
						<div className="-mx-0.5 flex flex-wrap">
							{goods.ingredients.map((productId) => (
								<MapItemPopover
									key={`ingredient:${productId}`}
									product={{ productId, productType: 1 }}
									className="p-0.5"
								>
									<ProductSprite
										product={{ productId, productType: 1 }}
										size={1.75}
									/>
								</MapItemPopover>
							))}
							{goods.beverages.map((productId) => (
								<MapItemPopover
									key={`beverage:${productId}`}
									product={{ productId, productType: 2 }}
									className="p-0.5"
								>
									<ProductSprite
										product={{ productId, productType: 2 }}
										size={1.75}
									/>
								</MapItemPopover>
							))}
						</div>
						<p className="mt-1 text-tiny text-default-500">
							{t('maps.detail.itemHint')}
						</p>
					</div>
				)}
			{character.specialGuest !== null && (
				<SpecialGuestDetail guest={character.specialGuest} />
			)}
			{otherPlaces.length > 0 && (
				<div>
					<p className={SECTION_TITLE_CLASS_NAME}>
						{t('maps.detail.otherPlaces')}
					</p>
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
				</div>
			)}
		</div>
	);
}

function TransitionDetail({
	entity,
	name,
	onGoTo,
}: {
	entity: IDayMapTransitionEntity;
	name: string;
	onGoTo: IProps['onGoTo'];
}) {
	const { t } = useI18n(mapsMessages);

	const {
		transition: { arrival, costsAction, target },
	} = entity;
	const targetMap = checkDayMapLabel(target) ? target : null;

	return (
		<div className="space-y-2">
			{costsAction && <Note>{t('maps.detail.costsAction')}</Note>}
			{targetMap === null ? (
				<p className="text-default-600">{t('maps.detail.noMap')}</p>
			) : (
				<>
					<p className="text-default-700">
						{t('maps.detail.arrival', { map: name })}
					</p>
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
			)}
		</div>
	);
}

export default memo<IProps>(function MapDetailCard({
	entity,
	map,
	onClose,
	onFocusPoint,
	onGoTo,
	onOpenWorldMap,
	onShowCharacter,
}) {
	const { t } = useI18n(mapsMessages);
	const { isHighAppearance } = useDesignPreferences();
	const getName = useDayMapEntityName();

	const name = getName(entity);
	const kindLabel = t(`maps.kind.${entity.layer}`);

	const handleLocate = useCallback(() => {
		onFocusPoint(entity.position);
	}, [entity.position, onFocusPoint]);

	return (
		<section
			aria-label={name}
			className={cn(
				'pointer-events-auto max-h-full overflow-y-auto rounded-large border border-default-200 p-3 text-small text-foreground shadow-large dark:border-default-100',
				isHighAppearance
					? 'bg-content1/95 backdrop-blur-xl'
					: 'bg-content1'
			)}
		>
			<header className="mb-3 flex items-start gap-2">
				{'character' in entity &&
					entity.character.specialGuest === null &&
					entity.character.sprite !== null && (
						<span
							aria-hidden
							className="image-rendering-pixelated block h-12 w-10 shrink-0 bg-contain bg-bottom bg-no-repeat"
							style={{
								backgroundImage: `url('${getCharacterSpriteUrl(entity.character.sprite.file)}')`,
							}}
						/>
					)}
				{'character' in entity &&
					entity.character.specialGuest !== null && (
						<Sprite
							target="special_guest"
							recordId={entity.character.specialGuest}
							size={3}
							className="shrink-0 rounded-medium bg-default-100"
						/>
					)}
				<div className="min-w-0 flex-1">
					<span
						className={cn(
							'inline-block rounded-full px-2 py-px text-tiny font-semibold',
							KIND_CLASS_NAMES[entity.layer]
						)}
					>
						{kindLabel}
					</span>
					<h3 className="mt-0.5 truncate text-medium font-bold text-foreground">
						{entity.layer === 'transition'
							? t('maps.toTarget', { map: name })
							: name}
					</h3>
				</div>
				<FontAwesomeIconButton
					icon={faLocationCrosshairs}
					aria-label={t('maps.detail.locate')}
					variant="light"
					onPress={handleLocate}
					className="shrink-0 text-default-600"
				/>
				<FontAwesomeIconButton
					icon={faXmark}
					aria-label={t('maps.detail.close')}
					variant="light"
					onPress={onClose}
					className="shrink-0 text-default-600"
				/>
			</header>
			{entity.layer === 'collectable' && (
				<CollectableDetail entity={entity} />
			)}
			{'character' in entity && (
				<CharacterDetail
					entity={entity}
					map={map}
					onFocusPoint={onFocusPoint}
					onShowCharacter={onShowCharacter}
				/>
			)}
			{entity.layer === 'transition' && (
				<TransitionDetail entity={entity} name={name} onGoTo={onGoTo} />
			)}
			{entity.layer === 'teleport' && (
				<div className="space-y-2">
					<p className="text-default-700">
						{t('maps.detail.teleport')}
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
				</div>
			)}
			{entity.layer === 'fishing' && (
				<p className="text-default-700">{t('maps.detail.fishing')}</p>
			)}
		</section>
	);
});
