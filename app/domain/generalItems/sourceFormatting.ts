import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import type { TGeneralItemSource } from '@/domain/data/generalItems/schema';
import {
	SCHEDULER_FACTS,
	formatSchedulerLabels,
} from '@/domain/data/labels/schedulerFacts';

const currencyItemCatalog = CurrencyItemCatalog.getInstance();
const specialGuestCatalog = SpecialGuestCatalog.getInstance();

function formatSpecialGuestReference(
	specialGuest: Parameters<typeof specialGuestCatalog.getPropsById>[0]
) {
	return `【${specialGuestCatalog.getPropsById(specialGuest, 'name')}】`;
}

export function formatGeneralItemSource(source: TGeneralItemSource) {
	if ('schedulerLabel' in source) {
		const fact = SCHEDULER_FACTS[source.schedulerLabel];
		if ('specialGuestBond' in fact) {
			const { level, specialGuest } = fact.specialGuestBond;
			return `${formatSpecialGuestReference(specialGuest)}羁绊Lv.${level - 1}➞Lv.${level}`;
		}
		return formatSchedulerLabels(source.schedulerLabel);
	}
	if ('taskReward' in source) {
		return `完成“${formatSchedulerLabels(source.taskReward)}”任务后自动获得`;
	}
	if ('holdingCurrencyItem' in source) {
		const { amount, currencyItem } = source.holdingCurrencyItem;
		return `持有${amount}枚“${currencyItemCatalog.getPropsById(currencyItem, 'name')}”时自动获得`;
	}
	return `${formatSpecialGuestReference(source.positiveSpellCard)}奖励符卡`;
}
