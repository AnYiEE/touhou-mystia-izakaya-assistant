import {pxToRem} from '@/utils';
import {Item} from '@/utils/item';
import type {SpriteData, SpriteTarget, ISpriteConfig} from './types';

export class Sprite<
	Target extends SpriteTarget,
	Data extends SpriteData<Target> = SpriteData<Target>,
	Name extends Data[number]['name'] = Data[number]['name'],
> extends Item<Data> {
	private _config: ISpriteConfig;

	public spriteHeight: number;
	public spriteWidth: number;

	public constructor(data: Data, config: ISpriteConfig) {
		super(data);

		this._config = config;
		this._data = data;

		const {col, row, height, width} = config;

		this.spriteHeight = height / row;
		this.spriteWidth = width / col;
	}

	public getPosByIndex(index: number) {
		this.checkIndexRange(index);

		const {col} = this._config;

		return {
			x: (index % col) * this.spriteWidth,
			y: Math.floor(index / col) * this.spriteHeight,
		};
	}

	public getPosByName<T extends string = Name>(name: T) {
		const index: number = this.findIndexByName(name);

		return this.getPosByIndex(index);
	}

	public getBackgroundPropsByIndex(
		index: number,
		{displayHeight = this.spriteHeight, displayWidth = this.spriteWidth} = {}
	): React.CSSProperties {
		this.checkIndexRange(index);

		const {spriteHeight, spriteWidth} = this;
		const {height: sheetHeight, width: sheetWidth} = this._config;
		const backgroundSize: `${string}rem ${string}rem` = `${pxToRem(sheetWidth * (displayWidth / spriteWidth))}rem ${pxToRem(sheetHeight * (displayHeight / spriteHeight))}rem`;
		const {x, y} = this.getPosByIndex(index);

		return {
			backgroundSize,
			backgroundPosition: `-${pxToRem(x * (displayWidth / spriteWidth))}rem -${pxToRem(y * (displayHeight / spriteHeight))}rem`,
			height: `${pxToRem(displayHeight)}rem`,
			width: `${pxToRem(displayWidth)}rem`,
		};
	}

	public getBackgroundPropsByName<T extends string = Name>(
		name: T,
		{displayHeight = this.spriteHeight, displayWidth = this.spriteWidth} = {}
	): React.CSSProperties {
		const index: number = this.findIndexByName(name);

		return this.getBackgroundPropsByIndex(index, {
			displayHeight,
			displayWidth,
		});
	}
}
