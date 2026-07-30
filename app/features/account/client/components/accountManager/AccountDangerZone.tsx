'use client';

import {
	faCloudArrowUp,
	faTrash,
	faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { memo } from 'react';

import { ACCOUNT_SYNC_STATUS_MAP } from '@/domain/account/contracts';

import AccountConfirmButton from '@/features/account/client/components/AccountConfirmButton';
import type { IAccountUserProfile } from '@/features/account/contracts';

interface IAccountDangerZoneProps {
	csrfToken: string | null;
	handleDeleteAccount: () => void;
	handleDeleteAccountCancel: () => void;
	handleDeleteAccountPopoverOpenChange: (isOpen: boolean) => void;
	handleDeleteData: () => void;
	handleDeleteDataCancel: () => void;
	handleDeleteDataPopoverOpenChange: (isOpen: boolean) => void;
	isDeleteAccountPopoverOpen: boolean;
	isDeleteDataPopoverOpen: boolean;
	isSubmitting: boolean;
	user: IAccountUserProfile;
}

export default memo<IAccountDangerZoneProps>(function AccountDangerZone(props) {
	const {
		csrfToken,
		handleDeleteAccount,
		handleDeleteAccountCancel,
		handleDeleteAccountPopoverOpenChange,
		handleDeleteData,
		handleDeleteDataCancel,
		handleDeleteDataPopoverOpenChange,
		isDeleteAccountPopoverOpen,
		isDeleteDataPopoverOpen,
		isSubmitting,
		user,
	} = props;
	return (
		<div className="space-y-3 border-t border-default-200/80 pt-4">
			<div className="flex items-start gap-2 rounded-medium bg-warning/10 px-3 py-2 text-small leading-5 text-warning-700 dark:text-warning-600">
				<FontAwesomeIcon
					icon={faTriangleExclamation}
					className="mt-1 w-4 shrink-0"
				/>
				<p>
					危险操作会影响云端数据或账号本身，请先通过数据管理导出需要保留的数据。
				</p>
			</div>
			<div className="flex flex-col gap-2">
				<AccountConfirmButton
					buttonLabel={
						user.sync_status === ACCOUNT_SYNC_STATUS_MAP.pausedEmpty
							? '云端数据已清空'
							: '清空云端数据'
					}
					color="warning"
					confirmLabel="确认清空"
					icon={faCloudArrowUp}
					isDisabled={
						isSubmitting ||
						csrfToken === null ||
						user.sync_status === ACCOUNT_SYNC_STATUS_MAP.pausedEmpty
					}
					isLoading={isSubmitting}
					isOpen={isDeleteDataPopoverOpen}
					onOpenChange={handleDeleteDataPopoverOpenChange}
					onConfirm={handleDeleteData}
					onCancel={handleDeleteDataCancel}
				/>
				<AccountConfirmButton
					buttonLabel="删除账号"
					color="danger"
					confirmLabel="确认删除"
					icon={faTrash}
					isDisabled={isSubmitting || csrfToken === null}
					isLoading={isSubmitting}
					isOpen={isDeleteAccountPopoverOpen}
					onOpenChange={handleDeleteAccountPopoverOpenChange}
					onConfirm={handleDeleteAccount}
					onCancel={handleDeleteAccountCancel}
				/>
			</div>
		</div>
	);
});
