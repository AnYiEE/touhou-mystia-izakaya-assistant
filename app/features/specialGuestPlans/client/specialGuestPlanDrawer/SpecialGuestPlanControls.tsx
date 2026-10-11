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
import { MOTION_DURATION_S, MOTION_EASE } from '@/design/ui/motion';

import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TMapLabel } from '@/domain/data/places/types';
import { compareMapCanonicalOrder } from '@/domain/places/mapOrdering';
import { getRecommendationSortProfileLabel } from '@/domain/recommendations/localizedLabels';
import {
	RECOMMENDATION_SORT_PROFILES,
	type TRecommendationSortProfile,
} from '@/domain/recommendations/sortProfiles';

import { specialGuestPlanCatalogPort } from '@/features/catalog/guests/special/client/state/specialGuestPlanCatalogPort';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import { recommendationPreferencesFacade } from '@/features/preferences/client/recommendationPreferencesFacade';
import { useVibrate } from '@/features/preferences/client/useVibrate';
import {
	type TSpecialGuestPlansMessageKey,
	specialGuestPlansMessages,
} from '@/features/specialGuestPlans/client/messages';
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

import { useI18n } from '@/shared/i18n/useI18n';

import { guardGuestGroupToggleDuringControlsAnimation } from './dom';
import { getDrawerControlsClassName } from './drawerLayout';
import { createPlanSelectionComparator } from './selectionOrdering';
import SpecialGuestPlanSummaryText from './SpecialGuestPlanSummaryText';

