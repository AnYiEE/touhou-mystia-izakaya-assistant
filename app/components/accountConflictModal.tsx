'use client';

import { useEffect, useRef, useState } from 'react';

import { Button, Modal } from '@/design/ui/components';
import { createSnapshotHash } from '@/lib/account/client/queue';
import { type ISyncConflictItem } from '@/lib/account/sync';
import { accountStore } from '@/stores/account';
import {
	type TSyncConflictResolution,
	resolveAccountSyncConflict,
} from '@/lib/account/client/conflict';
import { scheduleAccountSyncFlush } from '@/lib/account/client/syncClient';
import { getLogSafeErrorCode } from '@/lib/logging';
import Heading from './heading';

function formatConflictData(data: unknown) {
	try {
		return JSON.stringify(data, null, 2);
	} catch {
		return String(data);
	}
}

function ConflictPreview({ label, value }: { label: string; value: unknown }) {
	return (
		<div className="space-y-1">
			<p className="text-xs font-medium text-foreground-500">{label}</p>
			<pre className="max-h-52 overflow-auto rounded-small bg-default-100 p-2 text-xs text-foreground-700">
				{formatConflictData(value)}
			</pre>
		</div>
	);
}

function checkConflictSnapshotUnchanged(
	currentConflict: ISyncConflictItem,
	conflict: ISyncConflictItem
) {
	return (
		currentConflict.userId === conflict.userId &&
		currentConflict.namespace === conflict.namespace &&
		currentConflict.revision === conflict.revision &&
		createSnapshotHash(currentConflict.cloud) ===
			createSnapshotHash(conflict.cloud) &&
		createSnapshotHash(currentConflict.local) ===
			createSnapshotHash(conflict.local) &&
		createSnapshotHash(currentConflict.merged) ===
			createSnapshotHash(conflict.merged)
	);
}

function createConflictSnapshotKey(conflict: ISyncConflictItem) {
	return JSON.stringify([
		conflict.userId,
		conflict.namespace,
		conflict.revision,
		createSnapshotHash(conflict.cloud),
		createSnapshotHash(conflict.local),
		createSnapshotHash(conflict.merged),
	]);
}

export default function AccountConflictModal() {
	const [resolvingResolution, setResolvingResolution] =
		useState<TSyncConflictResolution | null>(null);
	const [resolvedConflictKeys, setResolvedConflictKeys] = useState<
		ReadonlySet<string>
	>(() => new Set());
	const [displayedConflict, setDisplayedConflict] =
		useState<ISyncConflictItem | null>(null);
	const isResolvingRef = useRef(false);
	const [message, setMessage] = useState<string | null>(null);
	const [portalContainer, setPortalContainer] = useState<Element | null>(
		null
	);
	const conflicts = accountStore.shared.sync.conflicts.use();
	const passwordMustChange = accountStore.shared.passwordMustChange.use();
	const user = accountStore.shared.user.use();
	const conflict = conflicts.find(
		(item) =>
			item.userId === user?.id &&
			!resolvedConflictKeys.has(createConflictSnapshotKey(item))
	);
	const isModalOpen =
		conflict !== undefined && user !== null && !passwordMustChange;
	const visibleConflict = conflict ?? displayedConflict;

	useEffect(() => {
		setPortalContainer(document.querySelector('#modal-portal-container'));
	}, []);
	useEffect(() => {
		setResolvedConflictKeys(new Set());
	}, [user?.id]);
	useEffect(() => {
		if (isModalOpen) {
			setDisplayedConflict(conflict);
		}
	}, [conflict, isModalOpen]);
	useEffect(() => {
		setResolvedConflictKeys((currentKeys) => {
			if (currentKeys.size === 0) {
				return currentKeys;
			}
			const activeKeys = new Set(
				conflicts.map(createConflictSnapshotKey)
			);
			const nextKeys = new Set<string>();
			let didChange = false;
			for (const key of currentKeys) {
				if (activeKeys.has(key)) {
					nextKeys.add(key);
				} else {
					didChange = true;
				}
			}

			return didChange ? nextKeys : currentKeys;
		});
	}, [conflicts]);
	useEffect(() => {
		isResolvingRef.current = false;
		setResolvingResolution(null);
		setMessage(null);
	}, [conflict]);

	if (visibleConflict === null) {
		return null;
	}

	const resolveConflict = (resolution: TSyncConflictResolution) => {
		if (isResolvingRef.current || conflict === undefined || user === null) {
			return;
		}

		isResolvingRef.current = true;
		setResolvingResolution(resolution);
		setMessage(null);
		try {
			const conflictKey = createConflictSnapshotKey(conflict);
			const currentConflict = accountStore.shared.sync.conflicts
				.get()
				.find(
					(item) => createConflictSnapshotKey(item) === conflictKey
				);
			if (
				currentConflict === undefined ||
				!checkConflictSnapshotUnchanged(currentConflict, conflict)
			) {
				setMessage('冲突状态已变化，请重新选择');
				return;
			}

			const didResolve = resolveAccountSyncConflict({
				conflict: currentConflict,
				resolution,
				userId: user.id,
			});
			if (!didResolve) {
				setMessage('冲突暂时无法保存，请稍后重试');
				return;
			}
			setResolvedConflictKeys((currentKeys) => {
				if (currentKeys.has(conflictKey)) {
					return currentKeys;
				}

				const nextKeys = new Set(currentKeys);
				nextKeys.add(conflictKey);

				return nextKeys;
			});
			scheduleAccountSyncFlush();
		} catch (error) {
			console.error('Failed to resolve conflict.', {
				errorCode: getLogSafeErrorCode(error),
			});
			setMessage('冲突保存失败，请稍后重试');
		} finally {
			isResolvingRef.current = false;
			setResolvingResolution(null);
		}
	};

	return (
		<Modal
			isOpen={isModalOpen}
			{...(portalContainer === null ? {} : { portalContainer })}
		>
			<div className="w-full max-w-3xl space-y-4">
				<Heading as="h2" isFirst>
					同步冲突
				</Heading>
				<p className="text-sm text-foreground-600">
					{visibleConflict.namespace}需要选择保留的数据版本。
				</p>
				<div className="grid gap-3 lg:grid-cols-3">
					<ConflictPreview
						label="云端"
						value={visibleConflict.cloud}
					/>
					<ConflictPreview
						label="本地"
						value={visibleConflict.local}
					/>
					<ConflictPreview
						label="合并结果"
						value={visibleConflict.merged ?? '无法自动合并'}
					/>
				</div>
				{message !== null && (
					<p
						aria-live="assertive"
						className="text-sm text-danger"
						role="alert"
					>
						{message}
					</p>
				)}
				<div className="flex flex-wrap justify-end gap-2">
					<Button
						isDisabled={resolvingResolution !== null}
						isLoading={resolvingResolution === 'cloud'}
						variant="flat"
						onPress={() => {
							resolveConflict('cloud');
						}}
					>
						使用云端
					</Button>
					<Button
						isDisabled={resolvingResolution !== null}
						isLoading={resolvingResolution === 'local'}
						variant="flat"
						onPress={() => {
							resolveConflict('local');
						}}
					>
						使用本地
					</Button>
					{visibleConflict.merged !== null && (
						<Button
							color="primary"
							isDisabled={resolvingResolution !== null}
							isLoading={resolvingResolution === 'merged'}
							variant="solid"
							onPress={() => {
								resolveConflict('merged');
							}}
						>
							使用合并结果
						</Button>
					)}
				</div>
			</div>
		</Modal>
	);
}
