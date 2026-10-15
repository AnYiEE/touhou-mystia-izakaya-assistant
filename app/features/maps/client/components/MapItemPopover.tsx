'use client';

import { type ReactNode, memo, useMemo } from 'react';

import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import Link from '@/design/ui/components/link';

import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { getIngredientTypeLabel } from '@/domain/catalog/localizedCategoryLabels';
import type { ICollectionPointYieldProduct } from '@/domain/data/places/collectionYieldFacts';

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

function CatalogLink({ href, label }: { href: string; label: string }) {
	return (
		<Link
			href={href}
			size="sm"
			className="mt-1 gap-1 px-2 pb-1 font-medium"
		>
			{label}
			<FontAwesomeIcon icon={faArrowRight} size="xs" />
		</Link>
	);
}

function ItemDetails({
	product: { productId, productType },
}: Pick<IProps, 'product'>) {
	const { t } = useI18n(mapsMessages);
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
				<CatalogLink
					href={`/ingredients?select=${productId}`}
					label={t('maps.detail.viewInCatalog')}
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
				<CatalogLink
					href={`/beverages?select=${productId}`}
					label={t('maps.detail.viewInCatalog')}
				/>
			</>
		);
	}

	return null;
}

/** @description Opens the catalogue card of an ingredient or beverage in place. */
export default memo<IProps>(function MapItemPopover({
	children,
	className,
	onOpenChange,
	product,
}) {
	const { isHighAppearance } = useDesignPreferences();

	// Same surface as the detail card: the site popover is too translucent over the game art.
	const classNames = useMemo(
		() => ({ content: getMapSurfaceClassName(isHighAppearance) }),
		[isHighAppearance]
	);

	return (
		<ItemPopover
			showArrow
			placement="right"
			onOpenChange={onOpenChange}
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
