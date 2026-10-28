'use client';

import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import Tooltip from '@/design/ui/components/tooltip';
import { useBreakpoint } from '@/design/ui/hooks/useBreakpoint';

import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { ClothesCatalog } from '@/domain/catalog/items/ClothesCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import { DecorationCatalog } from '@/domain/catalog/items/DecorationCatalog';
import { GeneralItemCatalog } from '@/domain/catalog/items/GeneralItemCatalog';

import ClothesSourceDetails from '@/features/catalog/items/clothes/client/components/ClothesSourceDetails';
import CookerSourceDetails from '@/features/catalog/items/cookers/client/components/CookerSourceDetails';
import FoodSourceDetails from '@/features/catalog/items/foods/client/components/FoodSourceDetails';
import RecipesDetails from '@/features/catalog/items/foods/client/components/RecipesDetails';
import GeneralItemSourceDetails from '@/features/catalog/items/generalItems/client/components/GeneralItemSourceDetails';
import { FOOD_TAG_STYLE } from '@/features/catalog/presentation/tagStyles';
import {
	ItemPopover,
	ItemPopoverContent,
	ItemPopoverTrigger,
} from '@/features/catalog/shared/client/components/ItemPopover';
import ItemPopoverCard from '@/features/catalog/shared/client/components/ItemPopoverCard';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import { useCatalogLocalizationRevision } from '@/features/catalog/shared/client/localization/catalogLocalizationRevision';
import { getFoodTagLabel } from '@/features/catalog/shared/client/localization/tagLabels';
import FeatureAccessNotice from '@/features/featureAccess/client/components/FeatureAccessNotice';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';
import { mapsMessages } from '@/features/maps/client/messages';
import { type TMapCatalogItem } from '@/features/maps/client/model/dayMapCatalogItems';
import {
	MAP_POPOVER_CONTAINER_PADDING,
	MAP_POPOVER_CONTENT_MAX_WIDTH_CLASS_NAME,
	MAP_POPOVER_CONTENT_WIDTH_CLASS_NAME,
	MAP_POPOVER_SIDE_PLACEMENT_MIN_WIDTH,
	getMapSurfaceClassName,
} from '@/features/maps/client/model/mapStyles';

import { useI18n } from '@/shared/i18n/useI18n';
import { numberSort } from '@/shared/utilities/sort/numberSort';

import { useMapAccess } from './MapAccessContext';

type TOpenWindow = ReturnType<typeof useViewInNewWindow>;

interface IProps {
	items: ReadonlyArray<TMapCatalogItem>;
	onPopoverOpenChange: (isOpen: boolean) => void;
}

function getCatalogName({ id, target }: TMapCatalogItem) {
	switch (target) {
		case 'clothes':
			return ClothesCatalog.getInstance().getDisplayPropsById(id, 'name');
		case 'cooker':
			return CookerCatalog.getInstance().getDisplayPropsById(id, 'name');
		case 'decoration':
			return DecorationCatalog.getInstance().getDisplayPropsById(
				id,
				'name'
			);
		case 'food':
			return FoodCatalog.getInstance().getDisplayPropsById(id, 'name');
		case 'item':
			return GeneralItemCatalog.getInstance().getDisplayPropsById(
				id,
				'name'
			);
	}
}

function getCatalogPath({ target }: TMapCatalogItem) {
	switch (target) {
		case 'clothes':
			return 'clothes' as const;
		case 'cooker':
			return 'cookers' as const;
		case 'decoration':
			return 'decorations' as const;
		case 'food':
			return 'foods' as const;
		case 'item':
			return 'items' as const;
	}
}

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

