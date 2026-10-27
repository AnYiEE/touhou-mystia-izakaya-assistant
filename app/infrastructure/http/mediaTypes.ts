export const FILE_TYPE_JSON = 'application/json';
export const FILE_TYPE_PNG = 'image/png';
export const FILE_TYPE_WEBP = 'image/webp';

export function normalizeMediaType(contentType: string | null | undefined) {
	return contentType?.split(';', 1)[0]?.trim().toLowerCase() ?? null;
}
