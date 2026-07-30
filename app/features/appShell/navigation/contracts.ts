import type { TSpriteTarget } from '@/domain/data/sprites/types';

import type { ILink } from '@/shared/site/contracts';

export type TNavItem<T extends string = string> =
	| ILink<T>
	| Record<
			string,
			Array<
				Prettify<
					ILink<T> & {
						sprite: TSpriteTarget | null;
						spriteIndex: number | null;
					}
				>
			>
	  >;
