/* eslint-disable sort-keys */
import type { IBeverage } from './schema';

export const BEVERAGE_LIST = [
	{
		id: 0,
		name: '绿茶',
		description: '最普通的饮料，给一滴酒都不能沾的弱小妖怪准备的。',
		tags: [-1],
		dlc: 0,
		level: 1,
		price: 1,
		from: { self: true },
	},
	{
		id: 1,
		name: '果味High Ball',
		description:
			'居酒屋常见的，使用威士忌、果汁和苏打勾兑的简单调酒，降低了酒精度之后成为了谁都可以享受的饮料。',
		tags: [0, 3, 7, 8, 12, 13, 15],
		dlc: 0,
		level: 1,
		price: 12,
		from: {
			buy: [{ label: '杂货商人', map: 'BeastForest' }],
			fishingAdvanced: ['BeastForest'],
		},
	},
	{
		id: 2,
		name: '果味SOUR',
		description:
			'居酒屋常见的，使用烧酒、果汁和苏打勾兑的简单调酒，比起High Ball更加有日式风格。',
		tags: [0, 3, 5, 7, 12, 13, 15],
		dlc: 0,
		level: 1,
		price: 12,
		from: {
			buy: [{ label: '杂货商人', map: 'BeastForest' }],
			fishingAdvanced: ['BeastForest'],
		},
	},
	{
		id: 3,
		name: '淇',
		description:
			'在加入了大量的苏打后，这种起泡清酒酸甜的口感，以及较低的酒精度，使其很受女性的欢迎；可以说是清酒的香槟版本。',
		tags: [0, 3, 6, 7, 13, 14, 15, 16],
		dlc: 0,
		level: 1,
		price: 18,
		from: {
			buy: [
				{ label: '杂货商人', map: 'BeastForest' },
				{ label: '酒商', map: 'HumanVillage' },
			],
			fishingAdvanced: ['BeastForest'],
		},
	},
	{
		id: 4,
		name: '超ZUN啤酒',
		description:
			'某位和幻想乡很有渊源的大人物作为副业的产品。虽然是出于兴趣而研制的啤酒，但意外地十分有人气。',
		tags: [0, 3, 10, 15],
		dlc: 0,
		level: 1,
		price: 18,
		from: { buy: [{ label: '酒商', map: 'HumanVillage' }] },
	},
	{
		id: 5,
		name: '日月星',
		description:
			'纯米酒，有着妖精的祝福。度数不高，口感柔顺，价格平易近人，是居酒屋受欢迎的选择。',
		tags: [1, 3, 4, 6, 11],
		dlc: 0,
		level: 2,
		price: 34,
		from: {
			buy: [{ label: '酒商', map: 'HumanVillage' }],
			fishingAdvanced: ['HumanVillage'],
		},
	},
	{
		id: 6,
		name: '梅酒',
		description:
			'人间之里的人类自酿的梅子酒。因为喝起来很甜，所以经常有不了解它的生物被它的后劲儿击倒。',
		tags: [1, 3, 4, 9, 12],
		dlc: 0,
		level: 2,
		price: 32,
		from: {
			buy: [{ label: '酒商', map: 'HumanVillage' }],
			fishingAdvanced: ['BambooForest', 'DLC4_ShiningNeedleCastle'],
		},
	},
	{
		id: 7,
		name: '天狗踊',
		description:
			'传说连天狗喝了也会开心地跳舞的美味清酒，在妖怪之山开一次店就可以验证了吧。不同于其他无色的清酒，天狗踊带有淡淡的琥珀色。',
		tags: [2, 3, 4, 6, 11],
		dlc: 0,
		level: 2,
		price: 70,
		from: {
			buy: [
				{ label: '河童商人', map: 'HakureiShrine' },
				{ label: '鬼商', map: 'DLC2_FormerHell' },
			],
			fishingAdvanced: [
				'DLC1_YoukaiMountain',
				'DLC4_ShiningNeedleCastle',
			],
		},
	},
	{
		id: 8,
		name: '猩红恶魔',
		description:
			'由伏特加、番茄汁、柠檬片、芹菜根混合调制，甜、酸、苦、辣四味俱全。因血红的颜色让人联想到某洋馆的吸血鬼，故得此名。',
		tags: [0, 3, 7, 8],
		dlc: 0,
		level: 2,
		price: 45,
		from: { buy: [[{ label: '妖精女仆', map: 'HakureiShrine' }, 80]] },
	},
	{
		id: 9,
		name: '神之麦',
		description:
			'使用妖怪之山上被秋天的神明们所庇佑的大麦所酿造的大麦烧酒。',
		tags: [1, 3, 4, 5, 11],
		dlc: 0,
		level: 2,
		price: 45,
		from: {
			buy: [
				{ label: '河童商人', map: 'HakureiShrine' },
				{ label: '道士', map: 'DLC3_DivineSpiritMausoleum' },
			],
			fishingAdvanced: ['DLC2_FormerHell', 'DLC3_MyourenTemple'],
		},
	},
	{
		id: 10,
		name: '水獭祭',
		description:
			'鬼杰组的战利品之一。因为水獭灵把敌组的战利品摆在地上的样子仿佛祭典，于是随便取的名字。实际上好像是相当高级的纯米大吟酿。',
		tags: [1, 3, 4, 6, 11],
		dlc: 0,
		level: 3,
		price: 130,
		from: {
			buy: [
				{ label: '鬼商', map: 'DLC2_FormerHell' },
				{ label: '娜兹玲', map: 'DLC3_MyourenTemple' },
			],
			collect: [
				[{ label: '码头', map: 'BeastForest' }, false, 15, 18],
				[
					{
						label: '东侧向日葵丛（水獭祭）',
						map: 'DLC4_GardenOfTheSun',
					},
					false,
					15,
					18,
				],
				[{ label: '酒窖', map: 'DLC4_ShiningNeedleCastle' }, 40],
				[{ label: '月虹池（右上）', map: 'DLC5_LunarCapital' }, 40],
			],
			fishingAdvanced: ['BeastForest', 'DLC4_ShiningNeedleCastle'],
			task: [{ task: '阿求小姐的色纸' }],
		},
	},
	{
		id: 11,
		name: '晓',
		description:
			'针对幻想乡居民口味改良的威士忌。在保留威士忌独有的气味的同时也有着顺滑的口感。',
		tags: [2, 3, 8, 11],
		dlc: 0,
		level: 4,
		price: 400,
		from: {
			buy: [[{ label: '妖精女仆', map: 'HakureiShrine' }, 20]],
			collect: [
				{ label: '酒水架（北侧）', map: 'DLC2_EarthSpiritsPalace' },
				[{ label: '酒窖', map: 'DLC4_ShiningNeedleCastle' }, 40],
				[{ label: '月虹池（右上）', map: 'DLC5_LunarCapital' }, 40],
				[{ label: '魅魔房顶', map: 'DLC5_Makai' }, 10],
			],
			fishingAdvanced: [
				'DLC3_DivineSpiritMausoleum',
				'DLC5_LunarCapital',
			],
			task: [{ task: '阿求小姐的色纸' }, { task: '女仆长的采购委托' }],
		},
	},
	{
		id: 12,
		name: '雀酒',
		description:
			'传说中由麻雀酿的酒。将米粒藏入截断的竹中，当竹中有水时，日经月累便成佳酿。据说喝了此酒会舞无休止，是带着“诅咒”的美味呢。',
		tags: [1, 3, 4, 6, 14],
		dlc: 0,
		level: 2,
		price: 50,
		from: {
			collect: [
				[{ label: '东南侧雀酒', map: 'BeastForest' }, false, 10, 15],
				[{ label: '树桩', map: 'DLC4_GardenOfTheSun' }, false, 10, 15],
			],
			fishingAdvanced: ['BeastForest', 'DLC1_YoukaiMountain'],
		},
	},
	{
		id: 13,
		name: '红魔馆红茶',
		description:
			'使用柠檬、佛手柑和女仆长精心挑选的红茶品种烘培出带有独特香味的红茶饮料。为了扩张红魔馆的威严，非常普通地以红魔馆命名。',
		tags: [-1, 4, 12, 19],
		dlc: 0,
		level: 2,
		price: 25,
		from: {
			buy: [{ label: '小恶魔', map: 'ScarletMansion' }],
			fishingAdvanced: ['ScarletMansion'],
		},
	},
	{
		id: 14,
		name: '阿芙加朵',
		description:
			'将冰淇淋融化在咖啡中的做法，对于怕苦又需要咖啡提神的人来说是再好不过的饮料。“我只是需要提神，并不是怕苦。”——帕秋莉',
		tags: [-1, 3, 13, 15, 19],
		dlc: 0,
		level: 2,
		price: 35,
		from: {
			buy: [{ label: '小恶魔', map: 'ScarletMansion' }],
			fishingAdvanced: ['DLC2_EarthSpiritsPalace'],
		},
	},
	{
		id: 15,
		name: '红雾',
		description:
			'洋馆的女仆特制的红葡萄酒，酒体丰满。因为好像不是正常的时间下酿造出来的，所以总有一种雾气般的朦胧感。',
		tags: [1, 4, 8],
		dlc: 0,
		level: 2,
		price: 75,
		from: {
			buy: [
				{ label: '小恶魔', map: 'ScarletMansion' },
				{ label: '不良少年', map: 'DLC4_ShiningNeedleCastle' },
			],
			fishingAdvanced: ['ScarletMansion'],
		},
	},
	{
		id: 16,
		name: '尼格罗尼',
		description:
			'微苦的橙味为主，香气扑鼻，入口柔顺。最近非常流行。“听说现世很流行，大小姐派我去学，结果受不了苦味让我加大橙子和味美思的剂量，最后完全变成橙汁糖浆了…”——不愿透露姓名的女仆长',
		tags: [1, 3, 7, 8, 12, 15],
		dlc: 0,
		level: 3,
		price: 100,
		from: {
			buy: [{ label: '匿名妖精女仆', map: 'ScarletMansion' }],
			collect: [
				{ label: '酒水架（西北侧）', map: 'DLC2_EarthSpiritsPalace' },
				{
					label: '东侧向日葵丛（风祝/尼格罗尼）',
					map: 'DLC4_GardenOfTheSun',
				},
				[{ label: '酒窖', map: 'DLC4_ShiningNeedleCastle' }, 40],
				[{ label: '月虹池（右上）', map: 'DLC5_LunarCapital' }, 40],
			],
			fishingAdvanced: ['ScarletMansion', 'DLC2_FormerHell'],
		},
	},
	{
		id: 17,
		name: '教父',
		description:
			'浓烈的北方威士忌和杏仁利口酒混合，非常古典的调酒。口感也相当硬汉，普通的妖怪应付不来。“大小姐听说凶猛的妖怪喜欢喝这种，派我去学，喝完都快哭出来了还要强作威严地说好喝。”——不愿透露姓名的女仆长',
		tags: [2, 3, 7, 8, 15, 17],
		dlc: 0,
		level: 3,
		price: 180,
		from: {
			buy: [
				{ label: '匿名妖精女仆', map: 'ScarletMansion' },
				{ label: '不良少年', map: 'DLC4_ShiningNeedleCastle' },
			],
			collect: [
				[
					{
						label: '酒水架（西北侧）',
						map: 'DLC2_EarthSpiritsPalace',
					},
					50,
				],
				[{ label: '酒窖', map: 'DLC4_ShiningNeedleCastle' }, 40],
				[{ label: '月虹池（右上）', map: 'DLC5_LunarCapital' }, 40],
			],
			fishingAdvanced: ['DLC4_ShiningNeedleCastle'],
			task: [{ task: '阿求小姐的色纸' }],
		},
	},
	{
		id: 18,
		name: '风祝',
		description:
			'轻松愉快的餐后酒。薄荷和奶油为主的口感，比起酒精饮料更像甜品。“好像是守矢的巫女从外面带过来的配方，堂而皇之地冠了自己的名字！说起来那家伙在外界能喝酒吗？啊，这玩意儿也完全不像酒就是了，怪不得她会喜欢，啧。”——不愿透露姓名的巫女',
		tags: [1, 3, 7, 13, 18],
		dlc: 0,
		level: 3,
		price: 130,
		from: {
			buy: [{ label: '太阳花精', map: 'DLC4_GardenOfTheSun' }],
			collect: [
				[{ label: '西侧守矢分社（祈愿）', map: 'HakureiShrine' }, true],
				{
					label: '东侧向日葵丛（风祝/尼格罗尼）',
					map: 'DLC4_GardenOfTheSun',
				},
				[{ label: '酒窖', map: 'DLC4_ShiningNeedleCastle' }, 40],
				[{ label: '月虹池（右上）', map: 'DLC5_LunarCapital' }, 40],
			],
			fishingAdvanced: ['DLC1_MagicForest', 'DLC5_Makai'],
		},
	},
	{
		id: 19,
		name: '冬酿',
		description:
			'来自某个古国的习俗，在冬至日酿造的酒。色泽金黄，清甜甘冽，加上桂花的香气，无论冰着喝还是热着喝都非常可口。',
		tags: [0, 3, 4, 13, 17],
		dlc: 0,
		level: 2,
		price: 60,
		from: {
			buy: [
				[{ label: '香霖堂', map: 'HumanVillage' }, 30],
				{ label: '美食妖怪兔', map: 'BambooForest' },
				{ label: '鬼商', map: 'DLC2_FormerHell' },
				{ label: '道士', map: 'DLC3_DivineSpiritMausoleum' },
				{ label: '太阳花精', map: 'DLC4_GardenOfTheSun' },
			],
			fishingAdvanced: [
				'HumanVillage',
				'HakureiShrine',
				'BambooForest',
				'DLC1_MagicForest',
				'DLC4_ShiningNeedleCastle',
			],
		},
	},
	{
		id: 20,
		name: '十四夜',
		description:
			'比起十五夜的月亮是满月，也许更想留下十四夜时期待的心情。以这样的感觉酿造的高级清酒，也许只有它才配得上迷途竹林所见到的月亮吧。',
		tags: [1, 3, 4, 6, 13, 17],
		dlc: 0,
		level: 4,
		price: 440,
		from: {
			buy: [{ label: '美食妖怪兔', map: 'BambooForest' }],
			collect: [
				[{ label: '酒窖', map: 'DLC4_ShiningNeedleCastle' }, 40],
				[{ label: '月虹池（右上）', map: 'DLC5_LunarCapital' }, 40],
				[{ label: '魅魔房顶', map: 'DLC5_Makai' }, 10],
			],
			fishingAdvanced: ['DLC3_MyourenTemple', 'DLC5_Makai'],
			task: [{ task: '阿求小姐的色纸' }, { task: '女仆长的采购委托' }],
		},
	},
	{
		id: 21,
		name: '火鼠裘',
		description:
			'如果不使用火鼠裘来承装也许就会烧起来的烈酒，几乎无人能承受其辣度的超级辣口烧酒。',
		tags: [2, 4, 5, 14],
		dlc: 0,
		level: 4,
		price: 420,
		from: {
			buy: [{ label: '鬼商', map: 'DLC2_FormerHell' }],
			collect: [
				[{ label: '酒窖', map: 'DLC4_ShiningNeedleCastle' }, 40],
				[{ label: '月虹池（右上）', map: 'DLC5_LunarCapital' }, 40],
				[{ label: '魅魔房顶', map: 'DLC5_Makai' }, 10],
			],
			fishingAdvanced: ['DLC2_EarthSpiritsPalace'],
			task: [{ task: '阿求小姐的色纸' }, { task: '女仆长的采购委托' }],
		},
	},
	{
		id: 22,
		name: '玉露茶',
		description:
			'几乎是日本茶中最高级的茶叶，需要用较低的水温来冲泡，甘醇飘香，口感独特。',
		tags: [-1, 4, 17],
		dlc: 0,
		level: 2,
		price: 50,
		from: {
			buy: [[{ label: '河童商人', map: 'HakureiShrine' }, 10]],
			collect: [
				{ label: '酒水架（南侧）', map: 'DLC2_EarthSpiritsPalace' },
			],
			fishingAdvanced: ['HumanVillage', 'HakureiShrine'],
			task: [{ task: '阿求小姐的色纸' }],
		},
	},
	{
		id: 23,
		name: '月面火箭',
		description:
			'使用月之都先进技术制作的高级气泡水。迸发的口感有如火箭一般，只需要加一片柠檬就是完美的饮品。',
		tags: [-1, 3, 16, 18],
		dlc: 0,
		level: 2,
		price: 45,
		from: {
			collect: [
				{ label: '西侧泉水', map: 'BambooForest' },
				[{ label: '游乐场', map: 'DLC2_EarthSpiritsPalace' }, 20],
			],
			fishingAdvanced: [
				'BambooForest',
				'DLC1_YoukaiMountain',
				'DLC5_LunarCapital',
			],
		},
	},
	{
		id: 24,
		name: '牛奶',
		description:
			'温润纯白的饮品，无论小孩还是大人都适合饮用，好处多到说不完。',
		tags: [-1, 11],
		dlc: 0,
		level: 2,
		price: 16,
		from: { buy: [{ label: '清兰', map: 'HumanVillage' }] },
	},
	{
		id: 25,
		name: '红柚果汁',
		description:
			'据说是来自外界的人气饮料。用红色柚子这种水果榨汁，尤其是盛夏饮用，健康祛暑，让人回甘无穷。',
		tags: [-1, 12],
		dlc: 0,
		level: 2,
		price: 24,
		from: { buy: [{ label: '清兰', map: 'HumanVillage' }] },
	},
	{
		id: 26,
		name: '波子汽水',
		description:
			'瓶口有弹珠的设计，只要向下按压将弹珠打入汽水内，引起二氧化碳的剧烈反应。此时将瓶中沸腾又冰冷的气泡一饮而尽的话，你会在胃中感受到整个夏天。',
		tags: [-1, 16, 18],
		dlc: 0,
		level: 2,
		price: 30,
		from: {
			buy: [{ label: '铃瑚', map: 'HumanVillage' }],
			collect: [
				[{ label: '游乐场', map: 'DLC2_EarthSpiritsPalace' }, 20],
			],
			fishingAdvanced: ['DLC1_MagicForest'],
		},
	},
	{
		id: 27,
		name: '冰山毛玉冻柠',
		description:
			'仿佛是融化在可口的冰沙中的毛玉，佐以冻柠口味，在炎热的夏季，不知拯救了多少人命。',
		tags: [-1, 3, 11, 12, 13, 16, 19],
		dlc: 0,
		level: 2,
		price: 45,
		from: { buy: [{ label: '萌澄果', map: 'BeastForest' }] },
	},
	{
		id: 28,
		name: '“大冰棍儿！”',
		description:
			'简单又富有重量感的大冰块，有梦幻的甜蜜和薄荷的调味。夏天解暑、让所有人满血复活的神奇冰品。',
		tags: [-1, 13, 18, 19],
		dlc: 0,
		level: 2,
		price: 35,
		from: { buy: [{ label: '蹦蹦跳跳的三妖精', map: 'BeastForest' }] },
	},
	{
		id: 1000,
		name: '大吟酿',
		description:
			'最高级的清酒，口感极佳而且有水果的香味。必须避光，在太阳的照射下颜色会迅速变深。',
		tags: [1, 3, 6, 11, 12, 13, 17],
		dlc: 1,
		level: 3,
		price: 210,
		from: { buy: [{ label: '河童商人', map: 'DLC1_YoukaiMountain' }] },
	},
	{
		id: 1001,
		name: '咖啡',
		description:
			'用现代磨制工艺将稀少的咖啡豆磨成粉末制作的饮品，能够奇妙地提升精神和集中力，是脑力劳动者不可或缺的神奇饮料。',
		tags: [-1, 3, 4, 15, 18, 19],
		dlc: 1,
		level: 2,
		price: 62,
		from: { buy: [{ label: '上海人形', map: 'DLC1_MagicForest' }] },
	},
	{
		id: 1002,
		name: '妖精雨露',
		description:
			'妖精们采集露水，和花蜜混合的甘甜饮料。由于妖精们会忘记自己的劳动产品，所以常被动物或者人类采走。传说可以治愈百病甚至起死回生，但似乎是谣言。',
		tags: [-1, 3, 13],
		dlc: 1,
		level: 2,
		price: 80,
		from: {
			collect: [
				{ label: '中部树根', map: 'DLC1_MagicForest' },
				{ label: '西北侧', map: 'DLC5_Makai' },
			],
			fishingAdvanced: ['DLC1_MagicForest', 'DLC4_GardenOfTheSun'],
		},
	},
	{
		id: 1003,
		name: '古法奶油冰沙',
		description:
			'河童们窖藏的天然冰块，和牛乳、糖等配料一起在铁桶里打碎，加速搅拌得到的产物，是古法制造的冰激凌。虽然现世已经不再用这种传统方法制作，但在幻想乡作为特色依旧很受欢迎。',
		tags: [-1, 3, 13, 17],
		dlc: 1,
		level: 1,
		price: 42,
		from: {
			buy: [{ label: '上海人形', map: 'DLC1_MagicForest' }],
			fishingAdvanced: ['DLC4_GardenOfTheSun'],
		},
	},
	{
		id: 1004,
		name: '普通健身茶',
		description:
			'魔女研制的药茶，据说瘦身功效拔群。标签上写着“喝掉我”，虽然有点可疑但它神奇的丰富味道着实令人惊叹。',
		tags: [1, 9, 15, 16],
		dlc: 1,
		level: 2,
		price: 32,
		from: { buy: [{ label: '上海人形', map: 'DLC1_MagicForest' }] },
	},
	{
		id: 2000,
		name: '鬼杀',
		description:
			'传说一杯就能让酒量无底洞一般的鬼族醉生梦死的传说之酒…但我见到的是…鬼明明都当做凉白开来喝的？！传说一点都不靠谱啊。',
		tags: [2, 3, 5, 14, 17],
		dlc: 2,
		level: 4,
		price: 320,
		from: {
			buy: [{ label: '鬼商', map: 'DLC2_FormerHell' }],
			collect: [[{ label: '魅魔房顶', map: 'DLC5_Makai' }, 10]],
			fishingAdvanced: ['DLC2_FormerHell'],
		},
	},
	{
		id: 2001,
		name: '气保健',
		description:
			'河童贩卖的外面世界某种提神功能性饮料的山寨品，据说提取了主要成分，换个名字谁都可以制作…但这样真的没问题吗？',
		tags: [-1, 11, 13, 19],
		dlc: 2,
		level: 2,
		price: 45,
		from: { buy: [{ label: '地狱鸦', map: 'DLC2_EarthSpiritsPalace' }] },
	},
	{
		id: 2002,
		name: '古明地冰激凌',
		description:
			'地灵殿的限定纪念甜品！以地灵殿的觉妖怪姐妹为原型设计的可爱甜筒，在地底妖怪中有很大的人气。',
		tags: [-1, 12, 13, 18],
		dlc: 2,
		level: 2,
		price: 35,
		from: {
			buy: [{ label: '地狱鸦', map: 'DLC2_EarthSpiritsPalace' }],
			fishingAdvanced: ['DLC2_EarthSpiritsPalace'],
		},
	},
	{
		id: 3000,
		name: '杨枝甘露',
		description:
			'命莲寺特产。传说观音菩萨右手持杨枝，左手持盛有甘露的净瓶，用杨柳枝撒下甘露会带来好运。许多慕名而来的信徒都会饮上一杯。',
		tags: [-1, 3, 12],
		dlc: 3,
		level: 2,
		price: 50,
		from: { buy: [{ label: '娜兹玲', map: 'DLC3_MyourenTemple' }] },
	},
	{
		id: 3001,
		name: '麒麟',
		description:
			'道士们采用外界的技术，只提取第一道麦汁酿造的啤酒。因此没有一般啤酒的涩味，口感更纯更顺。',
		tags: [1, 10, 11],
		dlc: 3,
		level: 3,
		price: 180,
		from: {
			buy: [{ label: '道士', map: 'DLC3_DivineSpiritMausoleum' }],
			fishingAdvanced: ['DLC3_DivineSpiritMausoleum'],
		},
	},
	{
		id: 4000,
		name: '天地无用',
		description:
			'鬼人正邪亲自酿造的酒精浓度超级高、据说连鬼都能醉倒的无牌酒。在村子没有销路，价格还不便宜，只能靠手下以半吓半卖的方式销售出去。',
		tags: [2, 5],
		dlc: 4,
		level: 3,
		price: 150,
		from: {
			buy: [{ label: '不良少年', map: 'DLC4_ShiningNeedleCastle' }],
			collect: [
				{ label: '酒窖', map: 'DLC4_ShiningNeedleCastle' },
				{ label: '月虹池（右上）', map: 'DLC5_LunarCapital' },
			],
		},
	},
	{
		id: 4001,
		name: '伶人醉',
		description:
			'桃花酿的酒。妖精之间有着饮一壶桃花酒，醉卧花间，就会遇到桃花仙的传说。这怎么看都是喝醉了吧？',
		tags: [0, 11, 12, 13, 17],
		dlc: 4,
		level: 3,
		price: 100,
		from: {
			buy: [{ label: '太阳花精', map: 'DLC4_GardenOfTheSun' }],
			collect: [
				{ label: '酒窖', map: 'DLC4_ShiningNeedleCastle' },
				{ label: '月虹池（右上）', map: 'DLC5_LunarCapital' },
			],
			fishingAdvanced: ['DLC4_GardenOfTheSun'],
		},
	},
	{
		id: 5000,
		name: '海的女儿',
		description:
			'传说海的女儿最终为爱化为泡沫，这杯有着独特口味的鸡尾酒，或许就是她当时流下的、替她回归海中的眼泪。',
		tags: [0, 14, 16, 17],
		dlc: 5,
		level: 3,
		price: 80,
		from: {
			buy: [
				[{ label: '蓬松松爱莲♡魔法店', map: 'DLC5_Makai' }, true],
				{ label: '小丑', map: 'DLC5_Makai' },
			],
		},
	},
	{
		id: 5001,
		name: '魔界咖啡',
		description:
			'在魔界的烈酒里加入热咖啡，搅拌到融化后，再在顶部盖上一团细腻的奶油，由奶香到酒香再到咖啡香层次分明，口感醇厚，还能驱除一身的寒意。',
		tags: [2, 4, 8, 19],
		dlc: 5,
		level: 4,
		price: 210,
		from: {
			buy: [
				[{ label: '蓬松松爱莲♡魔法店', map: 'DLC5_Makai' }, true],
				{ label: '小丑', map: 'DLC5_Makai' },
			],
			collect: [{ label: '魅魔房顶', map: 'DLC5_Makai' }],
			fishingAdvanced: ['DLC5_Makai'],
		},
	},
	{
		id: 5002,
		name: '莫吉托爆浆球',
		description:
			'利用海藻酸钠溶液和氯化钙溶液反应形成一层海藻酸钠凝胶薄膜，将调好的莫吉托酒包裹在内，做成一个球状的透明凝胶。咬一口就爆浆，达到视觉和味觉的双重惊喜，看起来非常诱人。',
		tags: [0, 7, 16, 18],
		dlc: 5,
		level: 4,
		price: 300,
		from: {
			buy: [
				{ label: '月兔', map: 'DLC5_LunarCapital' },
				[{ label: '蓬松松爱莲♡魔法店', map: 'DLC5_Makai' }, true],
			],
			collect: [
				[{ label: '月虹池（右上）', map: 'DLC5_LunarCapital' }, 10],
			],
			fishingAdvanced: ['DLC5_LunarCapital'],
		},
	},
	{
		id: 5003,
		name: '太空啤酒',
		description:
			'由航天器搭载到太空的酿酒酵母，经过科学家们精心研制，将空间酵母技术与现代啤酒工艺相结合，酿造出这款口感清爽醇厚、泡沫细密持久、饱含桃花香味的独特啤酒。',
		tags: [1, 10, 12, 18],
		dlc: 5,
		level: 3,
		price: 42,
		from: {
			buy: [
				{ label: '月兔', map: 'DLC5_LunarCapital' },
				[{ label: '蓬松松爱莲♡魔法店', map: 'DLC5_Makai' }, true],
			],
			fishingAdvanced: ['DLC5_LunarCapital'],
		},
	},
	{
		id: 5004,
		name: '卫星冰咖啡',
		description:
			'咖啡被瞬间暴露于真空中，会因为过低的气压导致瞬间沸腾，因汽化现象而被不断带走热量的水最终会在沸腾的过程中凝固。这种一边沸腾一边冰冻的咖啡是月都的特色饮料。',
		tags: [-1, 15, 18, 19],
		dlc: 5,
		level: 3,
		price: 96,
		from: {
			buy: [
				{ label: '月兔', map: 'DLC5_LunarCapital' },
				[{ label: '蓬松松爱莲♡魔法店', map: 'DLC5_Makai' }, true],
			],
		},
	},
	{
		id: 11000,
		name: '姜汁汽水',
		description:
			'露易兹去人间界旅游时从西方国家带回的气泡饮料，经过魔界各位的品尝之后获得了一致好评。使用苏打水、薄荷以及生姜萃取物混合而成，和普通的苏打水相比，增添了一份生姜的辛辣。舞对此进行改良，使用魔法制作的特殊冰块为气泡更增添了一份层次感。值得一提的是，虽然名称叫做“Ginger Ale”，但是却不含酒精。',
		tags: [-1, 3, 11, 14, 16, 19],
		dlc: 9,
		level: 2,
		price: 40,
		from: { buy: [{ label: '舞', map: 'HumanVillage' }] },
	},
	{
		id: 11001,
		name: '根汁啤酒',
		description:
			'露易兹去人间界旅游时从西方国家带回的气泡饮料，经过魔界各位的品尝之后获得了比较微妙的评价。使用树根提取物作为香精添加到汽水中，在禁酒令推行时期作为啤酒的替代品非常受欢迎。在根汁啤酒的传统制作流程中，杯子的选择是最重要的一环：最正宗的根汁啤酒必须盛放在啤酒同款的大号玻璃马克杯中，并且提前在冷库中冻上一整天。舞对此进行改良，使用魔法将马克杯表面冻得刚好结上一层霜，省去了繁杂的步骤。喝起来的味道非常奇妙，一向喜欢吃甜食的雪如此评价道：“就像是在吃可乐和香草味道的牙膏…”值得一提的是，虽然名称叫做“Root Beer”，外表看起来也像啤酒，但是却不含酒精。',
		tags: [-1, 3, 11, 13, 16],
		dlc: 9,
		level: 2,
		price: 65,
		from: { buy: [{ label: '舞', map: 'HumanVillage' }] },
	},
	{
		id: 11002,
		name: '地瓜烧',
		description:
			'“这可是丰收的神明从亲手栽下地瓜苗开始，一点一点酿制而成的酒哦！”从标签上可爱的字迹便能看出这是穰子小姐亲笔写下的，瓶身上还印着一幅红薯简笔画。拔出瓶塞，红薯与葡萄交融而成的酒香扑面而来，小酌之余还能给宴席增添一缕雅香。',
		tags: [2, 4, 12, 13],
		dlc: 9,
		level: 3,
		price: 136,
		from: { buy: [{ label: '舞', map: 'HumanVillage' }] },
	},
	{
		id: 11003,
		name: '不动的姆Q',
		description:
			'小恶魔特调——帕秋莉印象酒！采用从外界传入的配方，在完美女仆的指导下，由初次体验调酒乐趣的小恶魔精心调制而成。这是一款带有紫罗兰香气的鸡尾气泡酒，饮后还有一定的提神效果。为了照顾帕秋莉大人的口味，酒面上特意覆盖了一层厚厚的奶油。“虽然我很喜欢这个味道，但我真的不怕苦！”——帕秋莉',
		tags: [1, 3, 7, 12, 13, 16, 18, 19],
		dlc: 9,
		level: 2,
		price: 52,
		from: { buy: [{ label: '舞', map: 'HumanVillage' }] },
	},
] as const satisfies IBeverage[];
