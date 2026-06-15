'use client';

import { useCallback, useEffect, useState } from 'react';

import { ping } from '@/components/analytics';

import { siteConfig } from '@/configs';
import { createServiceApiUrl } from '@/lib/api/serviceClient';

const { isAnalytics, isOffline, isSelfHosted } = siteConfig;

const shouldSkip = isOffline || !isAnalytics || !isSelfHosted;

function readRetryAfter(response: Response) {
	const retryAfter = Number(response.headers.get('Retry-After'));

	return Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null;
}

export default function FooterVisitors() {
	const [visitors, setVisitors] = useState<number | null>(null);
	const [retryAt, setRetryAt] = useState(0);

	const fetchVisitors = useCallback(() => {
		if (shouldSkip) {
			return;
		}
		if (Date.now() < retryAt) {
			return;
		}

		const setFailed = () => {
			setVisitors(-1);
		};

		fetch(createServiceApiUrl('/api/v1/analytics/visitors'), {
			cache: 'no-cache',
			credentials: 'include',
		})
			.then((response) => {
				if (response.ok) {
					setRetryAt(0);
					void response
						.json()
						.then((json: { data: { visitors: number } }) => {
							setVisitors(json.data.visitors);
						});
				} else if (response.status === 429) {
					const retryAfter = readRetryAfter(response);
					if (retryAfter !== null) {
						setRetryAt(Date.now() + retryAfter * 1000);
					}
				} else {
					setFailed();
				}
			})
			.catch(setFailed);
	}, [retryAt]);

	useEffect(() => {
		fetchVisitors();

		const intervalId = setInterval(() => {
			ping();
			fetchVisitors();
		}, 30 * 1000);

		return () => {
			clearInterval(intervalId);
		};
	}, [fetchVisitors]);

	if (shouldSkip) {
		return null;
	} else if (visitors === null) {
		return <span>正在获取在线人数</span>;
	} else if (visitors === -1) {
		return <span>获取在线人数失败</span>;
	}

	return <span>实时{visitors}人在线</span>;
}
