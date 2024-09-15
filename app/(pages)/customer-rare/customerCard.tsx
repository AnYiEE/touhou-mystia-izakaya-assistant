import {forwardRef, useCallback, useMemo} from 'react';
import {twJoin, twMerge} from 'tailwind-merge';

import {useVibrate} from '@/hooks';

import {Avatar, Card, Divider, Popover, PopoverContent, PopoverTrigger, Tooltip} from '@nextui-org/react';
import {faArrowsRotate, faXmark} from '@fortawesome/free-solid-svg-icons';

import InfoButton from './infoButton';
import TagGroup from './tagGroup';
import {TrackCategory, trackEvent} from '@/components/analytics';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Price from '@/components/price';
import Tags from '@/components/tags';
import Sprite from '@/components/sprite';

import {customerRatingColorMap, customerTagStyleMap} from './constants';
import type {ICurrentCustomer} from './types';
import type {TBeverageTag, TRecipeTag} from '@/data/types';
import {customerRareStore as customerStore, globalStore} from '@/stores';
import {checkA11yConfirmKey, intersection, pinyinSort, toValue} from '@/utils';

interface IProps {}

export default forwardRef<HTMLDivElement | null, IProps>(function CustomerCard(_props, ref) {
	const vibrate = useVibrate();

	const currentCustomerData = customerStore.shared.customer.data.use();
	const selectedCustomerBeverageTags = customerStore.shared.customer.beverageTags.use();
	const selectedCustomerPositiveTags = customerStore.shared.customer.positiveTags.use();
	const currentCustomerOrder = customerStore.shared.customer.order.use();
	const currentCustomerPopular = customerStore.shared.customer.popular.use();
	const currentRating = customerStore.shared.customer.rating.use();
	const hasMystiaCooker = customerStore.shared.customer.hasMystiaCooker.use();
	const isDarkMatter = customerStore.shared.customer.isDarkMatter.use();
	const isOrderLinkedFilter = customerStore.persistence.customer.orderLinkedFilter.use();
	const isShowTagDescription = customerStore.persistence.customer.showTagDescription.use();

	const currentBeverageName = customerStore.shared.beverage.name.use();
	const currentRecipeData = customerStore.shared.recipe.data.use();

	const isShowBackgroundImage = globalStore.persistence.backgroundImage.use();
	const isShowTagsTooltip = globalStore.persistence.customerCardTagsTooltip.use();

	const instance_beverage = customerStore.instances.beverage.get();
	const instance_ingredient = customerStore.instances.ingredient.get();
	const instance_recipe = customerStore.instances.recipe.get();

	const hasSelected = Boolean(
		currentCustomerOrder.beverageTag ||
			currentCustomerOrder.recipeTag ||
			currentBeverageName ||
			currentRecipeData ||
			selectedCustomerBeverageTags.size > 0 ||
			selectedCustomerPositiveTags.size > 0
	);

	const handleBeverageTagClick = useCallback(
		(tag: TBeverageTag) => {
			vibrate();
			customerStore.onCustomerOrderBeverageTag(tag);
			if (isOrderLinkedFilter) {
				customerStore.onCustomerFilterBeverageTag(tag, hasMystiaCooker);
			}
		},
		[hasMystiaCooker, isOrderLinkedFilter, vibrate]
	);

	const handleRecipeTagClick = useCallback(
		(tag: TRecipeTag) => {
			vibrate();
			customerStore.onCustomerOrderRecipeTag(tag);
			if (isOrderLinkedFilter) {
				customerStore.onCustomerFilterRecipeTag(tag, hasMystiaCooker);
			}
		},
		[hasMystiaCooker, isOrderLinkedFilter, vibrate]
	);

	const handleRefreshCustomer = useCallback(() => {
		vibrate();
		customerStore.refreshCustomer();
	}, [vibrate]);

	const handleRefreshSelectedItems = useCallback(
		(customerName: ICurrentCustomer['name']) => {
			vibrate();
			customerStore.refreshCustomerSelectedItems();
			trackEvent(TrackCategory.Click, 'Reset Button', customerName);
		},
		[vibrate]
	);

	const beverageTags = useMemo(() => {
		const _beverageTags: TBeverageTag[] = [];

		if (currentBeverageName) {
			_beverageTags.push(...instance_beverage.getPropsByName(currentBeverageName, 'tags'));
		}

		return _beverageTags;
	}, [currentBeverageName, instance_beverage]);

	const currentRecipeTagsWithPopular = useMemo(() => {
		const _currentRecipeTagsWithPopular: TRecipeTag[] = [];

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

			_currentRecipeTagsWithPopular.push(
				...instance_recipe.calculateTagsWithPopular(composedRecipeTags, currentCustomerPopular)
			);

			setTimeout(() => {
				customerStore.shared.recipe.tagsWithPopular.set(_currentRecipeTagsWithPopular);
			}, 0);
		}

		return _currentRecipeTagsWithPopular;
	}, [currentCustomerPopular, currentRecipeData, instance_ingredient, instance_recipe]);

	const avatarRatingColor = currentRating ? customerRatingColorMap[currentRating] : undefined;
	const avatarRatingContent = useMemo(() => {
		if (currentRating) {
			return currentRating;
		}

		const target = [];
		if (!currentBeverageName) {
			target.push('酒水');
		}
		if (!currentRecipeData) {
			target.push('料理');
		}
		if ((isDarkMatter && hasMystiaCooker) || !hasMystiaCooker) {
			target.push('顾客点单需求');
		}

		let content = target.join('、');
		if (!isDarkMatter && !hasMystiaCooker) {
			content += '或标记为使用“夜雀”系列厨具';
		}

		return `请选择${content}以评级`;
	}, [currentBeverageName, currentRating, currentRecipeData, hasMystiaCooker, isDarkMatter]);

	const getTagTooltip = useCallback(
		(type: keyof typeof currentCustomerOrder, tag: string) => {
			const tagType = type === 'beverageTag' ? '酒水' : '料理';
			const isCurrentTag = currentCustomerOrder[type] === tag;
			const isNormalMeal = hasMystiaCooker && !isDarkMatter;

			const cookerTip = '已使用“夜雀”系列厨具无视顾客点单需求';
			const orderTip = isNormalMeal
				? isOrderLinkedFilter
					? ''
					: cookerTip
				: `点击：${isCurrentTag ? '不再' : ''}将此标签视为顾客点单需求`;
			const filterTip = isOrderLinkedFilter
				? `${isNormalMeal ? '点击：' : '并'}${
						isCurrentTag ? `取消筛选${tagType}表格` : `以此标签筛选${tagType}表格`
					}${isNormalMeal ? `（${cookerTip}）` : ''}`
				: '';

			return `${orderTip}${filterTip}`;
		},
		[currentCustomerOrder, hasMystiaCooker, isDarkMatter, isOrderLinkedFilter]
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

	const dlcLabel = currentCustomerDlc === 0 ? '游戏本体' : '';

	const clonedCurrentCustomerPlaces = [...currentCustomerPlaces];
	const currentCustomerMainPlace = clonedCurrentCustomerPlaces.shift();

	const {length: clonedCurrentCustomerPlacesLength} = clonedCurrentCustomerPlaces;

	const placeContent =
		clonedCurrentCustomerPlacesLength > 0
			? `其他出没地区：${clonedCurrentCustomerPlaces.join('、')}`
			: '暂未收录其他出没地区';

	return (
		<Card
			fullWidth
			shadow="sm"
			classNames={{
				base: twJoin(isShowBackgroundImage && 'bg-content1/40 backdrop-blur'),
			}}
			ref={ref}
		>
			<div className="flex flex-col gap-3 p-4 md:flex-row">
				<div className="flex flex-col justify-evenly gap-2">
					<Popover showArrow color={avatarRatingColor} offset={12}>
						<Tooltip showArrow color={avatarRatingColor} content={avatarRatingContent}>
							<div className="flex cursor-pointer self-center">
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
												base: twJoin('h-12 w-12 lg:h-16 lg:w-16', currentRating && 'ring-4'),
												icon: 'inline-table lg:inline-block',
											}}
										/>
										<span className="text-md text-center font-bold">{currentCustomerName}</span>
									</div>
								</PopoverTrigger>
							</div>
						</Tooltip>
						<PopoverContent>{avatarRatingContent}</PopoverContent>
					</Popover>
					<div className="whitespace-nowrap text-xs font-medium text-default-400 dark:text-default-500">
						<p className="flex justify-between">
							<Popover showArrow isTriggerDisabled={!dlcLabel} offset={6}>
								<Tooltip showArrow content={dlcLabel} isDisabled={!dlcLabel} offset={4}>
									<span className={twJoin(!dlcLabel && 'cursor-text')}>
										<PopoverTrigger>
											<span
												role={dlcLabel ? 'button' : undefined}
												tabIndex={dlcLabel ? 0 : undefined}
												title={dlcLabel}
												className={twJoin(
													'opacity-100',
													dlcLabel && 'underline-dotted-offset2'
												)}
											>
												DLC{currentCustomerDlc}
											</span>
										</PopoverTrigger>
									</span>
								</Tooltip>
								<PopoverContent>{dlcLabel}</PopoverContent>
							</Popover>
							<Popover showArrow offset={6}>
								<Tooltip showArrow content={placeContent} offset={4}>
									<span className="cursor-pointer">
										<PopoverTrigger>
											<span
												role="button"
												tabIndex={0}
												className={twJoin(
													clonedCurrentCustomerPlacesLength > 0 && 'underline-dotted-offset2'
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
							可能持有：<Price>{currentCustomerPrice}</Price>
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
									content={getTagTooltip('recipeTag', tag)}
									closeDelay={0}
									delay={500}
									isDisabled={!isShowTagsTooltip}
									size="sm"
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
										tagType="positive"
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
											'cursor-pointer p-1 leading-none transition-opacity hover:opacity-hover',
											(isDarkMatter || !currentRecipeTagsWithPopular.includes(tag)) &&
												'opacity-50',
											currentCustomerOrder.recipeTag === tag &&
												((hasMystiaCooker && isDarkMatter) || !hasMystiaCooker) &&
												'ring-2 ring-current',
											hasMystiaCooker &&
												!isDarkMatter &&
												!isOrderLinkedFilter &&
												'cursor-not-allowed'
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
									tagType="negative"
									className={twJoin(
										'cursor-not-allowed p-1 leading-none',
										(isDarkMatter || !currentRecipeTagsWithPopular.includes(tag)) && 'opacity-50'
									)}
								/>
							))}
						</TagGroup>
					)}
					{currentCustomerBeverageTags.length > 0 && (
						<TagGroup>
							{intersection(
								customerStore.beverage.tags.get().map(toValue),
								currentCustomerBeverageTags
							).map((tag) => (
								<Tooltip
									key={tag}
									showArrow
									content={getTagTooltip('beverageTag', tag)}
									closeDelay={0}
									delay={500}
									isDisabled={!isShowTagsTooltip}
									size="sm"
								>
									<Tags.Tag
										tag={tag}
										tagStyle={customerTagStyleMap[currentCustomerTarget].beverage}
										tagType="positive"
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
											'cursor-pointer p-1 leading-none transition-opacity hover:opacity-hover',
											!beverageTags.includes(tag) && 'opacity-50',
											currentCustomerOrder.beverageTag === tag &&
												((hasMystiaCooker && isDarkMatter) || !hasMystiaCooker) &&
												'ring-2 ring-current',
											hasMystiaCooker &&
												!isDarkMatter &&
												!isOrderLinkedFilter &&
												'cursor-not-allowed'
										)}
									/>
								</Tooltip>
							))}
						</TagGroup>
					)}
				</div>
				{hasSelected ? (
					<Tooltip showArrow content="重置当前选定项" offset={4}>
						<FontAwesomeIconButton
							icon={faArrowsRotate}
							variant="light"
							onPress={() => {
								handleRefreshSelectedItems(currentCustomerName);
							}}
							aria-label="重置当前选定项"
							className="absolute -right-0.5 top-1 h-4 w-4 text-default-200 transition-opacity hover:opacity-hover data-[hover=true]:bg-transparent dark:text-default-300"
						/>
					</Tooltip>
				) : (
					<Tooltip showArrow content="取消选择当前顾客" offset={4}>
						<FontAwesomeIconButton
							icon={faXmark}
							variant="light"
							onPress={handleRefreshCustomer}
							aria-label="取消选择当前顾客"
							className="absolute -right-0.5 top-1 h-4 w-4 text-default-200 transition-opacity hover:opacity-hover data-[hover=true]:bg-transparent dark:text-default-300"
						/>
					</Tooltip>
				)}
				<InfoButton />
			</div>
		</Card>
	);
});
