export const COLLABORATION_LABEL_MAP = {
	'3FARIES_Collab': '三妖精的蹦蹦跳跳讨伐大作战',
	MC_Gensokyo: 'MC幻想乡',
	TBC2_Collab: '东方华彩乱战2',
	TBS_Kokoro: '东方华心传',
	THYG: '东方妖精武踏会',
} as const;

export type TCollaborationLabel = keyof typeof COLLABORATION_LABEL_MAP;
