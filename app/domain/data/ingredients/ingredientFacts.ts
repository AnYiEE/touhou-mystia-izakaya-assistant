export const INGREDIENT_TYPE_MAP = {
	[-1]: '其他',
	0: '肉类',
	1: '海鲜',
	2: '蔬菜',
} as const;

export function compareIngredientTypes(
	left: keyof typeof INGREDIENT_TYPE_MAP,
	right: keyof typeof INGREDIENT_TYPE_MAP
) {
	if (left === -1) {
		return right === -1 ? 0 : 1;
	}
	if (right === -1) {
		return -1;
	}
	return left - right;
}
