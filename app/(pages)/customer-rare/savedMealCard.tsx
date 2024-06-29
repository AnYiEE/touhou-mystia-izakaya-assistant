import {forwardRef, Fragment, memo} from 'react';
import {Button, Card, Divider} from '@nextui-org/react';

import {Plus} from './resultCard';
import Sprite from '@/components/sprite';

import {useCustomerRareStore} from '@/stores';

interface IProps {}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function SavedMealCard(_props, ref) {
		const store = useCustomerRareStore();

		const currentCustomerName = store.share.customer.data.use()?.name;
		const savedMeal = store.page.selected.use();

		if (!currentCustomerName || !savedMeal[currentCustomerName]?.length) {
			return null;
		}

		const savedCustomerMeal = savedMeal[currentCustomerName]!;

		return (
			<Card fullWidth shadow="sm" ref={ref}>
				<div className="flex flex-col gap-3 p-4">
					{savedCustomerMeal.map(({index, recipe, beverage, ingredients, kitchenware}, loopIndex) => (
						<Fragment key={loopIndex}>
							<div className="flex flex-col items-center gap-4 md:flex-row">
								<div className="flex flex-1 flex-col flex-wrap items-center gap-3 md:flex-row md:flex-nowrap">
									<div className="flex items-center gap-2">
										<Sprite target="kitchenware" name={kitchenware} size={1.5} />
										<Sprite target="recipe" name={recipe} size={2} />
										<Plus size={0.75} />
										<Sprite target="beverage" name={beverage} size={2} />
									</div>
									<Plus size={0.75} />
									<div className="flex items-center gap-x-3">
										{ingredients.map(({index, name}) => (
											<Sprite key={index} target="ingredient" name={name} size={2} />
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
											store.page.selected[currentCustomerName]?.set(
												savedCustomerMeal.filter((meal) => meal.index !== index)
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
											store.share.selected.set({
												beverage,
												recipe: {
													ingredients,
													kitchenware,
													name: recipe,
												},
											});
										}}
										className="md:w-auto"
									>
										选择
									</Button>
								</div>
							</div>
							{loopIndex < savedCustomerMeal.length - 1 && <Divider />}
						</Fragment>
					))}
				</div>
			</Card>
		);
	})
);
