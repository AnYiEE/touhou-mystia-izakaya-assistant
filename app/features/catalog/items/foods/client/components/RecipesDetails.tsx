'use client';

import { cn } from '@heroui/theme';
import { memo, useMemo } from 'react';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import Tooltip from '@/design/ui/components/tooltip';

import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import type { IProcessedRecipe } from '@/domain/catalog/food/types';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';

import { catalogItemsMessages } from '@/features/catalog/items/shared/messages';
import Price from '@/features/catalog/shared/client/components/Price';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';

import { useI18n } from '@/shared/i18n/useI18n';

interface IProps {
	recipes: ReadonlyArray<IProcessedRecipe>;
}

const cookerCatalog = CookerCatalog.getInstance();

export default memo<IProps>(function RecipesDetails({ recipes }) {
	const openWindow = useViewInNewWindow();
	const { t } = useI18n(catalogItemsMessages);
	const ingredientCatalog = IngredientCatalog.getInstance();
	const visibleRecipes = recipes.filter(({ id }) => id !== -1);
	const maxRecipeIdLength = visibleRecipes.reduce(
		(maxLength, { id }) => Math.max(maxLength, String(id).length),
		0
	);
	const recipeIdStyle = useMemo(
		() => ({ width: `${maxRecipeIdLength}ch` }),
		[maxRecipeIdLength]
	);

	if (visibleRecipes.length === 0) {
		return null;
	}

	return (
		<div
			className={cn('space-y-2', {
				'max-h-52 overflow-y-auto pr-1 scrollbar-hide':
					visibleRecipes.length > 3,
			})}
		>
			{visibleRecipes.map(({ cookTime, cookerType, id, ingredients }) => {
				const cooker = cookerCatalog.getDisplayPropsById(
					cookerCatalog.getIdByTypeAndSeries(cookerType, 0)
				);
				return (
					<div key={id} className="space-y-1">
						<div className="flex flex-wrap gap-4">
							<p>
								<span className="font-semibold">
									{t('items.recipes.id')}
								</span>
								<span
									className="inline-block font-mono"
									style={recipeIdStyle}
								>
									<Price showSymbol={false}>{id}</Price>
								</span>
							</p>
							{cookTime.min !== 0 && (
								<p>
									<Popover showArrow offset={3} size="sm">
										<Tooltip
											showArrow
											content={t(
												'items.recipes.cookTimeNote'
											)}
											offset={1}
											size="sm"
										>
											<span className="inline-flex cursor-pointer">
												<PopoverTrigger>
													<span
														tabIndex={0}
														className={cn(
															'font-semibold',
															CLASSNAME_FOCUS_VISIBLE_OUTLINE
														)}
													>
														<span className="underline-dotted-offset2">
															{t(
																'items.recipes.cookTime'
															)}
														</span>
														{t(
															'items.recipes.cookTimeSuffix'
														)}
													</span>
												</PopoverTrigger>
											</span>
										</Tooltip>
										<PopoverContent>
											{t('items.recipes.cookTimeNote')}
										</PopoverContent>
									</Popover>
									{t('items.recipes.seconds', {
										seconds: cookTime.max,
									})}
									<span className="mx-0.5">➞</span>
									{t('items.recipes.seconds', {
										seconds: cookTime.min,
									})}
								</p>
							)}
						</div>
						<div className="flex flex-wrap gap-x-2 gap-y-1 rounded border border-default-200/60 bg-default-200/40 px-1.5 py-0.5 dark:border-default-200/40 dark:bg-default-200/20">
							<Tooltip
								showArrow
								content={cooker.name}
								offset={1}
								size="sm"
							>
								<Sprite
									target="cooker"
									recordId={cooker.id}
									size={1.5}
									className="mr-2"
								/>
							</Tooltip>
							{ingredients.map((ingredient, index) => {
								const ingredientName =
									ingredientCatalog.getDisplayPropsById(
										ingredient,
										'name'
									);
								const ingredientLabel = t(
									'items.recipes.actionIngredient',
									{ label: ingredientName }
								);
								return (
									<Tooltip
										showArrow
										key={`${ingredient}-${index}`}
										content={ingredientLabel}
										offset={1}
										size="sm"
									>
										<Sprite
											target="ingredient"
											recordId={ingredient}
											size={1.5}
											onPress={() => {
												openWindow(
													'ingredients',
													ingredient,
													ingredientName
												);
											}}
											aria-label={ingredientLabel}
											role="button"
										/>
									</Tooltip>
								);
							})}
						</div>
					</div>
				);
			})}
		</div>
	);
});
