import type { TPlace } from '@/domain/data/places/types';
import type {
	TBeverageTagSchema,
	TRecipeTagSchema,
} from '@/domain/data/tags/schema';

import type { IItemBase } from './itemSchema';
import type { TDescription } from './types';

export interface ICustomerBase extends IItemBase {
	chat: TDescription[];
	places: TPlace[];
	positiveTags: TRecipeTagSchema[];
	beverageTags: TBeverageTagSchema[];
}
