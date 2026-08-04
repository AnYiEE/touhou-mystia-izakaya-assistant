'use client';

import { memo } from 'react';

import type {
	TAdminSsoCallbackDeliveryStatus,
	TAdminSsoCallbackEvent,
	TAdminSsoCallbackQueueStatus,
	TAdminSsoTicketStatus,
} from '@/features/account/contracts';
import {
	ADMIN_SSO_CALLBACK_DELIVERY_STATUS_LABEL_MAP,
	ADMIN_SSO_CALLBACK_EVENT_LABEL_MAP,
	ADMIN_SSO_CALLBACK_QUEUE_STATUS_LABEL_MAP,
	ADMIN_SSO_CLIENT_STATUS_LABEL_MAP,
	ADMIN_SSO_TICKET_STATUS_LABEL_MAP,
} from '@/features/account/sso/admin/copy';
import { AdminBadge } from '@/features/admin/client/components/statusBadges';

interface IAdminSsoClientStatusBadgeProps {
	disabledAt: number | null;
}

export const AdminSsoClientStatusBadge = memo<IAdminSsoClientStatusBadgeProps>(
	function AdminSsoClientStatusBadge({ disabledAt }) {
		const isDisabled = disabledAt !== null;

		return (
			<AdminBadge tone={isDisabled ? 'warning' : 'success'}>
				{isDisabled
					? ADMIN_SSO_CLIENT_STATUS_LABEL_MAP.disabled
					: ADMIN_SSO_CLIENT_STATUS_LABEL_MAP.active}
			</AdminBadge>
		);
	}
);
export function getAdminSsoCallbackEventLabel(event: TAdminSsoCallbackEvent) {
	return ADMIN_SSO_CALLBACK_EVENT_LABEL_MAP[event];
}

export const AdminSsoCallbackQueueStatusBadge = memo<{
	status: TAdminSsoCallbackQueueStatus;
}>(function AdminSsoCallbackQueueStatusBadge({ status }) {
	switch (status) {
		case 'final_failed':
			return (
				<AdminBadge tone="danger">
					{ADMIN_SSO_CALLBACK_QUEUE_STATUS_LABEL_MAP.final_failed}
				</AdminBadge>
			);
		case 'pending':
			return (
				<AdminBadge tone="primary">
					{ADMIN_SSO_CALLBACK_QUEUE_STATUS_LABEL_MAP.pending}
				</AdminBadge>
			);
		case 'retrying':
			return (
				<AdminBadge tone="warning">
					{ADMIN_SSO_CALLBACK_QUEUE_STATUS_LABEL_MAP.retrying}
				</AdminBadge>
			);
	}
});

export const AdminSsoCallbackDeliveryStatusBadge = memo<{
	status: TAdminSsoCallbackDeliveryStatus;
}>(function AdminSsoCallbackDeliveryStatusBadge({ status }) {
	switch (status) {
		case 'failed':
			return (
				<AdminBadge tone="warning">
					{ADMIN_SSO_CALLBACK_DELIVERY_STATUS_LABEL_MAP.failed}
				</AdminBadge>
			);
		case 'final_failed':
			return (
				<AdminBadge tone="danger">
					{ADMIN_SSO_CALLBACK_DELIVERY_STATUS_LABEL_MAP.final_failed}
				</AdminBadge>
			);
		case 'succeeded':
			return (
				<AdminBadge tone="success">
					{ADMIN_SSO_CALLBACK_DELIVERY_STATUS_LABEL_MAP.succeeded}
				</AdminBadge>
			);
	}
});

export const AdminSsoTicketStatusBadge = memo<{
	status: TAdminSsoTicketStatus;
}>(function AdminSsoTicketStatusBadge({ status }) {
	switch (status) {
		case 'expired':
			return (
				<AdminBadge tone="warning">
					{ADMIN_SSO_TICKET_STATUS_LABEL_MAP.expired}
				</AdminBadge>
			);
		case 'pending':
			return (
				<AdminBadge tone="primary">
					{ADMIN_SSO_TICKET_STATUS_LABEL_MAP.pending}
				</AdminBadge>
			);
		case 'revoked':
			return (
				<AdminBadge tone="danger">
					{ADMIN_SSO_TICKET_STATUS_LABEL_MAP.revoked}
				</AdminBadge>
			);
		case 'used':
			return (
				<AdminBadge tone="success">
					{ADMIN_SSO_TICKET_STATUS_LABEL_MAP.used}
				</AdminBadge>
			);
	}
});
