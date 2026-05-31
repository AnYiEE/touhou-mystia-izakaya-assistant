'use client';

import { useRef, useState } from 'react';

import { Input } from '@heroui/input';

import { Button } from '@/design/ui/components';
import { importBackupCode } from '@/lib/account/client/api';
import { withAccountSyncPaused } from '@/lib/account/client/stateGuards';
import { takeOverLocalAccountData } from '@/lib/account/client/syncClient';
import { accountStore, globalStore } from '@/stores';

export default function LegacyBackupImport() {
	const cloudCode = globalStore.persistence.cloudCode.use();
	const csrfToken = accountStore.shared.csrfToken.use();
	const isLoggedIn = accountStore.shared.isLoggedIn.use();
	const [code, setCode] = useState(cloudCode ?? '');
	const [message, setMessage] = useState<string | null>(null);
	const [isImporting, setIsImporting] = useState(false);
	const isImportingRef = useRef(false);
	const normalizedCode = code.trim();

	return (
		<div className="space-y-2">
			<Input label="旧备份码" value={code} onValueChange={setCode} />
			<div className="flex items-center gap-2">
				{isLoggedIn ? (
					<Button
						color="primary"
						isDisabled={
							isImporting ||
							csrfToken === null ||
							normalizedCode.length === 0
						}
						isLoading={isImporting}
						variant="flat"
						onPress={() => {
							if (isImportingRef.current || csrfToken === null) {
								return;
							}

							isImportingRef.current = true;
							setMessage(null);
							setIsImporting(true);
							const previousCloudCode =
								globalStore.persistence.cloudCode.get();
							let hasImportedBackup = false;
							void withAccountSyncPaused(async () => {
								await importBackupCode(
									normalizedCode,
									csrfToken
								);
								hasImportedBackup = true;
								await takeOverLocalAccountData();
								globalStore.persistence.cloudCode.set(null);
							})
								.then(() => {
									setCode('');
									setMessage('导入成功');
								})
								.catch((error: unknown) => {
									if (!hasImportedBackup) {
										globalStore.persistence.cloudCode.set(
											previousCloudCode
										);
									}
									setMessage(
										error instanceof Error
											? error.message
											: '导入失败'
									);
								})
								.finally(() => {
									isImportingRef.current = false;
									setIsImporting(false);
								});
						}}
					>
						导入到账号
					</Button>
				) : (
					<Button
						color="primary"
						isDisabled={normalizedCode.length === 0}
						variant="flat"
						onPress={() => {
							globalStore.persistence.cloudCode.set(
								normalizedCode
							);
							setMessage('登录或注册后将自动导入');
						}}
					>
						保存旧备份码
					</Button>
				)}
				<span
					aria-atomic="true"
					aria-live="polite"
					className="text-sm text-foreground-500"
					role="status"
				>
					{message ?? ''}
				</span>
			</div>
		</div>
	);
}
