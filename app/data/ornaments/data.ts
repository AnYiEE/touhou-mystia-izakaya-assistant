/* eslint-disable sort-keys */
import type {IOrnament} from './types';

export const ORNAMENT_LIST = [
	{
		name: '招财猫',
		dlc: 0,
		effect: '使店内的小费率额外增加15%。',
		from: {
			name: '橙',
			level: 5,
		},
	},
	{
		name: '富贵牡丹',
		dlc: 0,
		effect: '顾客对料理的评价若至少为普通，则心情额外增加15。',
		from: {
			name: '茨木华扇',
			level: 5,
		},
	},
	{
		name: '强运桃子',
		dlc: 0,
		effect: '顾客对料理的评价若至少为普通，则有15%的概率提高评价至完美。',
		from: {
			name: '比那名居天子',
			level: 5,
		},
	},
	{
		name: '胖滚君',
		dlc: 0,
		effect: '店内所有顾客每15秒会进行1-20的打赏。',
		from: {
			name: '红美铃',
			level: 5,
		},
	},
	{
		name: '幸运的素兔？',
		dlc: 0,
		effect: '制作料理时有15%的概率不会减少食材。',
		from: {
			name: '因幡帝',
			level: 5,
		},
	},
	{
		name: '地藏人偶',
		dlc: 1,
		effect: '成美给的礼物，可以放置在家门口，每天参拜会得到很棒的贡品。',
		from: {
			name: '矢田寺成美',
			level: 5,
		},
	},
	{
		name: '河童重工电话机',
		dlc: 1,
		effect: '幻想乡流行起来的远程通话装置，使用它不用到达朋友的面前也可以通话。',
		from: {
			name: '河城荷取',
			level: 5,
		},
	},
	{
		name: '仇返人形',
		dlc: 2,
		effect: '可以抵挡一次中断Combo的失误。',
		from: {
			name: '水桥帕露西',
			level: 5,
		},
	},
	{
		name: '觉之眼',
		dlc: 2,
		effect: '可以看到每个顾客的预算额度。',
		from: {
			name: '古明地觉',
			level: 5,
		},
	},
	{
		name: '飞碟老虎机',
		dlc: 3,
		effect: '有几率获得意外奖励。',
		from: {
			name: '封兽鵺',
			level: 5,
		},
	},
	{
		name: '钓鱼竿',
		dlc: 4,
		effect: '普通的钓鱼竿，只能进行一些简单的钓鱼工作。',
		from: {
			name: '今泉影狼',
			level: 1,
		},
	},
	{
		name: '超级钓鱼竿',
		dlc: 4,
		effect: '可以进行精细高级操作的钓鱼竿，除了能够钓鱼，还能够寻找到宝箱。',
		from: {
			name: '今泉影狼',
			level: 5,
		},
	},
	{
		name: '杜门谢客',
		dlc: 5,
		effect: '能够屏蔽稀有顾客来店（包括邀请顾客）。',
		from: {
			name: '魅魔',
			level: 5,
		},
	},
	{
		name: '门无杂宾',
		dlc: 5,
		effect: '能够屏蔽普通顾客来店（包括符卡效果）。',
		from: {
			name: '绵月丰姬',
			level: 5,
		},
	},
] as const satisfies IOrnament[];
