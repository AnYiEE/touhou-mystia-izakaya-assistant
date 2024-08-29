import {pinyin as pinyinPro} from 'pinyin-pro';
import {isObjectLike} from 'lodash';

import {numberSort} from '@/utils';

type TValue = string | string[];

interface IValueObject {
	value: TValue;
}

type TTarget = TValue | IValueObject;

const pinyinCache = new Map<string, string[]>();

function checkValueObject(value: TTarget): value is IValueObject {
	return isObjectLike(value) && 'value' in value;
}

function getPinyinArray(value: string) {
	if (pinyinCache.has(value)) {
		return pinyinCache.get(value);
	}

	const pinyin = pinyinPro(value, {
		toneType: 'num',
		type: 'array',
		v: true,
	});

	pinyinCache.set(value, pinyin);

	return pinyin;
}

function getTone(pinyin: string) {
	return Number.parseInt(pinyin.match(/\d/u)?.[0] ?? '0');
}

function removeTone(pinyin: string) {
	return pinyin.replace(/\d/u, '');
}

function throwError(...args: unknown[]): never {
	throw new TypeError(`[utils/pinyinSort]: invalid parameter: ${args.join('; ')}`);
}

export function pinyinSort<T extends TTarget>(a: T, b: T) {
	let arrayA: string[], arrayB: string[];

	if (Array.isArray(a) && Array.isArray(b)) {
		arrayA = a;
		arrayB = b;
	} else if (typeof a === 'string' && typeof b === 'string') {
		arrayA = getPinyinArray(a);
		arrayB = getPinyinArray(b);
	} else if (checkValueObject(a) && checkValueObject(b)) {
		if (Array.isArray(a.value) && Array.isArray(b.value)) {
			arrayA = a.value;
			arrayB = b.value;
		} else if (typeof a.value === 'string' && typeof b.value === 'string') {
			arrayA = getPinyinArray(a.value);
			arrayB = getPinyinArray(b.value);
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
