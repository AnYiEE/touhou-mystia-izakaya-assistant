'use client';

import { cn } from '@heroui/theme';
import { type CSSProperties, memo, useMemo } from 'react';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import PressElement, {
	type IPressProp,
} from '@/design/ui/components/pressElement';

import type { TSpriteTarget } from '@/domain/data/sprites/types';
import type { TItemName } from '@/domain/data/types';

import { Sprite as SpriteClass } from '@/features/catalog/presentation/SpriteModel';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

import { remToPx } from '@/shared/utilities/cssUnits/remToPx';

const { cdnUrl } = PUBLIC_RUNTIME_CONFIG;

const getSpriteStyle = (target: TSpriteTarget): CSSProperties => {
	const basePath = `${cdnUrl}/assets/sprites`;

	return { backgroundImage: `url('${basePath}/${target}.png')` };
};

interface ISpriteBase {
	target: TSpriteTarget;
	index?: number;
	name?: TItemName;
	size?: number;
	height?: number;
	width?: number;
}

interface IProps
	extends
		HTMLSpanElementAttributes,
		Partial<IPressProp<HTMLSpanElement>>,
		ISpriteBase,
		RefProps<HTMLSpanElement> {}

export default memo<IProps>(function Sprite({
	className,
	height,
	index,
	name,
	onClick,
	onKeyDown,
	onPress,
	role,
	size,
	style,
	tabIndex,
	target,
	title,
	width,
	...props
}) {
	const instance = SpriteClass.getInstance(target);

	const { calculatedIndex, calculatedName } = useMemo(() => {
		let _calculatedIndex = index;
		let _calculatedName = name;

		if (_calculatedIndex !== undefined) {
			_calculatedName = instance.findNameByIndex(_calculatedIndex);
		} else if (_calculatedName === undefined) {
			_calculatedIndex = 0;
		} else {
			_calculatedIndex = instance.findIndexByName(_calculatedName);
		}

		return {
			calculatedIndex: _calculatedIndex,
			calculatedName: _calculatedName,
		};
	}, [index, instance, name]);

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
			style={{ ...calculatedStyle, ...style }}
			{...props}
		/>
	);
});

export type { IProps as ISpriteProps };
