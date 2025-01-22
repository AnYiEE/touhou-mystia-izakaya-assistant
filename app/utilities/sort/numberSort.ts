import {isValueCollection} from '@/utilities';

type TValue = number;
type TValueCollection = ValueCollection<TValue>;
type TTarget = TValue | TValueCollection;

export function numberSort<T extends TTarget>(a: T, b: T) {
	let numberA: number, numberB: number;

	if (typeof a === 'number' && typeof b === 'number') {
		numberA = a;
		numberB = b;
	} else if (
		isValueCollection(a) &&
		isValueCollection(b) &&
		typeof a.value === 'number' &&
		typeof b.value === 'number'
	) {
		numberA = a.value;
		numberB = b.value;
	} else {
		// eslint-disable-next-line @typescript-eslint/no-base-to-string
		throw new TypeError(`[utilities/sort/numberSort]: invalid parameter: ${a.toString()}; ${b.toString()}`);
	}

	return numberA - numberB;
}
