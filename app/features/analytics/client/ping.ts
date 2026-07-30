import { pushWithAnalyticsUserId } from './matomoQueue';

export function ping() {
	pushWithAnalyticsUserId((tracker) => {
		tracker.ping();
	});
}
