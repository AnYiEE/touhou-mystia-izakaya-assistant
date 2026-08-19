/* eslint-disable sort-keys */
import { DARK_MATTER_META_MAP } from '@/domain/data/tags/tagFacts';

import type { IFoodSchema } from './schema';

export const FOOD_LIST = [
	{
		id: 0,
		name: '海鲜味噌汤',
		description:
			'居酒屋常见的快手汤羹。来历不明却随处可见的海带在幻想乡出现之初，有人好奇水煮了一下，结果意外地发现有种异样的鲜味，从此便在幻想乡流行开了。',
		recipes: [{ id: 0, ingredients: [10], cookerType: 1, baseCookTime: 6 }],
		positiveTags: [2, 3, 32],
		negativeTags: [6],
		dlc: 0,
		level: 1,
		price: 8,
		from: { self: true },
	},
	{
		id: 1,
		name: '豆腐味噌',
		description:
			'居酒屋常见的快手汤羹。使用了豆腐来提鲜，最简单又最原始的美味。',
		recipes: [{ id: 1, ingredients: [5], cookerType: 1, baseCookTime: 7 }],
		positiveTags: [2, 3, 7, 12, 32],
		negativeTags: [6],
		dlc: 0,
		level: 2,
		price: 21,
		from: { bond: { level: 2, specialGuest: 3 } },
	},
	{
		id: 2,
		name: '力量汤',
		description:
			'荤素搭配的美味汤羹。使用了野猪肉和海带煲煮而成，能最快捷地补充身体所需能量。',
		recipes: [
			{ id: 2, ingredients: [10, 4], cookerType: 1, baseCookTime: 12 },
		],
		positiveTags: [0, 10, 22, 23, 32],
		negativeTags: [21, 28],
		dlc: 0,
		level: 3,
		price: 34,
		from: { bond: { level: 4, specialGuest: 2 } },
	},
	{
		id: 3,
		name: '猪肉鳟鱼熏',
		description:
			'把猪肉鳟鱼放在一起熏制而成，是简单好吃的肉食料理，也比较能保存。',
		recipes: [
			{ id: 3, ingredients: [11, 1], cookerType: 2, baseCookTime: 7 },
		],
		positiveTags: [0, 1, 3, 33],
		negativeTags: [],
		dlc: 0,
		level: 2,
		price: 26,
		from: { bond: { level: 3, specialGuest: 2 } },
	},
	{
		id: 4,
		name: '烤八目鳗',
		description:
			'本店招牌。为了打破红灯笼店就是烤鸟肉店的成见，特意选择了对夜盲症有奇效的八目鳗，据说在过去还被视作珍宝。',
		recipes: [{ id: 4, ingredients: [12], cookerType: 2, baseCookTime: 7 }],
		positiveTags: [1, 19, 33],
		negativeTags: [0, 2],
		dlc: 0,
		level: 2,
		price: 22,
		from: { self: true },
	},
	{
		id: 5,
		name: '能量串',
		description:
			'牛肉搭配洋葱、南瓜烤成的串串。巧妙地利用了洋葱的刺激与南瓜的甜味去除肉质的油腻，食之更加清爽。',
		recipes: [
			{ id: 5, ingredients: [2, 7, 8], cookerType: 2, baseCookTime: 12 },
		],
		positiveTags: [0, 9, 33],
		negativeTags: [],
		dlc: 0,
		level: 3,
		price: 50,
		from: { bond: { level: 3, specialGuest: 8 } },
	},
	{
		id: 6,
		name: '二天一流',
		description:
			'传说中与鬼立下赌约并获胜的人类剑士所创下的烤串流派，特别使用了野性十足的肉类烧制而成，食之有种冲天的气魄，让人惊叹不已。',
		recipes: [
			{ id: 6, ingredients: [15, 4], cookerType: 2, baseCookTime: 18 },
		],
		positiveTags: [0, 4, 10, 25, 33, 35],
		negativeTags: [3],
		dlc: 0,
		level: 4,
		price: 90,
		from: { bond: { level: 4, specialGuest: 8 } },
	},
	{
		id: 7,
		name: '饭团',
		description: '最普通的饭团，加点海带随便捏捏就可以了，超便捷的经典。',
		recipes: [
			{ id: 35, ingredients: [10], cookerType: 5, baseCookTime: 5 },
		],
		positiveTags: [2, 3, 9, 12],
		negativeTags: [],
		dlc: 0,
		level: 1,
		price: 6,
		from: { levelup: { level: 2, map: null } },
	},
	{
		id: 8,
		name: '炙猪肉饭团',
		description:
			'常见的平价饭团。在饭团中放入烤制后的猪肉，为其增加了一份香浓的嚼劲。',
		recipes: [{ id: 7, ingredients: [1], cookerType: 5, baseCookTime: 6 }],
		positiveTags: [0, 3, 9, 12],
		negativeTags: [],
		dlc: 0,
		level: 2,
		price: 14,
		from: { areaTask: { map: 'HumanVillage', task: '支线任务' } },
	},
	{
		id: 9,
		name: '温暖饭团',
		description:
			'常见的平价饭团。内馅儿加入了鳟鱼和洋葱，融合了海鲜的细腻口感与洋葱的炽热，无论是营养还是口感都属上佳。',
		recipes: [
			{ id: 8, ingredients: [7, 11], cookerType: 5, baseCookTime: 8 },
		],
		positiveTags: [1, 2, 3, 9, 12, 22],
		negativeTags: [],
		dlc: 0,
		level: 3,
		price: 30,
		from: { bond: { level: 2, specialGuest: 7 } },
	},
	{
		id: 10,
		name: '樱落雪',
		description:
			'高级寿司的一种。粉红色的高级生鱼片盖在白米饭上，就如樱花飘落在白雪上，有着不可思议的美感。',
		recipes: [
			{ id: 9, ingredients: [19], cookerType: 5, baseCookTime: 12 },
		],
		positiveTags: [1, 4, 11, 12, 18, 20, 28],
		negativeTags: [6],
		dlc: 0,
		level: 4,
		price: 50,
		from: { bond: { level: 4, specialGuest: 3 } },
	},
	{
		id: 11,
		name: '炒肉丝',
		description: '以猪肉作为主要食材制作而成的家常菜，口味偏重。',
		recipes: [{ id: 10, ingredients: [1], cookerType: 3, baseCookTime: 8 }],
		positiveTags: [0, 3, 6, 8, 14],
		negativeTags: [],
		dlc: 0,
		level: 1,
		price: 15,
		from: { areaTask: { map: 'HakureiShrine', task: '支线任务' } },
	},
	{
		id: 12,
		name: '冷豆腐',
		description: '夏天的消暑下酒菜，简单爽口。',
		recipes: [
			{ id: 11, ingredients: [9, 5], cookerType: 5, baseCookTime: 5 },
		],
		positiveTags: [2, 3, 7, 8, 28],
		negativeTags: [],
		dlc: 0,
		level: 2,
		price: 21,
		from: { self: true },
	},
	{
		id: 13,
		name: '红烧鳗鱼',
		description:
			'本店招牌。将鳗鱼用特殊酱料进行烧制后肉汁四溢，光闻着香味便让人垂涎不已。',
		recipes: [
			{ id: 12, ingredients: [7, 12], cookerType: 3, baseCookTime: 8 },
		],
		positiveTags: [1, 2, 6, 16, 19],
		negativeTags: [],
		dlc: 0,
		level: 3,
		price: 42,
		from: { bond: { level: 2, specialGuest: 15 } },
	},
	{
		id: 14,
		name: '土豆可乐饼',
		description:
			'主要由土豆制成，外表酥脆，内在绵软可口，在油炸类食品中有着较高的人气。',
		recipes: [{ id: 13, ingredients: [6], cookerType: 3, baseCookTime: 6 }],
		positiveTags: [2, 3, 6],
		negativeTags: [21],
		dlc: 0,
		level: 1,
		price: 22,
		from: { levelup: { level: 11, map: null } },
	},
	{
		id: 15,
		name: '野味加农',
		description:
			'用农家蔬菜佐以优质黑毛猪肉炖煮的烩锅。口感饱满，香浓却不油腻，是农家人最高级的大菜。',
		recipes: [
			{ id: 14, ingredients: [6, 8, 15], cookerType: 1, baseCookTime: 8 },
		],
		positiveTags: [0, 6, 9, 10, 22],
		negativeTags: [],
		dlc: 0,
		level: 4,
		price: 66,
		from: { bond: { level: 4, specialGuest: 5 } },
	},
	{
		id: 16,
		name: '猪肉盖浇饭',
		description:
			'常见的家常菜。看上去颗颗饭粒饱满，淋上的香酱与猪肉的口感融为一体，令人胃口倍增。',
		recipes: [{ id: 15, ingredients: [1], cookerType: 1, baseCookTime: 7 }],
		positiveTags: [0, 3, 9],
		negativeTags: [],
		dlc: 0,
		level: 2,
		price: 20,
		from: { levelup: { level: 8, map: null } },
	},
	{
		id: 17,
		name: '牛肉盖浇饭',
		description:
			'常见的家常菜。看上去颗颗饭粒饱满，淋上的香酱与牛肉的口感融为一体，令人胃口倍增。',
		recipes: [{ id: 16, ingredients: [2], cookerType: 1, baseCookTime: 7 }],
		positiveTags: [0, 3, 9],
		negativeTags: [],
		dlc: 0,
		level: 2,
		price: 20,
		from: { bond: { level: 3, specialGuest: 5 } },
	},
	{
		id: 18,
		name: '炸八目鳗',
		description:
			'本店招牌。长相怪异的八目鳗在喜欢尝鲜的幻想乡曾一度成为话题，油炸后爽滑酥嫩，深受大众喜爱。',
		recipes: [
			{ id: 17, ingredients: [12], cookerType: 3, baseCookTime: 7 },
		],
		positiveTags: [1, 6, 19],
		negativeTags: [21],
		dlc: 0,
		level: 2,
		price: 27,
		from: { bond: { level: 3, specialGuest: 1 } },
	},
	{
		id: 19,
		name: '蔬菜专辑',
		description:
			'用新鲜的蔬菜生拌而成的沙拉。口感清新，可以去除嘴里的油腻，不知为何被年轻的姑娘们奉为减肥圣餐。',
		recipes: [
			{ id: 18, ingredients: [6, 7, 8], cookerType: 5, baseCookTime: 5 },
		],
		positiveTags: [2, 7, 18, 21],
		negativeTags: [0, 1, 22],
		dlc: 0,
		level: 3,
		price: 56,
		from: { bond: { level: 3, specialGuest: 3 } },
	},
	{
		id: 20,
		name: '白雪',
		description:
			'使用鲜美的八目鳗与河豚，再佐以海带炖煮而成的高级烩锅。由于煮的过程中会飘出纯白的泡沫而得名，是非常高级的家庭料理。',
		recipes: [
			{
				id: 19,
				ingredients: [20, 12, 10],
				cookerType: 1,
				baseCookTime: 12,
			},
		],
		positiveTags: [0, 1, 4, 12, 25],
		negativeTags: [],
		dlc: 0,
		level: 4,
		price: 98,
		from: { bond: { level: 4, specialGuest: 4 } },
	},
	{
		id: 21,
		name: '豆腐锅',
		description:
			'由豆腐炖煮而成的烩锅。滑嫩的口感再加上其本身具有的较高营养价值，使这道平价料理成为居酒屋最常见的烩锅。',
		recipes: [{ id: 20, ingredients: [5], cookerType: 1, baseCookTime: 5 }],
		positiveTags: [2, 7, 12, 22],
		negativeTags: [],
		dlc: 0,
		level: 1,
		price: 19,
		from: { bond: { level: 2, specialGuest: 5 } },
	},
	{
		id: 22,
		name: '杂炊',
		description:
			'使用一些边角料食材杂烩而成的烩锅。享受美味的同时还能避免浪费，可谓一举两得。',
		recipes: [
			{
				id: 21,
				ingredients: [10, 5, 11],
				cookerType: 1,
				baseCookTime: 5,
			},
		],
		positiveTags: [0, 3, 16, 22],
		negativeTags: [],
		dlc: 0,
		level: 2,
		price: 40,
		from: { bond: { level: 3, specialGuest: 7 } },
	},
	{
		id: 23,
		name: '刺身拼盘',
		description:
			'作为和风料理的代表，将刺身级的三文鱼和金枪鱼鱼生配上芥末和酱油，引出鲜味的绝妙料理。',
		recipes: [
			{ id: 22, ingredients: [13, 14], cookerType: 5, baseCookTime: 5 },
		],
		positiveTags: [1, 4, 12, 18, 20],
		negativeTags: [22],
		dlc: 0,
		level: 3,
		price: 88,
		from: { bond: { level: 3, specialGuest: 28 } },
	},
	{
		id: 24,
		name: '大奢宴',
		description:
			'奢侈地选用了一系列高级食材炖煮成烩锅。通过火候的精妙控制，将食材之间的特点全部提炼了出来，肉质鲜嫩多汁、香滑入味，令人其味无穷。',
		recipes: [
			{
				id: 36,
				ingredients: [15, 16, 20],
				cookerType: 1,
				baseCookTime: 10,
			},
		],
		positiveTags: [0, 1, 4, 9, 10],
		negativeTags: [3],
		dlc: 0,
		level: 3,
		price: 105,
		from: { bond: { level: 4, specialGuest: 7 } },
	},
	{
		id: 25,
		name: '豚骨拉面',
		description:
			'用猪肉和蔬菜经过长时间熬制出来的高汤，堪称整碗拉面的精髓和灵魂所在。香浓醇厚的豚骨汤底配上香弹可口的拉面，饱腹之余也让舌尖得到最大的满足。',
		recipes: [
			{ id: 23, ingredients: [1, 0, 10], cookerType: 1, baseCookTime: 8 },
		],
		positiveTags: [0, 3, 9, 15],
		negativeTags: [],
		dlc: 0,
		level: 3,
		price: 60,
		from: { levelup: { level: 14, map: null } },
	},
	{
		id: 26,
		name: '岩浆',
		description:
			'用高级牛肉和松露炖煮而成的烩锅，最初以麻辣为特色，因炖煮中冒出的气泡如岩浆而得名，款款而起的香味更是让人食指大动。改良后也增加了不辣的版本。',
		recipes: [
			{
				id: 37,
				ingredients: [2, 16, 20, 18],
				cookerType: 1,
				baseCookTime: 8,
			},
		],
		positiveTags: [0, 1, 4, 9, 22, 23, 26],
		negativeTags: [21],
		dlc: 0,
		level: 3,
		price: 125,
		from: { bond: { level: 4, specialGuest: 24 } },
	},
	{
		id: 27,
		name: '香炸蝉蜕',
		description:
			'蝉科昆虫黑蚱羽化后的蜕壳，可以入药，有利咽开音、明目退翳之效，香炸后口感酥脆，颇受欢迎。',
		recipes: [
			{ id: 24, ingredients: [25], cookerType: 3, baseCookTime: 8 },
		],
		positiveTags: [6, 24],
		negativeTags: [],
		dlc: 0,
		level: 1,
		price: 19,
		from: { bond: { level: 3, specialGuest: 0 } },
	},
	{
		id: 28,
		name: '露水煮蛋',
		description:
			'采集了清晨的露珠煮成的蛋，比一般的水煮蛋多出一种甘甜的味道，为了保持鲜嫩只煮到半熟，蛋黄水嫩得似乎稍加晃动就会流出来。',
		recipes: [
			{ id: 25, ingredients: [27, 0], cookerType: 4, baseCookTime: 3 },
		],
		positiveTags: [7, 18],
		negativeTags: [0, 1, 6],
		dlc: 0,
		level: 2,
		price: 18,
		from: { bond: { level: 2, specialGuest: 0 } },
	},
	{
		id: 29,
		name: '幻昙花糕',
		description:
			'用上古时期便存在的奇迹之花制作的糕点，不仅甜而不腻，食后更是齿颊留香，据说能勾起人心中最想怀念的回忆。',
		recipes: [
			{ id: 38, ingredients: [26, 27], cookerType: 4, baseCookTime: 7 },
		],
		positiveTags: [4, 5, 17, 20, 27, 29],
		negativeTags: [0, 1],
		dlc: 0,
		level: 3,
		price: 78,
		from: { bond: { level: 4, specialGuest: 0 } },
	},
	{
		id: 30,
		name: '赛熊掌',
		description:
			'黑不溜秋的怪异美食之首！香飘万里，让人回味无穷。因为打不过熊，没法直接用熊掌做，但是比真正的熊掌还要鲜美百倍。',
		recipes: [
			{
				id: 26,
				ingredients: [15, 28, 20],
				cookerType: 4,
				baseCookTime: 12,
			},
		],
		positiveTags: [0, 1, 4, 10, 16, 23, 27],
		negativeTags: [],
		dlc: 0,
		level: 3,
		price: 70,
		from: { bond: { level: 4, specialGuest: 1 } },
	},
	{
		id: 31,
		name: '秘制小鱼干',
		description:
			'用秘制的香料将小鱼干腌制后晒干，酥脆香口的同时又易于保存，寻常人家都喜欢在家中保存一份。',
		recipes: [
			{ id: 27, ingredients: [11], cookerType: 5, baseCookTime: 8 },
		],
		positiveTags: [1, 15, 16, 28],
		negativeTags: [],
		dlc: 0,
		level: 2,
		price: 30,
		from: { bond: { level: 2, specialGuest: 2 } },
	},
	{
		id: 32,
		name: '凉菜雕花',
		description:
			'将鲜果蔬菜雕刻成鲜花的模样，虽则材料简单，但却非常考验刀工。',
		recipes: [{ id: 28, ingredients: [9], cookerType: 5, baseCookTime: 5 }],
		positiveTags: [2, 7, 20, 21],
		negativeTags: [0, 22],
		dlc: 0,
		level: 1,
		price: 20,
		from: { bond: { level: 2, specialGuest: 9 } },
	},
	{
		id: 33,
		name: '桃花羹',
		description:
			'来自天上的配方，采摘新鲜的桃花，配以清晨的甘露水煮而成。不仅芳香清甜，而且具有祛病美容的神奇功效。',
		recipes: [
			{
				id: 39,
				ingredients: [21, 34, 27],
				cookerType: 1,
				baseCookTime: 7,
			},
		],
		positiveTags: [2, 17, 20, 21, 31, 32],
		negativeTags: [],
		dlc: 0,
		level: 2,
		price: 55,
		from: { bond: { level: 3, specialGuest: 9 } },
	},
	{
		id: 34,
		name: '北极甜虾蜜桃色拉',
		description:
			'选用品质最好、肉质最鲜的虾和桃子加工而成的高级料理，据说在外界只有在宴席上才有机会一见。',
		recipes: [
			{
				id: 40,
				ingredients: [21, 34, 23],
				cookerType: 5,
				baseCookTime: 10,
			},
		],
		positiveTags: [1, 2, 7, 17, 20, 27, 31],
		negativeTags: [0, 15],
		dlc: 0,
		level: 2,
		price: 25,
		from: { bond: { level: 4, specialGuest: 9 } },
	},
	{
		id: 35,
		name: '油豆腐',
		description: '常见的家常菜。传说中是稻荷神的狐狸使者最喜欢的食物。',
		recipes: [{ id: 29, ingredients: [5], cookerType: 3, baseCookTime: 7 }],
		positiveTags: [2, 3, 6, 12],
		negativeTags: [],
		dlc: 0,
		level: 1,
		price: 16,
		from: { bond: { level: 2, specialGuest: 4 } },
	},
	{
		id: 36,
		name: '诗礼银杏',
		description:
			'以选用孔庙“诗礼堂”前银杏树所结果实烹制而得名，清香甜美，柔韧筋道，可解酒止咳。',
		recipes: [
			{ id: 30, ingredients: [22, 24], cookerType: 4, baseCookTime: 8 },
		],
		positiveTags: [2, 14, 17, 25],
		negativeTags: [15],
		dlc: 0,
		level: 3,
		price: 60,
		from: { bond: { level: 3, specialGuest: 4 } },
	},
	{
		id: 37,
		name: '真·海鲜味噌汤',
		description:
			'选用新鲜鳟鱼与海带煲煮而成的味噌汤。浓浓的鲜味四处漂荡，鲜而不腥。',
		recipes: [
			{ id: 31, ingredients: [13, 11], cookerType: 1, baseCookTime: 8 },
		],
		positiveTags: [1, 3, 7, 32],
		negativeTags: [],
		dlc: 0,
		level: 2,
		price: 55,
		from: { bond: { level: 2, specialGuest: 28 } },
	},
	{
		id: 38,
		name: '烤蘑菇',
		description:
			'采用蘑菇为原料，将蘑菇用竹签串起来后，刷少量油进行烧烤，撒上粗盐，味道简直不输给直接吃肉！',
		recipes: [
			{ id: 32, ingredients: [17], cookerType: 2, baseCookTime: 6 },
		],
		positiveTags: [2, 15, 22, 26, 33],
		negativeTags: [],
		dlc: 0,
		level: 1,
		price: 18,
		from: { areaTask: { map: 'BeastForest', task: '支线任务' } },
	},
	{
		id: 39,
		name: '煮豆腐',
		description:
			'常见的家常菜，但也讲究烧制的火候，才能将豆腐的鲜嫩口感得到最大展现。',
		recipes: [{ id: 33, ingredients: [5], cookerType: 1, baseCookTime: 7 }],
		positiveTags: [2, 3, 7],
		negativeTags: [],
		dlc: 0,
		level: 1,
		price: 22,
		from: { levelup: { level: 4, map: null } },
	},
	{
		id: 40,
		name: '炸猪肉排',
		description:
			'常见的家常菜。以猪肉为主要材料，裹以面粉一炸，邻居家的孩子都馋哭了。',
		recipes: [{ id: 34, ingredients: [1], cookerType: 3, baseCookTime: 7 }],
		positiveTags: [0, 3, 6, 9],
		negativeTags: [],
		dlc: 0,
		level: 2,
		price: 25,
		from: { bond: { level: 2, specialGuest: 8 } },
	},
	{
		id: 41,
		name: '黄油牛排',
		description:
			'简单而复杂，根据火候和食材的选择，呈现出不同感觉的基础西餐。顺带一提红魔馆的那位喜欢的是三分熟。',
		recipes: [
			{ id: 60, ingredients: [16, 29], cookerType: 3, baseCookTime: 7 },
		],
		positiveTags: [0, 6, 9, 13],
		negativeTags: [17, 21],
		dlc: 0,
		level: 2,
		price: 60,
		from: { areaTask: { map: 'ScarletMansion', task: '主线任务' } },
	},
	{
		id: 42,
		name: '意式烩饭',
		description:
			'将食材炒熟之后倒入生米，充分混合米粒和食材香味的外界某个半岛的做法。',
		recipes: [
			{
				id: 57,
				ingredients: [7, 17, 28, 29],
				cookerType: 4,
				baseCookTime: 6,
			},
		],
		positiveTags: [9, 13, 16, 26],
		negativeTags: [17],
		dlc: 0,
		level: 2,
		price: 70,
		from: { bond: { level: 3, specialGuest: 27 } },
	},
	{
		id: 43,
		name: '惠灵顿牛排',
		description:
			'将牛排和松露这两种鲜美的食材调味后包裹在酥皮中进行烘焙，让黄油酥皮的香味和牛排蘑菇的鲜美充分融合的极致菜肴。工序繁复，在外界是出了名的难做。',
		recipes: [
			{
				id: 58,
				ingredients: [16, 30, 0, 29, 18],
				cookerType: 3,
				baseCookTime: 14,
			},
		],
		positiveTags: [0, 4, 5, 10, 13],
		negativeTags: [17, 21],
		dlc: 0,
		level: 4,
		price: 150,
		from: { bond: { level: 4, specialGuest: 27 } },
	},
	{
		id: 44,
		name: '班尼迪克蛋',
		description: '流黄的水波蛋和大口的碳水，是早午餐的常见选择。',
		recipes: [
			{
				id: 56,
				ingredients: [0, 28, 29, 30],
				cookerType: 3,
				baseCookTime: 7,
			},
		],
		positiveTags: [9, 13, 18, 28],
		negativeTags: [17, 31],
		dlc: 0,
		level: 2,
		price: 35,
		from: { bond: { level: 2, specialGuest: 27 } },
	},
	{
		id: 45,
		name: '热松饼',
		description: '早餐的简单选择，将准备好的面糊煎熟，浇上蜂蜜就可以吃了。',
		recipes: [
			{
				id: 65,
				ingredients: [24, 30, 0],
				cookerType: 3,
				baseCookTime: 9,
			},
		],
		positiveTags: [9, 13, 17],
		negativeTags: [],
		dlc: 0,
		level: 2,
		price: 22,
		from: { levelup: { level: 27, map: 'ScarletMansion' } },
	},
	{
		id: 46,
		name: '司康饼',
		description: '英式下午茶的常客，外酥内软。一般蘸着果酱或者奶油一起吃。',
		recipes: [
			{ id: 62, ingredients: [29, 30], cookerType: 4, baseCookTime: 7 },
		],
		positiveTags: [9, 13],
		negativeTags: [],
		dlc: 0,
		level: 1,
		price: 8,
		from: { levelup: { level: 18, map: 'ScarletMansion' } },
	},
	{
		id: 47,
		name: '香煎三文鱼',
		description:
			'将整块带皮的三文鱼煎至外焦里嫩，配上鲜嫩的竹笋——不过外界这个菜谱一般是芦笋，这也算是幻想乡式的融合菜吧。',
		recipes: [
			{ id: 63, ingredients: [13, 28], cookerType: 3, baseCookTime: 10 },
		],
		positiveTags: [0, 13, 16],
		negativeTags: [],
		dlc: 0,
		level: 3,
		price: 58,
		from: { levelup: { level: 21, map: 'ScarletMansion' } },
	},
	{
		id: 48,
		name: '奶油炖菜',
		description:
			'家常奶油浓汤。制作方法简单，无论是蘸面包还是当作炖菜来吃都是非常不错的料理。',
		recipes: [
			{
				id: 64,
				ingredients: [17, 7, 29],
				cookerType: 4,
				baseCookTime: 9,
			},
		],
		positiveTags: [2, 13, 26, 32],
		negativeTags: [],
		dlc: 0,
		level: 2,
		price: 20,
		from: { levelup: { level: 24, map: 'BambooForest' } },
	},
	{
		id: 49,
		name: '蜜汁叉烧',
		description:
			'来自红美铃老家的特殊做法，制作工序有点繁复，但是口感独一无二，令人难忘。',
		recipes: [
			{ id: 61, ingredients: [1, 24], cookerType: 2, baseCookTime: 7 },
		],
		positiveTags: [0, 6, 14, 17, 27],
		negativeTags: [],
		dlc: 0,
		level: 3,
		price: 70,
		from: { areaTask: { map: 'ScarletMansion', task: '支线任务' } },
	},
	{
		id: 50,
		name: '白果萝卜排骨汤',
		description: '来自红美铃老家的煲汤技巧，色香味俱全，益气补血。',
		recipes: [
			{ id: 54, ingredients: [22, 9, 1], cookerType: 1, baseCookTime: 6 },
		],
		positiveTags: [0, 14, 22, 32],
		negativeTags: [],
		dlc: 0,
		level: 2,
		price: 65,
		from: { bond: { level: 3, specialGuest: 15 } },
	},
	{
		id: 51,
		name: '竹取姬',
		description:
			'“所谓的竹取姬，本质和这玩意儿也没什么两样！”——藤原妹红在永远亭就地取材，使用新鲜的食材和米饭一起塞进竹筒中蒸熟。饭被竹子的清香充分浸润后，中和了山猪肉带来的油腻。',
		recipes: [
			{
				id: 43,
				ingredients: [31, 28, 18, 22, 15],
				cookerType: 4,
				baseCookTime: 12,
			},
		],
		positiveTags: [0, 4, 5, 12, 20, 25, 30],
		negativeTags: [],
		dlc: 0,
		level: 4,
		price: 65,
		from: {
			areaTask: {
				map: 'BambooForest',
				specialGuest: 24,
				task: '主线任务',
			},
		},
	},
	{
		id: 52,
		name: '不死鸟',
		description:
			'“哈~火鸡的肚子里也就是这些东西了~”——蓬莱山辉夜使用面粉烘培出烤火鸡的形状，在表面刷上蜂蜜，肚子里塞满食材，进行充分的烘烤。出炉的假烤鸡有着香脆的外皮和多汁的内馅儿。',
		recipes: [
			{
				id: 44,
				ingredients: [30, 24, 6, 7, 9],
				cookerType: 2,
				baseCookTime: 12,
			},
		],
		positiveTags: [4, 5, 13, 20, 33, 35],
		negativeTags: [],
		dlc: 0,
		level: 4,
		price: 65,
		from: {
			areaTask: {
				map: 'BambooForest',
				specialGuest: 25,
				task: '主线任务',
			},
		},
	},
	{
		id: 53,
		name: '月光团子',
		description:
			'永远亭特产改良的麻薯团子，加入了高级食材月光草，造型可爱的同时，还有“月光一样的口感”。',
		recipes: [
			{ id: 48, ingredients: [33, 32], cookerType: 5, baseCookTime: 8 },
		],
		positiveTags: [12, 17, 27, 30],
		negativeTags: [0, 1, 15, 16],
		dlc: 0,
		level: 3,
		price: 80,
		from: { bond: { level: 4, specialGuest: 29 } },
	},
	{
		id: 54,
		name: '麻薯',
		description: '最普通的糯米团子，大家都喜欢的和风甜食。',
		recipes: [
			{ id: 46, ingredients: [32], cookerType: 5, baseCookTime: 7 },
		],
		positiveTags: [12, 17, 28],
		negativeTags: [0, 1, 15, 16],
		dlc: 0,
		level: 2,
		price: 30,
		from: { bond: { level: 2, specialGuest: 29 } },
	},
	{
		id: 55,
		name: '白桃生八桥',
		description:
			'状似外界古筝的经典和果子，加入白桃内馅儿之后呈现淡粉色，非常诱人。',
		recipes: [
			{ id: 47, ingredients: [32, 21], cookerType: 5, baseCookTime: 5 },
		],
		positiveTags: [12, 17, 31],
		negativeTags: [0, 1, 15, 16],
		dlc: 0,
		level: 2,
		price: 55,
		from: { bond: { level: 3, specialGuest: 29 } },
	},
	{
		id: 56,
		name: '月之恋人',
		description:
			'外界似乎很流行使用〇〇恋人作为地区伴手礼，永远亭也不甘落后潮流，推出了自己的版本！',
		recipes: [
			{
				id: 52,
				ingredients: [29, 30, 0, 33],
				cookerType: 5,
				baseCookTime: 10,
			},
		],
		positiveTags: [17, 20, 28, 30],
		negativeTags: [0, 1, 2],
		dlc: 0,
		level: 3,
		price: 66,
		from: { bond: { level: 3, specialGuest: 25 } },
	},
	{
		id: 57,
		name: '猪鹿蝶',
		description:
			'脱胎于花札的猪鹿蝶牌型，将猪肉和鹿肉清炖，佐以花朵引出食材本身鲜味的精致料理。',
		recipes: [
			{ id: 59, ingredients: [4, 3, 33], cookerType: 4, baseCookTime: 8 },
		],
		positiveTags: [0, 4, 20, 25],
		negativeTags: [],
		dlc: 0,
		level: 3,
		price: 78,
		from: { bond: { level: 4, specialGuest: 28 } },
	},
	{
		id: 58,
		name: '流水素面',
		description: '比起好吃，流水素面更多的是好玩。',
		recipes: [
			{ id: 45, ingredients: [30, 31], cookerType: 5, baseCookTime: 7 },
		],
		positiveTags: [2, 7, 21, 27],
		negativeTags: [6],
		dlc: 0,
		level: 3,
		price: 40,
		from: { areaTask: { map: 'BambooForest', task: '支线任务' } },
	},
	{
		id: 59,
		name: '竹笋炒肉',
		description: '最朴素的的竹笋吃法，由猪肉的油光引出竹笋的鲜美。',
		recipes: [
			{ id: 66, ingredients: [28, 1], cookerType: 3, baseCookTime: 10 },
		],
		positiveTags: [0, 3, 8],
		negativeTags: [],
		dlc: 0,
		level: 2,
		price: 25,
		from: { levelup: { level: 33, map: 'BambooForest' } },
	},
	{
		id: 60,
		name: '竹筒蒸蛋',
		description: '竹子作为容器蒸出来的茶碗蒸，别有一番风味。',
		recipes: [
			{
				id: 51,
				ingredients: [31, 0, 10, 17],
				cookerType: 4,
				baseCookTime: 6,
			},
		],
		positiveTags: [3, 7, 26],
		negativeTags: [],
		dlc: 0,
		level: 2,
		price: 40,
		from: { bond: { level: 2, specialGuest: 25 } },
	},
	{
		id: 61,
		name: '蓬莱玉枝',
		description:
			'简单地说就是使用竹签串起各种高级肉类，一口吃个饱的料理。但是在辉夜小姐的胁迫下，成为了高级的冠名料理。',
		recipes: [
			{
				id: 53,
				ingredients: [31, 1, 13, 16, 3],
				cookerType: 2,
				baseCookTime: 13,
			},
		],
		positiveTags: [0, 4, 5, 25, 33],
		negativeTags: [],
		dlc: 0,
		level: 5,
		price: 125,
		from: { bond: { level: 4, specialGuest: 25 } },
	},
	{
		id: 62,
		name: '臭豆腐',
		description:
			'少见的黑色豆腐，散发着令人难以接近的味道…让人不禁怀疑这真的可以吃吗？但是实际吃过的人表示根本停不下来。',
		recipes: [
			{ id: 41, ingredients: [5, 35], cookerType: 3, baseCookTime: 5 },
		],
		positiveTags: [2, 14, 24, 34],
		negativeTags: [17, 31],
		dlc: 0,
		level: 1,
		price: 24,
		from: { bond: { level: 2, specialGuest: 1 } },
	},
	{
		id: 63,
		name: '华光玉煎包',
		description:
			'散发着七彩的气场的高级生煎包。据说有些生煎原教旨主义者尖锐地反对加入猪肉以外食材的做法。',
		recipes: [
			{ id: 55, ingredients: [17, 15], cookerType: 3, baseCookTime: 8 },
		],
		positiveTags: [0, 4, 5, 14, 26, 29],
		negativeTags: [],
		dlc: 0,
		level: 4,
		price: 128,
		from: { bond: { level: 4, specialGuest: 15 } },
	},
	{
		id: 64,
		name: '麻婆豆腐',
		description:
			'在日本很有名的中华料理。使用独特的豆腐烹饪技巧烹制而成的辛辣料理，用它来拌饭吃可是会上瘾的哦~',
		recipes: [
			{ id: 49, ingredients: [5, 1, 35], cookerType: 3, baseCookTime: 6 },
		],
		positiveTags: [2, 14, 22, 34],
		negativeTags: [17, 21, 31],
		dlc: 0,
		level: 2,
		price: 32,
		from: { bond: { level: 2, specialGuest: 24 } },
	},
	{
		id: 65,
		name: '水煮鱼',
		description:
			'正宗的四川中华料理。鲜嫩肥美的鱼肉与犹如半天朱霞的辣椒一起翻滚，煮成了一道鱼香四溢、椒味袭人的绝味。',
		recipes: [
			{ id: 50, ingredients: [11, 35], cookerType: 1, baseCookTime: 8 },
		],
		positiveTags: [1, 14, 22, 34, 35],
		negativeTags: [0, 17, 21, 31],
		dlc: 0,
		level: 3,
		price: 68,
		from: { bond: { level: 3, specialGuest: 24 } },
	},
	{
		id: 66,
		name: '月饼',
		description:
			'原本是内测人员的特殊食谱，三年来一直令全收集强迫症玩家坐卧不宁，这次彻底开放了…',
		recipes: [
			{ id: 42, ingredients: [33, 30], cookerType: 4, baseCookTime: 10 },
		],
		positiveTags: [9, 14, 17, 25, 27, 28],
		negativeTags: [],
		dlc: 0,
		level: 5,
		price: 35,
		from: {
			buy: {
				merchant: { label: '香霖堂', map: 'HumanVillage' },
				price: { amount: 5, currencyItem: 29 },
			},
		},
	},
	{
		id: 67,
		name: '毛玉三色冰激凌',
		description:
			'方形的三色毛玉冰激凌，从颜色到口味上都非常惹人喜爱。几乎是人手一份的招牌甜品。',
		recipes: [
			{
				id: 67,
				ingredients: [27, 5, 24, 0],
				cookerType: 5,
				baseCookTime: 8,
			},
		],
		positiveTags: [13, 17, 20, 21, 29],
		negativeTags: [],
		dlc: 0,
		level: 3,
		price: 75,
		from: {
			collaboration: {
				collaborationLabel: 'MC幻想乡',
				merchants: [
					{
						merchant: { label: '萌澄果', map: 'BeastForest' },
						platformLabel: 'PC',
					},
					{
						merchant: { label: '杂货商人', map: 'BeastForest' },
						platformLabel: 'Switch',
					},
				],
			},
		},
	},
	{
		id: 68,
		name: '毛玉熔岩豆腐',
		description:
			'方形的火山毛玉造型，仿佛着了火的熔岩豆腐。受到喜欢舌苔刺激的人的追捧。',
		recipes: [
			{
				id: 68,
				ingredients: [5, 35, 2, 7],
				cookerType: 5,
				baseCookTime: 8,
			},
		],
		positiveTags: [2, 14, 16, 20, 27],
		negativeTags: [],
		dlc: 0,
		level: 3,
		price: 85,
		from: {
			collaboration: {
				collaborationLabel: 'MC幻想乡',
				merchants: [
					{
						merchant: { label: '萌澄果', map: 'BeastForest' },
						platformLabel: 'PC',
					},
					{
						merchant: { label: '杂货商人', map: 'BeastForest' },
						platformLabel: 'Switch',
					},
				],
			},
		},
	},
	{
		id: 69,
		name: '猩红恶魔蛋糕',
		description:
			'以猩红恶魔头上的帽子为原型制作的梦幻甜食，切开会有仿佛血液一般的甜美酱料流出。',
		recipes: [
			{
				id: 69,
				ingredients: [27, 8, 6, 24],
				cookerType: 5,
				baseCookTime: 8,
			},
		],
		positiveTags: [13, 17, 20, 24, 29],
		negativeTags: [],
		dlc: 0,
		level: 3,
		price: 60,
		from: {
			collaboration: {
				collaborationLabel: '三妖精的蹦蹦跳跳讨伐大作战',
				merchants: [
					{
						merchant: {
							label: '蹦蹦跳跳的三妖精',
							map: 'BeastForest',
						},
						platformLabel: 'PC',
					},
					{
						merchant: { label: '香霖堂', map: 'HumanVillage' },
						platformLabel: 'Switch',
					},
				],
			},
		},
	},
	{
		id: 70,
		name: '无意识妖怪慕斯',
		description:
			'以无意识妖怪的帽子为原型制作的深沉甜食，即使切开感受到的也是无尽的黑暗，但香醇的程度令人流连忘返。',
		recipes: [
			{
				id: 70,
				ingredients: [5, 29, 24, 7],
				cookerType: 5,
				baseCookTime: 8,
			},
		],
		positiveTags: [4, 13, 17, 20, 29],
		negativeTags: [],
		dlc: 0,
		level: 3,
		price: 60,
		from: {
			collaboration: {
				collaborationLabel: '三妖精的蹦蹦跳跳讨伐大作战',
				merchants: [
					{
						merchant: {
							label: '蹦蹦跳跳的三妖精',
							map: 'BeastForest',
						},
						platformLabel: 'PC',
					},
					{
						merchant: { label: '香霖堂', map: 'HumanVillage' },
						platformLabel: 'Switch',
					},
				],
			},
		},
	},
	{
		id: 71,
		name: '水饺',
		description:
			'海的另一边，红美铃小姐家乡的著名食谱。用面粉制作成的筋道面皮，在其中包入任意喜欢的食材，放入沸腾的热水中煮熟，就会成为超级美味的食物。外表看起来朴素无华，内在却包着世间的宝藏。',
		recipes: [
			{ id: 71, ingredients: [30], cookerType: 1, baseCookTime: 5 },
		],
		positiveTags: [2, 3, 14, 25],
		negativeTags: [],
		dlc: 0,
		level: 2,
		price: 35,
		from: {
			buy: {
				merchant: { label: '香霖堂', map: 'HumanVillage' },
				price: { amount: 5, currencyItem: 29 },
			},
		},
	},
	{
		id: 72,
		name: '汤圆',
		description:
			'海的另一边，红美铃小姐家乡的著名食谱。用弹牙的糯米揉成小团，在其中包入甜品食材，放入沸腾的热水中煮熟，就会成为超级可口的甜品。外表看起来朴素无华，内在却包着世间的甜蜜。',
		recipes: [
			{ id: 72, ingredients: [32], cookerType: 1, baseCookTime: 5 },
		],
		positiveTags: [2, 3, 14, 25],
		negativeTags: [],
		dlc: 0,
		level: 2,
		price: 35,
		from: {
			buy: {
				merchant: { label: '香霖堂', map: 'HumanVillage' },
				price: { amount: 5, currencyItem: 29 },
			},
		},
	},
	{
		id: 1000,
		name: '炸虾天妇罗',
		description:
			'“天妇罗”又名“天麸罗”。将新鲜大虾裹上面粉做的罗衣，放入油锅炸至金黄酥脆，再控油捞出，隔壁家的童子都馋哭了。',
		recipes: [
			{ id: 1000, ingredients: [23, 30], cookerType: 3, baseCookTime: 6 },
		],
		positiveTags: [6, 8],
		negativeTags: [7],
		dlc: 1,
		level: 1,
		price: 22,
		from: { bond: { level: 2, specialGuest: 1001 } },
	},
	{
		id: 1001,
		name: '黄金酥鱼饼',
		description:
			'在鱼馅儿内加入适量蜂蜜搅拌后，碾压成鱼饼，投入油锅炸至金黄色，随炸随食。',
		recipes: [
			{
				id: 1001,
				ingredients: [11, 30, 24],
				cookerType: 3,
				baseCookTime: 9,
			},
		],
		positiveTags: [1, 6, 8, 23],
		negativeTags: [],
		dlc: 1,
		level: 2,
		price: 40,
		from: { bond: { level: 3, specialGuest: 1001 } },
	},
	{
		id: 1002,
		name: '全肉盛宴',
		description:
			'将各种高级烤肉堆成小山的料理。无论视觉还是分量上都简单暴力，对于嗅觉灵敏的食客是秒杀级的食谱。',
		recipes: [
			{
				id: 1002,
				ingredients: [4, 3, 15, 16],
				cookerType: 2,
				baseCookTime: 14,
			},
		],
		positiveTags: [-1, 0, 4, 8, 10, 15, 20, 22],
		negativeTags: [],
		dlc: 1,
		level: 4,
		price: 115,
		from: { bond: { level: 4, specialGuest: 1001 } },
	},
	{
		id: 1003,
		name: '腌黄瓜',
		description: '将黄瓜切段后用盐等调味腌制，出现了神奇而难以抗拒的风味。',
		recipes: [
			{
				id: 1003,
				ingredients: [1000, 1003],
				cookerType: 5,
				baseCookTime: 6,
			},
		],
		positiveTags: [2, 8, 15, 28],
		negativeTags: [],
		dlc: 1,
		level: 1,
		price: 16,
		from: { bond: { level: 2, specialGuest: 1000 } },
	},
	{
		id: 1004,
		name: '奶油焗蟹',
		description:
			'奶油焗的螃蟹在没开盖之前就已经香气四溢，然而这香气只是前戏。撕开蟹钳，弹出白嫩饱满的肉质，此时再细细地吸入汤汁，螃蟹固有的鲜味才彻底地融合与释放。',
		recipes: [
			{
				id: 1004,
				ingredients: [1004, 1005],
				cookerType: 3,
				baseCookTime: 12,
			},
		],
		positiveTags: [4, 8, 11, 16, 19, 20],
		negativeTags: [],
		dlc: 1,
		level: 3,
		price: 88,
		from: { bond: { level: 3, specialGuest: 1000 } },
	},
	{
		id: 1005,
		name: '拟尻子玉',
		description:
			'据说尻子玉是人类进化后残存的尾骨，是河童一族最喜欢的食物。从前用血腥的方式从人类那里夺取，但是随着时代的进步，已经有了料理的方式来替代，只是成本昂贵。',
		recipes: [
			{
				id: 1005,
				ingredients: [3, 18, 25],
				cookerType: 1,
				baseCookTime: 12,
			},
		],
		positiveTags: [5, 8, 22, 24, 28, 29],
		negativeTags: [],
		dlc: 1,
		level: 4,
		price: 120,
		from: { bond: { level: 4, specialGuest: 1000 } },
	},
	{
		id: 1006,
		name: '大阪烧',
		description:
			'听说是外界流行的街边小吃，使用面糊和各种食材混合后在铁板上烧制而成，脆香而丰富，因其百变和平价的特性被所有人喜爱。',
		recipes: [
			{
				id: 1006,
				ingredients: [30, 0, 9],
				cookerType: 3,
				baseCookTime: 6,
			},
		],
		positiveTags: [12, 19, 20, 28],
		negativeTags: [],
		dlc: 1,
		level: 2,
		price: 24,
		from: { bond: { level: 2, specialGuest: 1005 } },
	},
	{
		id: 1007,
		name: '章鱼烧',
		description:
			'听说也是外界流行的街边小吃，在特制的面糊中裹上引发奇迹的章鱼脚，糯脆的外衣之下Q弹的章鱼脚产生让人幸福的感觉。',
		recipes: [
			{
				id: 1007,
				ingredients: [30, 10, 1001],
				cookerType: 3,
				baseCookTime: 8,
			},
		],
		positiveTags: [1, 9, 19, 20, 28],
		negativeTags: [],
		dlc: 1,
		level: 2,
		price: 36,
		from: { bond: { level: 3, specialGuest: 1005 } },
	},
	{
		id: 1008,
		name: '海胆刺身',
		description:
			'制作意外的简单，但获取食材却非常困难。据说是现世流行的超高级料理，是每个人的梦想。',
		recipes: [
			{
				id: 1008,
				ingredients: [1002, 27],
				cookerType: 5,
				baseCookTime: 8,
			},
		],
		positiveTags: [4, 11, 17, 20, 27, 28, 30],
		negativeTags: [],
		dlc: 1,
		level: 4,
		price: 108,
		from: { bond: { level: 4, specialGuest: 1005 } },
	},
	{
		id: 1009,
		name: '蘑菇肉片',
		description: '将蘑菇和肉切片后，混入锅里一起炒，是非常基本的家常料理。',
		recipes: [
			{ id: 1009, ingredients: [17, 1], cookerType: 3, baseCookTime: 6 },
		],
		positiveTags: [0, 3, 6, 26],
		negativeTags: [],
		dlc: 1,
		level: 1,
		price: 20,
		from: { bond: { level: 2, specialGuest: 10 } },
	},
	{
		id: 1010,
		name: '秘制鲜菌煲',
		description:
			'长期专研于蘑菇学的人类魔法使所创的秘制菜谱。食材均选自魔法森林所产的新鲜菌类，据说较其他地方产出的菌类有更高营养价值。',
		recipes: [
			{
				id: 1010,
				ingredients: [18, 17, 27],
				cookerType: 1,
				baseCookTime: 9,
			},
		],
		positiveTags: [12, 16, 26, 30],
		negativeTags: [],
		dlc: 1,
		level: 3,
		price: 62,
		from: { bond: { level: 3, specialGuest: 10 } },
	},
	{
		id: 1011,
		name: '蘑女的舞踏烩',
		description:
			'蘑菇为主角，佐以各种鲜嫩食材的强力料理。金灿灿的光芒散发着强烈的存在感，香浓的口感可以瞬间蒸发人的灵魂，一发沉沦。',
		recipes: [
			{
				id: 1011,
				ingredients: [17, 23, 1001, 35],
				cookerType: 1,
				baseCookTime: 14,
			},
		],
		positiveTags: [1, 6, 15, 16, 20, 22, 26, 34],
		negativeTags: [],
		dlc: 1,
		level: 4,
		price: 112,
		from: { bond: { level: 4, specialGuest: 10 } },
	},
	{
		id: 1012,
		name: '奶香蘑菇汤',
		description:
			'浓郁的奶香汤底煮出来的魔性之汤，尝下第一口就无法停下来。制作简单，材料随处可见，还拥有极高的营养价值。',
		recipes: [
			{
				id: 1012,
				ingredients: [17, 6, 1004],
				cookerType: 1,
				baseCookTime: 8,
			},
		],
		positiveTags: [3, 20, 26],
		negativeTags: [],
		dlc: 1,
		level: 1,
		price: 28,
		from: { bond: { level: 2, specialGuest: 1002 } },
	},
	{
		id: 1013,
		name: '普通小蛋糕',
		description:
			'有着惊人热量的小点心，据说能迅速强健体魄。上面写着“吃掉我”，非常诱人。吃多了估计会长胖吧…',
		recipes: [
			{
				id: 1013,
				ingredients: [0, 36, 1004],
				cookerType: 4,
				baseCookTime: 8,
			},
		],
		positiveTags: [4, 17, 20, 25, 31],
		negativeTags: [],
		dlc: 1,
		level: 2,
		price: 56,
		from: { bond: { level: 3, specialGuest: 1002 } },
	},
	{
		id: 1014,
		name: '七色羊羹',
		description:
			'经典甜食辅以特殊的处理，呈现梦幻的色彩，让人敬畏，只敢远观不敢亵玩。能吃上一次，终生难忘。',
		recipes: [
			{
				id: 1014,
				ingredients: [10, 36, 27, 26],
				cookerType: 4,
				baseCookTime: 8,
			},
		],
		positiveTags: [4, 17, 20, 25, 27, 29, 31],
		negativeTags: [],
		dlc: 1,
		level: 4,
		price: 92,
		from: { bond: { level: 4, specialGuest: 1002 } },
	},
	{
		id: 1015,
		name: '手握寿司',
		description:
			'日本最传统的料理之一。将鱼切片后盖在手握的饭团上，解饿又鲜美，拥有很长的历史。',
		recipes: [
			{ id: 1015, ingredients: [13, 14], cookerType: 5, baseCookTime: 6 },
		],
		positiveTags: [1, 7, 12, 16, 18, 25],
		negativeTags: [],
		dlc: 1,
		level: 1,
		price: 28,
		from: { bond: { level: 2, specialGuest: 1004 } },
	},
	{
		id: 1016,
		name: '南瓜虾盅',
		description:
			'掏空小南瓜，用鲜嫩的虾肉和豆腐填充，再进行蒸制，香甜可口，又非常健康。',
		recipes: [
			{
				id: 1016,
				ingredients: [8, 23, 5],
				cookerType: 4,
				baseCookTime: 9,
			},
		],
		positiveTags: [1, 7, 9, 16, 17, 20, 30],
		negativeTags: [],
		dlc: 1,
		level: 2,
		price: 55,
		from: { bond: { level: 3, specialGuest: 1004 } },
	},
	{
		id: 1017,
		name: '幻想佛跳墙',
		description:
			'由东方文明古国最强料理改造而来，据说得道的真佛也会因为它的气味夺墙而走，摒弃斋戒，真的很神奇！',
		recipes: [
			{
				id: 1017,
				ingredients: [16, 19, 15, 20, 18],
				cookerType: 1,
				baseCookTime: 18,
			},
		],
		positiveTags: [0, 1, 4, 5, 10, 14, 20, 23, 25, 26, 30],
		negativeTags: [],
		dlc: 1,
		level: 4,
		price: 160,
		from: { bond: { level: 4, specialGuest: 1004 } },
	},
	{
		id: 2000,
		name: '丧气芝士条',
		description:
			'在一些阴郁的妖怪中流行的零食，在浓郁的芝士中混有白果独有的苦味，能让味觉产生强烈的回甘后味，但我完全无法理解。',
		recipes: [
			{
				id: 2000,
				ingredients: [2002, 22, 22],
				cookerType: 4,
				baseCookTime: 6,
			},
		],
		positiveTags: [8, 15, 16, 30],
		negativeTags: [],
		dlc: 2,
		level: 1,
		price: 25,
		from: { bond: { level: 2, specialGuest: 2001 } },
	},
	{
		id: 2001,
		name: '阴郁水果派',
		description:
			'对喜欢酸味的人来说是味蕾的盛宴，但不喜欢酸味的人就是牙齿和舌头的炸弹！只在一些小众的妖怪中流行的奇怪做法。',
		recipes: [
			{
				id: 2001,
				ingredients: [2001, 36, 2002],
				cookerType: 5,
				baseCookTime: 8,
			},
		],
		positiveTags: [15, 16, 30, 31, 2000],
		negativeTags: [],
		dlc: 2,
		level: 2,
		price: 36,
		from: { bond: { level: 3, specialGuest: 2001 } },
	},
	{
		id: 2002,
		name: '绝叫关东煮',
		description:
			'旧地狱中最流行的聚会小吃。将各种食材置入后，加上辣椒刺激，让人汗流满面的同时却无法停下，是魔力十足的料理。',
		recipes: [
			{
				id: 2002,
				ingredients: [35, 35, 2, 9, 5],
				cookerType: 1,
				baseCookTime: 12,
			},
		],
		positiveTags: [-1, 0, 4, 9, 16, 22, 23, 30, 34],
		negativeTags: [],
		dlc: 2,
		level: 4,
		price: 92,
		from: { bond: { level: 4, specialGuest: 2001 } },
	},
	{
		id: 2003,
		name: '脆旋风',
		description:
			'将虫类的甲壳磨成大碎块，拌入面中，吃起来香脆又下火，有一种别样的异世界猎奇感的奇怪料理。',
		recipes: [
			{
				id: 2003,
				ingredients: [30, 24, 25],
				cookerType: 5,
				baseCookTime: 5,
			},
		],
		positiveTags: [9, 18, 24, 30],
		negativeTags: [6],
		dlc: 2,
		level: 1,
		price: 42,
		from: { bond: { level: 2, specialGuest: 2000 } },
	},
	{
		id: 2004,
		name: '仰望天花板派',
		description:
			'在水果派里探出一个鱼头，仿佛看着地底的天花板，充满了与地狱相衬的绝望气息。',
		recipes: [
			{
				id: 2004,
				ingredients: [11, 30, 21],
				cookerType: 4,
				baseCookTime: 9,
			},
		],
		positiveTags: [8, 11, 19, 20, 24, 30],
		negativeTags: [0],
		dlc: 2,
		level: 2,
		price: 66,
		from: { bond: { level: 3, specialGuest: 2000 } },
	},
	{
		id: 2005,
		name: '兜甲蒸糕',
		description:
			'无论是地上还是地下，兜角甲虫都是力量和无敌的象征！这是憧憬它的力量而诞生的盔甲料理！',
		recipes: [
			{
				id: 2005,
				ingredients: [30, 15, 24, 25],
				cookerType: 4,
				baseCookTime: 12,
			},
		],
		positiveTags: [4, 9, 16, 18, 19, 20, 23, 24, 30],
		negativeTags: [],
		dlc: 2,
		level: 3,
		price: 105,
		from: { bond: { level: 4, specialGuest: 2000 } },
	},
	{
		id: 2006,
		name: '狮子头',
		description:
			'爱酒之人无不喜欢的基础下酒菜！气派又野性的狮子头配上烈性的酒，是鬼族起床的早餐！',
		recipes: [
			{ id: 2006, ingredients: [2], cookerType: 1, baseCookTime: 7 },
		],
		positiveTags: [0, 8, 16, 19, 30],
		negativeTags: [1, 9],
		dlc: 2,
		level: 1,
		price: 28,
		from: { bond: { level: 2, specialGuest: 2002 } },
	},
	{
		id: 2007,
		name: '巨人玉子烧',
		description:
			'将普通的玉子烧做大许多倍，就是这款在鬼族中流行的巨人玉子烧了！其澎湃的存在感让豪迈之人为其燃烧！',
		recipes: [
			{
				id: 2007,
				ingredients: [30, 30, 0, 0],
				cookerType: 3,
				baseCookTime: 12,
			},
		],
		positiveTags: [4, 9, 12, 17, 23],
		negativeTags: [8],
		dlc: 2,
		level: 2,
		price: 60,
		from: { bond: { level: 3, specialGuest: 2002 } },
	},
	{
		id: 2008,
		name: '大江户船祭',
		description:
			'用华丽的祭典船造型。摆满上好的鱼刺身，周围散发着保鲜而制作的冰雾，是真真真正的宴会的焦点！',
		recipes: [
			{
				id: 2008,
				ingredients: [13, 14, 19, 11, 34],
				cookerType: 5,
				baseCookTime: 24,
			},
		],
		positiveTags: [1, 4, 5, 8, 11, 12, 16, 18, 19, 20, 25],
		negativeTags: [],
		dlc: 2,
		level: 4,
		price: 206,
		from: { bond: { level: 4, specialGuest: 2002 } },
	},
	{
		id: 2009,
		name: '樱花布丁',
		description:
			'粉色的可爱甜品，Q软又富有弹性，香蜜的甜美气息使它成为世界上所有的女孩子都无法拒绝的无敌甜品。',
		recipes: [
			{ id: 2009, ingredients: [24, 21], cookerType: 4, baseCookTime: 6 },
		],
		positiveTags: [17, 20, 21, 28, 30, 31],
		negativeTags: [6, 15],
		dlc: 2,
		level: 2,
		price: 32,
		from: { bond: { level: 2, specialGuest: 2003 } },
	},
	{
		id: 2010,
		name: '提神布丁',
		description:
			'大大提升了酸度的可怕布丁，改良了提神的效果，只要吃一口，就能让困倦的身体打起精神。但因为其用料过于凶猛，很不利于口腔健康…',
		recipes: [
			{
				id: 2010,
				ingredients: [36, 36, 2001],
				cookerType: 4,
				baseCookTime: 8,
			},
		],
		positiveTags: [17, 21, 23, 28, 31, 2000],
		negativeTags: [6, 15],
		dlc: 2,
		level: 2,
		price: 42,
		from: { bond: { level: 3, specialGuest: 2003 } },
	},
	{
		id: 2011,
		name: '燃尽布丁',
		description:
			'究极加料、一颗就调动起身上包括多巴胺和肾上腺激素等多种兴奋元素疯狂舞动的禁忌甜食。妖怪食用后可以疯狂舞蹈一整夜，但是兴奋过后会不由地感到“我燃尽了”。',
		recipes: [
			{
				id: 2011,
				ingredients: [36, 24, 2001, 2001],
				cookerType: 4,
				baseCookTime: 8,
			},
		],
		positiveTags: [17, 19, 21, 23, 28, 29, 31, 2000],
		negativeTags: [6, 15],
		dlc: 2,
		level: 4,
		price: 73,
		from: { bond: { level: 4, specialGuest: 2003 } },
	},
	{
		id: 2012,
		name: '猫饭',
		description:
			'据说是阿燐刚刚被觉收养时，觉常做给她的简易盖浇饭。面粉勾芡后淋在鱼肉上，那种温柔的味道一直留在燐的记忆里。',
		recipes: [
			{
				id: 2012,
				ingredients: [11, 27, 30],
				cookerType: 5,
				baseCookTime: 5,
			},
		],
		positiveTags: [1, 16, 28],
		negativeTags: [6],
		dlc: 2,
		level: 1,
		price: 26,
		from: { bond: { level: 2, specialGuest: 2004 } },
	},
	{
		id: 2013,
		name: '三文鱼天妇罗',
		description:
			'将三文鱼裹上蛋液和面粉，炸至通体金黄，咬一口汁水四溢，隔壁的猫猫都馋哭啦！',
		recipes: [
			{
				id: 2013,
				ingredients: [13, 29, 0, 30],
				cookerType: 3,
				baseCookTime: 8,
			},
		],
		positiveTags: [1, 4, 6, 16, 28],
		negativeTags: [],
		dlc: 2,
		level: 2,
		price: 44,
		from: { bond: { level: 3, specialGuest: 2004 } },
	},
	{
		id: 2014,
		name: '鱼跃龙门',
		description:
			'外表是鲤鱼起跳的造型，剖开后尽是梦幻的宝藏，是猫科动物无法抵抗的究极美食。',
		recipes: [
			{
				id: 2014,
				ingredients: [19, 3, 24, 33, 18],
				cookerType: 4,
				baseCookTime: 12,
			},
		],
		positiveTags: [-1, 0, 1, 4, 11, 14, 16, 17, 25, 26, 29],
		negativeTags: [],
		dlc: 2,
		level: 4,
		price: 142,
		from: { bond: { level: 4, specialGuest: 2004 } },
	},
	{
		id: 2015,
		name: '芝士蛋',
		description:
			'据说是阿空刚刚被觉收养时，觉常做给她的料理。在蛋饼里混入浓香的芝士，让人无法拒绝的小吃。',
		recipes: [
			{
				id: 2015,
				ingredients: [0, 2002],
				cookerType: 3,
				baseCookTime: 6,
			},
		],
		positiveTags: [6, 15, 16, 18],
		negativeTags: [0],
		dlc: 2,
		level: 1,
		price: 26,
		from: { bond: { level: 2, specialGuest: 2005 } },
	},
	{
		id: 2016,
		name: '一击☆必杀',
		description:
			'加入了极为刺激的食材和辅料，对味觉的刺激满点的超级烤串，阿空亲自为它起了一个中二度满满的名字，结果在保持野性的妖怪中莫名的有人气。',
		recipes: [
			{
				id: 2016,
				ingredients: [4, 3, 7],
				cookerType: 2,
				baseCookTime: 9,
			},
		],
		positiveTags: [0, 6, 9, 10, 23, 33],
		negativeTags: [],
		dlc: 2,
		level: 3,
		price: 62,
		from: { bond: { level: 3, specialGuest: 2005 } },
	},
	{
		id: 2017,
		name: '地狱激辛警告！',
		description:
			'超超超级辣加倍的牛肉咖喱饭！据说只有拥有极限忍耐力的人和傻瓜才会尝试这道料理！',
		recipes: [
			{
				id: 2017,
				ingredients: [35, 35, 35, 2002, 2],
				cookerType: 3,
				baseCookTime: 12,
			},
		],
		positiveTags: [0, 6, 15, 20, 22, 23, 24, 34],
		negativeTags: [2, 7],
		dlc: 2,
		level: 4,
		price: 108,
		from: { bond: { level: 4, specialGuest: 2005 } },
	},
	{
		id: 3000,
		name: '烤地瓜',
		description:
			'无论什么时候都大受欢迎的民间小吃。尤其在寒冷的冬天，看到热气腾腾的烤炉，想到那红皮黄瓤的颜色，热乎甜软的口感，谁能忍得住呢？但不能贪嘴，吃太多容易导致胃腹不适。',
		recipes: [
			{ id: 3000, ingredients: [3001], cookerType: 2, baseCookTime: 6 },
		],
		positiveTags: [-2, 3, 9, 17],
		negativeTags: [8],
		dlc: 3,
		level: 1,
		price: 25,
		from: { bond: { level: 2, specialGuest: 3000 } },
	},
	{
		id: 3001,
		name: '瘦马团子',
		description:
			'外表看起来像是拉长了的团子，切开后中间裹着各式各样的图案，大大增加了团子的新鲜感。据说瘦马团子象征佛舍利，那不就是佛祖的骨灰吗？',
		recipes: [
			{ id: 3001, ingredients: [32, 32], cookerType: 5, baseCookTime: 9 },
		],
		positiveTags: [9, 20, 24, 25],
		negativeTags: [0],
		dlc: 3,
		level: 2,
		price: 45,
		from: { bond: { level: 3, specialGuest: 3000 } },
	},
	{
		id: 3002,
		name: '惊吓！大冒险',
		description:
			'从幻昙华中提取色素，给一个个蘑菇伞染上颜色，将之铺在宝箱周围就像被锦花簇拥着。宝箱里究竟藏有什么惊喜呢？怀着这样的想法打开，跳出来的却是伸着大舌头的滑稽的伞！吓一跳了吧——？',
		recipes: [
			{
				id: 3002,
				ingredients: [17, 26, 24, 1004],
				cookerType: 4,
				baseCookTime: 12,
			},
		],
		positiveTags: [20, 23, 24, 27, 29, 30],
		negativeTags: [3],
		dlc: 3,
		level: 4,
		price: 90,
		from: { bond: { level: 4, specialGuest: 3000 } },
	},
	{
		id: 3003,
		name: '比斯开湾饼干',
		description:
			'从海难中逃到荒岛的幸存者，万般无奈地将已被海水浸湿的面粉和芝士混合成的“面糊”放在阳光下烤，没想到味道变得十分香脆可口。于是这个做法流传了下来。',
		recipes: [
			{
				id: 3003,
				ingredients: [30, 2002],
				cookerType: 2,
				baseCookTime: 5,
			},
		],
		positiveTags: [9, 15, 22],
		negativeTags: [2000],
		dlc: 3,
		level: 1,
		price: 26,
		from: { bond: { level: 2, specialGuest: 3001 } },
	},
	{
		id: 3004,
		name: '海盗熏肉',
		description:
			'据说“海盗”这个词的来源是在明火上烹制的熏肉。加勒比本地人就是用这种做法来处理肉类，然后卖给海盗。听起来就和米饭盖浇米饭一样奇怪。',
		recipes: [
			{
				id: 3004,
				ingredients: [2, 1003, 35, 24],
				cookerType: 2,
				baseCookTime: 9,
			},
		],
		positiveTags: [-1, 0, 5, 23, 30],
		negativeTags: [2000],
		dlc: 3,
		level: 2,
		price: 58,
		from: { bond: { level: 3, specialGuest: 3001 } },
	},
	{
		id: 3005,
		name: '罗汉上素',
		description:
			'源自佛门的斋菜。传闻正宗的罗汉斋用十八种原料制成，工序复杂考究，成菜色泽缤纷雅致，味道清淡香郁。堪称佛门最奢华的一道素菜。',
		recipes: [
			{
				id: 3005,
				ingredients: [26, 28, 18, 3002, 3000],
				cookerType: 1,
				baseCookTime: 12,
			},
		],
		positiveTags: [2, 4, 7, 16, 21, 25, 29, 30],
		negativeTags: [0, 34],
		dlc: 3,
		level: 4,
		price: 97,
		from: { bond: { level: 4, specialGuest: 3001 } },
	},
	{
		id: 3006,
		name: '云山棉花糖',
		description:
			'命莲寺的弟子中有个能够变幻形态的入道，只要见过他的样子，就很容易联想到棉花糖。加入桃汁制作的棉花糖甜而不腻，造型生动有趣，深受小孩子的喜爱。',
		recipes: [
			{ id: 3006, ingredients: [24, 21], cookerType: 3, baseCookTime: 8 },
		],
		positiveTags: [17, 27, 30, 31],
		negativeTags: [0, 15],
		dlc: 3,
		level: 1,
		price: 20,
		from: { bond: { level: 2, specialGuest: 3002 } },
	},
	{
		id: 3007,
		name: '圣白莲子糕',
		description:
			'将新鲜莲子剥壳去芯，煮至软烂，再将黄油与面粉搅拌均匀，最后混合翻炒，用模具压出美丽的莲花图案，看起来神圣洁白。',
		recipes: [
			{
				id: 3007,
				ingredients: [22, 3000, 30, 29],
				cookerType: 4,
				baseCookTime: 10,
			},
		],
		positiveTags: [2, 7, 20, 28, 30],
		negativeTags: [34],
		dlc: 3,
		level: 2,
		price: 56,
		from: { bond: { level: 3, specialGuest: 3002 } },
	},
	{
		id: 3008,
		name: '幻想星莲船',
		description:
			'以南瓜做的船，承载着如梦似幻的食材，在莲子铺成的河上驶入幻想。据说每每享用完这道料理，都会有如梦方醒的感觉。至于究竟是何种梦境，便是因人而异了。',
		recipes: [
			{
				id: 3008,
				ingredients: [8, 3000, 14, 2000, 33],
				cookerType: 5,
				baseCookTime: 13,
			},
		],
		positiveTags: [4, 16, 18, 19, 20, 21, 27, 29, 30],
		negativeTags: [24],
		dlc: 3,
		level: 4,
		price: 132,
		from: { bond: { level: 4, specialGuest: 3002 } },
	},
	{
		id: 3009,
		name: '松子糕',
		description:
			'以糯米为主料、辅以松子制作的药膳。松子糕的粉质细腻，柔软可口，并有清香的松子味，深受道士们喜爱。',
		recipes: [
			{
				id: 3009,
				ingredients: [32, 3002],
				cookerType: 4,
				baseCookTime: 8,
			},
		],
		positiveTags: [7, 30],
		negativeTags: [],
		dlc: 3,
		level: 2,
		price: 46,
		from: { bond: { level: 2, specialGuest: 3003 } },
	},
	{
		id: 3010,
		name: '白鹿贞松',
		description:
			'白鹿和松树都有长寿的寓意，深受追求长生的道教人士的推崇，于是有“鹿寿松贞”之画，即一只白鹿立于松树之下。这道菜就是以这幅画为印象创作出来的~',
		recipes: [
			{
				id: 3010,
				ingredients: [3, 22, 3002],
				cookerType: 4,
				baseCookTime: 12,
			},
		],
		positiveTags: [0, 4, 10, 25, 30],
		negativeTags: [2000],
		dlc: 3,
		level: 3,
		price: 72,
		from: { bond: { level: 3, specialGuest: 3003 } },
	},
	{
		id: 3011,
		name: '太极八卦鱼肚',
		description:
			'做法极其讲究的道教经典名菜。鱼肚片片，要愈薄愈好；太极图则要注意造型圆整、八卦形等距，最后再经过细心蒸煮，才能呈现出这道形象生动、鱼肚软糯的道家名菜。',
		recipes: [
			{
				id: 3011,
				ingredients: [19, 17, 9, 0, 22],
				cookerType: 1,
				baseCookTime: 14,
			},
		],
		positiveTags: [1, 4, 7, 16, 21, 25],
		negativeTags: [],
		dlc: 3,
		level: 4,
		price: 136,
		from: { bond: { level: 4, specialGuest: 3003 } },
	},
	{
		id: 3012,
		name: '蜜饯栗子',
		description:
			'把栗子用蜂蜜熬煮之后的成品。栗子里温和而浓郁的味道，可以有效地平衡外在的甜味。',
		recipes: [
			{
				id: 3012,
				ingredients: [24, 3003],
				cookerType: 5,
				baseCookTime: 6,
			},
		],
		positiveTags: [17, 28, 30],
		negativeTags: [],
		dlc: 3,
		level: 1,
		price: 30,
		from: { bond: { level: 2, specialGuest: 3004 } },
	},
	{
		id: 3013,
		name: '天师板栗焖菇',
		description:
			'神灵庙位处仙界，所栽种的栗树据说都蕴含仙气。但我是分辨不出啦…将栗子佐以蘑菇焖煮，把看不见摸不着的仙气浓缩成一锅鲜甜味美又解馋的杂烩，岂不是更实在？',
		recipes: [
			{
				id: 3013,
				ingredients: [3003, 17, 18],
				cookerType: 1,
				baseCookTime: 8,
			},
		],
		positiveTags: [2, 3, 14, 26, 30],
		negativeTags: [],
		dlc: 3,
		level: 2,
		price: 55,
		from: { bond: { level: 3, specialGuest: 3004 } },
	},
	{
		id: 3014,
		name: '荷花鱼米盏',
		description:
			'洁白的盘中铺上碧绿的荷叶，叶上还滚动着晶莹的水珠，盘中央一朵白荷则增添了“仙气”。每一盏里都以鲜嫩的粉色荷花花瓣为底，盛着极上金枪鱼、莲子组成的“鱼米盏”，又好吃又健康。',
		recipes: [
			{
				id: 3014,
				ingredients: [19, 2000, 3000, 27],
				cookerType: 4,
				baseCookTime: 11,
			},
		],
		positiveTags: [1, 5, 7, 14, 25, 27, 29],
		negativeTags: [],
		dlc: 3,
		level: 4,
		price: 94,
		from: { bond: { level: 4, specialGuest: 3004 } },
	},
	{
		id: 3015,
		name: '拔丝地瓜',
		description:
			'将番薯下锅炸至金黄，再裹上能拉出细丝的糖衣，最后在抹过油的盘子上滚一圈，既可口又不粘牙。但不能贪嘴，吃太多容易导致胃腹不适。',
		recipes: [
			{
				id: 3015,
				ingredients: [3001, 24],
				cookerType: 3,
				baseCookTime: 6,
			},
		],
		positiveTags: [2, 3, 9, 17],
		negativeTags: [18],
		dlc: 3,
		level: 1,
		price: 30,
		from: { bond: { level: 2, specialGuest: 3005 } },
	},
	{
		id: 3016,
		name: '香煎双菇肉卷',
		description:
			'荤素搭配均匀，味道也很好的常见佳肴。用两种不同口感的菇类，包裹着精挑细选的嫩肉，给味蕾带来层次感十足的享受。',
		recipes: [
			{
				id: 3016,
				ingredients: [1, 17, 18],
				cookerType: 3,
				baseCookTime: 9,
			},
		],
		positiveTags: [0, 3, 6, 8, 19, 22, 26],
		negativeTags: [21],
		dlc: 3,
		level: 3,
		price: 63,
		from: { bond: { level: 3, specialGuest: 3005 } },
	},
	{
		id: 3017,
		name: '什锦天妇罗',
		description:
			'谁说炸物就必须得是鸟类呢？地上跑的、土里长的、水里游的都可以裹上面粉放到油锅里炸一炸，出锅皆是香味四溢、酥脆爽口。最后以梦幻的月光草为缀，巧妙地中和了炸物拼盘的油腻。',
		recipes: [
			{
				id: 3017,
				ingredients: [15, 18, 12, 33],
				cookerType: 3,
				baseCookTime: 7,
			},
		],
		positiveTags: [0, 3, 6, 8, 12, 19, 23, 26],
		negativeTags: [],
		dlc: 3,
		level: 3,
		price: 72,
		from: { bond: { level: 4, specialGuest: 3005 } },
	},
	{
		id: 4000,
		name: '炸番茄条',
		description:
			'“为什么炸土豆条和番茄酱永远是标配？我不仅偏要炸番茄条，我还要独独给它淋上土豆酱！”——鬼人正邪把西红柿裹上面粉后放到油锅炸一炸，出锅后淋上自制土豆酱，尝起来也算是别有一番趣味。',
		recipes: [
			{
				id: 4000,
				ingredients: [4004, 6],
				cookerType: 3,
				baseCookTime: 6,
			},
		],
		positiveTags: [24, 27, 28],
		negativeTags: [1],
		dlc: 4,
		level: 1,
		price: 26,
		from: { bond: { level: 2, specialGuest: 4003 } },
	},
	{
		id: 4001,
		name: '蜜桃红烧肉',
		description:
			'软糯的肉加上香甜的桃子，即使白嘴吃也不会觉得腻。淋上蜂蜜一起翻炒，更是红润添香，非常适合下酒。',
		recipes: [
			{
				id: 4001,
				ingredients: [24, 21, 1],
				cookerType: 3,
				baseCookTime: 8,
			},
		],
		positiveTags: [0, 8, 27, 31],
		negativeTags: [],
		dlc: 4,
		level: 2,
		price: 42,
		from: { bond: { level: 3, specialGuest: 4003 } },
	},
	{
		id: 4002,
		name: '逆转天地！',
		description:
			'使用革新技术制作的分子料理，据说是来自月都的食谱。在制作过程中存在许多无法理解之处，所以经过一定程度的再创作，最终成为这样一个结合了世人眼中的“雅”与“俗”之物的地上料理，也寄托着正邪想要搅混天下的意愿。',
		recipes: [
			{
				id: 4002,
				ingredients: [31, 4002, 4000, 15, 18],
				cookerType: 5,
				baseCookTime: 12,
			},
		],
		positiveTags: [10, 21, 24, 26, 27, 29, 35],
		negativeTags: [],
		dlc: 4,
		level: 4,
		price: 124,
		from: { bond: { level: 4, specialGuest: 4003 } },
	},
	{
		id: 4003,
		name: '红豆大福',
		description:
			'用糯米制成的外皮，里头包着饱满的带皮红小豆馅儿。馅料的量跟饼皮的量一样甚至更多，使得大福的外型圆浑有致。据说大福就因为这样的外型而被称为“大腹饼”，后人取其吉祥的谐音改称“大福”。',
		recipes: [
			{
				id: 4003,
				ingredients: [4001, 32],
				cookerType: 5,
				baseCookTime: 7,
			},
		],
		positiveTags: [12, 17, 28],
		negativeTags: [],
		dlc: 4,
		level: 2,
		price: 28,
		from: { bond: { level: 2, specialGuest: 4004 } },
	},
	{
		id: 4004,
		name: '铜锣烧',
		description:
			'一种烤制面皮、内置红豆沙夹心的甜点。因由两块像铜锣一样的饼合起来的，故而得名铜锣烧。',
		recipes: [
			{
				id: 4004,
				ingredients: [4001, 0, 30],
				cookerType: 3,
				baseCookTime: 6,
			},
		],
		positiveTags: [2, 12, 17, 30],
		negativeTags: [0],
		dlc: 4,
		level: 2,
		price: 40,
		from: { bond: { level: 3, specialGuest: 4004 } },
	},
	{
		id: 4005,
		name: '汉宫藏娇',
		description:
			'用豆腐的洁白来形容貂婵的纯洁，以泥鳅的钻营来影射董卓的奸滑。让人在品尝中，想到王允献貂婵，巧使美人计而除奸贼董卓的故事，自然为美食增添了文化的含量。',
		recipes: [
			{
				id: 4005,
				ingredients: [12, 5, 1005, 31, 27],
				cookerType: 1,
				baseCookTime: 12,
			},
		],
		positiveTags: [1, 4, 5, 14, 24, 25, 32],
		negativeTags: [6],
		dlc: 4,
		level: 4,
		price: 115,
		from: { bond: { level: 4, specialGuest: 4004 } },
	},
	{
		id: 4006,
		name: '石锅竹笋炖肉',
		description:
			'以牛肉、竹笋为主要食材的一道家常菜品。鲜嫩的竹笋炖肉具有开胃、促进消化的作用，再以竹子作为摆盘，可谓是色香味俱全。',
		recipes: [
			{
				id: 4006,
				ingredients: [31, 28, 2],
				cookerType: 1,
				baseCookTime: 7,
			},
		],
		positiveTags: [0, 3, 9],
		negativeTags: [],
		dlc: 4,
		level: 3,
		price: 42,
		from: { bond: { level: 2, specialGuest: 4005 } },
	},
	{
		id: 4007,
		name: '竹筒粉蒸肉',
		description:
			'选用猪身上最嫩的部位，将新鲜的竹筒锯留成节笆，通小孔，灌上菜料和香料，开大火蒸熟后飘出竹子的独特清香。有时间的条件下，在腌渍肉片的时候加点清水会更加晶莹润口。',
		recipes: [
			{
				id: 4007,
				ingredients: [31, 27, 15],
				cookerType: 4,
				baseCookTime: 9,
			},
		],
		positiveTags: [0, 3, 10],
		negativeTags: [18],
		dlc: 4,
		level: 3,
		price: 72,
		from: { bond: { level: 3, specialGuest: 4005 } },
	},
	{
		id: 4008,
		name: '翠竹迎春',
		description:
			'将各种鲜嫩的食材放入多节竹筒蒸熟，寓意节节高升。而春竹翠绿娇艳的样子，既给客人带来视觉味觉上的新意，还蕴含着迎春的美好寓意。',
		recipes: [
			{
				id: 4008,
				ingredients: [1000, 0, 9, 3, 33],
				cookerType: 4,
				baseCookTime: 14,
			},
		],
		positiveTags: [4, 10, 19, 20, 25],
		negativeTags: [24, 26],
		dlc: 4,
		level: 4,
		price: 99,
		from: { bond: { level: 4, specialGuest: 4005 } },
	},
	{
		id: 4009,
		name: '梅子茶泡饭',
		description:
			'用汤汁和热腾腾的白饭制作的茶泡饭！茶泡饭所用的汤汁通常为煎茶、烘焙茶或富有柴鱼香气的高汤，最后加入的梅子给这道素淡的菜品增添了一抹艳色。',
		recipes: [
			{
				id: 4009,
				ingredients: [4000, 10],
				cookerType: 1,
				baseCookTime: 4,
			},
		],
		positiveTags: [3, 12],
		negativeTags: [],
		dlc: 4,
		level: 1,
		price: 32,
		from: { bond: { level: 2, specialGuest: 4000 } },
	},
	{
		id: 4010,
		name: '海胆蒸蛋',
		description:
			'将鸡蛋加入海胆蒸至海胆黄变色就可以出锅的简单料理。吃的时候用勺子挖下去，一口一勺，海胆和蛋羹互相融合渗透的美味就在味蕾上蔓延了。',
		recipes: [
			{
				id: 4010,
				ingredients: [1002, 0],
				cookerType: 4,
				baseCookTime: 7,
			},
		],
		positiveTags: [11, 16, 20],
		negativeTags: [10],
		dlc: 4,
		level: 3,
		price: 112,
		from: { bond: { level: 3, specialGuest: 4000 } },
	},
	{
		id: 4011,
		name: '幻想风靡',
		description:
			'对火候要求极其苛刻的一道菜，需聚息凝神地将肉品烤至完美的三分熟。暗红的色调以及极具破坏性的龙卷风形状，带来了山海欲来的压迫感。一口下去，有种仿佛征服了天下的快感。',
		recipes: [
			{
				id: 4011,
				ingredients: [7, 4, 2, 18, 4004],
				cookerType: 2,
				baseCookTime: 18,
			},
		],
		positiveTags: [0, 6, 9, 18, 19, 20, 23],
		negativeTags: [7, 21],
		dlc: 4,
		level: 5,
		price: 185,
		from: { bond: { level: 4, specialGuest: 4000 } },
	},
	{
		id: 4012,
		name: '绿野仙菇',
		description: '本质上是野菜拌蘑菇，但因为这个名字多了一些奇妙的童话感。',
		recipes: [
			{
				id: 4012,
				ingredients: [4003, 17],
				cookerType: 1,
				baseCookTime: 6,
			},
		],
		positiveTags: [7, 25, 26, 30],
		negativeTags: [],
		dlc: 4,
		level: 1,
		price: 24,
		from: { bond: { level: 2, specialGuest: 4002 } },
	},
	{
		id: 4013,
		name: '花鸟风月',
		description:
			'牵丝攀藤地解开“花鸟风月”一词，同时想象着幽香小姐做出来的三角蛋糕。整体风格就像她本人一样风雅，不过上面插了一根我的羽毛，应该还算有趣吧？',
		recipes: [
			{
				id: 4013,
				ingredients: [4002, 33, 1004],
				cookerType: 4,
				baseCookTime: 9,
			},
		],
		positiveTags: [4, 27, 29, 30],
		negativeTags: [6, 22],
		dlc: 4,
		level: 3,
		price: 78,
		from: { bond: { level: 3, specialGuest: 4002 } },
	},
	{
		id: 4014,
		name: '幽梦',
		description:
			'以花卉为主题的双层奶油蛋糕。锦簇花团铺在细腻的奶油上，散发出丝丝香甜，蓝色的蝴蝶轻轻驻足，久久不归。这不是梦境，却胜似梦境。',
		recipes: [
			{
				id: 4014,
				ingredients: [4002, 26, 33, 27, 1004],
				cookerType: 4,
				baseCookTime: 12,
			},
		],
		positiveTags: [4, 7, 13, 17, 20, 21, 29],
		negativeTags: [0, 1, 8],
		dlc: 4,
		level: 4,
		price: 133,
		from: { bond: { level: 4, specialGuest: 4002 } },
	},
	{
		id: 4015,
		name: '香椿煎饼',
		description:
			'用有“毒”的野菜——香椿制成的煎饼。初尝有种苦苦涩涩的味道，嚼下去后口齿留甘。牢记！给普通客人食用须先将香椿用开水焯过一遍！',
		recipes: [
			{
				id: 4015,
				ingredients: [4003, 0],
				cookerType: 3,
				baseCookTime: 6,
			},
		],
		positiveTags: [19, 30],
		negativeTags: [],
		dlc: 4,
		level: 1,
		price: 30,
		from: { bond: { level: 2, specialGuest: 4001 } },
	},
	{
		id: 4016,
		name: '毒瘴花园',
		description:
			'用各种“毒食材”混合炖煮的杂炊。通过细致而精巧的食材处理手段，能够不同程度地保留食材中的“毒性”，让不同需求的客人均能体验到他们想要的刺激。',
		recipes: [
			{
				id: 4016,
				ingredients: [20, 4000, 12, 22],
				cookerType: 1,
				baseCookTime: 8,
			},
		],
		positiveTags: [1, 19, 24, 4001],
		negativeTags: [],
		dlc: 4,
		level: 3,
		price: 58,
		from: { bond: { level: 3, specialGuest: 4001 } },
	},
	{
		id: 4017,
		name: '小小的甜蜜「毒药」',
		description:
			'这是专门给小小的毒人偶——梅蒂欣制作的印象甜品。可爱中带着诡异的色彩，犹如自然界中绚丽的毒蘑菇勾人采摘。实际是没有毒的，梅蒂欣也是~',
		recipes: [
			{
				id: 4017,
				ingredients: [26, 1004, 36, 22],
				cookerType: 4,
				baseCookTime: 10,
			},
		],
		positiveTags: [4, 17, 20, 28, 29],
		negativeTags: [0],
		dlc: 4,
		level: 3,
		price: 87,
		from: { bond: { level: 4, specialGuest: 4001 } },
	},
	{
		id: 5000,
		name: '鳗鱼嫩蛋丼',
		description:
			'厚切的鳗鱼块抹上特调酱汁，再覆盖一层软嫩的生蛋，在食用前将其搅拌成金灿灿的样子，吃下去超级满足！',
		recipes: [
			{ id: 5000, ingredients: [12, 0], cookerType: 3, baseCookTime: 5 },
		],
		positiveTags: [1, 18, 19],
		negativeTags: [],
		dlc: 5,
		level: 2,
		price: 45,
		from: { bond: { level: 2, specialGuest: 5004 } },
	},
	{
		id: 5001,
		name: '竹筒烧醉虾',
		description:
			'把新鲜的虾放进醇香的酒中浸泡，再冰镇后淋上香料食用。既可以尝到虾的鲜香，同时也可以尝到酒的洌香，十分可口。',
		recipes: [
			{
				id: 5001,
				ingredients: [31, 23, 5001],
				cookerType: 5,
				baseCookTime: 5,
			},
		],
		positiveTags: [1, 16, 18, 24],
		negativeTags: [9],
		dlc: 5,
		level: 3,
		price: 60,
		from: { bond: { level: 3, specialGuest: 5004 } },
	},
	{
		id: 5002,
		name: '牛肉鸳鸯火锅',
		description:
			'一边是魔界辣椒汤底，一边是萝卜牛骨汤底，兼具红白两种汤汁的特色双锅牛肉。一家人，一个锅，两种口味团团圆圆，仿佛有了它就有家的气息。',
		recipes: [
			{
				id: 5002,
				ingredients: [35, 9, 18, 2, 16],
				cookerType: 1,
				baseCookTime: 5,
			},
		],
		positiveTags: [0, 3, 10, 14, 22, 23, 26, 34],
		negativeTags: [21, 29],
		dlc: 5,
		level: 4,
		price: 188,
		from: { bond: { level: 4, specialGuest: 5004 } },
	},
	{
		id: 5003,
		name: '猫咪可露丽',
		description:
			'迷人的焦糖脆外壳与软糯香浓的内心，无论在口感层次变化或者味觉体验都堪称一绝，不愧是“天使的铜铃”——咦？铃铛里居然还藏了只小猫咪！',
		recipes: [
			{
				id: 5003,
				ingredients: [5000, 30, 0],
				cookerType: 2,
				baseCookTime: 7,
			},
		],
		positiveTags: [9, 17, 20],
		negativeTags: [24],
		dlc: 5,
		level: 2,
		price: 45,
		from: { bond: { level: 2, specialGuest: 5003 } },
	},
	{
		id: 5004,
		name: '猫咪披萨',
		description:
			'在发酵的圆面饼上面覆盖各种配料烤制而成，完美兼顾了营养和品相，焦糖洋葱的醇香滋味更是为其带来了多重的舌尖享受。可爱的猫咪外形让人有些不忍下嘴呢~',
		recipes: [
			{
				id: 5004,
				ingredients: [17, 7, 5001, 4],
				cookerType: 2,
				baseCookTime: 10,
			},
		],
		positiveTags: [9, 13, 20, 26],
		negativeTags: [21],
		dlc: 5,
		level: 3,
		price: 75,
		from: { bond: { level: 3, specialGuest: 5003 } },
	},
	{
		id: 5005,
		name: '猫咪戏水',
		description:
			'猫咪主题的吐司盒。把一整个方块吐司挖空，底部涂上一层奶油，放入一层桃子果酱，再涂上一层奶油，铺一片吐司，加入晶莹剔透的白凉粉，最后再用调色奶油映照出蓝色的水面效果，放入巧克力做的猫咪，就成了一副有趣的猫咪戏水图了。',
		recipes: [
			{
				id: 5005,
				ingredients: [21, 5003, 1004, 30, 5000],
				cookerType: 5,
				baseCookTime: 12,
			},
		],
		positiveTags: [2, 17, 20, 21, 27, 29],
		negativeTags: [8, 22],
		dlc: 5,
		level: 4,
		price: 120,
		from: { bond: { level: 4, specialGuest: 5003 } },
	},
	{
		id: 5006,
		name: '长发公主',
		description:
			'摆盘精致的虾仁南瓜意面。南瓜蒸熟后又甜又糯，用它代替奶油做出来的意面低脂低卡，味道浓郁，营养十足！',
		recipes: [
			{ id: 5006, ingredients: [8, 23], cookerType: 4, baseCookTime: 5 },
		],
		positiveTags: [1, 9, 20],
		negativeTags: [24],
		dlc: 5,
		level: 2,
		price: 36,
		from: { bond: { level: 2, specialGuest: 5005 } },
	},
	{
		id: 5007,
		name: '海胆信玄饼',
		description:
			'以金枪鱼高汤制作的饼身清透干净，与新鲜海胆组成高级的香槟色系搭配，底层的胡麻酱更增一丝醇厚的口感。如此玲珑的甜品，让人不忍破坏这晶莹剔透的美丽。',
		recipes: [
			{
				id: 5007,
				ingredients: [1002, 14, 5004, 27],
				cookerType: 1,
				baseCookTime: 12,
			},
		],
		positiveTags: [1, 4, 21, 28, 29],
		negativeTags: [9],
		dlc: 5,
		level: 4,
		price: 128,
		from: { bond: { level: 3, specialGuest: 5005 } },
	},
	{
		id: 5008,
		name: '疯帽子茶会',
		description:
			'以魔界茶会为印象制作的甜品。表面看起来是一个巧克力做的茶壶，茶壶的肚子里是层层堆叠的奶油蛋糕，周围装饰着蘑菇和西蓝花，就像某个故事里的巧克力房子一样，是充满了梦幻和不可思议的幸福甜品。',
		recipes: [
			{
				id: 5008,
				ingredients: [5000, 1004, 30, 17, 5001],
				cookerType: 4,
				baseCookTime: 15,
			},
		],
		positiveTags: [13, 17, 20, 26, 27, 29, 30],
		negativeTags: [6],
		dlc: 5,
		level: 5,
		price: 188,
		from: { bond: { level: 4, specialGuest: 5005 } },
	},
	{
		id: 5009,
		name: '桃花琉璃卷',
		description:
			'通过胶凝化技术，把粉嫩可爱的桃花制成晶莹剔透的琉璃果冻外皮，裹着糯叽叽的豆沙馅儿，记录季节的浪漫与甜蜜。',
		recipes: [
			{
				id: 5009,
				ingredients: [21, 4001, 5003],
				cookerType: 4,
				baseCookTime: 8,
			},
		],
		positiveTags: [4, 12, 17, 20, 28, 29, 30],
		negativeTags: [0, 9, 24, 26],
		dlc: 5,
		level: 3,
		price: 60,
		from: { bond: { level: 2, specialGuest: 5001 } },
	},
	{
		id: 5010,
		name: '荷塘月色',
		description:
			'清爽细腻的葡萄乌龙冻，白色的是奶油慕斯！奶油的绵密与葡萄的清爽在舌尖碰撞出别样滋味，茶冻间点缀片片青提，馥郁果香充盈唇齿。菏泽上的小露珠也相当有趣~',
		recipes: [
			{
				id: 5010,
				ingredients: [36, 5003, 1004, 5004],
				cookerType: 5,
				baseCookTime: 12,
			},
		],
		positiveTags: [4, 7, 14, 17, 20, 21, 25],
		negativeTags: [0, 8, 22, 24],
		dlc: 5,
		level: 4,
		price: 128,
		from: { bond: { level: 3, specialGuest: 5001 } },
	},
	{
		id: 5011,
		name: '龙吟桃子',
		description:
			'本质上就是用桃子来制作桃子。将桃子作为原材料打碎，最后再还原出最初始的形状，从表面来看似乎是贯彻了一种返璞归真的理念，但制作过程极其繁琐考究。',
		recipes: [
			{
				id: 5011,
				ingredients: [5000, 21, 21, 21, 21],
				cookerType: 5,
				baseCookTime: 18,
			},
		],
		positiveTags: [4, 5, 7, 17, 21, 27, 30, 31],
		negativeTags: [0, 11, 18, 24, 26],
		dlc: 5,
		level: 5,
		price: 199,
		from: { bond: { level: 4, specialGuest: 5001 } },
	},
	{
		id: 5012,
		name: '分子蛋',
		description:
			'选用水分较少的北豆腐作为蛋白，甜糯的南瓜作为蛋黄，再用白巧克力做成蛋壳，还原出鸡蛋的模样与口感，让人意想不到呢。',
		recipes: [
			{
				id: 5012,
				ingredients: [5000, 8, 1004],
				cookerType: 5,
				baseCookTime: 7,
			},
		],
		positiveTags: [2, 4, 7, 17, 27, 28],
		negativeTags: [10],
		dlc: 5,
		level: 3,
		price: 80,
		from: { bond: { level: 2, specialGuest: 5002 } },
	},
	{
		id: 5013,
		name: '生命之源',
		description:
			'初见就像是云山雾罩的神秘星球，打开一看“星球”里竟然摆了个生鸡蛋？仔细看蛋液其实是银耳汤，蛋黄则是南瓜泥。吃起来口感清爽，还有香浓的南瓜味。',
		recipes: [
			{
				id: 5013,
				ingredients: [5000, 5004, 8, 27],
				cookerType: 4,
				baseCookTime: 13,
			},
		],
		positiveTags: [4, 5, 7, 18, 26, 27, 32],
		negativeTags: [10],
		dlc: 5,
		level: 4,
		price: 124,
		from: { bond: { level: 3, specialGuest: 5002 } },
	},
	{
		id: 5014,
		name: '火星',
		description:
			'特别定制的盘底如火星地表一般，上面盛放着顶级的螃蟹冻以及白葡萄分子技术制作的果凝。螃蟹口感冰凉顺滑不腻，果凝如水滴一般，而且带着淡淡酒香。寓意火星上一滴水珠，代表着最后的希望。',
		recipes: [
			{
				id: 5014,
				ingredients: [5003, 36, 1005, 27],
				cookerType: 4,
				baseCookTime: 24,
			},
		],
		positiveTags: [1, 4, 5, 11, 20, 25, 27, 31],
		negativeTags: [10],
		dlc: 5,
		level: 5,
		price: 198,
		from: { bond: { level: 4, specialGuest: 5002 } },
	},
	{
		id: 5015,
		name: '养心粥',
		description:
			'口味偏甜、营养丰富的银耳莲子粥。滋润而不腻滞，还具有养心安神的功效。',
		recipes: [
			{
				id: 5015,
				ingredients: [5004, 3000],
				cookerType: 1,
				baseCookTime: 5,
			},
		],
		positiveTags: [7, 17, 30],
		negativeTags: [],
		dlc: 5,
		level: 1,
		price: 35,
		from: { bond: { level: 2, specialGuest: 5000 } },
	},
	{
		id: 5016,
		name: '胡辣汤',
		description:
			'由多种天然中草药按比例配制的汤料，再加入胡椒和辣椒，又用骨头汤做底料的牛肉胡辣汤，喝一口就能驱散瞌睡虫。',
		recipes: [
			{
				id: 5016,
				ingredients: [35, 2, 5],
				cookerType: 3,
				baseCookTime: 8,
			},
		],
		positiveTags: [3, 14, 22, 32, 34, 35],
		negativeTags: [],
		dlc: 5,
		level: 2,
		price: 60,
		from: { bond: { level: 3, specialGuest: 5000 } },
	},
	{
		id: 5017,
		name: '至尊海鲜面',
		description:
			'以海鲜汤料煨煮的汤面，劲道爽滑，汤浓鲜美，是一道非常豪华的家常菜。凭一碗海鲜面，便能让人记住深藏着的大海的味道。',
		recipes: [
			{
				id: 5017,
				ingredients: [19, 10, 1001, 1005, 23],
				cookerType: 1,
				baseCookTime: 10,
			},
		],
		positiveTags: [1, 3, 4, 9, 11, 16],
		negativeTags: [],
		dlc: 5,
		level: 4,
		price: 135,
		from: { bond: { level: 4, specialGuest: 5000 } },
	},
	{
		id: -1,
		name: DARK_MATTER_META_MAP.name,
		description:
			'烹饪失误、散发着黑色气场的不明物质，不会有人想吃这种东西…吧？',
		recipes: [{ id: -1, ingredients: [], cookerType: 1, baseCookTime: 0 }],
		positiveTags: [DARK_MATTER_META_MAP.positiveTag],
		negativeTags: [],
		dlc: 0,
		level: 1,
		price: DARK_MATTER_META_MAP.price,
		from: {
			failedCooking: {
				causeLabels: ['料理制作失败'],
				punishmentSpellCardSpecialGuests: [37, 27],
			},
		},
	},
	{
		id: 11000,
		name: '山泉双色果盘',
		description:
			'用山间的泉水浸泡山上的野果制成的果盘，口感顺滑，冰凉甜美。由妖精制作的果盘更是可以保存数天而不变色，也许是她们的生命力在起效。',
		recipes: [
			{
				id: 11000,
				ingredients: [21, 36],
				cookerType: 5,
				baseCookTime: 3,
			},
		],
		positiveTags: [2, 7, 17, 21, 28, 31],
		negativeTags: [0, 1, 24, 34],
		dlc: 9,
		level: 2,
		price: 45,
		from: { bond: { level: 2, specialGuest: 9000 } },
	},
	{
		id: 11001,
		name: '鱼饼',
		description:
			'相比来自东方的原版鱼饼，这道鱼饼的口味更清淡一些，外形上也针对雾之湖的鱼种进行了调整。是一道非常不错的解酒小吃，也很受孩子们喜欢。',
		recipes: [
			{
				id: 11001,
				ingredients: [11, 6, 5],
				cookerType: 3,
				baseCookTime: 4,
			},
		],
		positiveTags: [1, 3, 8],
		negativeTags: [2],
		dlc: 9,
		level: 3,
		price: 52,
		from: { bond: { level: 3, specialGuest: 9000 } },
	},
	{
		id: 11002,
		name: '白果灵盅',
		description:
			'简单而美观的茶碗蒸，使用白果替换了雾之湖少见的鲜虾，口味相比一般的茶碗蒸更显清淡。月光草作为点缀，为本来平凡的蒸蛋增添了一丝闪烁的灵光。如果放在上古时代，大概会是难得一见的名贵菜肴吧。',
		recipes: [
			{
				id: 11002,
				ingredients: [0, 22, 33, 31],
				cookerType: 4,
				baseCookTime: 5,
			},
		],
		positiveTags: [4, 5, 7, 20, 25, 27],
		negativeTags: [-1, 0, 6],
		dlc: 9,
		level: 4,
		price: 98,
		from: { bond: { level: 4, specialGuest: 9000 } },
	},
	{
		id: 11003,
		name: '恶魔的甜甜圈',
		description:
			'形似甜甜圈，却长着一对恶魔的角，说是甜品，其实完全就是芝士口味的汉堡包。不过由于中间有洞，吃的时候要尤其留意不要弄脏了衣服。',
		recipes: [
			{
				id: 11003,
				ingredients: [30, 16, 2002],
				cookerType: 3,
				baseCookTime: 4,
			},
		],
		positiveTags: [0, 6, 15, 23],
		negativeTags: [],
		dlc: 9,
		level: 2,
		price: 48,
		from: { bond: { level: 2, specialGuest: 9001 } },
	},
	{
		id: 11004,
		name: '正义执行雕塑',
		description:
			'用高甜度巧克力制作的雕塑，似乎描绘的是大笑着的黑红色身影将粉色的身影踩在脚下的景象。所谓的“正义执行”指的就是这个吗？她开心就好。',
		recipes: [
			{
				id: 11004,
				ingredients: [5000, 5000, 11006],
				cookerType: 5,
				baseCookTime: 5,
			},
		],
		positiveTags: [13, 17, 20],
		negativeTags: [15],
		dlc: 9,
		level: 3,
		price: 92,
		from: { bond: { level: 3, specialGuest: 9001 } },
	},
	{
		id: 11005,
		name: '超位·业火烧烤宴',
		description:
			'利用火焰魔法和束缚魔法固定肉类并进行烧烤的料理，视觉特效值得满分。不过出于某人的奇妙心理，这道料理使用了超位级魔法，导致每次烹饪都像烟花表演。',
		recipes: [
			{
				id: 11005,
				ingredients: [2, 3, 16, 11000],
				cookerType: 5,
				baseCookTime: 5,
			},
		],
		positiveTags: [0, 8, 9, 20, 22, 23, 35],
		negativeTags: [31],
		dlc: 9,
		level: 4,
		price: 136,
		from: { bond: { level: 4, specialGuest: 9001 } },
	},
	{
		id: 11006,
		name: '甜心三明治',
		description:
			'超级猎奇口味的三明治，外表做得五颜六色很可爱，然而内里的味道简直令人咋舌。或许有些人会喜欢吧…',
		recipes: [
			{
				id: 11006,
				ingredients: [14, 36, 35],
				cookerType: 5,
				baseCookTime: 3,
			},
		],
		positiveTags: [0, 1, 24, 34],
		negativeTags: [],
		dlc: 9,
		level: 1,
		price: 35,
		from: { bond: { level: 2, specialGuest: 9002 } },
	},
	{
		id: 11007,
		name: '毛茸茸蘑菇汤',
		description:
			'利用了散碎的棉花糖模拟了绵羊般毛茸茸外表的西式汤。毛茸茸的表层下面是猩红色的肉汤，入口是极具侵略性和力量感的野味。是外表很可爱然而实际很暴力的料理呢。',
		recipes: [
			{
				id: 11007,
				ingredients: [11007, 15, 17],
				cookerType: 1,
				baseCookTime: 6,
			},
		],
		positiveTags: [0, 9, 10, 16, 23, 26],
		negativeTags: [],
		dlc: 9,
		level: 3,
		price: 68,
		from: { bond: { level: 3, specialGuest: 9002 } },
	},
	{
		id: 11008,
		name: '血色下午茶',
		description:
			'仿照蕾米莉亚的一顿普通下午茶制作。区别是原本的熟成牛排被替换成了更贴近小孩子口味的蜜汁牛肉，配套的煎蛋也换成了全熟。顺带一提，最正宗的做法是牛排三分甚至一分熟。',
		recipes: [
			{
				id: 11008,
				ingredients: [16, 0, 24, 29],
				cookerType: 3,
				baseCookTime: 5,
			},
		],
		positiveTags: [0, 4, 6, 9, 17, 18, 30],
		negativeTags: [],
		dlc: 9,
		level: 4,
		price: 105,
		from: { bond: { level: 4, specialGuest: 9002 } },
	},
	{
		id: 11009,
		name: '月见饼',
		description:
			'月之都为了纪念一位伟人而流传的零食。外形圆润如满月，口感细腻松软，带着淡淡的甜香，很适合小朋友食用。',
		recipes: [
			{
				id: 11009,
				ingredients: [33, 30],
				cookerType: 5,
				baseCookTime: 4,
			},
		],
		positiveTags: [17, 25, 28, 30],
		negativeTags: [0, 1],
		dlc: 9,
		level: 1,
		price: 35,
		from: { bond: { level: 2, specialGuest: 9003 } },
	},
	{
		id: 11010,
		name: '玉色良汤',
		description:
			'永琳所研发的药膳，口味带着一丝苦味的清甜。可以通肺止咳，化瘀补气，适合虚弱的病人食用。',
		recipes: [
			{
				id: 11010,
				ingredients: [24, 22, 27],
				cookerType: 4,
				baseCookTime: 7,
			},
		],
		positiveTags: [3, 7, 17, 32],
		negativeTags: [6, 34],
		dlc: 9,
		level: 2,
		price: 55,
		from: { bond: { level: 3, specialGuest: 9003 } },
	},
	{
		id: 11011,
		name: '星月桃子糕',
		description:
			'给食欲不振的病人开胃的甜点，使用了幻昙华和月光草模拟星光和月光，而桃子的甜香底味可以很好的刺激病人的胃口，又不至于过于刺激。是非常精致又非常贴心的甜点呢，不愧是月之头脑的作品。',
		recipes: [
			{
				id: 11011,
				ingredients: [21, 26, 33, 27],
				cookerType: 5,
				baseCookTime: 4,
			},
		],
		positiveTags: [12, 17, 20, 25, 27, 28],
		negativeTags: [],
		dlc: 9,
		level: 3,
		price: 118,
		from: { bond: { level: 4, specialGuest: 9003 } },
	},
	{
		id: 11012,
		name: '樱绯星屑缀玉烩饭',
		description:
			'在外界似乎被称为“Risotto”的烩饭料理。魔界之神对此进行改良，使用糯米与帕尔马芝士糅合，添上辣椒碎与菌菇碎，在锅中炒热后，再撒上柔软的花瓣，这道西洋感满满的烩饭就做成了。香糯的芝士烩饭中，晶莹的菌菇碎如同满天星斗，照亮了遍布鲜花的原野。一口下去，是仿佛将幻想乡漫野春樱与魔界夜空融为一体的甜辣滋味。',
		recipes: [
			{
				id: 11012,
				ingredients: [35, 17, 4002, 32, 2002],
				cookerType: 3,
				baseCookTime: 20,
			},
		],
		positiveTags: [-1, 3, 4, 9, 12, 13, 15, 16, 20, 26, 29, 34],
		negativeTags: [28, 4001],
		dlc: 9,
		level: 5,
		price: 180,
		from: { bond: { level: 4, specialGuest: 9004 } },
	},
	{
		id: 11013,
		name: '黯月魔境慕斯',
		description:
			'慕斯是一种由鸡蛋、奶油和各种调味食材混合制成，口感香甜松软的甜品。魔界之神对此进行了改良，使用巧克力、香草与香芋的层层搭配，再放上两颗红色浆果，外观看上去犹如气派的魔界宫殿“万魔殿”。据说是神绮平时用来招待客人以及举办茶会时必备的高级甜点。',
		recipes: [
			{
				id: 11013,
				ingredients: [0, 1004],
				cookerType: 5,
				baseCookTime: 8,
			},
		],
		positiveTags: [4, 13, 17, 28],
		negativeTags: [0, 1, 4001],
		dlc: 9,
		level: 2,
		price: 28,
		from: { bond: { level: 2, specialGuest: 9004 } },
	},
	{
		id: 11014,
		name: '烬色魔纹千层酥',
		description:
			'以魔神之翼为原型设计而成的咖啡色千层酥，苦涩鲜香的夹心搭配酥脆的酥皮，一口咬下去别有一番风味。最顶层使用成块的巧克力配上草莓果酱作为点缀，看起来就像魔神的翅膀一般。',
		recipes: [
			{
				id: 11014,
				ingredients: [30, 0, 5000, 29],
				cookerType: 2,
				baseCookTime: 8,
			},
		],
		positiveTags: [4, 13, 17, 20, 29],
		negativeTags: [0, 1, 4001],
		dlc: 9,
		level: 3,
		price: 65,
		from: { bond: { level: 3, specialGuest: 9004 } },
	},
	{
		id: 11015,
		name: '肉汁奶酪薯条',
		description:
			// cSpell:ignore Poutine
			'在外界似乎被称为“Poutine”的高热量西式快餐，最早起源于加拿大魁北克省，是加拿大的国菜。因该省有着大量法国后裔，因此当地人在法式炸薯条的基础上，加上了肉汁、手撕牛肉与奶酪块，构成了这道如同塔一般宏伟的热量炸弹。现代的肉汁奶酪薯条还经常会在此基础上额外加上羊肉粒、墨西哥辣椒、培根条、烧烤酱、牧场沙拉酱以及塔塔酱，真是让人看一眼就会腻到反胃…“多就是好！舞舞绝对会喜欢！”雪如此评价这道料理。',
		recipes: [
			{
				id: 11015,
				ingredients: [6, 1, 2002],
				cookerType: 2,
				baseCookTime: 5,
			},
		],
		positiveTags: [-1, 0, 6, 9, 13, 15],
		negativeTags: [7, 21, 28],
		dlc: 9,
		level: 3,
		price: 58,
		from: { bond: { level: 2, specialGuest: 11000 } },
	},
	{
		id: 11016,
		name: '俄罗斯酸辣汤',
		description:
			// cSpell:ignore Solyanka
			'在外界似乎被称为“Solyanka”的西式汤品，最早起源于俄罗斯寒冷的远东地区。相传，当时的人们为了度过寒冷的严冬，只能使用手中仅有的蔬菜和肉类，加上大量的酸黄瓜和柠檬来做成这道又酸又辣的浓汤。也正因为其又酸又辣，在魔界似乎没有流行起来，神绮也表示不用专门学新的菜谱真是帮了大忙。“酸酸辣辣，喝完就有用不完的力量了，舞舞绝对会喜欢！”雪如此评价这道料理。',
		recipes: [
			{
				id: 11016,
				ingredients: [7, 2, 6, 2001, 1000],
				cookerType: 1,
				baseCookTime: 10,
			},
		],
		positiveTags: [0, 16, 22, 23, 32, 34, 2000],
		negativeTags: [2, 7, 21, 28],
		dlc: 9,
		level: 4,
		price: 83,
		from: { bond: { level: 3, specialGuest: 11000 } },
	},
	{
		id: 11017,
		name: '奶油甜煎饼卷',
		description:
			'在外界似乎被称为“Cannoli”的西式甜点，最早起源于意大利巴勒莫，也是魔界最为流行的下午茶点心。奶油甜煎饼卷的制作方式非常奇特：首先用特制的铁棍或者锡箔纸固定住面粉做的酥皮，放入油锅中炸至金黄，然后往里面填入奶油馅料，最后在顶端撒上可可粉、糖霜以及可食用金箔便大功告成了。“这种甜点嘛，对于本魔神而言轻轻松松啦！”作为神绮平时下午茶必备的甜点，其本人使用魔法制作的奶油甜煎饼卷受到魔界人的好评，直到有一天，她灵机一动没有使用魔法而是亲手下厨…',
		recipes: [
			{
				id: 11017,
				ingredients: [30, 1004, 5000, 11000],
				cookerType: 3,
				baseCookTime: 13,
			},
		],
		positiveTags: [4, 9, 13, 16, 17, 20, 27, 28, 29],
		negativeTags: [],
		dlc: 9,
		level: 5,
		price: 185,
		from: { bond: { level: 4, specialGuest: 11000 } },
	},
	{
		id: 11018,
		name: '烤玉米',
		description:
			'舞亲手收获的玉米，用秋季随处可见的红叶烘烤，最后撒上黄油与焦糖，既保留了甜味又能充饥。高温使谷粒外壳焦香、内里柔软，做法简单却流传至今。',
		recipes: [
			{
				id: 11018,
				ingredients: [11005, 29],
				cookerType: 2,
				baseCookTime: 6,
			},
		],
		positiveTags: [2, 3, 17, 33],
		negativeTags: [18],
		dlc: 9,
		level: 1,
		price: 32,
		from: { bond: { level: 2, specialGuest: 11001 } },
	},
	{
		id: 11019,
		name: '俄罗斯冻汤',
		description:
			// cSpell:ignore Okroshka
			'在外界似乎被称为“Okroshka”的西式汤品，是一道适合在夏季消暑降温的料理。使用大量夏季产出的蔬菜，混合炼乳、开菲尔与格瓦斯。做法非常简单，只需要将混合物放入冰柜，等到冷冻完成后加入盐和黑胡椒即可直接食用。就连神绮都能轻松学会这道菜，因此在魔界非常流行。',
		recipes: [
			{
				id: 11019,
				ingredients: [11003, 1000, 11006, 6],
				cookerType: 5,
				baseCookTime: 10,
			},
		],
		positiveTags: [2, 8, 13, 15, 16, 21, 32, 2000],
		negativeTags: [22],
		dlc: 9,
		level: 3,
		price: 82,
		from: { bond: { level: 3, specialGuest: 11001 } },
	},
	{
		id: 11020,
		name: '西班牙冷汤',
		description:
			'在外界似乎被称为“Gazpacho”的西式汤品，历史最早可以追溯到西班牙大航海时期。相传最早是西班牙人在通过海路与各国贸易时，使用各国独特的蔬菜、水果混合大蒜而成的简单料理。经过多个世纪的发展，现代的西班牙冷汤已经不只是一道简单的蔬菜大杂烩，而是额外衍生出了如添加鲜花、火腿、草莓或是虾肉蟹肉之类的各种高级版本。不过由于神绮大人无法掌握，因此在魔界流行的是最基础的版本。',
		recipes: [
			{
				id: 11020,
				ingredients: [11004, 4002, 4004, 1000],
				cookerType: 5,
				baseCookTime: 13,
			},
		],
		positiveTags: [2, 4, 13, 15, 16, 17, 20, 21, 32, 2000],
		negativeTags: [22],
		dlc: 9,
		level: 4,
		price: 130,
		from: { bond: { level: 4, specialGuest: 11001 } },
	},
	{
		id: 11021,
		name: '板栗饼',
		description:
			'板栗煮熟后去壳碾碎，与黄油和适量糖拌成馅料，包裹在饼皮内烤制而成。外皮酥脆，内馅软甜，栗香浓郁，每一口都宣告着秋天的到来。',
		recipes: [
			{
				id: 11021,
				ingredients: [29, 30, 3003],
				cookerType: 2,
				baseCookTime: 6,
			},
		],
		positiveTags: [-2, 9, 17, 28],
		negativeTags: [],
		dlc: 9,
		level: 1,
		price: 24,
		from: { bond: { level: 2, specialGuest: 10000 } },
	},
	{
		id: 11022,
		name: '胜春朝',
		description:
			'受到静叶小姐话语的启发，研究出的甜蜜料理。将红薯彻底蒸熟，碾磨成泥，加上当季的葡萄、栗泥，从人里农户手里买来的炼乳而制成。虽然用的材料都是秋季的食材，但是却散发着不输春朝的甜蜜芬芳。',
		recipes: [
			{
				id: 11022,
				ingredients: [36, 3001, 3003, 11006],
				cookerType: 5,
				baseCookTime: 10,
			},
		],
		positiveTags: [3, 9, 13, 17, 25, 29, 35],
		negativeTags: [],
		dlc: 9,
		level: 3,
		price: 68,
		from: { bond: { level: 3, specialGuest: 10000 } },
	},
	{
		id: 11023,
		name: '秋神的工作',
		description:
			'比起菜肴更像一道盆栽景观，描绘了秋神中的姐姐正在制造落叶的场景。红薯和板栗凸显着秋季风味，糖浆的点缀增添了口感。轻轻一晃就会让精心布置在上面的金箔洒下，宛如秋日的落叶一般。',
		recipes: [
			{
				id: 11023,
				ingredients: [24, 3001, 3003, 11000],
				cookerType: 5,
				baseCookTime: 16,
			},
		],
		positiveTags: [9, 17, 20, 25, 30],
		negativeTags: [],
		dlc: 9,
		level: 4,
		price: 118,
		from: { bond: { level: 4, specialGuest: 10000 } },
	},
	{
		id: 11024,
		name: '南瓜派',
		description:
			'金黄南瓜入馅，与酥脆派皮相拥。切开时，秋日暖阳气息扑面而来；叉起一小块品尝，甜蜜在舌尖绽放。',
		recipes: [
			{ id: 11024, ingredients: [8, 29], cookerType: 2, baseCookTime: 5 },
		],
		positiveTags: [-1, 3, 9, 13, 17],
		negativeTags: [],
		dlc: 9,
		level: 2,
		price: 36,
		from: { bond: { level: 2, specialGuest: 10001 } },
	},
	{
		id: 11025,
		name: '芝士玉米焗红薯',
		description:
			'香浓芝士遇上清甜玉米和软糯红薯，一口下去甜蜜交织，温暖又饱腹，是幸福的味道。穰子的小秘方是在其中加入葡萄干，不仅增加了些许甜味，还提升了口感和营养。',
		recipes: [
			{
				id: 11025,
				ingredients: [11005, 3001, 36, 2002],
				cookerType: 2,
				baseCookTime: 7,
			},
		],
		positiveTags: [3, 9, 17, 22, 31],
		negativeTags: [],
		dlc: 9,
		level: 3,
		price: 60,
		from: { bond: { level: 3, specialGuest: 10001 } },
	},
	{
		id: 11026,
		name: '惊吓万圣夜',
		description:
			'从古老传说中外界庆祝丰收的节日中获得的灵感而制作出的料理。在名为南瓜头的“城堡”里，可可豆制成的黑巧克力化身“蝙蝠”，棉花糖扮演“幽灵”。万圣夜的惊喜藏于雕刻南瓜灯内，黑巧蝙蝠和棉花糖幽灵静卧此处，松露为这道奇妙菜品增加了风味和高级感。最中央则是玉米杆搭成的稻草人，不仅是丰收的象征，更为这份“艺术品”增添了一笔惊怖气氛。',
		recipes: [
			{
				id: 11026,
				ingredients: [8, 5000, 11007, 18, 11005],
				cookerType: 5,
				baseCookTime: 12,
			},
		],
		positiveTags: [5, 13, 17, 20, 25, 27],
		negativeTags: [],
		dlc: 9,
		level: 4,
		price: 177,
		from: { bond: { level: 4, specialGuest: 10001 } },
	},
	{
		id: 12000,
		name: '椰子麻薯',
		description:
			'妖梦在人间之里品尝椰奶和团子时，突然灵光一闪：“要是在制作团子时加入椰子，会怎么样呢？”凭着这股冲劲，铃瑚抢在清兰之前完成了新品开发并举办了试吃会，获得了人类与妖怪的一致好评。众所周知，幻想乡并没有海，因此，椰子究竟是如何漂流至此的，也成了困扰后世幻想乡美食史研究者的一大难题。',
		recipes: [
			{
				id: 12000,
				ingredients: [11001, 32],
				cookerType: 5,
				baseCookTime: 6,
			},
		],
		positiveTags: [12, 17, 20, 28, 30, 31],
		negativeTags: [0, 1, 15, 16],
		dlc: 9,
		level: 2,
		price: 36,
		from: {
			buy: {
				merchant: { label: '雪', map: 'HumanVillage' },
				price: null,
			},
		},
	},
	{
		id: 12001,
		name: '三色花见团子',
		description:
			'红美铃拜托老板娘指导自己制作的团子料理，其实就是常见的花见团子。团子中还加入了产自美铃家乡、具有安神功效的花茶。三色团子分别是象征美铃红色长发的红豆沙团子、象征咲夜小姐银蓝色头发的奶酪团子，以及象征美铃五角星帽子的抹茶团子。此外，她还用银质飞刀和五角星作了装饰。“我们家的女仆长吃完后，竟然难得地没有去打扰还在睡觉的门番呢。”——某位不愿透露姓名的吸血鬼',
		recipes: [
			{
				id: 12001,
				ingredients: [32, 4002],
				cookerType: 5,
				baseCookTime: 4,
			},
		],
		positiveTags: [7, 12, 17, 20, 29],
		negativeTags: [0, 1, 24, 33, 34],
		dlc: 9,
		level: 3,
		price: 80,
		from: {
			buy: {
				merchant: { label: '雪', map: 'HumanVillage' },
				price: null,
			},
		},
	},
	{
		id: 12002,
		name: '梦鲸幻境酒冻',
		description:
			'米斯蒂娅在鲵吞亭参加宴会、饮下奥野田美宵提供的酒水后，根据自己对美宵的印象，以及幻觉中的感受制作而成的一款含酒精甜品。甜品采用可爱的鲸鱼造型，内馅则选用时令水果与大吟酿复酿制成的果酱，果香浓郁。据说，吃下它之后，夜晚入睡时便会进入一场斑斓绚丽的梦境。“不关我的事哦。”——哆来咪·苏伊特',
		recipes: [
			{
				id: 12002,
				ingredients: [5003, 26, 36],
				cookerType: 4,
				baseCookTime: 9,
			},
		],
		positiveTags: [2, 4, 7, 17, 20, 29, 30, 31],
		negativeTags: [0, 6, 34],
		dlc: 9,
		level: 4,
		price: 120,
		from: {
			buy: {
				merchant: { label: '雪', map: 'HumanVillage' },
				price: null,
			},
		},
	},
	{
		id: 12003,
		name: '西红柿炒鸡蛋',
		description:
			'来自东方的国民家常菜。酸甜绵软的西红柿邂逅滑嫩蓬松的炒蛋，经旺火快炒迸发出朴实而治愈的香气。它没有华丽的卖相，也不需要珍稀的食材，却能用最平凡的滋味，带来直抵人心的温暖。无论是忙碌的巫女、闲逛的魔法使，还是深夜觅食的妖怪与人类，都无法拒绝这一盘平凡而温暖的人间烟火。',
		recipes: [
			{
				id: 12003,
				ingredients: [0, 4004],
				cookerType: 3,
				baseCookTime: 5,
			},
		],
		positiveTags: [-2, 3, 14],
		negativeTags: [],
		dlc: 9,
		level: 2,
		price: 35,
		from: {
			buy: {
				merchant: { label: '雪', map: 'HumanVillage' },
				price: null,
			},
		},
	},
	{
		id: 12004,
		name: '大酥山',
		description:
			'盛唐宫廷传世冷食，以乳酥淋冰叠筑山形，佐以时令鲜果、蜜饯果仁、花酿冻膏，再淋上醇厚奶浆任其缓缓流淌。观之莹洁，食之沁爽，是古时宴饮消暑珍馐。现如今打破古时单人小食的规制，做成可供多人围坐分食的大份甜品。',
		recipes: [
			{
				id: 12004,
				ingredients: [1004, 34, 36, 4002, 4000],
				cookerType: 5,
				baseCookTime: 7,
			},
		],
		positiveTags: [-1, 14, 17, 20, 21, 25, 29],
		negativeTags: [0, 1, 3, 15, 33, 34, 2000],
		dlc: 9,
		level: 4,
		price: 95,
		from: {
			buy: {
				merchant: { label: '雪', map: 'HumanVillage' },
				price: null,
			},
		},
	},
] as const satisfies IFoodSchema[];
