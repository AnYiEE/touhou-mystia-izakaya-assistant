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

import Price from '@/features/catalog/shared/client/components/Price';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';

interface IProps {
	recipes: ReadonlyArray<IProcessedRecipe>;
}

const cookerCatalog = CookerCatalog.getInstance();

export default memo<IProps>(function RecipesDetails({ recipes }) {
	const openWindow = useViewInNewWindow();
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
				const cooker = cookerCatalog.getPropsById(
					cookerCatalog.getIdByTypeAndSeries(cookerType, 0)
				);
				return (
					<div key={id} className="space-y-1">
						<div className="flex flex-wrap gap-4">
							<p>
								<span className="font-semibold">食谱ID：</span>
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
											content="随游戏等级提升而降低"
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
															烹饪时间
														</span>
														：
													</span>
												</PopoverTrigger>
											</span>
										</Tooltip>
										<PopoverContent>
											随游戏等级提升而降低
										</PopoverContent>
									</Popover>
									{cookTime.max}秒
									<span className="mx-0.5">➞</span>
									{cookTime.min}秒
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
									ingredientCatalog.getPropsById(
										ingredient,
										'name'
									);
								const ingredientLabel = `点击：在新窗口中查看食材【${ingredientName}】的详情`;
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
