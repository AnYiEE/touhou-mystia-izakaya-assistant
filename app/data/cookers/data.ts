/* eslint-disable sort-keys */
import type {ICooker} from './types';
import {DARK_MATTER_NAME, TAG_POPULAR_POSITIVE} from '@/data/constant';

export const COOKER_LIST = [
	{
		id: 0,
		name: '煮锅',
		description:
			'普通的煮锅。用了古老的中国陶土制作工艺，能够很好地聚集热量，甚至给锅内增加压力，使食材高效地炖煮，是料理人都用顺手的厨具。',
		type: 0,
		category: 0,
		dlc: 0,
		effect: null,
		from: [
			{
				self: true,
			},
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [500],
				},
			},
		],
	},
	{
		id: 1,
		name: '烧烤架',
		description:
			'普通的铁炉。在炉内放入炭火，通过上方的网状设计可以有效地让热量传递给食材，烤出属于大自然的野性味道，粗犷的人们最爱它制作的料理。',
		type: 1,
		category: 0,
		dlc: 0,
		effect: null,
		from: [
			{
				self: true,
			},
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [500],
				},
			},
		],
	},
	{
		id: 2,
		name: '油锅',
		description:
			'在其中放入油，高温下不管什么东西丢进去炸一下，都可以变成可口的料理，实在是魔鬼的技术！…但这样的料理并不健康。',
		type: 2,
		category: 0,
		dlc: 0,
		effect: null,
		from: [
			{
				self: true,
			},
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [500],
				},
			},
		],
	},
	{
		id: 3,
		name: '蒸锅',
		description:
			'蒸是划时代的料理技巧，能够快速、批量地使料理熟透，是极其高效的方法，而且营养不易流失！是养生人士的最爱！',
		type: 3,
		category: 0,
		dlc: 0,
		effect: null,
		from: [
			{
				self: true,
			},
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [500],
				},
			},
		],
	},
	{
		id: 4,
		name: '料理台',
		description:
			'制作生冷原味食材的必备厨具！无论是处理生肉、生鱼或是处理凉菜沙拉，都是非常方便的厨具。原生的，就是最美味的！',
		type: 4,
		category: 0,
		dlc: 0,
		effect: null,
		from: [
			{
				self: true,
			},
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [500],
				},
			},
		],
	},
	{
		id: 5,
		name: '夜雀煮锅',
		description: '迷失在夜雀的歌声里吧！',
		type: 0,
		category: 1,
		dlc: 0,
		effect: [
			'额外消耗25%料理时间。在完美完成“夜雀之歌”或在“热火朝天”状态下制作出的料理，可以无视稀有顾客本轮点单需求，只通过喜好标签评级。',
			true,
		],
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 3,
							amount: 7,
						},
					],
				},
			},
		],
	},
	{
		id: 6,
		name: '夜雀烧烤架',
		description: '迷失在夜雀的歌声里吧！',
		type: 1,
		category: 1,
		dlc: 0,
		effect: [
			'额外消耗25%料理时间。在完美完成“夜雀之歌”或在“热火朝天”状态下制作出的料理，可以无视稀有顾客本轮点单需求，只通过喜好标签评级。',
			true,
		],
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 3,
							amount: 7,
						},
					],
				},
			},
		],
	},
	{
		id: 7,
		name: '夜雀油锅',
		description: '迷失在夜雀的歌声里吧！',
		type: 2,
		category: 1,
		dlc: 0,
		effect: [
			'额外消耗25%料理时间。在完美完成“夜雀之歌”或在“热火朝天”状态下制作出的料理，可以无视稀有顾客本轮点单需求，只通过喜好标签评级。',
			true,
		],
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 3,
							amount: 7,
						},
					],
				},
			},
		],
	},
	{
		id: 8,
		name: '夜雀蒸锅',
		description: '迷失在夜雀的歌声里吧！',
		type: 3,
		category: 1,
		dlc: 0,
		effect: [
			'额外消耗25%料理时间。在完美完成“夜雀之歌”或在“热火朝天”状态下制作出的料理，可以无视稀有顾客本轮点单需求，只通过喜好标签评级。',
			true,
		],
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 3,
							amount: 7,
						},
					],
				},
			},
		],
	},
	{
		id: 9,
		name: '夜雀料理台',
		description: '迷失在夜雀的歌声里吧！',
		type: 4,
		category: 1,
		dlc: 0,
		effect: [
			'额外消耗25%料理时间。在完美完成“夜雀之歌”或在“热火朝天”状态下制作出的料理，可以无视稀有顾客本轮点单需求，只通过喜好标签评级。',
			true,
		],
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 3,
							amount: 7,
						},
					],
				},
			},
		],
	},
	{
		id: 10,
		name: '超煮锅',
		description: '升级后的煮锅！',
		type: 0,
		category: 2,
		dlc: 0,
		effect: '减少5%料理时间，增加3%续单概率。',
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [2000],
				},
			},
		],
	},
	{
		id: 11,
		name: '超烧烤架',
		description: '升级后的烧烤架！',
		type: 1,
		category: 2,
		dlc: 0,
		effect: '减少5%料理时间，增加3%续单概率。',
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [2000],
				},
			},
		],
	},
	{
		id: 12,
		name: '超油锅',
		description: '升级后的油锅！',
		type: 2,
		category: 2,
		dlc: 0,
		effect: '减少5%料理时间，增加3%续单概率。',
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [2000],
				},
			},
		],
	},
	{
		id: 13,
		name: '超蒸锅',
		description: '升级后的蒸锅！',
		type: 3,
		category: 2,
		dlc: 0,
		effect: '减少5%料理时间，增加3%续单概率。',
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [2000],
				},
			},
		],
	},
	{
		id: 14,
		name: '超料理台',
		description: '升级后的料理台！',
		type: 4,
		category: 2,
		dlc: 0,
		effect: '减少5%料理时间，增加3%续单概率。',
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [2000],
				},
			},
		],
	},
	{
		id: 15,
		name: '极煮锅',
		description: '已臻化境的煮锅！',
		type: 0,
		category: 3,
		dlc: 0,
		effect: '减少10%料理时间，增加8%续单概率。',
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 4,
							amount: 7,
						},
						5000,
					],
				},
			},
		],
	},
	{
		id: 16,
		name: '极烧烤架',
		description: '已臻化境的烧烤架！',
		type: 1,
		category: 3,
		dlc: 0,
		effect: '减少10%料理时间，增加8%续单概率。',
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 4,
							amount: 7,
						},
						5000,
					],
				},
			},
		],
	},
	{
		id: 17,
		name: '极油锅',
		description: '已臻化境的油锅！',
		type: 2,
		category: 3,
		dlc: 0,
		effect: '减少10%料理时间，增加8%续单概率。',
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 4,
							amount: 7,
						},
						5000,
					],
				},
			},
		],
	},
	{
		id: 18,
		name: '极蒸锅',
		description: '已臻化境的蒸锅！',
		type: 3,
		category: 3,
		dlc: 0,
		effect: '减少10%料理时间，增加8%续单概率。',
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 4,
							amount: 7,
						},
						5000,
					],
				},
			},
		],
	},
	{
		id: 19,
		name: '极料理台',
		description: '已臻化境的料理台！',
		type: 4,
		category: 3,
		dlc: 0,
		effect: '减少10%料理时间，增加8%续单概率。',
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 4,
							amount: 7,
						},
						5000,
					],
				},
			},
		],
	},
	{
		id: 20,
		name: '核能煮锅',
		description: '最新的“危险”技术，做菜像光一样快！…但，代价是什么呢？',
		type: 0,
		category: 4,
		dlc: 0,
		effect: [`减少50%料理时间。有40%的概率制作出“${DARK_MATTER_NAME}”，但如果完美歌唱会使此概率降低至5%。`, true],
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 5,
							amount: 7,
						},
					],
				},
			},
		],
	},
	{
		id: 21,
		name: '核能烧烤架',
		description: '最新的“危险”技术，做菜像光一样快！…但，代价是什么呢？',
		type: 1,
		category: 4,
		dlc: 0,
		effect: [`减少50%料理时间。有40%的概率制作出“${DARK_MATTER_NAME}”，但如果完美歌唱会使此概率降低至5%。`, true],
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 5,
							amount: 7,
						},
					],
				},
			},
		],
	},
	{
		id: 22,
		name: '核能油锅',
		description: '最新的“危险”技术，做菜像光一样快！…但，代价是什么呢？',
		type: 2,
		category: 4,
		dlc: 0,
		effect: [`减少50%料理时间。有40%的概率制作出“${DARK_MATTER_NAME}”，但如果完美歌唱会使此概率降低至5%。`, true],
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 5,
							amount: 7,
						},
					],
				},
			},
		],
	},
	{
		id: 23,
		name: '核能蒸锅',
		description: '最新的“危险”技术，做菜像光一样快！…但，代价是什么呢？',
		type: 3,
		category: 4,
		dlc: 0,
		effect: [`减少50%料理时间。有40%的概率制作出“${DARK_MATTER_NAME}”，但如果完美歌唱会使此概率降低至5%。`, true],
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 5,
							amount: 7,
						},
					],
				},
			},
		],
	},
	{
		id: 24,
		name: '核能料理台',
		description: '最新的“危险”技术，做菜像光一样快！…但，代价是什么呢？',
		type: 4,
		category: 4,
		dlc: 0,
		effect: [`减少50%料理时间。有40%的概率制作出“${DARK_MATTER_NAME}”，但如果完美歌唱会使此概率降低至5%。`, true],
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 5,
							amount: 7,
						},
					],
				},
			},
		],
	},
	{
		id: 25,
		name: '可疑煮锅',
		description: '加入了“可疑的”技术，让吃了料理的客人非常开心！虽然不明白，但生意太火爆了！',
		type: 0,
		category: 5,
		dlc: 0,
		effect: ['额外消耗10%料理时间，增加30%续单概率。', true],
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 6,
							amount: 7,
						},
					],
				},
			},
		],
	},
	{
		id: 26,
		name: '可疑烧烤架',
		description: '加入了“可疑的”技术，让吃了料理的客人非常开心！虽然不明白，但生意太火爆了！',
		type: 1,
		category: 5,
		dlc: 0,
		effect: ['额外消耗10%料理时间，增加30%续单概率。', true],
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 6,
							amount: 7,
						},
					],
				},
			},
		],
	},
	{
		id: 27,
		name: '可疑油锅',
		description: '加入了“可疑的”技术，让吃了料理的客人非常开心！虽然不明白，但生意太火爆了！',
		type: 2,
		category: 5,
		dlc: 0,
		effect: ['额外消耗10%料理时间，增加30%续单概率。', true],
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 6,
							amount: 7,
						},
					],
				},
			},
		],
	},
	{
		id: 28,
		name: '可疑蒸锅',
		description: '加入了“可疑的”技术，让吃了料理的客人非常开心！虽然不明白，但生意太火爆了！',
		type: 3,
		category: 5,
		dlc: 0,
		effect: ['额外消耗10%料理时间，增加30%续单概率。', true],
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 6,
							amount: 7,
						},
					],
				},
			},
		],
	},
	{
		id: 29,
		name: '可疑料理台',
		description: '加入了“可疑的”技术，让吃了料理的客人非常开心！虽然不明白，但生意太火爆了！',
		type: 4,
		category: 5,
		dlc: 0,
		effect: ['额外消耗10%料理时间，增加30%续单概率。', true],
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 6,
							amount: 7,
						},
					],
				},
			},
		],
	},
	{
		id: 30,
		name: '月见煮锅',
		description: '和因幡用来吸引游客的纪念品一样徒有其表。但谁能拒绝小兔子呢？！',
		type: 0,
		category: 6,
		dlc: 0,
		effect: ['每次烹饪有40%的概率生成一只小兔子，每只小兔子额外提升5%的可叠加小费倍率，持续20秒。', true],
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 7,
							amount: 7,
						},
					],
				},
			},
		],
	},
	{
		id: 31,
		name: '月见烧烤架',
		description: '和因幡用来吸引游客的纪念品一样徒有其表。但谁能拒绝小兔子呢？！',
		type: 1,
		category: 6,
		dlc: 0,
		effect: ['每次烹饪有40%的概率生成一只小兔子，每只小兔子额外提升5%的可叠加小费倍率，持续20秒。', true],
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 7,
							amount: 7,
						},
					],
				},
			},
		],
	},
	{
		id: 32,
		name: '月见油锅',
		description: '和因幡用来吸引游客的纪念品一样徒有其表。但谁能拒绝小兔子呢？！',
		type: 2,
		category: 6,
		dlc: 0,
		effect: ['每次烹饪有40%的概率生成一只小兔子，每只小兔子额外提升5%的可叠加小费倍率，持续20秒。', true],
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 7,
							amount: 7,
						},
					],
				},
			},
		],
	},
	{
		id: 33,
		name: '月见蒸锅',
		description: '和因幡用来吸引游客的纪念品一样徒有其表。但谁能拒绝小兔子呢？！',
		type: 3,
		category: 6,
		dlc: 0,
		effect: ['每次烹饪有40%的概率生成一只小兔子，每只小兔子额外提升5%的可叠加小费倍率，持续20秒。', true],
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 7,
							amount: 7,
						},
					],
				},
			},
		],
	},
	{
		id: 34,
		name: '月见料理台',
		description: '和因幡用来吸引游客的纪念品一样徒有其表。但谁能拒绝小兔子呢？！',
		type: 4,
		category: 6,
		dlc: 0,
		effect: ['每次烹饪有40%的概率生成一只小兔子，每只小兔子额外提升5%的可叠加小费倍率，持续20秒。', true],
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: [
						{
							currency: 7,
							amount: 7,
						},
					],
				},
			},
		],
	},
	{
		id: 1000,
		name: '星尘鼎沸',
		description: '所罗门啊，我回来了！',
		type: 0,
		category: -1,
		dlc: 1,
		effect: [
			'额外消耗40%料理时间。米斯蒂娅使用此厨具累计60秒后，改为减少80%料理时间，同时料理后可以生成一个以下食材：最贵的、最便宜的、最多的、最少的、蘑菇或松露。',
			true,
		],
		from: ['【DLC1】支线任务'],
	},
	{
		id: 2000,
		name: '纯粹炼狱',
		description: '纯粹的料理地狱。',
		type: 2,
		category: -1,
		dlc: 2,
		effect: [
			'减少20%料理时间。烹饪结束后，此厨具会自动开始制作上一次制作的料理（包含额外添加的食材），自动制作不消耗食材且可以随时打断。',
			true,
		],
		from: ['完成“怪诞料理大赛”后自动获得'],
	},
	{
		id: 3000,
		name: '紫薇天火',
		description: '集天枢和七星之力做一份烧烤，必然是无上极品啦。',
		type: 1,
		category: -1,
		dlc: 3,
		effect: ['减少15%料理时间，瞬间完成带有“肉”标签的料理，有30%的概率返还料理食材。', true],
		from: [
			{
				bond: 3003,
			},
		],
	},
	{
		id: 4000,
		name: '冯风渡御',
		description: '料理和新闻一样，有时候是需要“添油加醋”的。',
		type: 3,
		category: -1,
		dlc: 4,
		effect: [
			`减少20%料理时间；如果没有添加任何额外食材，则减少70%料理时间，否则增加30%续单率。如果料理带有“${TAG_POPULAR_POSITIVE}”标签则二者同时触发。`,
			true,
		],
		from: [
			{
				bond: 4000,
			},
		],
	},
	{
		id: 5000,
		name: '魔人经板',
		description: '魔典的展现是无所谓形式的！',
		type: 4,
		category: -1,
		dlc: 5,
		effect: [
			'如果制作的料理不带有“肉”标签，则减少50%料理时间，否则增加30%料理时间。此厨具制作出的料理被顾客食用并给出评价后，接下来给任何顾客由此厨具制作的相同料理必然会得到相同评价。',
			true,
		],
		from: [
			{
				buy: {
					name: '【魔界】蓬松松爱莲♡魔法店',
					price: [
						{
							currency: 5011,
							amount: 160,
						},
						40000,
					],
				},
			},
		],
	},
	{
		id: 5001,
		name: '三位一体',
		description: '上面写着“Welcome Hell”的字样，看起来像是什么流行品牌。',
		type: [0, 2, 3],
		category: -1,
		dlc: 5,
		effect: '减少33%料理时间。可以同时作为煮锅、油锅和蒸锅使用。',
		from: [
			{
				buy: {
					name: '【魔界】蓬松松爱莲♡魔法店',
					price: [
						{
							currency: 5011,
							amount: 33,
						},
						33333,
					],
				},
			},
		],
	},
] as const satisfies ICooker[];
