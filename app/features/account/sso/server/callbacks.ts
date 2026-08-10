import { randomBytes } from 'node:crypto';

import { type TSsoCallbackDeliveryStatus } from '@/domain/account/contracts';

import { getAccountDatabase } from '@/features/account/server/persistence/database';

import type {
	TSsoCallbackEvent,
	TSsoCallbackQueue,
} from '@/infrastructure/database/schema';
import { TABLE_NAME_MAP } from '@/infrastructure/database/tableNames';
import { FILE_TYPE_JSON } from '@/infrastructure/http/mediaTypes';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import { isNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';

import {
	SSO_CALLBACK_CLAIM_LEASE_MS,
	SSO_CALLBACK_DELIVERY_CLEANUP_INTERVAL_MS,
	SSO_CALLBACK_DELIVERY_MAX_ROWS,
	SSO_CALLBACK_DELIVERY_RETENTION_MS,
	SSO_CALLBACK_DISPATCH_LIMIT,
	SSO_CALLBACK_FAILED_QUEUE_CLEANUP_INTERVAL_MS,
	SSO_CALLBACK_FAILED_QUEUE_MAX_ROWS,
	SSO_CALLBACK_FAILED_QUEUE_RETENTION_MS,
	SSO_CALLBACK_MAX_ATTEMPTS,
	SSO_CALLBACK_TIMEOUT_MS,
	SSO_CALLBACK_USER_AGENT,
} from './callbackPolicy';
import { getSsoClientByIdForCallback } from './clients';
import { createSsoCallbackSignature } from './crypto';
import {
	cleanupSsoCallbackDeliveries,
	writeSsoCallbackDelivery,
} from './persistence/callbackDeliveries';
import {
	SSO_CALLBACK_FINAL_FAILURE_NEXT_RETRY_AT,
	cleanupFinalFailedSsoCallbackQueue,
} from './persistence/callbackQueue';
import { checkSsoCallbackEvent, checkSsoClientEnabled } from './validation';

const CALLBACK_QUEUE_TABLE_NAME = TABLE_NAME_MAP.ssoCallbackQueue;

interface ISsoCallbackBody {
	client_id: string;
	event: TSsoCallbackEvent;
	metadata: Record<string, boolean | null | number | string>;
	timestamp: number;
	user_id: string | null;
}

export interface ISsoCallbackDispatchResult {
	deleted_final_failed_callbacks: number;
	failed: number;
	final_failed: number;
	succeeded: number;
}

interface ISsoCallbackDeliveryAttempt {
	durationMs: number | null;
	error: string | null;
	httpStatus: number | null;
}

type TSsoCallbackAttemptResult =
	| { delivery: ISsoCallbackDeliveryAttempt | null; status: 'delete' }
	| {
			delivery: ISsoCallbackDeliveryAttempt;
			message: string;
			status: 'failed';
	  };

let lastSsoCallbackDeliveryCleanupAt = 0;
let lastSsoCallbackFailedQueueCleanupAt = 0;

function getSsoCallbackRetryDelayMs(nextAttempts: number) {
	switch (nextAttempts) {
		case 1:
			return 1000;
		case 2:
			return 5000;
		case 3:
			return 25_000;
		default:
			return 60_000;
	}
}

function parseSsoCallbackMetadata(
	value: string
): Record<string, boolean | null | number | string> {
	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		return {};
	}

	if (
		parsed === null ||
		typeof parsed !== 'object' ||
		Array.isArray(parsed)
	) {
		return {};
	}

	const parsedRecord = parsed as Record<string, unknown>;
	const metadata: Record<string, boolean | null | number | string> = {};
	for (const [key, metadataValue] of Object.entries(parsedRecord)) {
		if (
			metadataValue === null ||
			typeof metadataValue === 'boolean' ||
			typeof metadataValue === 'number' ||
			typeof metadataValue === 'string'
		) {
			metadata[key] = metadataValue;
		}
	}

	return metadata;
}

function createSsoCallbackBody(record: TSsoCallbackQueue): ISsoCallbackBody {
	return {
		client_id: record.client_id,
		event: record.event,
		metadata: parseSsoCallbackMetadata(record.metadata_json),
		timestamp: record.timestamp,
		user_id: record.user_id,
	};
}

