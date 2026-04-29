import { type NextRequest } from 'next/server';

import { Beverage } from '@/utils/food/beverages';
import { CustomerRare } from '@/utils/customer/customer_rare';
import { CustomerNormal } from '@/utils/customer/customer_normal';
import {
	createErrorResponse,
	createJsonResponse,
	getByNameOrNotFound,
	handleOptionsRequest,
} from '@/api/v1/utils';
import type {
	TBeverageName,
	TCustomerNormalName,
	TCustomerRareName,
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

		const instance_beverage = Beverage.getInstance();
		const beverageResult = getByNameOrNotFound(
			instance_beverage,
			decodedName
		);
		if (beverageResult.error) {
			return createErrorResponse(beverageResult.error, 404);
		}
		const beverage = beverageResult.data as { name: string };

		try {
			let customerTags: ReadonlyArray<string>;

			if (customerType === 'rare') {
				const instance_customer = CustomerRare.getInstance();
				const customerData = instance_customer.getPropsByName(
					customerName as TCustomerRareName
				);
				customerTags = customerData.beverageTags;
			} else {
				const instance_customer = CustomerNormal.getInstance();
				const customerData = instance_customer.getPropsByName(
					customerName as TCustomerNormalName
				);
				customerTags = customerData.beverageTags;
			}

			const result = instance_beverage.getCustomerSuitability(
				beverage.name as TBeverageName,
				customerTags
			);

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
