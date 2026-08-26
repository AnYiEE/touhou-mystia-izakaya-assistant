import { memo, useMemo, useRef } from 'react';

import { type IngredientCatalog as IngredientCatalogModel } from '@/domain/catalog/food/IngredientCatalog';
import { INGREDIENT_TYPE_MAP } from '@/domain/data/ingredients/ingredientFacts';
import { FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { ingredientsStore } from '@/features/catalog/items/ingredients/client/state/store';
import { INGREDIENT_TAG_STYLE } from '@/features/catalog/presentation/tagStyles';
import ItemCard from '@/features/catalog/shared/client/components/ItemCard';
import {
	ItemPopover,
	ItemPopoverContent,
	ItemPopoverTrigger,
} from '@/features/catalog/shared/client/components/ItemPopover';
import ItemPopoverCard from '@/features/catalog/shared/client/components/ItemPopoverCard';
import Price from '@/features/catalog/shared/client/components/Price';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import { useItemPopoverState } from '@/features/catalog/shared/client/hooks/useItemPopoverState';
import { useOpenedItemPopover } from '@/features/catalog/shared/client/hooks/useOpenedItemPopover';
import type { TItemData } from '@/features/catalog/shared/contracts';
import { ItemPopoverCloseButton } from '@/features/itemSharing/client/components/ItemPopoverCloseButton';
import { ItemShareButton } from '@/features/itemSharing/client/components/ItemShareButton';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';

import { numberSort } from '@/shared/utilities/sort/numberSort';

import IngredientRelatedFoods from './IngredientRelatedFoods';
import IngredientSourceDetails from './IngredientSourceDetails';

interface IProps {
	data: TItemData<IngredientCatalogModel>;
}

export default memo<IProps>(function IngredientCatalog({ data }) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const { defaultOpenedPopover, getPopoverOpenChangeProps } =
		useOpenedItemPopover(popoverCardRef, data);
	const { checkDefaultOpen, checkShouldEffect, getPopoverKey } =
		useItemPopoverState(defaultOpenedPopover);
	const openWindow = useViewInNewWindow();

	const hiddenDlcs = ingredientsStore.shared.hiddenItems.dlcs.use();
	const presentationData = useMemo(
		() =>
			data.map((item) => ({
				description: {
					description: item.description,
					level: item.level,
					price: item.price,
					type: INGREDIENT_TYPE_MAP[item.type],
				},
				item,
				tags: {
					positive: item.tags
						.toSorted(numberSort)
						.map((tag) => FOOD_TAG_MAP[tag]),
				},
			})),
		[data]
	);

	return presentationData.map(
		(
			{ description, item: { dlc, from, id, name, price }, tags },
			dataIndex
		) => (
			<ItemPopover
				key={getPopoverKey(dataIndex, id)}
				showArrow
				/** @todo Add it back after {@link https://github.com/heroui-inc/heroui/issues/3736} is fixed. */
				// backdrop={isHighAppearance ? 'blur' : 'opaque'}
				defaultOpen={checkDefaultOpen(id)}
				{...getPopoverOpenChangeProps(id)}
			>
				<ItemPopoverTrigger>
					<ItemCard
						isHoverable={checkShouldEffect(id)}
						isPressable={checkShouldEffect(id)}
						name={name}
						description={<Price>{price}</Price>}
						image={
							<Sprite
								target="ingredient"
								recordId={id}
								size={3}
							/>
						}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Ingredient Card',
								name
							);
						}}
					/>
				</ItemPopoverTrigger>
				<ItemPopoverContent>
					<ItemPopoverCloseButton />
					<ItemShareButton name={name} recordId={id} />
					<ItemPopoverCard
						target="ingredient"
						id={id}
						name={name}
						description={description}
						dlc={dlc}
						tags={tags}
						tagColors={INGREDIENT_TAG_STYLE}
						ref={popoverCardRef}
					>
						<IngredientRelatedFoods
							hiddenDlcs={hiddenDlcs}
							ingredient={id}
							openWindow={openWindow}
						/>
						<IngredientSourceDetails from={from} id={id} />
					</ItemPopoverCard>
				</ItemPopoverContent>
			</ItemPopover>
		)
	);
});
