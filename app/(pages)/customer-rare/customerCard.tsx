import {forwardRef, memo, useCallback, useMemo} from 'react';
import {twJoin} from 'tailwind-merge';

import {useLongPress} from 'use-long-press';

import {
	Avatar,
	Card,
	Divider,
	Popover,
	PopoverContent,
	PopoverTrigger,
	type Selection,
	Tooltip,
} from '@nextui-org/react';
import {faArrowsRotate} from '@fortawesome/free-solid-svg-icons';

import SettingsButton from './settingsButton';
import TagGroup from './tagGroup';
import {TrackCategory, trackEvent} from '@/components/analytics';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Price from '@/components/price';
import Tags from '@/components/tags';
import Sprite from '@/components/sprite';

import {customerRatingColorMap, customerTagStyleMap} from './constants';
import {type TTags} from '@/data';
import type {TBeverageTag, TRecipeTag} from '@/data/types';
import {useCustomerRareStore, useGlobalStore} from '@/stores';
import {checkA11yConfirmKey, intersection, pinyinSort} from '@/utils';

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
		const isShowTagDescription = customerStore.persistence.customer.showTagDescription.use();

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
						selectedCustomerBeverageTags.size > 0 ||
						selectedCustomerPositiveTags.size > 0
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

		const handleBeverageTagSelected = useCallback(
			(pressedTag: TTags) => {
				const tag = pressedTag as TBeverageTag;
				customerStore.shared.customer.order.beverageTag.set((prev) => {
					if (prev === tag) {
						trackEvent(TrackCategory.Unselect, 'Customer Tag', tag);
						return null;
					}

					trackEvent(TrackCategory.Select, 'Customer Tag', tag);
					return tag;
				});
			},
			[customerStore.shared.customer.order.beverageTag]
		);

		const handleRecipePositiveTagSelected = useCallback(
			(pressedTag: TTags) => {
				const tag = pressedTag as TRecipeTag;
				customerStore.shared.customer.order.recipeTag.set((prev) => {
					if (prev === tag) {
						trackEvent(TrackCategory.Unselect, 'Customer Tag', tag);
						return null;
					}

					trackEvent(TrackCategory.Select, 'Customer Tag', tag);
					return tag;
				});
			},
			[customerStore.shared.customer.order.recipeTag]
		);

		const bindBeverageTagLongPress = useLongPress((_longPressReactEvents, context) => {
			const {context: tag} = context as {context: TBeverageTag};
			handleBeverageTagSelected(tag);
		});

		const bindRecipePositiveTagLongPress = useLongPress((_longPressReactEvents, context) => {
			const {context: tag} = context as {context: TRecipeTag};
			handleRecipePositiveTagSelected(tag);
		});

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
			positiveTagMapping: currentCustomerPositiveTagMapping,
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

			const extraTags = extraIngredients.flatMap((extraIngredient) =>
				instance_ingredient.getPropsByName(extraIngredient, 'tags')
			);

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

		const avatarRatingColor = currentRating ? customerRatingColorMap[currentRating] : undefined;
		const avatarRatingContent =
			currentRating ??
			`请选择${currentBeverageName ? '' : '酒水、'}${currentRecipe ? '' : '料理、'}顾客点单需求以评级`;

		const getTagTooltip = (selectedTags: Selection, tag: string) => (
			<div>
				<p>
					双击：将此标签
					{(selectedTags as SelectionSet).has(tag) ? '从表格标签筛选列表中移除' : '加入至表格标签筛选列表中'}
				</p>
				<p>长按/右键单击：{currentCustomerOrder.beverageTag === tag ? '不再' : ''}将此标签视为顾客点单需求</p>
			</div>
		);

		return (
			<Card fullWidth shadow="sm" ref={ref}>
				<div className="flex flex-col gap-3 p-4 md:flex-row">
					<div className="flex flex-col justify-evenly gap-2">
						<Popover showArrow color={avatarRatingColor} offset={11}>
							<Tooltip showArrow color={avatarRatingColor} content={avatarRatingContent}>
								<div className="cursor-pointer">
									<PopoverTrigger>
										<div role="button" tabIndex={0} className="flex flex-col items-center gap-2">
											<Avatar
												isBordered={Boolean(currentRating)}
												color={avatarRatingColor}
												radius="full"
												icon={
													<Sprite
														target={currentCustomerTarget}
														name={currentCustomerName}
														size={4}
													/>
												}
												classNames={{
													base: twJoin(
														'h-12 w-12 lg:h-16 lg:w-16',
														currentRating && 'ring-4'
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
							<PopoverContent>{avatarRatingContent}</PopoverContent>
						</Popover>
						<div className="flex flex-col whitespace-nowrap text-xs font-medium text-default-500">
							<p className="flex justify-between">
								<span>DLC{currentCustomerDlc}</span>
								<Popover showArrow offset={0}>
									<Tooltip showArrow content={placeContent} offset={-1.5}>
										<span className="cursor-pointer">
											<PopoverTrigger>
												<span role="button" tabIndex={0}>
													{currentCustomerMainPlace}
												</span>
											</PopoverTrigger>
										</span>
									</Tooltip>
									<PopoverContent>{placeContent}</PopoverContent>
								</Popover>
							</p>
							<p className="text-justify">
								持有金：<Price>{currentCustomerPrice}</Price>
							</p>
						</div>
					</div>
					<Divider className="md:hidden" />
					<Divider orientation="vertical" className="hidden md:block" />
					<div className="flex w-full flex-col justify-evenly gap-3 whitespace-nowrap">
						{currentCustomerPositiveTags.length > 0 && (
							<TagGroup>
								{[...currentCustomerPositiveTags].sort(pinyinSort).map((tag) => (
									<Tooltip
										key={tag}
										showArrow
										content={getTagTooltip(selectedCustomerPositiveTags, tag)}
									>
										<Tags.Tag
											tag={
												isShowTagDescription && tag in currentCustomerPositiveTagMapping
													? [
															tag,
															currentCustomerPositiveTagMapping[
																tag as keyof typeof currentCustomerPositiveTagMapping
															],
														]
													: tag
											}
											tagStyle={customerTagStyleMap[currentCustomerTarget].positive}
											onContextMenu={(event) => {
												event.preventDefault();
											}}
											onDoubleClick={() => {
												customerStore.shared.tab.set('recipe');
												customerStore.shared.customer.positiveTags.set((prev) => {
													if (prev.has(tag)) {
														prev.delete(tag);
													} else {
														prev.add(tag);
													}
												});
											}}
											onKeyDown={(event) => {
												if (checkA11yConfirmKey(event)) {
													handleRecipePositiveTagSelected(tag);
												}
											}}
											onMouseDown={(event) => {
												if (event.button === 2) {
													handleRecipePositiveTagSelected(tag);
												}
											}}
											aria-label={`${tag}${currentCustomerOrder.recipeTag === tag ? '/已选定' : ''}${currentRecipeTagsWithPopular.includes(tag) ? '/已满足' : ''}`}
											role="button"
											tabIndex={0}
											className={twJoin(
												'cursor-pointer select-none py-0.5 hover:opacity-80',
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
										className={twJoin(
											'cursor-not-allowed py-0.5',
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
										content={getTagTooltip(selectedCustomerBeverageTags, tag)}
									>
										<Tags.Tag
											tag={tag}
											tagStyle={customerTagStyleMap[currentCustomerTarget].beverage}
											onContextMenu={(event) => {
												event.preventDefault();
											}}
											onDoubleClick={() => {
												customerStore.shared.tab.set('beverage');
												customerStore.shared.customer.beverageTags.set((prev) => {
													if (prev.has(tag)) {
														prev.delete(tag);
													} else {
														prev.add(tag);
													}
												});
											}}
											onKeyDown={(event) => {
												if (checkA11yConfirmKey(event)) {
													handleBeverageTagSelected(tag);
												}
											}}
											onMouseDown={(event) => {
												if (event.button === 2) {
													handleBeverageTagSelected(tag);
												}
											}}
											aria-label={`${tag}${currentCustomerOrder.beverageTag === tag ? '/已选定' : ''}${beverageTags.includes(tag) ? '/已满足' : ''}`}
											role="button"
											tabIndex={0}
											className={twJoin(
												'cursor-pointer select-none py-0.5 hover:opacity-80',
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
									trackEvent(TrackCategory.Click, 'Reset Button', currentCustomerName);
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
