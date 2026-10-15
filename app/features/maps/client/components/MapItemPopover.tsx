'use client';

import { type ReactNode, memo, useCallback, useMemo } from 'react';

import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';

import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { getIngredientTypeLabel } from '@/domain/catalog/localizedCategoryLabels';
import { type ICollectionPointYieldProduct } from '@/domain/data/places/collectionYieldFacts';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import BeverageSourceDetails from '@/features/catalog/items/beverages/client/components/BeverageSourceDetails';
import IngredientSourceDetails from '@/features/catalog/items/ingredients/client/components/IngredientSourceDetails';
import {
	BEVERAGE_TAG_STYLE,
	INGREDIENT_TAG_STYLE,
} from '@/features/catalog/presentation/tagStyles';
import {
	ItemPopover,
	ItemPopoverContent,
	ItemPopoverTrigger,
} from '@/features/catalog/shared/client/components/ItemPopover';
import ItemPopoverCard from '@/features/catalog/shared/client/components/ItemPopoverCard';
import { useCatalogLocalizationRevision } from '@/features/catalog/shared/client/localization/catalogLocalizationRevision';
import {
	getBeverageTagLabel,
	getFoodTagLabel,
} from '@/features/catalog/shared/client/localization/tagLabels';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';
import { mapsMessages } from '@/features/maps/client/messages';
import {
	checkBeverageId,
	checkIngredientId,
} from '@/features/maps/client/model/dayMapEntities';
import { getMapSurfaceClassName } from '@/features/maps/client/model/mapStyles';

import { useI18n } from '@/shared/i18n/useI18n';
import { numberSort } from '@/shared/utilities/sort/numberSort';

interface IProps {
	children: ReactNode;
	className?: string;
	/** @description Lets the map ignore the press that only dismisses this popover. */
	onOpenChange: (isOpen: boolean) => void;
	product: Pick<ICollectionPointYieldProduct, 'productId' | 'productType'>;
}

const beverageCatalog = BeverageCatalog.getInstance();
const ingredientCatalog = IngredientCatalog.getInstance();

/** @description Opens the catalog page in the small preview window, like other cross-page item links. */
function CatalogButton({ onPress }: { onPress: () => void }) {
	const { t } = useI18n(mapsMessages);

	return (
		<div className="self-stretch px-2 pb-2">
			<Button
				fullWidth
				color="primary"
				size="sm"
				variant="flat"
				endContent={<FontAwesomeIcon icon={faArrowUpRightFromSquare} />}
				onPress={onPress}
			>
				{t('maps.detail.viewInCatalog')}
			</Button>
		</div>
	);
}

function ItemDetails({
	product: { productId, productType },
}: Pick<IProps, 'product'>) {
	const openWindow = useViewInNewWindow();
	useCatalogLocalizationRevision();

	if (productType === 1 && checkIngredientId(productId)) {
		const { description, dlc, from, level, name, price, tags, type } =
			ingredientCatalog.getDisplayPropsById(productId);
		return (
			<>
				<ItemPopoverCard
					target="ingredient"
					id={productId}
					name={name}
					description={{
						description,
						level,
						price,
						type: getIngredientTypeLabel(type),
					}}
					dlc={dlc}
					tags={{
						positive: tags
							.toSorted(numberSort)
							.map((tag) => getFoodTagLabel(tag)),
					}}
					tagColors={INGREDIENT_TAG_STYLE}
				>
					<IngredientSourceDetails from={from} id={productId} />
				</ItemPopoverCard>
				<CatalogButton
					onPress={() => {
						openWindow('ingredients', productId, name);
					}}
				/>
			</>
		);
	}
	if (productType === 2 && checkBeverageId(productId)) {
		const { description, dlc, from, level, name, price, tags } =
			beverageCatalog.getDisplayPropsById(productId);
		return (
			<>
				<ItemPopoverCard
					target="beverage"
					id={productId}
					name={name}
					description={{ description, level, price }}
					dlc={dlc}
					tags={{
						beverage: tags.map((tag) => getBeverageTagLabel(tag)),
					}}
					tagColors={BEVERAGE_TAG_STYLE}
				>
					<BeverageSourceDetails from={from} id={productId} />
				</ItemPopoverCard>
				<CatalogButton
					onPress={() => {
						openWindow('beverages', productId, name);
					}}
				/>
			</>
		);
	}

	return null;
}

/** @description Opens the catalog card of an ingredient or beverage in place. */
export default memo<IProps>(function MapItemPopover({
	children,
	className,
	onOpenChange,
	product,
}) {
	const { isHighAppearance } = useDesignPreferences();
	const { productId, productType } = product;

	// Tracked like opening the item's card in the catalog.
	const handleOpenChange = useCallback(
		(isOpen: boolean) => {
			if (isOpen) {
				if (productType === 1 && checkIngredientId(productId)) {
					trackEvent(
						trackEvent.category.click,
						'Ingredient Card',
						ingredientCatalog.getPropsById(productId, 'name')
					);
				} else if (productType === 2 && checkBeverageId(productId)) {
					trackEvent(
						trackEvent.category.click,
						'Beverage Card',
						beverageCatalog.getPropsById(productId, 'name')
					);
				}
			}
			onOpenChange(isOpen);
		},
		[onOpenChange, productId, productType]
	);

	// Same surface as the detail card: the site popover is too translucent over the game art.
	const classNames = useMemo(
		() => ({ content: getMapSurfaceClassName(isHighAppearance) }),
		[isHighAppearance]
	);

	return (
		<ItemPopover
			showArrow
			placement="right"
			onOpenChange={handleOpenChange}
			classNames={classNames}
		>
			<ItemPopoverTrigger>
				<button
					type="button"
					className={cn(
						'rounded-medium transition-colors hover:bg-default-100 motion-reduce:transition-none',
						CLASSNAME_FOCUS_VISIBLE_OUTLINE,
						className
					)}
				>
					{children}
				</button>
			</ItemPopoverTrigger>
			<ItemPopoverContent>
				<ItemDetails product={product} />
			</ItemPopoverContent>
		</ItemPopover>
	);
});
