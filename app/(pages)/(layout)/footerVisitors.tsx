'use client';

import {memo, useCallback, useEffect, useState} from 'react';

import {ping} from '@/components/analytics';

import {siteConfig} from '@/configs';

const {isAnalytics, isOffline, isSelfHosted} = siteConfig;

interface IProps {}

export default memo<IProps>(function FooterVisitors() {
	const [visitors, setVisitors] = useState<number | null>(null);

	const fetchVisitors = useCallback(() => {
		const setFailed = () => {
			setVisitors(-1);
		};

		fetch('/api/real-time-visitors', {
			cache: 'no-cache',
		})
			.then((response) => {
				if (response.ok) {
					void response.json().then((data) => {
						setVisitors(data.visitors as number);
					});
				} else {
					setFailed();
				}
			})
			.catch(setFailed);
	}, []);

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

	if (isOffline || !isAnalytics || !isSelfHosted) {
		return null;
	} else if (visitors === null) {
		return <span>正在获取在线人数</span>;
	} else if (visitors === -1) {
		return <span>获取在线人数失败</span>;
	}

	return <span>实时{visitors}人在线</span>;
});
