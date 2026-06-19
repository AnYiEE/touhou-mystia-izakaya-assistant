'use client';

import { memo } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faClipboardList,
	faClockRotateLeft,
	faKey,
	faListCheck,
	faRotate,
	faServer,
} from '@fortawesome/free-solid-svg-icons';

import { Button, Link, cn } from '@/design/ui/components';

import { AdminBadge } from '../components';

import { globalStore as store } from '@/stores';

import type {
	TAdminSsoCallbackDeliveryStatus,
	TAdminSsoCallbackEvent,
	TAdminSsoCallbackQueueStatus,
	TAdminSsoTicketStatus,
} from '@/lib/account/shared/types';

export const ADMIN_SSO_DEFAULT_PAGE_SIZE = 20;
export const ADMIN_SSO_LIST_DEBOUNCE_MS = 300;

const ssoNavItems = [
	{ href: '/admin/sso', icon: faServer, label: '客户端' },
	{ href: '/admin/sso/grants', icon: faListCheck, label: '授权关系' },
	{ href: '/admin/sso/callbacks', icon: faRotate, label: 'Callback' },
	{
		href: '/admin/sso/callbacks/history',
		icon: faClockRotateLeft,
		label: '投递历史',
	},
	{ href: '/admin/sso/tickets', icon: faKey, label: 'Tickets' },
	{ href: '/admin/audit?scope=sso', icon: faClipboardList, label: '审计' },
] as const;

interface IAdminSsoOperationNavProps {
	activeHref: (typeof ssoNavItems)[number]['href'];
}

export const AdminSsoOperationNav = memo<IAdminSsoOperationNavProps>(
	function AdminSsoOperationNav({ activeHref }) {
		const isHighAppearance = store.persistence.highAppearance.use();

		return (
			<nav
				aria-label="SSO运营导航"
				className={cn(
					'grid grid-cols-2 gap-2 rounded-small border border-default-200/80 px-3 py-2 text-small text-foreground-500 sm:grid-cols-3 xl:grid-cols-6',
					isHighAppearance
						? 'bg-content1/40 backdrop-blur'
						: 'bg-default-50/50 dark:bg-default-100/10'
				)}
			>
				{ssoNavItems.map((item) => {
					const isActive = item.href === activeHref;

					return (
						<Button
							key={item.href}
							as={Link}
							animationUnderline={false}
							className="w-full min-w-0 px-3"
							color={isActive ? 'primary' : 'default'}
							href={item.href}
							startContent={
								<FontAwesomeIcon
									icon={item.icon}
									className="w-3.5"
								/>
							}
							variant={isActive ? 'solid' : 'flat'}
						>
							<span className="truncate">{item.label}</span>
						</Button>
					);
				})}
			</nav>
		);
	}
);

export function createAdminSsoPageInputValue(page: number) {
	return String(Math.max(1, page));
}

export function parseAdminSsoPageInput(value: string, totalPages: number) {
	const page = Number.parseInt(value, 10);
	if (!Number.isSafeInteger(page) || page < 1) {
		return 1;
	}

	return Math.min(page, Math.max(1, totalPages));
}

export function createAdminSsoDateTimeText(timestamp: number | null) {
	return timestamp === null
		? '无'
		: new Date(timestamp).toLocaleString('zh-CN');
}

function createAdminSsoTimeInputSegment(value: number) {
	return String(value).padStart(2, '0');
}

export function createAdminSsoTimeInputValue(timestamp: number | undefined) {
	if (timestamp === undefined) {
		return '';
	}

	const date = new Date(timestamp);
	return `${date.getFullYear()}-${createAdminSsoTimeInputSegment(
		date.getMonth() + 1
	)}-${createAdminSsoTimeInputSegment(date.getDate())}T${createAdminSsoTimeInputSegment(
		date.getHours()
	)}:${createAdminSsoTimeInputSegment(date.getMinutes())}`;
}

export function parseAdminSsoTimeInputValue(value: string) {
	if (value.trim() === '') {
		return;
	}

	const timestamp = new Date(value).getTime();
	return Number.isSafeInteger(timestamp) && timestamp >= 0
		? timestamp
		: undefined;
}

export function getAdminSsoCallbackEventLabel(event: TAdminSsoCallbackEvent) {
	switch (event) {
		case 'client_deleted':
			return '客户端删除';
		case 'client_disabled':
			return '客户端禁用';
		case 'grant_revoked':
			return '授权撤销';
		case 'secret_rotated':
			return 'Secret轮换';
		case 'user_deleted':
			return '用户删除';
		case 'user_disabled':
			return '用户禁用';
		case 'user_profile_updated':
			return '资料更新';
	}
}

export const AdminSsoCallbackQueueStatusBadge = memo<{
	status: TAdminSsoCallbackQueueStatus;
}>(function AdminSsoCallbackQueueStatusBadge({ status }) {
	switch (status) {
		case 'final_failed':
			return <AdminBadge tone="danger">最终失败</AdminBadge>;
		case 'pending':
			return <AdminBadge tone="primary">待投递</AdminBadge>;
		case 'retrying':
			return <AdminBadge tone="warning">重试中</AdminBadge>;
	}
});

export const AdminSsoCallbackDeliveryStatusBadge = memo<{
	status: TAdminSsoCallbackDeliveryStatus;
}>(function AdminSsoCallbackDeliveryStatusBadge({ status }) {
	switch (status) {
		case 'failed':
			return <AdminBadge tone="warning">失败</AdminBadge>;
		case 'final_failed':
			return <AdminBadge tone="danger">最终失败</AdminBadge>;
		case 'succeeded':
			return <AdminBadge tone="success">成功</AdminBadge>;
	}
});

export const AdminSsoTicketStatusBadge = memo<{
	status: TAdminSsoTicketStatus;
}>(function AdminSsoTicketStatusBadge({ status }) {
	switch (status) {
		case 'expired':
			return <AdminBadge tone="warning">已过期</AdminBadge>;
		case 'pending':
			return <AdminBadge tone="primary">未消费</AdminBadge>;
		case 'revoked':
			return <AdminBadge tone="danger">已撤销</AdminBadge>;
		case 'used':
			return <AdminBadge tone="success">已消费</AdminBadge>;
	}
});

interface IAdminSsoMetadataProps {
	metadata: Record<string, unknown>;
}

export const AdminSsoMetadata = memo<IAdminSsoMetadataProps>(
	function AdminSsoMetadata({ metadata }) {
		const entries = Object.entries(metadata);
		if (entries.length === 0) {
			return <span className="text-foreground-400">无</span>;
		}

		return (
			<div className="flex max-w-96 flex-wrap gap-1">
				{entries.map(([key, value]) => (
					<span
						key={key}
						className={cn(
							'inline-flex max-w-full rounded-small bg-default/40 px-2 py-1',
							'font-mono text-[0.68rem] leading-4 text-foreground-500'
						)}
					>
						<span className="truncate">
							{key}:{' '}
							{typeof value === 'string' ||
							typeof value === 'number'
								? value
								: JSON.stringify(value)}
						</span>
					</span>
				))}
			</div>
		);
	}
);
