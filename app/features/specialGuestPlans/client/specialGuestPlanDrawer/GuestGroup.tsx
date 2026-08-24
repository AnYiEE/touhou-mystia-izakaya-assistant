import {
	faArrowRight,
	faChevronDown,
	faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Select, SelectItem } from '@heroui/select';
import { type Selection } from '@heroui/table';
import { cn } from '@heroui/theme';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import Card from '@/design/ui/components/card';
import FontAwesomeIconButton from '@/design/ui/components/fontAwesomeIconButton';
import Placeholder from '@/design/ui/components/placeholder';
import { type IPopoverProps } from '@/design/ui/components/popover';
import { selectionToKnownValues } from '@/design/ui/components/selectionKeys';
import Tooltip from '@/design/ui/components/tooltip';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TCookerId } from '@/domain/data/cookers/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import { MAP_FACTS } from '@/domain/data/places/placeFacts';
import { BEVERAGE_TAG_MAP, FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';
import { type TRecommendationSortProfile } from '@/domain/recommendations/sortProfiles';

import { specialGuestPlanCatalogPort } from '@/features/catalog/guests/special/client/state/specialGuestPlanCatalogPort';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import { recommendationPreferencesFacade } from '@/features/preferences/client/recommendationPreferencesFacade';
import { useSpecialGuestPlanRecommendations } from '@/features/specialGuestPlans/client/useSpecialGuestPlanRecommendations';
import type { IResolvedSpecialGuestPlanGroup } from '@/features/specialGuestPlans/contracts';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';
import { numberSort } from '@/shared/utilities/sort/numberSort';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';

import { SPECIAL_GUEST_PLAN_RECOMMENDATION_MESSAGE_MAP } from './copy';
import {
	isGuestGroupToggleGuarded,
	isSpecialGuestPlanInteractiveTarget,
} from './dom';
import MealRow from './MealRow';

const DRAWER_RECOMMENDED_MEAL_RENDER_BATCH_SIZE = 12;
const DRAWER_STATUS_NOTICE_TRANSITION_DURATION_SECONDS = 0.14;
const RECOMMENDED_FILTER_ALL_KEY = '__all__';
const COLLAPSE_ANIMATE = {
	height: 'auto',
	opacity: 1,
	overflow: 'hidden',
	transitionEnd: { overflow: 'visible' },
} as const;
const COLLAPSE_HIDDEN = { height: 0, opacity: 0, overflow: 'hidden' } as const;
const RECOMMENDED_STATUS_NOTICE_ANIMATE = {
	height: 'auto',
	opacity: 1,
} as const;
const RECOMMENDED_STATUS_NOTICE_HIDDEN = { height: 0, opacity: 0 } as const;
const RECOMMENDED_SELECT_CLASS_NAMES = {
	trigger:
		'bg-default-100/70 data-[hover=true]:bg-default-200/70 dark:bg-default-50/10 dark:data-[hover=true]:bg-default-50/15',
} as const;
const specialGuestPlanCatalog = SpecialGuestCatalog.getInstance();

export default function GuestGroup({
	group,
	isExpanded,
	onCreateMeal,
	onOpenBeverage,
	onOpenCooker,
	onOpenFood,
	onOpenGuest,
	onOpenIngredient,
	onToggleExpanded,
	popoverPortalProps,
	recommendationSessionKey,
	recommendationSortProfile,
}: {
	group: IResolvedSpecialGuestPlanGroup;
	isExpanded: boolean;
	onCreateMeal: (specialGuest: TSpecialGuestId) => void;
	onOpenBeverage: (beverage: TBeverageId) => void;
	onOpenCooker: (cooker: TCookerId) => void;
	onOpenFood: (food: TFoodId) => void;
	onOpenGuest: (specialGuest: TSpecialGuestId) => void;
	onOpenIngredient: (ingredient: TIngredientId) => void;
	onToggleExpanded: (specialGuest: TSpecialGuestId) => void;
	popoverPortalProps: Pick<IPopoverProps, 'portalContainer'>;
	recommendationSessionKey: string;
	recommendationSortProfile: TRecommendationSortProfile;
}) {
	const { isHighAppearance } = useDesignPreferences();
	const isReducedMotion = useReducedMotion();
	const hiddenBeverages = specialGuestPlanCatalogPort.hiddenBeverages.use();
	const hiddenDlcs = specialGuestPlanCatalogPort.hiddenDlcs.use();
	const hiddenFoods = specialGuestPlanCatalogPort.hiddenFoods.use();
	const hiddenIngredients =
		specialGuestPlanCatalogPort.hiddenIngredients.use();
	const isFamousShop = specialGuestPlanCatalogPort.isFamousShop.use();
	const popularTrend = specialGuestPlanCatalogPort.popularTrend.use();
	const recommendedMaxExtraIngredients =
		recommendationPreferencesFacade.maxExtraIngredients.use();
	const recommendedMaxRating =
		recommendationPreferencesFacade.maxRating.use();
	const recommendedMaxResults =
		recommendationPreferencesFacade.maxResults.use();
	const cardRef = useRef<HTMLDivElement>(null);
	const specialGuestName = specialGuestPlanCatalog.getPropsById(
		group.specialGuest,
		'name'
	);
	const isRecommendedSource = group.mealSource === 'recommended';
	const { meals: recommendedMeals, status: recommendedMealsStatus } =
		useSpecialGuestPlanRecommendations({
			hiddenBeverages,
			hiddenDlcs,
			hiddenFoods,
			hiddenIngredients,
			isEnabled: isRecommendedSource && isExpanded,
			isFamousShop,
			maxExtraIngredients: recommendedMaxExtraIngredients,
			maxRating: recommendedMaxRating,
			maxResults: recommendedMaxResults,
			popularTrend,
			sessionKey: recommendationSessionKey,
			sortProfile: recommendationSortProfile,
			specialGuest: group.specialGuest,
		});
	const [recommendedRenderCount, setRecommendedRenderCount] = useState(0);
	const [selectedRecommendedFoodTag, setSelectedRecommendedFoodTag] =
		useState<TFoodTagId | null>(null);
	const [selectedRecommendedBeverageTag, setSelectedRecommendedBeverageTag] =
		useState<TBeverageTagId | null>(null);
	const [activeRecommendedSetIndex, setActiveRecommendedSetIndex] =
		useState(0);
	const isRecommendedMealsComplete = recommendedMealsStatus === 'complete';
	const isRecommendedMealsError = recommendedMealsStatus === 'error';
	const isRecommendedMealsLoading =
		isExpanded &&
		(recommendedMealsStatus === 'pending' ||
			recommendedMealsStatus === 'partial');
	const displayMeals = isRecommendedSource ? recommendedMeals : group.meals;
	const availableRecommendedSetIndexes = useMemo(
		() =>
			[
				...new Set(
					displayMeals.flatMap(({ recommendedSetIndex }) =>
						recommendedSetIndex === null
							? []
							: [recommendedSetIndex]
					)
				),
			].sort((a, b) => a - b),
		[displayMeals]
	);
	const activeRecommendedSetMeals = useMemo(
		() =>
			isRecommendedSource
				? displayMeals.filter(
						({ recommendedSetIndex }) =>
							recommendedSetIndex === activeRecommendedSetIndex
					)
				: displayMeals,
		[activeRecommendedSetIndex, displayMeals, isRecommendedSource]
	);
	const recommendedFoodTagOptions = useMemo<TFoodTagId[]>(() => {
		const tags = new Set<TFoodTagId>();
		activeRecommendedSetMeals.forEach(({ meal }) => {
			if (meal.order.foodTag !== null) {
				tags.add(meal.order.foodTag);
			}
		});

		return [...tags].sort((a, b) =>
			pinyinSort(FOOD_TAG_MAP[a], FOOD_TAG_MAP[b])
		);
	}, [activeRecommendedSetMeals]);
	const recommendedBeverageTagOptions = useMemo<TBeverageTagId[]>(() => {
		const tags = new Set<TBeverageTagId>();
		activeRecommendedSetMeals.forEach(({ meal }) => {
			if (meal.order.beverageTag !== null) {
				tags.add(meal.order.beverageTag);
			}
		});

		return [...tags].sort(numberSort);
	}, [activeRecommendedSetMeals]);
	const recommendedFoodTagSelectItems = useMemo(
		() => [
			{ label: '全部料理需求', value: RECOMMENDED_FILTER_ALL_KEY },
			...recommendedFoodTagOptions.map((tag) => ({
				label: FOOD_TAG_MAP[tag],
				value: tag.toString(),
			})),
		],
		[recommendedFoodTagOptions]
	);
	const recommendedBeverageTagSelectItems = useMemo(
		() => [
			{ label: '全部酒水需求', value: RECOMMENDED_FILTER_ALL_KEY },
			...recommendedBeverageTagOptions.map((tag) => ({
				label: BEVERAGE_TAG_MAP[tag],
				value: tag.toString(),
			})),
		],
		[recommendedBeverageTagOptions]
	);
	const recommendedBeverageTagByKey = useMemo<
		ReadonlyMap<string, TBeverageTagId | null>
	>(
		() =>
			new Map<string, TBeverageTagId | null>([
				[RECOMMENDED_FILTER_ALL_KEY, null],
				...recommendedBeverageTagOptions.map(
					(tag) => [tag.toString(), tag] as const
				),
			]),
		[recommendedBeverageTagOptions]
	);
	const recommendedFoodTagByKey = useMemo<
		ReadonlyMap<string, TFoodTagId | null>
	>(
		() =>
			new Map<string, TFoodTagId | null>([
				[RECOMMENDED_FILTER_ALL_KEY, null],
				...recommendedFoodTagOptions.map(
					(tag) => [tag.toString(), tag] as const
				),
			]),
		[recommendedFoodTagOptions]
	);
	const selectedRecommendedFoodTagKeys = useMemo(
		() =>
			new Set([
				selectedRecommendedFoodTag?.toString() ??
					RECOMMENDED_FILTER_ALL_KEY,
			]),
		[selectedRecommendedFoodTag]
	);
	const selectedRecommendedBeverageTagKeys = useMemo(
		() =>
			new Set([
				selectedRecommendedBeverageTag?.toString() ??
					RECOMMENDED_FILTER_ALL_KEY,
			]),
		[selectedRecommendedBeverageTag]
	);
	const recommendedSetSelectItems = useMemo(
		() =>
			availableRecommendedSetIndexes.map((index) => ({
				label: `预设${index + 1}`,
				value: index.toString(),
			})),
		[availableRecommendedSetIndexes]
	);
	const recommendedSetByKey = useMemo<ReadonlyMap<string, number>>(
		() =>
			new Map(
				availableRecommendedSetIndexes.map((index) => [
					index.toString(),
					index,
				])
			),
		[availableRecommendedSetIndexes]
	);
	const selectedRecommendedSetKeys = useMemo(
		() => new Set([activeRecommendedSetIndex.toString()]),
		[activeRecommendedSetIndex]
	);
	const cardClassNames = useMemo(
		() => ({
			base: cn(
				'cursor-pointer rounded-small border border-default-200/80 bg-content1/65 p-3 text-left shadow-small ring-1 ring-default-100/60 transition-all data-[pressed=true]:!scale-100 data-[pressed=true]:!transform-none data-[hover=true]:border-default-300/80 data-[hover=true]:bg-content1/75 motion-reduce:transition-none md:p-3.5 dark:bg-content1/30 dark:ring-default-50/10 dark:data-[hover=true]:bg-content1/35',
				{ 'backdrop-blur': isHighAppearance }
			),
		}),
		[isHighAppearance]
	);
	const collapseTransition = useMemo(
		() => ({ duration: isReducedMotion ? 0 : 0.18 }),
		[isReducedMotion]
	);
	const recommendedStatusNoticeTransition = useMemo(
		() => ({
			duration: isReducedMotion
				? 0
				: DRAWER_STATUS_NOTICE_TRANSITION_DURATION_SECONDS,
			ease: 'easeInOut' as const,
		}),
		[isReducedMotion]
	);
	const recommendedSelectPopoverProps = useMemo(
		() => ({ ...popoverPortalProps, shouldCloseOnScroll: false }),
		[popoverPortalProps]
	);
	const isRecommendedFilterActive =
		selectedRecommendedFoodTag !== null ||
		selectedRecommendedBeverageTag !== null;
	const filteredDisplayMeals = useMemo(
		() =>
			isRecommendedSource
				? activeRecommendedSetMeals.filter(
						({ meal }) =>
							(selectedRecommendedFoodTag === null ||
								meal.order.foodTag ===
									selectedRecommendedFoodTag) &&
							(selectedRecommendedBeverageTag === null ||
								meal.order.beverageTag ===
									selectedRecommendedBeverageTag)
					)
				: displayMeals,
		[
			activeRecommendedSetMeals,
			displayMeals,
			isRecommendedSource,
			selectedRecommendedBeverageTag,
			selectedRecommendedFoodTag,
		]
	);
	const renderedRecommendedMealCount =
		isRecommendedSource &&
		isExpanded &&
		!checkLengthEmpty(filteredDisplayMeals)
			? Math.max(
					recommendedRenderCount,
					Math.min(
						DRAWER_RECOMMENDED_MEAL_RENDER_BATCH_SIZE,
						filteredDisplayMeals.length
					)
				)
			: recommendedRenderCount;
	const renderedMeals = isRecommendedSource
		? filteredDisplayMeals.slice(0, renderedRecommendedMealCount)
		: filteredDisplayMeals;
	const isRecommendedMealsPending =
		isRecommendedSource &&
		isExpanded &&
		isRecommendedMealsLoading &&
		checkLengthEmpty(displayMeals);
	const recommendedStatusNotice = isRecommendedMealsLoading
		? {
				className: 'text-foreground-500',
				text: SPECIAL_GUEST_PLAN_RECOMMENDATION_MESSAGE_MAP.loadingMore,
			}
		: isRecommendedMealsError
			? {
					className: 'text-danger-600',
					text: SPECIAL_GUEST_PLAN_RECOMMENDATION_MESSAGE_MAP.partialFailure,
				}
			: null;
	const mealCountLabel = isRecommendedSource
		? checkLengthEmpty(displayMeals)
			? isRecommendedMealsPending
				? SPECIAL_GUEST_PLAN_RECOMMENDATION_MESSAGE_MAP.pending
				: isRecommendedMealsError
					? SPECIAL_GUEST_PLAN_RECOMMENDATION_MESSAGE_MAP.failed
					: isRecommendedMealsComplete
						? '0个套餐'
						: SPECIAL_GUEST_PLAN_RECOMMENDATION_MESSAGE_MAP.automatic
			: isRecommendedFilterActive
				? `${filteredDisplayMeals.length}/${activeRecommendedSetMeals.length}个套餐`
				: `${activeRecommendedSetMeals.length}个套餐`
		: `${group.visibleMealCount}个套餐`;

	useEffect(() => {
		if (!isRecommendedSource) {
			setRecommendedRenderCount(0);
			setSelectedRecommendedFoodTag(null);
			setSelectedRecommendedBeverageTag(null);
			setActiveRecommendedSetIndex(0);
		}
	}, [isRecommendedSource]);

	useEffect(() => {
		if (!isRecommendedSource || checkLengthEmpty(displayMeals)) {
			return;
		}

		if (
			!availableRecommendedSetIndexes.includes(activeRecommendedSetIndex)
		) {
			setRecommendedRenderCount(0);
			setActiveRecommendedSetIndex(
				availableRecommendedSetIndexes[0] ?? 0
			);
		}
	}, [
		activeRecommendedSetIndex,
		availableRecommendedSetIndexes,
		displayMeals,
		isRecommendedSource,
	]);

	useEffect(() => {
		if (
			selectedRecommendedFoodTag !== null &&
			!recommendedFoodTagOptions.includes(selectedRecommendedFoodTag)
		) {
			setRecommendedRenderCount(0);
			setSelectedRecommendedFoodTag(null);
		}
		if (
			selectedRecommendedBeverageTag !== null &&
			!recommendedBeverageTagOptions.includes(
				selectedRecommendedBeverageTag
			)
		) {
			setRecommendedRenderCount(0);
			setSelectedRecommendedBeverageTag(null);
		}
	}, [
		recommendedBeverageTagOptions,
		recommendedFoodTagOptions,
		selectedRecommendedBeverageTag,
		selectedRecommendedFoodTag,
	]);

	useEffect(() => {
		if (!isRecommendedSource || !isExpanded) {
			setRecommendedRenderCount(0);
			return;
		}
		if (checkLengthEmpty(filteredDisplayMeals)) {
			setRecommendedRenderCount(0);
			return;
		}

		let timer: ReturnType<typeof setTimeout> | null = null;
		let nextRenderCount = Math.min(
			Math.max(
				recommendedRenderCount,
				DRAWER_RECOMMENDED_MEAL_RENDER_BATCH_SIZE
			),
			filteredDisplayMeals.length
		);

		setRecommendedRenderCount(nextRenderCount);

		const renderNextBatch = () => {
			nextRenderCount = Math.min(
				nextRenderCount + DRAWER_RECOMMENDED_MEAL_RENDER_BATCH_SIZE,
				filteredDisplayMeals.length
			);
			setRecommendedRenderCount(nextRenderCount);

			if (nextRenderCount < filteredDisplayMeals.length) {
				timer = setTimeout(renderNextBatch, 0);
			}
		};

		if (nextRenderCount < filteredDisplayMeals.length) {
			timer = setTimeout(renderNextBatch, 0);
		}

		return () => {
			if (timer !== null) {
				clearTimeout(timer);
			}
		};
	}, [
		filteredDisplayMeals,
		isExpanded,
		isRecommendedSource,
		recommendedRenderCount,
	]);

	const handleRecommendedFoodTagFilterChange = useCallback(
		(selection: Selection) => {
			const values = selectionToKnownValues(
				selection,
				recommendedFoodTagByKey
			);
			if (values !== null) {
				setRecommendedRenderCount(0);
				setSelectedRecommendedFoodTag(values[0] ?? null);
			}
		},
		[recommendedFoodTagByKey]
	);

	const handleRecommendedBeverageTagFilterChange = useCallback(
		(selection: Selection) => {
			const values = selectionToKnownValues(
				selection,
				recommendedBeverageTagByKey
			);
			if (values !== null) {
				setRecommendedRenderCount(0);
				setSelectedRecommendedBeverageTag(values[0] ?? null);
			}
		},
		[recommendedBeverageTagByKey]
	);

	const handleRecommendedSetChange = useCallback(
		(selection: Selection) => {
			const [value] =
				selectionToKnownValues(selection, recommendedSetByKey) ?? [];
			if (value === undefined) {
				return;
			}

			setRecommendedRenderCount(0);
			setActiveRecommendedSetIndex(value);
		},
		[recommendedSetByKey]
	);

	return (
		<Card
			as="div"
			ref={cardRef}
			disableAnimation
			disableRipple
			fullWidth
			isPressable
			onPress={(event) => {
				if (isGuestGroupToggleGuarded()) {
					return;
				}

				if (
					isSpecialGuestPlanInteractiveTarget(
						event.target,
						cardRef.current
					)
				) {
					return;
				}

				onToggleExpanded(group.specialGuest);
			}}
			classNames={cardClassNames}
		>
			<header className="flex items-center justify-between gap-2">
				<div className="flex min-w-0 flex-1 items-center gap-2">
					<Sprite
						className="shrink-0 rounded-full"
						recordId={group.specialGuest}
						size={1.8}
						target="special_guest"
					/>
					<div className="min-w-0">
						<h3 className="truncate text-base font-semibold">
							{specialGuestName}
						</h3>
						<p className="truncate text-tiny text-foreground-500">
							{group.specialGuestMaps
								.map((map) => MAP_FACTS[map].label)
								.join(' / ')}
						</p>
					</div>
				</div>
				<div className="flex shrink-0 flex-nowrap items-center gap-2">
					<span className="whitespace-nowrap rounded-small bg-default-100/70 px-2 py-1 text-small text-foreground-600 dark:bg-default-50/10">
						{mealCountLabel}
					</span>
					<Tooltip showArrow content="查看顾客">
						<FontAwesomeIconButton
							icon={faArrowRight}
							size="sm"
							variant="light"
							aria-label={`查看顾客【${specialGuestName}】`}
							onPress={() => {
								onOpenGuest(group.specialGuest);
							}}
						/>
					</Tooltip>
					<Tooltip
						showArrow
						content={isExpanded ? '收起套餐' : '展开套餐'}
					>
						<Button
							isIconOnly
							radius="full"
							size="sm"
							variant="light"
							aria-expanded={isExpanded}
							aria-label={`${isExpanded ? '收起' : '展开'}【${specialGuestName}】套餐`}
							onPress={() => {
								onToggleExpanded(group.specialGuest);
							}}
						>
							<FontAwesomeIcon
								className={cn(
									'transition-transform duration-150 ease-linear motion-reduce:transition-none',
									isExpanded && 'rotate-180'
								)}
								icon={faChevronDown}
								size="lg"
							/>
						</Button>
					</Tooltip>
				</div>
			</header>
			<AnimatePresence initial={false}>
				{isExpanded && (
					<motion.div
						animate={COLLAPSE_ANIMATE}
						exit={COLLAPSE_HIDDEN}
						initial={COLLAPSE_HIDDEN}
						transition={collapseTransition}
					>
						<div className="pt-3">
							{isRecommendedSource &&
								!checkLengthEmpty(displayMeals) && (
									<div
										data-customer-rare-plan-interactive="true"
										className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)]"
									>
										<Select
											disallowEmptySelection
											isDisabled={
												availableRecommendedSetIndexes.length <=
												1
											}
											items={recommendedSetSelectItems}
											label="推荐预设"
											selectedKeys={
												selectedRecommendedSetKeys
											}
											selectionMode="single"
											size="sm"
											onSelectionChange={
												handleRecommendedSetChange
											}
											popoverProps={
												recommendedSelectPopoverProps
											}
											classNames={
												RECOMMENDED_SELECT_CLASS_NAMES
											}
										>
											{({ label, value }) => (
												<SelectItem key={value}>
													{label}
												</SelectItem>
											)}
										</Select>
										<Select
											disallowEmptySelection
											items={
												recommendedFoodTagSelectItems
											}
											label="料理需求"
											selectedKeys={
												selectedRecommendedFoodTagKeys
											}
											selectionMode="single"
											size="sm"
											onSelectionChange={
												handleRecommendedFoodTagFilterChange
											}
											popoverProps={
												recommendedSelectPopoverProps
											}
											classNames={
												RECOMMENDED_SELECT_CLASS_NAMES
											}
										>
											{({ label, value }) => (
												<SelectItem key={value}>
													{label}
												</SelectItem>
											)}
										</Select>
										<Select
											disallowEmptySelection
											items={
												recommendedBeverageTagSelectItems
											}
											label="酒水需求"
											selectedKeys={
												selectedRecommendedBeverageTagKeys
											}
											selectionMode="single"
											size="sm"
											onSelectionChange={
												handleRecommendedBeverageTagFilterChange
											}
											popoverProps={
												recommendedSelectPopoverProps
											}
											classNames={
												RECOMMENDED_SELECT_CLASS_NAMES
											}
										>
											{({ label, value }) => (
												<SelectItem key={value}>
													{label}
												</SelectItem>
											)}
										</Select>
									</div>
								)}
							{isRecommendedMealsPending ? (
								<Placeholder className="rounded-small border border-dashed border-default-200/80 bg-background/35 px-3 py-5 text-small dark:bg-default-50/5">
									{
										SPECIAL_GUEST_PLAN_RECOMMENDATION_MESSAGE_MAP.loading
									}
								</Placeholder>
							) : isRecommendedMealsError &&
							  checkLengthEmpty(filteredDisplayMeals) ? (
								<Placeholder className="rounded-small border border-dashed border-default-200/80 bg-background/35 px-3 py-5 text-small dark:bg-default-50/5">
									{
										SPECIAL_GUEST_PLAN_RECOMMENDATION_MESSAGE_MAP.totalFailure
									}
								</Placeholder>
							) : checkLengthEmpty(filteredDisplayMeals) ? (
								<Placeholder className="space-y-3 rounded-small border border-dashed border-default-200/80 bg-background/35 px-3 py-5 text-small dark:bg-default-50/5">
									{group.mealSource === 'recommended' ? (
										<p>
											{isRecommendedFilterActive
												? isRecommendedMealsComplete
													? SPECIAL_GUEST_PLAN_RECOMMENDATION_MESSAGE_MAP.filteredEmpty
													: SPECIAL_GUEST_PLAN_RECOMMENDATION_MESSAGE_MAP.filteredPending
												: SPECIAL_GUEST_PLAN_RECOMMENDATION_MESSAGE_MAP.noMatch}
										</p>
									) : (
										<>
											<p>暂无可见的自定义套餐</p>
											<Button
												color="primary"
												size="sm"
												variant="flat"
												startContent={
													<FontAwesomeIcon
														icon={faPlus}
													/>
												}
												onPress={() => {
													onCreateMeal(
														group.specialGuest
													);
												}}
											>
												去搭配套餐
											</Button>
										</>
									)}
								</Placeholder>
							) : (
								<>
									<AnimatePresence initial={false}>
										{recommendedStatusNotice !== null && (
											<motion.div
												key="recommended-status-notice"
												animate={
													RECOMMENDED_STATUS_NOTICE_ANIMATE
												}
												exit={
													RECOMMENDED_STATUS_NOTICE_HIDDEN
												}
												initial={
													RECOMMENDED_STATUS_NOTICE_HIDDEN
												}
												transition={
													recommendedStatusNoticeTransition
												}
												className="overflow-hidden"
											>
												<p
													className={cn(
														'pb-2 text-tiny',
														recommendedStatusNotice.className
													)}
													aria-live="polite"
												>
													{
														recommendedStatusNotice.text
													}
												</p>
											</motion.div>
										)}
									</AnimatePresence>
									<div className="grid grid-cols-1 gap-2 min-[1202px]:grid-cols-2 min-[1738px]:grid-cols-3 min-[2284px]:grid-cols-4">
										{renderedMeals.map((meal) => (
											<MealRow
												key={`${group.specialGuest}:${meal.source}:${meal.dataIndex ?? meal.visibleIndex}`}
												meal={meal}
												onOpenBeverage={onOpenBeverage}
												onOpenCooker={onOpenCooker}
												onOpenIngredient={
													onOpenIngredient
												}
												onOpenFood={onOpenFood}
												popoverPortalProps={
													popoverPortalProps
												}
											/>
										))}
									</div>
								</>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</Card>
	);
}
