'use client';

import FingerprintJS from '@fingerprintjs/fingerprintjs';

import { startAnonymousVisitorIdentityClient } from './client/visitorIdentity';

export { default as AnalyticsClient } from './client/AnalyticsClient';
export { ping } from './client/ping';
export { trackEvent } from './client/trackEvent';

export function startAnalyticsClient() {
	return startAnonymousVisitorIdentityClient(async () => {
		const fingerprintAgent = await FingerprintJS.load();
		const fingerprint = await fingerprintAgent.get();

		return fingerprint.visitorId;
	});
}
