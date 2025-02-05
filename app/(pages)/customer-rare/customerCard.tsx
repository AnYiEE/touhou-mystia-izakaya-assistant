import {useCallback, useMemo} from 'react';

import {useVibrate} from '@/hooks';

import {Divider} from '@heroui/divider';
import {faArrowsRotate, faXmark} from '@fortawesome/free-solid-svg-icons';

import {ratingStyles} from '@/design/theme/styles/rating';
import {
	Avatar,
	CLASSNAME_FOCUS_VISIBLE_OUTLINE,
	Card,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	cn,
} from '@/design/ui/components';

import InfoButton from './infoButton';
import TagGroup from './tagGroup';
import {trackEvent} from '@/components/analytics';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Price from '@/components/price';
import Sprite from '@/components/sprite';
import Tags from '@/components/tags';

import {
	CUSTOMER_RARE_TAG_STYLE,
	CUSTOMER_RATING_MAP,
	LABEL_MAP,
	type TBeverageTag,
	type TCustomerRareName,
	type TRecipeTag,
} from '@/data';
import {customerRareStore as customerStore, globalStore} from '@/stores';
import {copyArray, pinyinSort} from '@/utilities';

export default function CustomerCard() {
	const vibrate = useVibrate();

	const currentCustomerName = customerStore.shared.customer.name.use();
	const selectedCustomerBeverageTag = customerStore.shared.customer.select.beverageTag.use();
	const selectedCustomerRecipeTag = customerStore.shared.customer.select.recipeTag.use();
	const currentCustomerOrder = customerStore.shared.customer.order.use();
	const currentRating = customerStore.shared.customer.rating.use();
	const hasMystiaCooker = customerStore.shared.customer.hasMystiaCooker.use();
	const isDarkMatter = customerStore.shared.customer.isDarkMatter.use();
	const isOrderLinkedFilter = customerStore.persistence.customer.orderLinkedFilter.use();
	const isShowTagDescription = customerStore.persistence.customer.showTagDescription.use();

	const currentBeverageName = customerStore.shared.beverage.name.use();
	const currentRecipeData = customerStore.shared.recipe.data.use();
	const currentRecipeTagsWithTrend = customerStore.shared.recipe.tagsWithTrend.use();

	const isHighAppearance = globalStore.persistence.highAppearance.use();
	const isShowTagsTooltip = globalStore.persistence.customerCardTagsTooltip.use();

	const instance_beverage = customerStore.instances.beverage.get();
	const instance_customer = customerStore.instances.customer.get();

	const hasRating = currentRating !== null;

	const hasSelected =
		currentCustomerOrder.beverageTag !== null ||
		currentCustomerOrder.recipeTag !== null ||
		currentBeverageName !== null ||
		currentRecipeData !== null ||
		selectedCustomerBeverageTag.size > 0 ||
		selectedCustomerRecipeTag.size > 0;

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
		customerStore.shared.customer.name.set(null);
	}, [vibrate]);

	const handleRefreshSelectedItems = useCallback(
		(customerName: TCustomerRareName) => {
			vibrate();
			customerStore.refreshCustomerSelectedItems();
			trackEvent(trackEvent.category.Click, 'Reset Button', customerName);
		},
		[vibrate]
	);

	const beverageTags = useMemo(() => {
		const _beverageTags: TBeverageTag[] = [];

		if (currentBeverageName !== null) {
			_beverageTags.push(...instance_beverage.getPropsByName(currentBeverageName, 'tags'));
		}

		return _beverageTags;
	}, [currentBeverageName, instance_beverage]);

	const avatarRatingContent = useMemo(() => {
		if (hasRating) {
			return CUSTOMER_RATING_MAP[currentRating];
		}

		const target = [];
		if (currentBeverageName === null) {
			target.push('酒水');
		}
		if (currentRecipeData === null) {
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
	}, [currentBeverageName, currentRating, currentRecipeData, hasMystiaCooker, hasRating, isDarkMatter]);

	const avatarRatingColor = hasRating ? (`${currentRating}-border` as const) : undefined;
	const tooltipRatingColor = hasRating ? currentRating : undefined;

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

	if (currentCustomerName === null) {
		return null;
	}

	const {
		beverageTags: currentCustomerBeverageTags,
		dlc: currentCustomerDlc,
		negativeTags: currentCustomerNegativeTags,
		places: currentCustomerPlaces,
		positiveTagMapping: currentCustomerPositiveTagMapping,
		positiveTags: currentCustomerPositiveTags,
		price: currentCustomerPrice,
	} = instance_customer.getPropsByName(currentCustomerName);

	const dlcLabel = currentCustomerDlc === 0 ? LABEL_MAP.dlc0 : '';

	const copiedCurrentCustomerPlaces = copyArray(currentCustomerPlaces);
	const currentCustomerMainPlace = copiedCurrentCustomerPlaces.shift();

	const hasOtherPlaces = copiedCurrentCustomerPlaces.length > 0;

	const placeContent = hasOtherPlaces
		? `其他出没地区：${copiedCurrentCustomerPlaces.join('、')}`
		: '暂未收录其他出没地区';

	return (
		<Card
			fullWidth
			shadow="sm"
			classNames={{
				base: cn(
					'!transition motion-reduce:!transition-none',
					{
						'bg-content1/40 backdrop-blur': isHighAppearance,
						'ring-4 ring-opacity-50': hasRating,
						'ring-8': currentRating === 'exgood',
					},
					avatarRatingColor !== undefined && ratingStyles[avatarRatingColor]
				),
			}}
		>
			<div className="flex flex-col gap-3 p-4 md:flex-row">
				<div className="flex flex-col justify-evenly gap-2">
					<Popover showArrow color={tooltipRatingColor} offset={hasRating ? 13 : 9}>
						<Tooltip
							showArrow
							color={tooltipRatingColor}
							content={avatarRatingContent}
							offset={hasRating ? 9 : 5}
						>
							<div className="flex cursor-pointer self-center">
								<PopoverTrigger>
									<div
										role="button"
										tabIndex={0}
										className={cn(
											'flex flex-col items-center gap-2',
											CLASSNAME_FOCUS_VISIBLE_OUTLINE
										)}
									>
										<Avatar
											isBordered={hasRating}
											color={avatarRatingColor}
											radius="full"
											icon={<Sprite target="customer_rare" name={currentCustomerName} size={4} />}
											classNames={{
												base: cn(
													'h-12 w-12 transition motion-reduce:transition-none lg:h-16 lg:w-16',
													{
														'ring-4': hasRating,
													}
												),
												icon: 'inline-table lg:inline-block',
											}}
										/>
										<span className="whitespace-nowrap text-center font-bold">
											{currentCustomerName}
										</span>
									</div>
								</PopoverTrigger>
							</div>
						</Tooltip>
						<PopoverContent>{avatarRatingContent}</PopoverContent>
					</Popover>
					<div className="whitespace-nowrap text-tiny font-medium text-default-800">
						<p className="flex justify-between gap-10">
							<Popover showArrow isTriggerDisabled={!dlcLabel} offset={4}>
								<Tooltip showArrow content={dlcLabel} isDisabled={!dlcLabel} offset={0}>
									<span
										className={cn({
											'cursor-text': !dlcLabel,
										})}
									>
										<PopoverTrigger>
											<span
												role={dlcLabel ? 'button' : undefined}
												tabIndex={dlcLabel ? 0 : undefined}
												title={dlcLabel}
												className={cn('opacity-100', {
													[CLASSNAME_FOCUS_VISIBLE_OUTLINE]: dlcLabel,
													'underline-dotted-linear': dlcLabel,
												})}
											>
												DLC{currentCustomerDlc}
											</span>
										</PopoverTrigger>
									</span>
								</Tooltip>
								<PopoverContent>{dlcLabel}</PopoverContent>
							</Popover>
							<Popover showArrow offset={hasOtherPlaces ? 6 : 4}>
								<Tooltip showArrow content={placeContent} offset={2}>
									<span className="cursor-pointer">
										<PopoverTrigger>
											<span
												role="button"
												tabIndex={0}
												className={cn(CLASSNAME_FOCUS_VISIBLE_OUTLINE, {
													'underline-dotted-linear': hasOtherPlaces,
												})}
											>
												{currentCustomerMainPlace}
											</span>
										</PopoverTrigger>
									</span>
								</Tooltip>
								<PopoverContent>{placeContent}</PopoverContent>
							</Popover>
						</p>
						<p>
							可能持有：<Price>{currentCustomerPrice}</Price>
						</p>
					</div>
				</div>
				<Divider className="md:hidden" />
				<Divider orientation="vertical" className="hidden md:block" />
				<div className="flex w-full flex-col justify-evenly gap-3 whitespace-nowrap">
					{currentCustomerPositiveTags.length > 0 && (
						<TagGroup>
							{copyArray(currentCustomerPositiveTags)
								.sort(pinyinSort)
								.map((tag, index) => (
									<Tooltip
										key={index}
										showArrow
										content={getTagTooltip('recipeTag', tag)}
										closeDelay={0}
										delay={500}
										isDisabled={!isShowTagsTooltip}
										size="sm"
									>
										<Tags.Tag
											isButton
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
											tagStyle={CUSTOMER_RARE_TAG_STYLE.positive}
											tagType="positive"
											onPress={() => {
												handleRecipeTagClick(tag);
											}}
											aria-label={`${tag}${currentCustomerOrder.recipeTag === tag ? '/已选定' : ''}${currentRecipeTagsWithTrend.includes(tag) ? '/已满足' : ''}`}
											className={cn(
												'p-1 font-semibold leading-none data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover',
												{
													'cursor-not-allowed':
														hasMystiaCooker && !isDarkMatter && !isOrderLinkedFilter,
													'font-normal opacity-50':
														isDarkMatter || !currentRecipeTagsWithTrend.includes(tag),
													'ring-2 ring-current':
														currentCustomerOrder.recipeTag === tag &&
														((hasMystiaCooker && isDarkMatter) || !hasMystiaCooker),
												}
											)}
										/>
									</Tooltip>
								))}
						</TagGroup>
					)}
					{currentCustomerNegativeTags.length > 0 && (
						<TagGroup>
							{copyArray(currentCustomerNegativeTags)
								.sort(pinyinSort)
								.map((tag, index) => (
									<Tags.Tag
										key={index}
										tag={tag}
										tagStyle={CUSTOMER_RARE_TAG_STYLE.negative}
										tagType="negative"
										className={cn('cursor-not-allowed p-1 font-semibold leading-none', {
											'font-normal opacity-50':
												isDarkMatter || !currentRecipeTagsWithTrend.includes(tag),
										})}
									/>
								))}
						</TagGroup>
					)}
					{currentCustomerBeverageTags.length > 0 && (
						<TagGroup>
							{currentCustomerBeverageTags.map((tag, index) => (
								<Tooltip
									key={index}
									showArrow
									content={getTagTooltip('beverageTag', tag)}
									closeDelay={0}
									delay={500}
									isDisabled={!isShowTagsTooltip}
									size="sm"
								>
									<Tags.Tag
										isButton
										tag={tag}
										tagStyle={CUSTOMER_RARE_TAG_STYLE.beverage}
										tagType="positive"
										onPress={() => {
											handleBeverageTagClick(tag);
										}}
										aria-label={`${tag}${currentCustomerOrder.beverageTag === tag ? '/已选定' : ''}${beverageTags.includes(tag) ? '/已满足' : ''}`}
										className={cn(
											'p-1 font-semibold leading-none data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover',
											{
												'cursor-not-allowed':
													hasMystiaCooker && !isDarkMatter && !isOrderLinkedFilter,
												'font-normal opacity-50': !beverageTags.includes(tag),
												'ring-2 ring-current':
													currentCustomerOrder.beverageTag === tag &&
													((hasMystiaCooker && isDarkMatter) || !hasMystiaCooker),
											}
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
							className="absolute right-1 top-1 h-4 w-4 min-w-0 text-default-400 data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover data-[hover=true]:backdrop-blur-none data-[pressed=true]:backdrop-blur-none"
						/>
					</Tooltip>
				) : (
					<Tooltip showArrow content="取消选择当前顾客" offset={4}>
						<FontAwesomeIconButton
							icon={faXmark}
							variant="light"
							onPress={handleRefreshCustomer}
							aria-label="取消选择当前顾客"
							className="absolute right-1 top-1 h-4 w-4 min-w-0 text-default-400 data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover data-[hover=true]:backdrop-blur-none data-[pressed=true]:backdrop-blur-none"
						/>
					</Tooltip>
				)}
				<InfoButton />
			</div>
		</Card>
	);
}
