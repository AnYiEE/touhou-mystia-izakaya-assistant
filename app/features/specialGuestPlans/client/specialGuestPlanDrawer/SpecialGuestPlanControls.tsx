import {
	faCheck,
	faChevronDown,
	faChevronLeft,
	faChevronRight,
	faCopy,
	faPlus,
	faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Divider } from '@heroui/divider';
import { Select, SelectItem } from '@heroui/select';
import { type Selection } from '@heroui/table';
import { Tab, Tabs } from '@heroui/tabs';
import { cn } from '@heroui/theme';
import { motion } from 'framer-motion';
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import Input from '@/design/ui/components/input';
import Popover, {
	type IPopoverProps,
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import {
	selectionToKnownValues,
	toSelectionKeySet,
} from '@/design/ui/components/selectionKeys';
import { useMotionProps } from '@/design/ui/hooks/useMotionProps';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TMapLabel } from '@/domain/data/places/types';
import { RECOMMENDATION_SORT_PROFILE_LABEL_MAP } from '@/domain/recommendations/labels';
import {
	RECOMMENDATION_SORT_PROFILES,
	type TRecommendationSortProfile,
} from '@/domain/recommendations/sortProfiles';

import { specialGuestPlanCatalogPort } from '@/features/catalog/guests/special/client/state/specialGuestPlanCatalogPort';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import { recommendationPreferencesFacade } from '@/features/preferences/client/recommendationPreferencesFacade';
import { useVibrate } from '@/features/preferences/client/useVibrate';
import {
	checkSpecialGuestPlansStateVirtual,
	getDisplayedSpecialGuestPlan,
	normalizeSpecialGuestPlanName,
} from '@/features/specialGuestPlans/client/state/planState';
import { specialGuestPlansStore } from '@/features/specialGuestPlans/client/state/store';
import type {
	TSpecialGuestPlanGuestSort,
	TSpecialGuestPlanMealSource,
	TSpecialGuestPlanMode,
} from '@/features/specialGuestPlans/contracts';

import { guardGuestGroupToggleDuringControlsAnimation } from './dom';
import { getDrawerControlsClassName } from './drawerLayout';
import { createPlanSelectionComparator } from './selectionOrdering';
import SpecialGuestPlanSummaryText from './SpecialGuestPlanSummaryText';

const SPECIAL_GUEST_PLAN_GUEST_SORT_OPTIONS = [
	{ label: '默认排序', value: 'default' },
	{ label: '拼音A-Z（按DLC分组）', value: 'pinyin-asc' },
	{ label: '拼音Z-A（按DLC分组）', value: 'pinyin-desc' },
	{ label: '拼音A-Z（不按DLC分组）', value: 'pinyin-asc-flat' },
	{ label: '拼音Z-A（不按DLC分组）', value: 'pinyin-desc-flat' },
] satisfies Array<{ label: string; value: TSpecialGuestPlanGuestSort }>;

const SPECIAL_GUEST_PLAN_GUEST_SORT_BY_KEY: ReadonlyMap<
	string,
	TSpecialGuestPlanGuestSort
> = new Map(
	SPECIAL_GUEST_PLAN_GUEST_SORT_OPTIONS.map(({ value }) => [value, value])
);

const SPECIAL_GUEST_PLAN_MEAL_SOURCE_BY_KEY: ReadonlyMap<
	string,
	TSpecialGuestPlanMealSource
> = new Map([
	['recommended', 'recommended'],
	['saved', 'saved'],
]);

const FOLLOW_SETTINGS_SORT_PROFILE_KEY = 'follow-settings';
const SPECIAL_GUEST_PLAN_SORT_PROFILE_OPTIONS = [
	{ label: '跟随全局设置', value: FOLLOW_SETTINGS_SORT_PROFILE_KEY },
	...RECOMMENDATION_SORT_PROFILES.map((value) => ({
		label: RECOMMENDATION_SORT_PROFILE_LABEL_MAP[value],
		value,
	})),
];
const SPECIAL_GUEST_PLAN_SORT_PROFILE_OVERRIDE_BY_KEY: ReadonlyMap<
	string,
	TRecommendationSortProfile | null
> = new Map([
	[FOLLOW_SETTINGS_SORT_PROFILE_KEY, null],
	...RECOMMENDATION_SORT_PROFILES.map((value) => [value, value] as const),
]);

const SPECIAL_GUEST_PLAN_MODE_BY_KEY: ReadonlyMap<
	string,
	TSpecialGuestPlanMode
