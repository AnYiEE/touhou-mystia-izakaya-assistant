import {forwardRef, memo, useMemo} from 'react';
import clsx from 'clsx';
import {intersection} from 'lodash';

import {Avatar, Card, Divider, Popover, PopoverContent, PopoverTrigger, Tooltip} from '@nextui-org/react';
import {faArrowsRotate} from '@fortawesome/free-solid-svg-icons';

import TagGroup from './tagGroup';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Tags from '@/components/tags';
import Sprite from '@/components/sprite';

import {customerRatingColorMap, customerTagStyleMap} from './constants';
import type {TCustomerRating} from './types';
import {useCustomerRareStore} from '@/stores';
import {pinyinSort} from '@/utils';

function evaluateRecipe({
	customBadget,
	matchedBeverageTagsLength,
	matchedRecipeTagsLength,
	mealPrice,
	recipeSuitability,
}: {
	customBadget: number;
	matchedBeverageTagsLength: number;
	matchedRecipeTagsLength: number;
	mealPrice: number;
	recipeSuitability: number;
}) {
	if (recipeSuitability <= 0 || mealPrice > customBadget + 200) {
		return '极度不满';
	}
	if (recipeSuitability === 1 || (matchedBeverageTagsLength === 0 && matchedRecipeTagsLength === 0)) {
		return '不满';
	}
	if (
		(recipeSuitability === 2 && (matchedBeverageTagsLength >= 1 || matchedRecipeTagsLength >= 1)) ||
		mealPrice > customBadget
	) {
		return '普通';
	}
	if (recipeSuitability === 3 && (matchedBeverageTagsLength >= 1 || matchedRecipeTagsLength >= 1)) {
		return '满意';
	}
	if (recipeSuitability >= 4 && matchedBeverageTagsLength >= 1 && matchedRecipeTagsLength >= 1) {
		return '完美';
	}
	if (recipeSuitability === 4) {
		return '满意';
	}
	if (recipeSuitability === 3) {
		return '普通';
	}
	if (recipeSuitability === 2) {
		return '不满';
	}
	if (recipeSuitability === 1 || recipeSuitability === 0) {
		return '极度不满';
	}
	return null;
}

interface IProps {}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function CustomerCard(_props, ref) {
		const store = useCustomerRareStore();

		const currentCustomer = store.share.customer.data.use();
		const currentCustomerRating = store.share.customer.rating.use();
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
						<Tooltip
							showArrow
							color={currentCustomerRating ? customerRatingColorMap[currentCustomerRating] : undefined}
							content={currentCustomerRating ?? '继续选择以评分'}
						>
							<Avatar
								isBordered={Boolean(currentCustomerRating)}
								color={
									currentCustomerRating ? customerRatingColorMap[currentCustomerRating] : undefined
								}
								radius="full"
								icon={<Sprite target={currentCustomer.target} name={currentCustomer.name} size={4} />}
								classNames={{
									base: clsx('h-12 w-12 lg:h-16 lg:w-16', Boolean(currentCustomerRating) && 'ring-4'),
									icon: 'inline-table lg:inline-block',
								}}
							/>
						</Tooltip>
						<div className="flex flex-col gap-2 text-nowrap pt-2">
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
								negativeTags: costomerNegativeTags,
								positiveTags: customerPositiveTags,
								price: customerPrice,
							} = instance_customer.getPropsByName(currentCustomerName);
							let beveragePrice = 0;
							let beverageTags: string[] = [];
							if (currentBeverageName) {
								const beverage = instance_beverage.getPropsByName(currentBeverageName);
								beveragePrice = beverage.price;
								beverageTags = beverage.tags;
							}
							let recipePrice = 0;
							const recipePositiveTags: string[] = [];
							if (currentRecipe) {
								const {extraIngredients, name: currentRecipeName} = currentRecipe;
								const recipe = instance_recipe.getPropsByName(currentRecipeName);
								const {ingredients: originalIngredients, positiveTags: originalTags, price} = recipe;
								recipePrice = price;
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
							let calcCustomerRating: TCustomerRating | null = null;
							const customBadget = Number.parseInt(customerPrice.split('-')[1] as string);
							const mealPrice = beveragePrice + recipePrice;
							const {suitability: recipeSuitability} = instance_recipe.getCustomerSuitability(
								recipePositiveTags,
								customerPositiveTags,
								costomerNegativeTags
							);
							const matchedBeverageTagsLength = intersection(beverageTags, customerBeverageTags).length;
							const matchedRecipeTagsLength = intersection(
								recipePositiveTags,
								customerPositiveTags
							).length;
							if (currentBeverageName || currentRecipe) {
								calcCustomerRating = evaluateRecipe({
									customBadget,
									matchedBeverageTagsLength,
									matchedRecipeTagsLength,
									mealPrice,
									recipeSuitability,
								});
							}
							if (calcCustomerRating !== currentCustomerRating) {
								setTimeout(() => {
									store.share.customer.rating.set(calcCustomerRating);
								}, 0);
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
									{costomerNegativeTags.length > 0 && (
										<TagGroup>
											{[...costomerNegativeTags].sort(pinyinSort).map((tag) => (
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
