import { getActiveLocalizationLocale } from '@/features/catalog/shared/client/localization/activeLocalizationLocale';

import { compareLocalizedName } from '@/shared/utilities/search/localeNameMatch';

interface ISelectionOption<T extends number | string> {
	name: string;
	value: T;
}

export function createPlanSelectionComparator<T extends number | string>(
	options: ReadonlyArray<ISelectionOption<T>>
) {
	const namesByValue = new Map(
		options.map(({ name, value }) => [value, name] as const)
	);

	return (left: T, right: T) => {
		const nameComparison = compareLocalizedName(
			namesByValue.get(left) ?? '',
			namesByValue.get(right) ?? '',
			getActiveLocalizationLocale()
		);
		if (nameComparison !== 0) {
			return nameComparison;
		}
		if (typeof left === 'number' && typeof right === 'number') {
			return left - right;
		}

		const leftValue = String(left);
		const rightValue = String(right);

		return leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
	};
}
