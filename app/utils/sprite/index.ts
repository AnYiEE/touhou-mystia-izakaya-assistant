import type {SpriteData, SpriteTarget, ISpriteConfig} from './types';

class Sprite<Target extends SpriteTarget> {
	#config: ISpriteConfig;
	#data: SpriteData<Target>;

	private static indexNameCache: Map<number, string> = new Map();
	private static nameIndexCache: Map<string, number> = new Map();

	public spriteHeight: number;
	public spriteWidth: number;

	public constructor(data: SpriteData<Target>, config: ISpriteConfig) {
		this.#config = config;
		this.#data = data;

		const {col, row, height, width} = config;

		this.spriteHeight = height / row;
		this.spriteWidth = width / col;
	}

	public get config() {
		return structuredClone(this.#config);
	}

	public get data() {
		return structuredClone(this.#data);
	}

	private checkIndexRange<_T, U extends SpriteData<Target>[number] | undefined>(
		index: number,
		_data?: U
	): asserts _data {
		if (index < 0 || index >= this.#data.length) {
			throw new Error(`[Sprite]: index \`${index}\` out of range`);
		}
	}

	public findIndexByName(name: SpriteData<Target>[number]['name']) {
		if (Sprite.nameIndexCache.has(name)) {
			return Sprite.nameIndexCache.get(name)!;
		}

		const index: number = this.#data.findIndex(({name: target}) => target === name);
		if (index === -1) {
			throw new Error(`[Sprite]: name \`${name}\` not found`);
		}

		Sprite.nameIndexCache.set(name, index);

		return index;
	}

	public findNameByIndex<T extends SpriteData<Target>[number]['name']>(index: number): T {
		const sprite = this.#data[index];
		this.checkIndexRange(index, sprite);

		if (Sprite.indexNameCache.has(index)) {
			return Sprite.indexNameCache.get(index) as T;
		}

		const {name} = sprite;
		Sprite.indexNameCache.set(index, name);

		return name as T;
	}

	public getPosByIndex(index: number) {
		this.checkIndexRange(index);

		const {col} = this.#config;

		return {
			x: (index % col) * this.spriteWidth,
			y: Math.floor(index / col) * this.spriteHeight,
		};
	}

	public getPosByName(name: SpriteData<Target>[number]['name']) {
		const index: number = this.findIndexByName(name);

		return this.getPosByIndex(index);
	}

	public getBackgroundPropsByIndex(
		index: number,
		{displayHeight = this.spriteHeight, displayWidth = this.spriteWidth} = {}
	): React.CSSProperties {
		this.checkIndexRange(index);

		const {spriteHeight, spriteWidth} = this;
		const {height: sheetHeight, width: sheetWidth} = this.#config;
		const backgroundSize: `${string}px` = `${sheetWidth * (displayWidth / spriteWidth)}px ${sheetHeight * (displayHeight / spriteHeight)}px`;
		const {x, y} = this.getPosByIndex(index);

		return {
			backgroundSize,
			backgroundPosition: `-${x * (displayWidth / spriteWidth)}px -${y * (displayHeight / spriteHeight)}px`,
			height: displayHeight,
			width: displayWidth,
		};
	}

	public getBackgroundPropsByName(
		name: SpriteData<Target>[number]['name'],
		{displayHeight = this.spriteHeight, displayWidth = this.spriteWidth} = {}
	): React.CSSProperties {
		const index: number = this.findIndexByName(name);

		return this.getBackgroundPropsByIndex(index, {
			displayHeight,
			displayWidth,
		});
	}
}

export {Sprite};
