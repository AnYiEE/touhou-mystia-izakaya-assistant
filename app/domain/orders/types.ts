import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';

export interface IGuestOrder {
	beverageTag: TBeverageTagId | null;
	foodTag: TFoodTagId | null;
}
