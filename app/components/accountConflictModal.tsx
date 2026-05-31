'use client';

import { useEffect, useRef, useState } from 'react';

import { Button, Modal } from '@/design/ui/components';
import { accountStore } from '@/stores/account';
import { resolveAccountSyncConflict } from '@/lib/account/client/conflict';
import { scheduleAccountSyncFlush } from '@/lib/account/client/syncClient';
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

export default function AccountConflictModal() {
	const [isResolving, setIsResolving] = useState(false);
	const isResolvingRef = useRef(false);
	const [portalContainer, setPortalContainer] = useState<Element | null>(
		null
	);
	const conflicts = accountStore.shared.sync.conflicts.use();
	const passwordMustChange = accountStore.shared.passwordMustChange.use();
	const user = accountStore.shared.user.use();
	const conflict = conflicts.find((item) => item.userId === user?.id);

	useEffect(() => {
		setPortalContainer(document.querySelector('#modal-portal-container'));
	}, []);
	useEffect(() => {
		isResolvingRef.current = false;
		setIsResolving(false);
	}, [conflict]);

	if (conflict === undefined || user === null || passwordMustChange) {
		return null;
	}

	const resolveConflict = (resolution: 'cloud' | 'local' | 'merged') => {
		if (isResolvingRef.current) {
			return;
		}

		isResolvingRef.current = true;
		setIsResolving(true);
		try {
			resolveAccountSyncConflict({
				conflict,
				resolution,
				userId: user.id,
			});
			scheduleAccountSyncFlush();
		} catch (error) {
			console.error('Failed to resolve conflict:', error);
			isResolvingRef.current = false;
			setIsResolving(false);
		}
	};

	return (
		<Modal
			isOpen
			{...(portalContainer === null ? {} : { portalContainer })}
		>
			<div className="w-full max-w-3xl space-y-4">
				<Heading as="h2" isFirst>
					同步冲突
				</Heading>
				<p className="text-sm text-foreground-600">
					{conflict.namespace} 需要选择保留的数据版本。
				</p>
				<div className="grid gap-3 lg:grid-cols-3">
					<ConflictPreview label="云端" value={conflict.cloud} />
					<ConflictPreview label="本地" value={conflict.local} />
					<ConflictPreview
						label="合并结果"
						value={conflict.merged ?? '无法自动合并'}
					/>
				</div>
				<div className="flex flex-wrap justify-end gap-2">
					<Button
						isDisabled={isResolving}
						variant="flat"
						onPress={() => {
							resolveConflict('cloud');
						}}
					>
						使用云端
					</Button>
					<Button
						isDisabled={isResolving}
						variant="flat"
						onPress={() => {
							resolveConflict('local');
						}}
					>
						使用本地
					</Button>
					{conflict.merged !== null && (
						<Button
							color="primary"
							isDisabled={isResolving}
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
