'use client';

import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { usePathname, useVibrate, useViewInNewWindow } from '@/hooks';

import { Divider } from '@heroui/divider';
import { Select, SelectItem } from '@heroui/select';
import { type Selection } from '@heroui/table';
import { Tab, Tabs } from '@heroui/tabs';
import {
	faArrowRight,
	faBookmark,
	faCheck,
	faChevronDown,
	faChevronLeft,
	faChevronRight,
	faCircleQuestion,
	faCopy,
	faGear,
	faPlus,
	faTrash,
	faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
	Avatar,
	Button,
	type IPopoverProps,
	Input,
	Link,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	cn,
} from '@/design/ui/components';
import { useMotionProps, useReducedMotion } from '@/design/ui/hooks';

import RatingAvatarShell from '@/(pages)/customer-shared/ratingAvatarShell';
import { Plus } from '@/(pages)/customer-shared/resultCardAtoms';
import SavedMealIngredientsStrip from '@/(pages)/customer-shared/savedMealIngredientsStrip';
import TagGroup from '@/(pages)/customer-shared/tagGroup';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Placeholder from '@/components/placeholder';
import Price from '@/components/price';
import SiteInfo from '@/components/siteInfo';
import Sprite from '@/components/sprite';
import Tags from '@/components/tags';

import { siteConfig } from '@/configs';
import {
	BEVERAGE_TAG_STYLE,
	CUSTOMER_RATING_MAP,
	DARK_MATTER_META_MAP,
	RECIPE_TAG_STYLE,
	type TBeverageName,
	type TCookerName,
	type TCustomerRareName,
	type TDlc,
	type TIngredientName,
	type TPlace,
	type TRecipeName,
} from '@/data';
import { customerRareStore as customerStore, globalStore } from '@/stores';
import type {
	ICustomerRareMeal,
	IPopularTrend,
	IResolvedCustomerRarePlanGroup,
	TCustomerRarePlanMealSource,
	TCustomerRarePlanMode,
} from '@/types';
import {
	checkLengthEmpty,
	createBoundedRuntimeCache,
	pinyinSort,
} from '@/utilities';
import {
	prepareResolvedCustomerRarePlanMeals,
	resolveRecommendedCustomerRarePlanMealBatch,
} from '@/utils/customer/shared';
import { normalizeCustomerRarePlanName } from '@/utils/customer/shared/customerRarePlanState';

const DRAWER_CONTENT_READY_DELAY = 360;
const DRAWER_RECOMMENDED_MEAL_BATCH_SIZE = 1;
const DRAWER_RECOMMENDED_MEAL_RENDER_BATCH_SIZE = 12;
const DRAWER_SKELETON_ROWS = [0, 1, 2, 3, 4, 5] as const;
const CONTROLS_TOGGLE_CLICK_GUARD_MS = 320;
const DRAWER_SKELETON_PRIMARY_CLASSNAME =
	'bg-default/45 dark:bg-foreground/15 animate-pulse';
const DRAWER_SKELETON_SECONDARY_CLASSNAME =
	'bg-default/30 dark:bg-foreground/10 animate-pulse';
const DRAWER_SKELETON_BLOCK_CLASSNAME =
	'bg-default/35 dark:bg-foreground/10 animate-pulse';
const DRAWER_SKELETON_MUTED_BLOCK_CLASSNAME =
	'bg-default/25 dark:bg-foreground/5 animate-pulse';
const DRAWER_RECOMMENDED_MEAL_CACHE_MAX_SIZE = 256;
const CUSTOMER_RARE_PLAN_INTERACTIVE_SELECTOR = [
	'a[href]',
	'button',
	'input',
	'select',
	'textarea',
	'[role="button"]',
	'[data-customer-rare-plan-interactive="true"]',
].join(',');
let controlsToggleClickGuardUntil = 0;
interface IRecommendedMealCacheEntry {
	isComplete: boolean;
	meals: IResolvedCustomerRarePlanGroup['meals'];
	nextIndex: number;
}

const recommendedMealCache = createBoundedRuntimeCache<
	string,
	IRecommendedMealCacheEntry
>(DRAWER_RECOMMENDED_MEAL_CACHE_MAX_SIZE);

function getSortedCacheValues<T extends number | string>(
	values: ReadonlySet<T>
) {
	return [...values].map(String).sort(pinyinSort);
}

function getRecommendedMealCacheKey({
	customerName,
	hiddenBeverages,
	hiddenDlcs,
	hiddenIngredients,
	hiddenRecipes,
	isFamousShop,
	popularTrend,
}: {
	customerName: TCustomerRareName;
	hiddenBeverages: ReadonlySet<TBeverageName>;
	hiddenDlcs: ReadonlySet<TDlc>;
	hiddenIngredients: ReadonlySet<TIngredientName>;
	hiddenRecipes: ReadonlySet<TRecipeName>;
	isFamousShop: boolean;
	popularTrend: IPopularTrend;
}) {
	return JSON.stringify({
		customerName,
		hiddenBeverages: getSortedCacheValues(hiddenBeverages),
		hiddenDlcs: getSortedCacheValues(hiddenDlcs),
		hiddenIngredients: getSortedCacheValues(hiddenIngredients),
		hiddenRecipes: getSortedCacheValues(hiddenRecipes),
		isFamousShop,
		popularTrendIsNegative: popularTrend.isNegative,
		popularTrendTag: popularTrend.tag,
	});
}

function getInteractionTimestamp() {
	return performance.now();
}

function guardCustomerGroupToggleDuringControlsAnimation() {
	controlsToggleClickGuardUntil =
		getInteractionTimestamp() + CONTROLS_TOGGLE_CLICK_GUARD_MS;
}

function isCustomerGroupToggleGuarded() {
	return getInteractionTimestamp() < controlsToggleClickGuardUntil;
}

function selectionToValues<T extends string>(selection: Selection) {
	if (selection === 'all') {
		return [];
	}

	return [...(selection as Set<T>)].sort(pinyinSort);
}

function getFocusableElements(container: HTMLElement) {
	return [
		...container.querySelectorAll<HTMLElement>(
			'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
		),
	].filter(
		(element) =>
			!element.hasAttribute('disabled') &&
			element.closest('[inert], [aria-hidden="true"]') === null
	);
}

function isCustomerRarePlanInteractiveTarget(target: EventTarget | null) {
	return (
		target instanceof Element &&
		target.closest(CUSTOMER_RARE_PLAN_INTERACTIVE_SELECTOR) !== null
	);
}

function getDrawerLayoutClassName() {
	return 'flex min-h-0 flex-1 flex-col md:flex-row';
}

function getDrawerControlsClassName({
	isControlsCollapsed,
	isHighAppearance,
}: {
	isControlsCollapsed: boolean;
	isHighAppearance: boolean;
}) {
	return cn(
		'min-h-0 overflow-hidden border-b border-divider transition-[width,min-width,max-width,flex-basis,padding,background-color,border-color,backdrop-filter] duration-200 ease-linear scrollbar-hide motion-reduce:transition-none md:border-b-0 md:border-r',
		isControlsCollapsed
			? 'md:w-16 md:min-w-16 md:max-w-16 md:flex-none md:basis-16'
			: 'md:w-[21rem] md:min-w-[21rem] md:max-w-[21rem] md:flex-none md:basis-[21rem]',
		isHighAppearance
			? 'bg-content1/38 dark:bg-content1/24 backdrop-blur-md'
			: 'bg-content1/85 dark:bg-content1/40',
		isControlsCollapsed ? 'p-4' : 'overflow-y-auto p-4'
	);
}

function getDrawerResultsClassName(isHighAppearance: boolean) {
	return cn(
		'flex min-h-0 min-w-0 flex-1 flex-col',
		isHighAppearance
			? 'bg-background/38 dark:bg-default-50/5'
			: 'bg-background dark:bg-content1/20'
	);
}

function getDrawerSkeletonClassName({
	className,
	isHighAppearance,
	toneClassName,
}: {
	className: string;
	isHighAppearance: boolean;
	toneClassName: string;
}) {
	return cn(className, toneClassName, { 'backdrop-blur': isHighAppearance });
}

function renderCustomerSelectItem(value: number | string) {
	const customerName = value as TCustomerRareName;

	return (
		<SelectItem
			key={customerName}
			textValue={customerName}
			classNames={{ base: '[&>span]:inline-flex' }}
		>
			<span className="inline-flex items-center gap-1">
				<Sprite
					className="rounded-full"
					name={customerName}
					size={1.35}
					target="customer_rare"
				/>
				<span>{customerName}</span>
			</span>
		</SelectItem>
	);
}

