import type { IFoodBase } from '@/domain/data/shared/foodSchema';
import type { TIngredientTagSchema } from '@/domain/data/tags/schema';

type TType = '肉类' | '海鲜' | '蔬菜' | '其他';

export interface IIngredient extends IFoodBase {
	type: TType;
	tags: TIngredientTagSchema[];
}
