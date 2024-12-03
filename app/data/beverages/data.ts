/* eslint-disable sort-keys */
import type {IBeverage} from './types';

export const BEVERAGE_LIST = [
	{
		id: 0,
		name: '绿茶',
		description: '最普通的饮料，给一滴酒都不能沾的弱小妖怪准备的。',
		tags: ['无酒精'],
		dlc: 0,
		level: 1,
		price: 1,
		from: {
			self: true,
		},
	},
	{
		id: 1,
		name: '果味High Ball',
		description: '居酒屋常见的，使用威士忌、果汁和苏打勾兑的简单调酒，降低了酒精度之后成为了谁都可以享受的饮料。',
		tags: ['低酒精', '可加冰', '鸡尾酒', '西洋酒', '水果', '甘', '苦'],
		dlc: 0,
		level: 1,
		price: 12,
		from: {
			buy: ['【妖怪兽道】杂货商人'],
			fishingAdvanced: ['妖怪兽道'],
		},
	},
	{
		id: 2,
		name: '果味SOUR',
		description: '居酒屋常见的，使用烧酒、果汁和苏打勾兑的简单调酒，比起果味High Ball更加有日式风格。',
		tags: ['低酒精', '可加冰', '烧酒', '鸡尾酒', '水果', '甘', '苦'],
		dlc: 0,
		level: 1,
		price: 12,
		from: {
			buy: ['【妖怪兽道】杂货商人'],
			fishingAdvanced: ['妖怪兽道'],
		},
	},
	{
		id: 3,
		name: '淇',
		description:
			'在加入了大量的苏打后，这种起泡清酒酸甜的口感，以及较低的酒精度，使其很受女性的欢迎；可以说是清酒的香槟版本。',
		tags: ['低酒精', '可加冰', '清酒', '鸡尾酒', '甘', '辛', '苦', '气泡'],
		dlc: 0,
		level: 1,
		price: 18,
		from: {
			buy: ['【妖怪兽道】杂货商人', '【人间之里】酒商'],
			fishingAdvanced: ['妖怪兽道'],
		},
	},
	{
		id: 4,
		name: '超ZUN啤酒',
		description: '某位和幻想乡很有渊源的大人物作为副业的产品。虽然是出于兴趣而研制的啤酒，但意外地十分有人气。',
		tags: ['低酒精', '可加冰', '啤酒', '苦'],
		dlc: 0,
		level: 1,
		price: 18,
		from: {
			buy: ['【人间之里】酒商'],
		},
	},
	{
		id: 5,
		name: '日月星',
		description: '纯米酒，有着妖精的祝福。度数不高，口感柔顺，价格平易近人，是居酒屋受欢迎的选择。',
		tags: ['中酒精', '可加冰', '可加热', '清酒', '直饮'],
		dlc: 0,
		level: 2,
		price: 34,
		from: {
			buy: ['【人间之里】酒商'],
			fishingAdvanced: ['人间之里'],
		},
	},
	{
		id: 6,
		name: '梅酒',
		description: '人间之里的人类自酿的梅子酒。因为喝起来很甜，所以经常有不了解的生物被它的后劲儿击倒。',
		tags: ['中酒精', '可加冰', '可加热', '利口酒', '水果'],
		dlc: 0,
		level: 2,
		price: 32,
		from: {
			buy: ['【人间之里】酒商'],
			fishingAdvanced: ['迷途竹林', '辉针城'],
		},
	},
	{
		id: 7,
		name: '天狗踊',
		description:
			'传说连天狗喝了也会开心地跳舞的美味清酒，在妖怪之山开一次店就可以验证了吧。不同于其他无色的清酒，带有淡淡的琥珀色。',
		tags: ['高酒精', '可加冰', '可加热', '清酒', '直饮'],
		dlc: 0,
		level: 2,
		price: 70,
		from: {
			buy: ['【博丽神社】河童商人', '【旧地狱】鬼商'],
			fishingAdvanced: ['妖怪之山', '辉针城'],
		},
	},
	{
		id: 8,
		name: '猩红恶魔',
		description:
			'由伏特加、番茄汁、柠檬片、芹菜根混合调制，甜、酸、苦、辣四味俱全。因血红的颜色让人联想到某洋馆的吸血鬼，故得此名。',
		tags: ['低酒精', '可加冰', '鸡尾酒', '西洋酒'],
		dlc: 0,
		level: 2,
		price: 45,
		from: {
			buy: [['【博丽神社】妖精女仆', 80]],
		},
	},
	{
		id: 9,
		name: '神之麦',
		description: '使用妖怪之山上被秋天的神明们所庇佑的大麦所酿造的大麦烧酒。',
		tags: ['中酒精', '可加冰', '可加热', '烧酒', '直饮'],
		dlc: 0,
		level: 2,
		price: 45,
		from: {
			buy: ['【博丽神社】河童商人', '【神灵庙】道士'],
			fishingAdvanced: ['旧地狱', '命莲寺'],
		},
	},
	{
		id: 10,
		name: '水獭祭',
		description:
			'鬼杰组的战利品之一。因为水獭灵把敌组的战利品摆在地上的样子仿佛祭典，于是随便取的名字。实际上好像是相当高级的纯米大吟酿。',
		tags: ['中酒精', '可加冰', '可加热', '清酒', '直饮'],
		dlc: 0,
		level: 3,
		price: 130,
		from: {
			buy: ['【旧地狱】鬼商', '【命莲寺】娜兹玲'],
			collect: [
				['【妖怪兽道】码头', false, 15, 18],
				['【太阳花田】东侧向日葵丛', false, 15, 18],
				['【辉针城】酒窖', 40],
				['【月之都】月虹池（右上）', 40],
			],
			fishingAdvanced: ['妖怪兽道', '辉针城'],
			task: ['阿求小姐的色纸'],
		},
	},
	{
		id: 11,
		name: '晓',
		description: '针对幻想乡居民口味改良的威士忌。在保留威士忌独有的气味的同时也有着顺滑的口感。',
		tags: ['高酒精', '可加冰', '西洋酒', '直饮'],
		dlc: 0,
		level: 4,
		price: 400,
		from: {
			buy: [['【博丽神社】妖精女仆', 20]],
			collect: [
				'【地灵殿】酒水架（北侧）',
				['【辉针城】酒窖', 40],
				['【月之都】月虹池（右上）', 40],
				['【魔界】魅魔房顶', 10],
			],
			fishingAdvanced: ['神灵庙', '月之都'],
			task: ['阿求小姐的色纸', '女仆长的采购委托'],
		},
	},
	{
		id: 12,
		name: '雀酒',
		description:
			'传说中由麻雀酿的酒。将米粒藏入截断的竹中，当竹中有水时，日经月累便成佳酿。据说喝了此酒会舞无休止，是带着“诅咒”的美味呢。',
		tags: ['中酒精', '可加冰', '可加热', '清酒', '辛'],
		dlc: 0,
		level: 2,
		price: 50,
		from: {
			collect: [
				['【妖怪兽道】东南侧雀酒', false, 10, 15],
				['【太阳花田】树桩', false, 10, 15],
			],
			fishingAdvanced: ['妖怪兽道', '妖怪之山'],
		},
	},
	{
		id: 13,
		name: '红魔馆红茶',
		description:
			'使用柠檬、佛手柑和女仆长精心挑选的红茶品种烘培出带有独特香味的红茶饮料。为了扩张红魔馆的威严，非常普通地以红魔馆命名。',
		tags: ['无酒精', '可加热', '水果', '提神'],
		dlc: 0,
		level: 2,
		price: 25,
		from: {
			buy: ['【红魔馆】小恶魔'],
			fishingAdvanced: ['红魔馆'],
		},
	},
	{
		id: 14,
		name: '阿芙加朵',
		description: '将冰淇淋融化在咖啡中的做法，对于怕苦又需要咖啡提神的人来说是再好不过的饮料。',
		tags: ['无酒精', '可加冰', '甘', '苦', '提神'],
		dlc: 0,
		level: 2,
		price: 35,
		from: {
			buy: ['【红魔馆】小恶魔'],
			fishingAdvanced: ['地灵殿'],
		},
	},
	{
		id: 15,
		name: '红雾',
		description: '洋馆的女仆特制的红葡萄酒，酒体丰满。因为好像不是正常的时间下酿造出来的，总有一种雾气般的朦胧感。',
		tags: ['中酒精', '可加热', '西洋酒'],
		dlc: 0,
		level: 2,
		price: 75,
		from: {
			buy: ['【红魔馆】小恶魔', '【辉针城】不良少年'],
			fishingAdvanced: ['红魔馆'],
		},
	},
	{
		id: 16,
		name: '尼格罗尼',
		description: '微苦的橙味为主，香气扑鼻，入口柔顺。最近非常流行。',
		tags: ['中酒精', '可加冰', '鸡尾酒', '西洋酒', '水果', '苦'],
		dlc: 0,
		level: 3,
		price: 100,
		from: {
			buy: ['【红魔馆】匿名妖精女仆'],
			collect: [
				'【地灵殿】酒水架（西北侧）',
				'【太阳花田】东侧向日葵丛',
				['【辉针城】酒窖', 40],
				['【月之都】月虹池（右上）', 40],
			],
			fishingAdvanced: ['红魔馆', '旧地狱'],
		},
	},
	{
		id: 17,
		name: '教父',
		description: '浓烈的北方威士忌和杏仁利口酒混合，非常古典的调酒。口感也相当硬汉，普通的妖怪应付不来。',
		tags: ['高酒精', '可加冰', '鸡尾酒', '西洋酒', '苦', '古典'],
		dlc: 0,
		level: 3,
		price: 180,
		from: {
			buy: ['【红魔馆】匿名妖精女仆', '【辉针城】不良少年'],
			collect: [
				['【地灵殿】酒水架（西北侧）', 50],
				['【辉针城】酒窖', 40],
				['【月之都】月虹池（右上）', 40],
			],
			fishingAdvanced: ['辉针城'],
			task: ['阿求小姐的色纸'],
		},
	},
	{
		id: 18,
		name: '风祝',
		description: '轻松愉快的餐后酒。薄荷和奶油为主的口感。比起酒精饮料更像甜品。',
		tags: ['中酒精', '可加冰', '鸡尾酒', '甘', '现代'],
		dlc: 0,
		level: 3,
		price: 130,
		from: {
			buy: ['【太阳花田】太阳花精'],
			collect: [
				['【博丽神社】西侧守矢分社（祈愿）', true],
				'【太阳花田】东侧向日葵丛',
				['【辉针城】酒窖', 40],
				['【月之都】月虹池（右上）', 40],
			],
			fishingAdvanced: ['魔法森林', '魔界'],
		},
	},
	{
		id: 19,
		name: '冬酿',
		description:
			'来自某个古国的习俗，在冬至日酿造的酒。色泽金黄，清甜甘冽，加上桂花的香气，无论冰着喝还是热着喝都非常可口。',
		tags: ['低酒精', '可加冰', '可加热', '甘', '古典'],
		dlc: 0,
		level: 2,
		price: 60,
		from: {
			buy: [
				['【人间之里】香霖堂', 30],
				'【迷途竹林】美食妖怪兔',
				'【旧地狱】鬼商',
				'【神灵庙】道士',
				'【太阳花田】太阳花精',
			],
			fishingAdvanced: ['人间之里', '博丽神社', '迷途竹林', '魔法森林', '辉针城'],
		},
	},
	{
		id: 20,
		name: '十四夜',
		description:
			'比起十五夜的月亮是满月，也许更想留下十四夜时期待的心情。以这样的感觉酿造的高级清酒，也许只有它才配得上迷途竹林所见到的月亮吧。',
		tags: ['中酒精', '可加冰', '可加热', '清酒', '甘', '古典'],
		dlc: 0,
		level: 4,
		price: 440,
		from: {
			buy: ['【迷途竹林】美食妖怪兔'],
			collect: [
				['【辉针城】酒窖', 40],
				['【月之都】月虹池（右上）', 40],
				['【魔界】魅魔房顶', 10],
			],
			fishingAdvanced: ['命莲寺', '魔界'],
			task: ['阿求小姐的色纸', '女仆长的采购委托'],
		},
	},
	{
		id: 21,
		name: '火鼠裘',
		description: '如果不使用火鼠裘来承装也许就会烧起来的烈酒，几乎无人能承受其辣度的超级辣口烧酒。',
		tags: ['高酒精', '可加热', '烧酒', '辛'],
		dlc: 0,
		level: 4,
		price: 420,
		from: {
			buy: ['【旧地狱】鬼商'],
			collect: [
				['【辉针城】酒窖', 40],
				['【月之都】月虹池（右上）', 40],
				['【魔界】魅魔房顶', 10],
			],
			fishingAdvanced: ['地灵殿'],
			task: ['阿求小姐的色纸', '女仆长的采购委托'],
		},
	},
	{
		id: 22,
		name: '玉露茶',
		description: '几乎是日本茶中最高级的茶叶，需要用较低的水温来冲泡，甘醇飘香，口感独特。',
		tags: ['无酒精', '可加热', '古典'],
		dlc: 0,
		level: 2,
		price: 50,
		from: {
			buy: [['【博丽神社】河童商人', 10]],
			collect: ['【地灵殿】酒水架（南侧）'],
			fishingAdvanced: ['人间之里', '博丽神社'],
			task: ['阿求小姐的色纸'],
		},
	},
	{
		id: 23,
		name: '月面火箭',
		description: '使用月之都先进技术制作的高级气泡水。迸发的口感有如火箭一般，只需要加一片柠檬就是完美的饮品。',
		tags: ['无酒精', '可加冰', '气泡', '现代'],
		dlc: 0,
		level: 2,
		price: 45,
		from: {
			collect: ['【迷途竹林】西侧泉水', ['【地灵殿】游乐场', 20]],
			fishingAdvanced: ['迷途竹林', '妖怪之山', '月之都'],
		},
	},
	{
		id: 24,
		name: '牛奶',
		description: '温润纯白的饮品，无论小孩还是大人都适合饮用，好处多到说不完。',
		tags: ['无酒精', '直饮'],
		dlc: 0,
		level: 2,
		price: 16,
		from: {
			buy: ['【人间之里】清兰'],
		},
	},
	{
		id: 25,
		name: '红柚果汁',
		description: '据说是来自外界的人气饮料。用红色柚子这种水果榨汁，尤其是盛夏饮用，健康祛暑，让人回甘无穷。',
		tags: ['无酒精', '水果'],
		dlc: 0,
		level: 2,
		price: 24,
		from: {
			buy: ['【人间之里】清兰'],
		},
	},
	{
		id: 26,
		name: '波子汽水',
		description:
			'瓶口有弹珠的设计，只要向下按压将弹珠打入汽水内，引起二氧化碳的剧烈反应。此时将瓶中沸腾又冰冷的气泡一饮而尽的话，你会在胃中感受到整个夏天。',
		tags: ['无酒精', '气泡', '现代'],
		dlc: 0,
		level: 2,
		price: 30,
		from: {
			buy: ['【人间之里】铃瑚'],
			collect: [['【地灵殿】游乐场', 20]],
			fishingAdvanced: ['魔法森林'],
		},
	},
	{
		id: 27,
		name: '冰山毛玉冻柠',
		description: '仿佛是融化在可口的冰沙中的毛玉，佐以冻柠口味，在炎热的夏季，不知拯救了多少人命。',
		tags: ['无酒精', '可加冰', '直饮', '水果', '甘', '气泡', '提神'],
		dlc: 0,
		level: 2,
		price: 45,
		from: {
			buy: ['【妖怪兽道】萌澄果'],
		},
	},
	{
		id: 28,
		name: '“大冰棍儿！”',
		description: '简单又富有重量感的大冰块，有梦幻的甜蜜和薄荷的调味。夏天解暑、让所有人满血复活的神奇冰品。',
		tags: ['无酒精', '甘', '现代', '提神'],
		dlc: 0,
		level: 2,
		price: 35,
		from: {
			buy: ['【妖怪兽道】蹦蹦跳跳的三妖精'],
		},
	},
	{
		id: 1000,
		name: '大吟酿',
		description: '最高级的清酒，口感极佳而且有水果的香味。必须避光，在太阳的照射下颜色会迅速变深。',
		tags: ['中酒精', '可加冰', '清酒', '直饮', '水果', '甘', '古典'],
		dlc: 1,
		level: 3,
		price: 210,
		from: {
			buy: ['【妖怪之山】河童商人'],
		},
	},
	{
		id: 1001,
		name: '咖啡',
		description:
			'用现代磨制工艺将稀少的咖啡豆磨成粉末制作的饮品，能够奇妙的提升精神和集中力，是脑力劳动者不可或缺的神奇饮料。',
		tags: ['无酒精', '可加冰', '可加热', '苦', '现代', '提神'],
		dlc: 1,
		level: 2,
		price: 62,
		from: {
			buy: ['【魔法森林】上海人形'],
		},
	},
	{
		id: 1002,
		name: '妖精雨露',
		description:
			'妖精们采集露水，和花蜜混合的甘甜饮料。由于妖精们会忘记自己的劳动产品，所以常被动物或者人类采走。传说可以治愈百病甚至起死回生，但似乎是谣言。',
		tags: ['无酒精', '可加冰', '甘'],
		dlc: 1,
		level: 2,
		price: 80,
		from: {
			collect: ['【魔法森林】中部树根', '【魔界】西北侧'],
			fishingAdvanced: ['魔法森林', '太阳花田'],
		},
	},
	{
		id: 1003,
		name: '古法奶油冰沙',
		description:
			'河童们窖藏的天然冰块，和牛乳、糖等配料一起在铁桶里打碎，加速搅拌得到的产物，是古法制造的冰激凌。虽然现世已经不再用这种传统方法制作，但在幻想乡作为特色依旧很受欢迎。',
		tags: ['无酒精', '可加冰', '甘', '古典'],
		dlc: 1,
		level: 1,
		price: 42,
		from: {
			buy: ['【魔法森林】上海人形'],
			fishingAdvanced: ['太阳花田'],
		},
	},
	{
		id: 1004,
		name: '普通健身茶',
		description:
			'魔女研制的药茶，据说瘦身功效拔群。标签上写着“喝掉我”，虽然有点儿可疑但它神奇的丰富味道着实令人惊叹。',
		tags: ['中酒精', '利口酒', '苦', '气泡'],
		dlc: 1,
		level: 2,
		price: 32,
		from: {
			buy: ['【魔法森林】上海人形'],
		},
	},
	{
		id: 2000,
		name: '鬼杀',
		description:
			'传说一杯就能让酒量无底洞一般的鬼族醉生梦死的传说之酒…但我见到的是…鬼明明都当做凉白开来喝的？！传说一点儿都不靠谱啊。',
		tags: ['高酒精', '可加冰', '烧酒', '辛', '古典'],
		dlc: 2,
		level: 4,
		price: 320,
		from: {
			buy: ['【旧地狱】鬼商'],
			collect: [['【魔界】魅魔房顶', 10]],
			fishingAdvanced: ['旧地狱'],
		},
	},
	{
		id: 2001,
		name: '气保健',
		description:
			'河童贩卖的外面世界某种提神功能性饮料的山寨品，据说提取了主要成分，换个名字谁都可以制作…但这样真的没问题吗？',
		tags: ['无酒精', '直饮', '甘', '提神'],
		dlc: 2,
		level: 2,
		price: 45,
		from: {
			buy: ['【地灵殿】地狱鸦'],
		},
	},
	{
		id: 2002,
		name: '古明地冰激凌',
		description: '地灵殿的限定纪念甜品！以地灵殿的觉妖怪姐妹为原型设计的可爱甜筒，在地底妖怪中有很大的人气。',
		tags: ['无酒精', '水果', '甘', '现代'],
		dlc: 2,
		level: 2,
		price: 35,
		from: {
			buy: ['【地灵殿】地狱鸦'],
			fishingAdvanced: ['地灵殿'],
		},
	},
	{
		id: 3000,
		name: '杨枝甘露',
		description:
			'命莲寺特产。传说观音菩萨右手持杨枝，左手持盛有甘露的净瓶，用杨柳枝撒下甘露会带来好运。许多慕名而来的信徒都会饮上一杯。',
		tags: ['无酒精', '可加冰', '水果'],
		dlc: 3,
		level: 2,
		price: 50,
		from: {
			buy: ['【命莲寺】娜兹玲'],
		},
	},
	{
		id: 3001,
		name: '麒麟',
		description: '道士们采用外界的技术，只提取第一道麦汁酿造的啤酒。因此没有一般啤酒的涩味，口感更纯更顺。',
		tags: ['中酒精', '啤酒', '直饮'],
		dlc: 3,
		level: 3,
		price: 180,
		from: {
			buy: ['【神灵庙】道士'],
			fishingAdvanced: ['神灵庙'],
		},
	},
	{
		id: 4000,
		name: '天地无用',
		description:
			'鬼人正邪亲自酿造的酒精浓度超级高、据说连鬼都能醉倒的无牌酒。在村子没有销路，价格还不便宜，只能靠手下以半吓半卖的方式销售出去。',
		tags: ['高酒精', '烧酒'],
		dlc: 4,
		level: 3,
		price: 150,
		from: {
			buy: ['【辉针城】不良少年'],
			collect: ['【辉针城】酒窖', '【月之都】月虹池（右上）'],
		},
	},
	{
		id: 4001,
		name: '伶人醉',
		description: '桃花酿的酒。妖精之间有着饮一壶桃花酒，醉卧花间，就会遇到桃花仙的传说。这怎么看都是喝醉了吧？',
		tags: ['低酒精', '直饮', '水果', '甘', '古典'],
		dlc: 4,
		level: 3,
		price: 100,
		from: {
			buy: ['【太阳花田】太阳花精'],
			collect: ['【辉针城】酒窖', '【月之都】月虹池（右上）'],
			fishingAdvanced: ['太阳花田'],
		},
	},
	{
		id: 5000,
		name: '海的女儿',
		description:
			'传说海的女儿最终为爱化为泡沫，这杯有着独特口味的鸡尾酒，或许就是她当时流下的、替她回归海中的眼泪。',
		tags: ['低酒精', '辛', '气泡', '古典'],
		dlc: 5,
		level: 3,
		price: 80,
		from: {
			buy: ['【魔界】蓬松松爱莲♡魔法店', '【魔界】小丑'],
		},
	},
	{
		id: 5001,
		name: '魔界咖啡',
		description:
			'在魔界的烈酒里加入热咖啡，搅拌到融化后，再在顶部盖上一团细腻的奶油，由奶香到酒香再到咖啡香层次分明，口感醇厚，还能驱除一身的寒意。',
		tags: ['高酒精', '可加热', '西洋酒', '提神'],
		dlc: 5,
		level: 4,
		price: 210,
		from: {
			buy: ['【魔界】蓬松松爱莲♡魔法店', '【魔界】小丑'],
			collect: ['【魔界】魅魔房顶'],
			fishingAdvanced: ['魔界'],
		},
	},
	{
		id: 5002,
		name: '莫吉托爆浆球',
		description:
			'利用海藻酸钠溶液和氯化钙溶液反应形成一层海藻酸钠凝胶薄膜，将调好的莫吉托酒包裹在内，做成一个球状的透明凝胶。咬一口就爆浆，达到视觉和味觉的双重惊喜，看起来非常诱人。',
		tags: ['低酒精', '鸡尾酒', '气泡', '现代'],
		dlc: 5,
		level: 4,
		price: 300,
		from: {
			buy: ['【月之都】月兔'],
			collect: [['【月之都】月虹池（右上）', 10]],
			fishingAdvanced: ['月之都'],
		},
	},
	{
		id: 5003,
		name: '太空啤酒',
		description:
			'由航天器搭载到太空的酿酒酵母，经过科学家们精心研制，将空间酵母技术和现代啤酒工艺相结合，酿造出这款口感清爽醇厚、泡沫细密持久、饱含桃花香味的独特啤酒。',
		tags: ['中酒精', '啤酒', '水果', '现代'],
		dlc: 5,
		level: 3,
		price: 42,
		from: {
			buy: ['【月之都】月兔'],
			fishingAdvanced: ['月之都'],
		},
	},
	{
		id: 5004,
		name: '卫星冰咖啡',
		description:
			'咖啡被瞬间暴露于真空中，会因为过低的气压导致瞬间沸腾，因汽化现象而被不断带走热量的水最终会在沸腾的过程中凝固。这种一边沸腾一边冰冻的咖啡是月都的特色饮料。',
		tags: ['无酒精', '苦', '现代', '提神'],
		dlc: 5,
		level: 3,
		price: 96,
		from: {
			buy: ['【月之都】月兔'],
		},
	},
] as const satisfies IBeverage[];
