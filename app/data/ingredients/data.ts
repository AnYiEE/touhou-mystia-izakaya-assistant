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
			buy: ['【妖怪兽道】杂货商人', '【人间之里】农户'],
			collect: [
				'【妖怪兽道】水涡（码头左下）',
				'【妖怪兽道】水涡（木桥上方左侧）',
				'【妖怪兽道】水涡（木桥上方右侧四）',
				'【人间之里】水涡（湖泊左下）',
				'【人间之里】水涡（湖泊右下）',
				'非【迷途竹林】河流',
			],
			fishing: ['人间之里', '博丽神社'],
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
			buy: [['【人间之里】香霖堂', true], '【辉针城】不良少年'],
			collect: [
				'【妖怪兽道】水涡（码头左上）',
				['【妖怪兽道】水涡（码头左下）', true],
				['【妖怪兽道】水涡（木桥上方左侧）', true],
				['【妖怪兽道】水涡（木桥上方右侧一）', true],
				'【妖怪兽道】水涡（木桥上方右侧二）',
				['【妖怪兽道】水涡（木桥上方右侧三）', true],
				['【妖怪兽道】水涡（木桥上方右侧四）', true],
				['【妖怪之山】中心瀑布', true],
				'【神灵庙】水涡（入口楼梯上方）',
				['【辉针城】水涡', true],
				['【辉针城】碗之后', true],
				'【月之都】月虹池（左下）',
				'【魔界】河流',
			],
			fishing: ['妖怪兽道', '人间之里', '魔法森林', '神灵庙', '辉针城', '月之都'],
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
			buy: ['【妖怪兽道】杂货商人', '【人间之里】农户', '【魔法森林】上海人形', '【旧地狱】鬼商'],
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
			buy: ['【妖怪兽道】杂货商人', '【人间之里】农户'],
			collect: ['【人间之里】农田'],
			fishingAdvanced: ['博丽神社'],
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
			buy: ['【妖怪兽道】杂货商人', '【人间之里】农户', '【魔法森林】上海人形'],
			collect: ['【人间之里】农田'],
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
			buy: ['【妖怪兽道】杂货商人', '【人间之里】农户', ['【人间之里】香霖堂', true], '【地灵殿】地狱鸦'],
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
			buy: ['【妖怪兽道】杂货商人', '【人间之里】农户', '【旧地狱】鬼商'],
			collect: [
				['【妖怪兽道】花丛', true],
				'【人间之里】农田',
				['【博丽神社】花丛', true],
				'【魔法森林】萝卜',
				['【妖怪之山】花丛', true],
				'【太阳花田】温室',
			],
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
			buy: ['【旧地狱】鬼商'],
			collect: [
				'【妖怪兽道】水涡（码头左上）',
				'【妖怪兽道】水涡（木桥上方右侧一）',
				['【妖怪兽道】水涡（木桥上方右侧二）', true],
				'【妖怪兽道】水涡（木桥上方右侧三）',
				['【人间之里】水涡（码头左侧）', true],
				'【妖怪之山】中心瀑布',
				['【辉针城】碗之后', true],
			],
			fishing: [
				'妖怪兽道',
				'人间之里',
				'红魔馆',
				'迷途竹林',
				'魔法森林',
				'旧地狱',
				'命莲寺',
				'神灵庙',
				'太阳花田',
				'辉针城',
				'魔界',
			],
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
			buy: ['【妖怪兽道】杂货商人', '【人间之里】农户'],
			collect: [['【妖怪之山】捕兽夹', true]],
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
			buy: ['【神灵庙】道士', ['【太阳花田】太阳花精', true]],
			collect: [
				'【妖怪兽道】露水点（南侧亭子）',
				'【妖怪兽道】露水点（小屋前方）',
				'【妖怪兽道】露水点（小屋后方）',
				'【红魔馆】露水点',
				'【魔法森林】露水点',
				'【神灵庙】露水点',
				'【太阳花田】露水点',
			],
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
			buy: [['【人间之里】香霖堂', true], '【魔法森林】上海人形', '【命莲寺】娜兹玲', '【太阳花田】太阳花精'],
			collect: [
				'【妖怪兽道】蜂巢',
				['【人间之里】银杏树', true],
				['【博丽神社】桃树', true],
				['【博丽神社】银杏树（参道西侧）', true],
				['【妖怪之山】蜂巢', true],
				'【命莲寺】蜂巢',
				'【太阳花田】蜂巢',
				'【魔界】蜂巢',
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
			collect: [
				['【妖怪兽道】蜂巢', true],
				['【妖怪兽道】露水点（南侧亭子）', true],
				['【妖怪兽道】露水点（小屋后方）', true],
				'【博丽神社】银杏树（参道西侧）',
				'【旧地狱】银杏树',
				['【太阳花田】露水点', true],
				'【魔界】银杏树',
			],
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
			buy: ['【博丽神社】妖精女仆', '【辉针城】不良少年'],
			collect: ['【妖怪兽道】捕兽夹', '【妖怪之山】捕兽夹'],
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
			buy: ['【迷途竹林】美食妖怪兔', '【神灵庙】道士'],
			collect: [
				['【妖怪兽道】捕兽夹', true],
				['【妖怪之山】捕兽夹', true],
			],
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
			buy: [['【博丽神社】妖精女仆', true], '【旧地狱】鬼商'],
			collect: [['【妖怪兽道】捕兽夹', true], ['【妖怪之山】捕兽夹', true], '【旧地狱】捕兽夹（东侧）'],
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
			buy: ['【妖怪兽道】杂货商人', '【人间之里】农户'],
			collect: ['【妖怪兽道】花丛', '【博丽神社】花丛', '【妖怪之山】花丛'],
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
			buy: [['【人间之里】香霖堂', true], '【魔法森林】上海人形', '【神灵庙】道士'],
			collect: [
				['【妖怪兽道】露水点（南侧亭子）', true],
				['【妖怪兽道】露水点（小屋前方）', true],
				['【妖怪兽道】露水点（小屋后方）', true],
				'【博丽神社】蘑菇堆',
				['【博丽神社】银杏树（东侧）', true],
				['【红魔馆】露水点', true],
				'【迷途竹林】蘑菇堆',
				'【魔法森林】蘑菇堆',
				'【地灵殿】喷泉（西侧）',
				'【太阳花田】蘑菇堆',
				'【魔界】蘑菇堆',
			],
			fishingAdvanced: ['魔法森林'],
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
			buy: ['【妖怪兽道】杂货商人', '【人间之里】农户', '【旧地狱】鬼商', '【命莲寺】娜兹玲', '【魔界】小丑'],
			collect: [['【妖怪兽道】花丛', true], ['【妖怪之山】花丛', true], '【魔界】辣椒丛'],
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
			buy: [['【妖怪兽道】杂货商人', true], '【旧地狱】鬼商', '【神灵庙】道士'],
			collect: [
				['【人间之里】水涡（湖泊左下）', true],
				['【人间之里】水涡（湖泊右下）', true],
				['【人间之里】水涡（码头左侧）', true],
				['【迷途竹林】水涡', true],
				'【妖怪之山】南侧瀑布',
				'【旧地狱】拱桥（上方）',
				'【地灵殿】喷泉（西南侧）',
				'【神灵庙】水涡（河流上方）',
				'【神灵庙】水涡（木桥西侧）',
				['【辉针城】水涡', true],
				['【辉针城】碗之后', true],
				'【月之都】月虹池（左下）',
				['非【妖怪兽道】河流', true],
			],
			fishing: [
				'妖怪兽道',
				'人间之里',
				'红魔馆',
				'迷途竹林',
				'旧地狱',
				'地灵殿',
				'命莲寺',
				'神灵庙',
				'太阳花田',
				'辉针城',
				'月之都',
			],
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
			buy: [['【妖怪兽道】杂货商人', true], ['【人间之里】香霖堂', true], '【旧地狱】鬼商'],
			collect: ['【迷途竹林】竹笋堆', ['【迷途竹林】竹子', true], '【辉针城】竹笋堆', ['【辉针城】竹子', true]],
			fishingAdvanced: ['命莲寺'],
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
			buy: ['【红魔馆】地精商人', '【魔法森林】上海人形'],
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
			collect: [
				['【人间之里】水涡（湖泊左下）', true],
				['【人间之里】水涡（湖泊右下）', true],
				['【人间之里】水涡（码头左侧）', true],
				'【红魔馆】水涡（河流左侧）',
				['【迷途竹林】水涡', true],
				['【妖怪之山】西北瀑布', true],
				'【命莲寺】莲花池（中部右）',
				'【神灵庙】水涡（拱桥上方）',
				'【神灵庙】水涡（河流上方）',
				['非【妖怪兽道】河流', true],
			],
			fishing: ['妖怪兽道', '迷途竹林', '太阳花田', '辉针城', '月之都'],
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
			buy: ['【神灵庙】道士'],
			collect: [
				'【人间之里】水涡（码头左侧）',
				'【红魔馆】水涡（河流右侧）',
				['【迷途竹林】水涡', true],
				['【妖怪之山】南侧瀑布', true],
				['【地灵殿】喷泉（西南侧）', true],
				'【神灵庙】水涡（东侧）',
				'【神灵庙】水涡（入口楼梯下方）',
				['【辉针城】碗之后', true],
				['非【妖怪兽道】河流', true],
			],
			fishing: ['迷途竹林', '妖怪之山', '旧地狱', '地灵殿', '命莲寺', '太阳花田'],
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
			buy: ['【魔法森林】上海人形', '【地灵殿】地狱鸦'],
			collect: [
				'【人间之里】银杏树',
				'【博丽神社】银杏树（东侧）',
				'【魔法森林】银杏树',
				'【妖怪之山】蜂巢',
				'【地灵殿】喷泉（东北侧）',
				'【太阳花田】银杏树',
			],
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
				'【妖怪兽道】东侧山丘（需借道博丽神社）',
				'【地灵殿】喷泉（西侧）',
				'【地灵殿】游乐场',
				'【命莲寺】花丛（西南侧）',
			],
			fishingAdvanced: ['旧地狱', '太阳花田', '魔界'],
			task: ['阿求小姐的色纸'],
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
			buy: [['【人间之里】香霖堂', true], '【迷途竹林】美食妖怪兔', '【魔法森林】上海人形'],
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
			buy: [['【博丽神社】妖精女仆', true], '【魔法森林】上海人形', '【神灵庙】道士', '【辉针城】不良少年'],
			collect: [
				['【博丽神社】蘑菇堆', true],
				['【红魔馆】露水点', true],
				['【迷途竹林】蘑菇堆', true],
				['【地灵殿】喷泉（西侧）', true],
			],
			fishingAdvanced: ['红魔馆', '魔法森林'],
			task: ['阿求小姐的色纸'],
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
			buy: [['【人间之里】香霖堂', true], '【月之都】月兔'],
			collect: [['【迷途竹林】竹笋堆', true], '【迷途竹林】竹子', '【辉针城】竹子'],
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
			buy: [['【人间之里】香霖堂', true], '【月之都】月兔'],
			collect: ['【博丽神社】桃树', '【魔法森林】桃子', '【太阳花田】桃树', '【月之都】桃树'],
			fishingAdvanced: ['地灵殿', '神灵庙'],
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
			buy: ['【红魔馆】地精商人', '【地灵殿】地狱鸦'],
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
			buy: [['【迷途竹林】美食妖怪兔', true], '【地灵殿】地狱鸦'],
			collect: [
				'【妖怪兽道】南侧亭子（需借道迷途竹林）',
				['【地灵殿】喷泉（东侧）', true],
				['【地灵殿】游乐场', true],
				'【太阳花田】月光草',
				'【辉针城】月光草',
			],
			fishingAdvanced: ['红魔馆', '地灵殿'],
			task: ['阿求小姐的色纸'],
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
			buy: [['【博丽神社】妖精女仆', true], '【红魔馆】地精商人', '【迷途竹林】美食妖怪兔'],
			collect: [
				['【红魔馆】水涡（河流右侧）', true],
				'【迷途竹林】水涡',
				['【妖怪之山】南侧瀑布', true],
				['【辉针城】水涡', true],
				['【辉针城】碗之后', true],
			],
			fishing: ['红魔馆', '迷途竹林', '旧地狱', '命莲寺', '神灵庙', '太阳花田', '月之都', '魔界'],
			task: ['阿求小姐的色纸'],
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
			buy: ['【博丽神社】妖精女仆', '【红魔馆】地精商人', '【迷途竹林】美食妖怪兔', '【神灵庙】道士'],
			collect: ['【旧地狱】捕兽夹（中部）'],
			fishingAdvanced: ['月之都'],
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
			buy: [['【博丽神社】妖精女仆', true], '【红魔馆】地精商人', '【迷途竹林】美食妖怪兔', '【神灵庙】道士'],
			collect: [['【红魔馆】水涡（河流左侧）', true], '【地灵殿】喷泉（东南侧）'],
			fishing: ['人间之里', '红魔馆', '魔法森林', '妖怪之山', '地灵殿', '魔界'],
			task: ['阿求小姐的色纸'],
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
			buy: [['【人间之里】香霖堂', true]],
			collect: ['【红魔馆】冰块堆', '【神灵庙】冰块堆'],
			fishingAdvanced: ['红魔馆', '魔界'],
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
				['【魔法森林】上海人形', true],
				['【地灵殿】地狱鸦', true],
			],
			collect: ['【红魔馆】葡萄架', '【太阳花田】葡萄架'],
			fishingAdvanced: ['命莲寺'],
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
			buy: [
				'【妖怪兽道】杂货商人',
				'【人间之里】农户',
				['【人间之里】香霖堂', true],
				'【魔法森林】上海人形',
				'【魔界】小丑',
			],
			collect: ['【人间之里】鸡窝', '【旧地狱】鸡窝'],
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
			collect: [
				'【旧地狱】拱桥（下方）',
				'【命莲寺】莲花池（左侧）',
				'【神灵庙】拱桥（下方）',
				'【月之都】月虹池（右下）',
			],
			fishingAdvanced: ['命莲寺', '神灵庙'],
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
			buy: [['【妖怪之山】河童商人', true]],
			collect: [['【辉针城】碗之后', true], '【魔界】河流'],
			fishing: ['妖怪之山'],
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
				['【妖怪之山】河童商人', true],
				['【辉针城】不良少年', true],
			],
			collect: ['【辉针城】碗之后'],
			fishingAdvanced: ['妖怪之山'],
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
				['【妖怪之山】河童商人', true],
				['【辉针城】不良少年', true],
			],
			collect: ['【妖怪之山】西北瀑布', ['【辉针城】碗之后', true], '【魔界】河流'],
			fishing: ['妖怪之山'],
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
				['【妖怪之山】河童商人', true],
				['【太阳花田】太阳花精', true],
			],
			collect: ['【妖怪之山】黄瓜堆'],
			fishingAdvanced: ['妖怪之山'],
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
			buy: [['【妖怪之山】河童商人', true], '【命莲寺】娜兹玲'],
			collect: ['【妖怪之山】黑盐'],
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
			buy: [['【魔法森林】上海人形', true], '【命莲寺】娜兹玲', '【太阳花田】太阳花精', '【魔界】小丑'],
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
			buy: ['【地灵殿】地狱鸦', '【命莲寺】娜兹玲'],
			collect: ['【地灵殿】仓库'],
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
			buy: ['【地灵殿】地狱鸦'],
			collect: ['【旧地狱】柠檬树'],
			fishingAdvanced: ['旧地狱'],
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
			buy: ['【命莲寺】娜兹玲'],
			collect: ['【命莲寺】花丛（西北侧）'],
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
			collect: [
				'【命莲寺】莲花池（右侧）',
				'【命莲寺】莲花池（中部左）',
				'【神灵庙】西南侧莲花',
				'【月之都】月虹池（右下）',
			],
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
			buy: ['【神灵庙】道士'],
			collect: ['【神灵庙】中部栗树'],
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
			buy: ['【神灵庙】道士'],
			collect: ['【神灵庙】中部松树'],
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
			buy: ['【辉针城】不良少年', '【月之都】月兔'],
			collect: ['【辉针城】红豆树'],
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
			buy: ['【辉针城】不良少年'],
			collect: [['【辉针城】红豆树', true]],
			fishingAdvanced: ['辉针城'],
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
			buy: ['【太阳花田】太阳花精'],
			collect: ['【太阳花田】西北香椿树'],
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
			collect: ['【太阳花田】花丛（西侧）', '【太阳花田】花丛（中部）', '【魔界】东南侧花丛'],
			fishingAdvanced: ['太阳花田'],
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
			collect: ['【太阳花田】中部温室'],
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
			buy: ['【魔界】蓬松松爱莲♡魔法店', ['【魔界】小丑', true]],
			collect: ['【魔界】西南侧迷宫'],
			fishing: ['魔界'],
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
			buy: ['【魔界】蓬松松爱莲♡魔法店', ['【魔界】小丑', true]],
			collect: ['【魔界】东侧'],
			fishing: ['魔界'],
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
			buy: [['【月之都】月兔', true], '【魔界】蓬松松爱莲♡魔法店'],
			collect: ['【月之都】月虹池（左上）'],
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
			buy: [['【月之都】月兔', true], '【魔界】蓬松松爱莲♡魔法店'],
			collect: ['【月之都】月虹池（左上）'],
			fishing: ['月之都'],
		},
	},
	{
		name: '强效辣椒素',
		type: '其他',
		tags: ['天罚'],
		dlc: 5,
		level: 5,
		price: 0,
		from: {
			task: ['月都试炼'],
		},
	},
	{
		name: '噗噗哟果',
		type: '其他',
		tags: ['天罚'],
		dlc: 5,
		level: 5,
		price: 10,
		from: {
			task: ['最终收网行动'],
		},
	},
	{
		name: '铃仙',
		type: '其他',
		tags: ['招牌', '适合拍照', '不可思议', '特产'],
		dlc: 0,
		level: 10,
		price: 530000,
		from: {
			buy: [['【因幡帝】“强买强卖”商店', true]],
		},
	},
] as const satisfies IIngredient[];
