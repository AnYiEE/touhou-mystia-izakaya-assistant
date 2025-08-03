/* eslint-disable sort-keys */
import type { IOrnament } from './types';

export const ORNAMENT_LIST = [
	{
		id: 32,
		name: '招财猫',
		description: '橙赠送的摆件，也许有着招揽财富和客人程度的能力（？）。',
		dlc: 0,
		effect: '使店内的小费率额外增加15%。',
		from: { bond: '橙', level: 5 },
	},
	{
		id: 33,
		name: '富贵牡丹',
		description: '茨华仙赠送的盆栽，寓意着圆满富贵，花很好看。',
		dlc: 0,
		effect: '如果顾客对料理的评价至少为普通，则心情额外增加15。',
		from: { bond: '茨木华扇', level: 5 },
	},
	{
		id: 34,
		name: '强运桃子',
		description:
			'并不是真正的桃子，似乎是比那名居天子亲手做的。虽然不能吃，但据说能带来好运。',
		dlc: 0,
		effect: '如果顾客对料理的评价至少为普通，则有15%的概率提高评价至完美。',
		from: { bond: '比那名居天子', level: 5 },
	},
	{
		id: 50,
		name: '胖滚君',
		description:
			'代替红美铃守护夜雀食堂的熊猫，全身黑白分明，据说是个集万千宠爱于一身的国宝…这样的话，是我守护它才对吧？！',
		dlc: 0,
		effect: '店内所有顾客每15秒会进行1-20円的打赏。',
		from: { bond: '红美铃', level: 5 },
	},
	{
		id: 51,
		name: '幸运的素兔？',
		description:
			'怎么看都像是随手抓来的兔子，但因为是帝抓来的，竟然有着奇妙的幸运。',
		dlc: 0,
		effect: '制作料理时有15%的概率不会减少食材。',
		from: { bond: '因幡帝', level: 5 },
	},
	{
		id: 1003,
		name: '地藏人偶',
		description: '成美给的礼物，可以放置在家附近。',
		dlc: 1,
		effect: '每天参拜会得到很棒的供品（两种酒水和两份食材）。',
		from: { bond: '矢田寺成美', level: 5 },
	},
	{
		id: 1004,
		name: '河童重工电话机',
		description: '幻想乡流行起来的远程通话装置。',
		dlc: 1,
		effect: '使用它不用到达朋友的面前也可以通话。',
		from: { bond: '河城荷取', level: 5 },
	},
	{
		id: 2003,
		name: '觉之眼',
		description: '是觉妖怪读心眼的复制品。',
		dlc: 2,
		effect: '可以看到每个顾客的预算额度。',
		from: { bond: '古明地觉', level: 5 },
	},
	{
		id: 2004,
		name: '仇返人形',
		description:
			'虽然看起来可怕又不幸，但其实意外的能够保护拥有者，会替拥有者抵挡不幸。',
		dlc: 2,
		effect: '可以抵挡一次中断Combo的失误。',
		from: { bond: '水桥帕露西', level: 5 },
	},
	{
		id: 3000,
		name: '飞碟老虎机',
		description:
			'使用真相不明的能力制造的迷之机器，据说灵感来源于外面世界的某种机器。',
		dlc: 3,
		effect: '有几率获得意外奖励。抽奖结果：“红红红”➞海鲜类和肉类食材共十份；“绿绿绿”➞蔬菜类食材共十份；“蓝蓝蓝”➞四或五种酒水；“红绿蓝”➞前述奖励随机共十份，必然有四种三级或以上等级的酒水。',
		from: { bond: '封兽鵺', level: 5 },
	},
	{
		id: 4000,
		name: '普通的钓鱼竿',
		description: '普通的钓鱼竿，只能进行一些简单的钓鱼工作，想必效率不高。',
		dlc: 4,
		effect: '在地下室的展示柜中启用后，各地会出现钓鱼点。',
		from: { bond: '今泉影狼', level: 1 },
	},
	{
		id: 4001,
		name: '超级钓鱼竿',
		description:
			'可以进行精细高级操作的钓鱼竿，除了能够钓鱼，还能够寻找到宝箱！非常神奇！',
		dlc: 4,
		effect: '在地下室的展示柜中启用后，各地会出现钓鱼点。',
		from: { bond: '今泉影狼', level: 5 },
	},
	{
		id: 5012,
		name: '门无杂宾',
		description: '神奇的道具。',
		dlc: 5,
		effect: '能够屏蔽普通顾客来店（包括符卡效果）。',
		from: { bond: '绵月丰姬', level: 5 },
	},
	{
		id: 5013,
		name: '杜门谢客',
		description: '神奇的道具。',
		dlc: 5,
		effect: '能够屏蔽稀有顾客来店（包括邀请顾客）。',
		from: { bond: '魅魔', level: 5 },
	},
	{
		id: 5014,
		name: '造物者之盒',
		description:
			'来自另一个次元的“终极礼物”，能让拥有者成为“造物主”的神奇盒子。',
		dlc: 5,
		effect: '可以以秒为单位，编辑夜晚顾客前来的次序和时间点。',
		from: '地区【月之都】和【魔界】全部稀客羁绊满级，并完成【DLC5】全部剧情后，和【神绮】对话领取。',
	},
] as const satisfies IOrnament[];
