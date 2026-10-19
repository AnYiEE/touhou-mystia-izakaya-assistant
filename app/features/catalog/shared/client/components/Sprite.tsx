'use client';

import { cn } from '@heroui/theme';
import { type CSSProperties, memo, useMemo } from 'react';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import PressElement, {
	type IPressProp,
} from '@/design/ui/components/pressElement';

import { SPRITE_ASSET_HASHES } from '@/domain/data/sprites/assetHashes';
import type { TSpriteId, TSpriteTarget } from '@/domain/data/sprites/types';

import { Sprite as SpriteClass } from '@/features/catalog/presentation/SpriteModel';
import { useCatalogLocalizationRevision } from '@/features/catalog/shared/client/localization/catalogLocalizationRevision';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

import { DEFAULT_LOCALE } from '@/shared/i18n/locale';
import { useCurrentLocale } from '@/shared/i18n/useI18n';
import { remToPx } from '@/shared/utilities/cssUnits/remToPx';

const { cdnUrl } = PUBLIC_RUNTIME_CONFIG;

const getSpriteStyle = (target: TSpriteTarget): CSSProperties => {
	const basePath = `${cdnUrl}/assets/sprites/${target}/${SPRITE_ASSET_HASHES[target]}`;

	return { backgroundImage: `url('${basePath}/${target}.png')` };
};

type TSpriteIdentity<T extends TSpriteTarget> =
	| { index: number; recordId?: never }
	| { index?: never; recordId: TSpriteId<T> };

interface ISpriteBase<T extends TSpriteTarget> {
	height?: number;
	size?: number;
	target: T;
	width?: number;
}

type IProps<T extends TSpriteTarget = TSpriteTarget> =
	HTMLSpanElementAttributes &
		Partial<IPressProp<HTMLSpanElement>> &
		ISpriteBase<T> &
		RefProps<HTMLSpanElement> &
		TSpriteIdentity<T>;

function Sprite<T extends TSpriteTarget>({
	className,
	height,
	index,
	onClick,
	onKeyDown,
	onPress,
	recordId,
	role,
	size,
	style,
	tabIndex,
	target,
	title,
	width,
	...props
}: IProps<T>) {
	const catalogLocalizationRevision = useCatalogLocalizationRevision();
	const currentLocale = useCurrentLocale();

	const instance = SpriteClass.getInstance(target);

	const { calculatedIndex } = useMemo(() => {
		const _calculatedIndex =
			recordId === undefined ? index : instance.findIndexById(recordId);
		if (_calculatedIndex === undefined) {
			throw new TypeError('Sprite requires a recordId or index.');
		}

		return { calculatedIndex: _calculatedIndex };
	}, [index, instance, recordId]);

	const calculatedName = useMemo(() => {
		void catalogLocalizationRevision;
		return currentLocale === DEFAULT_LOCALE
			? instance.findNameByIndex(calculatedIndex)
			: instance.getDisplayPropsByIndex(calculatedIndex, 'name');
	}, [calculatedIndex, catalogLocalizationRevision, currentLocale, instance]);

	const { calculatedHeight, calculatedSize, calculatedWidth } =
		useMemo(() => {
			let _calculatedHeight = height ?? instance.spriteHeight;
			let _calculateWidth = width ?? instance.spriteWidth;
			let _calculateSize = size;

			if (_calculatedHeight === _calculateWidth) {
				_calculateSize ??= _calculatedHeight;
			}
			if (_calculateSize !== undefined) {
				_calculatedHeight = _calculateSize;
				_calculateWidth = _calculateSize;
			}

			return {
				calculatedHeight: _calculatedHeight,
				calculatedWidth: _calculateWidth,

				calculatedSize: remToPx(_calculateSize),
			};
		}, [height, instance.spriteHeight, instance.spriteWidth, size, width]);

	const calculatedStyle = useMemo(
		() => ({
			...getSpriteStyle(target),
			...instance.getBackgroundPropsByIndex(calculatedIndex, {
				displayHeight: calculatedSize ?? calculatedHeight,
				displayWidth: calculatedSize ?? calculatedWidth,
			}),
		}),
		[
			calculatedHeight,
			calculatedIndex,
			calculatedSize,
			calculatedWidth,
			instance,
			target,
		]
	);
	const mergedStyle = useMemo(
		() => ({ ...calculatedStyle, ...style }),
		[calculatedStyle, style]
	);

	const finalTitle = title ?? calculatedName;
	const isAsButton = role === 'button';

	return (
		<PressElement
			onClick={onClick}
			onKeyDown={onKeyDown}
			onPress={onPress}
			role={role ?? 'img'}
			tabIndex={tabIndex ?? (isAsButton ? 0 : undefined)}
			title={finalTitle}
			className={cn(
				'image-rendering-pixelated inline-block',
				{
					[CLASSNAME_FOCUS_VISIBLE_OUTLINE]: isAsButton,
					'cursor-pointer': isAsButton,
				},
				className
			)}
			style={mergedStyle}
			{...props}
		/>
	);
}

export default memo(Sprite) as typeof Sprite;

export type { IProps as ISpriteProps };
