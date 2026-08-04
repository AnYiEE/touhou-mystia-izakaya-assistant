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
import {
	ACCOUNT_CLIENT_MESSAGE_MAP,
	LEGACY_BACKUP_IMPORT_MESSAGE_MAP,
} from '@/features/account/client/copy';
import {
	getAccountClientErrorMessage,
	isLegacyBackupImportErrorMessage,
} from '@/features/account/client/errorMessage';
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

function clearPendingLegacyBackupImportError() {
	const lastError = accountStore.shared.sync.lastError.get();
	if (lastError !== null && isLegacyBackupImportErrorMessage(lastError)) {
		accountStore.shared.sync.lastError.set(null);
	}
}

export default function LegacyBackupImport() {
	const vibrate = useVibrate();

	const cloudCode = globalStore.persistence.cloudCode.use();

	const csrfToken = accountStore.shared.csrfToken.use();
	const isLoggedIn = accountStore.shared.isLoggedIn.use();
	const user = accountStore.shared.user.use();

	const [code, setCode] = useState(cloudCode ?? '');
	const [message, setMessage] = useState<string | null>(null);
	const [isImporting, setIsImporting] = useState(false);

	const isImportingRef = useRef(false);
	const previousCloudCodeRef = useRef(cloudCode ?? '');

	const normalizedCode = code.trim();
	const isSuccessMessage =
		message === LEGACY_BACKUP_IMPORT_MESSAGE_MAP.success;
	const importErrorMessage =
		message !== null && !isSuccessMessage ? message : null;

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
					throw new Error(
						LEGACY_BACKUP_IMPORT_MESSAGE_MAP.syncPending
					);
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
								LEGACY_BACKUP_IMPORT_MESSAGE_MAP.localTakeoverFailed
							);
						}

						globalStore.persistence.cloudCode.set(null);
						setCode('');
						hasCompletedImport = true;
					}
				);
				if (operationResult === null) {
					throw new Error(ACCOUNT_CLIENT_MESSAGE_MAP.operationBusy);
				}
			})
			.then(() => {
				if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
					return;
				}
				if (hasCompletedImport) {
					setMessage(LEGACY_BACKUP_IMPORT_MESSAGE_MAP.success);
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
					error instanceof Error
						? getAccountClientErrorMessage(
								error.message,
								LEGACY_BACKUP_IMPORT_MESSAGE_MAP.failed
							)
						: LEGACY_BACKUP_IMPORT_MESSAGE_MAP.failed
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
	}, [csrfToken, normalizedCode, user, vibrate]);

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
		accountStore.openAccountModal();
	}, [vibrate]);

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
					旧备份码只能导入到已登录账号。请先登录或注册。
				</p>
				<Button
					color="primary"
					variant="flat"
					onPress={handleOpenAccountModal}
				>
					登录或注册
				</Button>
			</div>
		);
	}

	return (
		<form className="space-y-3" onSubmit={handleImportSubmit}>
			<p className="text-small text-foreground-600">
				输入旧版云端备份码并点击导入，其中保存的套餐数据将被合并到当前账号。导入成功后，该备份码将自动失效。
			</p>
			<Input
				description={
					importErrorMessage === null
						? '备份码通常来自旧版云端备份功能，请完整复制后粘贴'
						: undefined
				}
				errorMessage={importErrorMessage ?? undefined}
				isDisabled={isImporting}
				isInvalid={importErrorMessage !== null}
				label="旧备份码"
				placeholder="粘贴旧备份码"
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
					导入到账号
				</Button>
				<Button
					color="danger"
					isDisabled={isImporting || normalizedCode.length === 0}
					type="button"
					variant="light"
					onPress={handleClearCode}
				>
					清空备份码
				</Button>
				{isSuccessMessage && (
					<span
						aria-atomic="true"
						aria-live="polite"
						className="text-small text-success-700 dark:text-success"
						role="status"
					>
						{message}
					</span>
				)}
			</div>
		</form>
	);
}
