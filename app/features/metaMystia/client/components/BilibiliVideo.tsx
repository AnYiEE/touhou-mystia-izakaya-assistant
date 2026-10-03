'use client';

import { faCirclePlay } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { memo, useEffect, useRef, useState } from 'react';

import Button from '@/design/ui/components/button';
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

/** Shows a play placeholder and only inserts the Bilibili player after the viewer presses it. */
export default memo<IProps>(function BilibiliVideo({ aid, title }) {
	const [isPlayerLoaded, setIsPlayerLoaded] = useState(false);
	const playerRef = useRef<HTMLIFrameElement>(null);

	useEffect(() => {
		if (isPlayerLoaded) {
			playerRef.current?.focus();
		}
	}, [isPlayerLoaded]);

	return (
		<figure className="flex flex-col gap-2">
			{isPlayerLoaded ? (
				<iframe
					ref={playerRef}
					allowFullScreen
					allow="autoplay; fullscreen"
					sandbox="allow-popups allow-presentation allow-same-origin allow-scripts"
					src={getBilibiliPlayerUrl(aid)}
					title={title}
					className="aspect-video w-full rounded-large bg-content2"
				/>
			) : (
				<Button
					aria-label={`播放视频：${title}`}
					variant="flat"
					onPress={() => {
						setIsPlayerLoaded(true);
					}}
					className="aspect-video h-auto w-full flex-col gap-2 rounded-large"
				>
					<FontAwesomeIcon icon={faCirclePlay} className="text-4xl" />
					<span className="text-small">点击播放</span>
				</Button>
			)}
			<figcaption>
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
