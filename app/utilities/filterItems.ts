import {
	checkArrayContainsOf,
	checkArraySubsetOf,
	checkLengthEmpty,
} from '@/utilities';

type TFilterMatch =
	| 'in'
	| 'all'
	| 'any'
	| 'excludeIn'
	| 'excludeAll'
	| 'excludeAny';

interface IFilterCondition<T> {
	field: keyof T;
	match: TFilterMatch;
	values: ReadonlyArray<string> | null;
}

function matchCondition<T>(item: T, condition: IFilterCondition<T>) {
	const { field, match, values } = condition;

	if (values === null || checkLengthEmpty(values)) {
		return true;
	}

	const fieldValue = item[field];

	switch (match) {
		case 'in':
			return values.includes(String(fieldValue));
		case 'excludeIn':
			return !values.includes(String(fieldValue));
		case 'all': {
			const array = [fieldValue].flat() as string[];
			return checkArraySubsetOf(values as string[], array);
		}
		case 'excludeAll': {
			const array = [fieldValue].flat() as string[];
			return !checkArraySubsetOf(values as string[], array);
		}
		case 'any': {
			const array = [fieldValue].flat() as string[];
			return checkArrayContainsOf(values as string[], array);
		}
		case 'excludeAny': {
			const array = [fieldValue].flat() as string[];
			return !checkArrayContainsOf(values as string[], array);
		}
		default:
			return true;
	}
}

export function filterItems<T>(
	data: ReadonlyArray<T>,
	conditions: ReadonlyArray<IFilterCondition<T>>
) {
	return data.filter((item) =>
		conditions.every((condition) => matchCondition(item, condition))
	);
}
