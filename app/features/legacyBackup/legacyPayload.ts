export function compatibilityCustomerRareData(
	objects: Record<string, object[]>
) {
	Object.values(objects).forEach((data) => {
		data.forEach((item, index) => {
			const object = item as Record<string, unknown>;
			if (!('price' in object || 'rating' in object)) {
				return;
			}

			const beverage = object['beverage'] as string;
			const hasMystiaCooker = object['hasMystiaCooker'] as boolean;
			const order = (object['order'] as {
				beverageTag: string | null;
				recipeTag: string | null;
			} | null) ?? { beverageTag: null, recipeTag: null };
			const recipe = {
				extraIngredients: object['extraIngredients'] as string[],
				name: object['recipe'] as string,
			};

			data[index] = { beverage, hasMystiaCooker, order, recipe };
		});
	});
}

export function deleteIndexProperty(objects: Record<string, object[]>) {
	Object.values(objects).forEach((data) => {
		data.forEach((object) => {
			if ('index' in object) {
				delete object.index;
			}
		});
	});
}
