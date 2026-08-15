import { type Selection } from '@heroui/table';

import { resolveLegacyTagLabel } from '@/domain/catalog/legacy/resolveLegacyTagLabel';
import { BEVERAGE_TAG_MAP, FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';

interface ITagSelectionAdapter<TId extends number> {
	fromSelection(selection: Selection): Set<TId>;
	toSelectedKeys(selection: ReadonlySet<string | number>): Set<string>;
}

function createTagSelectionAdapter<TId extends number>(
	category: 'BeverageTag' | 'FoodTag',
	facts: Readonly<Record<TId, string>>
): ITagSelectionAdapter<TId> {
	const resolveStoredValue = (value: string | number) => {
		const errorCode = `Expected exactly one legacy ${category} named ${String(value)}.`;
		if (typeof value === 'number') {
			if (Object.hasOwn(facts, value)) {
				return value as TId;
			}
			throw new Error(errorCode);
		}

		return resolveLegacyTagLabel({ errorCode, facts, label: value });
	};

	return {
		fromSelection(selection) {
			if (selection === 'all') {
				throw new Error(`${category} selection does not accept all.`);
			}

			const ids = new Set<TId>();
			for (const key of selection) {
				if (typeof key !== 'string') {
					throw new TypeError(
						`Invalid ${category} selection key: ${String(key)}.`
					);
				}

				const id = Number(key);
				if (
					!Number.isSafeInteger(id) ||
					String(id) !== key ||
					!Object.hasOwn(facts, id)
				) {
					throw new Error(
						`Invalid ${category} selection key: ${key}.`
					);
				}

				ids.add(id as TId);
			}

			return ids;
		},
		toSelectedKeys(selection) {
			return new Set(
				Array.from(selection, (value) =>
					String(resolveStoredValue(value))
				)
			);
		},
	};
}

export const beverageTagSelectionAdapter =
	createTagSelectionAdapter<TBeverageTagId>('BeverageTag', BEVERAGE_TAG_MAP);

export const foodTagSelectionAdapter = createTagSelectionAdapter<TFoodTagId>(
	'FoodTag',
	FOOD_TAG_MAP
);
