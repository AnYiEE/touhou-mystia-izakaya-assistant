export const APP_SECRET_MIN_BYTE_LENGTH = 32;
export const SERVER_MISCONFIGURED_MESSAGE = 'server-misconfigured';

export function checkAppSecret(secret: string | undefined): secret is string {
	return (
		typeof secret === 'string' &&
		Buffer.byteLength(secret, 'utf8') >= APP_SECRET_MIN_BYTE_LENGTH
	);
}
