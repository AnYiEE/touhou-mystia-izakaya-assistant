import type { TDayMapInteractionKind } from '@/domain/data/maps/types';

export const DAY_MAP_INTERACTION_LABELS = {
	'200k-congratulation-pic': '20万贺图',
	bed: '床',
	'beverage-storage': '酒水仓库',
	'cg-gallery': 'CG鉴赏',
	closet: '衣橱',
	'comic-book': '漫画',
	'congratulation-pic': '贺图',
	'cooking-table': '料理台',
	'creator-box': '造物者之盒',
	'donation-box': '博丽神社赛钱箱',
	fanart: '同人图',
	'food-storage': '食材仓库',
	'jizo-doll': '地藏人偶',
	'lunar-console': '月都终端',
	'music-machine': '幻想节拍',
	'music-player': '留声机',
	'repeat-challenge': '博丽大祭挑战',
	showcase: '展示柜',
	'slot-machine': '飞碟老虎机',
	telephone: '河童重工电话机',
	'ten-thousand-sales': '万本纪念',
} as const satisfies Record<TDayMapInteractionKind, string>;

export const DAY_MAP_TASK_INTERACTION_LABELS = {
	Bottle_A: '瓶子A',
	Bottle_B: '瓶子B',
	Bottle_C: '瓶子C',
	ChickenHair_Clue: '鸡毛线索',
	Jade_Clue: '玉石线索',
	Lantern_A: '灯笼A',
	Lantern_B: '灯笼B',
	Lantern_C: '灯笼C',
	Lantern_D: '灯笼D',
	Lantern_E: '灯笼E',
	LostBook_Clue: '遗失书本线索',
} as const;

export function getTaskInteractionLabel(key: string) {
	if (Object.hasOwn(DAY_MAP_TASK_INTERACTION_LABELS, key)) {
		return DAY_MAP_TASK_INTERACTION_LABELS[
			key as keyof typeof DAY_MAP_TASK_INTERACTION_LABELS
		];
	}
	return '任务线索';
}
