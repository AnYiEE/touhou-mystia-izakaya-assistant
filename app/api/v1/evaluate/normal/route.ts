import { type NextRequest } from 'next/server';

import {
	type IBuildMealEvaluationNormalParams,
	buildFullMealEvaluationNormal,
} from '@/utils/evaluators/meal';
import {
	createErrorResponse,
	createJsonResponse,
	handleOptionsRequest,
} from '@/api/v1/utils';

export async function POST(request: NextRequest) {
	try {
		const body =
			(await request.json()) as Partial<IBuildMealEvaluationNormalParams>;

		if (!body.customerName || !body.recipeName) {
			return createErrorResponse(
				'Missing required fields: customerName, recipeName',
				400
			);
		}

		const params: IBuildMealEvaluationNormalParams = {
			customerName: body.customerName,
			extraIngredients: body.extraIngredients ?? [],
			isFamousShop: body.isFamousShop ?? false,
			popularTrend: body.popularTrend ?? { isNegative: false, tag: null },
			recipeName: body.recipeName,
		};

		const result = buildFullMealEvaluationNormal(params);

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
