const textEncoder = new TextEncoder();

export type TAccountActionResult<TData = Record<string, unknown>> =
	| { data: TData; status: 'ok' }
	| {
			data?: Record<string, unknown>;
			httpStatus: number;
			message: string;
			status: 'error';
	  };

export function createAccountActionError(
	message: string,
	httpStatus: number,
	data?: Record<string, unknown>
): Extract<TAccountActionResult, { status: 'error' }> {
	return data === undefined
		? { httpStatus, message, status: 'error' }
		: { data, httpStatus, message, status: 'error' };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && !Array.isArray(value) && typeof value === 'object';
}

export function stringifyActionJsonBody(body: unknown, maxBytes: number) {
	let text: string | undefined;
	try {
		text = JSON.stringify(body);
	} catch {
		return { status: 'invalid' as const };
	}
	if (typeof text !== 'string') {
		return { status: 'invalid' as const };
	}
	if (textEncoder.encode(text).byteLength > maxBytes) {
		return { status: 'payload-too-large' as const };
	}

	return { status: 'ok' as const, text };
}
