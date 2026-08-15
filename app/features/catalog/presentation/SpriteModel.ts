import { type CSSProperties } from 'react';

import { RecordCatalog } from '@/domain/catalog/shared/RecordCatalog';
import type { TItemWithPinyin } from '@/domain/catalog/shared/types';
import { BEVERAGE_LIST } from '@/domain/data/beverages/records';
import { CLOTHES_LIST } from '@/domain/data/clothes/records';
import { COOKER_LIST } from '@/domain/data/cookers/records';
import { CURRENCY_ITEM_LIST } from '@/domain/data/currencyItems/records';
import { DECORATION_LIST } from '@/domain/data/decorations/records';
import { FOOD_LIST } from '@/domain/data/foods/records';
import { NORMAL_GUEST_LIST } from '@/domain/data/guests/normal/records';
import { SPECIAL_GUEST_LIST } from '@/domain/data/guests/special/records';
import { INGREDIENT_LIST } from '@/domain/data/ingredients/records';
import { PARTNER_LIST } from '@/domain/data/partners/records';
import {
	BEVERAGE_SPRITE_CONFIG,
	CLOTHES_SPRITE_CONFIG,
	COOKER_SPRITE_CONFIG,
	CURRENCY_ITEM_SPRITE_CONFIG,
	DECORATION_SPRITE_CONFIG,
	FOOD_SPRITE_CONFIG,
	INGREDIENT_SPRITE_CONFIG,
	NORMAL_GUEST_SPRITE_CONFIG,
	PARTNER_SPRITE_CONFIG,
	SPECIAL_GUEST_SPRITE_CONFIG,
} from '@/domain/data/sprites/configs';
import type {
	ISpriteConfig,
	TSpriteData,
	TSpriteTarget,
} from '@/domain/data/sprites/types';

import { pxToRem } from '@/shared/utilities/cssUnits/pxToRem';

const SPRITE_CONFIG_MAP = {
	beverage: BEVERAGE_SPRITE_CONFIG,
	clothes: CLOTHES_SPRITE_CONFIG,
	cooker: COOKER_SPRITE_CONFIG,
	currency_item: CURRENCY_ITEM_SPRITE_CONFIG,
	decoration: DECORATION_SPRITE_CONFIG,
	food: FOOD_SPRITE_CONFIG,
	ingredient: INGREDIENT_SPRITE_CONFIG,
	normal_guest: NORMAL_GUEST_SPRITE_CONFIG,
	partner: PARTNER_SPRITE_CONFIG,
	special_guest: SPECIAL_GUEST_SPRITE_CONFIG,
} as const satisfies Record<TSpriteTarget, ISpriteConfig>;

const SPRITE_DATA_MAP = {
	beverage: BEVERAGE_LIST,
	clothes: CLOTHES_LIST,
	cooker: COOKER_LIST,
	currency_item: CURRENCY_ITEM_LIST,
	decoration: DECORATION_LIST,
	food: FOOD_LIST,
	ingredient: INGREDIENT_LIST,
	normal_guest: NORMAL_GUEST_LIST,
	partner: PARTNER_LIST,
	special_guest: SPECIAL_GUEST_LIST,
} as const satisfies Record<TSpriteTarget, TSpriteData>;

export class Sprite<
	TCurrentSpriteTarget extends TSpriteTarget,
	TItems extends TSpriteData<TCurrentSpriteTarget> =
		TSpriteData<TCurrentSpriteTarget>,
> extends RecordCatalog<TItems, TItemWithPinyin<TItems[number]>> {
	private static _instances = new Map<TSpriteTarget, Sprite<TSpriteTarget>>();

	private _config: ISpriteConfig;
	private _sheetHeight: number;
	private _sheetWidth: number;
	private _bgPropsCache: Map<string, CSSProperties>;

	public spriteHeight: number;
	public spriteWidth: number;

	private constructor(data: TItems, config: ISpriteConfig) {
		super(data);

		this._config = config;

		const {
			col,
			row,
			size: { height, width },
		} = config;

		this.spriteHeight = height;
		this.spriteWidth = width;
		this._sheetHeight = row * height;
		this._sheetWidth = col * width;
		this._bgPropsCache = new Map();
	}

	public static getInstance(target: TSpriteTarget) {
		if (Sprite._instances.has(target)) {
			return Sprite._instances.get(target);
		}

		const instance = new Sprite(
			SPRITE_DATA_MAP[target],
			SPRITE_CONFIG_MAP[target]
		);

		Sprite._instances.set(target, instance);

		return instance;
	}

	private getPosByIndex(index: number) {
		this.checkIndexRange(index);

		const { col } = this._config;

		return {
			x: (index % col) * this.spriteWidth,
			y: Math.floor(index / col) * this.spriteHeight,
		};
	}

	public getBackgroundPropsByIndex(
		index: number,
		{
			displayHeight = this.spriteHeight,
			displayWidth = this.spriteWidth,
		} = {}
	): CSSProperties {
		const cacheKey = `${index}_${displayHeight}_${displayWidth}`;
		const cached = this._bgPropsCache.get(cacheKey);
		if (cached) {
			return cached;
		}

		this.checkIndexRange(index);

		const {
			_bgPropsCache: bgPropsCache,
			_sheetHeight: sheetHeight,
			_sheetWidth: sheetWidth,
			spriteHeight: height,
			spriteWidth: width,
		} = this;
		const scaleX = displayWidth / width;
		const scaleY = displayHeight / height;

		const { x, y } = this.getPosByIndex(index);
		const backgroundPosition = `-${pxToRem(x * scaleX)}rem -${pxToRem(y * scaleY)}rem`;
		const backgroundSize = `${pxToRem(sheetWidth * scaleX)}rem ${pxToRem(sheetHeight * scaleY)}rem`;

		const result: CSSProperties = {
			backgroundPosition,
			backgroundSize,
			height: `${pxToRem(displayHeight)}rem`,
			width: `${pxToRem(displayWidth)}rem`,
		};

		bgPropsCache.set(cacheKey, result);

		return result;
	}

	public getBackgroundPropsById(
		id: TItems[number]['id'],
		displaySize?: { displayHeight?: number; displayWidth?: number }
	) {
		return this.getBackgroundPropsByIndex(
			this.findIndexById(id),
			displaySize
		);
	}
}
