import { SPECIAL_GUEST_LIST } from '@/domain/data/guests/special/records';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import {
	SCHEDULER_FACTS,
	formatSchedulerLabels,
} from '@/domain/data/labels/schedulerFacts';
import { MERCHANT_LABEL_MAP } from '@/domain/data/places/merchantFacts';
import { MAP_FACTS } from '@/domain/data/places/placeFacts';
import type {
	ITaskReference,
	TMapLabel,
	TMerchantReference,
} from '@/domain/data/places/types';
import type { TDlc } from '@/domain/data/shared/types';

import { DLC_LABEL_MAP } from './messages';
import { createAvailabilityPath } from './path';
import type {
	IAvailabilityAcquisitionSource,
	IAvailabilityPath,
	IAvailabilityResult,
} from './types';

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
	const labels = typeof task.task === 'string' ? [task.task] : task.task;
	const firstLabel = typeof task.task === 'string' ? task.task : task.task[0];

	const dlcs = new Set(labels.map((label) => SCHEDULER_FACTS[label].dlc));
	if (dlcs.size !== 1) {
		throw new Error(
			`食材任务“${formatSchedulerLabels(task.task)}”跨越多个DLC`
		);
	}

	const { dlc } = SCHEDULER_FACTS[firstLabel];
	const taskName = formatSchedulerLabels(task.task);

	return createDlcPath(dlc, source, [
		{
			kind: 'task',
			name: taskName,
			place: null,
			probability: null,
			timeWindow: null,
		},
	]);
}

export function formatMerchantReference(merchant: TMerchantReference) {
	if ('specialGuest' in merchant) {
		const specialGuest = SPECIAL_GUEST_LIST.find(
			({ id }) => id === merchant.specialGuest
		);
		if (specialGuest === undefined) {
			throw new Error(`找不到商人关联的稀客“${merchant.specialGuest}”`);
		}
		return 'map' in merchant
			? `【${MAP_FACTS[merchant.map].label}】${specialGuest.name}`
			: `【${specialGuest.name}】${merchant.label}`;
	}

	return `【${MAP_FACTS[merchant.map].label}】${MERCHANT_LABEL_MAP[merchant.label]}`;
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

	const specialGuest =
		'specialGuest' in merchant
			? SPECIAL_GUEST_LIST.find(({ id }) => id === merchant.specialGuest)
			: undefined;
	if (specialGuest !== undefined) {
		return createResult([
			createDlcPath(specialGuest.dlc, source, acquisitionSources),
		]);
	}

	if (map !== null) {
		return createResult([
			resolveMapAvailabilityPath(map, source, acquisitionSources),
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
