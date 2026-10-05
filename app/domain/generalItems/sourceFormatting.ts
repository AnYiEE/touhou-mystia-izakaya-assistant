import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import type { TGeneralItemSource } from '@/domain/data/generalItems/schema';
import { COLLABORATION_LABEL_MAP } from '@/domain/data/labels/collaborationFacts';
import {
	SCHEDULER_FACTS,
	formatSchedulerLabels,
	formatTaskLabel,
} from '@/domain/data/labels/schedulerFacts';
import { MAP_FACTS } from '@/domain/data/places/placeFacts';

const currencyItemCatalog = CurrencyItemCatalog.getInstance();
const specialGuestCatalog = SpecialGuestCatalog.getInstance();

function formatSpecialGuestReference(
	specialGuest: Parameters<typeof specialGuestCatalog.getPropsById>[0]
) {
	return `【${specialGuestCatalog.getPropsById(specialGuest, 'name')}】`;
}

export function formatGeneralItemSource(source: TGeneralItemSource) {
	if ('areaTask' in source) {
		return `地区【${MAP_FACTS[source.areaTask.map].label}】${source.areaTask.task}`;
	}
	if ('collaborationUnlock' in source) {
		return `通过联动终端【${COLLABORATION_LABEL_MAP[source.collaborationUnlock.collaborationLabel]}】选项领取`;
	}
	if ('holdingCurrencyItem' in source) {
		const { amount, currencyItem } = source.holdingCurrencyItem;
		return `持有${amount}枚“${currencyItemCatalog.getPropsById(currencyItem, 'name')}”时自动获得`;
	}
	if ('schedulerLabel' in source) {
		const fact = SCHEDULER_FACTS[source.schedulerLabel];
		if ('specialGuestBond' in fact) {
			const { level, specialGuest } = fact.specialGuestBond;
			return `${formatSpecialGuestReference(specialGuest)}羁绊Lv.${level - 1}➞Lv.${level}`;
		}
		return formatSchedulerLabels(source.schedulerLabel);
	}
	if ('taskReward' in source) {
		return `任务${formatTaskLabel(formatSchedulerLabels(source.taskReward))}`;
	}
	return `${formatSpecialGuestReference(source.positiveSpellCard)}奖励符卡`;
}