function MealRow({
	meal,
	onOpenBeverage,
	onOpenCooker,
	onOpenIngredient,
	onOpenRecipe,
	popoverPortalProps,
}: {
	meal: IResolvedCustomerRarePlanGroup['meals'][number];
	onOpenBeverage: (beverageName: TBeverageName) => void;
	onOpenCooker: (cookerName: TCookerName) => void;
	onOpenIngredient: (
		ingredientName: ICustomerRareMeal['recipe']['extraIngredients'][number]
	) => void;
	onOpenRecipe: (recipeName: TRecipeName) => void;
	popoverPortalProps: Pick<IPopoverProps, 'portalContainer'>;
}) {
	const instanceRecipe = customerStore.instances.recipe.get();
	const {
		evaluation: { isDarkMatter, price, rating: ratingKey },
		meal: {
			beverage,
			hasMystiaCooker,
			order: customerOrder,
			recipe: recipeData,
		},
		source,
	} = meal;
	const isDarkMatterOrNormalMeal = isDarkMatter || !hasMystiaCooker;
	const originalCooker = instanceRecipe.getPropsByName(
		recipeData.name,
		'cooker'
	);
	const cooker = isDarkMatterOrNormalMeal
		? originalCooker
		: (`夜雀${originalCooker}` as const);
	const recipeName = isDarkMatter
		? DARK_MATTER_META_MAP.name
		: recipeData.name;
	const rating =
		ratingKey === null ? '未评级' : CUSTOMER_RATING_MAP[ratingKey];
	const ratingColor = ratingKey ?? 'default';
	const cookerLabel = `点击：在新窗口中查看厨具【${cooker}】的详情`;
	const recipeLabel = `点击：在新窗口中查看料理【${recipeName}】的详情`;
	const beverageLabel = `点击：在新窗口中查看酒水【${beverage}】的详情`;

	return (
		<div className="relative isolate min-w-0 rounded-small border border-default-200/80 bg-background/35 px-4 py-3 transition-background hover:bg-default/30 motion-reduce:transition-none dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.05),0_8px_20px_rgb(0_0_0_/_0.12)] dark:hover:bg-white/[0.085]">
			{source === 'recommended' && (
				<span className="pointer-events-none absolute right-1.5 top-1.5 z-[1] rounded-small bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary">
					推荐
				</span>
			)}
			<div className="relative z-10 flex min-w-0 flex-col flex-wrap items-center gap-2 md:flex-row md:flex-nowrap md:gap-3 min-[1202px]:gap-2">
				<RatingAvatarShell
					color={ratingColor}
					content={rating}
					placement="left"
					popoverProps={popoverPortalProps}
					popoverOffset={12}
					trigger={
						<span
							className="cursor-pointer"
							data-customer-rare-plan-interactive="true"
						>
							<PopoverTrigger>
								<Avatar
									isBordered
									showFallback
									color={ratingColor}
									fallback={
										<TagGroup className="h-4 flex-nowrap items-center whitespace-nowrap">
											{price !== 0 && (
												<Tags.Tag
													className="p-0.5"
													tag={<Price>{price}</Price>}
													tagStyle={{}}
												/>
											)}
											{customerOrder.recipeTag &&
												isDarkMatterOrNormalMeal && (
													<Tags.Tag
														className="p-0.5"
														tag={
															customerOrder.recipeTag
														}
														tagStyle={
															RECIPE_TAG_STYLE.positive
														}
													/>
												)}
											{customerOrder.beverageTag &&
												isDarkMatterOrNormalMeal && (
													<Tags.Tag
														className="p-0.5"
														tag={
															customerOrder.beverageTag
														}
														tagStyle={
															BEVERAGE_TAG_STYLE.positive
														}
													/>
												)}
										</TagGroup>
									}
									radius="sm"
									classNames={{
										base: 'h-5 w-44 ring-offset-0',
									}}
								/>
							</PopoverTrigger>
						</span>
					}
				/>
				<div className="flex items-center gap-1 md:gap-2 min-[1202px]:gap-1">
					<Tooltip showArrow content={cookerLabel} offset={8}>
						<Sprite
							name={cooker}
							size={1.5}
							target="cooker"
							onPress={() => {
								onOpenCooker(cooker);
							}}
							aria-label={cookerLabel}
							role="button"
						/>
					</Tooltip>
					<Tooltip showArrow content={recipeLabel} offset={4}>
						<Sprite
							name={recipeName}
							size={2}
							target="recipe"
							onPress={() => {
								onOpenRecipe(recipeName);
							}}
							aria-label={recipeLabel}
							role="button"
						/>
					</Tooltip>
					<Plus
						className="mx-0 md:mx-1 min-[1202px]:mx-0"
						size={0.75}
					/>
					<Tooltip showArrow content={beverageLabel} offset={4}>
						<Sprite
							name={beverage}
							size={2}
							target="beverage"
							onPress={() => {
								onOpenBeverage(beverage);
							}}
							aria-label={beverageLabel}
							role="button"
						/>
					</Tooltip>
				</div>
				<Plus className="mx-0 md:mx-1 min-[1202px]:mx-0" size={0.75} />
				<div className="relative min-w-0">
					<SavedMealIngredientsStrip
						className="gap-x-1 md:gap-x-3 min-[1202px]:gap-x-1"
						extraIngredients={recipeData.extraIngredients}
						extraIngredientsClassName="gap-x-1 md:gap-x-3 min-[1202px]:gap-x-1"
						onOpenIngredient={onOpenIngredient}
						originalIngredients={instanceRecipe.getPropsByName(
							recipeData.name,
							'ingredients'
						)}
					/>
				</div>
			</div>
		</div>
	);
}