> = new Map([
	['manual', 'manual'],
	['region', 'region'],
]);

const SPECIAL_GUEST_SELECT_ITEM_CLASS_NAMES = {
	base: '[&>span]:inline-flex',
} as const;

function renderSpecialGuestSelectItem({
	id,
	name,
}: {
	id: TSpecialGuestId;
	name: string;
}) {
	return (
		<SelectItem
			key={id.toString()}
			textValue={name}
			classNames={SPECIAL_GUEST_SELECT_ITEM_CLASS_NAMES}
		>
			<span className="inline-flex items-center gap-1">
				<Sprite
					className="rounded-full"
					recordId={id}
					size={1.35}
					target="special_guest"
				/>
				<span>{name}</span>
			</span>
		</SelectItem>
	);
}

export default function SpecialGuestPlanControls({
	portalContainerProps,
}: {
	portalContainerProps: Pick<IPopoverProps, 'portalContainer'>;
}) {
	const manualModePanelRef = useRef<HTMLDivElement>(null);
	const regionModePanelRef = useRef<HTMLDivElement>(null);
	const { isHighAppearance } = useDesignPreferences();
	const selectMotionProps = useMotionProps('select');
	const isReducedMotion = useReducedMotion();
	const vibrate = useVibrate();
	const isControlsCollapsed =
		specialGuestPlansStore.shared.drawer.isControlsCollapsed.use();
	const recommendationSortProfileOverride =
		specialGuestPlansStore.shared.drawer.sortProfileOverride.use();
	const permanentRecommendationSortProfile =
		recommendationPreferencesFacade.sortProfile.use();
	const plans = specialGuestPlansStore.persistence.plans.use();
	const activePlan = getDisplayedSpecialGuestPlan(plans);
	const isVirtualPlans = checkSpecialGuestPlansStateVirtual(plans);
	const availableGuestMaps =
		specialGuestPlanCatalogPort.availableGuestMaps.use();
	const availableSpecialGuests =
		specialGuestPlanCatalogPort.availableSpecialGuests.use();
	const availableGuestMapByKey = useMemo<ReadonlyMap<string, TMapLabel>>(
		() =>
			new Map(
				availableGuestMaps.map(({ value }) => [value, value] as const)
			),
		[availableGuestMaps]
	);
	const availableSpecialGuestByKey = useMemo<
		ReadonlyMap<string, TSpecialGuestId>
	>(
		() =>
			new Map(
				availableSpecialGuests.map(({ id }) => [id.toString(), id])
			),
		[availableSpecialGuests]
	);
	const compareGuestMaps = useMemo(
		() => createPlanSelectionComparator(availableGuestMaps),
		[availableGuestMaps]
	);
	const compareSpecialGuests = useMemo(
		() =>
			createPlanSelectionComparator(
				availableSpecialGuests.map(({ id, name }) => ({
					name,
					value: id,
				}))
			),
		[availableSpecialGuests]
	);
	const [draftName, setDraftName] = useState(activePlan.name);
	const [isDeletePlanPopoverOpen, setIsDeletePlanPopoverOpen] =
		useState(false);
	const [isModePanelAnimating, setIsModePanelAnimating] = useState(false);
	const [modePanelHeight, setModePanelHeight] = useState<number | 'auto'>(
		'auto'
	);
	const normalizedDraftName = normalizeSpecialGuestPlanName(draftName);
	const activePlanGuestSort = activePlan.guestSort;
	const activePlanMealSource = activePlan.mealSource;
	const activePlanMode = activePlan.mode;
	const effectiveRecommendationSortProfile =
		recommendationSortProfileOverride ?? permanentRecommendationSortProfile;
	const isRenameDisabled = normalizedDraftName === activePlan.name;
	const activePlanGuestSortKeys = useMemo(
		() => [activePlanGuestSort],
		[activePlanGuestSort]
	);
	const activePlanKeys = useMemo(() => [activePlan.id], [activePlan.id]);
	const activePlanExcludeKeys = useMemo(
		() => toSelectionKeySet(activePlan.excludes),
		[activePlan.excludes]
	);
	const activePlanIncludeKeys = useMemo(
		() => toSelectionKeySet(activePlan.includes),
		[activePlan.includes]
	);
	const activePlanManualGuestKeys = useMemo(
		() => toSelectionKeySet(activePlan.manualGuests),
		[activePlan.manualGuests]
	);
	const recommendationSortProfileKeys = useMemo(
		() =>
			new Set([
				recommendationSortProfileOverride ??
					FOLLOW_SETTINGS_SORT_PROFILE_KEY,
			]),
		[recommendationSortProfileOverride]
	);
	const planIdByKey = useMemo<ReadonlyMap<string, string>>(
		() =>
			new Map(
				(isVirtualPlans ? [activePlan] : plans.items).map(({ id }) => [
					id,
					id,
				])
			),
		[activePlan, isVirtualPlans, plans.items]
	);

	useEffect(() => {
		setDraftName(activePlan.name);
	}, [activePlan.id, activePlan.name]);

	useEffect(() => {
		if (isVirtualPlans) {
			setIsDeletePlanPopoverOpen(false);
		}
	}, [isVirtualPlans]);

	useLayoutEffect(() => {
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
		activePlan.excludes,
		activePlan.includes,
		activePlan.manualGuests,
		activePlan.maps,
		activePlanMode,
	]);

	const handlePlanSelect = useCallback(
		(selection: Selection) => {
			const [planId] =
				selectionToKnownValues(selection, planIdByKey) ?? [];
			if (
				isVirtualPlans ||
				planId === undefined ||
				activePlan.id === planId
			) {
				return;
			}

			vibrate();
			specialGuestPlansStore.setActivePlan(planId);
		},
		[activePlan.id, isVirtualPlans, planIdByKey, vibrate]
	);

	const handleCreatePlan = useCallback(() => {
		vibrate();
		specialGuestPlansStore.createPlan();
	}, [vibrate]);

	const handleCopyPlan = useCallback(() => {
		if (isVirtualPlans) {
			return;
		}

		vibrate();
		specialGuestPlansStore.copyPlan(activePlan.id);
	}, [activePlan, isVirtualPlans, vibrate]);

	const handleDeletePlan = useCallback(() => {
		if (isVirtualPlans) {
			return;
		}

		vibrate();
		specialGuestPlansStore.deletePlan(activePlan.id);
	}, [activePlan, isVirtualPlans, vibrate]);

	const handleDeletePlanPopoverOpenChange = useCallback(
		(isOpen: boolean) => {
			const canDelete = !isVirtualPlans;
			setIsDeletePlanPopoverOpen(canDelete && isOpen);
			if (canDelete && isOpen) {
				vibrate();
			}
		},
		[isVirtualPlans, vibrate]
	);

	const handleCancelDeletePlan = useCallback(() => {
		setIsDeletePlanPopoverOpen(false);
	}, []);

	const handleConfirmDeletePlan = useCallback(() => {
		setIsDeletePlanPopoverOpen(false);
		handleDeletePlan();
	}, [handleDeletePlan]);

	const handleRenamePlan = useCallback(() => {
		vibrate();
		specialGuestPlansStore.renamePlan(activePlan.id, normalizedDraftName);
	}, [activePlan, normalizedDraftName, vibrate]);

	const handleMealSourceChange = useCallback(
		(source: TSpecialGuestPlanMealSource) => {
			if (activePlan.mealSource === source) {
				return;
			}

			vibrate();
			specialGuestPlansStore.setMealSource(source);
		},
		[activePlan, vibrate]
	);

	const handleModeChange = useCallback(
		(mode: TSpecialGuestPlanMode) => {
			if (activePlan.mode === mode) {
				return;
			}

			vibrate();
			specialGuestPlansStore.setMode(mode);
		},
		[activePlan, vibrate]
	);
	const handleModePanelAnimationStart = useCallback(() => {
		setIsModePanelAnimating(!isReducedMotion);
	}, [isReducedMotion]);

	const handleModePanelAnimationComplete = useCallback(() => {
		setIsModePanelAnimating(false);
	}, []);

	const handleGuestSortChange = useCallback(
		(selection: Selection) => {
			const [guestSort] =
				selectionToKnownValues(
					selection,
					SPECIAL_GUEST_PLAN_GUEST_SORT_BY_KEY
				) ?? [];
			if (guestSort === undefined || activePlan.guestSort === guestSort) {
				return;
			}

			specialGuestPlansStore.setGuestSort(guestSort);
		},
		[activePlan]
	);

	const handleRecommendationSortProfileChange = useCallback(
		(selection: Selection) => {
			const values = selectionToKnownValues(
				selection,
				SPECIAL_GUEST_PLAN_SORT_PROFILE_OVERRIDE_BY_KEY
			);
			if (values !== null) {
				specialGuestPlansStore.shared.drawer.sortProfileOverride.set(
					values[0] ?? null
				);
			}
		},
		[]
	);

	const handleToggleControls = useCallback(() => {
		guardGuestGroupToggleDuringControlsAnimation();
		vibrate();
		specialGuestPlansStore.toggleControlsCollapsed();
	}, [vibrate]);

	const planOptions = useMemo(
		() =>
			isVirtualPlans
				? [{ id: activePlan.id, name: activePlan.name }]
				: plans.items.map(({ id, name }) => ({ id, name })),
		[activePlan.id, activePlan.name, isVirtualPlans, plans.items]
	);

	const selectPopoverProps = useMemo(
		() => ({
			motionProps: selectMotionProps,
			shouldCloseOnScroll: false,
			...portalContainerProps,
		}),
		[portalContainerProps, selectMotionProps]
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
	const controlsMotionAnimate = useMemo(
		() => ({
			height: isControlsCollapsed ? 0 : 'auto',
			opacity: isControlsCollapsed ? 0 : 1,
		}),
		[isControlsCollapsed]
	);
	const controlsMotionTransition = useMemo(
		() => ({
			duration: isReducedMotion ? 0 : 0.2,
			ease: 'linear' as const,
			type: 'tween' as const,
		}),
		[isReducedMotion]
	);
	const modePanelMotionAnimate = useMemo(
		() => ({ height: modePanelHeight }),
		[modePanelHeight]
	);
	const modePanelMotionTransition = useMemo(
		() => ({
			duration: isReducedMotion ? 0 : 0.18,
			ease: 'linear' as const,
			type: 'tween' as const,
		}),
		[isReducedMotion]
	);
	const tabsClassNames = useMemo(
		() => ({
			tab: cn(
				'data-[hover=true]:!opacity-100 data-[hover-unselected=true]:brightness-95 data-[pressed=true]:!brightness-90',
				isHighAppearance
					? 'data-[hover-unselected=true]:bg-default-200/40 data-[pressed=true]:!bg-default-200/40'
					: 'data-[hover-unselected=true]:bg-default-200 data-[pressed=true]:!bg-default-200',
				isReducedMotion
					? 'data-[selected=true]:bg-background data-[selected=true]:text-default-foreground dark:data-[selected=true]:bg-default dark:data-[selected=true]:text-foreground'
					: 'transition'
			),
			tabList: cn('grid grid-cols-2 bg-default/40', {
				'backdrop-blur': isHighAppearance,
			}),
		}),
		[isHighAppearance, isReducedMotion]
	);

	return (
		<aside
			className={getDrawerControlsClassName({
				isControlsCollapsed,
				isHighAppearance,
			})}
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
							{isControlsCollapsed ? activePlan.name : '预设管理'}
						</p>
						<p
							className={cn(
								'truncate text-tiny text-foreground-500',
								isControlsCollapsed &&
									'md:[writing-mode:vertical-rl]'
							)}
						>
							{isControlsCollapsed ? (
								<SpecialGuestPlanSummaryText />
							) : (
								'配置地区与稀客范围'
							)}
						</p>
					</div>
					<Button
						isIconOnly
						radius="full"
						size="sm"
						variant={isControlsCollapsed ? 'flat' : 'light'}
						aria-label={
							isControlsCollapsed
								? '展开预设管理'
								: '收起预设管理'
						}
						onPress={handleToggleControls}
					>
						<span
							className={cn(
								'inline-flex transition-transform duration-200 ease-linear motion-reduce:transition-none md:hidden',
								{ 'rotate-180': !isControlsCollapsed }
							)}
						>
							<FontAwesomeIcon icon={faChevronDown} />
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
					aria-hidden={isControlsCollapsed}
					animate={controlsMotionAnimate}
					initial={false}
					transition={controlsMotionTransition}
					inert={isControlsCollapsed ? true : undefined}
					className="overflow-hidden md:!h-auto md:w-[19rem] md:min-w-[19rem] md:overflow-visible md:!opacity-100"
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
								disableAnimation={isReducedMotion}
								label="当前预设"
								selectedKeys={activePlanKeys}
								size="sm"
								onSelectionChange={handlePlanSelect}
								popoverProps={selectPopoverProps}
								classNames={selectClassNames}
							>
								{planOptions.map(({ id, name }) => (
									<SelectItem key={id}>{name}</SelectItem>
								))}
							</Select>
							<div className="grid grid-cols-4 gap-2">
								<Button
									size="sm"
									variant="flat"
									aria-label="新建预设"
									className={cn('w-full min-w-0 px-0', {
										'backdrop-blur': isHighAppearance,
									})}
									onPress={handleCreatePlan}
									startContent={
										<FontAwesomeIcon icon={faPlus} />
									}
								>
									新建
								</Button>
								<Button
									size="sm"
									variant="flat"
									aria-label="复制当前预设"
									className={cn('w-full min-w-0 px-0', {
										'backdrop-blur': isHighAppearance,
									})}
									isDisabled={isVirtualPlans}
									onPress={handleCopyPlan}
									startContent={
										<FontAwesomeIcon icon={faCopy} />
									}
								>
									复制
								</Button>
								<Popover
									shouldBlockScroll
									showArrow
									isOpen={isDeletePlanPopoverOpen}
									{...portalContainerProps}
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
											isDisabled={isVirtualPlans}
											startContent={
												<FontAwesomeIcon
													icon={faTrash}
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
											onPress={handleConfirmDeletePlan}
										>
											确认删除
										</Button>
										<Button
											fullWidth
											color="primary"
											size="sm"
											variant="ghost"
											onPress={handleCancelDeletePlan}
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
									className={cn('w-full min-w-0 px-0', {
										'backdrop-blur': isHighAppearance,
									})}
									isDisabled={isRenameDisabled}
									onPress={handleRenamePlan}
									startContent={
										<FontAwesomeIcon icon={faCheck} />
									}
								>
									保存
								</Button>
							</div>
							<Input
								label="预设名"
								size="sm"
								value={draftName}
								onValueChange={setDraftName}
							/>
							<div className="space-y-1.5">
								<p className="px-1 text-tiny font-medium text-foreground-500">
									套餐来源
								</p>
								<Tabs
									fullWidth
									disableAnimation={isReducedMotion}
									size="sm"
									selectedKey={activePlanMealSource}
									onSelectionChange={(key) => {
										if (typeof key !== 'string') {
											return;
										}
										const source =
											SPECIAL_GUEST_PLAN_MEAL_SOURCE_BY_KEY.get(
												key
											);
										if (source !== undefined) {
											handleMealSourceChange(source);
										}
									}}
									classNames={tabsClassNames}
								>
									<Tab key="saved" title="已保存套餐" />
									<Tab key="recommended" title="自动推荐" />
								</Tabs>
								{activePlanMealSource === 'recommended' && (
									<Select
										disallowEmptySelection
										disableAnimation={isReducedMotion}
										isVirtualized={false}
										items={
											SPECIAL_GUEST_PLAN_SORT_PROFILE_OPTIONS
										}
										label="推荐策略"
										selectedKeys={
											recommendationSortProfileKeys
										}
										selectionMode="single"
										size="sm"
										onSelectionChange={
											handleRecommendationSortProfileChange
										}
										aria-label="选择营业预设自动推荐的推荐策略；跟随全局设置时实时使用默认推荐策略"
										title={`选择营业预设自动推荐的推荐策略；当前生效：${RECOMMENDATION_SORT_PROFILE_LABEL_MAP[effectiveRecommendationSortProfile]}`}
										popoverProps={selectPopoverProps}
										classNames={selectClassNames}
									>
										{({ label, value }) => (
											<SelectItem
												key={value}
												textValue={label}
											>
												{label}
											</SelectItem>
										)}
									</Select>
								)}
							</div>
						</div>

						<Divider className="bg-divider" />

						<Tabs
							fullWidth
							disableAnimation={isReducedMotion}
							size="sm"
							selectedKey={activePlanMode}
							onSelectionChange={(key) => {
								if (typeof key !== 'string') {
									return;
								}
								const mode =
									SPECIAL_GUEST_PLAN_MODE_BY_KEY.get(key);
								if (mode !== undefined) {
									handleModeChange(mode);
								}
							}}
							classNames={tabsClassNames}
						>
							<Tab key="region" title="按地区" />
							<Tab key="manual" title="手动" />
						</Tabs>

						<motion.div
							animate={modePanelMotionAnimate}
							initial={false}
							onAnimationComplete={
								handleModePanelAnimationComplete
							}
							onAnimationStart={handleModePanelAnimationStart}
							transition={modePanelMotionTransition}
							className={cn(
								'relative',
								isModePanelAnimating && 'overflow-hidden'
							)}
						>
							<div
								ref={manualModePanelRef}
								aria-hidden={activePlanMode !== 'manual'}
								inert={
									activePlanMode === 'manual'
										? undefined
										: true
								}
								className={cn(
									'transition-opacity duration-150 ease-linear motion-reduce:transition-none',
									activePlanMode === 'manual'
										? 'relative z-10 opacity-100'
										: 'pointer-events-none absolute inset-x-0 top-0 z-0 opacity-0'
								)}
							>
								<Select
									disableAnimation={isReducedMotion}
									isVirtualized={false}
									items={availableSpecialGuests}
									label="手动选择稀客"
									selectedKeys={activePlanManualGuestKeys}
									selectionMode="multiple"
									size="sm"
									onSelectionChange={(selection) => {
										const values = selectionToKnownValues(
											selection,
											availableSpecialGuestByKey,
											compareSpecialGuests
										);
										if (values !== null) {
											specialGuestPlansStore.setManualGuests(
												values
											);
										}
									}}
									popoverProps={selectPopoverProps}
									classNames={selectClassNames}
								>
									{renderSpecialGuestSelectItem}
								</Select>
							</div>
							<div
								ref={regionModePanelRef}
								aria-hidden={activePlanMode !== 'region'}
								inert={
									activePlanMode === 'region'
										? undefined
										: true
								}
								className={cn(
									'space-y-3 transition-opacity duration-150 ease-linear motion-reduce:transition-none',
									activePlanMode === 'region'
										? 'relative z-10 opacity-100'
										: 'pointer-events-none absolute inset-x-0 top-0 z-0 opacity-0'
								)}
							>
								<Select
									disableAnimation={isReducedMotion}
									isVirtualized={false}
									items={availableGuestMaps}
									label="出没地区"
									selectedKeys={activePlan.maps}
									selectionMode="multiple"
									size="sm"
									onSelectionChange={(selection) => {
										const values = selectionToKnownValues(
											selection,
											availableGuestMapByKey,
											compareGuestMaps
										);
										if (values !== null) {
											specialGuestPlansStore.setMaps(
												values
											);
										}
									}}
									popoverProps={selectPopoverProps}
									classNames={selectClassNames}
								>
									{({ name, value }) => (
										<SelectItem
											key={value}
											textValue={name}
										>
											{name}
										</SelectItem>
									)}
								</Select>
								<Select
									disableAnimation={isReducedMotion}
									isVirtualized={false}
									items={availableSpecialGuests}
									label="额外包含"
									selectedKeys={activePlanIncludeKeys}
									selectionMode="multiple"
									size="sm"
									onSelectionChange={(selection) => {
										const values = selectionToKnownValues(
											selection,
											availableSpecialGuestByKey,
											compareSpecialGuests
										);
										if (values !== null) {
											specialGuestPlansStore.setIncludes(
												values
											);
										}
									}}
									popoverProps={selectPopoverProps}
									classNames={selectClassNames}
								>
									{renderSpecialGuestSelectItem}
								</Select>
								<Select
									disableAnimation={isReducedMotion}
									isVirtualized={false}
									items={availableSpecialGuests}
									label="额外排除"
									selectedKeys={activePlanExcludeKeys}
									selectionMode="multiple"
									size="sm"
									onSelectionChange={(selection) => {
										const values = selectionToKnownValues(
											selection,
											availableSpecialGuestByKey,
											compareSpecialGuests
										);
										if (values !== null) {
											specialGuestPlansStore.setExcludes(
												values
											);
										}
									}}
									popoverProps={selectPopoverProps}
									classNames={selectClassNames}
								>
									{renderSpecialGuestSelectItem}
								</Select>
							</div>
						</motion.div>
						<Select
							disableAnimation={isReducedMotion}
							disallowEmptySelection
							items={SPECIAL_GUEST_PLAN_GUEST_SORT_OPTIONS}
							label="稀客排序"
							selectedKeys={activePlanGuestSortKeys}
							selectionMode="single"
							size="sm"
							onSelectionChange={handleGuestSortChange}
							popoverProps={selectPopoverProps}
							classNames={selectClassNames}
						>
							{({ label, value }) => (
								<SelectItem key={value}>{label}</SelectItem>
							)}
						</Select>
					</div>
				</motion.div>
			</motion.div>
		</aside>
	);
}
