import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TCookerId } from '@/domain/data/cookers/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TMapLabel } from '@/domain/data/places/types';
import type { TRatingKey } from '@/domain/evaluation/types';
import type { IMealFood } from '@/domain/meals/types';
import type { IGuestOrder } from '@/domain/orders/types';

export type TSpecialGuestPlanGuestSort =
	| 'default'
	| 'pinyin-asc'
	| 'pinyin-asc-flat'
	| 'pinyin-desc'
	| 'pinyin-desc-flat';
export type TSpecialGuestPlanMealSource = 'recommended' | 'saved';
export type TSpecialGuestPlanMode = 'manual' | 'region';

export interface ISpecialGuestPlan {
	createdAt: number;
	excludes: TSpecialGuestId[];
	guestSort: TSpecialGuestPlanGuestSort;
	id: string;
	includes: TSpecialGuestId[];
	manualGuests: TSpecialGuestId[];
	maps: TMapLabel[];
	mealSource: TSpecialGuestPlanMealSource;
	mode: TSpecialGuestPlanMode;
	name: string;
	updatedAt: number;
}

export interface ISpecialGuestPlansState {
	activeId: string | null;
	items: ISpecialGuestPlan[];
}

export interface IResolvedSpecialGuestPlanMeal {
	cooker: TCookerId;
	dataIndex: number | null;
	evaluation: {
		isDarkMatter: boolean;
		price: number;
		rating: TRatingKey | null;
	};
	meal: {
		beverage: TBeverageId;
		food: IMealFood;
		hasMystiaCooker: boolean;
		order: IGuestOrder;
	};
	recommendedSetIndex: number | null;
	source: TSpecialGuestPlanMealSource;
	visibleIndex: number;
}

export interface IResolvedSpecialGuestPlanGroup {
	meals: IResolvedSpecialGuestPlanMeal[];
	mealSource: TSpecialGuestPlanMealSource;
	specialGuest: TSpecialGuestId;
	specialGuestMaps: TMapLabel[];
	visibleMealCount: number;
}
