'use client';

import {
	type PropsWithChildren,
	memo,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
import { motion } from 'framer-motion';

import { useReducedMotion } from '@/design/ui/hooks';
import { useVibrate } from '@/hooks';

import {
	FontAwesomeIcon,
	type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import {
	faChevronDown,
	faCloud,
	faCode,
	faLaptop,
	faTriangleExclamation,
	faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';

import { Button, FadeMotionDiv, Modal, cn } from '@/design/ui/components';

import { trackEvent } from '@/components/analytics';
import Heading from '@/components/heading';

import { DLC_LABEL_MAP } from '@/data';
import {
	type TSyncConflictResolution,
	resolveAccountSyncConflict,
} from '@/lib/account/client/conflict';
import { createSnapshotHash } from '@/lib/account/client/queue';
import {
	type ISyncConflictItem,
	type TSyncNamespace,
} from '@/lib/account/sync';
import { scheduleAccountSyncFlush } from '@/lib/account/client/syncClient';
import { getLogSafeErrorCode } from '@/lib/logging';
import { accountStore, globalStore } from '@/stores';

const CONFLICT_MODAL_MOTION_PROPS = {
	variants: {
		enter: {
			opacity: 1,
			scale: 1,
			transition: { duration: 0.16, ease: 'easeOut' },
		},
		exit: {
			opacity: 0,
			scale: 0.985,
			transition: { duration: 0.12, ease: 'easeIn' },
		},
		initial: { opacity: 0, scale: 0.985 },
	},
} as const;

const CONFLICT_COLLAPSE_MOTION_TRANSITION = {
	duration: 0.14,
	ease: 'easeInOut',
} as const;

interface IConflictCollapseProps {
	className?: string;
	isOpen: boolean;
	isReducedMotion: boolean;
	onAnimationComplete?: () => void;
	onUpdate?: () => void;
}

const ConflictCollapse = memo<PropsWithChildren<IConflictCollapseProps>>(
	function ConflictCollapse({
		children,
		className,
		isOpen,
		isReducedMotion,
		onAnimationComplete,
		onUpdate,
	}) {
		return (
			<motion.div
				animate={{
					gridTemplateRows: isOpen ? '1fr' : '0fr',
					opacity: isOpen ? 1 : 0,
				}}
				aria-hidden={!isOpen}
				className={cn('grid', className)}
				initial={false}
				inert={isOpen ? undefined : true}
				transition={
					isReducedMotion
						? { duration: 0 }
						: CONFLICT_COLLAPSE_MOTION_TRANSITION
				}
				{...(onAnimationComplete === undefined
					? {}
					: { onAnimationComplete })}
				{...(onUpdate === undefined ? {} : { onUpdate })}
			>
				<div className="min-h-0 overflow-hidden">{children}</div>
			</motion.div>
		);
	}
);

const SYNC_NAMESPACE_LABEL_MAP = {
	'customer_normal.meals': '已保存套餐（普客）',
	'customer_rare.meals': '已保存套餐（稀客）',
	'customer_rare.plans': '营业预设（稀客）',
	'customer_rare.settings': '偏好设置（稀客）',
	'global.preferences': '偏好设置（全局）',
	theme: '颜色模式',
	'tutorial.customer_rare': '稀客教程进度',
} as const satisfies Record<TSyncNamespace, string>;

const CONFLICT_FIELD_LABEL_MAP: Record<string, string> = {
	activeId: '当前使用的营业预设',
	columns: '表格显示列',
	completed: '稀客教程进度',
	customerCardTagsTooltip: '顾客卡片中标签的浮动提示',
	dlcs: '已关闭的数据集',
	enabled: '启用状态',
	famousShop: '“明星店”效果',
	hiddenItems: '启用或禁用的酒水、料理和食材',
	highAppearance: '平滑滚动和磨砂效果',
	items: '保存的营业预设',
	maxExtraIngredients: '加料上限',
	maxRating: '评级上限',
	maxResults: '推荐结果上限',
	orderLinkedFilter: '选择点单需求的同时筛选表格',
	popularTrend: '流行趋势',
	'popularTrend.isNegative': '流行趋势方向',
	'popularTrend.tag': '流行趋势标签',
	row: '表格显示行数',
	showTagDescription: '显示料理标签所对应的关键词',
	suggestMeals: '“猜您想要”推荐',
	'suggestMeals.maxExtraIngredients': '“猜您想要”的加料上限',
	'suggestMeals.maxRating': '“猜您想要”的评级上限',
	'suggestMeals.maxResults': '“猜您想要”的推荐结果上限',
	table: '表格设置',
	'table.columns.beverage': '酒水表格显示列',
	'table.columns.recipe': '料理表格显示列',
	'table.hiddenItems.beverages': '表格中隐藏的酒水',
	'table.hiddenItems.ingredients': '表格中隐藏的食材',
	'table.hiddenItems.recipes': '表格中隐藏的料理',
	tachie: '顾客页面右下角的立绘',
	theme: '颜色模式',
	vibrate: '震动反馈',
};

const CONFLICT_BOOLEAN_VALUE_LABEL_MAP: Record<
	string,
	readonly [string, string]
> = {
	completed: ['未完成', '已完成'],
	'popularTrend.isNegative': ['流行喜爱', '流行厌恶'],
};

const CONFLICT_VALUE_LABEL_MAP: Record<string, string> = {
	action: '操作',
	beverage: '酒水',
	cooker: '厨具',
	dark: '深色',
	ingredient: '食材',
	light: '浅色',
	price: '售价',
	recipe: '料理',
	suitability: '匹配度',
	system: '跟随系统',
	time: '烹饪时间',
};

const MAX_VISIBLE_DIFFERENCES = 6;

interface IConflictDifference {
	cloud: unknown;
	label: string;
	local: unknown;
	merged: unknown;
	path: string;
}

interface IConflictDifferenceResult {
	hasMore: boolean;
	items: IConflictDifference[];
}

function checkRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getConflictFieldLabel(path: string[]) {
	const fullPath = path.join('.');
	const fieldName = path.at(-1) ?? '';

	return (
		(CONFLICT_FIELD_LABEL_MAP[fullPath] ??
			CONFLICT_FIELD_LABEL_MAP[fieldName] ??
			fieldName) ||
		'设置内容'
	);
}

function getConflictDifferences(
	cloud: unknown,
	local: unknown,
	merged: unknown
): IConflictDifferenceResult {
	const items: IConflictDifference[] = [];
	let hasMore = false;

	const visit = (
		cloudValue: unknown,
		localValue: unknown,
		mergedValue: unknown,
		path: string[]
	) => {
		if (createSnapshotHash(cloudValue) === createSnapshotHash(localValue)) {
			return;
		}

		if (items.length >= MAX_VISIBLE_DIFFERENCES) {
			hasMore = true;
			return;
		}

		if (checkRecord(cloudValue) && checkRecord(localValue)) {
			const mergedRecord = checkRecord(mergedValue)
				? mergedValue
				: undefined;
			const keys = new Set([
				...Object.keys(cloudValue),
				...Object.keys(localValue),
			]);

			for (const key of keys) {
				visit(cloudValue[key], localValue[key], mergedRecord?.[key], [
					...path,
					key,
				]);
				if (hasMore) {
					break;
				}
			}
			return;
		}

		items.push({
			cloud: cloudValue,
			label: getConflictFieldLabel(path),
			local: localValue,
			merged: mergedValue,
			path: path.join('.'),
		});
	};

	visit(cloud, local, merged, []);

	return { hasMore, items };
}

function formatFriendlyConflictValue(value: unknown, path?: string): string {
	if (typeof value === 'boolean') {
		const labels =
			path === undefined
				? undefined
				: CONFLICT_BOOLEAN_VALUE_LABEL_MAP[path];
		if (labels !== undefined) {
			return labels[value ? 1 : 0];
		}

		return value ? '开启' : '关闭';
	}
	if (typeof value === 'string') {
		return CONFLICT_VALUE_LABEL_MAP[value] ?? value;
	}
	if (typeof value === 'number') {
		return String(value);
	}
	if (value === null || value === undefined) {
		return '未设置';
	}
	if (Array.isArray(value)) {
		if (value.length === 0) {
			return '无';
		}

		const preview: string = value
			.slice(0, 3)
			.map((item) => {
				if (path === 'hiddenItems.dlcs' && typeof item === 'string') {
					const dlc = Number(item) as keyof typeof DLC_LABEL_MAP;
					if (Object.hasOwn(DLC_LABEL_MAP, dlc)) {
						return DLC_LABEL_MAP[dlc].label;
					}
				}

				return formatFriendlyConflictValue(item);
			})
			.join('、');

		return value.length > 3 ? `${preview}等${value.length}项` : preview;
	}
	if (checkRecord(value)) {
		return `包含${Object.keys(value).length}项设置`;
	}

	return '无法显示';
}

function formatConflictData(data: unknown) {
	try {
		return JSON.stringify(data, null, 2);
	} catch {
		return String(data);
	}
}

interface IConflictPreviewProps {
	label: string;
	value: unknown;
}

const ConflictPreview = memo<IConflictPreviewProps>(function ConflictPreview({
	label,
	value,
}) {
	return (
		<div className="space-y-1">
			<p className="text-small font-medium text-foreground-600">
				{label}
			</p>
			<pre className="max-h-72 overflow-auto rounded-small border border-default-200/70 bg-default-100/70 p-3 text-xs leading-5 text-foreground-700 dark:bg-default-50/10">
				{formatConflictData(value)}
			</pre>
		</div>
	);
});

interface IConflictVersionCardProps {
	buttonLabel: string;
	description: string;
	differences: IConflictDifferenceResult;
	icon: FontAwesomeIconProps['icon'];
	isDisabled: boolean;
	isHighAppearance: boolean;
	isLoading: boolean;
	title: string;
	valueKey: 'cloud' | 'local';
	onSelect: () => void;
}

const ConflictVersionCard = memo<IConflictVersionCardProps>(
	function ConflictVersionCard({
		buttonLabel,
		description,
		differences,
		icon,
		isDisabled,
		isHighAppearance,
		isLoading,
		onSelect,
		title,
		valueKey,
	}) {
		return (
			<div
				className={cn(
					'flex min-w-0 flex-col gap-4 rounded-medium border border-default-200/70 p-4 shadow-small',
					isHighAppearance
						? 'bg-content1/40 backdrop-blur'
						: 'bg-content1 dark:bg-content1/70'
				)}
			>
				<div className="flex items-center gap-3">
					<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary-600 dark:text-primary">
						<FontAwesomeIcon
							icon={icon}
							className="mx-auto block !h-4 !w-4"
						/>
					</div>
					<div className="min-w-0">
						<h3 className="font-medium text-foreground-700">
							{title}
						</h3>
						<p className="mt-1 text-small leading-5 text-foreground-500">
							{description}
						</p>
					</div>
				</div>

				<div
					className={cn(
						'flex-1 divide-y divide-default-200/70 overflow-hidden rounded-small border border-default-200/70',
						isHighAppearance
							? 'bg-background/35 dark:bg-default-50/5'
							: 'bg-default-50/60 dark:bg-default-50/10'
					)}
				>
					{differences.items.length === 0 ? (
						<p className="px-3 py-4 text-small text-foreground-500">
							未检测到可展示的差异
						</p>
					) : (
						differences.items.map((difference, index) => (
							<div
								key={`${difference.label}-${index}`}
								className="grid grid-cols-[minmax(0,1fr)_minmax(6rem,auto)] items-center gap-4 px-3 py-2.5 text-small"
							>
								<span className="min-w-0 text-foreground-500">
									{difference.label}
								</span>
								<span className="break-words text-right font-medium text-foreground-700">
									{formatFriendlyConflictValue(
										difference[valueKey],
										difference.path
									)}
								</span>
							</div>
						))
					)}
					{differences.hasMore && (
						<p className="px-3 py-2 text-tiny text-foreground-500">
							还有更多差异，可在技术详情中查看
						</p>
					)}
				</div>

				<Button
					fullWidth
					color="primary"
					isDisabled={isDisabled}
					isLoading={isLoading}
					variant="flat"
					onPress={onSelect}
				>
					{buttonLabel}
				</Button>
			</div>
		);
	}
);

function checkConflictSnapshotUnchanged(
	currentConflict: ISyncConflictItem,
	conflict: ISyncConflictItem
) {
	return (
		currentConflict.userId === conflict.userId &&
		currentConflict.namespace === conflict.namespace &&
		currentConflict.revision === conflict.revision &&
		createSnapshotHash(currentConflict.cloud) ===
			createSnapshotHash(conflict.cloud) &&
		createSnapshotHash(currentConflict.local) ===
			createSnapshotHash(conflict.local) &&
		createSnapshotHash(currentConflict.merged) ===
			createSnapshotHash(conflict.merged)
	);
}

function createConflictSnapshotKey(conflict: ISyncConflictItem) {
	return JSON.stringify([
		conflict.userId,
		conflict.namespace,
		conflict.revision,
		createSnapshotHash(conflict.cloud),
		createSnapshotHash(conflict.local),
		createSnapshotHash(conflict.merged),
	]);
}

const CONFLICT_RESOLUTION_TRACK_NAME_MAP = {
	cloud: 'Use Cloud',
	local: 'Use Local',
	merged: 'Use Merged',
} as const satisfies Record<TSyncConflictResolution, string>;

interface IProps {}

export default memo<IProps>(function AccountConflictModal() {
	const isReducedMotion = useReducedMotion();
	const vibrate = useVibrate();

	const isHighAppearance = globalStore.persistence.highAppearance.use();
	const conflicts = accountStore.shared.sync.conflicts.use();
	const passwordMustChange = accountStore.shared.passwordMustChange.use();
	const user = accountStore.shared.user.use();

	const [resolvingResolution, setResolvingResolution] =
		useState<TSyncConflictResolution | null>(null);
	const [resolvedConflictKeys, setResolvedConflictKeys] = useState<
		ReadonlySet<string>
	>(() => new Set());
	const [displayedConflict, setDisplayedConflict] =
		useState<ISyncConflictItem | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [pendingResolution, setPendingResolution] =
		useState<TSyncConflictResolution | null>(null);
	const [isTechnicalDetailsOpen, setIsTechnicalDetailsOpen] = useState(false);

	const isResolvingRef = useRef(false);
	const technicalDetailsRef = useRef<HTMLDivElement>(null);

	const conflict = conflicts.find(
		(item) =>
			item.userId === user?.id &&
			!resolvedConflictKeys.has(createConflictSnapshotKey(item))
	);
	const isModalOpen =
		conflict !== undefined && user !== null && !passwordMustChange;
	const visibleConflict = conflict ?? displayedConflict;
	const visibleConflictKey =
		visibleConflict === null
			? null
			: createConflictSnapshotKey(visibleConflict);

	useEffect(() => {
		setResolvedConflictKeys(new Set());
	}, [user?.id]);

	useEffect(() => {
		if (isModalOpen) {
			setDisplayedConflict(conflict);
		}
	}, [conflict, isModalOpen]);

	useEffect(() => {
		setResolvedConflictKeys((currentKeys) => {
			if (currentKeys.size === 0) {
				return currentKeys;
			}

			const activeKeys = new Set(
				conflicts.map(createConflictSnapshotKey)
			);
			const nextKeys = new Set<string>();
			let didChange = false;

			for (const key of currentKeys) {
				if (activeKeys.has(key)) {
					nextKeys.add(key);
				} else {
					didChange = true;
				}
			}

			return didChange ? nextKeys : currentKeys;
		});
	}, [conflicts]);

	useEffect(() => {
		isResolvingRef.current = false;
		setResolvingResolution(null);
		setMessage(null);
		setPendingResolution(null);
		setIsTechnicalDetailsOpen(false);
	}, [conflict]);

	useEffect(() => {
		if (isModalOpen && visibleConflictKey !== null) {
			trackEvent(trackEvent.category.show, 'Modal', 'Account Conflict');
		}
	}, [isModalOpen, visibleConflictKey]);

	const resolveConflict = useCallback(
		(resolution: TSyncConflictResolution) => {
			if (
				isResolvingRef.current ||
				conflict === undefined ||
				user === null
			) {
				return;
			}

			vibrate();

			trackEvent(
				trackEvent.category.click,
				'Account Conflict Button',
				CONFLICT_RESOLUTION_TRACK_NAME_MAP[resolution]
			);

			isResolvingRef.current = true;
			setResolvingResolution(resolution);
			setMessage(null);

			try {
				const conflictKey = createConflictSnapshotKey(conflict);
				const currentConflict = accountStore.shared.sync.conflicts
					.get()
					.find(
						(item) =>
							createConflictSnapshotKey(item) === conflictKey
					);

				if (
					currentConflict === undefined ||
					!checkConflictSnapshotUnchanged(currentConflict, conflict)
				) {
					setMessage('冲突状态已变化，请重新选择');
					return;
				}

				const didResolve = resolveAccountSyncConflict({
					conflict: currentConflict,
					resolution,
					userId: user.id,
				});

				if (!didResolve) {
					setMessage('冲突暂时无法保存，请稍后重试');
					return;
				}

				setResolvedConflictKeys((currentKeys) => {
					if (currentKeys.has(conflictKey)) {
						return currentKeys;
					}

					const nextKeys = new Set(currentKeys);
					nextKeys.add(conflictKey);

					return nextKeys;
				});

				scheduleAccountSyncFlush();
			} catch (error) {
				console.error('Failed to resolve conflict.', {
					errorCode: getLogSafeErrorCode(error),
				});
				setMessage('冲突保存失败，请稍后重试');
			} finally {
				isResolvingRef.current = false;
				setResolvingResolution(null);
			}
		},
		[conflict, user, vibrate]
	);

	const handleUseCloud = useCallback(() => {
		setMessage(null);
		setPendingResolution('cloud');
	}, []);

	const handleUseLocal = useCallback(() => {
		setMessage(null);
		setPendingResolution('local');
	}, []);

	const handleUseMerged = useCallback(() => {
		resolveConflict('merged');
	}, [resolveConflict]);

	const handleCancelResolution = useCallback(() => {
		setPendingResolution(null);
	}, []);

	const handleConfirmResolution = useCallback(() => {
		if (pendingResolution === null) {
			return;
		}

		resolveConflict(pendingResolution);
	}, [pendingResolution, resolveConflict]);

	const handleToggleTechnicalDetails = useCallback(() => {
		setIsTechnicalDetailsOpen((isOpen) => !isOpen);
	}, []);

	const scrollTechnicalDetailsToBottom = useCallback(() => {
		const scrollElement =
			technicalDetailsRef.current?.closest<HTMLElement>(
				'[data-scroll-mask]'
			);

		if (scrollElement !== null && scrollElement !== undefined) {
			scrollElement.scrollTop = scrollElement.scrollHeight;
		}
	}, []);

	const handleTechnicalDetailsAnimationUpdate = useCallback(() => {
		if (isTechnicalDetailsOpen) {
			scrollTechnicalDetailsToBottom();
		}
	}, [isTechnicalDetailsOpen, scrollTechnicalDetailsToBottom]);

	const handleTechnicalDetailsAnimationComplete = useCallback(() => {
		if (!isTechnicalDetailsOpen) {
			return;
		}

		requestAnimationFrame(scrollTechnicalDetailsToBottom);
	}, [isTechnicalDetailsOpen, scrollTechnicalDetailsToBottom]);

	if (visibleConflict === null) {
		return null;
	}

	const differences = getConflictDifferences(
		visibleConflict.cloud,
		visibleConflict.local,
		visibleConflict.merged
	);
	const namespaceLabel = SYNC_NAMESPACE_LABEL_MAP[visibleConflict.namespace];
	const unresolvedConflictCount = conflicts.filter(
		(item) =>
			item.userId === user?.id &&
			!resolvedConflictKeys.has(createConflictSnapshotKey(item))
	).length;
	const isResolving = resolvingResolution !== null;
	const canUseMergedResult = visibleConflict.merged !== null;
	const confirmationText =
		pendingResolution === 'cloud'
			? `保留云端版本后，当前设备上的${namespaceLabel}修改将被替换。`
			: `保留当前设备版本后，它会上传到云端并替换云端的${namespaceLabel}修改。`;
	const technicalDetailsContent = (
		<div className="grid gap-4 border-t border-default-200/70 p-4 lg:grid-cols-3">
			<ConflictPreview
				label="云端原始数据"
				value={visibleConflict.cloud}
			/>
			<ConflictPreview
				label="当前设备原始数据"
				value={visibleConflict.local}
			/>
			<ConflictPreview
				label="合并后的原始数据"
				value={visibleConflict.merged ?? '无法自动合并'}
			/>
		</div>
	);

	return (
		<Modal
			coordination={{ id: 'account.sync-conflict' }}
			hideCloseButton
			isDismissable={false}
			isKeyboardDismissDisabled
			isOpen={isModalOpen}
			motionProps={CONFLICT_MODAL_MOTION_PROPS}
			scrollMode="mask"
			size="5xl"
		>
			<FadeMotionDiv
				className="w-full space-y-4"
				target={visibleConflictKey ?? visibleConflict.namespace}
			>
				<div className="flex items-start justify-between gap-4">
					<div className="min-w-0">
						<Heading
							as="h2"
							classNames={{ subTitle: 'mb-0' }}
							isFirst
							subTitle={`当前设备和云端都修改过“${namespaceLabel}”，请选择要保留的内容。`}
						>
							云同步冲突
						</Heading>
					</div>
					<span className="shrink-0 rounded-full bg-warning/15 px-2.5 py-1 text-tiny font-medium text-warning-700 dark:text-warning-600">
						{unresolvedConflictCount}项待处理
					</span>
				</div>
				<div
					className={cn(
						'flex items-start gap-3 rounded-medium border border-warning/30 bg-warning/10 px-4 py-3 text-small leading-6 text-warning-800 dark:text-warning-500',
						isHighAppearance && 'backdrop-blur'
					)}
				>
					<FontAwesomeIcon
						icon={faTriangleExclamation}
						className="mt-1 w-4 shrink-0"
					/>
					<p>
						这部分数据的同步已暂停。完成选择前，两份数据都会保留，不会自动覆盖。
					</p>
				</div>

				{canUseMergedResult ? (
					<div
						className={cn(
							'flex flex-col gap-4 rounded-medium border border-primary/30 bg-primary/10 p-4 shadow-small',
							isHighAppearance && 'backdrop-blur'
						)}
					>
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex min-w-0 items-center gap-3">
								<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary-600 dark:text-primary">
									<FontAwesomeIcon
										icon={faWandMagicSparkles}
										className="mx-auto block !h-4 !w-4"
									/>
								</div>
								<div>
									<div className="flex flex-wrap items-center gap-2">
										<h3 className="font-medium text-foreground-700">
											合并双方的修改
										</h3>
										<span className="rounded-full bg-primary/20 px-2 py-0.5 text-tiny font-medium text-primary-700 dark:text-primary">
											推荐
										</span>
									</div>
									<p className="mt-1 text-small leading-5 text-foreground-600">
										系统已经整理出一份合并结果，可同时保留双方能够兼容的修改。
									</p>
								</div>
							</div>
							<Button
								className="w-full sm:w-auto"
								color="primary"
								isDisabled={isResolving}
								isLoading={resolvingResolution === 'merged'}
								variant="solid"
								onPress={handleUseMerged}
							>
								使用此合并结果
							</Button>
						</div>
						<div className="rounded-small border border-primary/20 bg-background/25 px-3 py-2.5 dark:bg-content1/20">
							<p className="text-tiny font-medium text-foreground-500">
								合并后将保留
							</p>
							<div className="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-2">
								{differences.items.map((difference, index) => (
									<div
										key={`${difference.label}-${index}`}
										className="grid grid-cols-[minmax(0,1fr)_minmax(4rem,auto)] items-center gap-3 text-small"
									>
										<span className="min-w-0 text-foreground-500">
											{difference.label}
										</span>
										<span className="break-words text-right font-medium text-foreground-700">
											{formatFriendlyConflictValue(
												difference.merged,
												difference.path
											)}
										</span>
									</div>
								))}
							</div>
							{differences.hasMore && (
								<p className="mt-2 text-tiny text-foreground-500">
									还有更多合并内容，可在技术详情中查看
								</p>
							)}
						</div>
					</div>
				) : (
					<div
						className={cn(
							'rounded-medium border border-default-200/70 px-4 py-3 text-small leading-6 text-foreground-600',
							isHighAppearance
								? 'bg-content1/40 backdrop-blur'
								: 'bg-content1 dark:bg-content1/70'
						)}
					>
						这两份修改无法安全地自动合并，请比较下方差异后选择其中一个版本。
					</div>
				)}

				<section className="space-y-3">
					<div>
						<h3 className="font-medium text-foreground-700">
							比较两个版本
						</h3>
						<p className="mt-1 text-small text-foreground-500">
							这里只展示有差异的内容，选择后另一份修改会被替换。
						</p>
					</div>
					<div className="grid gap-4 md:grid-cols-2">
						<ConflictVersionCard
							buttonLabel="保留云端版本"
							description="来自账号云端的数据，将覆盖当前设备上的对应修改。"
							differences={differences}
							icon={faCloud}
							isDisabled={isResolving}
							isHighAppearance={isHighAppearance}
							isLoading={resolvingResolution === 'cloud'}
							title="云端版本"
							valueKey="cloud"
							onSelect={handleUseCloud}
						/>
						<ConflictVersionCard
							buttonLabel="保留当前设备版本"
							description="当前浏览器中尚未同步的数据，将上传并覆盖云端修改。"
							differences={differences}
							icon={faLaptop}
							isDisabled={isResolving}
							isHighAppearance={isHighAppearance}
							isLoading={resolvingResolution === 'local'}
							title="当前设备版本"
							valueKey="local"
							onSelect={handleUseLocal}
						/>
					</div>
				</section>

				<ConflictCollapse
					className="!mt-0"
					isOpen={pendingResolution !== null}
					isReducedMotion={isReducedMotion}
				>
					<div className="pt-4">
						<div
							aria-live="polite"
							className={cn(
								'flex flex-col gap-3 rounded-medium border border-warning/40 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between',
								isHighAppearance && 'backdrop-blur'
							)}
						>
							<div className="min-w-0">
								<p className="font-medium text-warning-800 dark:text-warning-500">
									确认覆盖另一份修改？
								</p>
								<p className="mt-1 text-small leading-5 text-foreground-600">
									{confirmationText}
								</p>
							</div>
							<div className="flex shrink-0 justify-end gap-2">
								<Button
									className="data-[hover=true]:backdrop-blur-none data-[pressed=true]:backdrop-blur-none"
									isDisabled={isResolving}
									variant="light"
									onPress={handleCancelResolution}
								>
									取消
								</Button>
								<Button
									className="bg-opacity-100 backdrop-blur-none"
									color="warning"
									isDisabled={isResolving}
									isLoading={
										pendingResolution !== null &&
										resolvingResolution ===
											pendingResolution
									}
									variant="solid"
									onPress={handleConfirmResolution}
								>
									确认保留
								</Button>
							</div>
						</div>
					</div>
				</ConflictCollapse>

				<ConflictCollapse
					className="!mt-0"
					isOpen={message !== null}
					isReducedMotion={isReducedMotion}
				>
					<div className="pt-4">
						<p
							aria-live="assertive"
							className="rounded-small bg-danger/10 px-3 py-2 text-small text-danger-700 dark:text-danger"
							role="alert"
						>
							{message}
						</p>
					</div>
				</ConflictCollapse>

				<div
					ref={technicalDetailsRef}
					className={cn(
						'group scroll-m-4 overflow-hidden rounded-medium border border-default-200/70',
						isHighAppearance
							? 'bg-content1/40 backdrop-blur'
							: 'bg-content1 dark:bg-content1/70'
					)}
				>
					<button
						aria-expanded={isTechnicalDetailsOpen}
						className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left text-small font-medium text-foreground-600 transition-background hover:bg-default-100/60 motion-reduce:transition-none"
						type="button"
						onClick={handleToggleTechnicalDetails}
					>
						<span className="flex items-center gap-2">
							<FontAwesomeIcon icon={faCode} className="w-4" />
							查看技术详情
						</span>
						<FontAwesomeIcon
							icon={faChevronDown}
							className={cn(
								'w-3.5 transition-transform motion-reduce:transition-none',
								isTechnicalDetailsOpen && 'rotate-180'
							)}
						/>
					</button>
					<ConflictCollapse
						isOpen={isTechnicalDetailsOpen}
						isReducedMotion={isReducedMotion}
						onAnimationComplete={
							handleTechnicalDetailsAnimationComplete
						}
						onUpdate={handleTechnicalDetailsAnimationUpdate}
					>
						{technicalDetailsContent}
					</ConflictCollapse>
				</div>
			</FadeMotionDiv>
		</Modal>
	);
});
