import { memo, useRef } from 'react';

import { type Ingredient } from '@/domain/catalog/food/Ingredient';

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

import IngredientRelatedRecipes from './IngredientRelatedRecipes';
import IngredientSourceDetails from './IngredientSourceDetails';

interface IProps {
	data: TItemData<Ingredient>;
}

export default memo<IProps>(function IngredientCatalog({ data }) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const { defaultOpenedPopover, getPopoverOpenChangeProps } =
		useOpenedItemPopover(popoverCardRef);
	const { checkDefaultOpen, checkShouldEffect, getPopoverKey } =
		useItemPopoverState(defaultOpenedPopover);
	const openWindow = useViewInNewWindow();

	const hiddenDlcs = ingredientsStore.shared.hiddenItems.dlcs.use();

	return data.map(
		(
			{ description, dlc, from, id, level, name, price, tags, type },
			dataIndex
		) => (
			<ItemPopover
				key={getPopoverKey(dataIndex, name)}
				showArrow
				/** @todo Add it back after {@link https://github.com/heroui-inc/heroui/issues/3736} is fixed. */
				// backdrop={isHighAppearance ? 'blur' : 'opaque'}
				defaultOpen={checkDefaultOpen(name)}
				{...getPopoverOpenChangeProps(name)}
			>
				<ItemPopoverTrigger>
					<ItemCard
						isHoverable={checkShouldEffect(name)}
						isPressable={checkShouldEffect(name)}
						name={name}
						description={<Price>{price}</Price>}
						image={
							<Sprite target="ingredient" name={name} size={3} />
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
					<ItemShareButton name={name} />
					<ItemPopoverCard
						target="ingredient"
						id={id}
						name={name}
						description={{ description, level, price, type }}
						dlc={dlc}
						tags={{ positive: tags }}
						tagColors={INGREDIENT_TAG_STYLE}
						ref={popoverCardRef}
					>
						<IngredientRelatedRecipes
							hiddenDlcs={hiddenDlcs}
							name={name}
							openWindow={openWindow}
						/>
						<IngredientSourceDetails from={from} />
					</ItemPopoverCard>
				</ItemPopoverContent>
			</ItemPopover>
		)
	);
});
