import {forwardRef, memo, useCallback, useMemo} from 'react';
import clsx from 'clsx';
import {intersection} from 'lodash';

import {useLongPress} from 'use-long-press';

import {Avatar, Card, Divider, Popover, PopoverContent, PopoverTrigger, Tooltip} from '@nextui-org/react';
import {faArrowsRotate} from '@fortawesome/free-solid-svg-icons';

import SettingsButton from './settingsButton';
import TagGroup from './tagGroup';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Tags from '@/components/tags';
import Sprite from '@/components/sprite';

import {customerRatingColorMap, customerTagStyleMap} from './constants';
import {type TTags} from '@/data';
import type {TBeverageTag, TIngredientTag, TRecipeTag} from '@/data/types';
import {useCustomerRareStore, useGlobalStore} from '@/stores';
import {checkA11yConfirmKey, pinyinSort} from '@/utils';

interface IProps {}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function CustomerCard(_props, ref) {
		const customerStore = useCustomerRareStore();
		const globalStore = useGlobalStore();

		const currentCustomer = customerStore.shared.customer.data.use();
		const selectedCustomerBeverageTags = customerStore.shared.customer.beverageTags.use();
		const selectedCustomerPositiveTags = customerStore.shared.customer.positiveTags.use();
		const currentCustomerOrder = customerStore.shared.customer.order.use();
		const currentCustomerPopular = customerStore.shared.customer.popular.use();
		const currentRating = customerStore.shared.customer.rating.use();

		const currentBeverageName = customerStore.shared.beverage.name.use();
		const currentRecipe = customerStore.shared.recipe.data.use();

		const currentGlobalPopular = globalStore.persistence.popular.use();

		const instance_beverage = customerStore.instances.beverage.get();
		const instance_ingredient = customerStore.instances.ingredient.get();
		const instance_recipe = customerStore.instances.recipe.get();

		const hasSelected = useMemo(
			() =>
				Boolean(
					currentCustomerOrder.beverageTag ||
						currentCustomerOrder.recipeTag ||
						currentBeverageName ||
						currentRecipe ||
						(typeof selectedCustomerBeverageTags !== 'string' && selectedCustomerBeverageTags.size > 0) ||
						(typeof selectedCustomerPositiveTags !== 'string' && selectedCustomerPositiveTags.size > 0)
				),
			[
				currentBeverageName,
				currentCustomerOrder.beverageTag,
				currentCustomerOrder.recipeTag,
				currentRecipe,
				selectedCustomerBeverageTags,
				selectedCustomerPositiveTags,
			]
		);

		const bindBeverageTagLongPress = useLongPress((_longPressReactEvents, context) => {
			const {context: tag} = context as {context: TBeverageTag};
			customerStore.shared.customer.order.beverageTag.set((prev) => (prev === tag ? null : tag));
		});

		const bindRecipePositiveTagLongPress = useLongPress((_longPressReactEvents, context) => {
			const {context: tag} = context as {context: TRecipeTag};
			customerStore.shared.customer.order.recipeTag.set((prev) => (prev === tag ? null : tag));
		});

		const handleBeverageTagSelected = useCallback(
			(pressedTag: TTags) => {
				const tag = pressedTag as TBeverageTag;
				customerStore.shared.customer.order.beverageTag.set((prev) => (prev === tag ? null : tag));
			},
			[customerStore.shared.customer.order.beverageTag]
		);

		const handleRecipePositiveTagSelected = useCallback(
			(pressedTag: TTags) => {
				const tag = pressedTag as TRecipeTag;
				customerStore.shared.customer.order.recipeTag.set((prev) => (prev === tag ? null : tag));
			},
			[customerStore.shared.customer.order.recipeTag]
		);

		if (!currentCustomer) {
			return null;
		}

		const {name: currentCustomerName, target: currentCustomerTarget} = currentCustomer;

		const instance_customer = customerStore.instances[currentCustomerTarget as 'customer_rare'].get();

		const {
			dlc: currentCustomerDlc,
			places: currentCustomerPlaces,
			price: currentCustomerPrice,
			beverageTags: currentCustomerBeverageTags,
			negativeTags: currentCustomerNegativeTags,
			positiveTags: currentCustomerPositiveTags,
		} = instance_customer.getPropsByName(currentCustomerName);

		const clonedCurrentCustomerPlaces = [...currentCustomerPlaces];
		const currentCustomerMainPlace = clonedCurrentCustomerPlaces.shift();
		const placeContent =
			clonedCurrentCustomerPlaces.length > 0
				? `其他出没地点：${clonedCurrentCustomerPlaces.join('、')}`
				: '暂未收录其他出没地点';

		let beverageTags: TBeverageTag[] = [];
		if (currentBeverageName) {
			const beverage = instance_beverage.getPropsByName(currentBeverageName);
			beverageTags = beverage.tags;
		}

		const currentRecipeTagsWithPopular: TRecipeTag[] = [];
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

