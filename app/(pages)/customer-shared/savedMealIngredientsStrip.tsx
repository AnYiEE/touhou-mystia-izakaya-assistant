'use client';

import { Tooltip, cn } from '@/design/ui/components';

import Sprite from '@/components/sprite';

import type { TIngredientName } from '@/data';

interface ISavedMealIngredientsStripProps {
	className?: string;
	extraIngredients: TIngredientName[];
	extraIngredientsClassName?: string;
	onOpenIngredient: (ingredient: TIngredientName) => void;
	originalIngredients: TIngredientName[];
}

export default function SavedMealIngredientsStrip({
	className,
	extraIngredients,
	extraIngredientsClassName,
	onOpenIngredient,
	originalIngredients,
}: ISavedMealIngredientsStripProps) {
	const visibleExtraIngredients = extraIngredients.slice(
		0,
		Math.max(5 - originalIngredients.length, 0)
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
}
