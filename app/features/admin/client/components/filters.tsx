'use client';

import {
	faChevronDown,
	faFilter,
	faRotate,
} from '@fortawesome/free-solid-svg-icons';
import {
	FontAwesomeIcon,
	type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { type Key, type PropsWithChildren, memo } from 'react';

import Button, { type IButtonProps } from '@/design/ui/components/button';
import Dropdown, {
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
} from '@/design/ui/components/dropdown';
import Input from '@/design/ui/components/input';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';

export const ADMIN_LIST_DEBOUNCE_MS = 300;
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
	reference?: ReactNodeWithoutBoolean;
}

export const AdminAdvancedFilterPopover =
	memo<IAdminAdvancedFilterPopoverProps>(function AdminAdvancedFilterPopover({
		activeCount = 0,
		children,
		label = '更多筛选',
		reference,
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
					<div
						className={cn(
							'grid max-w-full gap-3',
							reference === undefined
								? 'w-72'
								: 'w-[min(42rem,calc(100vw-2rem))]'
						)}
					>
						<div
							className={cn(
								'grid gap-3',
								reference !== undefined && 'sm:grid-cols-2'
							)}
						>
							{children}
						</div>
						{reference}
					</div>
				</PopoverContent>
			</Popover>
		);
	});

interface IAdminFilterReferenceValue {
	label: string;
	value: string;
}

interface IAdminFilterReferenceGroup {
	label: string;
	values: ReadonlyArray<IAdminFilterReferenceValue>;
}

interface IAdminFilterReferencePanelProps {
	groups: ReadonlyArray<IAdminFilterReferenceGroup>;
}

export const AdminFilterReferencePanel = memo<IAdminFilterReferencePanelProps>(
	function AdminFilterReferencePanel({ groups }) {
		return (
			<div className="space-y-3 rounded-small border border-default-200 bg-default/20 p-3">
				<p className="text-small font-medium text-foreground-700">
					可用值参考
				</p>
				{groups.map((group) => (
					<section key={group.label} className="space-y-1.5">
						<p className="text-tiny font-medium text-foreground-500">
							{group.label}
						</p>
						<div className="flex flex-wrap gap-1.5">
							{group.values.map((item) => (
								<span
									key={item.value}
									className="inline-flex min-w-0 items-center gap-1 rounded-small border border-default-200 bg-content1 px-2 py-1 text-tiny"
								>
									<code className="break-all font-mono text-foreground-700">
										{item.value}
									</code>
									<span className="text-foreground-500">
										{item.label}
									</span>
								</span>
							))}
						</div>
					</section>
				))}
			</div>
		);
	}
);

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
