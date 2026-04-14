import { memo, useEffect, useState } from 'react';

import { tUI, tUIf } from '@/i18n';

function formatTimeAgo(pastTimestamp: number, nowTimestamp = Date.now()) {
	const diff = nowTimestamp - pastTimestamp;

	const minutes = Math.floor(diff / (1000 * 60));
	const hours = Math.floor(diff / (1000 * 60 * 60));
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (days > 0) {
		return tUIf('{count}天前', { count: String(days) });
	} else if (hours > 0) {
		return tUIf('{count}小时前', { count: String(hours) });
	} else if (minutes > 0) {
		return tUIf('{count}分钟前', { count: String(minutes) });
	}

	return tUI('刚刚');
}

interface IProps extends HTMLSpanElementAttributes, RefProps<HTMLSpanElement> {
	timestamp: number;
}

export default memo<IProps>(function TimeAgo({ timestamp, ...props }) {
	const [timeAgo, setTimeAgo] = useState('');

	useEffect(() => {
		const update = () => {
			setTimeAgo(formatTimeAgo(timestamp));
		};

		update();

		const interval = setInterval(update, 60 * 1000);

		return () => {
			clearInterval(interval);
		};
	}, [timestamp]);

	return <span {...props}>{timeAgo}</span>;
});