const SPECIAL_GUEST_PLAN_GUEST_SORT_OPTIONS = [
	{ labelKey: 'plans.sort.default', value: 'default' },
	{ labelKey: 'plans.sort.pinyinAscGrouped', value: 'pinyin-asc' },
	{ labelKey: 'plans.sort.pinyinDescGrouped', value: 'pinyin-desc' },
	{ labelKey: 'plans.sort.pinyinAscFlat', value: 'pinyin-asc-flat' },
	{ labelKey: 'plans.sort.pinyinDescFlat', value: 'pinyin-desc-flat' },
] satisfies Array<{
	labelKey: TSpecialGuestPlansMessageKey;
	value: TSpecialGuestPlanGuestSort;
}>;

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
	{
		labelKey:
			'plans.sort.followSettings' as TSpecialGuestPlansMessageKey | null,
		value: FOLLOW_SETTINGS_SORT_PROFILE_KEY,
	},
	...RECOMMENDATION_SORT_PROFILES.map((value) => ({
		labelKey: null as TSpecialGuestPlansMessageKey | null,
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
	const { t } = useI18n(specialGuestPlansMessages);
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
	const canonicalAvailableGuestMaps = useMemo(
		() =>
			[...availableGuestMaps].sort((left, right) =>
				compareMapCanonicalOrder(left.value, right.value)
			),
		[availableGuestMaps]
	);
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
	const activePlanMapKeys = useMemo(
		() =>
			toSelectionKeySet(
				[...activePlan.maps].sort(compareMapCanonicalOrder)
			),
		[activePlan.maps]
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
			duration: isReducedMotion ? 0 : MOTION_DURATION_S.base,
			ease: MOTION_EASE.linear,
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
			duration: isReducedMotion ? 0 : MOTION_DURATION_S.base,
			ease: MOTION_EASE.linear,
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
							{isControlsCollapsed
								? activePlan.name
								: t('plans.controls.planManagement')}
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
								t('plans.controls.scopeTooltip')
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
								? t('plans.controls.expand')
								: t('plans.controls.collapse')
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
								label={t('plans.controls.currentPlan')}
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
									aria-label={t('plans.controls.newAria')}
									className={cn('w-full min-w-0 px-0', {
										'backdrop-blur': isHighAppearance,
									})}
									onPress={handleCreatePlan}
									startContent={
										<FontAwesomeIcon icon={faPlus} />
									}
								>
									{t('plans.controls.new')}
								</Button>
								<Button
									size="sm"
									variant="flat"
									aria-label={t('plans.controls.copyAria')}
									className={cn('w-full min-w-0 px-0', {
										'backdrop-blur': isHighAppearance,
									})}
									isDisabled={isVirtualPlans}
									onPress={handleCopyPlan}
									startContent={
										<FontAwesomeIcon icon={faCopy} />
									}
								>
									{t('plans.controls.copy')}
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
											aria-label={t(
												'plans.controls.deleteAria'
											)}
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
											{t('plans.controls.delete')}
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
											{t('plans.controls.confirmDelete')}
										</Button>
										<Button
											fullWidth
											color="primary"
											size="sm"
											variant="ghost"
											onPress={handleCancelDeletePlan}
										>
											{t('plans.controls.cancelDelete')}
										</Button>
									</PopoverContent>
								</Popover>
								<Button
									color="primary"
									size="sm"
									variant="flat"
									aria-label={t(
										'plans.controls.saveNameAria'
									)}
									className={cn('w-full min-w-0 px-0', {
										'backdrop-blur': isHighAppearance,
									})}
									isDisabled={isRenameDisabled}
									onPress={handleRenamePlan}
									startContent={
										<FontAwesomeIcon icon={faCheck} />
									}
								>
									{t('plans.controls.save')}
								</Button>
							</div>
							<Input
								label={t('plans.controls.nameLabel')}
								size="sm"
								value={draftName}
								onValueChange={setDraftName}
							/>
							<div className="space-y-1.5">
								<p className="px-1 text-tiny font-medium text-foreground-500">
									{t('plans.controls.sourceLabel')}
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
									<Tab
										key="saved"
										title={t('plans.controls.savedTab')}
									/>
									<Tab
										key="recommended"
										title={t('plans.recommended.automatic')}
									/>
								</Tabs>
								{activePlanMealSource === 'recommended' && (
									<Select
										disallowEmptySelection
										disableAnimation={isReducedMotion}
										isVirtualized={false}
										items={
											SPECIAL_GUEST_PLAN_SORT_PROFILE_OPTIONS
										}
										label={t(
											'plans.controls.strategyLabel'
										)}
										selectedKeys={
											recommendationSortProfileKeys
										}
										selectionMode="single"
										size="sm"
										onSelectionChange={
											handleRecommendationSortProfileChange
										}
										aria-label={t(
											'plans.controls.strategyAria'
										)}
										title={t(
											'plans.controls.strategyTitle',
											{
												profile:
													getRecommendationSortProfileLabel(
														effectiveRecommendationSortProfile
													),
											}
										)}
										popoverProps={selectPopoverProps}
										classNames={selectClassNames}
									>
										{({ labelKey, value }) => {
											const label =
												labelKey === null
													? getRecommendationSortProfileLabel(
															value as TRecommendationSortProfile
														)
													: t(labelKey);
											return (
												<SelectItem
													key={value}
													textValue={label}
												>
													{label}
												</SelectItem>
											);
										}}
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
							<Tab
								key="region"
								title={t('plans.controls.regionTab')}
							/>
							<Tab
								key="manual"
								title={t('plans.controls.manualTab')}
							/>
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
									'transition-opacity duration-100 ease-linear motion-reduce:transition-none',
									activePlanMode === 'manual'
										? 'relative z-10 opacity-100'
										: 'pointer-events-none absolute inset-x-0 top-0 z-0 opacity-0'
								)}
							>
								<Select
									disableAnimation={isReducedMotion}
									isVirtualized={false}
									items={availableSpecialGuests}
									label={t(
										'plans.controls.manualGuestsLabel'
									)}
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
									'space-y-3 transition-opacity duration-100 ease-linear motion-reduce:transition-none',
									activePlanMode === 'region'
										? 'relative z-10 opacity-100'
										: 'pointer-events-none absolute inset-x-0 top-0 z-0 opacity-0'
								)}
							>
								<Select
									disableAnimation={isReducedMotion}
									isVirtualized={false}
									items={canonicalAvailableGuestMaps}
									label={t('plans.controls.placesLabel')}
									selectedKeys={activePlanMapKeys}
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
									label={t('plans.controls.includesLabel')}
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
									label={t('plans.controls.excludesLabel')}
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
							label={t('plans.controls.guestSortLabel')}
							selectedKeys={activePlanGuestSortKeys}
							selectionMode="single"
							size="sm"
							onSelectionChange={handleGuestSortChange}
							popoverProps={selectPopoverProps}
							classNames={selectClassNames}
						>
							{({ labelKey, value }) => (
								<SelectItem key={value}>
									{t(labelKey)}
								</SelectItem>
							)}
						</Select>
					</div>
				</motion.div>
			</motion.div>
		</aside>
	);
}
