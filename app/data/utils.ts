import type { ISpriteConfig } from '@/utils/sprite/types';

type BuildTuple<
	L extends number,
	T extends unknown[] = [],
> = T['length'] extends L ? T : BuildTuple<L, [...T, unknown]>;

type GTE<A extends number, B extends number> =
	BuildTuple<A> extends [...BuildTuple<B>, ...infer _] ? true : false;

type Subtract<A extends number, B extends number> =
	BuildTuple<A> extends [...BuildTuple<B>, ...infer R] ? R['length'] : never;

type CeilDiv<
	Count extends number,
	Columns extends number,
	Acc extends unknown[] = [],
> =
	GTE<Count, Columns> extends true
		? CeilDiv<Subtract<Count, Columns>, Columns, [...Acc, unknown]>
		: Count extends 0
			? Acc['length']
			: [...Acc, unknown]['length'];

export function generateSpriteConfig<
	Count extends number,
	Height extends number,
	Width extends number,
	Columns extends number = 10,
>(
	count: Count,
	size: { height: Height; width: Width },
	columns = 10 as Columns
) {
	const config: ISpriteConfig = {
		col: columns,
		row: Math.ceil(count / columns),
		size,
	};

	return config as Readonly<{
		col: Columns;
		row: CeilDiv<Count, Columns>;
		size: { height: Height; width: Width };
	}>;
}
