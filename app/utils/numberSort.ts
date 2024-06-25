type TNumberObject = {
	value: number;
};

type TTarget = number | TNumberObject;

export function numberSort(a: number, b: number): number;
export function numberSort(a: TNumberObject, b: TNumberObject): number;
export function numberSort(a: TTarget, b: TTarget) {
	if (typeof a === 'number' && typeof b === 'number') {
		return a - b;
	}

	return (a as TNumberObject).value - (b as TNumberObject).value;
}
