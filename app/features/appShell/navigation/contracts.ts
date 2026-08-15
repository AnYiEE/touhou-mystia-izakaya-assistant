import type { TSpriteId, TSpriteTarget } from '@/domain/data/sprites/types';

import type { ILink } from '@/shared/site/contracts';

export type TSpriteNavigationItem<T extends string = string> = {
	[TTarget in TSpriteTarget]: Prettify<
		ILink<T> & { sprite: TTarget; spriteRecordId: TSpriteId<TTarget> }
	>;
}[TSpriteTarget];

export type TNavItem<T extends string = string> =
	| ILink<T>
	| Record<string, Array<TSpriteNavigationItem<T>>>;
