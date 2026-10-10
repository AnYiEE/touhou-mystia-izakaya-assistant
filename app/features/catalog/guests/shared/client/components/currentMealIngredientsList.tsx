import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { memo } from 'react';

import Tooltip from '@/design/ui/components/tooltip';

import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import type { TIngredientId } from '@/domain/data/ingredients/types';

import { catalogGuestsMessages } from '@/features/catalog/guests/shared/messages';

import { useI18n } from '@/shared/i18n/useI18n';
import { checkA11yConfirmKey } from '@/shared/utilities/interaction/checkA11yConfirmKey';

import { UnknownItemIcon } from './resultCardAtoms';
import SlidingSprite from './slidingSprite';

interface IProps {
	extraIngredients: ReadonlyArray<TIngredientId>;
	onRemoveExtraIngredient: (ingredient: TIngredientId) => void;
	originalIngredients: ReadonlyArray<TIngredientId>;
}

const ingredientCatalog = IngredientCatalog.getInstance();

export default memo<IProps>(function CurrentMealIngredientsList({
	extraIngredients,
	onRemoveExtraIngredient,
	originalIngredients,
}) {
	const { t } = useI18n(catalogGuestsMessages);
	const filledIngredients = [
		...originalIngredients,
		...extraIngredients,
		...Array.from({ length: 5 }, () => null),
	].slice(0, 5);

	return (
		<div className="flex items-center gap-x-3">
			{filledIngredients.map((ingredient, index) => {
				const isExtraIngredient =
					ingredient !== null && index >= originalIngredients.length;
				const ingredientName =
					ingredient === null
						? null
						: ingredientCatalog.getDisplayPropsById(
								ingredient,
								'name'
							);
				const label = isExtraIngredient
					? t('guests.mealIngredients.removeTip', {
							name:
								ingredientName ??
								t('guests.mealIngredients.empty'),
						})
					: (ingredientName ?? t('guests.mealIngredients.empty'));

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
									title={ingredientName ?? undefined}
									className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center rounded-small bg-foreground/50 text-background opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100 active:opacity-100 group-hover:opacity-100 motion-reduce:transition-none"
								>
									<FontAwesomeIcon
										icon={faCircleXmark}
										size="1x"
									/>
								</span>
							) : null}
							{ingredient !== null && ingredientName !== null ? (
								<SlidingSprite
									target="ingredient"
									recordId={ingredient}
									fallbackKey={`empty-ingredient-${index}`}
									fallback={
										<UnknownItemIcon
											title={t(
												'guests.mealIngredients.empty'
											)}
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
											title={t(
												'guests.mealIngredients.empty'
											)}
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
