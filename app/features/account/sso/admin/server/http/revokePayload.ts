export interface IAdminSsoRevokeBody {
	reason?: string;
}

export function parseAdminSsoRevokeBody(
	value: unknown
): IAdminSsoRevokeBody | null {
	if (value === null || value === undefined) {
		return {};
	}
	if (typeof value !== 'object') {
		return null;
	}

	const reason = Object.getOwnPropertyDescriptor(value, 'reason')
		?.value as unknown;
	if (reason !== undefined && typeof reason !== 'string') {
		return null;
	}

	return reason === undefined ? {} : { reason };
}
