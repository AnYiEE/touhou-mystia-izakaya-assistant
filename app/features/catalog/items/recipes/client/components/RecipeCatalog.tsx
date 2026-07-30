import { memo, useRef } from 'react';

import { type Recipe } from '@/domain/catalog/food/Recipe';
import { DARK_MATTER_META_MAP } from '@/domain/data/tags/tagFacts';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { RECIPE_TAG_STYLE } from '@/features/catalog/presentation/tagStyles';
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

import RecipeSourceDetails from './RecipeSourceDetails';

interface IProps {
	data: TItemData<Recipe>;
}

export default memo<IProps>(function RecipeCatalog({ data }) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const { defaultOpenedPopover, getPopoverOpenChangeProps } =
		useOpenedItemPopover(popoverCardRef);
	const { checkDefaultOpen, checkShouldEffect, getPopoverKey } =
		useItemPopoverState(defaultOpenedPopover);
	const openWindow = useViewInNewWindow();

	return data.map(
		(
			{
				cookTime,
				cooker,
				description,
				dlc,
				from,
				id,
				ingredients,
				level,
				name,
				negativeTags,
				positiveTags,
				price,
				recipeId,
			},
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
						image={<Sprite target="recipe" name={name} size={3} />}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Recipe Card',
								name
							);
						}}
					/>
				</ItemPopoverTrigger>
				<ItemPopoverContent>
					<ItemPopoverCloseButton />
					<ItemShareButton name={name} />
					<ItemPopoverCard
						target="recipe"
						id={id}
						recipeId={recipeId}
						name={name}
						description={{ description, level, price }}
						dlc={dlc}
						cooker={
							name === DARK_MATTER_META_MAP.name ? null : cooker
						}
						ingredients={ingredients}
						tags={{
							negative: negativeTags,
							positive: positiveTags,
						}}
						tagColors={RECIPE_TAG_STYLE}
						ref={popoverCardRef}
					>
						<RecipeSourceDetails
							cookTime={cookTime}
							from={from}
							openWindow={openWindow}
						/>
					</ItemPopoverCard>
				</ItemPopoverContent>
			</ItemPopover>
		)
	);
});
