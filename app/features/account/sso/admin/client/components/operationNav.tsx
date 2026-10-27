'use client';

import {
	faClipboardList,
	faClockRotateLeft,
	faKey,
	faListCheck,
	faRotate,
	faServer,
} from '@fortawesome/free-solid-svg-icons';
import { memo } from 'react';

import { AdminOperationNav } from '@/features/admin/client/components/operationNav';

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
		return (
			<AdminOperationNav
				activeHref={activeHref}
				ariaLabel="SSO运营导航"
				items={ssoNavItems}
			/>
		);
	}
);
