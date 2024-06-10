import {type HTMLAttributes} from 'react';
import clsx from 'clsx';

import {
	type BeverageNames,
	type CustomerNormalNames,
	type CustomerRareNames,
	type IngredientNames,
	type KitchenwareNames,
	type RecipeNames,
} from '@/data';
import {spriteInstances} from '@/methods';
import type {SpriteTarget} from '@/utils/sprite/types';

import styles from './sprite.module.scss';

interface ISpriteBase {
	target: SpriteTarget;
	index: number;
	name: BeverageNames | CustomerNormalNames | CustomerRareNames | IngredientNames | KitchenwareNames | RecipeNames;
	size: number;
	height: number;
	width: number;
}

interface IProps extends Partial<ISpriteBase>, HTMLAttributes<HTMLSpanElement> {}

function Sprite({target = 'beverage', index, name, size, height, width, className, style, title, ...props}: IProps) {
	const instance = spriteInstances[target];

	if (index !== undefined) {
		name = instance.findNameByIndex(index);
	} else if (name) {
		index = instance.findIndexByName(name);
	} else {
		index = 0;
	}

	height ??= instance.spriteHeight;
	width ??= instance.spriteWidth;

	if (height === width) {
		size ??= height;
	}
	if (size !== undefined) {
		height = size;
		width = size;
	}

	title ||= name;

	const calcStyle = instance.getBackgroundPropsByIndex(index, {
		displayHeight: size ?? height,
		displayWidth: size ?? width,
	});

	return (
		<span
			className={clsx('inline-block', styles[target], className)}
			style={{...calcStyle, ...style}}
			title={title}
			{...props}
		/>
	);
}

export default Sprite;
export type {IProps as ISpriteProps};