const CatalogItemDetails = memo(function CatalogItemDetails({
	item,
	openWindow,
}: {
	item: TMapCatalogItem;
	openWindow: TOpenWindow;
}) {
	switch (item.target) {
		case 'clothes': {
			const record = ClothesCatalog.getInstance().getDisplayPropsById(
				item.id
			);
			return (
				<ItemPopoverCard
					target="clothes"
					id={item.id}
					name={record.name}
					description={{ description: record.description }}
					dlc={record.dlc}
				>
					<ClothesSourceDetails
						id={item.id}
						from={record.from}
						openWindow={openWindow}
					/>
				</ItemPopoverCard>
			);
		}
		case 'cooker': {
			const record = CookerCatalog.getInstance().getDisplayPropsById(
				item.id
			);
			return (
				<ItemPopoverCard
					target="cooker"
					id={item.id}
					name={record.name}
					description={{ description: record.description }}
					dlc={record.dlc}
				>
					<CookerSourceDetails
						id={item.id}
						from={record.from}
						openWindow={openWindow}
					/>
				</ItemPopoverCard>
			);
		}
		case 'decoration': {
			const record = DecorationCatalog.getInstance().getDisplayPropsById(
				item.id
			);
			return (
				<ItemPopoverCard
					target="decoration"
					id={item.id}
					name={record.name}
					description={{ description: record.description }}
					dlc={record.dlc}
				/>
			);
		}
		case 'food': {
			const record = FoodCatalog.getInstance().getDisplayPropsById(
				item.id
			);
			return (
				<ItemPopoverCard
					target="food"
					id={item.id}
					name={record.name}
					description={{
						description: record.description,
						level: record.level,
						price: record.price,
					}}
					details={<RecipesDetails recipes={record.recipes} />}
					dlc={record.dlc}
					tags={{
						negative: record.negativeTags
							.toSorted(numberSort)
							.map((tag) => getFoodTagLabel(tag)),
						positive: record.positiveTags
							.toSorted(numberSort)
							.map((tag) => getFoodTagLabel(tag)),
					}}
					tagColors={FOOD_TAG_STYLE}
				>
					<FoodSourceDetails
						id={item.id}
						from={record.from}
						openWindow={openWindow}
					/>
				</ItemPopoverCard>
			);
		}
		case 'item': {
			const record = GeneralItemCatalog.getInstance().getDisplayPropsById(
				item.id
			);
			return (
				<ItemPopoverCard
					target="item"
					id={item.id}
					name={record.name}
					description={{ description: record.description }}
					dlc={record.dlc}
				>
					<GeneralItemSourceDetails
						id={item.id}
						from={record.from}
						openWindow={openWindow}
					/>
				</ItemPopoverCard>
			);
		}
	}
});

