import {forwardRef, memo, useCallback, useMemo} from 'react';
import {twJoin, twMerge} from 'tailwind-merge';

import {Avatar, Card, Divider, Popover, PopoverContent, PopoverTrigger, Tooltip} from '@nextui-org/react';
import {faArrowsRotate} from '@fortawesome/free-solid-svg-icons';

import InfoButton from './infoButton';
import TagGroup from './tagGroup';
import {TrackCategory, trackEvent} from '@/components/analytics';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Price from '@/components/price';
import Tags from '@/components/tags';
import Sprite from '@/components/sprite';

import {customerRatingColorMap, customerTagStyleMap} from './constants';
import type {TBeverageTag, TRecipeTag} from '@/data/types';
import {customerRareStore as customerStore, globalStore} from '@/stores';
import {checkA11yConfirmKey, intersection, pinyinSort} from '@/utils';

interface IProps {}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function CustomerCard(_props, ref) {
		const currentCustomerData = customerStore.shared.customer.data.use();
		const selectedCustomerBeverageTags = customerStore.shared.customer.beverageTags.use();
		const selectedCustomerPositiveTags = customerStore.shared.customer.positiveTags.use();
		const currentCustomerOrder = customerStore.shared.customer.order.use();
		const currentCustomerPopular = customerStore.shared.customer.popular.use();
		const currentRating = customerStore.shared.customer.rating.use();
		const hasMystiaCooker = customerStore.shared.customer.hasMystiaCooker.use();
		const isOrderLinkedFilter = customerStore.persistence.customer.orderLinkedFilter.use();
		const isShowTagDescription = customerStore.persistence.customer.showTagDescription.use();

		const currentBeverageName = customerStore.shared.beverage.name.use();
		const currentRecipeData = customerStore.shared.recipe.data.use();

		const isShowTagsTooltip = globalStore.persistence.customerCardTagsTooltip.use();

		const instance_beverage = customerStore.instances.beverage.get();
		const instance_ingredient = customerStore.instances.ingredient.get();
		const instance_recipe = customerStore.instances.recipe.get();

		const hasSelected = useMemo(
			() =>
				Boolean(
					currentCustomerOrder.beverageTag ||
						currentCustomerOrder.recipeTag ||
						currentBeverageName ||
						currentRecipeData ||
						selectedCustomerBeverageTags.size > 0 ||
						selectedCustomerPositiveTags.size > 0
				),
			[
				currentBeverageName,
				currentCustomerOrder.beverageTag,
				currentCustomerOrder.recipeTag,
				currentRecipeData,
				selectedCustomerBeverageTags,
				selectedCustomerPositiveTags,
			]
		);

		const handleBeverageTagClick = useCallback(
			(tag: TBeverageTag) => {
				if (!hasMystiaCooker) {
					customerStore.onCustomerOrderBeverageTag(tag);
				}
				if (isOrderLinkedFilter) {
					customerStore.onCustomerFilterBeverageTag(tag, hasMystiaCooker);
				}
			},
			[hasMystiaCooker, isOrderLinkedFilter]
		);

		const handleRecipeTagClick = useCallback(
			(tag: TRecipeTag) => {
				if (!hasMystiaCooker) {
					customerStore.onCustomerOrderRecipeTag(tag);
				}
				if (isOrderLinkedFilter) {
					customerStore.onCustomerFilterRecipeTag(tag, hasMystiaCooker);
				}
			},
			[hasMystiaCooker, isOrderLinkedFilter]
		);

		if (!currentCustomerData) {
			return null;
		}

		const {name: currentCustomerName, target: currentCustomerTarget} = currentCustomerData;

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

		const {length: clonedCurrentCustomerPlacesLength} = clonedCurrentCustomerPlaces;

		const placeContent =
			clonedCurrentCustomerPlacesLength > 0
				? `其他出没地点：${clonedCurrentCustomerPlaces.join('、')}`
				: '暂未收录其他出没地点';

		let beverageTags: TBeverageTag[] = [];
		if (currentBeverageName) {
			const beverage = instance_beverage.getPropsByName(currentBeverageName);
			beverageTags = beverage.tags;
		}

