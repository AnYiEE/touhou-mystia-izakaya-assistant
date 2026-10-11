import { type TCatalogGuestsTranslate } from '@/features/catalog/guests/shared/messages';

export type TSelectionTipAction = 'rate' | 'save';
export type TSelectionTipTarget = 'beverage' | 'food' | 'order';

export interface ISelectionTip {
	action: TSelectionTipAction;
	showCookerSuffix: boolean;
	targets: ReadonlyArray<TSelectionTipTarget>;
}

const SELECTION_TIP_TARGET_MESSAGE_KEYS = {
	beverage: 'guests.selectionTip.targetBeverage',
	food: 'guests.selectionTip.targetFood',
	order: 'guests.selectionTip.targetOrder',
} as const;

const SELECTION_TIP_ACTION_MESSAGE_KEYS = {
	rate: 'guests.selectionTip.actionRate',
	save: 'guests.selectionTip.actionSave',
} as const;

export function buildSelectionTip({
	action,
	hasMystiaCooker,
	hasSelectedBeverage,
	hasSelectedFood,
	isDarkMatter,
}: {
	action: TSelectionTipAction;
	hasMystiaCooker: boolean;
	hasSelectedBeverage: boolean;
	hasSelectedFood: boolean;
	isDarkMatter: boolean;
}): ISelectionTip | null {
	const targets: TSelectionTipTarget[] = [];

	if ((hasMystiaCooker && isDarkMatter) || !hasMystiaCooker) {
		targets.push('order');
	}
	if (!hasSelectedFood) {
		targets.push('food');
	}
	if (!hasSelectedBeverage) {
		targets.push('beverage');
	}

	if (targets.length === 0) {
		return null;
	}

	return {
		action,
		showCookerSuffix: !isDarkMatter && !hasMystiaCooker,
		targets,
	};
}

export function formatSelectionTip(
	tip: ISelectionTip | null,
	t: TCatalogGuestsTranslate
) {
	if (tip === null) {
		return '';
	}

	const targetLabels = tip.targets.map((target) =>
		t(SELECTION_TIP_TARGET_MESSAGE_KEYS[target])
	);
	const content =
		targetLabels.join(t('guests.listSeparator')) +
		(tip.showCookerSuffix
			? t('guests.selectionTip.mystiaCookerSuffix')
			: '');

	return t('guests.selectionTip.template', {
		action: t(SELECTION_TIP_ACTION_MESSAGE_KEYS[tip.action]),
		target: content,
	});
}
