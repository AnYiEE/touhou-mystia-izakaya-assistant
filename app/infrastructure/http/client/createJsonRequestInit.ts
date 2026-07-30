import { FILE_TYPE_JSON } from '@/infrastructure/http/mediaTypes';

export function createJsonRequestInit(
	method: string,
	body?: unknown,
	csrfToken?: string
) {
	const init: RequestInit = {
		headers: {
			'Content-Type': FILE_TYPE_JSON,
			...(csrfToken === undefined ? {} : { 'X-CSRF-Token': csrfToken }),
		},
		method,
	};
	if (body !== undefined) {
		init.body = JSON.stringify(body);
	}

	return init;
}
