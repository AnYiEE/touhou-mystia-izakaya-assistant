import { checkLengthEmpty } from '@/shared/utilities/collections/check';

export function buildSelectionTip({
	action,
	hasMystiaCooker,
	hasSelectedBeverage,
	hasSelectedFood,
	isDarkMatter,
}: {
	action: '保存' | '评级';
	hasMystiaCooker: boolean;
	hasSelectedBeverage: boolean;
	hasSelectedFood: boolean;
	isDarkMatter: boolean;
}) {
	const target: string[] = [];

	if ((hasMystiaCooker && isDarkMatter) || !hasMystiaCooker) {
		target.push('顾客点单需求');
	}
	if (!hasSelectedFood) {
		target.push('料理');
	}
	if (!hasSelectedBeverage) {
		target.push('酒水');
	}

	if (checkLengthEmpty(target)) {
		return '';
	}

	let content = target.join('、');
	if (!isDarkMatter && !hasMystiaCooker) {
		content += '或点击厨具图标标记为使用“夜雀”系列厨具';
	}

	return `请选择${content}以${action}`;
}
