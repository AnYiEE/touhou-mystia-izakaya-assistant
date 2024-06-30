import {type HTMLAttributes, forwardRef, memo, useMemo} from 'react';
import clsx from 'clsx';

import {type TItemNames} from '@/data';
import {spriteInstances} from '@/methods';
import type {TSpriteInstances} from '@/methods/types';
import {remToPx} from '@/utils';
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
		const instance: TSpriteInstances = useMemo(() => spriteInstances[target], [target]);

		const {calculatedIndex, calculatedName} = useMemo(() => {
			let calcIndex = index;
			let calcName = name;

			if (calcIndex !== undefined) {
				calcName = instance.findNameByIndex(calcIndex);
			} else if (calcName) {
				calcIndex = instance.findIndexByName(calcName);
			} else {
				calcIndex = 0;
			}

			return {
				calculatedIndex: calcIndex,
				calculatedName: calcName,
			};
		}, [index, name, instance]);

		const {calculatedHeight, calculatedWidth, calculatedSize} = useMemo(() => {
			let calcHeight = height ?? instance.spriteHeight;
			let calcWidth = width ?? instance.spriteWidth;
			let calcSize = size;

			if (calcHeight === calcWidth) {
				calcSize ??= calcHeight;
			}
			if (calcSize !== undefined) {
				calcHeight = calcSize;
				calcWidth = calcSize;
			}

			return {
				calculatedHeight: calcHeight,
				calculatedWidth: calcWidth,

				calculatedSize: remToPx(calcSize),
			};
		}, [height, width, size, instance]);

		const calcStyle = useMemo(
			() =>
				instance.getBackgroundPropsByIndex(calculatedIndex, {
					displayHeight: calculatedSize ?? calculatedHeight,
					displayWidth: calculatedSize ?? calculatedWidth,
				}),
			[calculatedIndex, calculatedSize, calculatedHeight, calculatedWidth, instance]
		);

		const finalTitle = title || calculatedName;

		return (
			<span
				className={clsx('inline-block', styles[target], className)}
				style={{...calcStyle, ...style}}
				title={finalTitle}
				{...props}
				ref={ref}
			/>
		);
	})
);

export type {IProps as ISpriteProps};
