'use client';

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
	const conflicts = accountStore.shared.sync.conflicts.use();
	const user = accountStore.shared.user.use();
	const conflict = conflicts.find((item) => item.userId === user?.id);

	if (conflict === undefined || user === null) {
		return null;
	}

	const resolveConflict = (resolution: 'cloud' | 'local' | 'merged') => {
		resolveAccountSyncConflict({ conflict, resolution, userId: user.id });
		scheduleAccountSyncFlush();
	};

	return (
		<Modal
			isOpen
			portalContainer={document.querySelector('#modal-portal-container')}
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
						variant="flat"
						onPress={() => {
							resolveConflict('cloud');
						}}
					>
						使用云端
					</Button>
					<Button
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
