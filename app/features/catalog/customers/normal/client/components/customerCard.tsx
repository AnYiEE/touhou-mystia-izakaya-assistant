import { faArrowsRotate, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Divider } from '@heroui/divider';
import { cn } from '@heroui/theme';
import { useCallback, useMemo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import { ratingStyles } from '@/design/theme/styles/rating/ratingStyles';
import Avatar from '@/design/ui/components/avatar';
import Card from '@/design/ui/components/card';
import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import FontAwesomeIconButton from '@/design/ui/components/fontAwesomeIconButton';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import Tooltip from '@/design/ui/components/tooltip';

import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import type { TCustomerNormalName } from '@/domain/data/customers/normal/types';
import type { TBeverageTag, TRecipeTag } from '@/domain/data/tags/types';
import { CUSTOMER_RATING_MAP } from '@/domain/evaluation/labels';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import { customerNormalStore } from '@/features/catalog/customers/normal/client/state/store';
import RatingAvatarShell from '@/features/catalog/customers/shared/client/components/ratingAvatarShell';
import SlidingSprite from '@/features/catalog/customers/shared/client/components/slidingSprite';
import TagGroup from '@/features/catalog/customers/shared/client/components/tagGroup';
import { buildNormalTagTooltip } from '@/features/catalog/customers/shared/presentation/buildTagTooltip';
import { getCustomerNormalDisplayMeta } from '@/features/catalog/presentation/customerDisplayMeta';
import { CUSTOMER_NORMAL_TAG_STYLE } from '@/features/catalog/presentation/tagStyles';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import Tags from '@/features/catalog/shared/client/components/Tags';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';
import { copyArray } from '@/shared/utilities/collections/convert';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';

import InfoButton from './infoButton';

export default function CustomerCard() {
	const { pushState } = usePathname();
	const vibrate = useVibrate();

	const currentCustomerName = customerNormalStore.shared.customer.name.use();
	const selectedCustomerBeverageTag =
		customerNormalStore.shared.customer.select.beverageTag.use();
	const selectedCustomerRecipeTag =
		customerNormalStore.shared.customer.select.recipeTag.use();
	const currentRating = customerNormalStore.shared.customer.rating.use();

	const currentBeverageName = customerNormalStore.shared.beverage.name.use();
	const currentRecipeData = customerNormalStore.shared.recipe.data.use();
	const currentRecipeTagsWithTrend =
		customerNormalStore.shared.recipe.tagsWithTrend.use();

	const { isHighAppearance } = useDesignPreferences();
	const isShowTagsTooltip =
		globalStore.persistence.customerCardTagsTooltip.use();

	const instance_beverage = customerNormalStore.instances.beverage.get();
	const instance_customer = customerNormalStore.instances.customer.get();

	const hasRating = currentRating !== null;

	const hasSelected =
		currentBeverageName !== null ||
		currentRecipeData !== null ||
		!checkLengthEmpty(selectedCustomerBeverageTag) ||
		!checkLengthEmpty(selectedCustomerRecipeTag);

	const handleBeverageTagPress = useCallback(
		(tag: TBeverageTag) => {
			vibrate();
			customerNormalStore.onCustomerFilterBeverageTag(tag);
		},
		[vibrate]
	);

	const handleRecipeTagPress = useCallback(
		(tag: TRecipeTag) => {
			vibrate();
			customerNormalStore.onCustomerFilterRecipeTag(tag);
		},
		[vibrate]
	);

	const handleRefreshCustomer = useCallback(() => {
		vibrate();
		customerNormalStore.onCustomerSelectedChange(null);
		pushState('/customer-normal');
	}, [pushState, vibrate]);

	const handleRefreshSelectedItems = useCallback(
		(customerName: TCustomerNormalName) => {
			vibrate();
			customerNormalStore.refreshCustomerSelectedItems();
			trackEvent(trackEvent.category.click, 'Reset Button', customerName);
		},
		[vibrate]
	);

	const beverageTags = useMemo(
		() =>
			currentBeverageName === null
				? ([] as TBeverageTag[])
				: instance_beverage.getPropsByName(currentBeverageName, 'tags'),
		[currentBeverageName, instance_beverage]
	);

	const avatarRatingContent =
		currentRating === null
			? '请选择点单料理以评级'
			: CUSTOMER_RATING_MAP[currentRating];

	const avatarRatingColor = hasRating
		? (`${currentRating}-border` as const)
		: undefined;
	const tooltipRatingColor = hasRating ? currentRating : undefined;

	const getTagTooltip = useCallback(
		(
			type: 'beverageTag' | 'recipeTag',
			selectedTags: SelectionSet,
			tag: string
		) => buildNormalTagTooltip({ selectedTags, tag, type }),
		[]
	);

	if (currentCustomerName === null) {
		return null;
	}

	const {
		beverageTags: currentCustomerBeverageTags,
		dlc: currentCustomerDlc,
		positiveTags: currentCustomerPositiveTags,
	} = instance_customer.getPropsByName(currentCustomerName);
	const {
		hasOtherPlaces,
		mainPlace: currentCustomerMainPlace,
		placeContent,
	} = getCustomerNormalDisplayMeta(instance_customer, currentCustomerName);

	const { label: dlcLabel, shortLabel: dlcShortLabel } =
		DLC_LABEL_MAP[currentCustomerDlc];

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
					},
					avatarRatingColor !== undefined &&
						ratingStyles[avatarRatingColor]
				),
			}}
		>
			<div className="flex flex-col gap-3 p-4 md:flex-row">
				<div className="flex flex-col justify-evenly gap-2">
					<RatingAvatarShell
						color={tooltipRatingColor}
						content={avatarRatingContent}
						popoverOffset={hasRating ? 13 : 9}
						tooltipOffset={hasRating ? 9 : 5}
						trigger={
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
											icon={
												<div className="h-16 w-16 overflow-hidden rounded-full">
													<SlidingSprite
														target="customer_normal"
														name={
															currentCustomerName
														}
														size={5.6}
														className="-translate-x-[0.77rem] -translate-y-0.5"
													/>
												</div>
											}
											classNames={{
												base: cn(
													'h-12 w-12 transition motion-reduce:transition-none lg:h-16 lg:w-16',
													{ 'ring-4': hasRating }
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
						}
					/>
					<div className="whitespace-nowrap text-tiny font-medium text-default-800">
						<p className="flex justify-between gap-10">
							<Popover
								showArrow
								isTriggerDisabled={!dlcShortLabel}
								offset={4}
							>
								<Tooltip
									showArrow
									content={dlcLabel}
									isDisabled={!dlcShortLabel}
									offset={0}
								>
									<span
										className={cn({
											'cursor-text': !dlcShortLabel,
										})}
									>
										<PopoverTrigger>
											<span
												role={
													dlcShortLabel
														? 'button'
														: undefined
												}
												tabIndex={
													dlcShortLabel
														? 0
														: undefined
												}
												title={dlcLabel}
												className={cn('opacity-100', {
													[CLASSNAME_FOCUS_VISIBLE_OUTLINE]:
														dlcShortLabel,
													'underline-dotted-linear':
														dlcShortLabel,
												})}
											>
												{dlcShortLabel || dlcLabel}
											</span>
										</PopoverTrigger>
									</span>
								</Tooltip>
								<PopoverContent>{dlcLabel}</PopoverContent>
							</Popover>
							{(() => {
								const isGoblin = currentCustomerName === '地精';
								const mainPlace = isGoblin
									? '符卡幻化'
									: currentCustomerMainPlace;
								const otherPlaces = isGoblin ? (
									<span className="inline-flex items-center">
										【
										<Sprite
											target="customer_rare"
											name="爱丽丝"
											size={1.25}
											className="mx-0.5 rounded-full"
										/>
										爱丽丝】奖励符卡
									</span>
								) : (
									placeContent
								);
								return (
									<Popover
										showArrow
										offset={
											hasOtherPlaces || isGoblin ? 6 : 4
										}
									>
										<Tooltip
											showArrow
											content={otherPlaces}
											offset={2}
										>
											<span className="cursor-pointer">
												<PopoverTrigger>
													<span
														role="button"
														tabIndex={0}
														className={cn(
															CLASSNAME_FOCUS_VISIBLE_OUTLINE,
															{
																'underline-dotted-linear':
																	hasOtherPlaces ||
																	isGoblin,
															}
														)}
													>
														{mainPlace}
													</span>
												</PopoverTrigger>
											</span>
										</Tooltip>
										<PopoverContent>
											{otherPlaces}
										</PopoverContent>
									</Popover>
								);
							})()}
						</p>
					</div>
				</div>
				<Divider className="md:hidden" />
				<Divider orientation="vertical" className="hidden md:block" />
				<div className="flex w-full flex-col justify-evenly gap-3 whitespace-nowrap">
					{!checkLengthEmpty(currentCustomerPositiveTags) && (
						<TagGroup>
							{copyArray(currentCustomerPositiveTags)
								.sort(pinyinSort)
								.map((tag, index) => (
									<Tooltip
										key={index}
										showArrow
										content={getTagTooltip(
											'recipeTag',
											selectedCustomerRecipeTag,
											tag
										)}
										closeDelay={0}
										delay={500}
										isDisabled={!isShowTagsTooltip}
										size="sm"
									>
										<Tags.Tag
											isButton
											tag={tag}
											tagStyle={
												CUSTOMER_NORMAL_TAG_STYLE.positive
											}
											tagType="positive"
											onPress={() => {
												handleRecipeTagPress(tag);
											}}
											aria-label={`${tag}${currentRecipeTagsWithTrend.includes(tag) ? '/已满足' : ''}`}
											className={cn(
												'p-1 font-semibold leading-none data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover',
												{
													'font-normal opacity-50':
														!currentRecipeTagsWithTrend.includes(
															tag
														),
												}
											)}
										/>
									</Tooltip>
								))}
						</TagGroup>
					)}
					{!checkLengthEmpty(currentCustomerBeverageTags) && (
						<TagGroup>
							{currentCustomerBeverageTags.map((tag, index) => (
								<Tooltip
									key={index}
									showArrow
									content={getTagTooltip(
										'beverageTag',
										selectedCustomerBeverageTag,
										tag
									)}
									closeDelay={0}
									delay={500}
									isDisabled={!isShowTagsTooltip}
									size="sm"
								>
									<Tags.Tag
										isButton
										tag={tag}
										tagStyle={
											CUSTOMER_NORMAL_TAG_STYLE.beverage
										}
										tagType="positive"
										onPress={() => {
											handleBeverageTagPress(tag);
										}}
										aria-label={`${tag}${beverageTags.includes(tag) ? '/已满足' : ''}`}
										className={cn(
											'p-1 font-semibold leading-none data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover',
											{
												'font-normal opacity-50':
													!beverageTags.includes(tag),
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
