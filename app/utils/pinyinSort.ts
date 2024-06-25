import {pinyin as pinyinPro} from 'pinyin-pro';

type TValue = string | string[];

interface IValueObeject {
	value: TValue;
}

function checkValueObject(value: TValue | IValueObeject): value is IValueObeject {
	return typeof value === 'object' && value !== null && 'value' in value;
}

function getTone(pinyin: string) {
	return parseInt(pinyin.match(/\d/)?.[0] ?? '0');
}

function removeTone(pinyin: string) {
	return pinyin.replace(/\d/, '');
}

export function pinyinSort(a: TValue | IValueObeject, b: TValue | IValueObeject) {
	a = checkValueObject(a) ? a.value : a;
	b = checkValueObject(b) ? b.value : b;

	if (typeof a === 'string') {
		a = pinyinPro(a, {
			toneType: 'num',
			type: 'array',
			v: true,
		});
	}
	if (typeof b === 'string') {
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
