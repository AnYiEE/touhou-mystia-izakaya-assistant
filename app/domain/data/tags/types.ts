import type { TBeverageTags } from '@/domain/data/beverages/types';
import type { TCustomerRares } from '@/domain/data/customers/rare/types';
import type { TIngredientTags } from '@/domain/data/ingredients/types';
import type { TRecipeTags } from '@/domain/data/recipes/types';

import { type DYNAMIC_TAG_MAP } from './tagFacts';

type TTagNeedCalculate =
	| (typeof DYNAMIC_TAG_MAP)['economical']
	| (typeof DYNAMIC_TAG_MAP)['expensive'];
type TPopularTag =
	| (typeof DYNAMIC_TAG_MAP)['popularNegative']
	| (typeof DYNAMIC_TAG_MAP)['popularPositive'];

export type TBeverageTag = TBeverageTags;
export type TIngredientTag = TIngredientTags | TPopularTag;
export type TRecipeTag =
	| TRecipeTags
	| TCustomerRares[number]['negativeTags'][number]
	| TCustomerRares[number]['positiveTags'][number]
	| TTagNeedCalculate
	| TPopularTag;
export type TTag = TBeverageTag | TIngredientTag | TRecipeTag;
