import { cn } from '@heroui/theme';
import { memo } from 'react';

import Tooltip from '@/design/ui/components/tooltip';

import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import { getRestExtraIngredients } from '@/domain/meals/getRestExtraIngredients';

import Sprite from '@/features/catalog/shared/client/components/Sprite';

interface IProps extends Pick<HTMLDivElementAttributes, 'className'> {
	extraIngredients: ReadonlyArray<TIngredientId>;
	extraIngredientsClassName?: HTMLDivElementAttributes['className'];
	onOpenIngredient: (ingredient: TIngredientId) => void;
	originalIngredients: ReadonlyArray<TIngredientId>;
}

const ingredientCatalog = IngredientCatalog.getInstance();

export default memo<IProps>(function SavedMealIngredientsStrip({
	className,
	extraIngredients,
	extraIngredientsClassName,
	onOpenIngredient,
	originalIngredients,
}) {
	const visibleExtraIngredients = getRestExtraIngredients(
		extraIngredients,
		originalIngredients.length
	);

	return (
		<div className={cn('flex items-center gap-x-3', className)}>
			{originalIngredients.map((ingredient, index) => {
				const name = ingredientCatalog.getPropsById(ingredient, 'name');
				const label = `点击：在新窗口中查看食材【${name}】的详情`;

				return (
					<Tooltip
						key={`${ingredient}-${index}`}
						showArrow
						content={label}
						offset={4}
					>
						<Sprite
							target="ingredient"
							recordId={ingredient}
							size={2}
							onPress={() => {
								onOpenIngredient(ingredient);
							}}
							aria-label={label}
							role="button"
						/>
					</Tooltip>
				);
			})}
			{visibleExtraIngredients.length > 0 && (
				<div
					className={cn(
						'flex items-center gap-x-3 rounded bg-content2/70 outline outline-2 outline-offset-1 outline-content2',
						extraIngredientsClassName
					)}
				>
					{visibleExtraIngredients.map((ingredient, index) => {
						const name = ingredientCatalog.getPropsById(
							ingredient,
							'name'
						);
						const label = `点击：在新窗口中查看额外食材【${name}】的详情`;

						return (
							<Tooltip
								key={`${ingredient}-${index}`}
								showArrow
								content={label}
								offset={4}
							>
								<Sprite
									target="ingredient"
									recordId={ingredient}
									size={2}
									onPress={() => {
										onOpenIngredient(ingredient);
									}}
									aria-label={label}
									role="button"
								/>
							</Tooltip>
						);
					})}
				</div>
			)}
		</div>
	);
});
