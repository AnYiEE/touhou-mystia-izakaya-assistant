'use client';

import { faRotate } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { useInView } from 'framer-motion';
import { type MouseEvent, memo, useCallback, useRef } from 'react';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';

import { useMapAsset } from '@/features/maps/client/assets/MapAssetContext';
import { mapsMessages } from '@/features/maps/client/messages';

import { useI18n } from '@/shared/i18n/useI18n';

interface IProps {
	className?: string;
	src: string;
}

export default memo<IProps>(function LazyMapAssetImage({ className, src }) {
	const { t } = useI18n(mapsMessages);
	const rootRef = useRef<HTMLSpanElement>(null);
	const isInView = useInView(rootRef, { margin: '128px', once: true });
	const asset = useMapAsset(isInView ? src : null);
	const retryAsset = asset.retry;

	const handleRetry = useCallback(
		(event: MouseEvent<HTMLButtonElement>) => {
			event.preventDefault();
			event.stopPropagation();
			retryAsset();
		},
		[retryAsset]
	);

	return (
		<span
			ref={rootRef}
			className={cn(
				'image-rendering-pixelated relative block h-full w-full overflow-hidden bg-default-200',
				className
			)}
		>
			{asset.objectUrl === null ? (
				<span
					aria-hidden
					className={cn(
						'block h-full w-full bg-default-200',
						(asset.status === 'queued' ||
							asset.status === 'loading') &&
							'animate-pulse motion-reduce:animate-none'
					)}
				/>
			) : (
				// eslint-disable-next-line @next/next/no-img-element -- Object URLs cannot be represented by next/image.
				<img
					alt=""
					decoding="async"
					src={asset.objectUrl}
					className="block h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
				/>
			)}
			{asset.status === 'error' && (
				<button
					aria-label={t('maps.asset.retry')}
					title={t('maps.asset.error')}
					type="button"
					onClick={handleRetry}
					className={cn(
						'pointer-events-auto absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white shadow-md',
						CLASSNAME_FOCUS_VISIBLE_OUTLINE
					)}
				>
					<FontAwesomeIcon icon={faRotate} />
				</button>
			)}
		</span>
	);
});
