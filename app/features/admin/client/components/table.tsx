'use client';

import { cn } from '@heroui/theme';
import { type ComponentProps, type PropsWithChildren, memo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Link from '@/design/ui/components/link';

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
				className="rounded-small px-2 py-1 text-small text-primary-600 transition-background hover:bg-primary/15 active:bg-primary/15 motion-reduce:transition-none dark:text-primary"
				href={href}
				{...(onPress === undefined ? {} : { onPress })}
			>
				{children}
			</Link>
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
	const { isHighAppearance } = useDesignPreferences();

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
