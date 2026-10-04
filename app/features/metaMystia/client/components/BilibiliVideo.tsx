'use client';

import { memo } from 'react';

import Link from '@/design/ui/components/link';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import {
	getBilibiliPlayerUrl,
	getBilibiliVideoUrl,
} from '@/features/metaMystia/links';

interface IProps {
	aid: string;
	title: string;
}

export default memo<IProps>(function BilibiliVideo({ aid, title }) {
	return (
		<figure className="flex h-full flex-col gap-3 rounded-large bg-content1 p-3 shadow-small">
			<iframe
				allowFullScreen
				allow="autoplay; fullscreen"
				loading="lazy"
				sandbox="allow-popups allow-presentation allow-same-origin allow-scripts"
				src={getBilibiliPlayerUrl(aid)}
				title={title}
				className="aspect-video w-full rounded-medium bg-content2"
			/>
			<figcaption className="px-1">
				<Link
					isExternal
					animationUnderline={false}
					href={getBilibiliVideoUrl(aid)}
					title={`在哔哩哔哩观看：${title}`}
					onPress={() => {
						trackEvent(
							trackEvent.category.click,
							'Link',
							`meta-mystia:Video av${aid}`
						);
					}}
					className="rounded-small text-small"
				>
					{title}
				</Link>
			</figcaption>
		</figure>
	);
});
