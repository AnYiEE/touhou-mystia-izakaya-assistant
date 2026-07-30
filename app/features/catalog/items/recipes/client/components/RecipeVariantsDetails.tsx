'use client';

import { cn } from '@heroui/theme';
import { memo } from 'react';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import Tooltip from '@/design/ui/components/tooltip';

import type { IProcessedRecipeVariant } from '@/domain/catalog/food/types';

import Price from '@/features/catalog/shared/client/components/Price';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';

interface IProps {
	recipes: ReadonlyArray<IProcessedRecipeVariant>;
}

export default memo<IProps>(function RecipeVariantsDetails({ recipes }) {
	const openWindow = useViewInNewWindow();
	const visibleRecipes = recipes.filter(({ id }) => id !== -1);
	const maxRecipeIdLength = visibleRecipes.reduce(
		(maxLength, { id }) => Math.max(maxLength, String(id).length),
		0
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
			{visibleRecipes.map(({ cookTime, cooker, id, ingredients }) => (
				<div key={id} className="space-y-1">
					<div className="flex flex-wrap gap-4">
						<p>
							<span className="font-semibold">食谱ID：</span>
							<span
								className="inline-block font-mono"
								style={{ width: `${maxRecipeIdLength}ch` }}
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
							content={cooker}
							offset={1}
							size="sm"
						>
							<Sprite
								target="cooker"
								name={cooker}
								size={1.5}
								className="mr-2"
							/>
						</Tooltip>
						{ingredients.map((ingredient, index) => {
							const ingredientLabel = `点击：在新窗口中查看食材【${ingredient}】的详情`;
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
										name={ingredient}
										size={1.5}
										onPress={() => {
											openWindow(
												'ingredients',
												ingredient
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
			))}
		</div>
	);
});
