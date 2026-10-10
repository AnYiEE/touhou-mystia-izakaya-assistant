import type { ICollaborationLocalization } from '@/domain/data/localization/types';

export const COLLABORATION_LOCALIZATION_JA = {
	labels: {
		'3FARIES_Collab': '三妖精のぴょこぴょこ討伐大作戦！',
		MC_Gensokyo: 'MC幻想郷',
		ResourceEx_GiftMailbox: null,
		TBC2_Collab: '東方華彩乱戦2',
		TBS_Kokoro: '東方華心伝',
		THYG: '東方妖精武踏祭',
	},
} as const satisfies ICollaborationLocalization;
