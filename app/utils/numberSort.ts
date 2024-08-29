import {isObjectLike} from 'lodash';

type TValue = number;

interface IValueObject {
	value: TValue;
}

type TTarget = TValue | IValueObject;

function checkValueObject(value: TTarget): value is IValueObject {
	return isObjectLike(value) && 'value' in value;
}

export function numberSort<T extends TTarget>(a: T, b: T) {
	let numberA: number, numberB: number;

	if (typeof a === 'number' && typeof b === 'number') {
		numberA = a;
		numberB = b;
	} else if (
		checkValueObject(a) &&
		checkValueObject(b) &&
		typeof a.value === 'number' &&
		typeof b.value === 'number'
	) {
		numberA = a.value;
		numberB = b.value;
	} else {
		// eslint-disable-next-line @typescript-eslint/no-base-to-string
		throw new TypeError(`[utils/numberSort]: invalid parameter: ${a.toString()}; ${b.toString()}`);
	}

	return numberA - numberB;
}
