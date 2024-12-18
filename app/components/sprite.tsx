'use client';

import {type CSSProperties, type ElementRef, forwardRef, memo, useEffect, useMemo, useState} from 'react';

import {cn} from '@nextui-org/react';

import {checkCompatibility} from '@/components/compatibleBrowser';
import PressElement, {type IPressProp} from '@/components/pressElement';

import {siteConfig} from '@/configs';
import {type TItemName} from '@/data';
import {Sprite as SpriteClass, remToPx} from '@/utils';
import type {TSpriteTarget} from '@/utils/sprite/types';

const {cdnUrl} = siteConfig;

const getSpriteStyle = (target: TSpriteTarget, isSupportedWebp?: boolean): CSSProperties => {
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

interface IProps extends ISpriteBase, HTMLSpanElementAttributes, Partial<IPressProp<HTMLSpanElement>> {}

export default memo(
	forwardRef<ElementRef<'span'>, IProps>(function Sprite(
		{className, height, index, name, onClick, onKeyDown, onPress, size, style, target, title, width, ...props},
		ref
	) {
		const [isSupportedWebp, setIsSupportedWebp] = useState(true);

		useEffect(() => {
			setIsSupportedWebp(checkCompatibility()['webp']);
		}, []);

		const instance = SpriteClass.getInstance(target);

		const {calculatedIndex, calculatedName} = useMemo(() => {
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

		const {calculatedHeight, calculatedSize, calculatedWidth} = useMemo(() => {
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
			[calculatedHeight, calculatedIndex, calculatedSize, calculatedWidth, instance, isSupportedWebp, target]
		);

		const finalTitle = title ?? calculatedName;

		return (
			<PressElement
				as="span"
				onClick={onClick}
				onKeyDown={onKeyDown}
				onPress={onPress}
				role="img"
				title={finalTitle}
				className={cn('inline-block', className)}
				style={{...calculatedStyle, ...style}}
				{...props}
				ref={ref}
			/>
		);
	})
);

export type {IProps as ISpriteProps};
