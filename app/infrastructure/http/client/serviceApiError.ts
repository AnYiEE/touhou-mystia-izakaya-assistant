export class ServiceApiError<TData = unknown> extends Error {
	readonly data: TData | undefined;
	readonly retryAfter: number | null;
	readonly status: number;

	constructor({
		data,
		message,
		retryAfter,
		status,
	}: {
		data?: TData;
		message: string;
		retryAfter?: number | null;
		status: number;
	}) {
		super(message);
		this.name = 'ServiceApiError';
		this.data = data;
		this.retryAfter = retryAfter ?? null;
		this.status = status;
	}
}

export function readServiceApiErrorData(error: ServiceApiError) {
	const data =
		error.data !== null &&
		!Array.isArray(error.data) &&
		typeof error.data === 'object'
			? { ...(error.data as Record<string, unknown>) }
			: undefined;
	if (error.retryAfter !== null) {
		return { ...data, retry_after: error.retryAfter };
	}

	return data;
}
