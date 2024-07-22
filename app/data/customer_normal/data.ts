/* eslint-disable sort-keys */
import type {ICustomerNormal} from './types';

export const CUSTOMER_NORMAL_LIST = [
	{
		name: '妖怪兔',
		dlc: 0,
		places: ['妖怪兽道', '红魔馆', '迷途竹林', '妖怪之山', '魔法森林', '地灵殿'],
		positiveTags: ['家常', '咸', '鲜', '甜', '招牌', '凉爽', '力量涌现', '果味', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['无酒精'],
	},
	{
		name: '妖怪猫',
		dlc: 0,
		places: ['妖怪兽道', '博丽神社', '红魔馆', '迷途竹林', '妖怪之山', '魔法森林', '地灵殿'],
		positiveTags: ['肉', '海味', '中华', '招牌', '凉爽', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['可加冰', '啤酒', '苦'],
	},
	{
		name: '妖怪狸',
		dlc: 0,
		places: ['妖怪兽道', '博丽神社', '红魔馆', '迷途竹林', '妖怪之山', '魔法森林', '命莲寺'],
		positiveTags: ['肉', '重油', '饱腹', '山珍', '咸', '招牌', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['甘', '辛'],
	},
	{
		name: '妖怪狐',
		dlc: 0,
		places: ['妖怪兽道', '红魔馆', '迷途竹林', '妖怪之山', '旧地狱'],
		positiveTags: ['肉', '和风', '中华', '招牌', '小巧', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['直饮'],
	},
	{
		name: '蟒蛇精',
		dlc: 0,
		places: ['妖怪兽道', '妖怪之山', '旧地狱'],
		positiveTags: ['肉', '下酒', '山珍', '力量涌现', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['烧酒', '清酒'],
	},
	{
		name: '人类小孩',
		dlc: 0,
		places: ['人间之里'],
		positiveTags: ['肉', '家常', '饱腹', '中华', '咸', '甜', '招牌', '凉爽', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['无酒精'],
	},
	{
		name: '人类男性',
		dlc: 0,
		places: ['人间之里', '命莲寺', '神灵庙'],
		positiveTags: ['肉', '下酒', '和风', '咸', '鲜', '灼热', '文化底蕴', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['可加热', '烧酒'],
	},
	{
		name: '人类女性',
		dlc: 0,
		places: ['人间之里', '博丽神社', '命莲寺', '神灵庙'],
		positiveTags: ['水产', '高级', '咸', '鲜', '招牌', '凉爽', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['可加冰'],
	},
	{
		name: '人类长者',
		dlc: 0,
		places: ['人间之里', '博丽神社', '神灵庙'],
		positiveTags: ['高级', '招牌', '适合拍照', '灼热', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['低酒精'],
	},
	{
		name: '左卫门',
		dlc: 0,
		places: ['人间之里', '博丽神社'],
		positiveTags: ['高级', '生', '力量涌现', '猎奇', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['高酒精'],
	},
	{
		name: '座敷童子',
		dlc: 0,
		places: ['博丽神社'],
		positiveTags: ['山珍', '和风', '甜', '生', '招牌', '凉爽', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['无酒精', '低酒精'],
	},
	{
		name: '河童',
		dlc: 0,
		places: ['博丽神社', '红魔馆', '妖怪之山', '魔法森林'],
		positiveTags: ['高级', '海味', '招牌', '灼热', '猎奇', '小巧', '大份', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['甘'],
	},
	{
		name: '地精',
		dlc: 0,
		places: [],
		positiveTags: ['高级', '重油', '山珍', '凉爽', '灼热', '力量涌现', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['清酒', '西洋酒'],
	},
	{
		name: '鸦天狗',
		dlc: 0,
		places: ['博丽神社', '红魔馆', '迷途竹林', '妖怪之山'],
		positiveTags: ['高级', '招牌', '适合拍照', '菌类', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['烧酒', '清酒'],
	},
	{
		name: '妖精',
		dlc: 0,
		places: ['红魔馆', '迷途竹林', '魔法森林'],
		positiveTags: ['鲜', '甜', '适合拍照', '菌类', '梦幻', '特产', '果味', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['直饮', '水果', '甘', '气泡'],
	},
	{
		name: '白狼天狗',
		dlc: 1,
		places: ['妖怪之山'],
		positiveTags: ['肉', '重油', '饱腹', '山珍', '咸', '鲜', '生', '招牌', '特产', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['中酒精', '高酒精', '烧酒', '清酒'],
	},
	{
		name: '山姥',
		dlc: 1,
		places: ['妖怪之山'],
		positiveTags: ['肉', '家常', '高级', '饱腹', '鲜', '力量涌现', '猎奇', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['高酒精', '烧酒', '直饮', '古典'],
	},
	{
		name: '山童',
		dlc: 1,
		places: ['妖怪之山'],
		positiveTags: ['高级', '山珍', '招牌', '灼热', '猎奇', '小巧', '大份', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['中酒精', '苦'],
	},
	{
		name: '魔法使',
		dlc: 1,
		places: ['魔法森林'],
		positiveTags: ['素', '家常', '高级', '传说', '清淡', '西式', '鲜', '适合拍照', '凉爽', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['可加热', '鸡尾酒', '西洋酒', '提神'],
	},
	{
		name: '森之妖精',
		dlc: 1,
		places: ['魔法森林'],
		positiveTags: ['家常', '和风', '中华', '鲜', '甜', '招牌', '凉爽', '小巧', '梦幻', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['无酒精', '低酒精', '清酒', '水果', '甘'],
	},
	{
		name: '迷之人形',
		dlc: 1,
		places: ['魔法森林'],
		positiveTags: ['家常', '咸', '生', '适合拍照', '猎奇', '菌类', '小巧', '梦幻', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['水果', '苦', '气泡', '提神'],
	},
	{
		name: '土蜘蛛',
		dlc: 2,
		places: ['旧地狱'],
		positiveTags: ['肉', '重油', '饱腹', '山珍', '鲜', '甜', '生', '猎奇', '大份', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['中酒精', '可加冰', '利口酒', '直饮', '甘', '苦', '现代'],
	},
	{
		name: '鬼',
		dlc: 2,
		places: ['旧地狱'],
		positiveTags: ['肉', '高级', '传说', '下酒', '鲜', '力量涌现', '特产', '燃起来了', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['中酒精', '高酒精', '烧酒', '直饮'],
	},
	{
		name: '骨女',
		dlc: 2,
		places: ['旧地狱'],
		positiveTags: ['素', '清淡', '鲜', '生', '凉爽', '猎奇', '菌类', '酸', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['低酒精', '可加热', '啤酒', '水果', '苦'],
	},
	{
		name: '地狱鸦',
		dlc: 2,
		places: ['地灵殿'],
		positiveTags: ['肉', '家常', '山珍', '海味', '咸', '小巧', '燃起来了', '酸', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['中酒精', '可加热', '啤酒', '辛', '苦'],
	},
	{
		name: '姑获鸟',
		dlc: 2,
		places: ['地灵殿'],
		positiveTags: ['水产', '家常', '清淡', '鲜', '猎奇', '文化底蕴', '酸', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['低酒精', '可加热', '烧酒', '苦'],
	},
	{
		name: '豹女',
		dlc: 2,
		places: ['地灵殿'],
		positiveTags: ['肉', '高级', '重油', '山珍', '海味', '生', '灼热', '特产', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['中酒精', '高酒精', '直饮', '辛'],
	},
	{
		name: '僧侣',
		dlc: 3,
		places: ['命莲寺'],
		positiveTags: ['肉', '家常', '下酒', '山珍', '力量涌现', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['中酒精', '高酒精', '可加热', '烧酒', '古典'],
	},
	{
		name: '妖怪鼠',
		dlc: 3,
		places: ['命莲寺'],
		positiveTags: ['家常', '高级', '梦幻', '果味', '大份', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['鸡尾酒', '利口酒', '水果', '甘', '现代'],
	},
	{
		name: '八尺大人',
		dlc: 3,
		places: ['命莲寺'],
		positiveTags: ['和风', '西式', '鲜', '适合拍照', '凉爽', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['低酒精', '可加冰', '鸡尾酒', '西洋酒', '利口酒'],
	},
	{
		name: '道士',
		dlc: 3,
		places: ['神灵庙'],
		positiveTags: ['家常', '清淡', '山珍', '招牌', '小巧', '特产', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['低酒精', '苦', '现代', '提神'],
	},
	{
		name: '僵尸',
		dlc: 3,
		places: ['神灵庙'],
		positiveTags: [
			'昂贵',
			'实惠',
			'大份',
			'肉',
			'水产',
			'素',
			'家常',
			'高级',
			'传说',
			'重油',
			'清淡',
			'下酒',
			'饱腹',
			'山珍',
			'海味',
			'和风',
			'西式',
			'中华',
			'咸',
			'鲜',
			'甜',
			'生',
			'招牌',
			'适合拍照',
			'凉爽',
			'灼热',
			'力量涌现',
			'猎奇',
			'文化底蕴',
			'菌类',
			'不可思议',
			'小巧',
			'梦幻',
			'特产',
			'果味',
			'汤羹',
			'烧烤',
			'辣',
			'燃起来了',
			'流行喜爱',
			'流行厌恶',
		],
		negativeTags: [],
		beverageTags: [
			'无酒精',
			'低酒精',
			'中酒精',
			'高酒精',
			'可加冰',
			'可加热',
			'烧酒',
			'清酒',
			'鸡尾酒',
			'西洋酒',
			'利口酒',
			'啤酒',
			'直饮',
			'水果',
			'甘',
			'辛',
			'苦',
			'气泡',
			'古典',
			'现代',
			'提神',
		],
	},
	{
		name: '仙人',
		dlc: 3,
		places: ['神灵庙'],
		positiveTags: ['素', '高级', '清淡', '小巧', '梦幻', '果味', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['低酒精', '清酒', '水果', '甘', '气泡', '古典'],
	},
	{
		name: '小人族',
		dlc: 4,
		places: ['辉针城'],
		positiveTags: ['传说', '和风', '力量涌现', '小巧', '梦幻', '燃起来了', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['可加冰', '可加热', '啤酒', '甘', '古典'],
	},
	{
		name: '不良少年',
		dlc: 4,
		places: ['辉针城'],
		positiveTags: ['家常', '下酒', '饱腹', '和风', '力量涌现', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['高酒精', '可加热', '烧酒', '啤酒', '苦', '提神'],
	},
	{
		name: '不良少女',
		dlc: 4,
		places: ['辉针城'],
		positiveTags: ['家常', '高级', '和风', '适合拍照', '灼热', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['中酒精', '啤酒', '水果', '气泡', '现代'],
	},
	{
		name: '玩具兵',
		dlc: 4,
		places: ['辉针城'],
		positiveTags: ['海味', '西式', '招牌', '凉爽', '不可思议', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['西洋酒', '利口酒', '直饮', '现代'],
	},
	{
		name: '铃兰花精',
		dlc: 4,
		places: ['太阳花田'],
		positiveTags: ['下酒', '生', '小巧', '梦幻', '毒', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['中酒精', '直饮', '辛', '气泡'],
	},
	{
		name: '太阳花精',
		dlc: 4,
		places: ['太阳花田'],
		positiveTags: ['鲜', '甜', '力量涌现', '不可思议', '特产', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['利口酒', '水果', '甘', '气泡'],
	},
	{
		name: '玫瑰花精',
		dlc: 4,
		places: ['太阳花田'],
		positiveTags: ['高级', '西式', '招牌', '适合拍照', '小巧', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['低酒精', '鸡尾酒', '甘', '现代'],
	},
	{
		name: '影女',
		dlc: 4,
		places: ['太阳花田'],
		positiveTags: ['家常', '和风', '生', '凉爽', '猎奇', '不可思议', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['高酒精', '可加冰', '苦', '古典', '提神'],
	},
	{
		name: '纸牌兵',
		dlc: 5,
		places: ['魔界'],
		positiveTags: ['家常', '重油', '饱腹', '咸', '招牌', '凉爽', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['中酒精', '可加热', '苦', '提神'],
	},
	{
		name: '小丑',
		dlc: 5,
		places: ['魔界'],
		positiveTags: ['高级', '下酒', '生', '适合拍照', '猎奇', '菌类', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['可加冰', '利口酒', '直饮', '辛'],
	},
	{
		name: '疯帽匠',
		dlc: 5,
		places: ['魔界'],
		positiveTags: ['西式', '适合拍照', '猎奇', '菌类', '不可思议', '梦幻', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['高酒精', '西洋酒', '现代', '提神'],
	},
	{
		name: '月人',
		dlc: 5,
		places: ['月之都'],
		positiveTags: ['传说', '清淡', '海味', '中华', '不可思议', '梦幻', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['清酒', '鸡尾酒', '水果', '气泡', '现代'],
	},
	{
		name: '捣药兔',
		dlc: 5,
		places: ['月之都'],
		positiveTags: ['饱腹', '山珍', '和风', '中华', '甜', '凉爽', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['中酒精', '烧酒', '啤酒', '甘', '提神'],
	},
	{
		name: '月之使者',
		dlc: 5,
		places: ['月之都'],
		positiveTags: ['传说', '饱腹', '西式', '招牌', '力量涌现', '特产', '流行喜爱'],
		negativeTags: [],
		beverageTags: ['无酒精', '可加热', '苦', '现代', '提神'],
	},
] as const satisfies ICustomerNormal[];
