'use client';

import {
	type ComponentProps,
	type Key,
	type PropsWithChildren,
	type SyntheticEvent,
	memo,
} from 'react';

import {
	faChevronDown,
	faClipboard,
	faFilter,
	faRotate,
} from '@fortawesome/free-solid-svg-icons';
import {
	FontAwesomeIcon,
	type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';

import {
	Button,
	Card,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	type IButtonProps,
	Input,
	Link,
	Popover,
	PopoverContent,
	PopoverTrigger,
	cn,
} from '@/design/ui/components';

import Placeholder from '@/components/placeholder';

import {
	type IAccountUserProfile,
	type TUserStatus,
} from '@/lib/account/shared/types';
import type {
	TAnnouncementComputedStatus,
	TAnnouncementLevel,
} from '@/lib/announcements/shared/types';
import { globalStore as store } from '@/stores';

const STATUS_META_MAP = {
	active: { label: '正常', tone: 'success' },
	deleted: { label: '已删除', tone: 'danger' },
	disabled: { label: '已禁用', tone: 'warning' },
} as const satisfies Record<
	TUserStatus,
	{ label: string; tone: TAdminBadgeTone }
>;

const ANNOUNCEMENT_STATUS_META_MAP = {
	active: { label: '展示中', tone: 'success' },
	archived: { label: '已归档', tone: 'default' },
	disabled: { label: '已停用', tone: 'warning' },
	ended: { label: '已结束', tone: 'default' },
	scheduled: { label: '待开始', tone: 'primary' },
} as const satisfies Record<
	TAnnouncementComputedStatus,
	{ label: string; tone: TAdminBadgeTone }
>;

const ANNOUNCEMENT_LEVEL_META_MAP = {
	critical: { label: '重要', tone: 'primary' },
	danger: { label: '危险', tone: 'danger' },
	info: { label: '信息', tone: 'default' },
	success: { label: '成功', tone: 'success' },
	warning: { label: '警告', tone: 'warning' },
} as const satisfies Record<
	TAnnouncementLevel,
	{ label: string; tone: TAdminBadgeTone }
>;

const BADGE_TONE_CLASS_NAME_MAP = {
	danger: 'border-danger/30 bg-danger/15 text-danger-700 dark:text-danger-600',
	default: 'border-default-300 bg-default/30 text-foreground-500',
	primary:
		'border-primary/30 bg-primary/15 text-primary-700 dark:text-primary',
	success:
		'border-success/30 bg-success/15 text-success-700 dark:text-success',
	warning:
		'border-warning/30 bg-warning/20 text-warning-700 dark:text-warning-600',
} as const;

export const ADMIN_LIST_DEBOUNCE_MS = 300;

type TAdminBadgeTone = keyof typeof BADGE_TONE_CLASS_NAME_MAP;

export type { IAdminListLocationState } from './listState';
export {
	getAdminListHref,
	getAdminListPageFromSearchValue,
	getAdminListStatusFromSearchValue,
	getAdminUserDetailHref,
} from './listState';

interface IAdminShellProps extends PropsWithChildren<
	Pick<HTMLDivElementAttributes, 'className'>
> {}

export const AdminShell = memo<IAdminShellProps>(function AdminShell({
	children,
	className,
}) {
	return (
		<div
			className={cn(
				'min-h-main-content min-w-0 space-y-5 text-foreground',
				className
			)}
		>
			{children}
		</div>
	);
});

export function createAdminUserDisplayName(
	user: Pick<IAccountUserProfile, 'nickname' | 'username'>
) {
	return user.nickname === null
		? user.username
		: `${user.username}（${user.nickname}）`;
}

interface IAdminIconProps
	extends
		Pick<HTMLSpanElementAttributes, 'className'>,
		Pick<FontAwesomeIconProps, 'icon'> {}

export const AdminIcon = memo<IAdminIconProps>(function AdminIcon({
	className,
	icon,
}) {
	return (
		<span
			className={cn(
				'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-small border border-primary/20 bg-primary/15 text-primary-700 dark:text-primary',
				className
			)}
		>
			<FontAwesomeIcon icon={icon} className="w-4" />
		</span>
	);
});

interface IAdminHeaderProps {
	actions?: ReactNodeWithoutBoolean;
	icon: FontAwesomeIconProps['icon'];
	subtitle?: ReactNodeWithoutBoolean;
	title: ReactNodeWithoutBoolean;
}

export const AdminHeader = memo<IAdminHeaderProps>(function AdminHeader({
	actions,
	icon,
	subtitle,
	title,
}) {
	const hasSubtitle = subtitle !== undefined;
	const isHighAppearance = store.persistence.highAppearance.use();

	return (
		<Card
			as="header"
			fullWidth
			shadow="sm"
			classNames={{
				base: cn(
					'flex flex-col gap-3 space-y-0 p-4 lg:flex-row lg:items-center lg:justify-between',
					isHighAppearance
						? 'bg-content1/40 backdrop-blur'
						: 'bg-content1/60 dark:bg-content1/50'
				),
			}}
		>
			<div className="flex min-w-0 flex-1 items-center gap-3">
				<AdminIcon
					icon={icon}
					className={cn(hasSubtitle && 'mt-0.5')}
				/>
				<div className="min-w-0 space-y-1">
					<h1 className="break-words text-xl font-semibold leading-7 text-foreground-900">
						{title}
					</h1>
					{subtitle !== undefined && (
						<p className="break-words text-small leading-5 text-foreground-500">
							{subtitle}
						</p>
					)}
				</div>
			</div>
			{actions !== undefined && (
				<div className="flex shrink-0 flex-wrap items-center gap-2">
					{actions}
				</div>
			)}
		</Card>
	);
});

interface IAdminHeaderActionLinkProps extends PropsWithChildren<object> {
	color?: IButtonProps['color'];
	href: string;
	icon?: FontAwesomeIconProps['icon'];
	onPress?: ComponentProps<typeof Link>['onPress'] | undefined;
}

export const AdminHeaderActionLink = memo<IAdminHeaderActionLinkProps>(
	function AdminHeaderActionLink({ children, color, href, icon, onPress }) {
		return (
			<Button
				as={Link}
				animationUnderline={false}
				href={href}
				startContent={
					icon === undefined ? undefined : (
						<FontAwesomeIcon icon={icon} className="w-3.5" />
					)
				}
				variant="flat"
				{...(color === undefined ? {} : { color })}
				{...(onPress === undefined ? {} : { onPress })}
			>
				{children}
			</Button>
		);
	}
);

interface IAdminHeaderActionButtonProps extends PropsWithChildren<object> {
	color?: IButtonProps['color'];
	icon?: FontAwesomeIconProps['icon'];
	isDisabled?: boolean;
	isLoading?: boolean;
	onPress: NonNullable<IButtonProps['onPress']>;
}

export const AdminHeaderActionButton = memo<IAdminHeaderActionButtonProps>(
	function AdminHeaderActionButton({
		children,
		color,
		icon,
		isDisabled = false,
		isLoading = false,
		onPress,
	}) {
		const startContent =
			isLoading || icon === undefined ? undefined : (
				<FontAwesomeIcon icon={icon} className="w-3.5" />
			);

		return (
			<Button
				isDisabled={isDisabled}
				isLoading={isLoading}
				variant="flat"
				onPress={onPress}
				{...(color === undefined ? {} : { color })}
				{...(startContent === undefined ? {} : { startContent })}
			>
				{children}
			</Button>
		);
	}
);

interface IAdminPanelProps extends PropsWithChildren<
	Pick<HTMLDivElementAttributes, 'className'>
> {}

export const AdminPanel = memo<IAdminPanelProps>(function AdminPanel({
	children,
	className,
}) {
	const isHighAppearance = store.persistence.highAppearance.use();

	return (
		<Card
			as="section"
			fullWidth
			shadow="sm"
			classNames={{
				base: cn(
					'overflow-hidden p-4',
					isHighAppearance
						? 'bg-content1/40 backdrop-blur'
						: 'bg-content1/60 dark:bg-content1/50',
					className
				),
			}}
		>
			{children}
		</Card>
	);
});

interface IAdminPanelTitleProps {
	children: ReactNodeWithoutBoolean;
	className?: string;
	icon: FontAwesomeIconProps['icon'];
}

export const AdminPanelTitle = memo<IAdminPanelTitleProps>(
	function AdminPanelTitle({ children, className, icon }) {
		return (
			<div
				className={cn(
					'mb-3 flex items-center gap-2 text-small font-medium text-foreground-700',
					className
				)}
			>
				<FontAwesomeIcon icon={icon} className="w-4" />
				<span>{children}</span>
			</div>
		);
	}
);

interface IAdminPanelToolbarProps {
	actionClassName?: string;
	actions?: ReactNodeWithoutBoolean;
	children: ReactNodeWithoutBoolean;
	icon: FontAwesomeIconProps['icon'];
}

export const AdminPanelToolbar = memo<IAdminPanelToolbarProps>(
	function AdminPanelToolbar({ actionClassName, actions, children, icon }) {
		return (
			<div className="mb-4 flex min-w-0 flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between">
				<AdminPanelTitle className="mb-0" icon={icon}>
					{children}
				</AdminPanelTitle>
				{actions !== undefined && (
					<div
						className={cn(
							'flex w-full min-w-0 flex-col items-stretch gap-2 md:w-auto md:flex-row md:flex-wrap md:items-center md:justify-end',
							actionClassName
						)}
					>
						{actions}
					</div>
				)}
			</div>
		);
	}
);

interface IAdminFilterPanelProps extends PropsWithChildren<object> {
	icon: FontAwesomeIconProps['icon'];
}

export const AdminFilterPanel = memo<IAdminFilterPanelProps>(
	function AdminFilterPanel({ children, icon }) {
		return (
			<AdminPanel>
				<AdminPanelTitle icon={icon}>筛选</AdminPanelTitle>
				<div className="flex w-full flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-center">
					{children}
				</div>
			</AdminPanel>
		);
	}
);

interface IAdminInputIconProps extends Pick<FontAwesomeIconProps, 'icon'> {}

export const AdminInputIcon = memo<IAdminInputIconProps>(
	function AdminInputIcon({ icon }) {
		return (
			<span className="pointer-events-none inline-flex -translate-y-px items-center text-default-400">
				<FontAwesomeIcon icon={icon} className="block w-3.5" />
			</span>
		);
	}
);

interface IAdminSearchInputProps {
	ariaLabel: string;
	className?: string;
	icon: FontAwesomeIconProps['icon'];
	onValueChange: (value: string) => void;
	placeholder: string;
	value: string;
}

export const AdminSearchInput = memo<IAdminSearchInputProps>(
	function AdminSearchInput({
		ariaLabel,
		className,
		icon,
		onValueChange,
		placeholder,
		value,
	}) {
		return (
			<Input
				aria-label={ariaLabel}
				className={cn(
					'w-full min-w-0 md:min-w-80 md:flex-[1_1_20rem]',
					className
				)}
				classNames={{ inputWrapper: 'h-12 min-h-12' }}
				placeholder={placeholder}
				startContent={<AdminInputIcon icon={icon} />}
				value={value}
				onValueChange={onValueChange}
			/>
		);
	}
);

export const adminFilterInputClassName =
	'w-full min-w-0 md:min-w-56 md:flex-[1_1_16rem]';

export const adminAdvancedFilterInputClassNames = {
	inputWrapper: 'h-10 min-h-10',
} as const;

interface IAdminFilterActionButtonProps extends PropsWithChildren<object> {
	icon?: FontAwesomeIconProps['icon'];
	isLoading: boolean;
	onPress: NonNullable<IButtonProps['onPress']>;
}

export const AdminFilterActionButton = memo<IAdminFilterActionButtonProps>(
	function AdminFilterActionButton({
		children,
		icon = faRotate,
		isLoading,
		onPress,
	}) {
		return (
			<Button
				className="h-12 min-h-12 w-full shrink-0 px-4 md:w-auto md:flex-none"
				color="primary"
				isLoading={isLoading}
				startContent={
					isLoading ? null : (
						<FontAwesomeIcon icon={icon} className="w-3.5" />
					)
				}
				variant="flat"
				onPress={onPress}
			>
				{children}
			</Button>
		);
	}
);

interface IAdminAdvancedFilterPopoverProps {
	activeCount?: number;
	children: ReactNodeWithoutBoolean;
	label?: ReactNodeWithoutBoolean;
}

export const AdminAdvancedFilterPopover =
	memo<IAdminAdvancedFilterPopoverProps>(function AdminAdvancedFilterPopover({
		activeCount = 0,
		children,
		label = '更多筛选',
	}) {
		const hasActiveFilter = activeCount > 0;

		return (
			<Popover placement="bottom-start" showArrow>
				<PopoverTrigger>
					<Button
						className="h-12 min-h-12 w-full shrink-0 gap-2 px-4 md:w-auto md:min-w-32 md:flex-none"
						color={hasActiveFilter ? 'primary' : 'default'}
						startContent={
							<FontAwesomeIcon
								icon={faFilter}
								className="w-3.5"
							/>
						}
						variant={hasActiveFilter ? 'flat' : 'light'}
					>
						<span>{label}</span>
						{hasActiveFilter && (
							<span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-tiny font-medium text-primary">
								{activeCount}
							</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto max-w-[calc(100vw-2rem)] p-3">
					<div className="grid w-72 max-w-full gap-3">{children}</div>
				</PopoverContent>
			</Popover>
		);
	});

interface IAdminDropdownFilterProps<TValue extends string> {
	ariaLabel: string;
	onAction: (key: Key) => void;
	options: ReadonlyArray<{ label: string; value: TValue }>;
	value: TValue;
}

function getAdminDropdownFilterLabel<TValue extends string>(
	options: ReadonlyArray<{ label: string; value: TValue }>,
	value: TValue
) {
	return options.find((option) => option.value === value)?.label ?? '';
}

function AdminDropdownFilterBase<TValue extends string>({
	ariaLabel,
	onAction,
	options,
	value,
}: IAdminDropdownFilterProps<TValue>) {
	return (
		<Dropdown className="w-full shrink-0 md:w-auto md:flex-none" showArrow>
			<DropdownTrigger>
				<Button
					aria-label={ariaLabel}
					className="h-12 min-h-12 w-full min-w-0 shrink-0 gap-2 px-3 md:w-auto md:flex-none"
					endContent={
						<FontAwesomeIcon
							icon={faChevronDown}
							className="w-3 text-default-500"
						/>
					}
					variant="flat"
				>
					<span className="truncate text-small">
						{getAdminDropdownFilterLabel(options, value)}
					</span>
				</Button>
			</DropdownTrigger>
			<DropdownMenu
				disallowEmptySelection
				aria-label={ariaLabel}
				selectedKeys={[value]}
				selectionMode="single"
				variant="flat"
				onAction={onAction}
			>
				{options.map((option) => (
					<DropdownItem key={option.value} textValue={option.label}>
						{option.label}
					</DropdownItem>
				))}
			</DropdownMenu>
		</Dropdown>
	);
}

export const AdminDropdownFilter = memo(
	AdminDropdownFilterBase
) as typeof AdminDropdownFilterBase;

export const adminTextareaClassNames = {
	inputWrapper:
		'bg-default/40 transition-background data-[hover=true]:bg-default-400/40 group-data-[focus=true]:bg-default/70 motion-reduce:transition-none',
} as const;

interface IAdminBadgeProps extends PropsWithChildren<
	Pick<HTMLSpanElementAttributes, 'className'>
> {
	tone?: TAdminBadgeTone;
}

export const AdminBadge = memo<IAdminBadgeProps>(function AdminBadge({
	children,
	className,
	tone = 'default',
}) {
	return (
		<span
			className={cn(
				'inline-flex h-7 items-center rounded-small border px-2 text-tiny font-medium',
				BADGE_TONE_CLASS_NAME_MAP[tone],
				className
			)}
		>
			{children}
		</span>
	);
});

interface IAdminStatusBadgeProps {
	status: TUserStatus;
}

export const AdminStatusBadge = memo<IAdminStatusBadgeProps>(
	function AdminStatusBadge({ status }) {
		const meta = STATUS_META_MAP[status];

		return <AdminBadge tone={meta.tone}>{meta.label}</AdminBadge>;
	}
);

interface IAdminSsoClientStatusBadgeProps {
	disabledAt: number | null;
}

export const AdminSsoClientStatusBadge = memo<IAdminSsoClientStatusBadgeProps>(
	function AdminSsoClientStatusBadge({ disabledAt }) {
		const isDisabled = disabledAt !== null;

		return (
			<AdminBadge tone={isDisabled ? 'warning' : 'success'}>
				{isDisabled ? '已禁用' : '已启用'}
			</AdminBadge>
		);
	}
);

interface IAdminAnnouncementStatusBadgeProps {
	status: TAnnouncementComputedStatus;
}

export const AdminAnnouncementStatusBadge =
	memo<IAdminAnnouncementStatusBadgeProps>(
		function AdminAnnouncementStatusBadge({ status }) {
			const meta = ANNOUNCEMENT_STATUS_META_MAP[status];

			return <AdminBadge tone={meta.tone}>{meta.label}</AdminBadge>;
		}
	);

interface IAdminAnnouncementLevelBadgeProps {
	level: TAnnouncementLevel;
}

export const AdminAnnouncementLevelBadge =
	memo<IAdminAnnouncementLevelBadgeProps>(
		function AdminAnnouncementLevelBadge({ level }) {
			const meta = ANNOUNCEMENT_LEVEL_META_MAP[level];

			return <AdminBadge tone={meta.tone}>{meta.label}</AdminBadge>;
		}
	);

interface IAdminEntityCellProps {
	className?: string;
	id: ReactNodeWithoutBoolean;
	title: ReactNodeWithoutBoolean;
}

export const AdminEntityCell = memo<IAdminEntityCellProps>(
	function AdminEntityCell({ className, id, title }) {
		return (
			<div className={cn('min-w-0 max-w-80', className)}>
				<p className="truncate text-small font-medium leading-5 text-foreground-800">
					{title}
				</p>
				<p className="truncate font-mono text-[0.7rem] leading-4 text-foreground-400">
					{id}
				</p>
			</div>
		);
	}
);

interface IAdminTableActionLinkProps extends PropsWithChildren<object> {
	href: string;
	onPress?: ComponentProps<typeof Link>['onPress'] | undefined;
}

export const AdminTableActionLink = memo<IAdminTableActionLinkProps>(
	function AdminTableActionLink({ children, href, onPress }) {
		return (
			<Link
				animationUnderline={false}
				className="rounded-small px-2 py-1 text-small text-primary-600 transition-background hover:bg-primary/15 motion-reduce:transition-none dark:text-primary"
				href={href}
				{...(onPress === undefined ? {} : { onPress })}
			>
				{children}
			</Link>
		);
	}
);

interface IAdminMetricProps {
	className?: string;
	label: ReactNodeWithoutBoolean;
	value: ReactNodeWithoutBoolean;
}

export const AdminMetric = memo<IAdminMetricProps>(function AdminMetric({
	className,
	label,
	value,
}) {
	return (
		<div
			className={cn(
				'flex min-h-12 min-w-0 flex-col justify-center',
				className
			)}
		>
			<div className="truncate text-tiny leading-5 text-foreground-500">
				{label}
			</div>
			<div className="min-w-0 break-words text-base font-semibold leading-6 text-foreground-800">
				{value}
			</div>
		</div>
	);
});

interface IAdminMetricPanelProps extends PropsWithChildren<
	Pick<HTMLDivElementAttributes, 'className'>
> {}

export const AdminMetricPanel = memo<IAdminMetricPanelProps>(
	function AdminMetricPanel({ children, className }) {
		return (
			<AdminPanel className={cn('grid gap-4', className)}>
				{children}
			</AdminPanel>
		);
	}
);

interface IAdminMutedTextProps extends PropsWithChildren<object> {}

export const AdminMutedText = memo<IAdminMutedTextProps>(
	function AdminMutedText({ children }) {
		return <span className="text-foreground-400">{children}</span>;
	}
);

interface IAdminMessageProps {
	message: string;
}

export const AdminMessage = memo<IAdminMessageProps>(function AdminMessage({
	message,
}) {
	return (
		<div className="rounded-small border border-default-200/80 bg-default/30 px-3 py-2 text-small leading-6 text-foreground-600">
			{message}
		</div>
	);
});

interface IAdminCodeBlockProps {
	actions?: ReactNodeWithoutBoolean;
	ariaLabel?: string;
	copyLabel?: string;
	isCopyDisabled?: boolean;
	onCopy?: () => void;
	value: string;
}

export const AdminCodeBlock = memo<IAdminCodeBlockProps>(
	function AdminCodeBlock({
		actions,
		ariaLabel,
		copyLabel = '复制内容',
		isCopyDisabled,
		onCopy,
		value,
	}) {
		return (
			<div className="flex min-w-0 items-center gap-2 rounded-small border border-default-200/80 bg-default/30 px-3 py-2">
				<span
					aria-label={ariaLabel}
					className="min-w-0 flex-1 break-all font-mono text-tiny leading-5 text-foreground-600"
				>
					{value}
				</span>
				{onCopy !== undefined && (
					<Button
						isIconOnly
						aria-label={copyLabel}
						isDisabled={isCopyDisabled}
						size="sm"
						variant="flat"
						onPress={onCopy}
					>
						<FontAwesomeIcon icon={faClipboard} className="w-3" />
					</Button>
				)}
				{actions}
			</div>
		);
	}
);

interface IAdminLoadingStateProps {
	icon: FontAwesomeIconProps['icon'];
	label: ReactNodeWithoutBoolean;
	subtitle: ReactNodeWithoutBoolean;
	title: ReactNodeWithoutBoolean;
}

export const AdminLoadingState = memo<IAdminLoadingStateProps>(
	function AdminLoadingState({ icon, label, subtitle, title }) {
		return (
			<AdminShell>
				<AdminHeader icon={icon} subtitle={subtitle} title={title} />
				<AdminPanel className="flex items-center gap-3 text-small text-foreground-500">
					<Button isLoading variant="flat">
						加载中
					</Button>
					<span>{label}</span>
				</AdminPanel>
			</AdminShell>
		);
	}
);

interface IAdminErrorRetryStateProps {
	icon: FontAwesomeIconProps['icon'];
	message: string | null;
	onRetry: NonNullable<IButtonProps['onPress']>;
	subtitle: ReactNodeWithoutBoolean;
	title: ReactNodeWithoutBoolean;
}

export const AdminErrorRetryState = memo<IAdminErrorRetryStateProps>(
	function AdminErrorRetryState({ icon, message, onRetry, subtitle, title }) {
		return (
			<AdminShell>
				<AdminHeader
					actions={
						<AdminHeaderActionButton
							color="primary"
							icon={faRotate}
							onPress={onRetry}
						>
							重试
						</AdminHeaderActionButton>
					}
					icon={icon}
					subtitle={subtitle}
					title={title}
				/>
				{message !== null && <AdminMessage message={message} />}
			</AdminShell>
		);
	}
);

interface IAdminTableProps extends PropsWithChildren<
	Pick<HTMLDivElementAttributes, 'className'>
> {}

export const AdminTable = memo<IAdminTableProps>(function AdminTable({
	children,
	className,
}) {
	const isHighAppearance = store.persistence.highAppearance.use();

	return (
		<div
			className={cn(
				'min-w-0 max-w-full overflow-x-auto rounded-small border border-default-200/80',
				isHighAppearance
					? 'bg-content1/40 backdrop-blur'
					: 'bg-default-50/50 dark:bg-default-100/10',
				className
			)}
		>
			<table className="w-max min-w-full text-left text-small">
				{children}
			</table>
		</div>
	);
});

interface IAdminTableHeaderProps extends PropsWithChildren<object> {}

export const AdminTableHeader = memo<IAdminTableHeaderProps>(
	function AdminTableHeader({ children }) {
		return (
			<thead className="bg-default-100/70 text-tiny font-medium uppercase text-foreground-500 dark:bg-default-50/10">
				{children}
			</thead>
		);
	}
);

interface IAdminTableRowProps extends PropsWithChildren<object> {
	className?: string;
}

export const AdminTableRow = memo<IAdminTableRowProps>(function AdminTableRow({
	children,
	className,
}) {
	return (
		<tr
			className={cn(
				'border-t border-default-200/70 transition-colors hover:bg-default-100/60 motion-reduce:transition-none dark:hover:bg-default-50/10',
				className
			)}
		>
			{children}
		</tr>
	);
});

interface IAdminTableCellProps extends PropsWithChildren<object> {
	align?: 'middle' | 'top';
	className?: string;
	isNowrap?: boolean;
}

export const AdminTableHeadCell = memo<IAdminTableCellProps>(
	function AdminTableHeadCell({ children, className }) {
		return (
			<th
				className={cn(
					'whitespace-nowrap px-4 py-3 font-medium',
					className
				)}
			>
				{children}
			</th>
		);
	}
);

export const AdminTableCell = memo<IAdminTableCellProps>(
	function AdminTableCell({
		align = 'middle',
		children,
		className,
		isNowrap,
	}) {
		return (
			<td
				className={cn(
					'px-4 py-3',
					align === 'top' ? 'align-top' : 'align-middle',
					isNowrap && 'whitespace-nowrap',
					className
				)}
			>
				{children}
			</td>
		);
	}
);

interface IAdminConfirmButtonProps<TConfirmAction extends string> {
	children: ReactNodeWithoutBoolean;
	className?: IButtonProps['className'];
	color: IButtonProps['color'];
	confirmAction: TConfirmAction;
	confirmColor?: IButtonProps['color'];
	confirmLabel: string;
	icon: FontAwesomeIconProps['icon'];
	isDisabled?: boolean;
	isLoading: boolean;
	onConfirm: () => void;
	onOpenChange: (action: TConfirmAction | null) => void;
	openAction: TConfirmAction | null;
	size?: IButtonProps['size'];
}

function AdminConfirmButtonBase<TConfirmAction extends string>({
	children,
	className,
	color,
	confirmAction,
	confirmColor = 'danger',
	confirmLabel,
	icon,
	isDisabled,
	isLoading,
	onConfirm,
	onOpenChange,
	openAction,
	size,
}: IAdminConfirmButtonProps<TConfirmAction>) {
	const handleOpenChange = (isOpen: boolean) => {
		onOpenChange(isOpen ? confirmAction : null);
	};

	const handleCancelPress = () => {
		onOpenChange(null);
	};

	return (
		<Popover
			shouldBlockScroll
			showArrow
			isOpen={openAction === confirmAction}
			onOpenChange={handleOpenChange}
		>
			<PopoverTrigger>
				<Button
					className={className}
					color={color}
					isDisabled={isDisabled}
					isLoading={isLoading}
					size={size}
					startContent={
						isLoading ? null : (
							<FontAwesomeIcon icon={icon} className="w-3.5" />
						)
					}
					variant="flat"
				>
					{children}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="space-y-1 p-1">
				<Button
					fullWidth
					color={confirmColor}
					isDisabled={isLoading}
					size="sm"
					variant="ghost"
					onPress={onConfirm}
				>
					{confirmLabel}
				</Button>
				<Button
					fullWidth
					color="primary"
					size="sm"
					variant="ghost"
					onPress={handleCancelPress}
				>
					取消
				</Button>
			</PopoverContent>
		</Popover>
	);
}

export const AdminConfirmButton = memo(
	AdminConfirmButtonBase
) as typeof AdminConfirmButtonBase;

interface IAdminPaginationProps {
	currentPage: number;
	isLoading: boolean;
	onNextPage: () => void;
	onPageInputChange: (value: string) => void;
	onPageJumpSubmit: (event: SyntheticEvent<HTMLFormElement>) => void;
	onPreviousPage: () => void;
	pageInput: string;
	pageSize?: number | undefined;
	totalCount?: number | undefined;
	totalLabel: string;
	totalPages: number;
}

export const AdminPagination = memo<IAdminPaginationProps>(
	function AdminPagination({
		currentPage,
		isLoading,
		onNextPage,
		onPageInputChange,
		onPageJumpSubmit,
		onPreviousPage,
		pageInput,
		pageSize,
		totalCount,
		totalLabel,
		totalPages,
	}) {
		const isHighAppearance = store.persistence.highAppearance.use();
		const safeTotalPages = Math.max(1, totalPages);

		return (
			<div
				className={cn(
					'flex flex-wrap items-center justify-between gap-3 rounded-small border border-default-200/80 px-3 py-2 text-small text-foreground-500',
					isHighAppearance
						? 'bg-content1/40 backdrop-blur'
						: 'bg-default-50/50 dark:bg-default-100/10'
				)}
			>
				<span>
					第{currentPage} / {safeTotalPages}页
					{pageSize !== undefined && ` · 每页${pageSize}`}
					{totalCount !== undefined &&
						` · 共${totalCount}${totalLabel}`}
				</span>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						isDisabled={currentPage <= 1 || isLoading}
						size="sm"
						variant="flat"
						onPress={onPreviousPage}
					>
						上一页
					</Button>
					<Button
						isDisabled={isLoading || currentPage >= safeTotalPages}
						size="sm"
						variant="flat"
						onPress={onNextPage}
					>
						下一页
					</Button>
					<form
						className="flex items-center gap-2"
						onSubmit={onPageJumpSubmit}
					>
						<Input
							aria-label="跳转页码"
							className="w-20"
							classNames={{
								input: 'text-center',
								inputWrapper: 'h-8 min-h-8',
							}}
							inputMode="numeric"
							placeholder="页码"
							size="sm"
							value={pageInput}
							onValueChange={onPageInputChange}
						/>
						<Button
							isDisabled={isLoading || pageInput.length === 0}
							size="sm"
							type="submit"
							variant="light"
						>
							跳转
						</Button>
					</form>
				</div>
			</div>
		);
	}
);

interface IAdminEmptyStateProps {
	children: ReactNodeWithoutBoolean;
	icon: FontAwesomeIconProps['icon'];
}

export const AdminEmptyState = memo<IAdminEmptyStateProps>(
	function AdminEmptyState({ children, icon }) {
		const isHighAppearance = store.persistence.highAppearance.use();

		return (
			<Placeholder
				className={cn(
					'min-h-32 gap-2 space-y-0 rounded-small border border-dashed border-default-300/80 px-4 py-8',
					isHighAppearance
						? 'bg-content1/40 backdrop-blur'
						: 'bg-default-50/30 dark:bg-default-100/10'
				)}
			>
				<FontAwesomeIcon icon={icon} size="lg" />
				<span>{children}</span>
			</Placeholder>
		);
	}
);

export function getAdminStatusLabel(status: TUserStatus) {
	return STATUS_META_MAP[status].label;
}
