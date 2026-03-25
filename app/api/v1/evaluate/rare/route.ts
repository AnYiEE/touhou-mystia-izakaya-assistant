import { type NextRequest } from 'next/server';

import {
	type IBuildMealEvaluationRareParams,
	buildFullMealEvaluationRare,
} from '@/utils/evaluators/meal';
import {
	createErrorResponse,
	createJsonResponse,
	handleOptionsRequest,
} from '@/api/v1/utils';

export async function POST(request: NextRequest) {
	try {
		const body =
			(await request.json()) as Partial<IBuildMealEvaluationRareParams>;

		if (
			!body.customerName ||
			!body.recipeName ||
			!body.beverageName ||
			!body.customerOrder
		) {
			return createErrorResponse(
				'Missing required fields: customerName, recipeName, beverageName, customerOrder',
				400
			);
		}

		const params: IBuildMealEvaluationRareParams = {
			beverageName: body.beverageName,
			customerName: body.customerName,
			customerOrder: body.customerOrder,
			extraIngredients: body.extraIngredients ?? [],
			hasMystiaCooker: body.hasMystiaCooker ?? false,
			isFamousShop: body.isFamousShop ?? false,
			popularTrend: body.popularTrend ?? { isNegative: false, tag: null },
			recipeName: body.recipeName,
		};

		const result = buildFullMealEvaluationRare(params);

		return createJsonResponse(result);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Internal server error';
		return createErrorResponse(message, 500);
	}
}

export function OPTIONS() {
	return handleOptionsRequest();
}
