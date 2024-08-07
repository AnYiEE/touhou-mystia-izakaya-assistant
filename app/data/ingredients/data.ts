/* eslint-disable sort-keys */
import type {IIngredient} from './types';

export const INGREDIENT_LIST = [
	{
		name: '海苔',
		type: '蔬菜',
		tags: ['素', '鲜'],
		dlc: 0,
		level: 1,
		price: 3,
		from: {
			buy: ['妖怪兽道商人', '人间之里农户'],
			collect: ['非迷途竹林河流'],
		},
	},
	{
		name: '黄油',
		type: '其他',
		tags: ['重油'],
		dlc: 0,
		level: 2,
		price: 8,
		from: {
			buy: ['红魔馆地精', '地灵殿地狱鸦'],
		},
	},
	{
		name: '面粉',
		type: '其他',
		tags: ['饱腹'],
		dlc: 0,
		level: 2,
		price: 10,
		from: {
			buy: ['红魔馆地精', '魔法森林上海人形'],
		},
	},
	{
		name: '猪肉',
		type: '肉类',
		tags: ['肉'],
		dlc: 0,
		level: 1,
		price: 10,
		from: {
			buy: ['妖怪兽道商人', '人间之里农户'],
			collect: [['妖怪之山捕兽夹', true]],
		},
	},
	{
		name: '豆腐',
		type: '蔬菜',
		tags: ['素', '家常', '清淡'],
		dlc: 0,
		level: 1,
		price: 8,
		from: {
			buy: ['妖怪兽道商人', '人间之里农户', ['人间之里香霖堂', true], '地灵殿地狱鸦'],
		},
	},
	{
		name: '鸡蛋',
		type: '其他',
		tags: ['生'],
		dlc: 0,
		level: 1,
		price: 4,
		from: {
			buy: ['妖怪兽道商人', '人间之里农户', ['人间之里香霖堂', true], '魔法森林上海人形', '魔界小丑'],
			collect: ['人间之里鸡窝', '旧地狱鸡窝'],
		},
	},
	{
		name: '露水',
		type: '其他',
		tags: ['清淡'],
		dlc: 0,
		level: 1,
		price: 10,
		from: {
			buy: ['神灵庙道士', '太阳花田太阳花精'],
			collect: ['妖怪兽道露水', '红魔馆露水', '魔法森林露水', '神灵庙露水', '太阳花田露水'],
		},
	},
	{
		name: '蘑菇',
		type: '蔬菜',
		tags: ['素', '鲜', '菌类'],
		dlc: 0,
		level: 3,
		price: 18,
		from: {
			buy: [['人间之里香霖堂', true], '魔法森林上海人形', '神灵庙道士'],
			collect: [
				['妖怪兽道露水', true],
				'博丽神社蘑菇',
				['红魔馆露水', true],
				'迷途竹林蘑菇',
				'魔法森林蘑菇',
				'地灵殿蘑菇',
				'太阳花田蘑菇',
			],
		},
	},
	{
		name: '蝉蜕',
		type: '其他',
		tags: ['猎奇'],
		dlc: 0,
		level: 1,
		price: 5,
		from: {
			collect: ['妖怪兽道蜂巢', '博丽神社参道西侧银杏', '旧地狱银杏'],
		},
	},
	{
		name: '牛肉',
		type: '肉类',
		tags: ['肉'],
		dlc: 0,
		level: 2,
		price: 15,
		from: {
			buy: ['妖怪兽道商人', '人间之里农户', '魔法森林上海人形', '旧地狱鬼商'],
		},
	},
	{
		name: '洋葱',
		type: '蔬菜',
		tags: ['素', '鲜'],
		dlc: 0,
		level: 2,
		price: 12,
		from: {
			buy: ['妖怪兽道商人', '人间之里农户'],
			collect: ['人间之里农田'],
		},
	},
	{
		name: '蜂蜜',
		type: '其他',
		tags: ['甜'],
		dlc: 0,
		level: 2,
		price: 15,
		from: {
			buy: [['人间之里香霖堂', true], '魔法森林上海人形', '命莲寺娜兹玲', '太阳花田太阳花精'],
			collect: [
				'妖怪兽道蜂巢',
				['人间之里银杏', true],
				['博丽神社银杏', true],
				'妖怪之山蜂巢',
				'命莲寺蜂巢',
				'太阳花田蜂巢',
			],
		},
	},
	{
		name: '糯米',
		type: '其他',
		tags: [],
		dlc: 0,
		level: 3,
		price: 15,
		from: {
			buy: [['人间之里香霖堂', true], '迷途竹林妖怪兔', '魔法森林上海人形'],
		},
	},
	{
		name: '月光草',
		type: '其他',
		tags: ['清淡', '文化底蕴', '不可思议', '梦幻'],
		dlc: 0,
		level: 5,
		price: 70,
		from: {
			buy: [['迷途竹林妖怪兔', true], '地灵殿地狱鸦'],
			collect: ['妖怪兽道南侧亭子月光草（需借道迷途竹林）'],
			task: ['阿求小姐的色纸'],
		},
	},
	{
		name: '萝卜',
		type: '蔬菜',
		tags: ['素', '下酒'],
		dlc: 0,
		level: 2,
		price: 16,
		from: {
			buy: ['妖怪兽道商人', '人间之里农户', '旧地狱鬼商'],
			collect: ['妖怪兽道花丛', '人间之里农田', ['博丽神社蘑菇', true], '魔法森林花丛', '太阳花田温室'],
		},
	},
	{
		name: '土豆',
		type: '蔬菜',
		tags: ['素', '家常'],
		dlc: 0,
		level: 2,
		price: 10,
		from: {
			buy: ['妖怪兽道商人', '人间之里农户'],
			collect: ['妖怪兽道花丛', '博丽神社花丛', '妖怪之山花丛'],
		},
	},
	{
		name: '八目鳗',
		type: '海鲜',
		tags: ['水产', '鲜', '招牌'],
		dlc: 0,
		level: 2,
		price: 14,
		from: {
			buy: ['辉针城不良少年'],
			collect: [
				['妖怪兽道河流', true],
				['妖怪之山中心瀑布', true],
				'神灵庙水涡',
				'辉针城水涡',
				['辉针城碗之后', true],
			],
		},
	},
	{
		name: '辣椒',
		type: '其他',
		tags: ['辣'],
		dlc: 0,
		level: 1,
		price: 2,
		from: {
			buy: [['妖怪兽道商人', true], '人间之里农户', '旧地狱鬼商', '命莲寺娜兹玲', '魔界小丑'],
			collect: [['妖怪兽道花丛', true], '魔界辣椒丛'],
		},
	},
	{
		name: '竹笋',
		type: '蔬菜',
		tags: ['素', '清淡'],
		dlc: 0,
		level: 3,
		price: 40,
		from: {
			buy: [['妖怪兽道商人', true], ['人间之里香霖堂', true], '旧地狱鬼商', '月之都月兔'],
			collect: ['迷途竹林竹笋', '辉针城竹笋', ['辉针城竹子', true]],
		},
	},
	{
		name: '虾',
		type: '海鲜',
		tags: ['水产', '鲜'],
		dlc: 0,
		level: 2,
		price: 30,
		from: {
			collect: ['命莲寺东北莲花池', '神灵庙水涡', ['非妖怪兽道河流', true]],
		},
	},
	{
		name: '桃子',
		type: '其他',
		tags: ['甜', '果味'],
		dlc: 0,
		level: 3,
		price: 10,
		from: {
			buy: [['人间之里香霖堂', true], '月之都月兔'],
			collect: ['博丽神社桃树', '魔法森林桃树', '太阳花田桃树'],
		},
	},
	{
		name: '冰块',
		type: '其他',
		tags: ['凉爽'],
		dlc: 0,
		level: 1,
		price: 2,
		from: {
			buy: [['人间之里香霖堂', true]],
			collect: ['红魔馆河流', '神灵庙北部冰块'],
		},
	},
	{
		name: '鳟鱼',
		type: '海鲜',
		tags: ['水产', '鲜'],
		dlc: 0,
		level: 1,
		price: 8,
		from: {
			buy: ['旧地狱鬼商'],
			collect: [['妖怪兽道河流', true], '妖怪之山中心瀑布', ['辉针城碗之后', true]],
		},
	},
	{
		name: '野猪肉',
		type: '肉类',
		tags: ['肉'],
		dlc: 0,
		level: 3,
		price: 25,
		from: {
			buy: ['博丽神社妖精女仆', '辉针城不良少年'],
			collect: [
				['妖怪兽道捕兽夹', true],
				['妖怪之山捕兽夹', true],
			],
		},
	},
	{
		name: '竹子',
		type: '其他',
		tags: ['适合拍照'],
		dlc: 0,
		level: 3,
		price: 15,
		from: {
			buy: [['人间之里香霖堂', true], '旧地狱鬼商'],
			collect: ['迷途竹林竹子', '辉针城竹子'],
		},
	},
	{
		name: '极上金枪鱼',
		type: '海鲜',
		tags: ['水产', '高级', '传说', '海味', '鲜'],
		dlc: 0,
		level: 5,
		price: 34,
		from: {
			buy: [['博丽神社妖精女仆', true], '红魔馆地精', '迷途竹林妖怪兔'],
			collect: [
				['红魔馆河流', true],
				'迷途竹林水涡',
				['妖怪之山南侧瀑布', true],
				['辉针城水涡', true],
				['辉针城碗之后', true],
			],
			task: ['阿求小姐的色纸'],
		},
	},
	{
		name: '南瓜',
		type: '蔬菜',
		tags: ['素', '饱腹'],
		dlc: 0,
		level: 2,
		price: 14,
		from: {
			buy: ['妖怪兽道商人', '人间之里农户', '魔法森林上海人形'],
			collect: ['人间之里农田'],
		},
	},
	{
		name: '三文鱼',
		type: '海鲜',
		tags: ['水产', '高级', '鲜'],
		dlc: 0,
		level: 3,
		price: 24,
		from: {
			buy: [['妖怪兽道商人', true], '旧地狱鬼商', '神灵庙道士'],
			collect: ['神灵庙水涡', '辉针城水涡', ['辉针城碗之后', true], ['非妖怪兽道河流', true]],
		},
	},
	{
		name: '白果',
		type: '其他',
		tags: ['适合拍照'],
		dlc: 0,
		level: 2,
		price: 7,
		from: {
			buy: ['魔法森林上海人形', '地灵殿地狱鸦'],
			collect: ['人间之里银杏', '博丽神社银杏', '妖怪之山蜂巢', '魔法森林银杏', '地灵殿花丛', '太阳花田银杏'],
		},
	},
	{
		name: '和牛',
		type: '肉类',
		tags: ['肉', '高级', '传说'],
		dlc: 0,
		level: 5,
		price: 40,
		from: {
			buy: ['博丽神社妖精女仆', '红魔馆地精', '迷途竹林妖怪兔', '神灵庙道士'],
			collect: ['旧地狱捕兽夹'],
			task: ['阿求小姐的色纸'],
		},
	},
	{
		name: '黑毛猪肉',
		type: '肉类',
		tags: ['肉', '传说', '山珍'],
		dlc: 0,
		level: 4,
		price: 35,
		from: {
			buy: [['博丽神社妖精女仆', true], '旧地狱鬼商'],
			collect: [['妖怪兽道捕兽夹', true], ['妖怪之山捕兽夹', true], '旧地狱捕兽夹'],
		},
	},
	{
		name: '松露',
		type: '蔬菜',
		tags: ['素', '高级', '传说', '山珍', '鲜', '菌类'],
		dlc: 0,
		level: 5,
		price: 50,
		from: {
			buy: [['博丽神社妖精女仆', true], '魔法森林上海人形', '神灵庙道士', '辉针城不良少年', '太阳花田太阳花精'],
			collect: [
				['妖怪兽道露水', true],
				['博丽神社蘑菇', true],
				['红魔馆露水', true],
				['迷途竹林蘑菇', true],
				['地灵殿蘑菇', true],
			],
			task: ['阿求小姐的色纸'],
		},
	},
	{
		name: '河豚',
		type: '海鲜',
		tags: ['水产', '海味', '鲜'],
		dlc: 0,
		level: 5,
		price: 42,
		from: {
			buy: [['博丽神社妖精女仆', true], '红魔馆地精', '迷途竹林妖怪兔', '神灵庙道士'],
			collect: [['红魔馆河流', true], '地灵殿水池'],
			task: ['阿求小姐的色纸'],
		},
	},
	{
		name: '幻昙华',
		type: '其他',
		tags: ['高级', '传说', '不可思议', '梦幻'],
		dlc: 0,
		level: 5,
		price: 70,
		from: {
			collect: [
				'妖怪兽道东侧山丘（需借道博丽神社）',
				'地灵殿东侧喷泉',
				['地灵殿西北侧游乐场', true],
				'命莲寺西南花丛',
			],
			task: ['阿求小姐的色纸'],
		},
	},
	{
		name: '鹿肉',
		type: '肉类',
		tags: ['肉'],
		dlc: 0,
		level: 2,
		price: 20,
		from: {
			buy: ['迷途竹林妖怪兔', '神灵庙道士'],
			collect: [['妖怪兽道捕兽夹', true]],
		},
	},
	{
		name: '金枪鱼',
		type: '海鲜',
		tags: ['水产', '高级', '鲜'],
		dlc: 0,
		level: 3,
		price: 30,
		from: {
			buy: ['神灵庙道士'],
			collect: ['神灵庙水涡', ['辉针城碗之后', true], ['非妖怪兽道河流', true]],
		},
	},
	{
		name: '黄瓜',
		type: '蔬菜',
		tags: ['素', '家常', '清淡'],
		dlc: 1,
		level: 1,
		price: 7,
		from: {
			buy: [
				['妖怪之山河童', true],
				['太阳花田太阳花精', true],
			],
			collect: ['妖怪之山黄瓜'],
		},
	},
	{
		name: '黑盐',
		type: '其他',
		tags: ['咸'],
		dlc: 1,
		level: 1,
		price: 3,
		from: {
			buy: [['妖怪之山河童', true], '命莲寺娜兹玲'],
			collect: ['妖怪之山黑盐'],
		},
	},
	{
		name: '奶油',
		type: '其他',
		tags: ['家常', '西式', '甜'],
		dlc: 1,
		level: 1,
		price: 9,
		from: {
			buy: [['魔法森林上海人形', true], '命莲寺娜兹玲', '太阳花田太阳花精', '魔界小丑'],
		},
	},
	{
		name: '章鱼',
		type: '海鲜',
		tags: ['水产', '海味', '鲜'],
		dlc: 1,
		level: 2,
		price: 12,
		from: {
			buy: [['妖怪之山河童', true]],
			collect: [['辉针城碗之后', true]],
		},
	},
	{
		name: '葡萄',
		type: '其他',
		tags: ['甜', '果味'],
		dlc: 0,
		level: 1,
		price: 5,
		from: {
			buy: [
				['魔法森林上海人形', true],
				['地灵殿地狱鸦', true],
			],
			collect: ['红魔馆葡萄', '太阳花田葡萄'],
		},
	},
	{
		name: '螃蟹',
		type: '海鲜',
		tags: ['水产', '高级', '鲜'],
		dlc: 1,
		level: 3,
		price: 10,
		from: {
			buy: [
				['妖怪之山河童', true],
				['辉针城不良少年', true],
			],
			collect: ['妖怪之山西北瀑布', ['辉针城碗之后', true]],
		},
	},
	{
		name: '海胆',
		type: '海鲜',
		tags: ['水产', '高级', '传说', '海味', '鲜'],
		dlc: 1,
		level: 3,
		price: 18,
		from: {
			buy: [
				['妖怪之山河童', true],
				['辉针城不良少年', true],
			],
			collect: ['辉针城碗之后'],
		},
	},
	{
		name: '芝士',
		type: '其他',
		tags: ['高级', '咸', '鲜'],
		dlc: 2,
		level: 2,
		price: 18,
		from: {
			buy: ['地灵殿地狱鸦', '命莲寺娜兹玲'],
			collect: ['地灵殿东北侧仓库'],
		},
	},
	{
		name: '柠檬',
		type: '其他',
		tags: ['果味', '酸'],
		dlc: 2,
		level: 1,
		price: 8,
		from: {
			buy: ['地灵殿地狱鸦'],
			collect: ['旧地狱桥头柠檬树'],
		},
	},
	{
		name: '地瓜',
		type: '其他',
		tags: ['饱腹'],
		dlc: 3,
		level: 1,
		price: 8,
		from: {
			buy: ['命莲寺娜兹玲'],
			collect: ['命莲寺西北花丛'],
		},
	},
	{
		name: '板栗',
		type: '蔬菜',
		tags: ['素', '家常'],
		dlc: 3,
		level: 2,
		price: 10,
		from: {
			buy: ['神灵庙道士'],
			collect: ['神灵庙中部栗树'],
		},
	},
	{
		name: '松子',
		type: '其他',
		tags: ['高级', '清淡', '招牌'],
		dlc: 3,
		level: 2,
		price: 15,
		from: {
			buy: ['神灵庙道士'],
			collect: ['神灵庙中部松树'],
		},
	},
	{
		name: '莲子',
		type: '其他',
		tags: ['清淡', '招牌', '文化底蕴'],
		dlc: 3,
		level: 3,
		price: 22,
		from: {
			collect: ['命莲寺东北并蒂莲', '神灵庙东侧并蒂莲'],
		},
	},
	{
		name: '并蒂莲',
		type: '其他',
		tags: ['高级', '传说', '清淡', '文化底蕴', '梦幻'],
		dlc: 2,
		level: 3,
		price: 36,
		from: {
			collect: ['旧地狱桥头并蒂莲', '命莲寺东北并蒂莲', '神灵庙桥头并蒂莲'],
		},
	},
	{
		name: '西红柿',
		type: '蔬菜',
		tags: ['素'],
		dlc: 4,
		level: 1,
		price: 8,
		from: {
			collect: ['太阳花田中部温室'],
		},
	},
	{
		name: '红豆',
		type: '其他',
		tags: ['家常'],
		dlc: 4,
		level: 2,
		price: 18,
		from: {
			buy: ['辉针城不良少年', '月之都月兔'],
			collect: ['辉针城东侧红豆树'],
		},
	},
	{
		name: '梅子',
		type: '其他',
		tags: ['咸', '小巧'],
		dlc: 4,
		level: 1,
		price: 12,
		from: {
			buy: ['辉针城不良少年'],
			collect: [['辉针城东侧红豆树', true]],
		},
	},
	{
		name: '鲜花',
		type: '其他',
		tags: ['适合拍照', '梦幻'],
		dlc: 4,
		level: 3,
		price: 45,
		from: {
			buy: ['辉针城不良少年'],
			collect: ['太阳花田西侧鲜花', '太阳花田中部鲜花'],
		},
	},
	{
		name: '香椿',
		type: '蔬菜',
		tags: ['素', '毒'],
		dlc: 4,
		level: 2,
		price: 20,
		from: {
			buy: ['太阳花田太阳花精'],
			collect: ['太阳花田西北香椿树'],
		},
	},
	{
		name: '薜茘',
		type: '其他',
		tags: ['凉爽', '梦幻'],
		dlc: 5,
		level: 2,
		price: 21,
		from: {
			buy: ['月之都月兔'],
		},
	},
	{
		name: '可可豆',
		type: '其他',
		tags: ['甜', '不可思议'],
		dlc: 5,
		level: 3,
		price: 22,
		from: {
			buy: [['魔界小丑', true]],
		},
	},
	{
		name: '银耳',
		type: '其他',
		tags: ['清淡', '菌类'],
		dlc: 5,
		level: 3,
		price: 14,
		from: {
			buy: ['月之都月兔'],
		},
	},
	{
		name: '西兰花',
		type: '蔬菜',
		tags: ['素', '家常'],
		dlc: 5,
		level: 2,
		price: 18,
		from: {
			buy: [['魔界小丑', true]],
		},
	},
] as const satisfies IIngredient[];
