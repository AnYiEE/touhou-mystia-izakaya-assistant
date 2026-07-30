export function getHeaderOrigin(value: string | null) {
	if (value === null) {
		return null;
	}

	try {
		return new URL(value).origin;
	} catch {
		return null;
	}
}