function isSsoClientEvent(event: TSsoCallbackEvent) {
	return ['client_deleted', 'client_disabled', 'secret_rotated'].includes(
		event
	);
}

function createSsoCallbackErrorMessage(error: unknown) {
	if (Error.isError(error) && error.name === 'AbortError') {
		return 'request-timeout';
	}
	if (Error.isError(error) && error.message.length > 0) {
		return error.message.slice(0, 160);
	}

	return getLogSafeErrorCode(error);
}

function checkSsoCallbackDispatchUrl(value: string) {
	const url = URL.parse(value);
	return (
		url !== null &&
		url.protocol === 'https:' &&
		url.username === '' &&
		url.password === '' &&
		url.hash === ''
	);
}

async function dispatchSsoCallback(
	record: TSsoCallbackQueue
): Promise<TSsoCallbackAttemptResult> {
	if (!checkSsoCallbackEvent(record.event)) {
		return { delivery: null, status: 'delete' };
	}

	const client = await getSsoClientByIdForCallback(record.client_id);
	if (client === null) {
		return { delivery: null, status: 'delete' };
	}
	if (
		!isSsoClientEvent(record.event) &&
		(!checkSsoClientEnabled(client) || client.deleted_at !== null)
	) {
		return { delivery: null, status: 'delete' };
	}

	const statusCallbackUrl = client.status_callback_url;
	if (statusCallbackUrl === null) {
		return { delivery: null, status: 'delete' };
	}
	if (!checkSsoCallbackDispatchUrl(statusCallbackUrl)) {
		return {
			delivery: {
				durationMs: null,
				error: 'blocked-callback-url',
				httpStatus: null,
			},
			message: 'blocked-callback-url',
			status: 'failed',
		};
	}

	// The first active secret is the callback signing key; remaining active secrets keep client-secret rotation compatible.
	const [signingSecret] = client.secret_hashes;
	if (signingSecret === undefined) {
		return {
			delivery: {
				durationMs: null,
				error: 'server-misconfigured',
				httpStatus: null,
			},
			message: 'server-misconfigured',
			status: 'failed',
		};
	}

	const body = JSON.stringify(createSsoCallbackBody(record));
	const signingTimestamp = Date.now();
	const signature = createSsoCallbackSignature(
		signingSecret,
		signingTimestamp,
		body
	);
	const abortController = new AbortController();
	const timeoutId = globalThis.setTimeout(() => {
		abortController.abort();
	}, SSO_CALLBACK_TIMEOUT_MS);
	const startedAt = Date.now();
	let response: Response;
	try {
		response = await fetch(statusCallbackUrl, {
			body,
			headers: {
				'Content-Type': FILE_TYPE_JSON,
				'User-Agent': SSO_CALLBACK_USER_AGENT,
				'X-Sso-Signature': `t=${signingTimestamp},v1=${signature}`,
			},
			method: 'POST',
			redirect: 'manual',
			signal: abortController.signal,
		});
	} catch (error) {
		const message = createSsoCallbackErrorMessage(error);

		return {
			delivery: {
				durationMs: Date.now() - startedAt,
				error: message,
				httpStatus: null,
			},
			message,
			status: 'failed',
		};
	} finally {
		globalThis.clearTimeout(timeoutId);
	}
	const durationMs = Date.now() - startedAt;

	return response.ok
		? {
				delivery: {
					durationMs,
					error: null,
					httpStatus: response.status,
				},
				status: 'delete',
			}
		: {
				delivery: {
					durationMs,
					error: `http-${response.status}`,
					httpStatus: response.status,
				},
				message: `http-${response.status}`,
				status: 'failed',
			};
}

async function writeSsoCallbackDeliveryBestEffort(
	record: TSsoCallbackQueue,
	status: TSsoCallbackDeliveryStatus,
	attempt: ISsoCallbackDeliveryAttempt,
	attemptNumber: number,
	now = Date.now()
) {
	try {
		await writeSsoCallbackDelivery(
			record,
			{
				attempt: attemptNumber,
				durationMs: attempt.durationMs,
				error: attempt.error,
				httpStatus: attempt.httpStatus,
				status,
			},
			now
		);
	} catch (error) {
		console.warn('Failed to write SSO callback delivery history.', {
			errorCode: getLogSafeErrorCode(error),
		});
	}
}

