import {Fragment, forwardRef, memo} from 'react';

import {Button, Card, Divider, Tooltip} from '@nextui-org/react';

import {Plus} from './resultCard';
import {TrackCategory, trackEvent} from '@/components/analytics';
import Sprite from '@/components/sprite';

import {useCustomerNormalStore} from '@/stores';

interface IProps {}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function SavedMealCard(_props, ref) {
		const store = useCustomerNormalStore();

		const currentCustomerName = store.shared.customer.name.use();
		const savedMeal = store.persistence.meals.use();

		const instance_recipe = store.instances.recipe.get();

		if (!currentCustomerName || !savedMeal[currentCustomerName]?.length) {
			return null;
		}

		const savedCustomerMeal = savedMeal[currentCustomerName];

		return (
			<Card fullWidth shadow="sm" ref={ref}>
				<div className="flex flex-col gap-3 p-4">
					{savedCustomerMeal.map(
						({index: mealIndex, popular, beverage, recipe, extraIngredients}, loopIndex) => (
							<Fragment key={loopIndex}>
								<div className="flex flex-col items-center gap-4 md:flex-row">
									<div className="flex flex-1 flex-col flex-wrap items-center gap-3 md:flex-row md:flex-nowrap">
										<div className="flex items-center gap-2">
											<Sprite
												target="cooker"
												name={instance_recipe.getPropsByName(recipe, 'cooker')}
												size={1.5}
											/>
											<Tooltip showArrow content={recipe} offset={2}>
												<Sprite target="recipe" name={recipe} size={2} />
											</Tooltip>
											<Plus size={0.75} />
											<Tooltip showArrow content={beverage} offset={2}>
												<Sprite target="beverage" name={beverage} size={2} />
											</Tooltip>
										</div>
										<Plus size={0.75} />
										<div className="flex items-center gap-x-3">
											{[
												...instance_recipe.getPropsByName(recipe, 'ingredients'),
												...extraIngredients,
											]
												.slice(0, 5)
												.map((name, index) => (
													<Tooltip key={index} showArrow content={name} offset={2}>
														<Sprite target="ingredient" name={name} size={2} />
													</Tooltip>
												))}
										</div>
									</div>
									<div className="flex w-full justify-center gap-2 md:w-auto">
										<Button
											color="danger"
											fullWidth
											size="sm"
											variant="flat"
											onPress={() => {
												store.persistence.meals[currentCustomerName]?.set(
													savedCustomerMeal.filter((meal) => meal.index !== mealIndex)
												);
												trackEvent(
													TrackCategory.Click,
													'Remove Button',
													`${recipe} - ${beverage}${extraIngredients.length > 0 ? ` - ${extraIngredients.join(' ')}` : ''}`
												);
											}}
											className="md:w-auto"
										>
											删除
										</Button>
										<Button
											color="primary"
											fullWidth
											size="sm"
											variant="flat"
											onPress={() => {
												store.shared.customer.popular.set(popular);
												store.shared.beverage.name.set(beverage);
												store.shared.recipe.data.set({
													extraIngredients,
													name: recipe,
												});
												trackEvent(
													TrackCategory.Click,
													'Select Button',
													`${recipe} - ${beverage}${extraIngredients.length > 0 ? ` - ${extraIngredients.join(' ')}` : ''}`
												);
											}}
											className="md:w-auto"
										>
											选择
										</Button>
									</div>
								</div>
								{loopIndex < savedCustomerMeal.length - 1 && <Divider />}
							</Fragment>
						)
					)}
				</div>
			</Card>
		);
	})
);
