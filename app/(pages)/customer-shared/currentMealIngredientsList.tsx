import { memo } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';

import { Tooltip } from '@/design/ui/components';

import { UnknownItem } from '@/(pages)/customer-shared/resultCardAtoms';
import Sprite from '@/components/sprite';

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
			{filledIngredients.map((ingredient, index) =>
				ingredient ? (
					index >= originalIngredients.length ? (
						(() => {
							const label = `点击：删除额外食材【${ingredient}】`;

							return (
								<Tooltip
									key={index}
									showArrow
									content={label}
									offset={4}
								>
									<span
										onKeyDown={checkA11yConfirmKey(() => {
											onRemoveExtraIngredient(ingredient);
										})}
										tabIndex={0}
										aria-label={label}
										className="flex items-center"
									>
										<span
											onClick={() => {
												onRemoveExtraIngredient(
													ingredient
												);
											}}
											role="button"
											tabIndex={1}
											title={ingredient}
											className="absolute flex h-10 w-10 cursor-pointer items-center justify-center rounded-small bg-foreground/50 text-background opacity-0 transition-opacity hover:opacity-100 motion-reduce:transition-none"
										>
											<FontAwesomeIcon
												icon={faCircleXmark}
												size="1x"
											/>
										</span>
										<Sprite
											target="ingredient"
											name={ingredient}
											size={2.5}
										/>
									</span>
								</Tooltip>
							);
						})()
					) : (
						<Tooltip
							key={index}
							showArrow
							content={ingredient}
							offset={4}
						>
							<Sprite
								target="ingredient"
								name={ingredient}
								size={2.5}
							/>
						</Tooltip>
					)
				) : (
					<UnknownItem key={index} title="空食材" />
				)
			)}
		</div>
	);
});
