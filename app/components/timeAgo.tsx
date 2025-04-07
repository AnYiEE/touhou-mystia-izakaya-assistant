import {type ElementRef, forwardRef, memo, useEffect, useState} from 'react';

function formatTimeAgo(pastTimestamp: number, nowTimestamp = Date.now()) {
	const diff = nowTimestamp - pastTimestamp;

	const minutes = Math.floor(diff / (1000 * 60));
	const hours = Math.floor(diff / (1000 * 60 * 60));
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (days > 0) {
		return `${days}天前`;
	} else if (hours > 0) {
		return `${hours}小时前`;
	} else if (minutes > 0) {
		return `${minutes}分钟前`;
	}

	return '刚刚';
}

interface IProps extends HTMLSpanElementAttributes {
	timestamp: number;
}

export default memo(
	forwardRef<ElementRef<'span'>, IProps>(function TimeAgo({timestamp, ...props}, ref) {
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

		return (
			<span {...props} ref={ref}>
				{timeAgo}
			</span>
		);
	})
);
