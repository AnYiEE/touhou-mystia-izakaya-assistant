import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TDlc } from '@/domain/data/shared/types';

import {
	formatSchedulerTaskLabel,
	getSchedulerLabelSeparator,
	getSchedulerLabelText,
} from '@/domain/labels/localizedSchedulerLabels';

interface ISchedulerFact {
	dialogueGuestLabel?: string;
	dlc: TDlc;
	label: string;
	locationLabel?: string;
	specialGuestBond?: { level: number; specialGuest: TSpecialGuestId };
}

export const SCHEDULER_FACTS = {
	_ResourceExample_Kizuna_Flandre_LV1_Upgrade_002_Mission: {
		dlc: 9,
		label: '藉由他人的自我证明',
	},
	_ResourceExample_Kizuna_Mai_LV4_Upgrade_001_Event: {
		dlc: 9,
		label: '羁绊升级',
		specialGuestBond: { level: 5, specialGuest: 11001 },
	},
	_ResourceExample_Kizuna_Yuki_LV4_Upgrade_001_Event: {
		dlc: 9,
		label: '羁绊升级',
		specialGuestBond: { level: 5, specialGuest: 11000 },
	},
	_ResourceExample_Side_ScarletContract_ThrivingProspect_Mission: {
		dlc: 9,
		label: '【绯红契约·向阳】',
	},
	'_ResourceExample_Side_ScarletContract_Tri-horor_001_Mission': {
		dlc: 9,
		label: '【绯红契约·三重恐怖】',
	},
	'_ResourceExample_Side_ScarletContract_Tri-horor_Chen_002_Mission': {
		dlc: 9,
		label: '半行思绪和半段时光',
	},
	'_ResourceExample_Side_ScarletContract_Tri-horor_Mokou_002_Mission': {
		dlc: 9,
		label: '翠绿竹影与亘古明月',
	},
	'_ResourceExample_Side_ScarletContract_Tri-horor_Yuuka_003_Mission': {
		dlc: 9,
		label: '浮生五味与柳暗花明',
	},
	'10ThousandSalesCelebration-Event': { dlc: 0, label: '万份纪念奖励' },
	DLC2_Kizuna_Orin_LV4_Upgrade_Event: {
		dlc: 2,
		label: '羁绊升级',
		specialGuestBond: { level: 5, specialGuest: 2004 },
	},
	DLC2_Kizuna_Parsee_LV4_Upgrade_Event: {
		dlc: 2,
		label: '羁绊升级',
		specialGuestBond: { level: 5, specialGuest: 2001 },
	},
	DLC2_Kizuna_Satori_LV4_Upgrade_Event: {
		dlc: 2,
		label: '羁绊升级',
		specialGuestBond: { level: 5, specialGuest: 2003 },
	},
	DLC2_Kizuna_Utsuho_LV4_Upgrade_Event: {
		dlc: 2,
		label: '羁绊升级',
		specialGuestBond: { level: 5, specialGuest: 2005 },
	},
	DLC2_Kizuna_Yamame_LV4_Upgrade_Event: {
		dlc: 2,
		label: '羁绊升级',
		specialGuestBond: { level: 5, specialGuest: 2000 },
	},
	DLC2_Kizuna_Yuugi_LV4_Upgrade_Event: {
		dlc: 2,
		label: '羁绊升级',
		specialGuestBond: { level: 5, specialGuest: 2002 },
	},
	DLC2_Main_FormerHell_WeirdCooking_FirstChallengeSuccess_Event: {
		dlc: 2,
		label: '怪诞料理大赛',
	},
	DLC4_Kizuna_ImaizumiKagerou_LV4_Upgrade_Mission: {
		dlc: 4,
		label: '内向的人鱼',
	},
	DLC4_Kizuna_ImaizumiKagerou_LV4_Upgrade_TalkWakasagihime_Event: {
		dialogueGuestLabel: '若鹭姬',
		dlc: 4,
		label: '内向的人鱼',
		locationLabel: '雾之湖',
	},
	DLC5_Challenge_ArrestMizuchi_Finished_Event: {
		dlc: 5,
		label: '最终收网行动',
	},
	DLC5_Challenge_PracticeA_Finished_Event: { dlc: 5, label: '月都试炼' },
	DLC5_Challenge_PracticeB_Finished_Event: { dlc: 5, label: '月都试炼' },
	DLC5_Challenge_PracticeC_Finished_Event: { dlc: 5, label: '月都试炼' },
	DLC5_Main_Part8_GotoMakai_Event: { dlc: 5, label: '前往魔界' },
	DLCMusic_Main_AllPass_Event: { dlc: 2.5, label: '爱乐者的挑战赛' },
	'Main_1_BeastForest_006.5_Collab-Event': {
		dlc: 0,
		label: '平行世界的访客',
	},
	Main_4_ScarletMansion_Loop_Mission_A: { dlc: 0, label: '女仆长的采购委托' },
	Main_4_ScarletMansion_Loop_Mission_B: { dlc: 0, label: '女仆长的采购委托' },
	Main_4_ScarletMansion_Loop_Mission_C: { dlc: 0, label: '女仆长的采购委托' },
	Main_5_BambooForest_Concert_Post: { dlc: 0, label: '首次举办演唱会' },
	Side_HumanVillage_Loop_Mission_A: { dlc: 0, label: '阿求小姐的色纸' },
	Side_HumanVillage_Loop_Mission_B: { dlc: 0, label: '阿求小姐的色纸' },
	Side_HumanVillage_Loop_Mission_C: { dlc: 0, label: '阿求小姐的色纸' },
	Side_HumanVillage_Loop_Mission_D: { dlc: 0, label: '阿求小姐的色纸' },
} as const satisfies Record<string, ISchedulerFact>;

export type TSchedulerLabel = keyof typeof SCHEDULER_FACTS;

export type TSpecialGuestBond = NonNullable<ISchedulerFact['specialGuestBond']>;

/** 当所有标签都是稀客羁绊升级事件时返回各自的羁绊信息，否则返回 null。 */
export function getSchedulerSpecialGuestBonds(
	labels: TSchedulerLabel | ReadonlyArray<TSchedulerLabel>
): ReadonlyArray<TSpecialGuestBond> | null {
	const values: ReadonlyArray<TSchedulerLabel> =
		typeof labels === 'string'
			? [labels]
			: [...new Set<TSchedulerLabel>(labels)];
	if (values.length === 0) {
		return null;
	}

	const bonds: TSpecialGuestBond[] = [];
	for (const label of values) {
		const fact = SCHEDULER_FACTS[label];
		if (!('specialGuestBond' in fact)) {
			return null;
		}
		bonds.push(fact.specialGuestBond);
	}

	return bonds;
}

export function formatTaskLabel(label: string) {
	return formatSchedulerTaskLabel(label);
}

export function formatSchedulerLabels(
	labels: TSchedulerLabel | ReadonlyArray<TSchedulerLabel>
) {
	const values: ReadonlyArray<TSchedulerLabel> =
		typeof labels === 'string' ? [labels] : labels;
	return [
		...new Set(
			values.map((label) =>
				getSchedulerLabelText(SCHEDULER_FACTS[label].label)
			)
		),
	].join(getSchedulerLabelSeparator());
}
