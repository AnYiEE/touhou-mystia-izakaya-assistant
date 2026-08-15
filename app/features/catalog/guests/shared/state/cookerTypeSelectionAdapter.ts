import { type Selection } from '@heroui/table';

import { COOKER_TYPE_LABEL_MAP } from '@/domain/data/cookers/cookerFacts';
import type { TCookerTypeId } from '@/domain/data/cookers/types';

export const cookerTypeSelectionAdapter = {
	fromSelection(selection: Selection): Set<TCookerTypeId> {
		if (selection === 'all') {
			throw new Error('CookerType selection does not accept all.');
		}

		const ids = new Set<TCookerTypeId>();
		for (const key of selection) {
			if (typeof key !== 'string') {
				throw new TypeError(
					`Invalid CookerType selection key: ${String(key)}.`
				);
			}

			const id = Number(key);
			if (
				!Number.isSafeInteger(id) ||
				String(id) !== key ||
				!Object.hasOwn(COOKER_TYPE_LABEL_MAP, id)
			) {
				throw new Error(`Invalid CookerType selection key: ${key}.`);
			}

			ids.add(id as TCookerTypeId);
		}

		return ids;
	},
	toSelectedKeys(selection: ReadonlySet<TCookerTypeId>): Set<string> {
		return new Set(Array.from(selection, String));
	},
};
