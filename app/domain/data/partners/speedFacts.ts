export const SPEED_LABEL_MAP = {
	Fast: '快',
	Medium: '中等',
	None: '瞬间移动',
	Slow: '慢',
} as const;

export type TSpeedLabel = keyof typeof SPEED_LABEL_MAP;
