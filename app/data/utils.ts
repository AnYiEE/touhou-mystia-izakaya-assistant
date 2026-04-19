import type { TPlace } from '@/data';
import { ALL_PLACES, ALL_PLACES_SET, PLACE_NAME_REGEX } from '@/data/constant';
import type { IFoodBase } from '@/data/types';
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

type TFoodFrom = IFoodBase['from'] & { self?: boolean };

export function extractPlacesFromFoodFrom(from: TFoodFrom) {
	if ('self' in from && from.self) {
		return ALL_PLACES;
	}
	if (Object.keys(from).length === 0) {
		return [];
	}

	const places = new Set<TPlace>();

	from.buy?.forEach((item) => {
		const merchant = typeof item === 'string' ? item : item[0];
		const match = PLACE_NAME_REGEX.exec(merchant);
		if (match?.[1] && ALL_PLACES_SET.has(match[1])) {
			places.add(match[1] as TPlace);
		}
	});

	from.collect?.forEach((item) => {
		const location = typeof item === 'string' ? item : item[0];
		const match = PLACE_NAME_REGEX.exec(location);
		if (match?.[1] && ALL_PLACES_SET.has(match[1])) {
			places.add(match[1] as TPlace);
		}
	});

	from.fishing?.forEach((p) => places.add(p));
	from.fishingAdvanced?.forEach((p) => places.add(p));

	return [...places];
}
