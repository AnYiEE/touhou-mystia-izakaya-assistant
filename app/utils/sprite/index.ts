import {type CSSProperties} from 'react';

import type {ISpriteConfig, TSpriteData, TSpriteTarget} from './types';
import {
	BEVERAGE_LIST,
	BEVERAGE_SPRITE_CONFIG,
	COOKER_LIST,
	COOKER_SPRITE_CONFIG,
	CUSTOMER_NORMAL_LIST,
	CUSTOMER_NORMAL_SPRITE_CONFIG,
	CUSTOMER_RARE_LIST,
	CUSTOMER_RARE_SPRITE_CONFIG,
	CUSTOMER_SPECIAL_LIST,
	CUSTOMER_SPECIAL_SPRITE_CONFIG,
	INGREDIENT_LIST,
	INGREDIENT_SPRITE_CONFIG,
	RECIPE_LIST,
	RECIPE_SPRITE_CONFIG,
} from '@/data';
import {pxToRem} from '@/utils';
import {Item} from '@/utils/item';

const SPRITE_CONFIG_MAP = {
	beverage: BEVERAGE_SPRITE_CONFIG,
	cooker: COOKER_SPRITE_CONFIG,
	customer_normal: CUSTOMER_NORMAL_SPRITE_CONFIG,
	customer_rare: CUSTOMER_RARE_SPRITE_CONFIG,
	customer_special: CUSTOMER_SPECIAL_SPRITE_CONFIG,
	ingredient: INGREDIENT_SPRITE_CONFIG,
	recipe: RECIPE_SPRITE_CONFIG,
} as const satisfies Record<TSpriteTarget, ISpriteConfig>;

const SPRITE_DATA_MAP = {
	beverage: BEVERAGE_LIST,
	cooker: COOKER_LIST,
	customer_normal: CUSTOMER_NORMAL_LIST,
	customer_rare: CUSTOMER_RARE_LIST,
	customer_special: CUSTOMER_SPECIAL_LIST,
	ingredient: INGREDIENT_LIST,
	recipe: RECIPE_LIST,
} as const satisfies Record<TSpriteTarget, TSpriteData<TSpriteTarget>>;

export class Sprite<
	TTarget extends TSpriteTarget,
	TData extends TSpriteData<TTarget> = TSpriteData<TTarget>,
	TName extends TData[number]['name'] = TData[number]['name'],
> extends Item<TData> {
	private static _instances = new Map<TSpriteTarget, Sprite<TSpriteTarget>>();

	private _config: ISpriteConfig;

	public spriteHeight: number;
	public spriteWidth: number;

	private constructor(data: TData, config: ISpriteConfig) {
		super(data);

		this._config = config;

		const {col, row, height, width} = config;

		this.spriteHeight = height / row;
		this.spriteWidth = width / col;
	}

	public static getInstance<T extends TSpriteTarget>(target: T) {
		if (Sprite._instances.has(target)) {
			Sprite._instances.get(target);
		}

		const instance = new Sprite(SPRITE_DATA_MAP[target], SPRITE_CONFIG_MAP[target]);

		Sprite._instances.set(target, instance);

		return instance;
	}

	public getPosByIndex(index: number) {
		this.checkIndexRange(index);

		const {col} = this._config;

		return {
			x: (index % col) * this.spriteWidth,
			y: Math.floor(index / col) * this.spriteHeight,
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
	public getPosByName<T extends string = TName>(name: T) {
		const index = this.findIndexByName(name);

		return this.getPosByIndex(index);
	}

	public getBackgroundPropsByIndex(
		index: number,
		{displayHeight = this.spriteHeight, displayWidth = this.spriteWidth} = {}
	): CSSProperties {
		this.checkIndexRange(index);

		const {spriteHeight, spriteWidth, _config} = this;
		const {height: sheetHeight, width: sheetWidth} = _config;

		const {x, y} = this.getPosByIndex(index);
		const backgroundPosition = `-${pxToRem(x * (displayWidth / spriteWidth))}rem -${pxToRem(y * (displayHeight / spriteHeight))}rem`;
		const backgroundSize = `${pxToRem(sheetWidth * (displayWidth / spriteWidth))}rem ${pxToRem(sheetHeight * (displayHeight / spriteHeight))}rem`;

		return {
			backgroundPosition,
			backgroundSize,
			height: `${pxToRem(displayHeight)}rem`,
			width: `${pxToRem(displayWidth)}rem`,
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
	public getBackgroundPropsByName<T extends string = TName>(
		name: T,
		{displayHeight = this.spriteHeight, displayWidth = this.spriteWidth} = {}
	): CSSProperties {
		const index = this.findIndexByName(name);

		return this.getBackgroundPropsByIndex(index, {
			displayHeight,
			displayWidth,
		});
	}
}
