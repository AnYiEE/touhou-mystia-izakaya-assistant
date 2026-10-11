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
import { accountMessages } from '@/features/account/client/messages';
import type { IAccountUserProfile } from '@/features/account/contracts';

import { useI18n } from '@/shared/i18n/useI18n';

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
	const { t } = useI18n(accountMessages);

	return (
		<div className="space-y-3 border-t border-default-200/80 pt-4">
			<div className="flex items-start gap-2 rounded-medium bg-warning/10 px-3 py-2 text-small leading-5 text-warning-700 dark:text-warning-600">
				<FontAwesomeIcon
					icon={faTriangleExclamation}
					className="mt-1 w-4 shrink-0"
				/>
				<p>{t('account.manager.danger.warning')}</p>
			</div>
			<div className="flex flex-col gap-2">
				<AccountConfirmButton
					buttonLabel={
						user.sync_status === ACCOUNT_SYNC_STATUS_MAP.pausedEmpty
							? t('account.manager.danger.clearDataCleared')
							: t('account.manager.danger.clearData')
					}
					color="warning"
					confirmLabel={t('account.manager.danger.clearDataConfirm')}
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
					buttonLabel={t('account.manager.danger.deleteAccount')}
					color="danger"
					confirmLabel={t(
						'account.manager.danger.deleteAccountConfirm'
					)}
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
