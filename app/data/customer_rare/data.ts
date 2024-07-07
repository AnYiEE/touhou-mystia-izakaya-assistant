/* eslint-disable sort-keys */
import type {ICustomerRare} from './types';

export const CUSTOMER_RARE_LIST = [
	{
		name: '莉格露',
		dlc: 0,
		places: ['妖怪兽道', '魔法森林', '太阳花田'],
		price: '200-400',
		positiveTags: ['肉', '甜', '生', '猎奇'],
		negativeTags: ['素', '清淡', '凉爽'],
		beverageTags: ['低酒精', '可加冰'],
	},
	{
		name: '露米娅',
		dlc: 0,
		places: ['妖怪兽道', '魔法森林'],
		price: '150-350',
		positiveTags: ['肉', '饱腹', '生', '招牌', '猎奇', '流行喜爱'],
		negativeTags: ['下酒', '昂贵', '流行厌恶'],
		beverageTags: ['苦', '气泡'],
	},
	{
		name: '橙',
		dlc: 0,
		places: ['妖怪兽道'],
		price: '400-600',
		positiveTags: ['肉', '水产', '重油', '甜', '烧烤', '流行喜爱'],
		negativeTags: ['素', '灼热', '猎奇', '流行厌恶'],
		beverageTags: ['水果', '辛'],
	},
	{
		name: '上白泽慧音',
		dlc: 0,
		places: ['人间之里', '魔法森林', '命莲寺'],
		price: '400-800',
		positiveTags: ['素', '家常', '清淡', '和风', '中华', '文化底蕴', '流行喜爱'],
		negativeTags: ['重油', '咸', '大份', '流行厌恶'],
		beverageTags: ['烧酒', '清酒', '利口酒'],
	},
	{
		name: '稗田阿求',
		dlc: 0,
		places: ['人间之里', '命莲寺'],
		price: '500-800',
		positiveTags: ['高级', '清淡', '和风', '甜', '文化底蕴', '汤羹', '流行喜爱'],
		negativeTags: ['重油', '咸', '灼热', '流行厌恶'],
		beverageTags: ['可加热', '清酒'],
	},
	{
		name: '茨木华扇',
		dlc: 0,
		places: ['人间之里', '旧地狱', '神灵庙'],
		price: '400-600',
		positiveTags: ['家常', '下酒', '和风', '文化底蕴'],
		negativeTags: ['生', '辣', '实惠'],
		beverageTags: ['中酒精', '直饮', '古典'],
	},
	{
		name: '博丽灵梦',
		dlc: 0,
		places: ['妖怪兽道', '人间之里', '博丽神社', '妖怪之山', '魔法森林'],
		price: '150-300',
		positiveTags: ['高级', '饱腹', '甜', '不可思议', '实惠', '流行喜爱'],
		negativeTags: ['下酒', '昂贵', '流行厌恶'],
		beverageTags: ['无酒精', '低酒精', '可加热'],
	},
	{
		name: '伊吹萃香',
		dlc: 0,
		places: ['博丽神社', '妖怪之山', '辉针城'],
		price: '600-800',
		positiveTags: ['肉', '下酒', '和风', '力量涌现', '小巧', '流行喜爱'],
		negativeTags: ['重油', '流行厌恶'],
		beverageTags: ['高酒精', '直饮'],
	},
	{
		name: '比那名居天子',
		dlc: 0,
		places: ['博丽神社', '妖怪之山', '旧地狱', '神灵庙', '太阳花田'],
		price: '2000-3000',
		positiveTags: ['素', '传说', '清淡', '甜', '适合拍照', '果味', '昂贵', '流行厌恶'],
		negativeTags: ['肉', '家常', '重油', '流行喜爱'],
		beverageTags: ['高酒精', '鸡尾酒'],
	},
	{
		name: '红美铃',
		dlc: 0,
		places: ['红魔馆'],
		price: '200-400',
		positiveTags: ['肉', '饱腹', '中华', '力量涌现', '流行喜爱'],
		negativeTags: ['西式', '猎奇', '果味', '流行厌恶'],
		beverageTags: ['可加热', '古典', '提神'],
	},
	{
		name: '琪露诺',
		dlc: 0,
		places: ['红魔馆', '妖怪之山'],
		price: '100-200',
		positiveTags: ['甜', '适合拍照', '凉爽', '猎奇', '流行厌恶'],
		negativeTags: ['下酒', '文化底蕴', '昂贵', '流行喜爱'],
		beverageTags: ['可加冰', '水果', '甘'],
	},
	{
		name: '帕秋莉',
		dlc: 0,
		places: ['红魔馆', '魔法森林', '地灵殿'],
		price: '600-1000',
		positiveTags: ['高级', '西式', '甜', '适合拍照', '梦幻'],
		negativeTags: ['咸', '生', '灼热', '猎奇'],
		beverageTags: ['鸡尾酒', '利口酒', '气泡'],
	},
	{
		name: '藤原妹红',
		dlc: 0,
		places: ['妖怪兽道', '迷途竹林'],
		price: '300-600',
		positiveTags: ['灼热', '果味', '烧烤', '燃起来了', '辣'],
		negativeTags: ['高级', '不可思议', '昂贵'],
		beverageTags: ['烧酒', '辛', '苦'],
	},
	{
		name: '蓬莱山辉夜',
		dlc: 0,
		places: ['迷途竹林', '辉针城'],
		price: '1000-1500',
		positiveTags: ['传说', '和风', '文化底蕴', '不可思议', '流行喜爱'],
		negativeTags: ['招牌', '猎奇', '大份', '流行厌恶'],
		beverageTags: ['清酒', '古典', '现代'],
	},
	{
		name: '因幡帝',
		dlc: 0,
		places: ['迷途竹林'],
		price: '200-400',
		positiveTags: ['传说', '甜', '凉爽', '小巧', '梦幻', '流行喜爱'],
		negativeTags: ['重油', '山珍', '猎奇', '流行厌恶'],
		beverageTags: ['无酒精', '水果', '甘'],
	},
	{
		name: '河城荷取',
		dlc: 1,
		places: ['妖怪之山'],
		price: '400-500',
		positiveTags: ['水产', '高级', '下酒', '咸', '招牌', '猎奇'],
		negativeTags: ['素', '山珍', '文化底蕴'],
		beverageTags: ['中酒精', '高酒精', '清酒', '直饮'],
	},
	{
		name: '犬走椛',
		dlc: 1,
		places: ['妖怪之山'],
		price: '300-400',
		positiveTags: ['肉', '重油', '下酒', '山珍', '大份'],
		negativeTags: ['素', '清淡', '猎奇'],
		beverageTags: ['中酒精', '高酒精', '直饮'],
	},
	{
		name: '东风谷早苗',
		dlc: 1,
		places: ['妖怪之山', '魔法森林', '命莲寺', '神灵庙'],
		price: '400-600',
		positiveTags: ['家常', '和风', '甜', '适合拍照', '梦幻', '流行喜爱'],
		negativeTags: ['重油', '生', '灼热', '猎奇', '流行厌恶'],
		beverageTags: ['无酒精', '低酒精', '清酒', '直饮', '水果', '甘', '苦', '气泡', '现代'],
	},
	{
		name: '爱丽丝',
		dlc: 1,
		places: ['魔法森林', '太阳花田'],
		price: '500-800',
		positiveTags: ['家常', '高级', '西式', '甜', '文化底蕴'],
		negativeTags: ['肉', '重油', '饱腹', '猎奇'],
		beverageTags: ['低酒精', '西洋酒', '现代'],
	},
	{
		name: '雾雨魔理沙',
		dlc: 1,
		places: [
			'妖怪兽道',
			'人间之里',
			'博丽神社',
			'红魔馆',
			'迷途竹林',
			'妖怪之山',
			'魔法森林',
			'旧地狱',
			'地灵殿',
			'命莲寺',
			'神灵庙',
			'辉针城',
			'太阳花田',
		],
		price: '3000-5000',
		positiveTags: ['传说', '重油', '和风', '灼热', '菌类', '流行喜爱'],
		negativeTags: ['猎奇', '流行厌恶'],
		beverageTags: ['低酒精', '可加冰'],
	},
	{
		name: '矢田寺成美',
		dlc: 1,
		places: ['魔法森林', '命莲寺'],
		price: '300-600',
		positiveTags: ['清淡', '山珍', '和风', '文化底蕴', '特产'],
		negativeTags: ['重油', '饱腹'],
		beverageTags: ['低酒精', '中酒精', '可加冰', '直饮', '古典'],
	},
	{
		name: '黑谷山女',
		dlc: 2,
		places: ['妖怪兽道', '红魔馆', '妖怪之山', '魔法森林', '旧地狱'],
		price: '250-400',
		positiveTags: ['鲜', '甜', '生', '适合拍照', '猎奇', '流行喜爱'],
		negativeTags: ['重油', '咸', '灼热'],
		beverageTags: ['低酒精', '中酒精', '啤酒', '甘'],
	},
	{
		name: '水桥帕露西',
		dlc: 2,
		places: ['旧地狱'],
		price: '300-400',
		positiveTags: ['肉', '咸', '鲜', '果味', '辣', '酸', '流行厌恶'],
		negativeTags: ['甜'],
		beverageTags: ['无酒精', '可加热', '直饮', '辛', '苦'],
	},
	{
		name: '星熊勇仪',
		dlc: 2,
		places: ['博丽神社', '妖怪之山', '旧地狱', '地灵殿'],
		price: '600-1000',
		positiveTags: ['传说', '下酒', '和风', '招牌', '力量涌现', '燃起来了', '大份', '流行喜爱'],
		negativeTags: ['素', '猎奇', '小巧'],
		beverageTags: ['高酒精', '清酒', '啤酒', '古典'],
	},
	{
		name: '火焰猫燐',
		dlc: 2,
		places: ['人间之里', '博丽神社', '妖怪之山', '旧地狱', '地灵殿', '命莲寺', '神灵庙'],
		price: '500-700',
		positiveTags: ['水产', '海味', '鲜', '甜', '猎奇', '梦幻', '流行喜爱'],
		negativeTags: ['生', '灼热'],
		beverageTags: ['低酒精', '清酒', '水果'],
	},
	{
		name: '灵乌路空',
		dlc: 2,
		places: ['妖怪之山', '地灵殿'],
		price: '500-800',
		positiveTags: ['肉', '重油', '咸', '灼热', '力量涌现', '辣'],
		negativeTags: ['清淡', '菌类'],
		beverageTags: ['中酒精', '可加热', '鸡尾酒'],
	},
	{
		name: '古明地觉',
		dlc: 2,
		places: ['人间之里', '博丽神社', '红魔馆', '迷途竹林', '魔法森林', '地灵殿'],
		price: '500-600',
		positiveTags: ['家常', '甜', '力量涌现', '小巧', '梦幻', '特产'],
		negativeTags: ['肉', '山珍', '灼热', '猎奇', '大份'],
		beverageTags: ['无酒精', '苦', '气泡', '提神'],
	},
	{
		name: '多多良小伞',
		dlc: 3,
		places: ['命莲寺', '辉针城'],
		price: '150-300',
		positiveTags: ['家常', '饱腹', '甜', '适合拍照', '力量涌现', '猎奇', '不可思议', '流行喜爱'],
		negativeTags: ['灼热', '汤羹', '辣'],
		beverageTags: ['中酒精', '可加冰', '水果', '古典'],
	},
	{
		name: '村莎水蜜',
		dlc: 3,
		places: ['命莲寺'],
		price: '400-600',
		positiveTags: ['肉', '高级', '饱腹', '咸', '鲜', '力量涌现', '特产'],
		negativeTags: ['素', '猎奇', '小巧', '酸'],
		beverageTags: ['高酒精', '可加冰', '西洋酒', '辛'],
	},
	{
		name: '封兽鵺',
		dlc: 3,
		places: ['命莲寺', '辉针城'],
		price: '300-500',
		positiveTags: ['肉', '鲜', '生', '招牌', '适合拍照', '猎奇', '不可思议', '特产', '流行厌恶'],
		negativeTags: ['西式', '酸', '流行喜爱'],
		beverageTags: ['可加热', '烧酒', '直饮', '古典'],
	},
	{
		name: '物布部都',
		dlc: 3,
		places: ['神灵庙'],
		price: '600-900',
		positiveTags: ['高级', '传说', '清淡', '山珍', '和风', '燃起来了', '流行喜爱'],
		negativeTags: ['西式', '生', '流行厌恶'],
		beverageTags: ['中酒精', '可加热', '直饮', '气泡'],
	},
	{
		name: '霍青娥',
		dlc: 3,
		places: ['神灵庙'],
		price: '400-900',
		positiveTags: ['素', '传说', '中华', '甜', '不可思议', '小巧', '特产', '流行喜爱'],
		negativeTags: ['重油', '饱腹'],
		beverageTags: ['低酒精', '清酒', '水果', '现代'],
	},
	{
		name: '苏我屠自古',
		dlc: 3,
		places: ['神灵庙'],
		price: '500-600',
		positiveTags: ['家常', '重油', '饱腹', '和风', '招牌', '力量涌现', '烧烤'],
		negativeTags: ['甜', '凉爽'],
		beverageTags: ['高酒精', '烧酒', '啤酒', '苦'],
	},
	{
		name: '少名针妙丸',
		dlc: 4,
		places: ['辉针城'],
		price: '600-1200',
		positiveTags: ['传说', '和风', '甜', '适合拍照', '文化底蕴', '小巧', '燃起来了', '流行喜爱'],
		negativeTags: ['西式', '大份'],
		beverageTags: ['低酒精', '可加热', '气泡', '古典'],
	},
	{
		name: '鬼人正邪',
		dlc: 4,
		places: ['辉针城'],
		price: '300-600',
		positiveTags: ['重油', '下酒', '灼热', '力量涌现', '猎奇', '不可思议', '燃起来了', '流行厌恶'],
		negativeTags: ['高级', '流行喜爱'],
		beverageTags: ['中酒精', '烧酒', '直饮', '辛'],
	},
	{
		name: '今泉影狼',
		dlc: 4,
		places: ['迷途竹林', '辉针城'],
		price: '300-600',
		positiveTags: ['肉', '家常', '山珍', '和风', '适合拍照', '凉爽', '流行喜爱'],
		negativeTags: ['灼热'],
		beverageTags: ['中酒精', '可加冰', '清酒', '直饮'],
	},
	{
		name: '射命丸文',
		dlc: 4,
		places: [
			'妖怪兽道',
			'人间之里',
			'博丽神社',
			'红魔馆',
			'迷途竹林',
			'妖怪之山',
			'魔法森林',
			'旧地狱',
			'地灵殿',
			'命莲寺',
			'神灵庙',
			'辉针城',
			'太阳花田',
		],
		price: '500-600',
		positiveTags: ['肉', '家常', '下酒', '和风', '招牌', '适合拍照', '流行喜爱'],
		negativeTags: ['西式', '流行厌恶'],
		beverageTags: ['高酒精', '可加冰', '烧酒', '提神'],
	},
	{
		name: '风见幽香',
		dlc: 4,
		places: ['太阳花田'],
		price: '1200-1800',
		positiveTags: ['高级', '传说', '清淡', '西式', '不可思议', '梦幻', '特产', '流行喜爱'],
		negativeTags: ['饱腹', '和风', '咸', '灼热'],
		beverageTags: ['鸡尾酒', '西洋酒', '利口酒', '现代'],
	},
	{
		name: '梅蒂欣',
		dlc: 4,
		places: ['太阳花田'],
		price: '200-400',
		positiveTags: ['甜', '招牌', '适合拍照', '凉爽', '菌类', '小巧', '梦幻', '毒'],
		negativeTags: ['文化底蕴'],
		beverageTags: ['无酒精', '水果', '甘', '苦'],
	},
	{
		name: '魅魔',
		dlc: 5,
		places: ['魔界'],
		price: '2000-3000',
		positiveTags: ['水产', '山珍', '鲜', '生', '力量涌现', '猎奇', '菌类'],
		negativeTags: ['高级', '清淡'],
		beverageTags: ['高酒精', '可加冰', '烧酒', '西洋酒', '辛'],
	},
	{
		name: '露易兹',
		dlc: 5,
		places: [
			'妖怪兽道',
			'人间之里',
			'博丽神社',
			'红魔馆',
			'迷途竹林',
			'妖怪之山',
			'魔法森林',
			'旧地狱',
			'地灵殿',
			'命莲寺',
			'神灵庙',
			'辉针城',
			'太阳花田',
			'魔界',
		],
		price: '800-1000',
		positiveTags: ['水产', '西式', '甜', '适合拍照', '小巧', '特产', '流行喜爱'],
		negativeTags: ['重油', '饱腹'],
		beverageTags: ['中酒精', '可加冰', '鸡尾酒', '啤酒', '现代'],
	},
	{
		name: '爱莲',
		dlc: 5,
		places: ['魔界'],
		price: '300-500',
		positiveTags: ['家常', '饱腹', '西式', '甜', '凉爽', '梦幻', '流行喜爱'],
		negativeTags: ['水产', '重油', '生'],
		beverageTags: ['低酒精', '可加热', '啤酒', '甘', '古典'],
	},
	{
		name: '铃仙',
		dlc: 5,
		places: ['月之都'],
		price: '200-350',
		positiveTags: ['家常', '山珍', '海味', '中华', '甜', '小巧', '特产'],
		negativeTags: ['不可思议', '昂贵'],
		beverageTags: ['高酒精', '可加热', '烧酒', '啤酒', '苦'],
	},
	{
		name: '绵月丰姬',
		dlc: 5,
		places: ['月之都'],
		price: '1200-1500',
		positiveTags: ['素', '高级', '和风', '甜', '凉爽', '文化底蕴', '果味', '流行喜爱'],
		negativeTags: ['山珍', '咸', '力量涌现'],
		beverageTags: ['高酒精', '可加冰', '清酒', '水果', '古典'],
	},
	{
		name: '绵月依姬',
		dlc: 5,
		places: ['月之都'],
		price: '1000-1200',
		positiveTags: ['高级', '传说', '清淡', '中华', '灼热', '力量涌现', '文化底蕴', '小巧'],
		negativeTags: ['山珍', '菌类'],
		beverageTags: ['可加热', '烧酒', '直饮', '辛', '提神'],
	},
	{
		name: '森近霖之助',
		dlc: 0,
		places: ['人间之里', '太阳花田'],
		price: '250-400',
		positiveTags: ['家常', '饱腹', '鲜', '流行喜爱'],
		negativeTags: ['重油', '下酒', '猎奇', '流行厌恶'],
		beverageTags: ['烧酒', '啤酒'],
	},
	{
		name: '蕾米莉亚',
		dlc: 4,
		places: ['博丽神社', '红魔馆'],
		price: '4950-5000',
		positiveTags: ['高级', '传说', '西式', '甜', '生', '流行喜爱'],
		negativeTags: ['咸', '辣', '酸', '实惠'],
		beverageTags: ['高酒精', '西洋酒', '水果', '甘', '古典'],
	},
	{
		name: '魂魄妖梦',
		dlc: 0,
		places: ['妖怪兽道', '人间之里', '博丽神社', '迷途竹林'],
		price: '300-400',
		positiveTags: ['家常', '清淡', '鲜', '力量涌现'],
		negativeTags: ['重油', '咸', '猎奇'],
		beverageTags: ['无酒精', '可加热', '水果'],
	},
	{
		name: '西行寺幽幽子',
		dlc: 0,
		places: ['博丽神社', '红魔馆', '迷途竹林', '神灵庙'],
		price: '1500-2000',
		positiveTags: ['肉', '水产', '高级', '传说', '饱腹', '和风', '中华', '大份'],
		negativeTags: ['素', '清淡', '小巧'],
		beverageTags: ['高酒精', '可加冰', '鸡尾酒'],
	},
	{
		name: '冴月麟',
		dlc: 0,
		places: ['妖怪兽道', '人间之里', '博丽神社', '红魔馆', '迷途竹林'],
		price: '400-600',
		positiveTags: ['水产', '家常', '中华', '辣', '流行喜爱'],
		negativeTags: ['重油', '下酒', '生', '流行厌恶'],
		beverageTags: ['无酒精', '甘', '气泡'],
	},
	{
		name: '立空汐',
		dlc: 0,
		places: ['妖怪兽道', '博丽神社', '红魔馆', '迷途竹林', '妖怪之山'],
		price: '500-800',
		positiveTags: ['肉', '下酒', '山珍', '和风', '力量涌现', '昂贵', '流行厌恶'],
		negativeTags: ['素', '清淡', '流行喜爱'],
		beverageTags: ['高酒精', '可加冰', '可加热'],
	},
	{
		name: '时焉侑',
		dlc: 0,
		places: ['人间之里', '博丽神社'],
		price: '1300-1800',
		positiveTags: ['传说', '下酒', '西式', '中华', '文化底蕴', '特产'],
		negativeTags: ['水产', '重油', '饱腹'],
		beverageTags: ['中酒精', '可加冰', '鸡尾酒', '西洋酒'],
	},
	{
		name: '饕餮尤魔',
		dlc: 1,
		places: [
			'妖怪兽道',
			'博丽神社',
			'红魔馆',
			'迷途竹林',
			'妖怪之山',
			'魔法森林',
			'旧地狱',
			'地灵殿',
			'命莲寺',
			'神灵庙',
			'辉针城',
			'太阳花田',
		],
		price: '9999-9999',
		positiveTags: ['肉', '高级', '传说', '饱腹', '鲜', '生', '力量涌现', '不可思议', '大份'],
		negativeTags: [],
		beverageTags: ['高酒精', '烧酒', '直饮', '辛'],
	},
	{
		name: '古明地恋',
		dlc: 2,
		places: [
			'妖怪兽道',
			'人间之里',
			'博丽神社',
			'红魔馆',
			'迷途竹林',
			'妖怪之山',
			'魔法森林',
			'旧地狱',
			'地灵殿',
			'命莲寺',
			'神灵庙',
			'辉针城',
			'太阳花田',
		],
		price: '500-600',
		positiveTags: ['咸', '甜', '生', '猎奇', '不可思议', '梦幻'],
		negativeTags: [],
		beverageTags: ['高酒精', '烧酒', '苦', '气泡'],
	},
	{
		name: '二岩猯藏',
		dlc: 3,
		places: ['妖怪兽道', '人间之里', '博丽神社', '命莲寺', '神灵庙'],
		price: '1000-1200',
		positiveTags: ['肉', '水产', '家常', '传说', '下酒', '和风', '果味', '流行喜爱'],
		negativeTags: ['灼热', '辣'],
		beverageTags: ['高酒精', '可加热', '烧酒', '古典'],
	},
	{
		name: '八云紫',
		dlc: 5,
		places: [
			'妖怪兽道',
			'人间之里',
			'红魔馆',
			'迷途竹林',
			'妖怪之山',
			'魔法森林',
			'旧地狱',
			'地灵殿',
			'命莲寺',
			'神灵庙',
			'辉针城',
			'太阳花田',
			'月之都',
			'魔界',
		],
		price: '4000-6000',
		positiveTags: ['家常', '高级', '传说', '适合拍照', '凉爽', '猎奇', '汤羹'],
		negativeTags: ['饱腹', '菌类'],
		beverageTags: ['中酒精', '高酒精', '烧酒', '古典'],
	},
] as const satisfies ICustomerRare[];
