'use client';

import { type CSSProperties, memo, useMemo, useState } from 'react';

import { useMounted } from '@/hooks';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE, cn } from '@/design/ui/components';

import { checkCompatibility } from '@/components/compatibleBrowser';
import PressElement, { type IPressProp } from '@/components/pressElement';

import { siteConfig } from '@/configs';
import { type TItemName } from '@/data';
import { remToPx } from '@/utilities';
import { Sprite as SpriteClass } from '@/utils';
import type { TSpriteTarget } from '@/utils/sprite/types';

const { cdnUrl } = siteConfig;

const getSpriteStyle = (
	target: TSpriteTarget,
	isSupportedWebp?: boolean
): CSSProperties => {
	const basePath = `${cdnUrl}/assets/sprites`;

	return {
		backgroundImage: `url('${basePath}/${target}.${isSupportedWebp ? 'webp' : 'png'}')`,
	};
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
	const [isSupportedWebp, setIsSupportedWebp] = useState(true);

	useMounted(() => {
		setIsSupportedWebp(checkCompatibility().webp);
	});

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
			...getSpriteStyle(target, isSupportedWebp),
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
			isSupportedWebp,
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
				'inline-block',
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
