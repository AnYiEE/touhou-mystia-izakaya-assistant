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
import { useMotionProps } from '@/design/ui/hooks/useMotionProps';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import type { TCustomerRareName } from '@/domain/data/customers/rare/types';
import type { TPlace } from '@/domain/data/places/types';

import { customerPlanCatalogPort } from '@/features/catalog/customers/rare/client/state/customerPlanCatalogPort';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import {
	checkCustomerRarePlansStateVirtual,
	getDisplayedCustomerRarePlan,
	normalizeCustomerRarePlanName,
} from '@/features/customerPlans/client/state/planState';
import { customerPlansStore } from '@/features/customerPlans/client/state/store';
import type {
	TCustomerRarePlanCustomerSort,
	TCustomerRarePlanMealSource,
	TCustomerRarePlanMode,
} from '@/features/customerPlans/contracts';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import CustomerRarePlanSummaryText from './CustomerRarePlanSummaryText';
import {
	guardCustomerGroupToggleDuringControlsAnimation,
	selectionToValues,
} from './dom';
import { getDrawerControlsClassName } from './layout';

const CUSTOMER_RARE_PLAN_CUSTOMER_SORT_OPTIONS = [
	{ label: '默认排序', value: 'default' },
	{ label: '拼音A-Z（按DLC分组）', value: 'pinyin-asc' },
	{ label: '拼音Z-A（按DLC分组）', value: 'pinyin-desc' },
	{ label: '拼音A-Z（不按DLC分组）', value: 'pinyin-asc-flat' },
	{ label: '拼音Z-A（不按DLC分组）', value: 'pinyin-desc-flat' },
] satisfies Array<{ label: string; value: TCustomerRarePlanCustomerSort }>;

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

