export function createRetryAfterHeaders(retryAfter: number) {
	return { 'Retry-After': String(Math.max(0, retryAfter)) };
}
