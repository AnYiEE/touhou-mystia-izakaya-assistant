import type { TFeatureAccessReason } from '@/domain/featureAccess/contracts';

export type TMapAssetFailureKind =
	| 'account-unavailable'
	| 'decode'
	| 'feature-access-denied'
	| 'invalid-response'
	| 'network'
	| 'not-found'
	| 'server'
	| 'unauthorized';

const ACCESS_FAILURE_KINDS: ReadonlySet<TMapAssetFailureKind> = new Set([
	'account-unavailable',
	'feature-access-denied',
	'unauthorized',
]);

interface IMapAssetLoadErrorOptions {
	cause?: unknown;
	kind: TMapAssetFailureKind;
	reason?: Exclude<TFeatureAccessReason, 'allowed'> | null;
	retryable?: boolean;
	status?: number;
}

export class MapAssetLoadError extends Error {
	readonly kind: TMapAssetFailureKind;
	readonly reason: Exclude<TFeatureAccessReason, 'allowed'> | null;
	readonly retryable: boolean;
	readonly status: number;

	constructor(
		message: string,
		{
			cause,
			kind,
			reason = null,
			retryable = false,
			status = 0,
		}: IMapAssetLoadErrorOptions
	) {
		super(message, { cause });
		this.name = 'MapAssetLoadError';
		this.kind = kind;
		this.reason = reason;
		this.retryable = retryable;
		this.status = status;
	}
}

export function checkMapAssetAccessFailure(
	error: unknown
): error is MapAssetLoadError {
	return (
		error instanceof MapAssetLoadError &&
		ACCESS_FAILURE_KINDS.has(error.kind)
	);
}

export function checkAbortError(error: unknown) {
	return error instanceof Error && error.name === 'AbortError';
}
