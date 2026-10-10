'use client';

import { Image, type ImageProps } from '@heroui/image';
import { cn } from '@heroui/theme';
import { memo } from 'react';

import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import { catalogSharedMessages } from '@/features/catalog/shared/client/messages';

import { useI18n } from '@/shared/i18n/useI18n';

interface IProps extends Pick<
	ImageProps,
	'alt' | 'aria-hidden' | 'className' | 'src' | 'width'
> {}

export default memo<IProps>(function Tachie({
	alt,
	className,
	src,
	width,
	...props
}) {
	const isReducedMotion = useReducedMotion();
	const { t } = useI18n(catalogSharedMessages);

	return (
		<Image
			removeWrapper
			disableAnimation={isReducedMotion}
			draggable={false}
			alt={alt}
			src={src}
			width={width}
			aria-label={
				props['aria-hidden'] === true || props['aria-hidden'] === 'true'
					? undefined
					: t('catalog.tachieAlt', { name: alt ?? '' })
			}
			title={alt}
			className={cn('image-rendering-pixelated select-none', className)}
		/>
	);
});
