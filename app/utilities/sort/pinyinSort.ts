import {getPinyin, isValueCollection, numberSort} from '@/utilities';

type TValue = string | string[];
type TValueCollection = ValueCollection<TValue>;
type TTarget = TValue | TValueCollection;

function getTone(pinyin: string) {
	const match = pinyin.match(/\d/u);

	return match ? Number.parseInt(match[0]) : 0;
}

function removeTone(pinyin: string) {
	return pinyin.replace(/\d/u, '');
}

function throwError(...args: unknown[]): never {
	throw new TypeError(`[utilities/sort/pinyinSort]: invalid parameter: ${args.join('; ')}`);
}

export function pinyinSort<T extends TTarget>(a: T, b: T) {
	let arrayA: string[], arrayB: string[];

	if (Array.isArray(a) && Array.isArray(b)) {
		arrayA = a;
		arrayB = b;
	} else if (typeof a === 'string' && typeof b === 'string') {
		arrayA = getPinyin(a);
		arrayB = getPinyin(b);
	} else if (isValueCollection(a) && isValueCollection(b)) {
		if (Array.isArray(a.value) && Array.isArray(b.value)) {
			arrayA = a.value;
			arrayB = b.value;
		} else if (typeof a.value === 'string' && typeof b.value === 'string') {
			arrayA = getPinyin(a.value);
			arrayB = getPinyin(b.value);
		} else {
			throwError(a, b);
		}
	} else {
		throwError(a, b);
	}

	const minLength = Math.min(arrayA.length, arrayB.length);

	for (let i = 0; i < minLength; i++) {
		const itemA = arrayA[i] as string;
		const itemB = arrayB[i] as string;

		const pinyinA = removeTone(itemA);
		const pinyinB = removeTone(itemB);
		if (pinyinA < pinyinB) {
			return -1;
		}
		if (pinyinA > pinyinB) {
			return 1;
		}

		const toneA = getTone(itemA);
		const toneB = getTone(itemB);
		if (toneA !== toneB) {
			return numberSort(toneA, toneB);
		}
	}

	return numberSort(arrayA.length, arrayB.length);
}
