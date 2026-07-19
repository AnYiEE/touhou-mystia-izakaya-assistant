import {
	CUSTOMER_NORMAL_LIST,
	CUSTOMER_RARE_LIST,
	DLC_LABEL_MAP,
	PLACE_DLC_MAP,
	PLACE_NAME_REGEX,
	type TCustomerRareName,
	type TDlc,
	type TPlace,
} from '@/data';
import type { IFoodBase, TMerchant } from '@/data/types';

import { createAvailabilityPath } from './path';
import type { IAvailabilityPath, IAvailabilityResult } from './types';

type TFoodTask = NonNullable<IFoodBase['from']['task']>[number];

const FOOD_TASK_DLC_MAP = new Map<TFoodTask, TDlc>([
	['阿求小姐的色纸', 0],
	['女仆长的采购委托', 0],
	['月都试炼', 5],
	['最终收网行动', 5],
]);

const SPECIAL_MERCHANT_DLC_MAP = new Map<TMerchant, TDlc>([
	['【人间之里】舞', 9],
	['【人间之里】雪', 9],
]);

const CUSTOMER_DLC_ENTRIES = [...CUSTOMER_RARE_LIST, ...CUSTOMER_NORMAL_LIST]
	.map(({ dlc, name }) => ({ dlc, name }))
	.sort((left, right) => right.name.length - left.name.length);

function createDlcPath(dlc: TDlc, source: string) {
	return createAvailabilityPath([dlc], source);
}

function createResult(
	availabilityPaths: ReadonlyArray<IAvailabilityPath>,
	diagnostics: ReadonlyArray<string> = []
): IAvailabilityResult {
	return { availabilityPaths, diagnostics };
}

export function resolvePlaceAvailabilityPath(place: TPlace, source: string) {
	return createDlcPath(PLACE_DLC_MAP[place], source);
}

export function resolveFoodTaskAvailabilityPath(
	task: TFoodTask,
	source: string
) {
	const dlc = FOOD_TASK_DLC_MAP.get(task);
	if (dlc === undefined) {
		throw new Error(`未配置食材任务“${task}”的可获取DLC`);
	}

	return createDlcPath(dlc, source);
}

export function resolveMerchantAvailabilityResult(
	merchant: TMerchant,
	fallbackDlc: TDlc,
	source: string
): IAvailabilityResult {
	const specialDlc = SPECIAL_MERCHANT_DLC_MAP.get(merchant);
	if (specialDlc !== undefined) {
		return createResult([createDlcPath(specialDlc, source)]);
	}

	const placeMatch = PLACE_NAME_REGEX.exec(merchant);
	const place = placeMatch?.[1];
	if (place !== undefined && Object.hasOwn(PLACE_DLC_MAP, place)) {
		return createResult([
			resolvePlaceAvailabilityPath(place as TPlace, source),
		]);
	}

	const matchingCustomer = CUSTOMER_DLC_ENTRIES.find(
		({ name }) => name === place
	);
	if (matchingCustomer !== undefined) {
		return createResult([createDlcPath(matchingCustomer.dlc, source)]);
	}

	return createResult(
		[createDlcPath(fallbackDlc, source)],
		[
			`商人“${merchant}”无法解析，已回退到内容归属${DLC_LABEL_MAP[fallbackDlc].label}`,
		]
	);
}

export function resolveRareCustomerBondAvailabilityResult(
	name: TCustomerRareName,
	source: string
): IAvailabilityResult {
	const customer = CUSTOMER_RARE_LIST.find((item) => item.name === name);
	if (customer === undefined) {
		return createResult([], [`找不到羁绊顾客“${name}”`]);
	}

	return createResult([createDlcPath(customer.dlc, source)]);
}
