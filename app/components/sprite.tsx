import {type HTMLAttributes, forwardRef, memo, useEffect, useMemo, useState} from 'react';
import {twMerge} from 'tailwind-merge';

import {checkCompatibility} from '@/components/compatibleBrowser';

import {type TItemNames} from '@/data';
import {Sprite as SpriteClass, remToPx} from '@/utils';
import type {TSpriteTarget} from '@/utils/sprite/types';

import styles from './sprite.module.scss';

interface ISpriteBase {
	target: TSpriteTarget;
	index?: number;
	name?: TItemNames;
	size?: number;
	height?: number;
	width?: number;
}

interface IProps extends ISpriteBase, HTMLAttributes<HTMLSpanElement> {}

export default memo(
	forwardRef<HTMLSpanElement | null, IProps>(function Sprite(
		{target, index, name, size, height, width, className, style, title, ...props},
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
			} else if (_calculatedName) {
				_calculatedIndex = instance.findIndexByName(_calculatedName);
			} else {
				_calculatedIndex = 0;
			}

			return {
				calculatedIndex: _calculatedIndex,
				calculatedName: _calculatedName,
			};
		}, [index, instance, name]);

		const {calculatedHeight, calculatedWidth, calculatedSize} = useMemo(() => {
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
			() =>
				instance.getBackgroundPropsByIndex(calculatedIndex, {
					displayHeight: calculatedSize ?? calculatedHeight,
					displayWidth: calculatedSize ?? calculatedWidth,
				}),
			[calculatedHeight, calculatedIndex, calculatedSize, calculatedWidth, instance]
		);

		const finalTitle = title ?? calculatedName;

		return (
			<span
				role="img"
				title={finalTitle}
				className={twMerge(
					'inline-block',
					styles[isSupportedWebp ? target : (`png-${target}` as const)],
					className
				)}
				style={{...calculatedStyle, ...style}}
				{...props}
				ref={ref}
			/>
		);
	})
);

export type {IProps as ISpriteProps};
