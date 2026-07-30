export const FILE_TYPE_JSON = 'application/json';

export function normalizeMediaType(contentType: string | null | undefined) {
	return contentType?.split(';', 1)[0]?.trim().toLowerCase() ?? null;
}
