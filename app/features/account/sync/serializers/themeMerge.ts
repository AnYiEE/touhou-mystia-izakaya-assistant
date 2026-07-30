export function mergeThemeSnapshots<T>({
	base,
	cloud,
	defaultSnapshot,
	local,
}: {
	base: T | null;
	cloud: T | null;
	defaultSnapshot: T;
	local: T;
}) {
	if (cloud === null) {
		return {
			conflict: null,
			data: local,
			requiresConfirmation: false,
			shouldUpload: local !== defaultSnapshot,
		};
	}
	if (cloud === local) {
		return {
			conflict: null,
			data: cloud,
			requiresConfirmation: false,
			shouldUpload: false,
		};
	}
	if (base !== null && cloud === base && local !== base) {
		return {
			conflict: null,
			data: local,
			requiresConfirmation: false,
			shouldUpload: true,
		};
	}

	return {
		conflict: null,
		data: cloud,
		requiresConfirmation: false,
		shouldUpload: false,
	};
}