			currentRecipeTagsWithPopular.push(
				...instance_recipe.calculateTagsWithPopular(composedRecipeTags, currentCustomerPopular)
			);
			setTimeout(() => {
				customerStore.shared.recipe.tagsWithPopular.set(currentRecipeTagsWithPopular);
			}, 0);
		}

		return (
			<Card fullWidth shadow="sm" ref={ref}>
				<div className="flex flex-col gap-3 p-4 md:flex-row">
					<div className="flex flex-col">
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
								<div className="cursor-pointer">
									<PopoverTrigger>
										<div tabIndex={0} className="flex flex-col items-center gap-2">
											<Avatar
												isBordered={Boolean(currentRating)}
												color={
													currentRating ? customerRatingColorMap[currentRating] : undefined
												}
												radius="full"
												icon={
													<Sprite
														target={currentCustomerTarget}
														name={currentCustomerName}
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
											<span className="text-md text-center font-semibold">
												{currentCustomerName}
											</span>
										</div>
									</PopoverTrigger>
								</div>
							</Tooltip>
							<PopoverContent>{currentRating ?? '继续选择以评分'}</PopoverContent>
						</Popover>
						<div className="flex flex-col text-nowrap break-keep pt-2 text-xs font-medium text-default-500">
							<p className="flex justify-between">
								<span>DLC{currentCustomerDlc}</span>
								<Popover showArrow offset={0}>
									<Tooltip showArrow content={placeContent} offset={-1.5}>
										<span className="cursor-pointer">
											<PopoverTrigger>
												<span tabIndex={0}>{currentCustomerMainPlace}</span>
											</PopoverTrigger>
										</span>
									</Tooltip>
									<PopoverContent>{placeContent}</PopoverContent>
								</Popover>
							</p>
							<p className="text-justify">持有金：￥{currentCustomerPrice}</p>
						</div>
					</div>
					<Divider className="md:hidden" />
					<Divider orientation="vertical" className="hidden md:block" />
					<div className="flex w-full flex-col justify-evenly gap-3 text-nowrap break-keep">
						{currentCustomerPositiveTags.length > 0 && (
							<TagGroup>
								{[...currentCustomerPositiveTags].sort(pinyinSort).map((tag) => (
									<Tooltip
										key={tag}
										showArrow
										content={
											<div>
												<p>
													双击：将此标签
													{(selectedCustomerPositiveTags as Set<string>).has(tag)
														? '从筛选列表中移除'
														: '加入至筛选列表中'}
												</p>
												<p>长按：将此标签视为客人点单需求</p>
											</div>
										}
									>
										<Tags.Tag
											tag={tag}
											tagStyle={customerTagStyleMap[currentCustomerTarget].positive}
											handleDoubleClick={(clickedTag) => {
												customerStore.shared.tab.set('recipe');
												customerStore.shared.customer.positiveTags.set((prev) => {
													if (prev instanceof Set) {
														if (prev.has(clickedTag)) {
															prev.delete(clickedTag);
														} else {
															prev.add(clickedTag);
														}
													}
												});
											}}
											onKeyDown={(event) => {
												if (checkA11yConfirmKey(event)) {
													handleRecipePositiveTagSelected(tag);
												}
											}}
											role="button"
											tabIndex={0}
											className={clsx(
												'cursor-pointer select-none p-0.5 hover:opacity-80',
												!currentRecipeTagsWithPopular.includes(tag) && 'opacity-50',
												currentCustomerOrder.recipeTag === tag && 'ring-2 ring-current'
											)}
											{...bindRecipePositiveTagLongPress(tag)}
										/>
									</Tooltip>
								))}
							</TagGroup>
						)}
						{currentCustomerNegativeTags.length > 0 && (
							<TagGroup>
								{[...currentCustomerNegativeTags].sort(pinyinSort).map((tag) => (
									<Tags.Tag
										key={tag}
										tag={tag}
										tagStyle={customerTagStyleMap[currentCustomerTarget].negative}
										className={clsx(
											'cursor-not-allowed p-0.5',
											!currentRecipeTagsWithPopular.includes(tag) && 'opacity-50'
										)}
									/>
								))}
							</TagGroup>
						)}
						{currentCustomerBeverageTags.length > 0 && (
							<TagGroup>
								{intersection(
									customerStore.beverage.tags.get().map(({value}) => value),
									currentCustomerBeverageTags
								).map((tag) => (
									<Tooltip
										key={tag}
										showArrow
										content={
											<div>
												<p>
													双击：将此标签
													{(selectedCustomerBeverageTags as Set<string>).has(tag)
														? '从筛选列表中移除'
														: '加入至筛选列表中'}
												</p>
												<p>长按：将此标签视为客人点单需求</p>
											</div>
										}
									>
										<Tags.Tag
											tag={tag}
											tagStyle={customerTagStyleMap[currentCustomerTarget].beverage}
											handleDoubleClick={(clickedTag) => {
												customerStore.shared.tab.set('beverage');
												customerStore.shared.customer.beverageTags.set((prev) => {
													if (prev instanceof Set) {
														if (prev.has(clickedTag)) {
															prev.delete(clickedTag);
														} else {
															prev.add(clickedTag);
														}
													}
												});
											}}
											onKeyDown={(event) => {
												if (checkA11yConfirmKey(event)) {
													handleBeverageTagSelected(tag);
												}
											}}
											role="button"
											tabIndex={0}
											className={clsx(
												'cursor-pointer select-none p-0.5 hover:opacity-80',
												!beverageTags.includes(tag) && 'opacity-50',
												currentCustomerOrder.beverageTag === tag && 'ring-2 ring-current'
											)}
											{...bindBeverageTagLongPress(tag)}
										/>
									</Tooltip>
								))}
							</TagGroup>
						)}
					</div>
					{hasSelected && (
						<Tooltip showArrow content="重置当前选定项" offset={0} placement="left">
							<FontAwesomeIconButton
								icon={faArrowsRotate}
								variant="light"
								onPress={() => {
									customerStore.shared.customer.popular.set(currentGlobalPopular);
									customerStore.refreshCustomerSelectedItems();
								}}
								aria-label="重置当前选定项"
								className="absolute -right-1 top-1 h-4 w-4 text-default-400 hover:opacity-80 data-[hover]:bg-transparent"
							/>
						</Tooltip>
					)}
					<SettingsButton />
				</div>
			</Card>
		);
	})
);
