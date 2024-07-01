import {forwardRef, memo, useMemo} from 'react';
import clsx from 'clsx';

import {Avatar, Card, Divider, Popover, PopoverContent, PopoverTrigger, Tooltip} from '@nextui-org/react';
import {faArrowsRotate} from '@fortawesome/free-solid-svg-icons';

import TagGroup from './tagGroup';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Tags from '@/components/tags';
import Sprite from '@/components/sprite';

import {customerTagStyleMap} from './constants';
import {useCustomerRareStore} from '@/stores';
import {getIntersection, pinyinSort} from '@/utils';

interface IProps {}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function CustomerCard(_props, ref) {
		const store = useCustomerRareStore();

		const currentCustomer = store.share.customer.data.use();
		const selectedCustomerBeverageTags = store.share.customer.beverageTags.use();
		const selectedCustomerPositiveTags = store.share.customer.positiveTags.use();

		const currentBeverageName = store.share.beverage.name.use();
		const currentRecipe = store.share.recipe.data.use();

		const instance_beverage = store.instances.beverage.get();
		const instance_ingredient = store.instances.ingredient.get();
		const instance_recipe = store.instances.recipe.get();

		const hasSelected = useMemo(
			() =>
				Boolean(
					currentBeverageName ||
						currentRecipe ||
						(typeof selectedCustomerBeverageTags !== 'string' && selectedCustomerBeverageTags.size > 0) ||
						(typeof selectedCustomerPositiveTags !== 'string' && selectedCustomerPositiveTags.size > 0)
				),
			[currentBeverageName, currentRecipe, selectedCustomerBeverageTags, selectedCustomerPositiveTags]
		);

		if (!currentCustomer) {
			return null;
		}

		const instance_customer = store.instances[currentCustomer.target as 'customer_rare'].get();

		return (
			<Card fullWidth shadow="sm" ref={ref}>
				<div className="flex flex-col gap-3 p-4 md:flex-row">
					<div className="flex flex-col items-center justify-center text-center">
						<Avatar
							radius="full"
							icon={<Sprite target={currentCustomer.target} name={currentCustomer.name} size={4} />}
							classNames={{
								base: 'h-12 w-12 lg:h-16 lg:w-16',
								icon: 'inline-table lg:inline-block',
							}}
						/>
						<div className="flex flex-col gap-2 text-nowrap pt-2">
							{(() => {
								const {name: currentCustomerName} = currentCustomer;
								const [dlc, places, price] = instance_customer.getPropsByName(
									currentCustomerName,
									'dlc',
									'places',
									'price'
								);
								const clonePlace = structuredClone(places as string[]);
								const mainPlace = clonePlace.shift();
								const content =
									clonePlace.length > 0
										? `其他出没地点：${clonePlace.join('、')}`
										: '暂未收录其他出没地点';
								return (
									<>
										<p className="text-md font-semibold">{currentCustomerName}</p>
										<span className="text-xs font-medium text-default-500">
											<span className="flex justify-between">
												<span>DLC{dlc}</span>
												<Popover showArrow offset={0}>
													<Tooltip showArrow content={content} offset={-1.5}>
														<span className="cursor-pointer">
															<PopoverTrigger>
																<span>{mainPlace}</span>
															</PopoverTrigger>
														</span>
													</Tooltip>
													<PopoverContent>{content}</PopoverContent>
												</Popover>
											</span>
											<p className="text-justify">持有金：￥{price}</p>
										</span>
									</>
								);
							})()}
						</div>
					</div>
					<Divider className="md:hidden" />
					<Divider orientation="vertical" className="hidden md:block" />
					<div className="flex w-full flex-col justify-evenly gap-3 text-nowrap">
						{(() => {
							const {name: currentCustomerName, target} = currentCustomer;
							const [customerBeverageTags, costomerNegativeTags, customerPositiveTags] =
								instance_customer.getPropsByName(
									currentCustomerName,
									'beverageTags',
									'negativeTags',
									'positiveTags'
								);
							const beverageTags = currentBeverageName
								? (instance_beverage.getPropsByName(currentBeverageName, 'tags') as string[])
								: [];
							const recipePositiveTags: string[] = [];
							if (currentRecipe) {
								const {extraIngredients, name: currentRecipeName} = currentRecipe;
								const {ingredients: originalIngredients, positiveTags: originalTags} =
									instance_recipe.getPropsByName(currentRecipeName);
								const extraTags: string[] = [];
								for (const extraIngredient of extraIngredients) {
									extraTags.push(...instance_ingredient.getPropsByName(extraIngredient, 'tags'));
								}
								recipePositiveTags.push(
									...instance_recipe.composeTags(
										originalIngredients,
										extraIngredients,
										originalTags,
										extraTags
									)
								);
							}
							return (
								<>
									{customerPositiveTags && customerPositiveTags.length > 0 && (
										<TagGroup>
											{customerPositiveTags.toSorted(pinyinSort).map((tag) => (
												<Tags.Tag
													key={tag}
													tag={tag}
													tagStyle={customerTagStyleMap[target].positive}
													handleClick={(clickedTag) => {
														store.share.tab.set('recipe');
														store.share.customer.positiveTags.set((prev) => {
															if (prev instanceof Set && !clickedTag.startsWith('流行')) {
																if (prev.has(clickedTag)) {
																	prev.delete(clickedTag);
																} else {
																	prev.add(clickedTag);
																}
															}
														});
													}}
													className={clsx(
														'p-0.5',
														!tag.startsWith('流行') &&
															'cursor-pointer p-0.5 hover:opacity-80',
														!recipePositiveTags.includes(tag) && 'opacity-50'
													)}
												/>
											))}
										</TagGroup>
									)}
									{costomerNegativeTags && costomerNegativeTags.length > 0 && (
										<TagGroup>
											{costomerNegativeTags.toSorted(pinyinSort).map((tag) => (
												<Tags.Tag
													key={tag}
													tag={tag}
													tagStyle={customerTagStyleMap[target].negative}
													className={clsx(
														'p-0.5',
														!recipePositiveTags.includes(tag) && 'opacity-50'
													)}
												/>
											))}
										</TagGroup>
									)}
									{customerBeverageTags && customerBeverageTags.length > 0 && (
										<TagGroup>
											{getIntersection(
												store.beverage.tags.get().map(({value}) => value),
												customerBeverageTags
											).map((tag) => (
												<Tags.Tag
													key={tag}
													tag={tag}
													tagStyle={customerTagStyleMap[target].beverage}
													handleClick={(clickedTag) => {
														store.share.tab.set('beverage');
														store.share.customer.beverageTags.set((prev) => {
															if (prev instanceof Set) {
																if (prev.has(clickedTag)) {
																	prev.delete(clickedTag);
																} else {
																	prev.add(clickedTag);
																}
															}
														});
													}}
													className={clsx(
														'cursor-pointer p-0.5 hover:opacity-80',
														!beverageTags.includes(tag) && 'opacity-50'
													)}
												/>
											))}
										</TagGroup>
									)}
								</>
							);
						})()}
					</div>
					{hasSelected && (
						<Tooltip showArrow content="重置当前选定项" offset={1}>
							<FontAwesomeIconButton
								icon={faArrowsRotate}
								variant="light"
								onPress={store.refreshCustomerSelectedItems}
								aria-label="重置当前选定项"
								className="absolute -right-1 top-1 h-4 w-4 text-default-400 hover:opacity-80 data-[hover]:bg-transparent"
							/>
						</Tooltip>
					)}
				</div>
			</Card>
		);
	})
);
