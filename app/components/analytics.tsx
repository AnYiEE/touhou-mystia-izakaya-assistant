'use client';

import {memo, useEffect} from 'react';

import {siteConfig} from '@/configs';
import {setScriptUrlTag} from '@/utils';

const {domain} = siteConfig;

export default memo(function Analytics() {
	// cSpell:ignore sukiu
	const trackerBaseUrl = '//track.sukiu.net';
	const siteId = 11;

	useEffect(() => {
		window._paq = [] as unknown as typeof window._paq;
		const {_paq} = window;

		_paq.push(
			['enableLinkTracking'],
			['setCookieDomain', `*.${domain}`],
			['setDomains', [`*.${domain}`]],
			['setTrackerUrl', `${trackerBaseUrl}/track.php`],
			['setSiteId', siteId.toString()],
			['setSecureCookie', true]
		);

		setScriptUrlTag('/track.js', 'async', true)
			.then(() => {
				// eslint-disable-next-line unicorn/consistent-destructuring
				window._paq.push(['setCustomUrl', location.href], ['trackPageView']);
				console.info('Analytics load succeeded.');
			})
			.catch(() => {
				console.info('Analytics load failed.');
			});
	}, []);

	return null;
});
