'use client';

import { faClipboard, faRotate } from '@fortawesome/free-solid-svg-icons';
import {
	FontAwesomeIcon,
	type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { memo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button, { type IButtonProps } from '@/design/ui/components/button';
import Placeholder from '@/design/ui/components/placeholder';

import { AdminPanel } from './panels';
import { AdminHeader, AdminHeaderActionButton, AdminShell } from './shell';

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
interface IAdminEmptyStateProps {
	children: ReactNodeWithoutBoolean;
	icon: FontAwesomeIconProps['icon'];
}

export const AdminEmptyState = memo<IAdminEmptyStateProps>(
	function AdminEmptyState({ children, icon }) {
		const { isHighAppearance } = useDesignPreferences();

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
