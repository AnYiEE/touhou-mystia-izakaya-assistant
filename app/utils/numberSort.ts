type NumberObject = {
	value: number;
};

type Target = number | NumberObject;

export function numberSort(a: number, b: number): number;
export function numberSort(a: NumberObject, b: NumberObject): number;
export function numberSort(a: Target, b: Target) {
	if (typeof a === 'number' && typeof b === 'number') {
		return a - b;
	}

	return (a as NumberObject).value - (b as NumberObject).value;
}
