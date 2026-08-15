import { SPECIAL_GUEST_LIST } from '@/domain/data/guests/special/records';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import { MAP_FACTS } from '@/domain/data/places/placeFacts';
import type {
	ITaskReference,
	TMapLabel,
	TMerchantReference,
	TTaskLabel,
} from '@/domain/data/places/types';
import type { TDlc } from '@/domain/data/shared/types';

import { DLC_LABEL_MAP } from './messages';
import { createAvailabilityPath } from './path';
import type {
	IAvailabilityAcquisitionSource,
	IAvailabilityPath,
	IAvailabilityResult,
} from './types';

const FOOD_TASK_DLC_MAP = new Map<TTaskLabel, TDlc>([
	['阿求小姐的色纸', 0],
	['女仆长的采购委托', 0],
	['月都试炼', 5],
	['最终收网行动', 5],
]);

const SPECIAL_MERCHANT_DLC_MAP = new Map<TMerchantReference['label'], TDlc>([
	['舞', 9],
	['雪', 9],
]);

function createDlcPath(
	dlc: TDlc,
	source: string,
	acquisitionSources: ReadonlyArray<IAvailabilityAcquisitionSource> = []
) {
	return createAvailabilityPath([dlc], source, { acquisitionSources });
}

function createResult(
	availabilityPaths: ReadonlyArray<IAvailabilityPath>,
	diagnostics: ReadonlyArray<string> = []
): IAvailabilityResult {
	return { availabilityPaths, diagnostics };
}

export function resolveMapAvailabilityPath(
	map: TMapLabel,
	source: string,
	acquisitionSources: ReadonlyArray<IAvailabilityAcquisitionSource> = []
) {
	return createDlcPath(MAP_FACTS[map].dlc, source, acquisitionSources);
}

export function resolveFoodTaskAvailabilityPath(
	task: ITaskReference,
	source: string
) {
	const dlc = FOOD_TASK_DLC_MAP.get(task.task);
	if (dlc === undefined) {
		throw new Error(`未配置食材任务“${task.task}”的可获取DLC`);
	}

	return createDlcPath(dlc, source, [
		{
			kind: 'task',
			name: task.task,
			place: null,
			probability: null,
			timeWindow: null,
		},
	]);
}

export function formatMerchantReference(merchant: TMerchantReference) {
	if ('map' in merchant) {
		return `【${MAP_FACTS[merchant.map].label}】${merchant.label}`;
	}

	const specialGuest = SPECIAL_GUEST_LIST.find(
		({ id }) => id === merchant.specialGuest
	);
	if (specialGuest === undefined) {
		throw new Error(`找不到商人关联的稀客“${merchant.specialGuest}”`);
	}

	return `【${specialGuest.name}】${merchant.label}`;
}

export function resolveMerchantAvailabilityResult(
	merchant: TMerchantReference,
	fallbackDlc: TDlc,
	source: string,
	probability = 100
): IAvailabilityResult {
	const merchantName = formatMerchantReference(merchant);
	const map = 'map' in merchant ? merchant.map : null;
	const acquisitionSources: IAvailabilityAcquisitionSource[] = [
		{
			kind: 'buy',
			name: merchantName,
			place: map,
			probability,
			timeWindow: null,
		},
	];
	const specialDlc = SPECIAL_MERCHANT_DLC_MAP.get(merchant.label);
	if (specialDlc !== undefined) {
		return createResult([
			createDlcPath(specialDlc, source, acquisitionSources),
		]);
	}

	if (map !== null) {
		return createResult([
			resolveMapAvailabilityPath(map, source, acquisitionSources),
		]);
	}

	const specialGuest = SPECIAL_GUEST_LIST.find(
		({ id }) => id === merchant.specialGuest
	);
	if (specialGuest !== undefined) {
		return createResult([
			createDlcPath(specialGuest.dlc, source, acquisitionSources),
		]);
	}

	return createResult(
		[createDlcPath(fallbackDlc, source, acquisitionSources)],
		[
			`商人“${merchantName}”无法解析，已回退到内容归属${DLC_LABEL_MAP[fallbackDlc].label}`,
		]
	);
}

export function resolveSpecialGuestBondAvailabilityResult(
	specialGuest: TSpecialGuestId,
	source: string
): IAvailabilityResult {
	const specialGuestRecord = SPECIAL_GUEST_LIST.find(
		(item) => item.id === specialGuest
	);
	if (specialGuestRecord === undefined) {
		return createResult([], [`找不到羁绊顾客“${specialGuest}”`]);
	}

	return createResult([
		createDlcPath(specialGuestRecord.dlc, source, [
			{
				kind: 'bond',
				name: specialGuestRecord.name,
				place: null,
				probability: null,
				timeWindow: null,
			},
		]),
	]);
}
