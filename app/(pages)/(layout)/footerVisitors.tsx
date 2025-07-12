'use client';

import {memo, useEffect, useState} from 'react';

import {ping} from '@/components/analytics';

interface IProps {
	initialVisitors: number;
}

export default memo<IProps>(function FooterVisitors({initialVisitors}) {
	const [visitors, setVisitors] = useState(initialVisitors);

	useEffect(() => {
		if (visitors === -1) {
			return;
		}

		const updateVisitors = () => {
			ping();
			fetch('/api/real-time-visitors', {
				cache: 'no-cache',
			})
				.then((response) => {
					if (response.ok) {
						void response.json().then((data) => {
							setVisitors(data.visitors as number);
						});
					}
				})
				.catch(() => {});
		};

		const intervalId = setInterval(updateVisitors, 30 * 1000);

		return () => {
			clearInterval(intervalId);
		};
	}, [visitors]);

	if (visitors === -1) {
		return null;
	}

	return <span>实时{visitors}人在线</span>;
});
