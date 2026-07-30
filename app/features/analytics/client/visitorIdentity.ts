import { accountStore } from '@/features/account/client/state/accountStore';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';

const anonymousVisitorIdAccessor = globalStore.persistence.userId;

export function readAnalyticsUserId() {
	if (accountStore.shared.isLoggedIn.get()) {
		return accountStore.shared.user.get()?.id ?? null;
	}

	return anonymousVisitorIdAccessor.get();
}

export function useAnonymousVisitorId() {
	return anonymousVisitorIdAccessor.use();
}

export function startAnonymousVisitorIdentityClient(
	loadVisitorId: () => Promise<string>
) {
	let isActive = true;

	if (anonymousVisitorIdAccessor.get() === null) {
		void loadVisitorId().then((visitorId) => {
			if (isActive) {
				anonymousVisitorIdAccessor.set(visitorId);
			}
		});
	}

	return () => {
		isActive = false;
	};
}
