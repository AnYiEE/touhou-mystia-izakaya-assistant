'use client';

import { memo } from 'react';

import type {
	TAdminSsoCallbackDeliveryStatus,
	TAdminSsoCallbackEvent,
	TAdminSsoCallbackQueueStatus,
	TAdminSsoTicketStatus,
} from '@/features/account/contracts';
import { AdminBadge } from '@/features/admin/client/components/statusBadges';

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