function CustomerGroup({
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
}) {
	const isReducedMotion = useReducedMotion();
	const isHighAppearance = globalStore.persistence.highAppearance.use();
	const hiddenBeverages =
		customerStore.shared.beverage.table.hiddenBeverages.use();
	const hiddenDlcs = customerStore.shared.hiddenItems.dlcs.use();
	const hiddenIngredients =
		customerStore.shared.recipe.table.hiddenIngredients.use();
	const hiddenRecipes = customerStore.shared.recipe.table.hiddenRecipes.use();
	const isFamousShop = customerStore.shared.customer.famousShop.use();
	const popularTrend = customerStore.shared.customer.popularTrend.use();
	const recommendedMealCacheKey = useMemo(
		() =>
			getRecommendedMealCacheKey({
				customerName: group.customerName,
				hiddenBeverages,
				hiddenDlcs,
				hiddenIngredients,
				hiddenRecipes,
				isFamousShop,
				popularTrend,
			}),
		[
			group.customerName,
			hiddenBeverages,
			hiddenDlcs,
			hiddenIngredients,
			hiddenRecipes,
			isFamousShop,
			popularTrend,
		]
	);
	const initialRecommendedMealCacheEntry = useMemo(
		() => recommendedMealCache.get(recommendedMealCacheKey),
		[recommendedMealCacheKey]
	);
	const recommendedMealsRef = useRef<IResolvedCustomerRarePlanGroup['meals']>(
		initialRecommendedMealCacheEntry?.meals ?? []
	);
	const recommendedNextIndexRef = useRef(
		initialRecommendedMealCacheEntry?.nextIndex ?? 0
	);
	const [recommendedMeals, setRecommendedMeals] = useState<
		IResolvedCustomerRarePlanGroup['meals']
	>(initialRecommendedMealCacheEntry?.meals ?? []);
	const [recommendedRenderCount, setRecommendedRenderCount] = useState(0);
	const [isRecommendedMealsComplete, setIsRecommendedMealsComplete] =
		useState(initialRecommendedMealCacheEntry?.isComplete ?? false);
	const [isRecommendedMealsLoading, setIsRecommendedMealsLoading] =
		useState(false);
	const isRecommendedSource = group.mealSource === 'recommended';
	const displayMeals = isRecommendedSource ? recommendedMeals : group.meals;
	const renderedRecommendedMealCount =
		isRecommendedSource && isExpanded && !checkLengthEmpty(displayMeals)
			? Math.max(
					recommendedRenderCount,
					Math.min(
						DRAWER_RECOMMENDED_MEAL_RENDER_BATCH_SIZE,
						displayMeals.length
					)
				)
			: recommendedRenderCount;
	const renderedMeals = isRecommendedSource
		? displayMeals.slice(0, renderedRecommendedMealCount)
		: displayMeals;
	const isRecommendedMealsPending =
		isRecommendedSource &&
		isExpanded &&
		isRecommendedMealsLoading &&
		checkLengthEmpty(displayMeals);
	const mealCountLabel = isRecommendedSource
		? checkLengthEmpty(displayMeals)
			? isRecommendedMealsPending
				? '生成中'
				: isRecommendedMealsComplete
					? '0个套餐'
					: '自动推荐'
			: `${displayMeals.length}个套餐`
		: `${group.visibleMealCount}个套餐`;

	useEffect(() => {
		if (!isRecommendedSource) {
			setRecommendedRenderCount(0);
			setIsRecommendedMealsLoading(false);
			return;
		}

		const cacheEntry = recommendedMealCache.get(recommendedMealCacheKey);
		const cachedMeals = cacheEntry?.meals ?? [];

		recommendedMealsRef.current = cachedMeals;
		recommendedNextIndexRef.current = cacheEntry?.nextIndex ?? 0;
		setRecommendedMeals(cachedMeals);
		setRecommendedRenderCount(0);
		setIsRecommendedMealsComplete(cacheEntry?.isComplete ?? false);
		setIsRecommendedMealsLoading(false);
	}, [isRecommendedSource, recommendedMealCacheKey]);

	useEffect(() => {
		if (!isRecommendedSource || !isExpanded) {
			setRecommendedRenderCount(0);
			return;
		}
		if (checkLengthEmpty(displayMeals)) {
			setRecommendedRenderCount(0);
			return;
		}

		let timer: ReturnType<typeof setTimeout> | null = null;
		let nextRenderCount = Math.min(
			Math.max(
				recommendedRenderCount,
				DRAWER_RECOMMENDED_MEAL_RENDER_BATCH_SIZE
			),
			displayMeals.length
		);

		setRecommendedRenderCount(nextRenderCount);

		const renderNextBatch = () => {
			nextRenderCount = Math.min(
				nextRenderCount + DRAWER_RECOMMENDED_MEAL_RENDER_BATCH_SIZE,
				displayMeals.length
			);
			setRecommendedRenderCount(nextRenderCount);

			if (nextRenderCount < displayMeals.length) {
				timer = globalThis.setTimeout(renderNextBatch, 0);
			}
		};

		if (nextRenderCount < displayMeals.length) {
			timer = globalThis.setTimeout(renderNextBatch, 0);
		}

		return () => {
			if (timer !== null) {
				globalThis.clearTimeout(timer);
			}
		};
	}, [displayMeals, isExpanded, isRecommendedSource, recommendedRenderCount]);

	useEffect(() => {
		if (!isRecommendedSource || !isExpanded) {
			setIsRecommendedMealsLoading(false);
			return;
		}
		if (isRecommendedMealsComplete) {
			return;
		}

		let isCancelled = false;
		let timer: ReturnType<typeof setTimeout> | null = null;
		let nextIndex = recommendedNextIndexRef.current;
		let meals = recommendedMealsRef.current;

		setIsRecommendedMealsLoading(true);

		const runBatch = () => {
			const batch = resolveRecommendedCustomerRarePlanMealBatch({
				batchSize: DRAWER_RECOMMENDED_MEAL_BATCH_SIZE,
				customerName: group.customerName,
				hiddenBeverages,
				hiddenDlcs,
				hiddenIngredients,
				hiddenRecipes,
				isFamousShop,
				popularTrend,
				startIndex: nextIndex,
			});

			if (isCancelled) {
				return;
			}

			nextIndex = batch.nextIndex;
			recommendedNextIndexRef.current = nextIndex;
			if (!checkLengthEmpty(batch.meals)) {
				meals = prepareResolvedCustomerRarePlanMeals({
					meals: [...meals, ...batch.meals],
				});
				recommendedMealsRef.current = meals;
				setRecommendedMeals(meals);
			}
			recommendedMealCache.set(recommendedMealCacheKey, {
				isComplete: batch.isComplete,
				meals,
				nextIndex,
			});

			if (batch.isComplete) {
				setIsRecommendedMealsComplete(true);
				setIsRecommendedMealsLoading(false);
				return;
			}

			timer = globalThis.setTimeout(runBatch, 0);
		};

		timer = globalThis.setTimeout(runBatch, 0);

		return () => {
			isCancelled = true;
			if (timer !== null) {
				globalThis.clearTimeout(timer);
			}
		};
	}, [
		group.customerName,
		hiddenBeverages,
		hiddenDlcs,
		hiddenIngredients,
		hiddenRecipes,
		isExpanded,
		isFamousShop,
		isRecommendedMealsComplete,
		isRecommendedSource,
		popularTrend,
		recommendedMealCacheKey,
	]);

	return (
		<section
			onClick={(event) => {
				if (isCustomerGroupToggleGuarded()) {
					return;
				}

				if (isCustomerRarePlanInteractiveTarget(event.target)) {
					return;
				}

				onToggleExpanded(group.customerName);
			}}
			className={cn(
				'cursor-pointer rounded-small border border-default-200/80 bg-content1/65 p-3 shadow-small ring-1 ring-default-100/60 transition-all hover:border-default-300/80 hover:bg-content1/75 motion-reduce:transition-none md:p-3.5 dark:bg-content1/30 dark:ring-default-50/10 dark:hover:bg-content1/35',
				{ 'backdrop-blur': isHighAppearance }
			)}
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
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						initial={{ height: 0, opacity: 0 }}
						transition={{ duration: isReducedMotion ? 0 : 0.18 }}
						className="overflow-hidden"
					>
						<div className="pt-3">
							{isRecommendedMealsPending ? (
								<Placeholder className="rounded-small border border-dashed border-default-200/80 bg-background/35 px-3 py-5 text-small dark:bg-default-50/5">
									正在生成推荐套餐
								</Placeholder>
							) : checkLengthEmpty(displayMeals) ? (
								<Placeholder className="space-y-3 rounded-small border border-dashed border-default-200/80 bg-background/35 px-3 py-5 text-small dark:bg-default-50/5">
									{group.mealSource === 'recommended' ? (
										<p>暂无匹配的推荐套餐</p>
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
								<div className="grid grid-cols-1 gap-2 min-[1202px]:grid-cols-2 min-[1738px]:grid-cols-3 min-[2284px]:grid-cols-4">
									{renderedMeals.map((meal) => (
										<MealRow
											key={`${group.customerName}:${meal.source}:${meal.dataIndex ?? meal.visibleIndex}`}
											meal={meal}
											onOpenBeverage={onOpenBeverage}
											onOpenCooker={onOpenCooker}
											onOpenIngredient={onOpenIngredient}
											onOpenRecipe={onOpenRecipe}
											popoverPortalProps={
												popoverPortalProps
											}
										/>
									))}
								</div>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</section>
	);
}

function CustomerRarePlanSummaryText() {
	const activePlan = customerStore.activeCustomerRarePlan.use();
	const summary = customerStore.customerRarePlanSummary.use();

	if (activePlan?.mealSource === 'recommended') {
		return <>{summary.customerCount} 稀客 / 自动推荐</>;
	}

	return (
		<>
			{summary.customerCount} 稀客 / {summary.mealCount} 套餐
		</>
	);
}

function CustomerRarePlanHelpPopover({
	isOpen,
	onOpenChange,
	onOpenHiddenItemsSettings,
	onOpenRatingSettings,
	portalContainerProps,
	shouldCloseOnInteractOutside,
}: {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onOpenHiddenItemsSettings: () => void;
	onOpenRatingSettings: () => void;
	portalContainerProps: Pick<IPopoverProps, 'portalContainer'>;
	shouldCloseOnInteractOutside: () => boolean;
}) {
	return (
		<Popover
			shouldBlockScroll
			showArrow
			isOpen={isOpen}
			shouldCloseOnInteractOutside={shouldCloseOnInteractOutside}
			onOpenChange={onOpenChange}
			{...portalContainerProps}
		>
			<PopoverTrigger>
				<FontAwesomeIconButton
					icon={faCircleQuestion}
					variant="light"
					aria-label="查看营业预设说明"
				/>
			</PopoverTrigger>
			<PopoverContent>
				<div className="max-w-80 space-y-2 p-1 text-tiny leading-5 text-foreground-500">
					<p className="font-medium text-foreground-700">
						每晚营业前，把本轮可能出现的稀客放进预设，开店时集中查看。
					</p>
					<div className="space-y-2">
						<div>
							<p className="font-medium text-foreground-600">
								选择稀客
							</p>
							<p>按营业地区加入出没稀客，也可以手动指定。</p>
						</div>
						<div>
							<p className="font-medium text-foreground-600">
								套餐来源
							</p>
							<div className="mt-1 space-y-1 rounded-small border border-default-200/60 bg-default-50/30 px-2 py-1.5 dark:border-white/10 dark:bg-white/[0.07] dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.06),0_8px_20px_rgb(0_0_0_/_0.14)]">
								<p>
									<span className="font-medium text-foreground-600">
										已保存套餐：
									</span>
									显示您为这些稀客手动保存的搭配。
								</p>
								<p>
									<span className="font-medium text-foreground-600">
										自动推荐：
									</span>
									按稀客的料理和酒水需求生成参考搭配。
								</p>
							</div>
						</div>
					</div>
					<div className="rounded-small border border-default-200/60 bg-default-50/30 px-2 py-1.5 text-foreground-500 dark:border-white/10 dark:bg-white/[0.07] dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.06),0_8px_20px_rgb(0_0_0_/_0.14)]">
						<p className="font-medium text-foreground-600">
							设置会影响这里看到的内容
						</p>
						<p>
							隐藏DLC、料理、酒水或食材后，用到它们的已保存套餐会被隐藏；自动推荐也不会拿它们来搭配。
						</p>
						<p>
							流行趋势和明星店效果会影响评级，请按当前游戏状态调整。
						</p>
						<div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
							<Button
								fullWidth
								size="sm"
								variant="flat"
								startContent={<FontAwesomeIcon icon={faGear} />}
								onPress={onOpenHiddenItemsSettings}
							>
								隐藏项目
							</Button>
							<Button
								fullWidth
								size="sm"
								variant="flat"
								startContent={<FontAwesomeIcon icon={faGear} />}
								onPress={onOpenRatingSettings}
							>
								流行趋势/明星店
							</Button>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}

function CustomerRarePlanResults({
	isHighAppearance,
	popoverPortalProps,
}: {
	isHighAppearance: boolean;
	popoverPortalProps: Pick<IPopoverProps, 'portalContainer'>;
}) {
	const { pushState } = usePathname();
	const openWindow = useViewInNewWindow();
	const isReducedMotion = useReducedMotion();
	const vibrate = useVibrate();
	const groups = customerStore.resolvedCustomerRarePlan.use();
	const expandedCustomerNames =
		customerStore.shared.planDrawer.expandedCustomerNames.use();
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const customerGroupNodesRef = useRef(
		new Map<TCustomerRareName, HTMLDivElement>()
	);

	const handleOpenCustomer = useCallback(
		(customerName: TCustomerRareName) => {
			vibrate();
			customerStore.openCustomerRarePlanCustomer(
				customerName,
				true,
				'Open Customer'
			);
			pushState('/customer-rare', customerName);
		},
		[pushState, vibrate]
	);

	const handleCreateMeal = useCallback(
		(customerName: TCustomerRareName) => {
			vibrate();
			customerStore.openCustomerRarePlanCustomer(customerName, true);
			pushState('/customer-rare', customerName);
		},
		[pushState, vibrate]
	);

	const handleToggleCustomerExpanded = useCallback(
		(customerName: TCustomerRareName) => {
			const scrollContainer = scrollContainerRef.current;
			const customerGroupNode =
				customerGroupNodesRef.current.get(customerName);
			const scrollTargetTop =
				expandedCustomerNames.has(customerName) &&
				scrollContainer !== null &&
				customerGroupNode !== undefined
					? (() => {
							const scrollContainerRect =
								scrollContainer.getBoundingClientRect();
							const customerGroupRect =
								customerGroupNode.getBoundingClientRect();

							if (
								customerGroupRect.top >=
								scrollContainerRect.top + 8
							) {
								return null;
							}

							return Math.max(
								0,
								scrollContainer.scrollTop +
									customerGroupRect.top -
									scrollContainerRect.top -
									16
							);
						})()
					: null;

			vibrate();
			customerStore.toggleCustomerRarePlanCustomerExpanded(customerName);

			if (scrollTargetTop !== null) {
				globalThis.requestAnimationFrame(() => {
					scrollContainer?.scrollTo({
						behavior: isReducedMotion ? 'auto' : 'smooth',
						top: scrollTargetTop,
					});
				});
			}
		},
		[expandedCustomerNames, isReducedMotion, vibrate]
	);

	return (
		<main className={getDrawerResultsClassName(isHighAppearance)}>
			<div className="relative min-h-0 flex-1 overflow-hidden pr-2">
				<div
					ref={scrollContainerRef}
					className="-mr-2 h-full min-h-0 overflow-y-auto py-4 pl-4 pr-2 [scrollbar-gutter:auto] md:py-5 md:pl-5 md:pr-3"
				>
					<div className="relative min-h-full">
						<AnimatePresence initial={false}>
							{checkLengthEmpty(groups) && (
								<motion.div
									key="empty"
									animate={{ opacity: 1, y: 0 }}
									className="absolute inset-0"
									exit={{
										opacity: 0,
										y: isReducedMotion ? 0 : -6,
									}}
									initial={{
										opacity: 0,
										y: isReducedMotion ? 0 : 6,
									}}
									transition={{
										duration: isReducedMotion ? 0 : 0.16,
									}}
								>
									<Placeholder className="min-h-full rounded-small border border-dashed border-default-200/80 bg-content1/35 p-6 text-small dark:bg-content1/15">
										当前预设还没有可展示的稀客套餐
									</Placeholder>
								</motion.div>
							)}
						</AnimatePresence>
						<div className="space-y-3 md:space-y-4">
							<AnimatePresence initial={false}>
								{groups.map((group) => (
									<motion.div
										key={group.customerName}
										ref={(node) => {
											if (node === null) {
												customerGroupNodesRef.current.delete(
													group.customerName
												);
												return;
											}

											customerGroupNodesRef.current.set(
												group.customerName,
												node
											);
										}}
										animate={{ opacity: 1, y: 0 }}
										className="will-change-transform"
										exit={{
											opacity: 0,
											y: isReducedMotion ? 0 : -4,
										}}
										initial={{
											opacity: 0,
											y: isReducedMotion ? 0 : 6,
										}}
										transition={{
											duration: isReducedMotion
												? 0
												: 0.14,
											ease: 'easeOut',
										}}
									>
										<CustomerGroup
											isExpanded={expandedCustomerNames.has(
												group.customerName
											)}
											group={group}
											onCreateMeal={handleCreateMeal}
											onOpenBeverage={(name) => {
												openWindow('beverages', name);
											}}
											onOpenCooker={(name) => {
												openWindow('cookers', name);
											}}
											onOpenCustomer={handleOpenCustomer}
											onOpenIngredient={(name) => {
												openWindow('ingredients', name);
											}}
											onOpenRecipe={(name) => {
												openWindow('recipes', name);
											}}
											onToggleExpanded={
												handleToggleCustomerExpanded
											}
											popoverPortalProps={
												popoverPortalProps
											}
										/>
									</motion.div>
								))}
							</AnimatePresence>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}

export default function CustomerRarePlanDrawer() {
	const bookmarkRef = useRef<HTMLDivElement>(null);
	const drawerPanelRef = useRef<HTMLElement>(null);
	const contentReadyFrameRef = useRef<number[]>([]);
	const contentReadyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null
	);
	const helpPopoverDismissLockedRef = useRef(false);
	const manualModePanelRef = useRef<HTMLDivElement>(null);
	const regionModePanelRef = useRef<HTMLDivElement>(null);
	const wasOpenRef = useRef(false);
	const selectMotionProps = useMotionProps('select');
	const isReducedMotion = useReducedMotion();
	const vibrate = useVibrate();
	const [drawerPortalContainer, setDrawerPortalContainer] =
		useState<HTMLElement | null>(null);

	const isHighAppearance = globalStore.persistence.highAppearance.use();
	const isGlobalSearchOpen = globalStore.shared.globalSearch.isOpen.use();
	const isPreferencesModalOpen =
		globalStore.shared.preferencesModal.isOpen.use();
	const isStoreOpen = customerStore.shared.planDrawer.isOpen.use();
	const isControlsCollapsed =
		customerStore.shared.planDrawer.isControlsCollapsed.use();
	const plans = customerStore.persistence.plans.use();
	const activePlan = customerStore.activeCustomerRarePlan.use();
	const availableCustomerNames = customerStore.availableCustomerNames.use();
	const availableCustomerPlaces = customerStore.availableCustomerPlaces.use();
	const [isShellOpen, setIsShellOpen] = useState(isStoreOpen);
	const [draftName, setDraftName] = useState(activePlan?.name ?? '');
	const [isContentReady, setIsContentReady] = useState(false);
	const [isDeletePlanPopoverOpen, setIsDeletePlanPopoverOpen] =
		useState(false);
	const [isHelpPopoverOpen, setIsHelpPopoverOpen] = useState(false);
	const [modePanelHeight, setModePanelHeight] = useState<number | 'auto'>(
		'auto'
	);
	const normalizedDraftName = normalizeCustomerRarePlanName(draftName);
	const activePlanMealSource = activePlan?.mealSource ?? 'saved';
	const activePlanMode = activePlan?.mode ?? 'region';
	const isRenameDisabled =
		activePlan === null || normalizedDraftName === activePlan.name;

	const setDrawerPanelRef = useCallback((node: HTMLElement | null) => {
		drawerPanelRef.current = node;
		setDrawerPortalContainer(node);
	}, []);

	useEffect(() => {
		setDraftName(activePlan?.name ?? '');
	}, [activePlan?.id, activePlan?.name]);

	useEffect(() => {
		if (!isShellOpen) {
			helpPopoverDismissLockedRef.current = false;
			setIsHelpPopoverOpen(false);
		}

		if (!isShellOpen || activePlan === null) {
			setIsDeletePlanPopoverOpen(false);
		}
	}, [activePlan, isShellOpen]);

	useLayoutEffect(() => {
		if (!isContentReady) {
			setModePanelHeight('auto');
			return;
		}

		const panel =
			activePlanMode === 'manual'
				? manualModePanelRef.current
				: regionModePanelRef.current;

		if (panel === null) {
			return;
		}

		const updateModePanelHeight = () => {
			setModePanelHeight(panel.offsetHeight);
		};

		updateModePanelHeight();
		window.addEventListener('resize', updateModePanelHeight);

		return () => {
			window.removeEventListener('resize', updateModePanelHeight);
		};
	}, [
		activePlan?.excludes,
		activePlan?.includes,
		activePlan?.manualCustomers,
		activePlan?.places,
		activePlanMode,
		isContentReady,
	]);

	useEffect(() => {
		contentReadyFrameRef.current.forEach((frame) => {
			cancelAnimationFrame(frame);
		});
		contentReadyFrameRef.current = [];
		if (contentReadyTimeoutRef.current !== null) {
			clearTimeout(contentReadyTimeoutRef.current);
			contentReadyTimeoutRef.current = null;
		}

		if (!isShellOpen) {
			setIsContentReady(false);
			return;
		}

		setIsContentReady(false);
		const firstFrame = requestAnimationFrame(() => {
			contentReadyTimeoutRef.current = globalThis.setTimeout(
				() => {
					if (!customerStore.shared.planDrawer.isOpen.get()) {
						customerStore.openCustomerRarePlanDrawer();
					}
					setIsContentReady(true);
					contentReadyTimeoutRef.current = null;
					contentReadyFrameRef.current = [];
				},
				isReducedMotion ? 0 : DRAWER_CONTENT_READY_DELAY
			);
		});

		contentReadyFrameRef.current = [firstFrame];

		return () => {
			contentReadyFrameRef.current.forEach((frame) => {
				cancelAnimationFrame(frame);
			});
			contentReadyFrameRef.current = [];
			if (contentReadyTimeoutRef.current !== null) {
				clearTimeout(contentReadyTimeoutRef.current);
				contentReadyTimeoutRef.current = null;
			}
		};
	}, [isReducedMotion, isShellOpen]);

	useEffect(() => {
		if (!isShellOpen) {
			if (wasOpenRef.current) {
				bookmarkRef.current?.querySelector('button')?.focus();
			}
			wasOpenRef.current = false;
			return;
		}

		wasOpenRef.current = true;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		globalThis.setTimeout(() => {
			drawerPanelRef.current?.focus();
		});

		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, [isShellOpen]);

	useEffect(() => {
		if (isStoreOpen) {
			setIsShellOpen(true);
			return;
		}

		if (isContentReady) {
			setIsShellOpen(false);
		}
	}, [isContentReady, isStoreOpen]);

	useEffect(() => {
		if (isPreferencesModalOpen || !helpPopoverDismissLockedRef.current) {
			return;
		}

		const timeoutId = globalThis.setTimeout(() => {
			helpPopoverDismissLockedRef.current = false;
		}, 120);

		return () => {
			clearTimeout(timeoutId);
		};
	}, [isPreferencesModalOpen]);

	useEffect(() => {
		if (!isShellOpen || isGlobalSearchOpen || isPreferencesModalOpen) {
			return;
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setIsShellOpen(false);
				customerStore.closeCustomerRarePlanDrawer();
				return;
			}

			if (event.key !== 'Tab' || drawerPanelRef.current === null) {
				return;
			}

			const focusableElements = getFocusableElements(
				drawerPanelRef.current
			);
			if (focusableElements.length === 0) {
				event.preventDefault();
				drawerPanelRef.current.focus();
				return;
			}

			const [firstElement] = focusableElements;
			const lastElement = focusableElements.at(-1);
			const { activeElement } = document;

			if (firstElement === undefined || lastElement === undefined) {
				event.preventDefault();
				drawerPanelRef.current.focus();
				return;
			}

			if (
				activeElement === null ||
				!drawerPanelRef.current.contains(activeElement)
			) {
				event.preventDefault();
				firstElement.focus();
				return;
			}

			if (event.shiftKey && activeElement === firstElement) {
				event.preventDefault();
				lastElement.focus();
				return;
			}

			if (!event.shiftKey && activeElement === lastElement) {
				event.preventDefault();
				firstElement.focus();
			}
		};

		globalThis.addEventListener('keydown', handleKeyDown);

		return () => {
			globalThis.removeEventListener('keydown', handleKeyDown);
		};
	}, [isGlobalSearchOpen, isPreferencesModalOpen, isShellOpen]);

	const handleOpen = useCallback(() => {
		vibrate();
		setIsShellOpen(true);
	}, [vibrate]);

	const handleClose = useCallback(() => {
		vibrate();
		helpPopoverDismissLockedRef.current = false;
		setIsHelpPopoverOpen(false);
		setIsShellOpen(false);
		customerStore.closeCustomerRarePlanDrawer();
	}, [vibrate]);

	const handleHelpPopoverOpenChange = useCallback((isOpen: boolean) => {
		if (!isOpen && helpPopoverDismissLockedRef.current) {
			return;
		}

		setIsHelpPopoverOpen(isOpen);
	}, []);

	const shouldCloseHelpPopoverOnInteractOutside = useCallback(
		() => !helpPopoverDismissLockedRef.current,
		[]
	);

	const handleOpenHiddenItemsSettings = useCallback(() => {
		vibrate();
		helpPopoverDismissLockedRef.current = true;
		setIsHelpPopoverOpen(true);
		globalStore.setPreferencesModalIsOpen(
			true,
			null,
			'customer-hidden-items'
		);
	}, [vibrate]);

	const handleOpenRatingSettings = useCallback(() => {
		vibrate();
		helpPopoverDismissLockedRef.current = true;
		setIsHelpPopoverOpen(true);
		globalStore.setPreferencesModalIsOpen(
			true,
			null,
			'global-popular-trend'
		);
	}, [vibrate]);

	const handlePlanSelect = useCallback(
		(selection: Selection) => {
			const [planId] = selectionToValues<string>(selection);
			if (planId === undefined || plans.activeId === planId) {
				return;
			}

			vibrate();
			customerStore.setActiveCustomerRarePlan(planId);
		},
		[plans.activeId, vibrate]
	);

	const handleCreatePlan = useCallback(() => {
		vibrate();
		customerStore.createCustomerRarePlan();
	}, [vibrate]);

	const handleCopyPlan = useCallback(() => {
		if (activePlan === null) {
			return;
		}

		vibrate();
		customerStore.copyCustomerRarePlan(activePlan.id);
	}, [activePlan, vibrate]);

	const handleDeletePlan = useCallback(() => {
		if (activePlan === null) {
			return;
		}

		vibrate();
		customerStore.deleteCustomerRarePlan(activePlan.id);
	}, [activePlan, vibrate]);

	const handleDeletePlanPopoverOpenChange = useCallback(
		(isOpen: boolean) => {
			setIsDeletePlanPopoverOpen(activePlan !== null && isOpen);
			if (activePlan !== null && isOpen) {
				vibrate();
			}
		},
		[activePlan, vibrate]
	);

	const handleCancelDeletePlan = useCallback(() => {
		setIsDeletePlanPopoverOpen(false);
	}, []);

	const handleConfirmDeletePlan = useCallback(() => {
		setIsDeletePlanPopoverOpen(false);
		handleDeletePlan();
	}, [handleDeletePlan]);

	const handleRenamePlan = useCallback(() => {
		if (activePlan === null) {
			return;
		}

		vibrate();
		customerStore.renameCustomerRarePlan(
			activePlan.id,
			normalizedDraftName
		);
	}, [activePlan, normalizedDraftName, vibrate]);

	const handleMealSourceChange = useCallback(
		(source: TCustomerRarePlanMealSource) => {
			if (activePlan === null || activePlan.mealSource === source) {
				return;
			}

			vibrate();
			customerStore.setCustomerRarePlanMealSource(source);
		},
		[activePlan, vibrate]
	);

	const handleModeChange = useCallback(
		(mode: TCustomerRarePlanMode) => {
			if (activePlan === null || activePlan.mode === mode) {
				return;
			}

			vibrate();
			customerStore.setCustomerRarePlanMode(mode);
		},
		[activePlan, vibrate]
	);

	const handleToggleControls = useCallback(() => {
		guardCustomerGroupToggleDuringControlsAnimation();
		vibrate();
		customerStore.toggleCustomerRarePlanControlsCollapsed();
	}, [vibrate]);

	const planOptions = plans.items.map(({ id, name }) => ({ id, name }));
	const drawerPortalContainerProps = useMemo(
		() =>
			drawerPortalContainer === null
				? {}
				: { portalContainer: drawerPortalContainer },
		[drawerPortalContainer]
	);
	const selectPopoverProps = useMemo(
		() => ({
			motionProps: selectMotionProps,
			shouldCloseOnScroll: false,
			...drawerPortalContainerProps,
		}),
		[drawerPortalContainerProps, selectMotionProps]
	);
	const selectClassNames = useMemo(
		() => ({
			popoverContent: cn({
				'bg-content1/70 backdrop-blur-lg': isHighAppearance,
			}),
			trigger: cn(
				'bg-default/40 transition-background motion-reduce:transition-none',
				{
					'backdrop-blur data-[hover=true]:bg-default-400/40':
						isHighAppearance,
				}
			),
		}),
		[isHighAppearance]
	);

	return (
		<>
			<div
				ref={bookmarkRef}
				className="fixed left-0 top-[calc(var(--navbar-height,4rem)+var(--announcement-bar-offset,0rem)+2.5rem)] z-30"
			>
				<Button
					color="default"
					aria-label="打开营业预设"
					aria-haspopup="dialog"
					aria-expanded={isShellOpen}
					radius="none"
					size="sm"
					variant="flat"
					onPress={handleOpen}
					className="bg-content1/58 data-[hover=true]:bg-content1/78 data-[pressed=true]:bg-content1/88 min-h-24 w-6 !min-w-6 rounded-l-none rounded-r-medium border border-l-0 border-default-300/70 px-0 py-3 font-medium text-foreground-600 shadow-[inset_-1px_0_0_rgb(255_255_255_/_0.42),0_2px_7px_rgb(0_0_0_/_0.08),0_8px_18px_-14px_rgb(0_0_0_/_0.18)] ring-1 ring-inset ring-white/25 transition-all data-[hover=true]:translate-x-0.5 data-[hover=true]:border-default-400/70 data-[hover=true]:text-foreground-700 data-[hover=true]:shadow-[inset_-1px_0_0_rgb(255_255_255_/_0.48),0_3px_9px_rgb(0_0_0_/_0.09),0_10px_20px_-14px_rgb(0_0_0_/_0.2)] motion-reduce:data-[hover=true]:translate-x-0 xl:min-h-28 xl:w-8 xl:!min-w-8 dark:border-default-100/30 dark:bg-default/40 dark:text-default-600 dark:shadow-none dark:ring-0 dark:data-[hover=true]:border-default-100/45 dark:data-[hover=true]:bg-default/40 dark:data-[pressed=true]:bg-default/40 dark:data-[hover=true]:text-default-600 dark:data-[hover=true]:shadow-none"
				>
					<span className="flex h-full w-full flex-col items-center justify-center gap-1.5 xl:gap-2">
						<FontAwesomeIcon
							className="text-[10px] opacity-90 xl:text-tiny"
							icon={faBookmark}
						/>
						<span className="text-[10px] leading-none [writing-mode:vertical-rl] xl:text-tiny">
							营业预设
						</span>
					</span>
				</Button>
			</div>

			<AnimatePresence initial={false}>
				{isShellOpen && (
					<motion.div
						animate={{ opacity: 1 }}
						className="fixed inset-0 z-[45] bg-transparent"
						exit={{ opacity: 0 }}
						initial={{ opacity: 0 }}
						transition={{ duration: isReducedMotion ? 0 : 0.22 }}
					>
						<button
							aria-label="关闭营业预设"
							className={cn(
								'absolute inset-0 h-full w-full cursor-default',
								isHighAppearance
									? 'bg-background/45 backdrop-blur-lg'
									: 'bg-black/45'
							)}
							type="button"
							onClick={handleClose}
						/>
						<aside
							ref={setDrawerPanelRef}
							aria-label="稀客营业预设"
							aria-modal="true"
							className={cn(
								'absolute inset-0 flex flex-col overflow-hidden border-r border-divider shadow-2xl ring-1 ring-default-100/70 dark:ring-default-50/10',
								isHighAppearance
									? 'bg-blend-mystia'
									: 'bg-background dark:bg-content1'
							)}
							role="dialog"
							tabIndex={-1}
						>
							<motion.div
								animate={{ x: 0 }}
								className="flex h-full min-h-0 w-full transform-gpu flex-col will-change-transform"
								exit={{ x: '-100%' }}
								initial={{ x: '-100%' }}
								transition={
									isReducedMotion
										? { duration: 0 }
										: {
												duration: 0.34,
												ease: [0.22, 1, 0.36, 1],
												type: 'tween',
											}
								}
							>
								<header
									className={cn(
										'flex min-h-16 items-center justify-between gap-3 border-b border-divider px-4 py-3',
										isHighAppearance
											? 'bg-content1/50 backdrop-blur-lg'
											: 'bg-content1 dark:bg-content1/70'
									)}
								>
									<div className="flex min-w-0 items-center gap-3">
										<Link
											animationUnderline={false}
											color="foreground"
											href={siteConfig.links.index.href}
											aria-label={
												siteConfig.links.index.label
											}
											className="flex min-w-0 select-none items-center justify-start gap-1 rounded-small hover:brightness-100 active:opacity-disabled"
										>
											<span
												aria-hidden
												title={siteConfig.shortName}
												className="image-rendering-pixelated h-10 w-10 shrink-0 rounded-full bg-logo bg-cover bg-no-repeat"
											/>
											<p className="hidden truncate font-bold lg:inline-block">
												{siteConfig.name}
											</p>
											<SiteInfo
												aria-hidden="false"
												fontSize={16}
												name={siteConfig.shortName}
												className="pointer-events-auto h-full select-auto font-bold text-foreground lg:hidden"
											/>
										</Link>
										<span
											aria-hidden
											className="h-8 w-px shrink-0 bg-divider"
										/>
										<div className="flex min-w-0 items-center gap-1.5">
											<FontAwesomeIcon
												className="shrink-0 text-primary"
												icon={faBookmark}
												size="sm"
											/>
											<h2 className="min-w-0 truncate font-bold">
												营业预设
											</h2>
										</div>
									</div>
									<div className="flex shrink-0 items-center gap-1">
										<CustomerRarePlanHelpPopover
											isOpen={isHelpPopoverOpen}
											onOpenHiddenItemsSettings={
												handleOpenHiddenItemsSettings
											}
											onOpenChange={
												handleHelpPopoverOpenChange
											}
											onOpenRatingSettings={
												handleOpenRatingSettings
											}
											portalContainerProps={
												drawerPortalContainerProps
											}
											shouldCloseOnInteractOutside={
												shouldCloseHelpPopoverOnInteractOutside
											}
										/>
										<FontAwesomeIconButton
											icon={faXmark}
											variant="light"
											aria-label="关闭营业预设"
											onPress={handleClose}
										/>
									</div>
								</header>

								{isContentReady ? (
									<div className={getDrawerLayoutClassName()}>
										<aside
											className={getDrawerControlsClassName(
												{
													isControlsCollapsed,
													isHighAppearance,
												}
											)}
										>
											<motion.div>
												<div
													className={cn(
														'relative flex min-h-9 items-center justify-between gap-2',
														isControlsCollapsed &&
															'md:h-9 md:min-h-9 md:justify-center'
													)}
												>
													<div
														className={cn(
															'min-w-0 flex-1',
															isControlsCollapsed &&
																'md:pointer-events-none md:absolute md:left-1/2 md:top-12 md:z-10 md:flex md:max-h-[calc(100dvh-12rem)] md:w-8 md:-translate-x-1/2 md:flex-col md:items-center md:gap-2 md:overflow-hidden'
														)}
													>
														<p
															className={cn(
																'truncate text-small font-medium',
																isControlsCollapsed &&
																	'md:[writing-mode:vertical-rl]'
															)}
														>
															{isControlsCollapsed
																? (activePlan?.name ??
																	'营业预设')
																: '预设管理'}
														</p>
														<p
															className={cn(
																'truncate text-tiny text-foreground-500',
																isControlsCollapsed &&
																	'md:[writing-mode:vertical-rl]'
															)}
														>
															{isControlsCollapsed ? (
																<CustomerRarePlanSummaryText />
															) : (
																'配置地区与稀客范围'
															)}
														</p>
													</div>
													<Button
														isIconOnly
														radius="full"
														size="sm"
														variant={
															isControlsCollapsed
																? 'flat'
																: 'light'
														}
														aria-label={
															isControlsCollapsed
																? '展开预设管理'
																: '收起预设管理'
														}
														onPress={
															handleToggleControls
														}
													>
														<span
															className={cn(
																'inline-flex transition-transform duration-200 ease-linear motion-reduce:transition-none md:hidden',
																{
																	'rotate-180':
																		!isControlsCollapsed,
																}
															)}
														>
															<FontAwesomeIcon
																icon={
																	faChevronDown
																}
															/>
														</span>
														<span className="hidden md:inline-flex">
															<FontAwesomeIcon
																icon={
																	isControlsCollapsed
																		? faChevronRight
																		: faChevronLeft
																}
															/>
														</span>
													</Button>
												</div>
												<motion.div
													aria-hidden={
														isControlsCollapsed
													}
													animate={{
														height: isControlsCollapsed
															? 0
															: 'auto',
														opacity:
															isControlsCollapsed
																? 0
																: 1,
													}}
													initial={false}
													transition={{
														duration:
															isReducedMotion
																? 0
																: 0.2,
														ease: 'linear',
														type: 'tween',
													}}
													inert={
														isControlsCollapsed
															? true
															: undefined
													}
													className="overflow-hidden md:!h-auto md:w-[19rem] md:min-w-[19rem] md:!opacity-100"
												>
													<div
														className={cn(
															'space-y-4 pt-4 motion-reduce:transition-none md:w-[19rem] md:min-w-[19rem] md:transition-[transform,opacity] md:duration-200 md:ease-linear md:will-change-transform',
															isControlsCollapsed
																? 'md:-translate-x-[calc(100%+1rem)] md:opacity-0'
																: 'md:translate-x-0 md:opacity-100'
														)}
													>
														<div className="space-y-2">
															<Select
																disableAnimation={
																	isReducedMotion
																}
																label="当前预设"
																selectedKeys={
																	plans.activeId ===
																	null
																		? []
																		: [
																				plans.activeId,
																			]
																}
																size="sm"
																onSelectionChange={
																	handlePlanSelect
																}
																popoverProps={
																	selectPopoverProps
																}
																classNames={
																	selectClassNames
																}
															>
																{planOptions.map(
																	({
																		id,
																		name,
																	}) => (
																		<SelectItem
																			key={
																				id
																			}
																		>
																			{
																				name
																			}
																		</SelectItem>
																	)
																)}
															</Select>
															<div className="grid grid-cols-4 gap-2">
																<Button
																	size="sm"
																	variant="flat"
																	aria-label="新建预设"
																	className={cn(
																		'w-full min-w-0 px-0',
																		{
																			'backdrop-blur':
																				isHighAppearance,
																		}
																	)}
																	onPress={
																		handleCreatePlan
																	}
																	startContent={
																		<FontAwesomeIcon
																			icon={
																				faPlus
																			}
																		/>
																	}
																>
																	新建
																</Button>
																<Button
																	size="sm"
																	variant="flat"
																	aria-label="复制当前预设"
																	className={cn(
																		'w-full min-w-0 px-0',
																		{
																			'backdrop-blur':
																				isHighAppearance,
																		}
																	)}
																	isDisabled={
																		activePlan ===
																		null
																	}
																	onPress={
																		handleCopyPlan
																	}
																	startContent={
																		<FontAwesomeIcon
																			icon={
																				faCopy
																			}
																		/>
																	}
																>
																	复制
																</Button>
																<Popover
																	shouldBlockScroll
																	showArrow
																	isOpen={
																		isDeletePlanPopoverOpen
																	}
																	{...drawerPortalContainerProps}
																	onOpenChange={
																		handleDeletePlanPopoverOpenChange
																	}
																>
																	<PopoverTrigger>
																		<Button
																			color="danger"
																			size="sm"
																			variant="flat"
																			aria-label="删除当前预设"
																			className={cn(
																				'w-full min-w-0 px-0',
																				{
																					'backdrop-blur':
																						isHighAppearance,
																				}
																			)}
																			isDisabled={
																				activePlan ===
																				null
																			}
																			startContent={
																				<FontAwesomeIcon
																					icon={
																						faTrash
																					}
																				/>
																			}
																		>
																			删除
																		</Button>
																	</PopoverTrigger>
																	<PopoverContent className="space-y-1 p-1">
																		<Button
																			fullWidth
																			color="danger"
																			size="sm"
																			variant="ghost"
																			onPress={
																				handleConfirmDeletePlan
																			}
																		>
																			确认删除
																		</Button>
																		<Button
																			fullWidth
																			color="primary"
																			size="sm"
																			variant="ghost"
																			onPress={
																				handleCancelDeletePlan
																			}
																		>
																			取消删除
																		</Button>
																	</PopoverContent>
																</Popover>
																<Button
																	color="primary"
																	size="sm"
																	variant="flat"
																	aria-label="保存预设名"
																	className={cn(
																		'w-full min-w-0 px-0',
																		{
																			'backdrop-blur':
																				isHighAppearance,
																		}
																	)}
																	isDisabled={
																		isRenameDisabled
																	}
																	onPress={
																		handleRenamePlan
																	}
																	startContent={
																		<FontAwesomeIcon
																			icon={
																				faCheck
																			}
																		/>
																	}
																>
																	保存
																</Button>
															</div>
															<Input
																label="预设名"
																size="sm"
																value={
																	draftName
																}
																onValueChange={
																	setDraftName
																}
															/>
															<div className="space-y-1.5">
																<p className="px-1 text-tiny font-medium text-foreground-500">
																	套餐来源
																</p>
																<Tabs
																	fullWidth
																	disableAnimation={
																		isReducedMotion
																	}
																	size="sm"
																	selectedKey={
																		activePlanMealSource
																	}
																	onSelectionChange={(
																		key
																	) => {
																		handleMealSourceChange(
																			key as TCustomerRarePlanMealSource
																		);
																	}}
																	classNames={{
																		tab: cn(
																			'data-[hover=true]:!opacity-100 data-[hover-unselected=true]:brightness-95 data-[pressed=true]:!brightness-90',
																			isHighAppearance
																				? 'data-[hover-unselected=true]:bg-default-200/40 data-[pressed=true]:!bg-default-200/40'
																				: 'data-[hover-unselected=true]:bg-default-200 data-[pressed=true]:!bg-default-200',
																			isReducedMotion
																				? 'data-[selected=true]:bg-background data-[selected=true]:text-default-foreground dark:data-[selected=true]:bg-default dark:data-[selected=true]:text-foreground'
																				: 'transition'
																		),
																		tabList:
																			cn(
																				'grid grid-cols-2 bg-default/40',
																				{
																					'backdrop-blur':
																						isHighAppearance,
																				}
																			),
																	}}
																>
																	<Tab
																		key="saved"
																		title="已保存套餐"
																	/>
																	<Tab
																		key="recommended"
																		title="自动推荐"
																	/>
																</Tabs>
															</div>
														</div>

														<Divider className="bg-divider" />

														<Tabs
															fullWidth
															disableAnimation={
																isReducedMotion
															}
															size="sm"
															selectedKey={
																activePlanMode
															}
															onSelectionChange={(
																key
															) => {
																handleModeChange(
																	key as TCustomerRarePlanMode
																);
															}}
															classNames={{
																tab: cn(
																	'data-[hover=true]:!opacity-100 data-[hover-unselected=true]:brightness-95 data-[pressed=true]:!brightness-90',
																	isHighAppearance
																		? 'data-[hover-unselected=true]:bg-default-200/40 data-[pressed=true]:!bg-default-200/40'
																		: 'data-[hover-unselected=true]:bg-default-200 data-[pressed=true]:!bg-default-200',
																	isReducedMotion
																		? 'data-[selected=true]:bg-background data-[selected=true]:text-default-foreground dark:data-[selected=true]:bg-default dark:data-[selected=true]:text-foreground'
																		: 'transition'
																),
																tabList: cn(
																	'grid grid-cols-2 bg-default/40',
																	{
																		'backdrop-blur':
																			isHighAppearance,
																	}
																),
															}}
														>
															<Tab
																key="region"
																title="按地区"
															/>
															<Tab
																key="manual"
																title="手动"
															/>
														</Tabs>

														<motion.div
															animate={{
																height: modePanelHeight,
															}}
															initial={false}
															transition={{
																duration:
																	isReducedMotion
																		? 0
																		: 0.18,
																ease: 'linear',
																type: 'tween',
															}}
															className="relative overflow-hidden"
														>
															<div
																ref={
																	manualModePanelRef
																}
																aria-hidden={
																	activePlanMode !==
																	'manual'
																}
																inert={
																	activePlanMode ===
																	'manual'
																		? undefined
																		: true
																}
																className={cn(
																	'transition-opacity duration-150 ease-linear motion-reduce:transition-none',
																	activePlanMode ===
																		'manual'
																		? 'relative z-10 opacity-100'
																		: 'pointer-events-none absolute inset-x-0 top-0 z-0 opacity-0'
																)}
															>
																<Select
																	disableAnimation={
																		isReducedMotion
																	}
																	isVirtualized={
																		false
																	}
																	items={
																		availableCustomerNames
																	}
																	label="手动选择稀客"
																	selectedKeys={
																		activePlan?.manualCustomers ??
																		[]
																	}
																	selectionMode="multiple"
																	size="sm"
																	onSelectionChange={(
																		selection
																	) => {
																		customerStore.setCustomerRarePlanManualCustomers(
																			selectionToValues<TCustomerRareName>(
																				selection
																			)
																		);
																	}}
																	popoverProps={
																		selectPopoverProps
																	}
																	classNames={
																		selectClassNames
																	}
																>
																	{({
																		value,
																	}) =>
																		renderCustomerSelectItem(
																			value
																		)
																	}
																</Select>
															</div>
															<div
																ref={
																	regionModePanelRef
																}
																aria-hidden={
																	activePlanMode !==
																	'region'
																}
																inert={
																	activePlanMode ===
																	'region'
																		? undefined
																		: true
																}
																className={cn(
																	'space-y-3 transition-opacity duration-150 ease-linear motion-reduce:transition-none',
																	activePlanMode ===
																		'region'
																		? 'relative z-10 opacity-100'
																		: 'pointer-events-none absolute inset-x-0 top-0 z-0 opacity-0'
																)}
															>
																<Select
																	disableAnimation={
																		isReducedMotion
																	}
																	isVirtualized={
																		false
																	}
																	items={
																		availableCustomerPlaces
																	}
																	label="出没地区"
																	selectedKeys={
																		activePlan?.places ??
																		[]
																	}
																	selectionMode="multiple"
																	size="sm"
																	onSelectionChange={(
																		selection
																	) => {
																		customerStore.setCustomerRarePlanPlaces(
																			selectionToValues<TPlace>(
																				selection
																			)
																		);
																	}}
																	popoverProps={
																		selectPopoverProps
																	}
																	classNames={
																		selectClassNames
																	}
																>
																	{({
																		value,
																	}) => (
																		<SelectItem
																			key={
																				value
																			}
																		>
																			{
																				value
																			}
																		</SelectItem>
																	)}
																</Select>
																<Select
																	disableAnimation={
																		isReducedMotion
																	}
																	isVirtualized={
																		false
																	}
																	items={
																		availableCustomerNames
																	}
																	label="额外包含"
																	selectedKeys={
																		activePlan?.includes ??
																		[]
																	}
																	selectionMode="multiple"
																	size="sm"
																	onSelectionChange={(
																		selection
																	) => {
																		customerStore.setCustomerRarePlanIncludes(
																			selectionToValues<TCustomerRareName>(
																				selection
																			)
																		);
																	}}
																	popoverProps={
																		selectPopoverProps
																	}
																	classNames={
																		selectClassNames
																	}
																>
																	{({
																		value,
																	}) =>
																		renderCustomerSelectItem(
																			value
																		)
																	}
																</Select>
																<Select
																	disableAnimation={
																		isReducedMotion
																	}
																	isVirtualized={
																		false
																	}
																	items={
																		availableCustomerNames
																	}
																	label="额外排除"
																	selectedKeys={
																		activePlan?.excludes ??
																		[]
																	}
																	selectionMode="multiple"
																	size="sm"
																	onSelectionChange={(
																		selection
																	) => {
																		customerStore.setCustomerRarePlanExcludes(
																			selectionToValues<TCustomerRareName>(
																				selection
																			)
																		);
																	}}
																	popoverProps={
																		selectPopoverProps
																	}
																	classNames={
																		selectClassNames
																	}
																>
																	{({
																		value,
																	}) =>
																		renderCustomerSelectItem(
																			value
																		)
																	}
																</Select>
															</div>
														</motion.div>
													</div>
												</motion.div>
											</motion.div>
										</aside>

										<CustomerRarePlanResults
											isHighAppearance={isHighAppearance}
											popoverPortalProps={
												drawerPortalContainerProps
											}
										/>
									</div>
								) : (
									<div
										aria-hidden
										className={getDrawerLayoutClassName()}
									>
										<aside
											className={getDrawerControlsClassName(
												{
													isControlsCollapsed,
													isHighAppearance,
												}
											)}
										>
											{isControlsCollapsed ? (
												<div className="relative flex min-h-9 items-center justify-between gap-2 md:h-9 md:min-h-9 md:justify-center">
													<div className="min-w-0 flex-1 space-y-1.5 md:pointer-events-none md:absolute md:left-1/2 md:top-12 md:z-10 md:flex md:max-h-[calc(100dvh-12rem)] md:w-8 md:-translate-x-1/2 md:flex-col md:items-center md:gap-2 md:space-y-0 md:overflow-hidden">
														<div
															className={getDrawerSkeletonClassName(
																{
																	className:
																		'h-4 w-20 rounded md:h-24 md:w-4',
																	isHighAppearance,
																	toneClassName:
																		DRAWER_SKELETON_PRIMARY_CLASSNAME,
																}
															)}
														/>
														<div
															className={getDrawerSkeletonClassName(
																{
																	className:
																		'h-3 w-24 rounded md:h-28 md:w-3',
																	isHighAppearance,
																	toneClassName:
																		DRAWER_SKELETON_SECONDARY_CLASSNAME,
																}
															)}
														/>
													</div>
													<div
														className={getDrawerSkeletonClassName(
															{
																className:
																	'h-8 w-8 shrink-0 rounded-full',
																isHighAppearance,
																toneClassName:
																	DRAWER_SKELETON_BLOCK_CLASSNAME,
															}
														)}
													/>
												</div>
											) : (
												<div className="space-y-4">
													<div className="flex items-center justify-between gap-2">
														<div className="min-w-0 space-y-1.5">
															<div
																className={getDrawerSkeletonClassName(
																	{
																		className:
																			'h-4 w-20 rounded',
																		isHighAppearance,
																		toneClassName:
																			DRAWER_SKELETON_PRIMARY_CLASSNAME,
																	}
																)}
															/>
															<div
																className={getDrawerSkeletonClassName(
																	{
																		className:
																			'h-3 w-28 rounded',
																		isHighAppearance,
																		toneClassName:
																			DRAWER_SKELETON_SECONDARY_CLASSNAME,
																	}
																)}
															/>
														</div>
														<div
															className={getDrawerSkeletonClassName(
																{
																	className:
																		'h-8 w-8 shrink-0 rounded-full',
																	isHighAppearance,
																	toneClassName:
																		DRAWER_SKELETON_BLOCK_CLASSNAME,
																}
															)}
														/>
													</div>
													<div className="space-y-2">
														<div
															className={getDrawerSkeletonClassName(
																{
																	className:
																		'h-12 rounded-small',
																	isHighAppearance,
																	toneClassName:
																		DRAWER_SKELETON_BLOCK_CLASSNAME,
																}
															)}
														/>
														<div className="grid grid-cols-4 gap-2">
															{[0, 1, 2, 3].map(
																(index) => (
																	<div
																		key={
																			index
																		}
																		className={getDrawerSkeletonClassName(
																			{
																				className:
																					'h-8 rounded-small',
																				isHighAppearance,
																				toneClassName:
																					DRAWER_SKELETON_BLOCK_CLASSNAME,
																			}
																		)}
																	/>
																)
															)}
														</div>
														<div
															className={getDrawerSkeletonClassName(
																{
																	className:
																		'h-12 rounded-small',
																	isHighAppearance,
																	toneClassName:
																		DRAWER_SKELETON_BLOCK_CLASSNAME,
																}
															)}
														/>
														<div className="space-y-1.5">
															<div
																className={getDrawerSkeletonClassName(
																	{
																		className:
																			'h-4 w-16 rounded',
																		isHighAppearance,
																		toneClassName:
																			DRAWER_SKELETON_SECONDARY_CLASSNAME,
																	}
																)}
															/>
															<div
																className={getDrawerSkeletonClassName(
																	{
																		className:
																			'h-9 rounded-small',
																		isHighAppearance,
																		toneClassName:
																			DRAWER_SKELETON_BLOCK_CLASSNAME,
																	}
																)}
															/>
														</div>
													</div>

													<Divider className="bg-divider" />

													<div
														className={getDrawerSkeletonClassName(
															{
																className:
																	'h-9 rounded-small',
																isHighAppearance,
																toneClassName:
																	DRAWER_SKELETON_BLOCK_CLASSNAME,
															}
														)}
													/>

													<div className="space-y-3">
														{[0, 1, 2].map(
															(index) => (
																<div
																	key={index}
																	className={getDrawerSkeletonClassName(
																		{
																			className:
																				'h-12 rounded-small',
																			isHighAppearance,
																			toneClassName:
																				index ===
																				0
																					? DRAWER_SKELETON_BLOCK_CLASSNAME
																					: DRAWER_SKELETON_MUTED_BLOCK_CLASSNAME,
																		}
																	)}
																/>
															)
														)}
													</div>
												</div>
											)}
										</aside>
										<main
											className={getDrawerResultsClassName(
												isHighAppearance
											)}
										>
											<div className="relative min-h-0 flex-1 overflow-hidden pr-2">
												<div className="-mr-2 h-full min-h-0 overflow-y-auto py-4 pl-4 pr-2 [scrollbar-gutter:auto] md:py-5 md:pl-5 md:pr-3">
													<div className="relative min-h-full">
														<div className="space-y-3 md:space-y-4">
															{DRAWER_SKELETON_ROWS.map(
																(index) => (
																	<div
																		key={
																			index
																		}
																		className="will-change-transform"
																	>
																		<div
																			className={cn(
																				'rounded-small border border-default-200/80 bg-content1/65 p-3 shadow-small ring-1 ring-default-100/60 transition-all hover:border-default-300/80 hover:bg-content1/75 motion-reduce:transition-none md:p-3.5 dark:bg-content1/30 dark:ring-default-50/10 dark:hover:bg-content1/35',
																				{
																					'backdrop-blur':
																						isHighAppearance,
																				}
																			)}
																		>
																			<div className="flex items-center justify-between gap-2">
																				<div className="flex min-w-0 flex-1 items-center gap-2">
																					<div
																						className={getDrawerSkeletonClassName(
																							{
																								className:
																									'h-[1.8rem] w-[1.8rem] shrink-0 rounded-full',
																								isHighAppearance,
																								toneClassName:
																									DRAWER_SKELETON_PRIMARY_CLASSNAME,
																							}
																						)}
																					/>
																					<div className="min-w-0 space-y-2">
																						<div
																							className={getDrawerSkeletonClassName(
																								{
																									className:
																										'h-4 w-28 rounded',
																									isHighAppearance,
																									toneClassName:
																										DRAWER_SKELETON_PRIMARY_CLASSNAME,
																								}
																							)}
																						/>
																						<div
																							className={getDrawerSkeletonClassName(
																								{
																									className:
																										'h-4 w-48 max-w-full rounded',
																									isHighAppearance,
																									toneClassName:
																										DRAWER_SKELETON_SECONDARY_CLASSNAME,
																								}
																							)}
																						/>
																					</div>
																				</div>
																				<div className="flex shrink-0 flex-nowrap items-center gap-2">
																					<div
																						className={getDrawerSkeletonClassName(
																							{
																								className:
																									'h-7 w-16 rounded-small',
																								isHighAppearance,
																								toneClassName:
																									DRAWER_SKELETON_BLOCK_CLASSNAME,
																							}
																						)}
																					/>
																					<div
																						className={getDrawerSkeletonClassName(
																							{
																								className:
																									'h-8 w-8 rounded-small',
																								isHighAppearance,
																								toneClassName:
																									DRAWER_SKELETON_BLOCK_CLASSNAME,
																							}
																						)}
																					/>
																					<div
																						className={getDrawerSkeletonClassName(
																							{
																								className:
																									'h-8 w-8 rounded-small',
																								isHighAppearance,
																								toneClassName:
																									DRAWER_SKELETON_BLOCK_CLASSNAME,
																							}
																						)}
																					/>
																				</div>
																			</div>
																		</div>
																	</div>
																)
															)}
														</div>
													</div>
												</div>
											</div>
										</main>
									</div>
								)}
							</motion.div>
						</aside>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
