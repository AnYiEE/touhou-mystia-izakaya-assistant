import { cn } from '@heroui/theme';
import { memo } from 'react';

import Tooltip from '@/design/ui/components/tooltip';

import type { TIngredientName } from '@/domain/data/ingredients/types';
import { getRestExtraIngredients } from '@/domain/meals/getRestExtraIngredients';

import Sprite from '@/features/catalog/shared/client/components/Sprite';

interface IProps extends Pick<HTMLDivElementAttributes, 'className'> {
	extraIngredients: TIngredientName[];
	extraIngredientsClassName?: HTMLDivElementAttributes['className'];
	onOpenIngredient: (ingredient: TIngredientName) => void;
	originalIngredients: TIngredientName[];
}

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
			{originalIngredients.map((name, index) => {
				const label = `点击：在新窗口中查看食材【${name}】的详情`;

				return (
					<Tooltip key={index} showArrow content={label} offset={4}>
						<Sprite
							target="ingredient"
							name={name}
							size={2}
							onPress={() => {
								onOpenIngredient(name);
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
					{visibleExtraIngredients.map((name, index) => {
						const label = `点击：在新窗口中查看额外食材【${name}】的详情`;

						return (
							<Tooltip
								key={index}
								showArrow
								content={label}
								offset={4}
							>
								<Sprite
									target="ingredient"
									name={name}
									size={2}
									onPress={() => {
										onOpenIngredient(name);
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
