'use client';

import {
	type ReactNode,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import { useBreakpoint } from '@/design/ui/hooks/useBreakpoint';

import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import { getIngredientTypeLabel } from '@/domain/catalog/localizedCategoryLabels';

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
import { trackMapEvent } from '@/features/maps/client/model/analytics';
import {
	checkBeverageId,
	checkIngredientId,
} from '@/features/maps/client/model/dayMapEntities';
import {
	type TMapItemProduct,
	clearOpenedMapItem,
	getMapItemKey,
	rememberOpenedMapItem,
} from '@/features/maps/client/model/mapsHistory';
import { getMapSurfaceClassName } from '@/features/maps/client/model/mapStyles';

import { useI18n } from '@/shared/i18n/useI18n';
import { numberSort } from '@/shared/utilities/sort/numberSort';

import { MapLinkLeaveContext } from './MapLinks';

interface IProps {
	children: ReactNode;
	className?: string;
	/** @description Opens on mount, when going back to the entry it was left from. */
	defaultOpen?: boolean;
	/** @description Map entity whose card holds the popover. */
	entityId: string;
	/** @description Lets the map ignore the press that only dismisses this popover; also reported on unmount. */
	onOpenChange: (isOpen: boolean) => void;
	product: TMapItemProduct;
}

const beverageCatalog = BeverageCatalog.getInstance();
const currencyItemCatalog = CurrencyItemCatalog.getInstance();
const ingredientCatalog = IngredientCatalog.getInstance();

/** @description Opens the catalog page in the small preview window, like other cross-page item links. */
const CatalogButton = memo(function CatalogButton({
	onPress,
}: {
	onPress: () => void;
}) {
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
});

const ItemDetails = memo(function ItemDetails({
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
	if (productType === 'currency') {
		const { description, dlc, name } =
			currencyItemCatalog.getDisplayPropsById(productId);
		return (
			<>
				<ItemPopoverCard
					target="currency_item"
					id={productId}
					name={name}
					description={{ description }}
					dlc={dlc}
				/>
				<CatalogButton
					onPress={() => {
						openWindow('currencies', productId, name);
					}}
				/>
			</>
		);
	}

	return null;
});

/** @description Opens the catalog card of a map product in place. */
export default memo<IProps>(function MapItemPopover({
	children,
	className,
	defaultOpen = false,
	entityId,
	onOpenChange,
	product,
}) {
	const { isHighAppearance } = useDesignPreferences();
	const { breakpoint: placement } = useBreakpoint(
		{ right: 640, top: -1 },
		'top'
	);
	const { productId, productType } = product;
	const isOpenRef = useRef(defaultOpen);
	const [isOpen, setIsOpen] = useState(defaultOpen);

	useEffect(() => {
		if (defaultOpen && !isOpenRef.current) {
			isOpenRef.current = true;
			setIsOpen(true);
			onOpenChange(true);
		}
	}, [defaultOpen, onOpenChange]);

	// The card unmounts its popovers without them reporting that they closed.
	useEffect(() => {
		if (isOpenRef.current) {
			onOpenChange(true);
		}
		return () => {
			if (isOpenRef.current) {
				onOpenChange(false);
			}
		};
	}, [onOpenChange]);

	// A map link in the popover leaves this entry; going back opens it again.
	const itemKey = getMapItemKey(product);
	const handleLinkLeave = useCallback(() => {
		rememberOpenedMapItem({ entityId, itemKey });
	}, [entityId, itemKey]);

	// Tracked like opening the item's card in the catalog.
	const handleOpenChange = useCallback(
		(isOpen: boolean) => {
			isOpenRef.current = isOpen;
			setIsOpen(isOpen);
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
				} else if (productType === 'currency') {
					trackEvent(
						trackEvent.category.click,
						'Currency Card',
						currencyItemCatalog.getPropsById(productId, 'name')
					);
				}
			}
			if (!isOpen) {
				clearOpenedMapItem();
				trackMapEvent(
					'Map Entity Button',
					`Close Item:${entityId}/${itemKey}`
				);
			}
			onOpenChange(isOpen);
		},
		[entityId, itemKey, onOpenChange, productId, productType]
	);

	// Same surface as the detail card: the site popover is too translucent over the game art.
	const classNames = useMemo(
		() => ({
			content: cn(
				getMapSurfaceClassName(isHighAppearance),
				'max-w-[calc(100vw-1rem)]'
			),
		}),
		[isHighAppearance]
	);

	return (
		<ItemPopover
			showArrow
			isOpen={isOpen}
			placement={placement}
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
				<MapLinkLeaveContext value={handleLinkLeave}>
					<ItemDetails product={product} />
				</MapLinkLeaveContext>
			</ItemPopoverContent>
		</ItemPopover>
	);
});
