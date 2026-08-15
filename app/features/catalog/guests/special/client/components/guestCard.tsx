import { faArrowsRotate, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Divider } from '@heroui/divider';
import { cn } from '@heroui/theme';
import { useCallback, useMemo, useState } from 'react';

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
import type { TSpecialGuestName } from '@/domain/data/guests/special/types';
import { BEVERAGE_TAG_MAP, FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';
import { GUEST_RATING_MAP } from '@/domain/evaluation/labels';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import { GuestCardSiteInfo } from '@/features/catalog/guests/shared/client/components/infoButtonBase';
import RatingAvatarShell from '@/features/catalog/guests/shared/client/components/ratingAvatarShell';
import SlidingSprite from '@/features/catalog/guests/shared/client/components/slidingSprite';
import TagGroup from '@/features/catalog/guests/shared/client/components/tagGroup';
import { buildRareTagTooltip } from '@/features/catalog/guests/shared/presentation/buildTagTooltip';
import { specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import { getSpecialGuestDisplayMeta } from '@/features/catalog/presentation/guestDisplayMeta';
import { SPECIAL_GUEST_TAG_STYLE } from '@/features/catalog/presentation/tagStyles';
import Price from '@/features/catalog/shared/client/components/Price';
import Tags from '@/features/catalog/shared/client/components/Tags';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';
import { numberSort } from '@/shared/utilities/sort/numberSort';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';

import InfoButton from './infoButton';

export default function GuestCard() {
	const { isHighAppearance } = useDesignPreferences();
	const { pushState } = usePathname();
	const vibrate = useVibrate();

	const [infoButtonAnchorElement, setInfoButtonAnchorElement] =
		useState<HTMLDivElement | null>(null);

	const currentSpecialGuest = specialGuestStore.shared.guest.id.use();
	const selectedGuestBeverageTag =
		specialGuestStore.shared.guest.select.beverageTag.use();
	const selectedGuestFoodTags =
		specialGuestStore.shared.guest.select.foodTag.use();
	const currentGuestOrder = specialGuestStore.shared.guest.order.use();
	const currentRating = specialGuestStore.shared.guest.rating.use();
	const hasMystiaCooker =
		specialGuestStore.shared.guest.hasMystiaCooker.use();
	const isDarkMatter = specialGuestStore.shared.guest.isDarkMatter.use();
	const isOrderLinkedFilter =
		specialGuestStore.persistence.guest.orderLinkedFilter.use();
	const isShowTagDescription =
		specialGuestStore.persistence.guest.showTagDescription.use();

	const currentBeverage = specialGuestStore.shared.beverage.id.use();
	const currentMealFood = specialGuestStore.shared.recipe.data.use();
	const currentFoodTagsWithTrend =
		specialGuestStore.shared.recipe.tagsWithTrend.use();
	const unsatisfiedSelectionTip =
		specialGuestStore.unsatisfiedSelectionTip.use();

	const isShowTagsTooltip =
		globalStore.persistence.guestCardTagsTooltip.use();

	const beverageCatalog = specialGuestStore.instances.beverage.get();
	const specialGuestCatalog = specialGuestStore.instances.guest.get();

	const hasRating = currentRating !== null;

	const hasSelected =
		currentGuestOrder.beverageTag !== null ||
		currentGuestOrder.foodTag !== null ||
		currentBeverage !== null ||
		currentMealFood !== null ||
		!checkLengthEmpty(selectedGuestBeverageTag) ||
		!checkLengthEmpty(selectedGuestFoodTags);

	const handleBeverageTagPress = useCallback(
		(tag: TBeverageTagId) => {
			vibrate();
			specialGuestStore.onGuestOrderBeverageTag(tag);
			if (isOrderLinkedFilter) {
				specialGuestStore.onGuestFilterBeverageTag(
					tag,
					hasMystiaCooker
				);
			}
		},
		[hasMystiaCooker, isOrderLinkedFilter, vibrate]
	);

	const handleFoodTagPress = useCallback(
		(tag: TFoodTagId) => {
			vibrate();
			specialGuestStore.onGuestOrderFoodTag(tag);
			if (isOrderLinkedFilter) {
				specialGuestStore.onGuestFilterFoodTag(tag, hasMystiaCooker);
			}
		},
		[hasMystiaCooker, isOrderLinkedFilter, vibrate]
	);

	const handleRefreshGuest = useCallback(() => {
		vibrate();
		specialGuestStore.onGuestSelectedChange(null);
		pushState('/special-guests');
	}, [pushState, vibrate]);

	const handleRefreshSelectedItems = useCallback(
		(guestName: TSpecialGuestName) => {
			vibrate();
			specialGuestStore.refreshGuestSelectedItems();
			trackEvent(trackEvent.category.click, 'Reset Button', guestName);
		},
		[vibrate]
	);

	const beverageTags = useMemo(
		() =>
			currentBeverage === null
				? ([] as TBeverageTagId[])
				: beverageCatalog.getPropsById(currentBeverage, 'tags'),
		[beverageCatalog, currentBeverage]
	);

	const avatarRatingContent = hasRating
		? GUEST_RATING_MAP[currentRating]
		: unsatisfiedSelectionTip.rating;

	const avatarRatingColor = hasRating
		? (`${currentRating}-border` as const)
		: undefined;
	const tooltipRatingColor = hasRating ? currentRating : undefined;
	const cardClassNames = useMemo(
		() => ({
			base: cn(
				'!transition motion-reduce:!transition-none',
				{
					'bg-content1/40 backdrop-blur': isHighAppearance,
					'ring-4 ring-opacity-50': hasRating,
					'ring-8': currentRating === 'exgood',
				},
				avatarRatingColor !== undefined &&
					ratingStyles[avatarRatingColor]
			),
		}),
		[avatarRatingColor, currentRating, hasRating, isHighAppearance]
	);
	const avatarClassNames = useMemo(
		() => ({
			base: cn(
				'h-12 w-12 transition motion-reduce:transition-none lg:h-16 lg:w-16',
				{ 'ring-4': hasRating }
			),
			icon: 'inline-table lg:inline-block',
		}),
		[hasRating]
	);

	const getTagTooltip = useCallback(
		(type: 'beverageTag' | 'foodTag', tag: string) =>
			buildRareTagTooltip({
				currentOrderTag:
					type === 'beverageTag'
						? currentGuestOrder.beverageTag === null
							? null
							: BEVERAGE_TAG_MAP[currentGuestOrder.beverageTag]
						: currentGuestOrder.foodTag === null
							? null
							: FOOD_TAG_MAP[currentGuestOrder.foodTag],
				hasMystiaCooker,
				isDarkMatter: Boolean(isDarkMatter),
				isOrderLinkedFilter,
				tag,
				type,
			}),
		[currentGuestOrder, hasMystiaCooker, isDarkMatter, isOrderLinkedFilter]
	);

	if (currentSpecialGuest === null) {
		return null;
	}

	const {
		beverageTagMapping: currentGuestBeverageTagMapping,
		beverageTags: currentGuestBeverageTags,
		dlc: currentGuestDlc,
		enduranceLimit: currentGuestEnduranceLimit,
		name: currentGuestName,
		negativeTags: currentGuestNegativeTags,
		positiveTagMapping: currentGuestPositiveTagMapping,
		positiveTags: currentGuestPositiveTags,
		price: currentGuestPrice,
	} = specialGuestCatalog.getPropsById(currentSpecialGuest);
	const {
		averagePrice: currentGuestAveragePrice,
		enduranceLimitPercent: currentGuestEnduranceLimitPercent,
		hasEnduranceLimit,
		hasNegativeSpellCards,
		hasOtherPlaces,
		mainPlace: currentGuestMainPlace,
		placeContent,
	} = getSpecialGuestDisplayMeta(specialGuestCatalog, currentSpecialGuest);

	const { label: dlcLabel, shortLabel: dlcShortLabel } =
		DLC_LABEL_MAP[currentGuestDlc];

	const enduranceLimitContent = (
		<div>
			<p>
				{hasEnduranceLimit ? (
					<>
						可超支预算
						<Price showSymbol={false}>
							{currentGuestEnduranceLimitPercent}
						</Price>
						%
					</>
				) : hasNegativeSpellCards ? (
					'不接受预算超支'
				) : (
					''
				)}
				{hasNegativeSpellCards &&
					`（超${hasEnduranceLimit ? '过' : '支'}则释放惩罚符卡）`}
			</p>
			<p>
				最少
				<Price>
					{Math.ceil(
						currentGuestPrice[0] * currentGuestEnduranceLimit
					)}
				</Price>
				，平均
				<Price>
					{currentGuestAveragePrice}
					{hasEnduranceLimit &&
						`-${Math.ceil(currentGuestAveragePrice * currentGuestEnduranceLimit)}`}
				</Price>
				，最多
				<Price>
					{Math.ceil(
						currentGuestPrice[1] * currentGuestEnduranceLimit
					)}
				</Price>
			</p>
		</div>
	);

	return (
		<Card fullWidth shadow="sm" classNames={cardClassNames}>
			<div className="flex flex-col gap-3 p-4 md:flex-row">
				<div className="flex flex-col justify-evenly gap-2">
					<div
						ref={setInfoButtonAnchorElement}
						className="relative self-center"
					>
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
													<SlidingSprite
														target="special_guest"
														recordId={
															currentSpecialGuest
														}
														size={4}
													/>
												}
												classNames={avatarClassNames}
											/>
											<span className="whitespace-nowrap text-center font-bold">
												{currentGuestName}
											</span>
										</div>
									</PopoverTrigger>
								</div>
							}
						/>
					</div>
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
							<Popover showArrow offset={hasOtherPlaces ? 6 : 4}>
								<Tooltip
									showArrow
									content={placeContent}
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
															hasOtherPlaces,
													}
												)}
											>
												{currentGuestMainPlace}
											</span>
										</PopoverTrigger>
									</span>
								</Tooltip>
								<PopoverContent>{placeContent}</PopoverContent>
							</Popover>
						</p>
						<div className="flex items-center justify-between gap-4">
							<p>
								可能持有：
								<Popover showArrow offset={4}>
									<Tooltip
										showArrow
										content={enduranceLimitContent}
										offset={0}
									>
										<span className="cursor-pointer">
											<PopoverTrigger>
												<span
													role="button"
													tabIndex={0}
													className={cn(
														CLASSNAME_FOCUS_VISIBLE_OUTLINE,
														'underline-dotted-linear'
													)}
												>
													<Price>
														{currentGuestPrice}
													</Price>
												</span>
											</PopoverTrigger>
										</span>
									</Tooltip>
									<PopoverContent>
										{enduranceLimitContent}
									</PopoverContent>
								</Popover>
							</p>
							<InfoButton
								desktopTriggerContainer={
									infoButtonAnchorElement
								}
							/>
						</div>
					</div>
				</div>
				<Divider className="md:hidden" />
				<Divider orientation="vertical" className="hidden md:block" />
				<div className="flex w-full flex-col justify-evenly gap-3 whitespace-nowrap">
					{!checkLengthEmpty(currentGuestPositiveTags) && (
						<TagGroup>
							{currentGuestPositiveTags
								.toSorted((a, b) =>
									pinyinSort(FOOD_TAG_MAP[a], FOOD_TAG_MAP[b])
								)
								.map((tag) => {
									const tagLabel = FOOD_TAG_MAP[tag];
									const tagDescription = (
										currentGuestPositiveTagMapping as Partial<
											Record<TFoodTagId, string>
										>
									)[tag];
									return (
										<Tooltip
											key={tag}
											showArrow
											content={getTagTooltip(
												'foodTag',
												tagLabel
											)}
											closeDelay={0}
											delay={500}
											isDisabled={!isShowTagsTooltip}
											size="sm"
										>
											<Tags.Tag
												isButton
												tag={
													isShowTagDescription &&
													tagDescription !== undefined
														? [
																tagLabel,
																tagDescription,
															]
														: tagLabel
												}
												tagStyle={
													SPECIAL_GUEST_TAG_STYLE.positive
												}
												tagType="positive"
												onPress={() => {
													handleFoodTagPress(tag);
												}}
												aria-label={`${tagLabel}${currentGuestOrder.foodTag === tag ? '/已选定' : ''}${currentFoodTagsWithTrend.includes(tag) ? '/已满足' : ''}`}
												className={cn(
													'p-1 font-semibold leading-none data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover',
													{
														'cursor-not-allowed':
															hasMystiaCooker &&
															!isDarkMatter &&
															!isOrderLinkedFilter,
														'font-normal opacity-50':
															// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
															isDarkMatter ||
															!currentFoodTagsWithTrend.includes(
																tag
															),
														'ring-2 ring-current':
															currentGuestOrder.foodTag ===
																tag &&
															((hasMystiaCooker &&
																// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
																isDarkMatter) ||
																!hasMystiaCooker),
													}
												)}
											/>
										</Tooltip>
									);
								})}
						</TagGroup>
					)}
					{!checkLengthEmpty(currentGuestNegativeTags) && (
						<TagGroup>
							{currentGuestNegativeTags
								.toSorted((a, b) =>
									pinyinSort(FOOD_TAG_MAP[a], FOOD_TAG_MAP[b])
								)
								.map((tag) => (
									<Tags.Tag
										key={tag}
										tag={FOOD_TAG_MAP[tag]}
										tagStyle={
											SPECIAL_GUEST_TAG_STYLE.negative
										}
										tagType="negative"
										className={cn(
											'cursor-not-allowed p-1 font-semibold leading-none',
											{
												'font-normal opacity-50':
													// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
													isDarkMatter ||
													!currentFoodTagsWithTrend.includes(
														tag
													),
											}
										)}
									/>
								))}
						</TagGroup>
					)}
					{!checkLengthEmpty(currentGuestBeverageTags) && (
						<TagGroup>
							{currentGuestBeverageTags
								.toSorted(numberSort)
								.map((tag) => {
									const tagLabel = BEVERAGE_TAG_MAP[tag];
									const tagDescription = (
										currentGuestBeverageTagMapping as Partial<
											Record<TBeverageTagId, string>
										>
									)[tag];
									return (
										<Tooltip
											key={tag}
											showArrow
											content={getTagTooltip(
												'beverageTag',
												tagLabel
											)}
											closeDelay={0}
											delay={500}
											isDisabled={!isShowTagsTooltip}
											size="sm"
										>
											<Tags.Tag
												isButton
												tag={
													isShowTagDescription &&
													tagDescription !== undefined
														? [
																tagLabel,
																tagDescription,
															]
														: tagLabel
												}
												tagStyle={
													SPECIAL_GUEST_TAG_STYLE.beverage
												}
												tagType="positive"
												onPress={() => {
													handleBeverageTagPress(tag);
												}}
												aria-label={`${tagLabel}${currentGuestOrder.beverageTag === tag ? '/已选定' : ''}${beverageTags.includes(tag) ? '/已满足' : ''}`}
												className={cn(
													'p-1 font-semibold leading-none data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover',
													{
														'cursor-not-allowed':
															hasMystiaCooker &&
															!isDarkMatter &&
															!isOrderLinkedFilter,
														'font-normal opacity-50':
															!beverageTags.includes(
																tag
															),
														'ring-2 ring-current':
															currentGuestOrder.beverageTag ===
																tag &&
															((hasMystiaCooker &&
																// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
																isDarkMatter) ||
																!hasMystiaCooker),
													}
												)}
											/>
										</Tooltip>
									);
								})}
						</TagGroup>
					)}
				</div>
				{hasSelected ? (
					<Tooltip showArrow content="重置当前选定项" offset={4}>
						<FontAwesomeIconButton
							icon={faArrowsRotate}
							variant="light"
							onPress={() => {
								handleRefreshSelectedItems(currentGuestName);
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
							onPress={handleRefreshGuest}
							aria-label="取消选择当前顾客"
							className="absolute right-1 top-1 h-4 w-4 min-w-0 text-default-400 data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover data-[hover=true]:backdrop-blur-none data-[pressed=true]:backdrop-blur-none"
						/>
					</Tooltip>
				)}
				<GuestCardSiteInfo />
			</div>
		</Card>
	);
}
