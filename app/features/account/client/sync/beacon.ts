import { ACCOUNT_SYNC_STATUS_MAP } from '@/domain/account/contracts';

import { sendSyncPing } from '@/features/account/client/api';
import { createAccountClientId } from '@/features/account/client/clientId';
import { SEND_BEACON_SYNC_BODY_BYTES } from '@/features/account/requestLimits';
import type { IDirtyQueueEntry } from '@/features/account/sync/types';

import {
	getAccountSyncTabId,
	getActiveFlushRun,
	getVisibilityOperationId,
	setVisibilityOperationId,
} from './clientRuntime';
import { createSnapshotHash } from './dirtyQueue/snapshotHash';
import { readAccountSyncLease } from './lease';
import {
	checkFlushEntriesStillCurrent,
	getFlushableEntries,
} from './queueRuntime';
import {
	captureAccountSyncResetGeneration,
	checkAccountSyncResetPrepared,
	checkAccountSyncResetWriteAllowed,
} from './resetGeneration';
import { getLoggedInAccountContext } from './sessionBoundary';
import { checkAccountSyncPaused } from './snapshot';
import { checkAccountSyncOperationActive } from './syncOperationLease';

export function flushAccountSyncQueueWithBeacon() {
	const context = getLoggedInAccountContext();
	if (
		context === null ||
		context.user.sync_status === ACCOUNT_SYNC_STATUS_MAP.pausedEmpty ||
		checkAccountSyncPaused() ||
		checkAccountSyncOperationActive(context.user.id) ||
		checkAccountSyncResetPrepared(context.user.id) ||
		getVisibilityOperationId() !== null ||
		getActiveFlushRun() !== null
	) {
		return;
	}

	const generationToken = captureAccountSyncResetGeneration(context.user.id);
	if (
		!checkAccountSyncResetWriteAllowed({
			expectedGeneration: generationToken,
			userId: context.user.id,
		})
	) {
		return;
	}
	const entries = getFlushableEntries(context.user.id, generationToken).sort(
		(left, right) => left.namespace.localeCompare(right.namespace)
	);
	if (entries.length === 0) {
		return;
	}

	const lease = readAccountSyncLease(context.user.id);
	const now = Date.now();
	if (
		lease !== null &&
		lease.expiresAt > now &&
		lease.ownerTabId !== getAccountSyncTabId()
	) {
		return;
	}
	const currentEntries = getFlushableEntries(
		context.user.id,
		generationToken
	).sort((left, right) => left.namespace.localeCompare(right.namespace));
	const createBeaconBatchIdentity = (batch: IDirtyQueueEntry[]) =>
		batch.map((entry) => ({
			baseRevision: entry.baseRevision,
			clientMutationId: entry.clientMutationId,
			namespace: entry.namespace,
			schema_version: entry.schema_version,
			snapshotHash: entry.snapshotHash,
		}));
	const createBeaconBody = (batch: IDirtyQueueEntry[]) => ({
		changes: batch.map((entry) => ({
			data: entry.data,
			namespace: entry.namespace,
			revision: entry.baseRevision,
			schema_version: entry.schema_version,
		})),
		csrf_token: context.csrfToken,
		state_epoch: context.user.state_epoch,
		sync_generation: context.user.sync_generation,
	});
	const entryBatchHash = createSnapshotHash(
		createBeaconBatchIdentity(entries)
	);
	if (
		currentEntries.length !== entries.length ||
		!checkFlushEntriesStillCurrent(context.user.id, entries)
	) {
		return;
	}

	const bodyHash = createSnapshotHash(createBeaconBody(entries));
	const finalEntries = getFlushableEntries(
		context.user.id,
		generationToken
	).sort((left, right) => left.namespace.localeCompare(right.namespace));
	const finalBody = createBeaconBody(finalEntries);
	const finalPayload = JSON.stringify(finalBody);
	const operationId = createAccountClientId();
	if (
		checkAccountSyncOperationActive(context.user.id) ||
		checkAccountSyncResetPrepared(context.user.id) ||
		!checkAccountSyncResetWriteAllowed({
			expectedGeneration: generationToken,
			userId: context.user.id,
		}) ||
		createSnapshotHash(createBeaconBatchIdentity(finalEntries)) !==
			entryBatchHash ||
		createSnapshotHash(finalBody) !== bodyHash ||
		new Blob([finalPayload]).size > SEND_BEACON_SYNC_BODY_BYTES ||
		!checkFlushEntriesStillCurrent(context.user.id, entries)
	) {
		return;
	}

	if (sendSyncPing(finalBody)) {
		setVisibilityOperationId(operationId);
	}
}
