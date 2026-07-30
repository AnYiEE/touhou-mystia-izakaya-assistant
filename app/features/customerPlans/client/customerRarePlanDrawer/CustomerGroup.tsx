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
import Tooltip from '@/design/ui/components/tooltip';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import type { TBeverageName } from '@/domain/data/beverages/types';
import type { TCookerName } from '@/domain/data/cookers/types';
import type { TCustomerRareName } from '@/domain/data/customers/rare/types';
import type { TRecipeName } from '@/domain/data/recipes/types';
import type { TBeverageTag, TRecipeTag } from '@/domain/data/tags/types';

import { customerPlanCatalogPort } from '@/features/catalog/customers/rare/client/state/customerPlanCatalogPort';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import { useCustomerRarePlanRecommendations } from '@/features/customerPlans/client/useCustomerRarePlanRecommendations';
import type {
	ICustomerRareMeal,
	IResolvedCustomerRarePlanGroup,
} from '@/features/customerPlans/contracts';
import { recommendationPreferencesFacade } from '@/features/preferences/client/recommendationPreferencesFacade';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';

import MealRow from './MealRow';
import {
	isCustomerGroupToggleGuarded,
	isCustomerRarePlanInteractiveTarget,
	selectionToValues,
} from './dom';

const DRAWER_RECOMMENDED_MEAL_RENDER_BATCH_SIZE = 12;
const DRAWER_STATUS_NOTICE_TRANSITION_DURATION_SECONDS = 0.14;
const RECOMMENDED_FILTER_ALL_KEY = '__all__';
export default function CustomerGroup({
	group,
	isExpanded,
	onCreateMeal,
	onOpenBeverage,
	onOpenCooker,
	onOpenCustomer,
	onOpenIngredient,
	onOpenRecipe,
	onToggleExpanded,
	popoverPortalProps,
	recommendationSessionKey,
}: {
	group: IResolvedCustomerRarePlanGroup;
	isExpanded: boolean;
	onCreateMeal: (customerName: TCustomerRareName) => void;
	onOpenBeverage: (beverageName: TBeverageName) => void;
	onOpenCooker: (cookerName: TCookerName) => void;
	onOpenCustomer: (customerName: TCustomerRareName) => void;
	onOpenIngredient: (
		ingredientName: ICustomerRareMeal['recipe']['extraIngredients'][number]
	) => void;
	onOpenRecipe: (recipeName: TRecipeName) => void;
	onToggleExpanded: (customerName: TCustomerRareName) => void;
	popoverPortalProps: Pick<IPopoverProps, 'portalContainer'>;
	recommendationSessionKey: string;
}) {
	const isReducedMotion = useReducedMotion();
	const { isHighAppearance } = useDesignPreferences();
	const hiddenBeverages = customerPlanCatalogPort.hiddenBeverages.use();
	const hiddenDlcs = customerPlanCatalogPort.hiddenDlcs.use();
	const hiddenIngredients = customerPlanCatalogPort.hiddenIngredients.use();
	const hiddenRecipes = customerPlanCatalogPort.hiddenRecipes.use();
	const isFamousShop = customerPlanCatalogPort.isFamousShop.use();
	const popularTrend = customerPlanCatalogPort.popularTrend.use();
	const recommendedMaxExtraIngredients =
		recommendationPreferencesFacade.maxExtraIngredients.use();
	const recommendedMaxRating =
		recommendationPreferencesFacade.maxRating.use();
	const recommendedMaxResults =
		recommendationPreferencesFacade.maxResults.use();
	const cardRef = useRef<HTMLDivElement>(null);
	const isRecommendedSource = group.mealSource === 'recommended';
	const { meals: recommendedMeals, status: recommendedMealsStatus } =
		useCustomerRarePlanRecommendations({
			customerName: group.customerName,
			hiddenBeverages,
			hiddenDlcs,
			hiddenIngredients,
			hiddenRecipes,
			isEnabled: isRecommendedSource && isExpanded,
			isFamousShop,
			maxExtraIngredients: recommendedMaxExtraIngredients,
			maxRating: recommendedMaxRating,
			maxResults: recommendedMaxResults,
			popularTrend,
			sessionKey: recommendationSessionKey,
		});
	const [recommendedRenderCount, setRecommendedRenderCount] = useState(0);
	const [selectedRecommendedRecipeTag, setSelectedRecommendedRecipeTag] =
		useState<TRecipeTag | null>(null);
	const [selectedRecommendedBeverageTag, setSelectedRecommendedBeverageTag] =
		useState<TBeverageTag | null>(null);
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
	const recommendedRecipeTagOptions = useMemo(
		() =>
			[
				...new Set(
					activeRecommendedSetMeals.flatMap(({ meal }) =>
						meal.order.recipeTag === null
							? []
							: [meal.order.recipeTag]
					)
				),
			].sort(pinyinSort),
		[activeRecommendedSetMeals]
	);
	const recommendedBeverageTagOptions = useMemo(
		() =>
			[
				...new Set(
					activeRecommendedSetMeals.flatMap(({ meal }) =>
						meal.order.beverageTag === null
							? []
							: [meal.order.beverageTag]
					)
				),
			].sort(pinyinSort),
		[activeRecommendedSetMeals]
	);
	const recommendedRecipeTagSelectItems = useMemo(
		() => [
			{ label: '全部料理需求', value: RECOMMENDED_FILTER_ALL_KEY },
			...recommendedRecipeTagOptions.map((tag) => ({
				label: tag,
				value: tag,
			})),
		],
		[recommendedRecipeTagOptions]
	);
	const recommendedBeverageTagSelectItems = useMemo(
		() => [
			{ label: '全部酒水需求', value: RECOMMENDED_FILTER_ALL_KEY },
			...recommendedBeverageTagOptions.map((tag) => ({
				label: tag,
				value: tag,
			})),
		],
		[recommendedBeverageTagOptions]
	);
	const selectedRecommendedRecipeTagKeys = useMemo(
		() =>
			new Set([
				selectedRecommendedRecipeTag ?? RECOMMENDED_FILTER_ALL_KEY,
			]),
		[selectedRecommendedRecipeTag]
	);
	const selectedRecommendedBeverageTagKeys = useMemo(
		() =>
			new Set([
				selectedRecommendedBeverageTag ?? RECOMMENDED_FILTER_ALL_KEY,
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
	const selectedRecommendedSetKeys = useMemo(
		() => new Set([activeRecommendedSetIndex.toString()]),
		[activeRecommendedSetIndex]
	);
	const isRecommendedFilterActive =
		selectedRecommendedRecipeTag !== null ||
		selectedRecommendedBeverageTag !== null;
	const filteredDisplayMeals = useMemo(
		() =>
			isRecommendedSource
				? activeRecommendedSetMeals.filter(
						({ meal }) =>
							(selectedRecommendedRecipeTag === null ||
								meal.order.recipeTag ===
									selectedRecommendedRecipeTag) &&
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
			selectedRecommendedRecipeTag,
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
		? { className: 'text-foreground-500', text: '正在生成更多推荐套餐…' }
		: isRecommendedMealsError
			? {
					className: 'text-danger-600',
					text: '部分推荐套餐生成失败，收起后可重试',
				}
			: null;
	const mealCountLabel = isRecommendedSource
		? checkLengthEmpty(displayMeals)
			? isRecommendedMealsPending
				? '生成中'
				: isRecommendedMealsError
					? '生成失败'
					: isRecommendedMealsComplete
						? '0个套餐'
						: '自动推荐'
			: isRecommendedFilterActive
				? `${filteredDisplayMeals.length}/${activeRecommendedSetMeals.length}个套餐`
				: `${activeRecommendedSetMeals.length}个套餐`
		: `${group.visibleMealCount}个套餐`;

	useEffect(() => {
		if (!isRecommendedSource) {
			setRecommendedRenderCount(0);
			setSelectedRecommendedRecipeTag(null);
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
			selectedRecommendedRecipeTag !== null &&
			!recommendedRecipeTagOptions.includes(selectedRecommendedRecipeTag)
		) {
			setRecommendedRenderCount(0);
			setSelectedRecommendedRecipeTag(null);
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
		recommendedRecipeTagOptions,
		selectedRecommendedBeverageTag,
		selectedRecommendedRecipeTag,
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
				timer = globalThis.setTimeout(renderNextBatch, 0);
			}
		};

		if (nextRenderCount < filteredDisplayMeals.length) {
			timer = globalThis.setTimeout(renderNextBatch, 0);
		}

		return () => {
			if (timer !== null) {
				globalThis.clearTimeout(timer);
			}
		};
	}, [
		filteredDisplayMeals,
		isExpanded,
		isRecommendedSource,
		recommendedRenderCount,
	]);

	const handleRecommendedRecipeTagFilterChange = useCallback(
		(selection: Selection) => {
			const [value] = selectionToValues<string>(selection);
			setRecommendedRenderCount(0);
			setSelectedRecommendedRecipeTag(
				value === undefined || value === RECOMMENDED_FILTER_ALL_KEY
					? null
					: (value as TRecipeTag)
			);
		},
		[]
	);

	const handleRecommendedBeverageTagFilterChange = useCallback(
		(selection: Selection) => {
			const [value] = selectionToValues<string>(selection);
			setRecommendedRenderCount(0);
			setSelectedRecommendedBeverageTag(
				value === undefined || value === RECOMMENDED_FILTER_ALL_KEY
					? null
					: (value as TBeverageTag)
			);
		},
		[]
	);

	const handleRecommendedSetChange = useCallback((selection: Selection) => {
		const [value] = selectionToValues<string>(selection);

		if (value === undefined) {
			return;
		}

		setRecommendedRenderCount(0);
		setActiveRecommendedSetIndex(Number.parseInt(value));
	}, []);

	return (
		<Card
			as="div"
			ref={cardRef}
			disableAnimation
			disableRipple
			fullWidth
			isPressable
			onPress={(event) => {
				if (isCustomerGroupToggleGuarded()) {
					return;
				}

				if (
					isCustomerRarePlanInteractiveTarget(
						event.target,
						cardRef.current
					)
				) {
					return;
				}

				onToggleExpanded(group.customerName);
			}}
			classNames={{
				base: cn(
					'cursor-pointer rounded-small border border-default-200/80 bg-content1/65 p-3 text-left shadow-small ring-1 ring-default-100/60 transition-all data-[pressed=true]:!scale-100 data-[pressed=true]:!transform-none data-[hover=true]:border-default-300/80 data-[hover=true]:bg-content1/75 motion-reduce:transition-none md:p-3.5 dark:bg-content1/30 dark:ring-default-50/10 dark:data-[hover=true]:bg-content1/35',
					{ 'backdrop-blur': isHighAppearance }
				),
			}}
		>
			<header className="flex items-center justify-between gap-2">
				<div className="flex min-w-0 flex-1 items-center gap-2">
					<Sprite
						className="shrink-0 rounded-full"
						name={group.customerName}
						size={1.8}
						target="customer_rare"
					/>
					<div className="min-w-0">
						<h3 className="truncate text-base font-semibold">
							{group.customerName}
						</h3>
						<p className="truncate text-tiny text-foreground-500">
							{group.customerPlaces.join(' / ')}
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
							aria-label={`查看顾客【${group.customerName}】`}
							onPress={() => {
								onOpenCustomer(group.customerName);
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
							aria-label={`${isExpanded ? '收起' : '展开'}【${group.customerName}】套餐`}
							onPress={() => {
								onToggleExpanded(group.customerName);
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
						animate={{
							height: 'auto',
							opacity: 1,
							overflow: 'hidden',
							transitionEnd: { overflow: 'visible' },
						}}
						exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
						initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
						transition={{ duration: isReducedMotion ? 0 : 0.18 }}
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
											popoverProps={{
												...popoverPortalProps,
												shouldCloseOnScroll: false,
											}}
											classNames={{
												trigger:
													'bg-default-100/70 data-[hover=true]:bg-default-200/70 dark:bg-default-50/10 dark:data-[hover=true]:bg-default-50/15',
											}}
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
												recommendedRecipeTagSelectItems
											}
											label="料理需求"
											selectedKeys={
												selectedRecommendedRecipeTagKeys
											}
											selectionMode="single"
											size="sm"
											onSelectionChange={
												handleRecommendedRecipeTagFilterChange
											}
											popoverProps={{
												...popoverPortalProps,
												shouldCloseOnScroll: false,
											}}
											classNames={{
												trigger:
													'bg-default-100/70 data-[hover=true]:bg-default-200/70 dark:bg-default-50/10 dark:data-[hover=true]:bg-default-50/15',
											}}
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
											popoverProps={{
												...popoverPortalProps,
												shouldCloseOnScroll: false,
											}}
											classNames={{
												trigger:
													'bg-default-100/70 data-[hover=true]:bg-default-200/70 dark:bg-default-50/10 dark:data-[hover=true]:bg-default-50/15',
											}}
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
									正在生成推荐套餐
								</Placeholder>
							) : isRecommendedMealsError &&
							  checkLengthEmpty(filteredDisplayMeals) ? (
								<Placeholder className="rounded-small border border-dashed border-default-200/80 bg-background/35 px-3 py-5 text-small dark:bg-default-50/5">
									推荐套餐生成失败，请收起后重试
								</Placeholder>
							) : checkLengthEmpty(filteredDisplayMeals) ? (
								<Placeholder className="space-y-3 rounded-small border border-dashed border-default-200/80 bg-background/35 px-3 py-5 text-small dark:bg-default-50/5">
									{group.mealSource === 'recommended' ? (
										<p>
											{isRecommendedFilterActive
												? isRecommendedMealsComplete
													? '暂无符合当前筛选的推荐套餐'
													: '正在生成更多推荐套餐，稍后可能出现符合筛选的结果'
												: '暂无匹配的推荐套餐'}
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
														group.customerName
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
												animate={{
													height: 'auto',
													opacity: 1,
												}}
												exit={{ height: 0, opacity: 0 }}
												initial={{
													height: 0,
													opacity: 0,
												}}
												transition={{
													duration: isReducedMotion
														? 0
														: DRAWER_STATUS_NOTICE_TRANSITION_DURATION_SECONDS,
													ease: 'easeInOut',
												}}
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
												key={`${group.customerName}:${meal.source}:${meal.dataIndex ?? meal.visibleIndex}`}
												meal={meal}
												onOpenBeverage={onOpenBeverage}
												onOpenCooker={onOpenCooker}
												onOpenIngredient={
													onOpenIngredient
												}
												onOpenRecipe={onOpenRecipe}
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