async function cleanupSsoCallbackDeliveriesBestEffort(now = Date.now()) {
	if (
		now - lastSsoCallbackDeliveryCleanupAt <
		SSO_CALLBACK_DELIVERY_CLEANUP_INTERVAL_MS
	) {
		return;
	}

	lastSsoCallbackDeliveryCleanupAt = now;
	try {
		await cleanupSsoCallbackDeliveries({
			before: now - SSO_CALLBACK_DELIVERY_RETENTION_MS,
			maxRows: SSO_CALLBACK_DELIVERY_MAX_ROWS,
		});
	} catch (error) {
		console.warn('Failed to clean up SSO callback delivery history.', {
			errorCode: getLogSafeErrorCode(error),
		});
	}
}

async function cleanupSsoCallbackFailedQueueBestEffort(now = Date.now()) {
	if (
		now - lastSsoCallbackFailedQueueCleanupAt <
		SSO_CALLBACK_FAILED_QUEUE_CLEANUP_INTERVAL_MS
	) {
		return 0;
	}

	lastSsoCallbackFailedQueueCleanupAt = now;
	try {
		const result = await cleanupFinalFailedSsoCallbackQueue({
			before: now - SSO_CALLBACK_FAILED_QUEUE_RETENTION_MS,
			maxRows: SSO_CALLBACK_FAILED_QUEUE_MAX_ROWS,
		});

		return result.deletedByAge + result.deletedByCap;
	} catch (error) {
		console.warn('Failed to clean up final failed SSO callbacks.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return 0;
	}
}

async function claimSsoCallbackQueueRecord(
	record: TSsoCallbackQueue,
	now: number
) {
	const db = await getAccountDatabase();
	const leaseExpiresAt = now + SSO_CALLBACK_CLAIM_LEASE_MS;
	const leaseToken = randomBytes(16).toString('base64url');
	const result = await db
		.updateTable(CALLBACK_QUEUE_TABLE_NAME)
		.set({ lease_expires_at: leaseExpiresAt, lease_token: leaseToken })
		.where('id', '=', record.id)
		.where('generation', '=', record.generation)
		.where('next_retry_at', '=', record.next_retry_at)
		.where((eb) =>
			eb.or([
				eb('lease_expires_at', 'is', null),
				eb('lease_expires_at', '<=', now),
			])
		)
		.executeTakeFirst();

	return result.numUpdatedRows === 1n ? { leaseExpiresAt, leaseToken } : null;
}

async function markSsoCallbackFailed(
	record: TSsoCallbackQueue,
	errorMessage: string,
	nextAttempts: number,
	now: number,
	leaseToken: string,
	leaseExpiresAt: number
) {
	const db = await getAccountDatabase();
	const isFinalFailed = nextAttempts >= SSO_CALLBACK_MAX_ATTEMPTS;
	const nextRetryAt = isFinalFailed
		? SSO_CALLBACK_FINAL_FAILURE_NEXT_RETRY_AT
		: now + getSsoCallbackRetryDelayMs(nextAttempts);

	const result = await db
		.updateTable(CALLBACK_QUEUE_TABLE_NAME)
		.set({
			attempts: nextAttempts,
			last_error: errorMessage,
			lease_expires_at: null,
			lease_token: null,
			next_retry_at: nextRetryAt,
		})
		.where('id', '=', record.id)
		.where('generation', '=', record.generation)
		.where('lease_token', '=', leaseToken)
		.where('lease_expires_at', '=', leaseExpiresAt)
		.executeTakeFirst();
	if (result.numUpdatedRows !== 1n) {
		return null;
	}

	return isFinalFailed;
}

async function deleteSsoCallbackQueueRecord(
	id: TSsoCallbackQueue['id'],
	generation: TSsoCallbackQueue['generation'],
	leaseToken: string,
	leaseExpiresAt: number
) {
	const db = await getAccountDatabase();

	const result = await db
		.deleteFrom(CALLBACK_QUEUE_TABLE_NAME)
		.where('id', '=', id)
		.where('generation', '=', generation)
		.where('lease_token', '=', leaseToken)
		.where('lease_expires_at', '=', leaseExpiresAt)
		.executeTakeFirst();

	return result.numDeletedRows === 1n;
}

export async function dispatchSsoCallbacks(
	limit = SSO_CALLBACK_DISPATCH_LIMIT
): Promise<ISsoCallbackDispatchResult> {
	const db = await getAccountDatabase();
	const now = Date.now();
	const records = await db
		.selectFrom(CALLBACK_QUEUE_TABLE_NAME)
		.selectAll()
		.where('next_retry_at', '<=', now)
		.where('attempts', '>=', 0)
		.where('attempts', '<', SSO_CALLBACK_MAX_ATTEMPTS)
		.where('generation', '>=', 0)
		.where('generation', '<', Number.MAX_SAFE_INTEGER)
		.where((eb) =>
			eb.or([
				eb('lease_expires_at', 'is', null),
				eb('lease_expires_at', '<=', now),
			])
		)
		.orderBy('next_retry_at', 'asc')
		.orderBy('id', 'asc')
		.limit(Math.min(Math.max(1, limit), SSO_CALLBACK_DISPATCH_LIMIT))
		.execute();

	let failed = 0;
	let finalFailed = 0;
	let succeeded = 0;

	for (const record of records) {
		if (
			!isNonNegativeSafeInteger(record.attempts) ||
			record.attempts >= SSO_CALLBACK_MAX_ATTEMPTS
		) {
			continue;
		}
		const nextAttempts = record.attempts + 1;
		const claimNow = Date.now();
		const lease = await claimSsoCallbackQueueRecord(record, claimNow);
		if (lease === null) {
			continue;
		}

		try {
			const result = await dispatchSsoCallback(record);
			if (result.status === 'delete') {
				if (result.delivery !== null) {
					await writeSsoCallbackDeliveryBestEffort(
						record,
						'succeeded',
						result.delivery,
						nextAttempts
					);
				}
				if (
					!(await deleteSsoCallbackQueueRecord(
						record.id,
						record.generation,
						lease.leaseToken,
						lease.leaseExpiresAt
					))
				) {
					continue;
				}
				succeeded++;
				continue;
			}

			const failedAt = Date.now();
			await writeSsoCallbackDeliveryBestEffort(
				record,
				nextAttempts >= SSO_CALLBACK_MAX_ATTEMPTS
					? 'final_failed'
					: 'failed',
				result.delivery,
				nextAttempts,
				failedAt
			);
			const isFinalFailed = await markSsoCallbackFailed(
				record,
				result.message,
				nextAttempts,
				failedAt,
				lease.leaseToken,
				lease.leaseExpiresAt
			);
			if (isFinalFailed === null) {
				continue;
			}
			if (isFinalFailed) {
				finalFailed++;
			} else {
				failed++;
			}
		} catch (error) {
			const errorMessage = createSsoCallbackErrorMessage(error);
			const failedAt = Date.now();
			await writeSsoCallbackDeliveryBestEffort(
				record,
				nextAttempts >= SSO_CALLBACK_MAX_ATTEMPTS
					? 'final_failed'
					: 'failed',
				{ durationMs: null, error: errorMessage, httpStatus: null },
				nextAttempts,
				failedAt
			);
			const isFinalFailed = await markSsoCallbackFailed(
				record,
				errorMessage,
				nextAttempts,
				failedAt,
				lease.leaseToken,
				lease.leaseExpiresAt
			);
			if (isFinalFailed === null) {
				continue;
			}
			if (isFinalFailed) {
				finalFailed++;
			} else {
				failed++;
			}
		}
	}

	if (records.length > 0) {
		await cleanupSsoCallbackDeliveriesBestEffort(Date.now());
	}
	const deletedFinalFailedCallbacks =
		await cleanupSsoCallbackFailedQueueBestEffort(Date.now());

	return {
		deleted_final_failed_callbacks: deletedFinalFailedCallbacks,
		failed,
		final_failed: finalFailed,
		succeeded,
	};
}
