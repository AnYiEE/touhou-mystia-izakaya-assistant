import classNames from 'classnames';

import {BeverageNames, CustomerNormalNames, IngredientNames, KitchenwareNames, RecipesNames} from '@/data';
import * as sprite from '@/methods/sprite';
import type {SpriteTarget} from '@/utils/sprite/types';

import styles from './sprite.module.scss';

interface ISpriteBase {
	target: SpriteTarget;
	index: number;
	name: BeverageNames | CustomerNormalNames | IngredientNames | KitchenwareNames | RecipesNames;
	size: number;
	height: number;
	width: number;
}

interface IProps extends Partial<ISpriteBase>, React.HTMLAttributes<HTMLSpanElement> {}

function getInstance(target: SpriteTarget) {
	switch (target) {
		case 'beverages':
			return sprite.beverageSpriteInstance;
		case 'customer_normal':
			return sprite.customerNormalInstance;
		case 'ingredients':
			return sprite.ingredientSpriteInstance;
		case 'kitchenwares':
			return sprite.kitchenwareSpriteInstance;
		case 'recipes':
			return sprite.recipesSpriteInstance;
		default:
			return sprite.beverageSpriteInstance;
	}
}

function Sprite({
	target = 'beverages',
	index = 0,
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
			className={classNames('inline-block text-nowrap align-middle', styles[target], className)}
			style={{...calcStyle, ...style}}
			title={title}
			{...props}
		/>
	);
}

export default Sprite;
