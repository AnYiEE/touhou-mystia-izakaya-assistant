'use server';

import { DELETE, GET } from '@/api/v1/backups/[code]/route';
import { GET as getMetadata } from '@/api/v1/backups/[code]/metadata/route';
import { POST } from '@/api/v1/backups/route';
import type {
	IBackupCheckSuccessResponse,
	IBackupUploadBody,
	IBackupUploadSuccessResponse,
} from '@/api/v1/backups/types';
import { type TAccountActionResult } from '@/lib/account/actions/utils';
import { createCurrentRequest } from '@/lib/account/server/currentRequest';
import { FILE_TYPE_JSON } from '@/utilities';

export type TLegacyBackupActionResult<TData = Record<string, unknown>> =
	TAccountActionResult<TData>;

async function readLegacyBackupActionResult(response: Response) {
	if (!response.ok) {
		return response
			.text()
			.catch(() => '')
			.then((text) => {
				let message = response.statusText || 'Unknown error';
				let data: Record<string, unknown> | undefined;

				try {
					const json: unknown = JSON.parse(text);
					if (
						json !== null &&
						!Array.isArray(json) &&
						typeof json === 'object'
					) {
						const record = json as Record<string, unknown>;
						if (typeof record['message'] === 'string') {
							message = record['message'];
						}
						data = record;
					}
				} catch {
					const trimmedText = text.trim();
					if (trimmedText.length > 0) {
						message = trimmedText;
					}
				}

				return {
					...(data === undefined ? {} : { data }),
					httpStatus: response.status,
					message,
					status: 'error' as const,
				};
			});
	}

	return response
		.json()
		.catch(() => null)
		.then((json: unknown): TLegacyBackupActionResult<unknown> => {
			if (
				json !== null &&
				!Array.isArray(json) &&
				typeof json === 'object' &&
				'data' in json &&
				'status' in json &&
				json.status === 'ok'
			) {
				return { data: json.data, status: 'ok' };
			}

			return { data: json, status: 'ok' };
		});
}

export async function fetchLegacyBackupMetadataAction(
	code: string
): Promise<TLegacyBackupActionResult<IBackupCheckSuccessResponse>> {
	const request = await createCurrentRequest(
		`/api/v1/backups/${encodeURIComponent(code)}/metadata`
	);
	const response = await getMetadata(request, {
		params: Promise.resolve({ code }),
	});

	return readLegacyBackupActionResult(response) as Promise<
		TLegacyBackupActionResult<IBackupCheckSuccessResponse>
	>;
}

export async function deleteLegacyBackupAction(
	code: string
): Promise<TLegacyBackupActionResult> {
	const request = await createCurrentRequest(
		`/api/v1/backups/${encodeURIComponent(code)}`,
		{ method: 'DELETE' }
	);
	const response = await DELETE(request, {
		params: Promise.resolve({ code }),
	});

	return readLegacyBackupActionResult(
		response
	) as Promise<TLegacyBackupActionResult>;
}

export async function downloadLegacyBackupAction<TData>(
	code: string
): Promise<TLegacyBackupActionResult<TData>> {
	const request = await createCurrentRequest(
		`/api/v1/backups/${encodeURIComponent(code)}`
	);
	const response = await GET(request, { params: Promise.resolve({ code }) });

	return readLegacyBackupActionResult(response) as Promise<
		TLegacyBackupActionResult<TData>
	>;
}

export async function uploadLegacyBackupAction(
	body: IBackupUploadBody
): Promise<TLegacyBackupActionResult<IBackupUploadSuccessResponse>> {
	const request = await createCurrentRequest('/api/v1/backups', {
		body: JSON.stringify(body),
		headers: { 'Content-Type': FILE_TYPE_JSON },
		method: 'POST',
	});
	const response = await POST(request);

	return readLegacyBackupActionResult(response) as Promise<
		TLegacyBackupActionResult<IBackupUploadSuccessResponse>
	>;
}
