import { type NextRequest } from 'next/server';

import { Recipe } from '@/utils/food/recipes';
import { CustomerRare } from '@/utils/customer/customer_rare';
import { CustomerNormal } from '@/utils/customer/customer_normal';
import { getFullRecipeSuitability } from '@/utils/evaluators/suitability';
import {
	createErrorResponse,
	createJsonResponse,
	getByNameOrNotFound,
	handleOptionsRequest,
	parseBooleanParam,
} from '@/api/v1/utils';
import type { IPopularTrend } from '@/types';
import type {
	TCustomerNormalName,
	TCustomerRareName,
	TIngredientName,
	TRecipeName,
	TRecipeTag,
} from '@/data';

export function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ name: string }> }
) {
	return params.then(({ name }) => {
		const decodedName = decodeURIComponent(name);
		const { searchParams } = request.nextUrl;

		const customerName = searchParams.get('customer');
		const customerType = searchParams.get('type');

		if (!customerName || !customerType) {
			return createErrorResponse(
				'Missing required parameters: customer, type',
				400
			);
		}

		if (customerType !== 'rare' && customerType !== 'normal') {
			return createErrorResponse(
				'Parameter "type" must be "rare" or "normal"',
				400
			);
		}

		const instance_recipe = Recipe.getInstance();
		const recipeResult = getByNameOrNotFound(instance_recipe, decodedName);
		if (recipeResult.error) {
			return createErrorResponse(recipeResult.error, 404);
		}

		const recipe = recipeResult.data as {
			ingredients: ReadonlyArray<string>;
			name: string;
			positiveTags: ReadonlyArray<TRecipeTag>;
		};

		try {
			const popularTagParam = searchParams.get('popularTag');
			const popularNegativeParam = searchParams.get('popularNegative');
			const isFamousShopParam = searchParams.get('isFamousShop');

			const popularTrend: IPopularTrend = {
				isNegative: parseBooleanParam(popularNegativeParam),
				tag: (popularTagParam as IPopularTrend['tag']) ?? null,
			};
			const isFamousShop = parseBooleanParam(isFamousShopParam);

			const commonParams = {
				isFamousShop,
				popularTrend,
				recipeIngredients:
					recipe.ingredients as ReadonlyArray<TIngredientName>,
				recipeName: recipe.name as TRecipeName,
				recipePositiveTags: recipe.positiveTags,
			};

			let result;

			if (customerType === 'rare') {
				const instance_customer = CustomerRare.getInstance();
				const customerData = instance_customer.getPropsByName(
					customerName as TCustomerRareName
				);
				result = getFullRecipeSuitability({
					...commonParams,
					customerName: customerName as TCustomerRareName,
					customerNegativeTags: customerData.negativeTags,
					customerPositiveTags: customerData.positiveTags,
					customerType: 'rare',
				});
			} else {
				const instance_customer = CustomerNormal.getInstance();
				const customerData = instance_customer.getPropsByName(
					customerName as TCustomerNormalName
				);
				result = getFullRecipeSuitability({
					...commonParams,
					customerName: customerName as TCustomerNormalName,
					customerPositiveTags: customerData.positiveTags,
					customerType: 'normal',
				});
			}

			return createJsonResponse(result);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : 'Customer not found';
			return createErrorResponse(message, 404);
		}
	});
}

export function OPTIONS() {
	return handleOptionsRequest();
}
