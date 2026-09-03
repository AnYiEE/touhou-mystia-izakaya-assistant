import { type StateStorage } from 'zustand/middleware';

export function createVersionGuardedStateStorage({
	currentVersion,
	storage,
}: {
	currentVersion: number;
	storage: StateStorage;
}): StateStorage {
	const blockedNames = new Set<string>();
	let refreshRequested = false;

	const requestPageRefresh = () => {
		// eslint-disable-next-line unicorn/prefer-global-this
		if (refreshRequested || typeof window === 'undefined') {
			return;
		}
		refreshRequested = true;
		setTimeout(() => {
			location.reload();
		}, 0);
	};

	return {
		async getItem(name) {
			const value = await storage.getItem(name);
			if (value === null) {
				return null;
			}

			try {
				const envelope: unknown = JSON.parse(value);
				if (
					typeof envelope === 'object' &&
					envelope !== null &&
					'version' in envelope
				) {
					const { version } = envelope as { version?: unknown };
					if (
						typeof version === 'number' &&
						Number.isSafeInteger(version) &&
						version > currentVersion
					) {
						blockedNames.add(name);
						requestPageRefresh();
						return null;
					}
					blockedNames.delete(name);
					return value;
				}
			} catch {
				/* empty */
			}

			return value;
		},

		async setItem(name, value) {
			if (blockedNames.has(name)) {
				return;
			}
			await storage.setItem(name, value);
		},

		async removeItem(name) {
			if (blockedNames.has(name)) {
				return;
			}
			await storage.removeItem(name);
		},
	};
}
