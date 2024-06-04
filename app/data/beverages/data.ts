import type {IBeverage} from './types';

const BEVERAGE_LIST = [
	{
		name: '绿茶',
		tag: ['无酒精'],
		dlc: 0,
		level: 1,
		price: 1,
		from: {
			self: true,
		},
	},
	{
		name: '雀酒',
		tag: ['中酒精', '可加冰', '可加热', '清酒', '辛'],
		dlc: 0,
		level: 2,
		price: 50,
		from: {
			collect: ['妖怪兽道东侧', '太阳花田树桩'],
		},
	},
	{
		name: '果味High Ball',
		tag: ['低酒精', '可加冰', '鸡尾酒', '西洋酒', '水果', '甘', '苦'],
		dlc: 0,
		level: 1,
		price: 12,
		from: {
			buy: ['妖怪兽道商人'],
		},
	},
	{
		name: '果味SOUR',
		tag: ['低酒精', '可加冰', '烧酒', '鸡尾酒', '水果', '甘', '苦'],
		dlc: 0,
		level: 1,
		price: 12,
		from: {
			buy: ['妖怪兽道商人'],
		},
	},
	{
		name: '淇',
		tag: ['低酒精', '可加冰', '清酒', '鸡尾酒', '气泡', '甘', '苦', '辛'],
		dlc: 0,
		level: 1,
		price: 18,
		from: {
			buy: ['妖怪兽道商人', '人间之里酒屋'],
		},
	},
	{
		name: '水獭祭',
		tag: ['中酒精', '可加冰', '可加热', '清酒', '直饮'],
		dlc: 0,
		level: 3,
		price: 130,
		from: {
			buy: ['命莲寺娜兹玲', '旧地狱鬼商'],
			collect: ['妖怪兽道南侧码头', '太阳花田东侧向日葵', ['辉针城东侧酒窖', true], ['月之都月虹池', true]],
			task: ['阿求小姐的色纸'],
		},
	},
	{
		name: '梅酒',
		tag: ['中酒精', '可加冰', '可加热', '利口酒', '水果'],
		dlc: 0,
		level: 2,
		price: 32,
		from: {
			buy: ['人间之里酒屋'],
		},
	},
	{
		name: '波子汽水',
		tag: ['无酒精', '现代', '气泡'],
		dlc: 0,
		level: 2,
		price: 30,
		from: {
			buy: ['人间之里铃瑚屋'],
		},
	},
	{
		name: '超ZUN啤酒',
		tag: ['低酒精', '可加冰', '啤酒', '苦'],
		dlc: 0,
		level: 1,
		price: 18,
		from: {
			buy: ['人间之里酒屋'],
		},
	},
	{
		name: '日月星',
		tag: ['中酒精', '可加冰', '可加热', '清酒', '直饮'],
		dlc: 0,
		level: 2,
		price: 34,
		from: {
			buy: ['人间之里酒屋'],
		},
	},
	{
		name: '晓',
		tag: ['高酒精', '可加冰', '西洋酒', '直饮'],
		dlc: 0,
		level: 4,
		price: 400,
		from: {
			buy: [['博丽神社妖精女仆', true]],
			collect: ['地灵殿西南侧酒水架', ['辉针城东侧酒窖', true], ['月之都月虹池', true]],
			task: ['阿求小姐的色纸', '女仆长的采购委托'],
		},
	},
	{
		name: '十四夜',
		tag: ['中酒精', '可加冰', '可加热', '清酒', '古典', '甘'],
		dlc: 0,
		level: 4,
		price: 440,
		from: {
			buy: ['迷途竹林妖怪兔'],
			collect: [
				['辉针城东侧酒窖', true],
				['月之都月虹池', true],
			],
			task: ['阿求小姐的色纸', '女仆长的采购委托'],
		},
	},
	{
		name: '火鼠裘',
		tag: ['高酒精', '可加热', '烧酒', '辛'],
		dlc: 0,
		level: 4,
		price: 420,
		from: {
			buy: ['旧地狱鬼商'],
			collect: [
				['辉针城东侧酒窖', true],
				['月之都月虹池', true],
			],
			task: ['阿求小姐的色纸', '女仆长的采购委托'],
		},
	},
	{
		name: '冬酿',
		tag: ['低酒精', '可加冰', '可加热', '古典', '甘'],
		dlc: 0,
		level: 2,
		price: 60,
		from: {
			buy: [['香霖堂', true], '迷途竹林妖怪兔', '旧地狱鬼商', '神灵庙道士', '太阳花田太阳花精'],
		},
	},
	{
		name: '教父',
		tag: ['高酒精', '可加冰', '西洋酒', '鸡尾酒', '古典', '苦'],
		dlc: 0,
		level: 3,
		price: 180,
		from: {
			buy: ['红魔馆妖精女仆', '辉针城不良少年'],
			collect: ['地灵殿西南侧酒水架', '辉针城东侧酒窖', ['月之都月虹池', true]],
			task: ['阿求小姐的色纸'],
		},
	},
	{
		name: '玉露茶',
		tag: ['无酒精', '可加热', '古典'],
		dlc: 0,
		level: 2,
		price: 50,
		from: {
			buy: [['博丽神社河童', true]],
			collect: ['地灵殿西南侧酒水架'],
			task: ['阿求小姐的色纸'],
		},
	},
	{
		name: '猩红恶魔',
		tag: ['低酒精', '可加冰', '西洋酒', '鸡尾酒'],
		dlc: 0,
		level: 2,
		price: 45,
		from: {
			buy: ['博丽神社妖精女仆'],
		},
	},
	{
		name: '尼格罗尼',
		tag: ['中酒精', '可加冰', '西洋酒', '鸡尾酒', '水果', '苦'],
		dlc: 0,
		level: 3,
		price: 100,
		from: {
			buy: ['红魔馆妖精女仆'],
			collect: ['地灵殿西南侧酒水架', '太阳花田东侧向日葵', ['辉针城东侧酒窖', true], ['月之都月虹池', true]],
		},
	},
	{
		name: '风祝',
		tag: ['中酒精', '可加冰', '鸡尾酒', '现代', '甘'],
		dlc: 0,
		level: 3,
		price: 130,
		from: {
			buy: ['太阳花田太阳花精'],
			collect: [['博丽神社西侧守矢分社', true], '太阳花田东侧向日葵', '辉针城东侧酒窖', ['月之都月虹池', true]],
		},
	},
	{
		name: '天狗踊',
		tag: ['高酒精', '可加冰', '可加热', '清酒', '直饮'],
		dlc: 0,
		level: 2,
		price: 70,
		from: {
			buy: ['博丽神社河童', '旧地狱鬼商'],
		},
	},
	{
		name: '神之麦',
		tag: ['中酒精', '可加冰', '可加热', '烧酒', '直饮'],
		dlc: 0,
		level: 2,
		price: 45,
		from: {
			buy: ['博丽神社河童', '神灵庙道士'],
		},
	},
	{
		name: '牛奶',
		tag: ['无酒精', '直饮'],
		dlc: 0,
		level: 2,
		price: 16,
		from: {
			buy: ['人间之里清兰屋'],
		},
	},
	{
		name: '红柚果汁',
		tag: ['无酒精', '水果'],
		dlc: 0,
		level: 2,
		price: 24,
		from: {
			buy: ['人间之里清兰屋'],
		},
	},
	{
		name: '阿芙加朵',
		tag: ['无酒精', '可加冰', '提神', '甘', '苦'],
		dlc: 0,
		level: 2,
		price: 35,
		from: {
			buy: ['红魔馆小恶魔'],
		},
	},
	{
		name: '冰山毛玉冻柠',
		tag: ['无酒精', '可加冰', '气泡', '水果', '提神', '直饮', '甘'],
		dlc: 0,
		level: 2,
		price: 45,
		from: {
			buy: ['妖怪兽道萌澄果'],
		},
	},
	{
		name: '红雾',
		tag: ['中酒精', '可加热', '西洋酒'],
		dlc: 0,
		level: 2,
		price: 75,
		from: {
			buy: ['红魔馆小恶魔', '辉针城不良少年'],
		},
	},
	{
		name: '红魔馆红茶',
		tag: ['无酒精', '可加热', '水果', '提神'],
		dlc: 0,
		level: 2,
		price: 25,
		from: {
			buy: ['红魔馆小恶魔'],
		},
	},
	{
		name: '“大冰棍儿！”',
		tag: ['无酒精', '提神', '甘', '现代'],
		dlc: 0,
		level: 2,
		price: 35,
		from: {
			buy: ['妖怪兽道三妖精'],
		},
	},
	{
		name: '月面火箭',
		tag: ['无酒精', '可加冰', '现代', '气泡'],
		dlc: 0,
		level: 2,
		price: 45,
		from: {
			collect: ['迷途竹林西侧泉水处', ['地灵殿西北侧游乐场', true]],
		},
	},
	{
		name: '古法奶油冰沙',
		tag: ['无酒精', '可加冰', '甘', '古典'],
		dlc: 1,
		level: 1,
		price: 42,
		from: {
			buy: ['魔法森林上海人形'],
		},
	},
	{
		name: '普通健身茶',
		tag: ['中酒精', '利口酒', '气泡', '苦'],
		dlc: 1,
		level: 2,
		price: 32,
		from: {
			buy: ['魔法森林上海人形'],
		},
	},
	{
		name: '咖啡',
		tag: ['无酒精', '可加冰', '可加热', '现代', '提神', '苦'],
		dlc: 1,
		level: 2,
		price: 62,
		from: {
			buy: ['魔法森林上海人形'],
		},
	},
	{
		name: '妖精雨露',
		tag: ['无酒精', '可加冰', '甘'],
		dlc: 1,
		level: 2,
		price: 80,
		from: {
			collect: ['魔法森林中部树根'],
		},
	},
	{
		name: '大吟酿',
		tag: ['中酒精', '可加冰', '清酒', '古典', '水果', '直饮', '甘'],
		dlc: 1,
		level: 3,
		price: 210,
		from: {
			buy: ['妖怪之山河童'],
		},
	},
	{
		name: '鬼杀',
		tag: ['高酒精', '可加冰', '烧酒', '古典', '辛'],
		dlc: 2,
		level: 4,
		price: 320,
		from: {
			buy: ['旧地狱鬼商'],
		},
	},
	{
		name: '气保健',
		tag: ['无酒精', '提神', '直饮', '甘'],
		dlc: 2,
		level: 2,
		price: 45,
		from: {
			buy: ['地灵殿地狱鸦'],
		},
	},
	{
		name: '古明地冰激凌',
		tag: ['无酒精', '现代', '水果', '甘'],
		dlc: 2,
		level: 2,
		price: 35,
		from: {
			buy: ['地灵殿地狱鸦'],
		},
	},
	{
		name: '杨枝甘露',
		tag: ['无酒精', '可加冰', '水果'],
		dlc: 3,
		level: 2,
		price: 50,
		from: {
			buy: ['命莲寺娜兹玲'],
		},
	},
	{
		name: '麒麟',
		tag: ['中酒精', '啤酒', '直饮'],
		dlc: 3,
		level: 3,
		price: 180,
		from: {
			buy: ['神灵庙道士'],
		},
	},
	{
		name: '天地无用',
		tag: ['高酒精', '烧酒'],
		dlc: 4,
		level: 3,
		price: 150,
		from: {
			buy: ['辉针城不良少年'],
			collect: ['辉针城东侧酒窖', '月之都月虹池'],
		},
	},
	{
		name: '伶人醉',
		tag: ['低酒精', '古典', '水果', '直饮', '甘'],
		dlc: 4,
		level: 3,
		price: 100,
		from: {
			buy: ['太阳花田太阳花精'],
			collect: ['辉针城东侧酒窖', '月之都月虹池'],
		},
	},
	{
		name: '海的女儿',
		tag: ['低酒精', '气泡', '辛', '古典'],
		dlc: 5,
		level: 3,
		price: 80,
		from: {
			buy: ['魔界小丑'],
		},
	},
	{
		name: '魔界咖啡',
		tag: ['高酒精', '提神', '可加热', '西洋酒'],
		dlc: 5,
		level: 4,
		price: 210,
		from: {
			buy: ['魔界小丑'],
			collect: ['魔界魅魔房顶'],
		},
	},
	{
		name: '莫吉托爆浆球',
		tag: ['低酒精', '气泡', '现代', '鸡尾酒'],
		dlc: 5,
		level: 4,
		price: 300,
		from: {
			buy: ['月之都月兔'],
		},
	},
	{
		name: '太空啤酒',
		tag: ['中酒精', '现代', '水果', '啤酒'],
		dlc: 5,
		level: 3,
		price: 42,
		from: {
			buy: ['月之都月兔'],
		},
	},
	{
		name: '卫星冰咖啡',
		tag: ['无酒精', '现代', '提神', '苦'],
		dlc: 5,
		level: 3,
		price: 96,
		from: {
			buy: ['月之都月兔'],
		},
	},
] as const satisfies IBeverage[];

type Beverages = typeof BEVERAGE_LIST;
type BeverageNames = Beverages[number]['name'];

export {BEVERAGE_LIST, type Beverages, type BeverageNames};
