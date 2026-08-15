import isNil from 'lodash/isNil.js';
import { type NextRequest } from 'next/server';

import { MAX_ACCOUNT_JSON_BODY_BYTES } from '@/features/account/requestLimits';
import { checkAdminRequest } from '@/features/admin/server/http/requestGuard';

import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
import { getRequestAuditContext } from '@/infrastructure/http/server/requestContext';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	readJsonBodyResult,
} from '@/infrastructure/http/server/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IUpdateSecretBody {
	disabled?: boolean;
	label?: string | null;
}

function parseUpdateSecretBody(value: unknown): IUpdateSecretBody | null {
	if (isNil(value)) {
		return {};
	}
	if (typeof value !== 'object') {
		return null;
	}

	const disabled = Object.getOwnPropertyDescriptor(value, 'disabled')
		?.value as unknown;
	const label = Object.getOwnPropertyDescriptor(value, 'label')
		?.value as unknown;
	if (disabled !== undefined && typeof disabled !== 'boolean') {
		return null;
	}
	if (label !== undefined && label !== null && typeof label !== 'string') {
		return null;
	}

	return {
		...(disabled === undefined ? {} : { disabled }),
		...(label === undefined ? {} : { label }),
	};
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; secretId: string }> }
) {
	const { id, secretId } = await params;
	const check = await checkAdminRequest(
		request,
		'admin-update-sso-client-secret',
		{
			csrf: true,
			parts: [
				{ name: 'client', value: id },
				{ name: 'secret', value: secretId },
			],
		}
	);
	if (check.status === 'error') {
		return check.response;
	}

	const bodyResult = await readJsonBodyResult<IUpdateSecretBody>(
		request,
		MAX_ACCOUNT_JSON_BODY_BYTES
	);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.payloadTooLarge,
			413
		);
	}
	const body = parseUpdateSecretBody(
		bodyResult.status === 'ok' ? bodyResult.data : null
	);
	if (body === null) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}

	const serviceModule =
		await import('@/features/account/sso/admin/server/services/clientSecretService');
	const result = await serviceModule.updateAdminSsoClientSecret(
		id,
		secretId,
		{
			adminId: check.auth.actorId,
			...body,
			...getRequestAuditContext(request),
		}
	);
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			serviceModule.ADMIN_SSO_CLIENT_SECRET_SERVICE_ERROR_STATUS_MAP[
				result.error
			]
		);
	}

	return createNoStoreJsonResponse(result.data);
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; secretId: string }> }
) {
	const { id, secretId } = await params;
	const check = await checkAdminRequest(
		request,
		'admin-revoke-sso-client-secret',
		{
			csrf: true,
			parts: [
				{ name: 'client', value: id },
				{ name: 'secret', value: secretId },
			],
		}
	);
	if (check.status === 'error') {
		return check.response;
	}

	const serviceModule =
		await import('@/features/account/sso/admin/server/services/clientSecretService');
	const result = await serviceModule.revokeAdminSsoClientSecret(
		id,
		secretId,
		{ adminId: check.auth.actorId, ...getRequestAuditContext(request) }
	);
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			serviceModule.ADMIN_SSO_CLIENT_SECRET_SERVICE_ERROR_STATUS_MAP[
				result.error
			]
		);
	}

	return createNoStoreJsonResponse(result.data);
}
