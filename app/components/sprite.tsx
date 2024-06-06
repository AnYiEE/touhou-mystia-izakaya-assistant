import {type HTMLAttributes} from 'react';
import clsx from 'clsx';

import {
	BeverageNames,
	CustomerNormalNames,
	CustomerRareNames,
	IngredientNames,
	KitchenwareNames,
	RecipeNames,
} from '@/data';
import * as sprite from '@/methods/sprite';
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

function getInstance(target: SpriteTarget) {
	switch (target) {
		case 'beverages':
			return sprite.beverageSpriteInstance;
		case 'customer_normal':
			return sprite.customerNormalSpriteInstance;
		case 'customer_rare':
			return sprite.customerRareSpriteInstance;
		case 'ingredients':
			return sprite.ingredientSpriteInstance;
		case 'kitchenwares':
			return sprite.kitchenwareSpriteInstance;
		case 'recipes':
			return sprite.recipeSpriteInstance;
		default:
			return sprite.beverageSpriteInstance;
	}
}

export default function Sprite({
	target = 'beverages',
	index,
	name,
	size,
	height,
	width,
	className,
	style,
	title,
	...props
}: IProps) {
	const instance = getInstance(target);

	if (index !== undefined) {
		name = instance.findNameByIndex(index) as typeof name;
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