		const currentRecipeTagsWithPopular: TRecipeTag[] = [];
		if (currentRecipeData) {
			const {extraIngredients, name: currentRecipeName} = currentRecipeData;

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
			`请选择${currentBeverageName ? '' : '酒水、'}${currentRecipeData ? '' : '料理、'}顾客点单需求以评级`;

		const getTagTooltip = (type: keyof typeof currentCustomerOrder, tag: string) => {
			const isCurrentTag = currentCustomerOrder[type] === tag;
			const tagType = type === 'beverageTag' ? '酒水' : '料理';
			const cookerTip = '已使用夜雀厨具无视顾客点单需求';
			const orderTip = hasMystiaCooker
				? isOrderLinkedFilter
					? ''
					: cookerTip
				: `点击：${isCurrentTag ? '不再' : ''}将此标签视为顾客点单需求`;
			const filterTip = isOrderLinkedFilter
				? `${hasMystiaCooker ? '点击：' : '并'}${
						isCurrentTag ? `取消筛选${tagType}表格` : `以此标签筛选${tagType}表格`
					}${hasMystiaCooker ? `（${cookerTip}）` : ''}`
				: '';
			return `${orderTip}${filterTip}`;
		};

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
						<div className="whitespace-nowrap text-xs font-medium text-default-500">
							<p className="flex justify-between">
								<span>DLC{currentCustomerDlc}</span>
								<Popover showArrow offset={6.5}>
									<Tooltip showArrow content={placeContent} offset={4}>
										<span className="cursor-pointer">
											<PopoverTrigger>
												<span
													role="button"
													tabIndex={0}
													className={twJoin(
														clonedCurrentCustomerPlacesLength > 0 &&
															'underline decoration-dotted underline-offset-2'
													)}
												>
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
										closeDelay={0}
										content={getTagTooltip('recipeTag', tag)}
										isDisabled={!isShowTagsTooltip}
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
											onClick={() => {
												handleRecipeTagClick(tag);
											}}
											onKeyDown={(event) => {
												if (checkA11yConfirmKey(event)) {
													handleRecipeTagClick(tag);
												}
											}}
											aria-label={`${tag}${currentCustomerOrder.recipeTag === tag ? '/已选定' : ''}${currentRecipeTagsWithPopular.includes(tag) ? '/已满足' : ''}`}
											role="button"
											tabIndex={0}
											className={twMerge(
												'cursor-pointer p-1 leading-none hover:opacity-80',
												!currentRecipeTagsWithPopular.includes(tag) && 'opacity-50',
												currentCustomerOrder.recipeTag === tag &&
													!hasMystiaCooker &&
													'ring-2 ring-current',
												hasMystiaCooker && !isOrderLinkedFilter && 'cursor-not-allowed'
											)}
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
											'cursor-not-allowed p-1 leading-none',
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
										closeDelay={0}
										content={getTagTooltip('beverageTag', tag)}
										isDisabled={!isShowTagsTooltip}
									>
										<Tags.Tag
											tag={tag}
											tagStyle={customerTagStyleMap[currentCustomerTarget].beverage}
											onClick={() => {
												handleBeverageTagClick(tag);
											}}
											onKeyDown={(event) => {
												if (checkA11yConfirmKey(event)) {
													handleBeverageTagClick(tag);
												}
											}}
											aria-label={`${tag}${currentCustomerOrder.beverageTag === tag ? '/已选定' : ''}${beverageTags.includes(tag) ? '/已满足' : ''}`}
											role="button"
											tabIndex={0}
											className={twMerge(
												'cursor-pointer p-1 leading-none hover:opacity-80',
												!beverageTags.includes(tag) && 'opacity-50',
												currentCustomerOrder.beverageTag === tag &&
													!hasMystiaCooker &&
													'ring-2 ring-current',
												hasMystiaCooker && !isOrderLinkedFilter && 'cursor-not-allowed'
											)}
										/>
									</Tooltip>
								))}
							</TagGroup>
						)}
					</div>
					{hasSelected && (
						<Tooltip showArrow content="重置当前选定项" offset={4}>
							<FontAwesomeIconButton
								icon={faArrowsRotate}
								variant="light"
								onPress={() => {
									customerStore.refreshCustomerSelectedItems();
									trackEvent(TrackCategory.Click, 'Reset Button', currentCustomerName);
								}}
								aria-label="重置当前选定项"
								className="absolute -right-0.5 top-1 h-4 w-4 text-default-400 hover:opacity-80 data-[hover]:bg-transparent"
							/>
						</Tooltip>
					)}
					<InfoButton />
				</div>
			</Card>
		);
	})
);
