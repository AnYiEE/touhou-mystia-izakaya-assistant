import { isNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';
import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

interface IDonationModalPersistence {
	interactionCount: number;
	lastMilestoneShown: number;
	lastShown: number | null;
}

export function normalizeDonationModalPersistence(
	value: unknown
): IDonationModalPersistence {
	const record = isObjectTagRecord(value) ? value : {};

	return {
		interactionCount: isNonNegativeSafeInteger(record['interactionCount'])
			? record['interactionCount']
			: 0,
		lastMilestoneShown: isNonNegativeSafeInteger(
			record['lastMilestoneShown']
		)
			? record['lastMilestoneShown']
			: 0,
		lastShown:
			record['lastShown'] === null ||
			isNonNegativeSafeInteger(record['lastShown'])
				? record['lastShown']
				: null,
	};
}
