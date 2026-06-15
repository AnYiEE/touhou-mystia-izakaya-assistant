import { memo } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';

import { Tooltip } from '@/design/ui/components';

import { UnknownItemIcon } from '@/(pages)/customer-shared/resultCardAtoms';
import SlidingSprite from '@/(pages)/customer-shared/slidingSprite';

import { type TIngredientName } from '@/data';
import { checkA11yConfirmKey, toArray } from '@/utilities';

interface IProps {
	extraIngredients: TIngredientName[];
	onRemoveExtraIngredient: (ingredient: TIngredientName) => void;
	originalIngredients: TIngredientName[];
}

export default memo<IProps>(function CurrentMealIngredientsList({
	extraIngredients,
	onRemoveExtraIngredient,
	originalIngredients,
}) {
	const filledIngredients = toArray<Array<TIngredientName | null>>(
		originalIngredients,
		extraIngredients,
		new Array<null>(5).fill(null)
	).slice(0, 5);

	return (
		<div className="flex items-center gap-x-3">
			{filledIngredients.map((ingredient, index) => {
				const isExtraIngredient =
					ingredient !== null && index >= originalIngredients.length;
				const label = isExtraIngredient
					? `点击：删除额外食材【${ingredient}】`
					: (ingredient ?? '空食材');

				return (
					<Tooltip key={index} showArrow content={label} offset={3}>
						<span
							onKeyDown={
								isExtraIngredient
									? checkA11yConfirmKey(() => {
											onRemoveExtraIngredient(ingredient);
										})
									: undefined
							}
							tabIndex={isExtraIngredient ? 0 : undefined}
							aria-label={isExtraIngredient ? label : undefined}
							className="group relative flex items-center"
						>
							{isExtraIngredient ? (
								<span
									onClick={() => {
										onRemoveExtraIngredient(ingredient);
									}}
									role="button"
									tabIndex={1}
									title={ingredient}
									className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center rounded-small bg-foreground/50 text-background opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100 motion-reduce:transition-none"
								>
									<FontAwesomeIcon
										icon={faCircleXmark}
										size="1x"
									/>
								</span>
							) : null}
							{ingredient ? (
								<SlidingSprite
									target="ingredient"
									name={ingredient}
									fallbackKey={`empty-ingredient-${index}`}
									fallback={
										<UnknownItemIcon
											title="空食材"
											iconSize={2}
											size={2.5}
										/>
									}
									size={2.5}
								/>
							) : (
								<SlidingSprite
									target="ingredient"
									isFallback
									fallbackKey={`empty-ingredient-${index}`}
									fallback={
										<UnknownItemIcon
											title="空食材"
											iconSize={2}
											size={2.5}
										/>
									}
									size={2.5}
								/>
							)}
						</span>
					</Tooltip>
				);
			})}
		</div>
	);
});
