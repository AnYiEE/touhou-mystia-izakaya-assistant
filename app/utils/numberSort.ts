import {isObject} from 'lodash';

type TValue = number;

interface IValueObject {
	value: TValue;
}

type TTarget = TValue | IValueObject;

function checkValueObject(value: TTarget): value is IValueObject {
	return isObject(value) && 'value' in value;
}

export function numberSort(a: TTarget, b: TTarget) {
	a = checkValueObject(a) ? a.value : a;
	b = checkValueObject(b) ? b.value : b;

	return a - b;
}
