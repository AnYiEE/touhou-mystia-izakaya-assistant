'use client';

import { memo, useEffect, useState } from 'react';

import { type TUiMessageKey, uiMessages } from '@/design/ui/messages';

import { type TMessageParams } from '@/shared/i18n/messages';
import { useI18n } from '@/shared/i18n/useI18n';

type TFormatMessage = (key: TUiMessageKey, params?: TMessageParams) => string;

function formatTimeAgo(
	t: TFormatMessage,
	pastTimestamp: number,
	nowTimestamp = Date.now()
) {
	const diff = nowTimestamp - pastTimestamp;

	const minutes = Math.floor(diff / (1000 * 60));
	const hours = Math.floor(diff / (1000 * 60 * 60));
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (days > 0) {
		return t('ui.timeAgo.days', { days });
	} else if (hours > 0) {
		return t('ui.timeAgo.hours', { hours });
	} else if (minutes > 0) {
		return t('ui.timeAgo.minutes', { minutes });
	}

	return t('ui.timeAgo.justNow');
}

interface IProps extends HTMLSpanElementAttributes, RefProps<HTMLSpanElement> {
	initialNowTimestamp?: number;
	timestamp: number;
}

export default memo<IProps>(function TimeAgo({
	initialNowTimestamp,
	timestamp,
	...props
}) {
	const { t } = useI18n(uiMessages);
	const [timeAgo, setTimeAgo] = useState(() =>
		initialNowTimestamp === undefined
			? ''
			: formatTimeAgo(t, timestamp, initialNowTimestamp)
	);

	useEffect(() => {
		const update = () => {
			setTimeAgo(formatTimeAgo(t, timestamp));
		};

		update();

		const interval = setInterval(update, 60 * 1000);

		return () => {
			clearInterval(interval);
		};
	}, [t, timestamp]);

	return <span {...props}>{timeAgo}</span>;
});
