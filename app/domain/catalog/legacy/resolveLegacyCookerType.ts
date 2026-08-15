import { COOKER_TYPE_LABEL_MAP } from '@/domain/data/cookers/cookerFacts';
import type { TCookerTypeId } from '@/domain/data/cookers/types';

export function resolveLegacyCookerType(value: unknown): TCookerTypeId {
	const matches = new Set(
		Object.entries(COOKER_TYPE_LABEL_MAP)
			.filter(
				([type, label]) => Number(type) === value || label === value
			)
			.map(([type]) => Number(type) as TCookerTypeId)
	);
	if (matches.size !== 1) {
		throw new Error('invalid-legacy-cooker-type');
	}

	return [...matches][0] as TCookerTypeId;
}
