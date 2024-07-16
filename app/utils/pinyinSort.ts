import {pinyin as pinyinPro} from 'pinyin-pro';
import {isObject, isString} from 'lodash';

type TValue = string | string[];

interface IValueObject {
	value: TValue;
}

function checkValueObject(value: TValue | IValueObject): value is IValueObject {
	return isObject(value) && 'value' in value;
}

function getTone(pinyin: string) {
	return Number.parseInt(pinyin.match(/\d/u)?.[0] ?? '0');
}

function removeTone(pinyin: string) {
	return pinyin.replace(/\d/u, '');
}

export function pinyinSort(a: TValue | IValueObject, b: TValue | IValueObject) {
	a = checkValueObject(a) ? a.value : a;
	b = checkValueObject(b) ? b.value : b;

	if (isString(a)) {
		a = pinyinPro(a, {
			toneType: 'num',
			type: 'array',
			v: true,
		});
	}
	if (isString(b)) {
		b = pinyinPro(b, {
			toneType: 'num',
			type: 'array',
			v: true,
		});
	}

	const length = Math.min(a.length, b.length);

	for (let i = 0; i < length; i++) {
		const itemA = a[i] as string;
		const itemB = b[i] as string;

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
			return toneA - toneB;
		}
	}

	return a.length - b.length;
}
