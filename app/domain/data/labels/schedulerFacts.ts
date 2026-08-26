import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TDlc } from '@/domain/data/shared/types';

interface ISchedulerFact {
	dialogueGuestLabel?: string;
	dlc: TDlc;
	label: string;
	locationLabel?: string;
	specialGuestBond?: { level: number; specialGuest: TSpecialGuestId };
}

export const SCHEDULER_FACTS = {
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
	'Main_4_ScarletMansion_014-Mission_002': { dlc: 0, label: '红魔馆主线' },
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

export function formatSchedulerLabels(
	labels: TSchedulerLabel | ReadonlyArray<TSchedulerLabel>
) {
	const values: ReadonlyArray<TSchedulerLabel> =
		typeof labels === 'string' ? [labels] : labels;
	return [
		...new Set(values.map((label) => SCHEDULER_FACTS[label].label)),
	].join('、');
}