const CatalogItemPopover = memo(function CatalogItemPopover({
	item,
	onOpenChange,
	openWindow,
	placement,
}: {
	item: TMapCatalogItem;
	onOpenChange: (isOpen: boolean) => void;
	openWindow: TOpenWindow;
	placement: 'right' | 'top';
}) {
	const { isHighAppearance } = useDesignPreferences();
	const { t } = useI18n(mapsMessages);
	const {
		cancelAccessRequest,
		fullReason,
		markAccountModalOrigin,
		policy,
		requestAccess,
	} = useMapAccess();

	const triggerRef = useRef<HTMLButtonElement>(null);
	const isOpeningAccountModalRef = useRef(false);
	const isOpenRef = useRef(false);
	const onOpenChangeRef = useRef(onOpenChange);
	onOpenChangeRef.current = onOpenChange;

	const [isOpen, setIsOpen] = useState(false);

	const name = getCatalogName(item);
	const path = getCatalogPath(item);

	const handleBlockedPress = useCallback(() => {
		if (triggerRef.current === null) {
			return;
		}
		requestAccess({
			moduleKey: 'maps.full',
			onAllowed: () => {
				isOpenRef.current = true;
				setIsOpen(true);
				onOpenChange(true);
			},
		});
	}, [onOpenChange, requestAccess]);

	const handleOpenChange = useCallback(
		(isOpen: boolean) => {
			isOpenRef.current = isOpen;
			setIsOpen(isOpen);
			onOpenChange(isOpen);
			if (!isOpen && !isOpeningAccountModalRef.current) {
				cancelAccessRequest();
			}
		},
		[cancelAccessRequest, onOpenChange]
	);

	const handleAccessLogin = useCallback(() => {
		markAccountModalOrigin();
		isOpeningAccountModalRef.current = true;
		isOpenRef.current = false;
		setIsOpen(false);
		onOpenChange(false);
		setTimeout(() => {
			isOpeningAccountModalRef.current = false;
		}, 250);
	}, [markAccountModalOrigin, onOpenChange]);

	useEffect(
		() => () => {
			if (isOpenRef.current) {
				onOpenChangeRef.current(false);
			}
		},
		[]
	);

	const classNames = useMemo(
		() => ({
			content: cn(
				getMapSurfaceClassName(isHighAppearance),
				MAP_POPOVER_CONTENT_MAX_WIDTH_CLASS_NAME
			),
		}),
		[isHighAppearance]
	);

	return (
		<ItemPopover
			containerPadding={MAP_POPOVER_CONTAINER_PADDING}
			showArrow
			isOpen={isOpen}
			classNames={classNames}
			onOpenChange={handleOpenChange}
			placement={placement}
		>
			<ItemPopoverTrigger
				shouldStyleExpandedState={policy.canOpenSecondaryDetails}
			>
				<button
					ref={triggerRef}
					aria-label={name}
					type="button"
					className={cn(
						'flex rounded-medium p-0.5 transition-colors hover:bg-default-100 motion-reduce:transition-none',
						CLASSNAME_FOCUS_VISIBLE_OUTLINE
					)}
					{...(policy.canOpenSecondaryDetails
						? {}
						: { onClick: handleBlockedPress })}
				>
					<Tooltip showArrow content={name} offset={1} size="sm">
						<Sprite
							aria-hidden
							target={item.target}
							recordId={item.id}
							size={1.75}
							title=""
						/>
					</Tooltip>
				</button>
			</ItemPopoverTrigger>
			<ItemPopoverContent>
				{policy.canOpenSecondaryDetails ? (
					<>
						<CatalogItemDetails
							item={item}
							openWindow={openWindow}
						/>
						<CatalogButton
							onPress={() => {
								openWindow(path, item.id, name);
							}}
						/>
					</>
				) : (
					<div
						className={cn(
							MAP_POPOVER_CONTENT_WIDTH_CLASS_NAME,
							'p-3'
						)}
					>
						<div className="space-y-2 text-tiny leading-5 text-foreground-500">
							{(fullReason ?? 'unavailable') ===
								'login-required' && (
								<p className="font-medium text-foreground-700">
									{t('maps.access.title')}
								</p>
							)}
							<p>{t('maps.access.body')}</p>
							<FeatureAccessNotice
								className="rounded-small border border-default-200/60 bg-default-50/30 p-2 text-tiny dark:border-white/10 dark:bg-white/[0.07] dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.06),0_8px_20px_rgb(0_0_0_/_0.14)]"
								isActionFullWidth
								moduleKey="maps.full"
								onLoginPress={handleAccessLogin}
								reasonOverride={fullReason ?? 'unavailable'}
								showBody={fullReason !== 'login-required'}
							/>
						</div>
					</div>
				)}
			</ItemPopoverContent>
		</ItemPopover>
	);
});

export default memo(function MapCatalogItems({
	items,
	onPopoverOpenChange,
}: IProps) {
	const openWindow = useViewInNewWindow();
	const { breakpoint: placement } = useBreakpoint(
		{ right: MAP_POPOVER_SIDE_PLACEMENT_MIN_WIDTH, top: -1 },
		'top'
	);
	useCatalogLocalizationRevision();

	return (
		<div className="-mx-0.5 flex flex-wrap">
			{items.map((item) => (
				<CatalogItemPopover
					key={`${item.target}:${item.id}`}
					item={item}
					onOpenChange={onPopoverOpenChange}
					openWindow={openWindow}
					placement={placement}
				/>
			))}
		</div>
	);
});
