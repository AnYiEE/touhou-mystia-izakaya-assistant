import {forwardRef, memo, useMemo} from 'react';
import clsx from 'clsx';
import {intersection} from 'lodash';

import {Avatar, Card, Divider, Popover, PopoverContent, PopoverTrigger, Tooltip} from '@nextui-org/react';
import {faArrowsRotate} from '@fortawesome/free-solid-svg-icons';

import PopularTagSettingButton from './popularTagSettingButton';
import TagGroup from './tagGroup';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Tags from '@/components/tags';
import Sprite from '@/components/sprite';

import {customerRatingColorMap, customerTagStyleMap} from './constants';
import type {TBeverageTag, TIngredientTag, TRecipeTag} from '@/data/types';
import {useCustomerRareStore} from '@/stores';
import {pinyinSort} from '@/utils';

interface IProps {}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function CustomerCard(_props, ref) {
		const store = useCustomerRareStore();

		const currentCustomer = store.shared.customer.data.use();
		const selectedCustomerBeverageTags = store.shared.customer.beverageTags.use();
		const selectedCustomerPositiveTags = store.shared.customer.positiveTags.use();
		const currentCustomerPopular = store.shared.customer.popular.use();
		const currentRating = store.shared.customer.rating.use();

		const currentBeverageName = store.shared.beverage.name.use();
		const currentRecipe = store.shared.recipe.data.use();

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
						<Popover
							showArrow
							color={currentRating ? customerRatingColorMap[currentRating] : undefined}
							offset={11}
						>
							<Tooltip
								showArrow
								color={currentRating ? customerRatingColorMap[currentRating] : undefined}
								content={currentRating ?? '继续选择以评分'}
							>
								<span className="cursor-pointer">
									<PopoverTrigger>
										<Avatar
											isBordered={Boolean(currentRating)}
											color={currentRating ? customerRatingColorMap[currentRating] : undefined}
											radius="full"
											icon={
												<Sprite
													target={currentCustomer.target}
													name={currentCustomer.name}
													size={4}
												/>
											}
											classNames={{
												base: clsx(
													'h-12 w-12 lg:h-16 lg:w-16',
													Boolean(currentRating) && 'ring-4'
												),
												icon: 'inline-table lg:inline-block',
											}}
										/>
									</PopoverTrigger>
								</span>
							</Tooltip>
							<PopoverContent>{currentRating ?? '继续选择以评分'}</PopoverContent>
						</Popover>
						<div className="flex flex-col gap-2 text-nowrap break-keep pt-2">
							{(() => {
								const {name: currentCustomerName} = currentCustomer;
								const [dlc, places, price] = instance_customer.getPropsByName(
									currentCustomerName,
									'dlc',
									'places',
									'price'
								);
								const clonePlace = [...(places as string[])];
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
											<p className="text-nowrap break-keep text-justify">持有金：￥{price}</p>
										</span>
									</>
								);
							})()}
						</div>
					</div>
					<Divider className="md:hidden" />
					<Divider orientation="vertical" className="hidden md:block" />
					<div className="flex w-full flex-col justify-evenly gap-3 text-nowrap break-keep">
						{(() => {
							const {name: currentCustomerName, target} = currentCustomer;
							const {
								beverageTags: customerBeverageTags,
								negativeTags: customerNegativeTags,
								positiveTags: customerPositiveTags,
							} = instance_customer.getPropsByName(currentCustomerName);
							let beverageTags: TBeverageTag[] = [];
							if (currentBeverageName) {
								const beverage = instance_beverage.getPropsByName(currentBeverageName);
								beverageTags = beverage.tags;
							}
							const recipeTagsWithPopular: TRecipeTag[] = [];
							if (currentRecipe) {
								const {extraIngredients, name: currentRecipeName} = currentRecipe;
								const recipe = instance_recipe.getPropsByName(currentRecipeName);
								const {ingredients: originalIngredients, positiveTags: originalTags} = recipe;
								const extraTags: TIngredientTag[] = [];
								for (const extraIngredient of extraIngredients) {
									extraTags.push(...instance_ingredient.getPropsByName(extraIngredient, 'tags'));
								}
								const composedRecipeTags = instance_recipe.composeTags(
									originalIngredients,
									extraIngredients,
									originalTags,
									extraTags
								);
								recipeTagsWithPopular.push(
									...instance_recipe.calcTagsWithPopular(composedRecipeTags, currentCustomerPopular)
								);
							}
							return (
								<>
									{customerPositiveTags.length > 0 && (
										<TagGroup>
											{[...customerPositiveTags].sort(pinyinSort).map((tag) => (
												<Tags.Tag
													key={tag}
													tag={tag}
													tagStyle={customerTagStyleMap[target].positive}
													handleClick={(clickedTag) => {
														store.shared.tab.set('recipe');
														store.shared.customer.positiveTags.set((prev) => {
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
														!recipeTagsWithPopular.includes(tag) && 'opacity-50'
													)}
												/>
											))}
										</TagGroup>
									)}
									{customerNegativeTags.length > 0 && (
										<TagGroup>
											{[...customerNegativeTags].sort(pinyinSort).map((tag) => (
												<Tags.Tag
													key={tag}
													tag={tag}
													tagStyle={customerTagStyleMap[target].negative}
													className={clsx(
														'p-0.5',
														!recipeTagsWithPopular.includes(tag) && 'opacity-50'
													)}
												/>
											))}
										</TagGroup>
									)}
									{customerBeverageTags.length > 0 && (
										<TagGroup>
											{intersection(
												store.beverage.tags.get().map(({value}) => value),
												customerBeverageTags
											).map((tag) => (
												<Tags.Tag
													key={tag}
													tag={tag}
													tagStyle={customerTagStyleMap[target].beverage}
													handleClick={(clickedTag) => {
														store.shared.tab.set('beverage');
														store.shared.customer.beverageTags.set((prev) => {
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
						<Tooltip showArrow content="重置当前选定项" offset={0} placement="left">
							<FontAwesomeIconButton
								icon={faArrowsRotate}
								variant="light"
								onPress={store.refreshCustomerSelectedItems}
								aria-label="重置当前选定项"
								className="absolute -right-1 top-1 h-4 w-4 text-default-400 hover:opacity-80 data-[hover]:bg-transparent"
							/>
						</Tooltip>
					)}
					<PopularTagSettingButton />
				</div>
			</Card>
		);
	})
);