export default function CustomerRarePlanControls({
	portalContainerProps,
}: {
	portalContainerProps: Pick<IPopoverProps, 'portalContainer'>;
}) {
	const manualModePanelRef = useRef<HTMLDivElement>(null);
	const regionModePanelRef = useRef<HTMLDivElement>(null);
	const selectMotionProps = useMotionProps('select');
	const isReducedMotion = useReducedMotion();
	const vibrate = useVibrate();
	const { isHighAppearance } = useDesignPreferences();
	const isControlsCollapsed =
		customerPlansStore.shared.drawer.isControlsCollapsed.use();
	const plans = customerPlansStore.persistence.plans.use();
	const activePlan = getDisplayedCustomerRarePlan(plans);
	const isVirtualPlans = checkCustomerRarePlansStateVirtual(plans);
	const availableCustomerNames =
		customerPlanCatalogPort.availableCustomerNames.use();
	const availableCustomerPlaces =
		customerPlanCatalogPort.availableCustomerPlaces.use();
	const [draftName, setDraftName] = useState(activePlan.name);
	const [isDeletePlanPopoverOpen, setIsDeletePlanPopoverOpen] =
		useState(false);
	const [isModePanelAnimating, setIsModePanelAnimating] = useState(false);
	const [modePanelHeight, setModePanelHeight] = useState<number | 'auto'>(
		'auto'
	);
	const normalizedDraftName = normalizeCustomerRarePlanName(draftName);
	const activePlanCustomerSort = activePlan.customerSort;
	const activePlanMealSource = activePlan.mealSource;
	const activePlanMode = activePlan.mode;
	const isRenameDisabled = normalizedDraftName === activePlan.name;

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
		activePlan.manualCustomers,
		activePlan.places,
		activePlanMode,
	]);

	const handlePlanSelect = useCallback(
		(selection: Selection) => {
			const [planId] = selectionToValues<string>(selection);
			if (
				isVirtualPlans ||
				planId === undefined ||
				activePlan.id === planId
			) {
				return;
			}

			vibrate();
			customerPlansStore.setActivePlan(planId);
		},
		[activePlan.id, isVirtualPlans, vibrate]
	);

	const handleCreatePlan = useCallback(() => {
		vibrate();
		customerPlansStore.createPlan();
	}, [vibrate]);

	const handleCopyPlan = useCallback(() => {
		if (isVirtualPlans) {
			return;
		}

		vibrate();
		customerPlansStore.copyPlan(activePlan.id);
	}, [activePlan, isVirtualPlans, vibrate]);

	const handleDeletePlan = useCallback(() => {
		if (isVirtualPlans) {
			return;
		}

		vibrate();
		customerPlansStore.deletePlan(activePlan.id);
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
		customerPlansStore.renamePlan(activePlan.id, normalizedDraftName);
	}, [activePlan, normalizedDraftName, vibrate]);

	const handleMealSourceChange = useCallback(
		(source: TCustomerRarePlanMealSource) => {
			if (activePlan.mealSource === source) {
				return;
			}

			vibrate();
			customerPlansStore.setMealSource(source);
		},
		[activePlan, vibrate]
	);

	const handleModeChange = useCallback(
		(mode: TCustomerRarePlanMode) => {
			if (activePlan.mode === mode) {
				return;
			}

			vibrate();
			customerPlansStore.setMode(mode);
		},
		[activePlan, vibrate]
	);
	const handleModePanelAnimationStart = useCallback(() => {
		setIsModePanelAnimating(!isReducedMotion);
	}, [isReducedMotion]);

	const handleModePanelAnimationComplete = useCallback(() => {
		setIsModePanelAnimating(false);
	}, []);

	const handleCustomerSortChange = useCallback(
		(selection: Selection) => {
			const [customerSort] =
				selectionToValues<TCustomerRarePlanCustomerSort>(selection);
			if (
				customerSort === undefined ||
				activePlan.customerSort === customerSort
			) {
				return;
			}

			customerPlansStore.setCustomerSort(customerSort);
		},
		[activePlan]
	);

	const handleToggleControls = useCallback(() => {
		guardCustomerGroupToggleDuringControlsAnimation();
		vibrate();
		customerPlansStore.toggleControlsCollapsed();
	}, [vibrate]);

	const planOptions = isVirtualPlans
		? [{ id: activePlan.id, name: activePlan.name }]
		: plans.items.map(({ id, name }) => ({ id, name }));

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
					animate={{
						height: isControlsCollapsed ? 0 : 'auto',
						opacity: isControlsCollapsed ? 0 : 1,
					}}
					initial={false}
					transition={{
						duration: isReducedMotion ? 0 : 0.2,
						ease: 'linear',
						type: 'tween',
					}}
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
								selectedKeys={[activePlan.id]}
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
										tabList: cn(
											'grid grid-cols-2 bg-default/40',
											{
												'backdrop-blur':
													isHighAppearance,
											}
										),
									}}
								>
									<Tab key="saved" title="已保存套餐" />
									<Tab key="recommended" title="自动推荐" />
								</Tabs>
							</div>
						</div>

						<Divider className="bg-divider" />

						<Tabs
							fullWidth
							disableAnimation={isReducedMotion}
							size="sm"
							selectedKey={activePlanMode}
							onSelectionChange={(key) => {
								handleModeChange(key as TCustomerRarePlanMode);
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
								tabList: cn('grid grid-cols-2 bg-default/40', {
									'backdrop-blur': isHighAppearance,
								}),
							}}
						>
							<Tab key="region" title="按地区" />
							<Tab key="manual" title="手动" />
						</Tabs>

						<motion.div
							animate={{ height: modePanelHeight }}
							initial={false}
							onAnimationComplete={
								handleModePanelAnimationComplete
							}
							onAnimationStart={handleModePanelAnimationStart}
							transition={{
								duration: isReducedMotion ? 0 : 0.18,
								ease: 'linear',
								type: 'tween',
							}}
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
									items={availableCustomerNames}
									label="手动选择稀客"
									selectedKeys={activePlan.manualCustomers}
									selectionMode="multiple"
									size="sm"
									onSelectionChange={(selection) => {
										customerPlansStore.setManualCustomers(
											selectionToValues<TCustomerRareName>(
												selection
											)
										);
									}}
									popoverProps={selectPopoverProps}
									classNames={selectClassNames}
								>
									{({ value }) =>
										renderCustomerSelectItem(value)
									}
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
									items={availableCustomerPlaces}
									label="出没地区"
									selectedKeys={activePlan.places}
									selectionMode="multiple"
									size="sm"
									onSelectionChange={(selection) => {
										customerPlansStore.setPlaces(
											selectionToValues<TPlace>(selection)
										);
									}}
									popoverProps={selectPopoverProps}
									classNames={selectClassNames}
								>
									{({ value }) => (
										<SelectItem key={value}>
											{value}
										</SelectItem>
									)}
								</Select>
								<Select
									disableAnimation={isReducedMotion}
									isVirtualized={false}
									items={availableCustomerNames}
									label="额外包含"
									selectedKeys={activePlan.includes}
									selectionMode="multiple"
									size="sm"
									onSelectionChange={(selection) => {
										customerPlansStore.setIncludes(
											selectionToValues<TCustomerRareName>(
												selection
											)
										);
									}}
									popoverProps={selectPopoverProps}
									classNames={selectClassNames}
								>
									{({ value }) =>
										renderCustomerSelectItem(value)
									}
								</Select>
								<Select
									disableAnimation={isReducedMotion}
									isVirtualized={false}
									items={availableCustomerNames}
									label="额外排除"
									selectedKeys={activePlan.excludes}
									selectionMode="multiple"
									size="sm"
									onSelectionChange={(selection) => {
										customerPlansStore.setExcludes(
											selectionToValues<TCustomerRareName>(
												selection
											)
										);
									}}
									popoverProps={selectPopoverProps}
									classNames={selectClassNames}
								>
									{({ value }) =>
										renderCustomerSelectItem(value)
									}
								</Select>
							</div>
						</motion.div>
						<Select
							disableAnimation={isReducedMotion}
							disallowEmptySelection
							items={CUSTOMER_RARE_PLAN_CUSTOMER_SORT_OPTIONS}
							label="稀客排序"
							selectedKeys={[activePlanCustomerSort]}
							selectionMode="single"
							size="sm"
							onSelectionChange={handleCustomerSortChange}
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
