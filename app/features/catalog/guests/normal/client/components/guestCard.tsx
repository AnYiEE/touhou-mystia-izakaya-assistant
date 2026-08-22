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
import type { TNormalGuestName } from '@/domain/data/guests/normal/types';
import { BEVERAGE_TAG_MAP, FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';
import { GUEST_RATING_MAP } from '@/domain/evaluation/labels';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import { normalGuestStore } from '@/features/catalog/guests/normal/client/state/store';
import { GuestCardSiteInfo } from '@/features/catalog/guests/shared/client/components/infoButtonBase';
import RatingAvatarShell from '@/features/catalog/guests/shared/client/components/ratingAvatarShell';
import SlidingSprite from '@/features/catalog/guests/shared/client/components/slidingSprite';
import TagGroup from '@/features/catalog/guests/shared/client/components/tagGroup';
import {
	buildNormalTagTooltip,
	isPopularTrendTag,
} from '@/features/catalog/guests/shared/presentation/buildTagTooltip';
import { getNormalGuestDisplayMeta } from '@/features/catalog/presentation/guestDisplayMeta';
import { NORMAL_GUEST_TAG_STYLE } from '@/features/catalog/presentation/tagStyles';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import Tags from '@/features/catalog/shared/client/components/Tags';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';

import InfoButton from './infoButton';

const ALICE_ID = 1002;
const GOBLIN_ID = 12;

export default function NormalGuestCard() {
	const { isHighAppearance } = useDesignPreferences();
	const { pushState } = usePathname();
	const vibrate = useVibrate();

	const currentNormalGuest = normalGuestStore.shared.guest.id.use();
	const selectedNormalGuestBeverageTags =
		normalGuestStore.shared.guest.select.beverageTag.use();
	const selectedNormalGuestFoodTags =
		normalGuestStore.shared.guest.select.foodTag.use();
	const currentRating = normalGuestStore.shared.guest.rating.use();

	const currentBeverage = normalGuestStore.shared.beverage.id.use();
	const currentMealFoodData = normalGuestStore.shared.recipe.data.use();
	const currentFoodTagsWithTrend =
		normalGuestStore.shared.recipe.tagsWithTrend.use();

	const isShowTagsTooltip =
		globalStore.persistence.guestCardTagsTooltip.use();

	const beverageCatalog = normalGuestStore.instances.beverage.get();
	const normalGuestCatalog = normalGuestStore.instances.guest.get();

	const hasRating = currentRating !== null;

	const hasSelected =
		currentBeverage !== null ||
		currentMealFoodData !== null ||
		!checkLengthEmpty(selectedNormalGuestBeverageTags) ||
		!checkLengthEmpty(selectedNormalGuestFoodTags);

	const handleBeverageTagPress = useCallback(
		(beverageTag: TBeverageTagId) => {
			vibrate();
			normalGuestStore.onGuestFilterBeverageTag(beverageTag);
		},
		[vibrate]
	);

	const handleFoodTagPress = useCallback(
		(foodTag: TFoodTagId) => {
			vibrate();
			normalGuestStore.onGuestFilterFoodTag(foodTag);
		},
		[vibrate]
	);

	const handleRefreshGuest = useCallback(() => {
		vibrate();
		normalGuestStore.onGuestSelectedChange(null);
		pushState('/normal-guests');
	}, [pushState, vibrate]);

	const handleRefreshSelectedItems = useCallback(
		(guestName: TNormalGuestName) => {
			vibrate();
			normalGuestStore.refreshGuestSelectedItems();
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

	const avatarRatingContent =
		currentRating === null
			? '请选择点单料理以评级'
			: GUEST_RATING_MAP[currentRating];

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
				},
				avatarRatingColor !== undefined &&
					ratingStyles[avatarRatingColor]
			),
		}),
		[avatarRatingColor, hasRating, isHighAppearance]
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
		(
			type: 'beverageTag' | 'foodTag',
			selectedTags: SelectionSet,
			tag: TBeverageTagId | TFoodTagId,
			tagLabel: string,
			isPopularTrend: boolean
		) =>
			buildNormalTagTooltip({
				isPopularTrend,
				selectedTags: { has: () => selectedTags.has(tag) },
				tag: tagLabel,
				type,
			}),
		[]
	);

	if (currentNormalGuest === null) {
		return null;
	}

	const {
		beverageTags: currentNormalGuestBeverageTags,
		dlc: currentNormalGuestDlc,
		name: currentNormalGuestName,
		positiveTags: currentNormalGuestPositiveTags,
	} = normalGuestCatalog.getPropsById(currentNormalGuest);
	const {
		hasOtherPlaces,
		mainPlace: currentNormalGuestMainPlace,
		placeContent,
	} = getNormalGuestDisplayMeta(normalGuestCatalog, currentNormalGuest);

	const { label: dlcLabel, shortLabel: dlcShortLabel } =
		DLC_LABEL_MAP[currentNormalGuestDlc];

	return (
		<Card fullWidth shadow="sm" classNames={cardClassNames}>
			<div className="flex flex-col gap-3 p-4 md:flex-row">
				<div className="flex flex-col justify-evenly gap-2">
					<div className="relative self-center">
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
															target="normal_guest"
															recordId={
																currentNormalGuest
															}
															size={5.6}
															className="-translate-x-[0.77rem] -translate-y-0.5"
														/>
													</div>
												}
												classNames={avatarClassNames}
											/>
											<span className="whitespace-nowrap text-center font-bold">
												{currentNormalGuestName}
											</span>
										</div>
									</PopoverTrigger>
								</div>
							}
						/>
						<InfoButton />
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
							{(() => {
								const isGoblin =
									currentNormalGuest === GOBLIN_ID;
								const mainPlace = isGoblin
									? '符卡幻化'
									: currentNormalGuestMainPlace;
								const otherPlaces = isGoblin ? (
									<span className="inline-flex items-center">
										【
										<Sprite
											target="special_guest"
											recordId={ALICE_ID}
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
					{!checkLengthEmpty(currentNormalGuestPositiveTags) && (
						<TagGroup>
							{currentNormalGuestPositiveTags
								.toSorted((a, b) =>
									pinyinSort(FOOD_TAG_MAP[a], FOOD_TAG_MAP[b])
								)
								.map((tag) => {
									const tagLabel = FOOD_TAG_MAP[tag];
									const isPopularTrend =
										isPopularTrendTag(tag);
									return (
										<Tooltip
											key={tag}
											showArrow
											content={getTagTooltip(
												'foodTag',
												selectedNormalGuestFoodTags,
												tag,
												tagLabel,
												isPopularTrend
											)}
											closeDelay={0}
											delay={500}
											isDisabled={!isShowTagsTooltip}
											size="sm"
										>
											<Tags.Tag
												isButton={!isPopularTrend}
												tag={tagLabel}
												tagStyle={
													NORMAL_GUEST_TAG_STYLE.positive
												}
												tagType="positive"
												onPress={
													isPopularTrend
														? undefined
														: () => {
																handleFoodTagPress(
																	tag
																);
															}
												}
												aria-label={`${tagLabel}${isPopularTrend ? '/不会被顾客点单' : ''}${currentFoodTagsWithTrend.includes(tag) ? '/已满足' : ''}`}
												tabIndex={
													isPopularTrend &&
													isShowTagsTooltip
														? 0
														: undefined
												}
												className={cn(
													'p-1 font-semibold leading-none',
													{
														[CLASSNAME_FOCUS_VISIBLE_OUTLINE]:
															isPopularTrend &&
															isShowTagsTooltip,
														'cursor-not-allowed':
															isPopularTrend,
														'data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover':
															!isPopularTrend,
														'font-normal opacity-50':
															!currentFoodTagsWithTrend.includes(
																tag
															),
													}
												)}
											/>
										</Tooltip>
									);
								})}
						</TagGroup>
					)}
					{!checkLengthEmpty(currentNormalGuestBeverageTags) && (
						<TagGroup>
							{currentNormalGuestBeverageTags.map((tag) => {
								const tagLabel = BEVERAGE_TAG_MAP[tag];
								return (
									<Tooltip
										key={tag}
										showArrow
										content={getTagTooltip(
											'beverageTag',
											selectedNormalGuestBeverageTags,
											tag,
											tagLabel,
											false
										)}
										closeDelay={0}
										delay={500}
										isDisabled={!isShowTagsTooltip}
										size="sm"
									>
										<Tags.Tag
											isButton
											tag={tagLabel}
											tagStyle={
												NORMAL_GUEST_TAG_STYLE.beverage
											}
											tagType="positive"
											onPress={() => {
												handleBeverageTagPress(tag);
											}}
											aria-label={`${tagLabel}${beverageTags.includes(tag) ? '/已满足' : ''}`}
											className={cn(
												'p-1 font-semibold leading-none data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover',
												{
													'font-normal opacity-50':
														!beverageTags.includes(
															tag
														),
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
								handleRefreshSelectedItems(
									currentNormalGuestName
								);
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
