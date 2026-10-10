'use client';

import {
	type SyntheticEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

import Button from '@/design/ui/components/button';
import Input from '@/design/ui/components/input';

import {
	AccountApiError,
	importBackupCode,
} from '@/features/account/client/api';
import { LEGACY_BACKUP_IMPORT_MESSAGE_KEYS } from '@/features/account/client/copy';
import {
	getAccountClientErrorMessage,
	isLegacyBackupImportErrorMessage,
} from '@/features/account/client/errorMessage';
import {
	type TAccountMessageKey,
	accountMessages,
} from '@/features/account/client/messages';
import {
	checkCurrentAccountAuthContext,
	resetAccountStateAfterSessionExpired,
} from '@/features/account/client/session';
import { accountStore } from '@/features/account/client/state/accountStore';
import {
	flushAccountSyncQueueUntilIdle,
	scheduleAccountSyncFlush,
} from '@/features/account/client/sync/flush';
import { takeOverLocalAccountData } from '@/features/account/client/sync/localTakeover';
import { withAccountSyncOperationLease } from '@/features/account/client/sync/syncOperationLease';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { useI18n } from '@/shared/i18n/useI18n';

type TLegacyImportMessage = { key: TAccountMessageKey } | { text: string };

function clearPendingLegacyBackupImportError() {
	const lastError = accountStore.shared.sync.lastError.get();
	if (lastError !== null && isLegacyBackupImportErrorMessage(lastError)) {
		accountStore.shared.sync.lastError.set(null);
	}
}

interface IProps {
	onOpenAccountModal: () => void;
}

export default function LegacyBackupImport({ onOpenAccountModal }: IProps) {
	const vibrate = useVibrate();
	const { locale, t } = useI18n(accountMessages);

	const cloudCode = globalStore.persistence.cloudCode.use();

	const csrfToken = accountStore.shared.csrfToken.use();
	const isLoggedIn = accountStore.shared.isLoggedIn.use();
	const user = accountStore.shared.user.use();

	const [code, setCode] = useState(cloudCode ?? '');
	const [message, setMessage] = useState<TLegacyImportMessage | null>(null);
	const [isImporting, setIsImporting] = useState(false);

	const isImportingRef = useRef(false);
	const previousCloudCodeRef = useRef(cloudCode ?? '');

	const normalizedCode = code.trim();
	const isSuccessMessage =
		message !== null &&
		'key' in message &&
		message.key === LEGACY_BACKUP_IMPORT_MESSAGE_KEYS.success;
	const importErrorMessage =
		message === null || isSuccessMessage
			? null
			: 'key' in message
				? t(message.key)
				: message.text;

	const handleImport = useCallback(() => {
		if (
			isImportingRef.current ||
			csrfToken === null ||
			user === null ||
			normalizedCode.length === 0
		) {
			return;
		}

		vibrate();

		trackEvent(
			trackEvent.category.click,
			'Account Sync Button',
			'Import Legacy Backup'
		);

		isImportingRef.current = true;
		setMessage(null);
		clearPendingLegacyBackupImportError();
		setIsImporting(true);

		const previousCloudCode = globalStore.persistence.cloudCode.get();
		let hasCompletedImport = false;
		let hasTakenOverLocalData = false;

		const expectedAuthContext = {
			expectedCsrfToken: csrfToken,
			expectedUserId: user.id,
		};

		void flushAccountSyncQueueUntilIdle()
			.then(async (isFlushed) => {
				if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
					return;
				}
				if (!isFlushed) {
					throw new Error('legacy-import-sync-pending');
				}

				const operationResult = await withAccountSyncOperationLease(
					user.id,
					'import-backup',
					async () => {
						await importBackupCode(normalizedCode, csrfToken);

						if (
							!checkCurrentAccountAuthContext(expectedAuthContext)
						) {
							return;
						}

						hasTakenOverLocalData =
							await takeOverLocalAccountData();

						if (
							!checkCurrentAccountAuthContext(expectedAuthContext)
						) {
							return;
						}
						if (!hasTakenOverLocalData) {
							throw new Error(
								'legacy-import-local-takeover-failed'
							);
						}

						globalStore.persistence.cloudCode.set(null);
						setCode('');
						hasCompletedImport = true;
					}
				);
				if (operationResult === null) {
					throw new Error('account-operation-busy');
				}
			})
			.then(() => {
				if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
					return;
				}
				if (hasCompletedImport) {
					setMessage({
						key: LEGACY_BACKUP_IMPORT_MESSAGE_KEYS.success,
					});
				}
			})
			.catch((error: unknown) => {
				if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
					return;
				}
				if (!hasTakenOverLocalData) {
					globalStore.persistence.cloudCode.set(previousCloudCode);
				}
				setMessage(
					Error.isError(error)
						? {
								text: getAccountClientErrorMessage(
									error.message,
									locale,
									t('account.legacyImport.failed')
								),
							}
						: { text: t('account.legacyImport.failed') }
				);
				if (error instanceof AccountApiError && error.status === 401) {
					resetAccountStateAfterSessionExpired({
						...expectedAuthContext,
						stateEpoch: user.state_epoch,
					});
				}
			})
			.finally(() => {
				isImportingRef.current = false;
				setIsImporting(false);
				if (checkCurrentAccountAuthContext(expectedAuthContext)) {
					scheduleAccountSyncFlush();
				}
			});
	}, [csrfToken, locale, normalizedCode, t, user, vibrate]);

	const handleImportSubmit = useCallback(
		(event: SyntheticEvent<HTMLFormElement>) => {
			event.preventDefault();
			handleImport();
		},
		[handleImport]
	);

	const handleCodeChange = useCallback((value: string) => {
		setCode(value);
		setMessage(null);
		if (value.trim() === '') {
			globalStore.persistence.cloudCode.set(null);
			clearPendingLegacyBackupImportError();
		}
	}, []);

	const handleClearCode = useCallback(() => {
		vibrate();
		setCode('');
		setMessage(null);
		globalStore.persistence.cloudCode.set(null);
		clearPendingLegacyBackupImportError();
	}, [vibrate]);

	const handleOpenAccountModal = useCallback(() => {
		vibrate();
		trackEvent(
			trackEvent.category.click,
			'Account Button',
			'Open Modal From Legacy Backup Import'
		);
		onOpenAccountModal();
	}, [onOpenAccountModal, vibrate]);

	useEffect(() => {
		const previousCloudCode = previousCloudCodeRef.current;
		const nextCloudCode = cloudCode ?? '';
		previousCloudCodeRef.current = nextCloudCode;
		setCode((currentCode) =>
			currentCode === previousCloudCode ? nextCloudCode : currentCode
		);
	}, [cloudCode]);

	if (!isLoggedIn) {
		return (
			<div className="space-y-2">
				<p className="text-small text-foreground-600">
					{t('account.legacyImport.signInRequired')}
				</p>
				<Button
					color="primary"
					variant="flat"
					onClick={handleOpenAccountModal}
				>
					{t('account.legacyImport.signInAction')}
				</Button>
			</div>
		);
	}

	return (
		<form className="space-y-3" onSubmit={handleImportSubmit}>
			<p className="text-small text-foreground-600">
				{t('account.legacyImport.description')}
			</p>
			<Input
				description={
					importErrorMessage === null
						? t('account.legacyImport.codeHint')
						: undefined
				}
				errorMessage={importErrorMessage ?? undefined}
				isDisabled={isImporting}
				isInvalid={importErrorMessage !== null}
				label={t('account.legacyImport.codeLabel')}
				placeholder={t('account.legacyImport.codePlaceholder')}
				value={code}
				onValueChange={handleCodeChange}
			/>
			<div className="flex flex-wrap items-center gap-2">
				<Button
					color="primary"
					isDisabled={
						isImporting ||
						csrfToken === null ||
						normalizedCode.length === 0
					}
					isLoading={isImporting}
					type="submit"
					variant="flat"
				>
					{t('account.legacyImport.importAction')}
				</Button>
				<Button
					color="danger"
					isDisabled={isImporting || normalizedCode.length === 0}
					type="button"
					variant="light"
					onPress={handleClearCode}
				>
					{t('account.legacyImport.clearAction')}
				</Button>
				{isSuccessMessage && (
					<span
						aria-atomic="true"
						aria-live="polite"
						className="text-small text-success-700 dark:text-success"
						role="status"
					>
						{t(message.key)}
					</span>
				)}
			</div>
		</form>
	);
}
