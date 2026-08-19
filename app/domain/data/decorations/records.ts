import type { IDecoration } from './schema';

/* eslint-disable sort-keys -- Keep identity, display, DLC, effect, then source as the record data-table column order. */
export const DECORATION_LIST = [
	{
		id: 32,
		name: '招财猫',
		description: '橙赠送的摆件，也许有着招揽财富和客人程度的能力（？）。',
		dlc: 0,
		effect: '使店内的小费率额外增加15%。',
		from: { bond: { level: 5, specialGuest: 2 } },
	},
	{
		id: 33,
		name: '富贵牡丹',
		description: '茨华仙赠送的盆栽，寓意着圆满富贵，花很好看。',
		dlc: 0,
		effect: '如果顾客对料理的评价至少为普通，则心情额外增加15。',
		from: { bond: { level: 5, specialGuest: 5 } },
	},
	{
		id: 34,
		name: '强运桃子',
		description:
			'并不是真正的桃子，似乎是比那名居天子亲手做的。虽然不能吃，但据说能带来好运。',
		dlc: 0,
		effect: '如果顾客对料理的评价至少为普通，则有15%的概率提高评价至完美。',
		from: { bond: { level: 5, specialGuest: 9 } },
	},
	{
		id: 50,
		name: '胖滚君',
		description:
			'代替红美铃守护夜雀食堂的熊猫，全身黑白分明，据说是个集万千宠爱于一身的国宝…这样的话，是我守护它才对吧？！',
		dlc: 0,
		effect: '店内所有顾客每15秒会进行1-20円的打赏。',
		from: { bond: { level: 5, specialGuest: 15 } },
	},
	{
		id: 51,
		name: '幸运的素兔？',
		description:
			'怎么看都像是随手抓来的兔子，但因为是帝抓来的，竟然有着奇妙的幸运。',
		dlc: 0,
		effect: '制作料理时有15%的概率不会减少食材。',
		from: { bond: { level: 5, specialGuest: 29 } },
	},
	{
		id: 62,
		name: '喜之面',
		description: '《东方华心传》的联动礼物，代表“喜”情绪的面具。',
		dlc: 0,
		effect: '客人的预算提高20%。受到【秦心】的符卡效果强化后，效果提升至200%。情绪面具摆件只能选择一个进行摆放。',
		from: { collaboration: { collaborationLabel: '东方华心传' } },
	},
	{
		id: 63,
		name: '怒之面',
		description: '《东方华心传》的联动礼物，代表“怒”情绪的面具。',
		dlc: 0,
		effect: '减少10%料理时间。受到【秦心】的符卡效果强化后，效果提升至75%。情绪面具摆件只能选择一个进行摆放。',
		from: { collaboration: { collaborationLabel: '东方华心传' } },
	},
	{
		id: 64,
		name: '哀之面',
		description: '《东方华心传》的联动礼物，代表“哀”情绪的面具。',
		dlc: 0,
		effect: '客人的续单概率提高5%。受到【秦心】的符卡效果强化后，效果提升至50%。情绪面具摆件只能选择一个进行摆放。',
		from: { collaboration: { collaborationLabel: '东方华心传' } },
	},
	{
		id: 65,
		name: '乐之面',
		description: '《东方华心传》的联动礼物，代表“乐”情绪的面具。',
		dlc: 0,
		effect: '稀有客人首次给出评价时，评价等级至少为普通。受到【秦心】的符卡效果强化后，效果改为至少为完美。情绪面具摆件只能选择一个进行摆放。',
		from: { collaboration: { collaborationLabel: '东方华心传' } },
	},
	{
		id: 1003,
		name: '地藏人偶',
		description: '成美给的礼物，可以放置在家附近。',
		dlc: 1,
		effect: '每天参拜会得到很棒的供品（两种酒水和两份食材）。',
		from: { bond: { level: 5, specialGuest: 1004 } },
	},
	{
		id: 1004,
		name: '河童重工电话机',
		description: '幻想乡流行起来的远程通话装置。',
		dlc: 1,
		effect: '使用它不用到达朋友的面前也可以通话。',
		from: { bond: { level: 5, specialGuest: 1000 } },
	},
	{
		id: 2003,
		name: '觉之眼',
		description: '是觉妖怪读心眼的复制品。',
		dlc: 2,
		effect: '可以看到每个顾客的预算额度。',
		from: { bond: { level: 5, specialGuest: 2003 } },
	},
	{
		id: 2004,
		name: '仇返人形',
		description:
			'虽然看起来可怕又不幸，但其实意外的能够保护拥有者，会替拥有者抵挡不幸。',
		dlc: 2,
		effect: '可以抵挡一次中断Combo的失误。',
		from: { bond: { level: 5, specialGuest: 2001 } },
	},
	{
		id: 3000,
		name: '飞碟老虎机',
		description:
			'使用真相不明的能力制造的迷之机器，据说灵感来源于外面世界的某种机器。',
		dlc: 3,
		effect: '有几率获得意外奖励，但过度沉迷必定会导致破产！抽奖结果：“红红红”➞海鲜类和肉类食材共十份；“绿绿绿”➞蔬菜类食材共十份；“蓝蓝蓝”➞四或五种酒水；“红绿蓝”➞前述奖励随机共十份，必然有四种三级或以上等级的酒水。',
		from: { bond: { level: 5, specialGuest: 3002 } },
	},
	{
		id: 4000,
		name: '普通的钓鱼竿',
		description:
			'普通的钓鱼竿，只能进行一些简单的钓鱼工作，想必效率不高。在地下室的展示柜中启用后，各地会出现钓鱼点。',
		dlc: 4,
		effect: '在地下室的展示柜中启用后，各地会出现钓鱼点。',
		from: { bond: { level: 1, specialGuest: 4005 } },
	},
	{
		id: 4001,
		name: '超级钓鱼竿',
		description:
			'可以进行精细高级操作的钓鱼竿，除了能够钓鱼，还能够寻找到宝箱！非常神奇！在地下室的展示柜中启用后，各地会出现钓鱼点。',
		dlc: 4,
		effect: '在地下室的展示柜中启用后，各地会出现钓鱼点。',
		from: {
			bond: { level: 5, specialGuest: 4005 },
			task: {
				dialogueGuestLabel: '若鹭姬',
				locationLabel: '雾之湖',
				map: 'ScarletMansion',
				task: '内向的人鱼',
			},
		},
	},
	{
		id: 5012,
		name: '门无杂宾',
		description: '神奇的道具。',
		dlc: 5,
		effect: '能够屏蔽普通顾客来店（包括符卡效果）。',
		from: { bond: { level: 5, specialGuest: 5001 } },
	},
	{
		id: 5013,
		name: '杜门谢客',
		description: '神奇的道具。',
		dlc: 5,
		effect: '能够屏蔽稀有顾客来店（包括邀请顾客）。',
		from: { bond: { level: 5, specialGuest: 5004 } },
	},
	{
		id: 5014,
		name: '造物者之盒',
		description:
			'来自另一个次元的“终极礼物”，能让拥有者成为“造物主”的神奇盒子。',
		dlc: 5,
		effect: '可以以秒为单位，编辑夜晚顾客前来的次序和时间点。',
		from: {
			completion: {
				maps: ['DLC5_LunarCapital', 'DLC5_Makai'],
				specialGuest: 9004,
				story: { conditionLabel: '全部剧情', dlc: 5 },
			},
		},
	},
] as const satisfies IDecoration[];
/* eslint-enable sort-keys */
