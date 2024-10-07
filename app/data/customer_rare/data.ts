/* eslint-disable sort-keys */
import type {ICustomerRare} from './types';
import {
	DARK_MATTER_NAME,
	TAG_ECONOMICAL,
	TAG_EXPENSIVE,
	TAG_LARGE_PARTITION,
	TAG_POPULAR_NEGATIVE,
	TAG_POPULAR_POSITIVE,
} from '@/data/constant';

export const CUSTOMER_RARE_LIST = [
	{
		name: '莉格露',
		dlc: 0,
		places: ['妖怪兽道', '魔法森林', '太阳花田'],
		price: '200-400',
		positiveTags: ['肉', '甜', '生', '猎奇'],
		negativeTags: ['素', '清淡', '凉爽'],
		beverageTags: ['低酒精', '可加冰'],
		collection: true,
		spellCards: {
			positive: [
				{
					name: '灯符「荧光现象」',
					description: '顾客刷新时间减少30%，持续60秒。',
				},
			],
			negative: [
				{
					name: '蠢符「夜虫龙卷」',
					description: '将店内的顾客统统驱赶。',
				},
			],
		},
		positiveTagMapping: {},
	},
	{
		name: '露米娅',
		dlc: 0,
		places: ['妖怪兽道', '魔法森林'],
		price: '150-350',
		positiveTags: ['肉', '饱腹', '生', '招牌', '猎奇', TAG_POPULAR_POSITIVE],
		negativeTags: ['下酒', TAG_EXPENSIVE, TAG_POPULAR_NEGATIVE],
		beverageTags: ['苦', '气泡'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '月符「月光射线」',
					description: '随机获得图鉴中记录的三种肉类食材（如果图鉴中记录的肉类食材只有两种，则获得两种）。',
				},
			],
			negative: [
				{
					name: '暗符「境界线」',
					description: '在厨房放出黑雾，让你无法辨识哪些是厨具，哪些是食柜，黑雾持续20秒消失。',
				},
			],
		},
		positiveTagMapping: {
			生: '新鲜',
			招牌: '拿手好菜',
		},
	},
	{
		name: '橙',
		dlc: 0,
		places: ['妖怪兽道'],
		price: '400-600',
		positiveTags: ['肉', '水产', '重油', '甜', '烧烤', TAG_POPULAR_POSITIVE],
		negativeTags: ['素', '灼热', '猎奇', TAG_POPULAR_NEGATIVE],
		beverageTags: ['水果', '辛'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '仙符「凤凰卵」',
					description: '随机获得三种鱼类食材，偶尔会出现高级货。',
				},
			],
			negative: [
				{
					name: '方符「奇门遁甲」',
					description: '减少顾客的出现率。',
				},
			],
		},
		positiveTagMapping: {
			水产: '猫吃鱼',
			烧烤: '肉串起来',
		},
	},
	{
		name: '稗田阿求',
		dlc: 0,
		places: ['人间之里', '命莲寺'],
		price: '500-800',
		positiveTags: ['高级', '清淡', '和风', '甜', '文化底蕴', '汤羹', TAG_POPULAR_POSITIVE],
		negativeTags: ['重油', '咸', '灼热', TAG_POPULAR_NEGATIVE],
		beverageTags: ['可加热', '清酒'],
		collection: true,
		spellCards: {
			positive: [
				{
					name: '撰书「这也全部是妖精干的吗」',
					description: '获得一张签名色纸。',
				},
			],
			negative: [
				{
					name: '口授「黑心店家的黑心历史」',
					description: '店内气氛掉落到冰点，顾客也会降低心情。',
				},
			],
		},
		positiveTagMapping: {
			甜: '甜食不健康',
			高级: '稗田家主',
		},
	},
	{
		name: '上白泽慧音',
		dlc: 0,
		places: ['人间之里', '魔法森林', '命莲寺'],
		price: '400-800',
		positiveTags: ['素', '家常', '清淡', '和风', '中华', '文化底蕴', TAG_POPULAR_POSITIVE],
		negativeTags: ['重油', '咸', TAG_LARGE_PARTITION, TAG_POPULAR_NEGATIVE],
		beverageTags: ['烧酒', '清酒', '利口酒'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '三种神器「剑」',
					description: '随机获得两种蔬菜类食材。',
				},
				{
					name: '三种神器「镜」',
					description: '料理不会消耗任何材料，持续15秒。',
				},
				{
					name: '三种神器「玉」',
					description: '随机解锁一名未完全解锁全部喜好的稀有顾客的一条信息。',
				},
				{
					name: '三种神器「乡」',
					description: '吸引大量居民前来就餐。',
				},
			],
			negative: [
				{
					name: '国符「秘笈头槌」',
					description: '眩晕20秒（上下左右乱打可以快速恢复）。',
				},
			],
		},
		positiveTagMapping: {},
	},
	{
		name: '茨木华扇',
		dlc: 0,
		places: ['人间之里', '旧地狱', '神灵庙'],
		price: '400-600',
		positiveTags: ['家常', '下酒', '和风', '文化底蕴'],
		negativeTags: ['生', '辣', TAG_ECONOMICAL],
		beverageTags: ['中酒精', '直饮', '古典'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '「猛兽的艺术用法」',
					description: '每隔一段时间，在场排队和就座的顾客，每人随机打赏1-30円。',
				},
			],
			negative: [
				{
					name: '「断恶修善的禁欲考验」',
					description: '顾客只会点最便宜的食物和绿茶，持续30秒。',
				},
			],
		},
		positiveTagMapping: {},
	},
	{
		name: '博丽灵梦',
		dlc: 0,
		places: ['博丽神社', '妖怪兽道', '人间之里', '魔法森林', '妖怪之山'],
		price: '150-300',
		positiveTags: ['高级', '饱腹', '甜', '不可思议', TAG_ECONOMICAL, TAG_POPULAR_POSITIVE],
		negativeTags: ['下酒', TAG_EXPENSIVE, TAG_POPULAR_NEGATIVE],
		beverageTags: ['无酒精', '低酒精', '可加热'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '梦符「二重结界」',
					description: '发动一次保护结界，可以完全防御下一位稀有顾客的惩罚符卡。',
				},
			],
			negative: [
				{
					name: '"灵符「梦想封印」',
					description: '封印你菜单上的三个料理，在接下来的30秒内无法被制作。',
				},
			],
		},
		positiveTagMapping: {
			高级: '便宜高级料理',
			不可思议: '符合我的称号',
			[TAG_ECONOMICAL]: '贵的买不起',
		},
	},
	{
		name: '伊吹萃香',
		dlc: 0,
		places: ['博丽神社', '妖怪之山', '辉针城'],
		price: '600-800',
		positiveTags: ['肉', '下酒', '和风', '力量涌现', '小巧', TAG_POPULAR_POSITIVE],
		negativeTags: ['重油', TAG_POPULAR_NEGATIVE],
		beverageTags: ['高酒精', '直饮'],
		collection: true,
		spellCards: {
			positive: [
				{
					name: '酒吞奥义「鬼进酒」',
					description: '赠送一种酒水给你，偶尔会出现超高级货。',
				},
			],
			negative: [
				{
					name: '「百万鬼夜行」',
					description: '从你的酒柜里偷走三瓶最高级的酒。',
				},
			],
		},
		positiveTagMapping: {
			肉: '大口吃肉',
			下酒: '佐酒小菜',
			小巧: '分身多个',
		},
	},
	{
		name: '比那名居天子',
		dlc: 0,
		places: ['博丽神社', '妖怪之山', '旧地狱', '神灵庙', '太阳花田'],
		price: '2000-3000',
		positiveTags: ['素', '传说', '清淡', '甜', '适合拍照', '果味', TAG_EXPENSIVE, TAG_POPULAR_NEGATIVE],
		negativeTags: ['肉', '家常', '重油', TAG_POPULAR_POSITIVE],
		beverageTags: ['高酒精', '鸡尾酒'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '「全人类的绯想天」',
					description: '使全部正在就餐的顾客的心情暴涨至85%。',
				},
			],
			negative: [
				{
					name: '「天罚的石柱」',
					description: '破坏桌椅，吓走桌面上的顾客，该桌椅在60秒内无法再被使用。',
				},
			],
		},
		positiveTagMapping: {
			清淡: '重油下等',
			适合拍照: '卖相要好',
			[TAG_EXPENSIVE]: '我不缺钱',
		},
	},
	{
		name: '雾雨魔理沙',
		dlc: 1,
		places: [
			'魔法森林',
			'妖怪兽道',
			'人间之里',
			'博丽神社',
			'红魔馆',
			'迷途竹林',
			'妖怪之山',
			'旧地狱',
			'地灵殿',
			'命莲寺',
			'神灵庙',
			'太阳花田',
			'辉针城',
		],
		price: '3000-5000',
		positiveTags: ['传说', '重油', '和风', '灼热', '菌类', TAG_POPULAR_POSITIVE],
		negativeTags: ['猎奇', TAG_POPULAR_NEGATIVE],
		beverageTags: ['低酒精', '可加冰'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '流星「超级英仙座」',
					description: '随机获得三种菌类食材，偶然会出现高级货。',
				},
			],
			negative: [
				{
					name: '魔符「拿来吧你」',
					description: '随机偷走两样东西，可能是食材、料理或酒水。',
				},
			],
		},
		positiveTagMapping: {
			传说: '古老价值',
			重油: '麻辣烫/不要清淡',
			灼热: '八卦炉/发光发热',
		},
	},
	{
		name: '红美铃',
		dlc: 0,
		places: ['红魔馆'],
		price: '200-400',
		positiveTags: ['肉', '饱腹', '中华', '力量涌现', TAG_POPULAR_POSITIVE],
		negativeTags: ['西式', '猎奇', '果味', TAG_POPULAR_NEGATIVE],
		beverageTags: ['可加热', '古典', '提神'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '华符「芳华绚烂」',
					description: '每2秒提升1点店内气氛，且期间完成稀有顾客的订单后获得的好感度提高，持续30秒。',
				},
			],
			negative: [
				{
					// cSpell:ignore pOnda
					name: '「NOver say no to pOnda」',
					description: '将店内的顾客统统驱赶。',
				},
			],
		},
		positiveTagMapping: {
			中华: '家乡的味道',
		},
	},
	{
		name: '琪露诺',
		dlc: 0,
		places: ['红魔馆', '妖怪之山'],
		price: '100-200',
		positiveTags: ['甜', '适合拍照', '凉爽', '猎奇', TAG_POPULAR_NEGATIVE],
		negativeTags: ['下酒', '文化底蕴', TAG_EXPENSIVE, TAG_POPULAR_POSITIVE],
		beverageTags: ['可加冰', '水果', '甘'],
		collection: true,
		spellCards: {
			positive: [
				{
					name: '「甜美的冰霜小妖精」',
					description: '随机获得三种带有“可加冰”标签的平价酒水和2-5枚冰块。',
				},
			],
			negative: [
				{
					name: '冻符「完美冻结」',
					description:
						'随机冻住三只厨具，如果厨具中有正在制作或完成但还未拿走的料理，则会直接被冻碎，持续30秒。',
				},
			],
		},
		positiveTagMapping: {
			适合拍照: '丑拒',
			猎奇: '真正的勇士',
		},
	},
	{
		name: '帕秋莉',
		dlc: 0,
		places: ['红魔馆', '魔法森林', '地灵殿'],
		price: '600-1000',
		positiveTags: ['高级', '西式', '甜', '适合拍照', '梦幻'],
		negativeTags: ['咸', '生', '灼热', '猎奇'],
		beverageTags: ['鸡尾酒', '利口酒', '气泡'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '知识的奇妙冒险「文化之风」',
					description: '给顾客上含有“文化底蕴”标签的料理，必然获得最高等级的评价，持续30秒。',
				},
			],
			negative: [
				{
					name: '金水符「水银之毒」',
					description: `接下来制作的料理，有50%的概率会变成${DARK_MATTER_NAME}，持续30秒。`,
				},
			],
		},
		positiveTagMapping: {
			西式: '文化差异',
			适合拍照: '卖相好',
		},
	},
	{
		name: '藤原妹红',
		dlc: 0,
		places: ['迷途竹林', '妖怪兽道'],
		price: '300-600',
		positiveTags: ['灼热', '果味', '烧烤', '燃起来了', '辣'],
		negativeTags: ['高级', '不可思议', TAG_EXPENSIVE],
		beverageTags: ['烧酒', '辛', '苦'],
		collection: true,
		spellCards: {
			positive: [
				{
					name: '不死「火鸟 凤翼天翔」',
					description: '所有厨具的料理速度加快50%，持续20秒。',
				},
			],
			negative: [
				{
					name: '藤原「灭罪寺院伤」',
					description: '无论提供多好的料理，最高只能获得顾客的普通评价，持续30秒。',
				},
			],
		},
		positiveTagMapping: {
			燃起来了: '不灭火焰',
		},
	},
	{
		name: '蓬莱山辉夜',
		dlc: 0,
		places: ['迷途竹林', '辉针城'],
		price: '1000-1500',
		positiveTags: ['传说', '和风', '文化底蕴', '不可思议', TAG_POPULAR_POSITIVE],
		negativeTags: ['招牌', '猎奇', TAG_LARGE_PARTITION, TAG_POPULAR_NEGATIVE],
		beverageTags: ['清酒', '古典', '现代'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '「永夜归返 世间开明」',
					description: '增加相当于现实时间30秒的营业时间。',
				},
			],
			negative: [
				{
					name: '神宝「蓬莱的玉枝 梦色之乡」',
					description: '减少相当于现实时间30秒的营业时间，到时间时会强行终止营业。',
				},
			],
		},
		positiveTagMapping: {
			和风: '大和抚子',
			文化底蕴: '地上历史',
		},
	},
	{
		name: '因幡帝',
		dlc: 0,
		places: ['迷途竹林'],
		price: '200-400',
		positiveTags: ['传说', '甜', '凉爽', '小巧', '梦幻', TAG_POPULAR_POSITIVE],
		negativeTags: ['重油', '山珍', '猎奇', TAG_POPULAR_NEGATIVE],
		beverageTags: ['无酒精', '水果', '甘'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '生机「四十叶草般的幸运」',
					description: '所有食材采集点的冷却时间清零，且次日进行采集活动时，可以额外获得1-2份食材。',
				},
			],
			negative: [
				{
					name: '想起「那年的素兔的恐怖」',
					description:
						'再一次激活强买强卖功能，如果不买，将发动另一张符卡“恶作剧「Combo消失术」”。“恶作剧「Combo消失术」”：中断你的Combo，且在30秒内无法再获得Combo。',
				},
			],
		},
		positiveTagMapping: {
			小巧: '三分饱',
		},
	},
	{
		name: '河城荷取',
		dlc: 1,
		places: ['妖怪之山'],
		price: '400-500',
		positiveTags: ['水产', '高级', '下酒', '咸', '招牌', '猎奇'],
		negativeTags: ['素', '山珍', '文化底蕴'],
		beverageTags: ['中酒精', '高酒精', '清酒', '直饮'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '河童「延展手臂」',
					description: '伙伴可以通过“延展手臂”远程上菜上酒，持续120秒。',
				},
			],
			negative: [
				{
					name: '水符「山洪暴发」',
					description: '随机冲走3-5名顾客。',
				},
			],
		},
		positiveTagMapping: {
			高级: '上最好的',
			猎奇: '无法理解的口味',
		},
	},
	{
		name: '犬走椛',
		dlc: 1,
		places: ['妖怪之山'],
		price: '300-400',
		positiveTags: ['肉', '重油', '下酒', '山珍', TAG_LARGE_PARTITION],
		negativeTags: ['素', '清淡', '猎奇'],
		beverageTags: ['中酒精', '高酒精', '直饮'],
		collection: true,
		spellCards: {
			positive: [
				{
					name: '「天狗例行小酌」',
					description: '大量白狼天狗顾客上门，持续120秒。',
				},
			],
			negative: [
				{
					name: '「戒严令」',
					description: '禁止任何顾客前来，持续30秒。',
				},
			],
		},
		positiveTagMapping: {
			肉: '身为狼',
			重油: '不健康',
			[TAG_LARGE_PARTITION]: '多吃点',
		},
	},
	{
		name: '东风谷早苗',
		dlc: 1,
		places: ['魔法森林', '妖怪之山', '命莲寺', '神灵庙'],
		price: '400-600',
		positiveTags: ['家常', '和风', '甜', '适合拍照', '梦幻', TAG_POPULAR_POSITIVE],
		negativeTags: ['重油', '生', '灼热', '猎奇', TAG_POPULAR_NEGATIVE],
		beverageTags: ['无酒精', '低酒精', '清酒', '直饮', '水果', '甘', '苦', '气泡', '现代'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '神德「五谷丰穰米之浴」',
					description: '生成三个酒水和三个食材。',
				},
			],
			negative: [
				{
					name: '奇迹「白昼新星」',
					description: '无法获得Buff，持续30秒。',
				},
			],
		},
		positiveTagMapping: {
			家常: '二神所在之地',
			和风: '大和民族',
			适合拍照: '手机',
			梦幻: '女孩子',
		},
	},
	{
		name: '爱丽丝',
		dlc: 1,
		places: ['魔法森林', '太阳花田'],
		price: '500-800',
		positiveTags: ['家常', '高级', '西式', '甜', '文化底蕴'],
		negativeTags: ['肉', '重油', '饱腹', '猎奇'],
		beverageTags: ['低酒精', '西洋酒', '现代'],
		collection: true,
		spellCards: {
			positive: [
				{
					name: '「和人偶一起玩的孩子」',
					description: '爱丽丝的人偶幻化为顾客，填充剩余的全部座位。',
				},
			],
			negative: [
				{
					name: '魔符「狡猾的献祭」',
					description: '炸飞一个厨具，持续60秒。',
				},
			],
		},
		positiveTagMapping: {
			高级: '低级趣味',
		},
	},
	{
		name: '矢田寺成美',
		dlc: 1,
		places: ['魔法森林', '命莲寺'],
		price: '300-600',
		positiveTags: ['清淡', '山珍', '和风', '文化底蕴', '特产'],
		negativeTags: ['重油', '饱腹'],
		beverageTags: ['低酒精', '中酒精', '可加冰', '直饮', '古典'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '魔符「即席菩提」',
					description: '顾客在结账时，会额外支付50%的小费作为化缘，持续60秒。',
				},
			],
			negative: [
				{
					name: '地藏「业火救济」',
					description: '业火随机烧掉三个Buff纸张，其带来的效果也会随之失效。',
				},
			],
		},
		positiveTagMapping: {
			和风: '曾经土地唯一',
			特产: '想尝美食但懒',
		},
	},
	{
		name: '黑谷山女',
		dlc: 2,
		places: ['旧地狱', '妖怪兽道', '红魔馆', '魔法森林', '妖怪之山'],
		price: '250-400',
		positiveTags: ['鲜', '甜', '生', '适合拍照', '猎奇', TAG_POPULAR_POSITIVE],
		negativeTags: ['重油', '咸', '灼热'],
		beverageTags: ['低酒精', '中酒精', '啤酒', '甘'],
		collection: true,
		spellCards: {
			positive: [
				{
					name: '「地下偶像狂欢夜」',
					description: '排队顾客会被偶像吸引，即使夜间营业结束也不会离去，持续30秒。',
				},
			],
			negative: [
				{
					name: '细索「犍陀多绳索」',
					description: '移动速度下降80%，持续30秒。',
				},
			],
		},
		positiveTagMapping: {
			生: '太熟吃不惯',
			猎奇: '蜘蛛的口味',
		},
	},
	{
		name: '水桥帕露西',
		dlc: 2,
		places: ['旧地狱'],
		price: '300-400',
		positiveTags: ['肉', '咸', '鲜', '果味', '辣', '酸', TAG_POPULAR_NEGATIVE],
		negativeTags: ['甜'],
		beverageTags: ['无酒精', '可加热', '直饮', '辛', '苦'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '「嫉妒与透支」',
					description: '将在座顾客的预算拉到和在座最富顾客同等的水准。',
				},
			],
			negative: [
				{
					name: '恨符「丑时参拜」',
					description: '当夜结算时收取翻倍佣金。',
				},
			],
		},
		positiveTagMapping: {
			咸: '眼泪的味道',
			辣: '愤怒的味道',
			酸: '妒意的味道',
		},
	},
	{
		name: '星熊勇仪',
		dlc: 2,
		places: ['旧地狱', '博丽神社', '妖怪之山', '地灵殿'],
		price: '600-1000',
		positiveTags: [
			'传说',
			'下酒',
			'和风',
			'招牌',
			'力量涌现',
			'燃起来了',
			TAG_LARGE_PARTITION,
			TAG_POPULAR_POSITIVE,
		],
		negativeTags: ['素', '猎奇', '小巧'],
		beverageTags: ['高酒精', '清酒', '啤酒', '古典'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '「接着奏乐接着舞」',
					description:
						'将一定数量的酒水升级成更高一级的酒水。必定升级三杯1级酒水，有75%的概率升级两杯2级酒水，有50%的概率升级一杯3级酒水。',
				},
			],
			negative: [
				{
					name: '四天王奥义「三步必杀」',
					description:
						'生成三重警戒圈，限制你的移动，持续60秒；移动速度下降50%，直到离开范围；进入范围将被立即击晕30秒。',
				},
			],
		},
		positiveTagMapping: {
			燃起来了: '热血沸腾起来',
			[TAG_LARGE_PARTITION]: '饱餐一顿',
		},
	},
	{
		name: '古明地觉',
		dlc: 2,
		places: ['地灵殿', '人间之里', '博丽神社', '红魔馆', '迷途竹林', '魔法森林'],
		price: '500-600',
		positiveTags: ['家常', '甜', '力量涌现', '小巧', '梦幻', '特产'],
		negativeTags: ['肉', '山珍', '灼热', '猎奇', TAG_LARGE_PARTITION],
		beverageTags: ['无酒精', '苦', '气泡', '提神'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '想起「高兴的事情」',
					description: '随机发动一名已解锁的稀稀有顾客（不包括自己）的奖励符卡。',
				},
			],
			negative: [
				{
					name: '想起「不高兴的事情」',
					description: '随机发动一名已解锁的稀有顾客（不包括自己）的惩罚符卡。',
				},
			],
		},
		positiveTagMapping: {
			小巧: '吃太饱不利于思考',
			特产: '缩短他乡与故乡的距离',
		},
	},
	{
		name: '火焰猫燐',
		dlc: 2,
		places: ['地灵殿', '人间之里', '博丽神社', '妖怪之山', '旧地狱', '命莲寺', '神灵庙'],
		price: '500-700',
		positiveTags: ['水产', '海味', '鲜', '甜', '猎奇', '梦幻', TAG_POPULAR_POSITIVE],
		negativeTags: ['生', '灼热'],
		beverageTags: ['低酒精', '清酒', '水果'],
		collection: true,
		spellCards: {
			positive: [
				{
					name: '猫符「猫醉步」',
					description: '给顾客上含有“中酒精”标签的酒水，必然获得最高等级的评价，持续30秒。',
				},
			],
			negative: [
				{
					name: '「死灰复燃」',
					description:
						'阿燐在离去时，将会在原先座位上留下一只地底怨灵，继续以阿燐的兴趣爱好点单，地底怨灵无法被主动驱赶，也不会付款，只有按照正常流程进行满足才会主动消失。',
				},
			],
		},
		positiveTagMapping: {
			海味: '地底海底相连',
		},
	},
	{
		name: '灵乌路空',
		dlc: 2,
		places: ['地灵殿', '妖怪之山'],
		price: '500-800',
		positiveTags: ['肉', '重油', '咸', '灼热', '力量涌现', '辣'],
		negativeTags: ['清淡', '菌类'],
		beverageTags: ['中酒精', '可加热', '鸡尾酒'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '「地狱的托卡马克装置」',
					description: '煮锅和蒸锅能瞬间完成料理，持续60秒。',
				},
			],
			negative: [
				{
					name: '狱光「扩散地狱火」',
					description:
						'下一次料理时没有成功完美演唱会使厨具炸毁，当晚无法使用，部分排队的顾客也会被吓得抱头鼠窜。',
				},
			],
		},
		positiveTagMapping: {},
	},
	{
		name: '多多良小伞',
		dlc: 3,
		places: ['命莲寺', '辉针城'],
		price: '150-300',
		positiveTags: ['家常', '饱腹', '甜', '适合拍照', '力量涌现', '猎奇', '不可思议', TAG_POPULAR_POSITIVE],
		negativeTags: ['灼热', '汤羹', '辣'],
		beverageTags: ['中酒精', '可加冰', '水果', '古典'],
		collection: true,
		spellCards: {
			positive: [
				{
					name: '雨符「雨夜怪谈」',
					description: '带有“猎奇”标签的食物制作速度提高30%，且额外提供30%续单率，持续30秒。',
				},
			],
			negative: [
				{
					name: '「超级巨幻影唐伞」',
					description: '排队中的普通顾客被吓跑。',
				},
			],
		},
		positiveTagMapping: {
			饱腹: '肚子总是空空',
			适合拍照: '好看的食物',
			猎奇: '让人吓一跳',
		},
	},
	{
		name: '村纱水蜜',
		dlc: 3,
		places: ['命莲寺'],
		price: '400-600',
		positiveTags: ['肉', '高级', '饱腹', '咸', '鲜', '力量涌现', '特产'],
		negativeTags: ['素', '猎奇', '小巧', '酸'],
		beverageTags: ['高酒精', '可加冰', '西洋酒', '辛'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '「船灵流连不散」',
					description:
						'获得“船幽灵附身”状态，持续15秒。拥有此状态时所获得的其他奖励符卡（不包括此符卡），都将延长有效时间，延长的长度等于获得新符卡时，本符卡的剩余时间。',
				},
			],
			negative: [
				{
					name: '溺符「深海漩涡」',
					description:
						'无法行动（可通过上下左右摇杆减少时间），持续5秒。之后的20秒内，上下左右移动方向相反。',
				},
			],
		},
		positiveTagMapping: {
			高级: '混到船长地位',
			饱腹: '连船舵都转不动',
			鲜: '保质期一小时',
			特产: '食物的相逢',
		},
	},
	{
		name: '封兽鵺',
		dlc: 3,
		places: ['命莲寺', '辉针城'],
		price: '300-500',
		positiveTags: ['肉', '鲜', '生', '招牌', '适合拍照', '猎奇', '不可思议', '特产', TAG_POPULAR_NEGATIVE],
		negativeTags: ['西式', '酸', TAG_POPULAR_POSITIVE],
		beverageTags: ['可加热', '烧酒', '直饮', '古典'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '开心「东方红绿蓝」',
					description:
						'开动飞碟转盘，必然中奖，结果为以下四种情况中的一种：红红红：无论上什么菜都必然获得最高等级的评价，持续15秒；绿绿绿：食材和酒水不会被消耗，持续15秒；蓝蓝蓝：收入提高100%，持续15秒；红绿蓝：同时获得以上三种Buff。',
				},
			],
			negative: [
				{
					name: '恶心「东方红红蓝」',
					description:
						'开动飞碟转盘，必然Miss，结果为以下四种情况中的一种：红红绿：无论上什么菜都必然获得极度不满的评价，持续15秒；绿绿〇：食材和酒水消耗量提高到三倍，持续15秒；蓝蓝〇：收入减少66%，持续15秒；红红蓝：同时获得以上三种buff。',
				},
			],
		},
		positiveTagMapping: {
			鲜: '腐肉吃得够多了',
			适合拍照: '对我拍个不停',
		},
	},
	{
		name: '物部布都',
		dlc: 3,
		places: ['神灵庙'],
		price: '600-900',
		positiveTags: ['高级', '传说', '清淡', '山珍', '和风', '燃起来了', TAG_POPULAR_POSITIVE],
		negativeTags: ['西式', '生', TAG_POPULAR_NEGATIVE],
		beverageTags: ['中酒精', '可加热', '直饮', '气泡'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '圣童女「太阳神的贡品」',
					description:
						'根据顾客评价获得酒水奖励，“普通”评价获得1级酒水，“满意”评价获得2级酒水，“完美”评价获得3级酒水，持续10秒。',
				},
			],
			negative: [
				{
					name: '传薪「浴火捏盘」',
					description: '只能使用一个托盘进行服务，被禁用托盘内的还未拿走的物品会被焚毁，持续30秒。',
				},
			],
		},
		positiveTagMapping: {
			和风: '吾之时代',
			燃起来了: '内心燃烧',
		},
	},
	{
		name: '霍青娥',
		dlc: 3,
		places: ['神灵庙'],
		price: '400-900',
		positiveTags: ['素', '传说', '中华', '甜', '不可思议', '小巧', '特产', TAG_POPULAR_POSITIVE],
		negativeTags: ['重油', '饱腹'],
		beverageTags: ['低酒精', '清酒', '水果', '现代'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '邪术「天下无墙」',
					description: '伙伴在食堂区域移动时可以穿过顾客或障碍物，持续30秒。',
				},
			],
			negative: [
				{
					name: '入魔「走火入魔」',
					description:
						'稀有顾客每次结账，无论评价高低，都有30%的概率放一次惩罚符卡。如果是本来就会放惩罚符卡的情况，则多放一次。持续30秒。',
				},
			],
		},
		positiveTagMapping: {
			素: '满嘴荤腥',
			中华: '我的家乡',
			小巧: '宵夜宜少',
			特产: '各地美食',
		},
	},
	{
		name: '苏我屠自古',
		dlc: 3,
		places: ['神灵庙'],
		price: '500-600',
		positiveTags: ['家常', '重油', '饱腹', '和风', '招牌', '力量涌现', '烧烤'],
		negativeTags: ['甜', '凉爽'],
		beverageTags: ['高酒精', '烧酒', '啤酒', '苦'],
		collection: true,
		spellCards: {
			positive: [
				{
					name: '雷影「电光石火」',
					description: '自己和伙伴的移动速度提升30%，持续30秒。',
				},
			],
			negative: [
				{
					name: '天罚「天雷暴击」',
					description: '下一次没有成功完美演唱的料理，将会引来天雷，击晕一位伙伴30秒。',
				},
			],
		},
		positiveTagMapping: {
			家常: '孤独守护千年',
			重油: '成为亡灵之后都能吃',
			饱腹: '就用肚子来装',
			和风: '过去吃过的',
			烧烤: '被雷劈过一样',
		},
	},
	{
		name: '射命丸文',
		dlc: 4,
		places: [
			'太阳花田',
			'妖怪兽道',
			'人间之里',
			'博丽神社',
			'红魔馆',
			'迷途竹林',
			'魔法森林',
			'妖怪之山',
			'旧地狱',
			'地灵殿',
			'命莲寺',
			'神灵庙',
			'辉针城',
		],
		price: '500-600',
		positiveTags: ['肉', '家常', '下酒', '和风', '招牌', '适合拍照', TAG_POPULAR_POSITIVE],
		negativeTags: ['西式', TAG_POPULAR_NEGATIVE],
		beverageTags: ['高酒精', '可加冰', '烧酒', '提神'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '「八衢潮流风靡幻想」',
					description: `明天开始店铺变为“明星店”，三天后恢复正常。“明星店”：提高10%顾客预算和5%客流量，“招牌”标签成为流行标签。如果店铺已是“明星店”或当晚已宣传，则此符卡转化为“「食堂风起厨神无双」”。“「食堂风起厨神无双」”：成品带有“招牌”标签的今日菜单上的料理将成为明星料理。制作明星料理时，如果料理时间小于5秒，则瞬间完成；在舆论的裹挟下，追捧“${TAG_POPULAR_POSITIVE}”标签的顾客食用明星料理后额外提高30%续单率，返还当单酒水消耗的预算，并必定增加一次续单上限（增加续单上限效果每桌顾客只触发一次），持续30秒。`,
				},
			],
			negative: [
				{
					name: '「笔枪纸弹禁制之道」',
					description:
						'无法进行投掷上菜，持续30秒。同时在报纸上对黑心店铺进行抨击，使“明星店”加成明天起消失。',
				},
			],
		},
		positiveTagMapping: {
			适合拍照: '入我相机',
		},
	},
	{
		name: '梅蒂欣',
		dlc: 4,
		places: ['太阳花田'],
		price: '200-400',
		positiveTags: ['甜', '招牌', '适合拍照', '凉爽', '菌类', '小巧', '梦幻', '毒'],
		negativeTags: ['文化底蕴'],
		beverageTags: ['无酒精', '水果', '甘', '苦'],
		collection: true,
		spellCards: {
			positive: [
				{
					name: '分解「剧毒中和」',
					description:
						'移除“铃兰「凋零花园」”状态；梅蒂欣操纵料理中可能存在的有害元素，使料理时的标签不再产生冲突，持续30秒，并获得带有“中酒精”标签的酒水一瓶。。',
				},
			],
			negative: [
				{
					name: '铃兰「凋零花园」',
					description:
						'移除“分解「剧毒中和」”状态；制作料理时铃铃会额外为料理追加特殊的“忧郁之毒”标签，食用带有该标签的食物的顾客不会续单，持续30秒。',
				},
			],
		},
		positiveTagMapping: {
			甜: '毒的基础是甜',
			凉爽: '不能受热',
			菌类: '森林里疯长的',
			梦幻: '故意中毒',
		},
	},
	{
		name: '风见幽香',
		dlc: 4,
		places: ['太阳花田'],
		price: '1200-1800',
		positiveTags: ['高级', '传说', '清淡', '西式', '不可思议', '梦幻', '特产', TAG_POPULAR_POSITIVE],
		negativeTags: ['饱腹', '和风', '咸', '灼热'],
		beverageTags: ['鸡尾酒', '西洋酒', '利口酒', '现代'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '「花鸟风月群芳沐」',
					description:
						'在场上种下一朵鲜花并利用能力使其生长，满心情时额外种下一朵，每朵生长的鲜花每24秒生产25小费。除幽香以外的稀有顾客释放奖励符卡时，随机一朵生长的鲜花将吸收符卡之力而盛放，吸引当地出没的稀有顾客造访食堂，被鲜花吸引来的稀有顾客会摘走这朵鲜花。鲜花盛放期间顾客用餐结束后额外提高15心情，15秒后鲜花凋谢，获得一层“「落英缀裳」”。“「落英缀裳」”：可以抵挡一次中断Combo的失误。',
				},
			],
			negative: [
				{
					name: '「决斗Spark!!!」',
					description:
						'用微笑的表情走到自己所在座位那一排的最上方，然后一发魔炮将这排桌子轰飞，当夜不可修复，并吓跑所有在这些位置用餐的顾客。',
				},
			],
		},
		positiveTagMapping: {
			传说: '流传至今的过去',
			清淡: '不要油手碰花',
			西式: '绅士风度',
			不可思议: '冬紫罗兰',
			梦幻: '蓝色满天星',
		},
	},
	{
		name: '少名针妙丸',
		dlc: 4,
		places: ['辉针城'],
		price: '600-1200',
		positiveTags: ['传说', '和风', '甜', '适合拍照', '文化底蕴', '小巧', '燃起来了', TAG_POPULAR_POSITIVE],
		negativeTags: ['西式', TAG_LARGE_PARTITION],
		beverageTags: ['低酒精', '可加热', '气泡', '古典'],
		collection: true,
		spellCards: {
			positive: [
				{
					name: '宝槌「通货膨胀危机」',
					description:
						'使用万宝槌敲击收银台，叠加一层“万宝槌之力”。万宝槌充盈的魔力将在营业结束时使营业额膨胀，第一层“万宝槌之力”使收入提高7%，之后每层使收入提高2%。同时，充盈的万宝槌之力使伙伴【赤蛮奇】分裂出的辘轳首产生暴走，移动速度提高200%。',
				},
			],
			negative: [
				{
					name: '小槌「你给我变大吧!」',
					description: '身体将会被放大到原先的三倍，持续30秒。',
				},
			],
		},
		positiveTagMapping: {
			传说: '充满勇气的故事',
			和风: '小人的祖先',
			适合拍照: '和别人分享',
			小巧: '看我的样子',
		},
	},
	{
		name: '鬼人正邪',
		dlc: 4,
		places: ['辉针城'],
		price: '300-600',
		positiveTags: ['重油', '下酒', '灼热', '力量涌现', '猎奇', '不可思议', '燃起来了', TAG_POPULAR_NEGATIVE],
		negativeTags: ['高级', TAG_POPULAR_POSITIVE],
		beverageTags: ['中酒精', '烧酒', '直饮', '辛'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '欺符「超限效应」',
					description:
						'令全场除自身以外的顾客的厌恶标签反转为喜好标签，持续30秒。当场上包括排队顾客在内的普通顾客数量之和不少于7时，此符卡转化为“逆弓「天壤梦弓的诏敕」”。“逆弓「天壤梦弓的诏敕」”：使场上包括排队顾客在内的普通顾客额外获得一次续单上限和25%预算，每位普通顾客最多可以受到此效果影响三次。',
				},
			],
			negative: [
				{
					name: '逆转「颠倒世界」',
					description:
						'将自身的预算和全场最高预算水平的顾客预算翻转，并在接下来的15秒内持续将除自己以外的所有顾客的预算降低到全场最低预算顾客水平。',
				},
			],
		},
		positiveTagMapping: {
			灼热: '滋滋冒气',
			不可思议: '不可能实现',
			燃起来了: '弱者颠覆强者',
		},
	},
	{
		name: '今泉影狼',
		dlc: 4,
		places: ['迷途竹林', '辉针城'],
		price: '300-600',
		positiveTags: ['肉', '家常', '山珍', '和风', '适合拍照', '凉爽', TAG_POPULAR_POSITIVE],
		negativeTags: ['灼热'],
		beverageTags: ['中酒精', '可加冰', '清酒', '直饮'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '狼魂「野性觉醒」',
					description:
						'接下来的30秒内，顾客会爱上“肉”和“山珍”标签，在对料理评分时作为自身的喜好进行评价，原本喜好这些标签的顾客食用相关料理时必然触发最高评价。',
				},
			],
			negative: [
				{
					name: '饿狼「暴食的月下舞踏」',
					description:
						'接下来的30秒内，所有顾客的料理如果没有添加“饱腹”标签，会触发最差评价，原本厌恶“饱腹”标签的顾客食用相关料理时必然触发最差评价。',
				},
			],
		},
		positiveTagMapping: {
			肉: '人家是狼',
			和风: '本州狼',
			凉爽: '从胃里降温',
		},
	},
	{
		name: '铃仙',
		dlc: 5,
		places: ['月之都'],
		price: '200-350',
		positiveTags: ['家常', '山珍', '海味', '中华', '甜', '小巧', '特产'],
		negativeTags: ['不可思议', TAG_EXPENSIVE],
		beverageTags: ['高酒精', '可加热', '烧酒', '啤酒', '苦'],
		collection: true,
		spellCards: {
			positive: [
				{
					name: '「月免的篝火盛宴」',
					description:
						'召开一场盛大的篝火盛宴，场上每只存在的兔子生成一个随机食材或一瓶随机酒水，接下来30秒内出现新的兔子时会同样生成食材或酒水。生成食材的概率为80%，生成酒水的概率为20%。',
				},
			],
			negative: [
				{
					name: '「酒醉迷乱」',
					description:
						'铃仙向场上打出一颗狂气之弹，影响场上的顾客，，持续30秒。受到狂气影响的顾客食用不带有“高酒精”标签的酒水必定给出最低评价。',
				},
			],
		},
		positiveTagMapping: {
			山珍: '月都如果有山',
			海味: '静海不那么死气沉沉',
			中华: '月兔也是仙子',
			小巧: '兔子的胃很小',
			特产: '无法抵达的地方',
		},
	},
	{
		name: '绵月丰姬',
		dlc: 5,
		places: ['月之都'],
		price: '1200-1500',
		positiveTags: ['素', '高级', '和风', '甜', '凉爽', '文化底蕴', '果味', TAG_POPULAR_POSITIVE],
		negativeTags: ['山珍', '咸', '力量涌现'],
		beverageTags: ['高酒精', '可加冰', '清酒', '水果', '古典'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '方圆「山海千重」',
					description:
						'丰姬连接海和山，链接幻想乡的一个地点，使该区域的普通顾客和稀有顾客可以穿越“面”前来。通过丰姬的能力链接的地区刷新效果分别独立，刷新速率为原先的33%。',
				},
			],
			negative: [
				{
					name: '晦朔「天地未形」',
					description:
						'丰姬从当地出没的稀有顾客以及当晚邀请的稀有顾客中随机选择三个还未出现的顾客，使她们“神隐”，今晚无法前来夜雀食堂。',
				},
			],
		},
		positiveTagMapping: {
			素: '吃草助消化',
			和风: '喜欢上和歌了',
			凉爽: '好热',
			文化底蕴: '料理里的故事',
		},
	},
	{
		name: '绵月依姬',
		dlc: 5,
		places: ['月之都'],
		price: '1000-1200',
		positiveTags: ['高级', '传说', '清淡', '中华', '灼热', '力量涌现', '文化底蕴', '小巧'],
		negativeTags: ['山珍', '菌类'],
		beverageTags: ['可加热', '烧酒', '直饮', '辛', '提神'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '神诏「众神谕使」',
					description:
						'依姬召唤神灵，附加一层“神耀桂冠”，如果本次提供的料理带有“传说”标签，则额外附加一层。当稀有顾客产生不为完美的评价时，消耗一层“神耀桂冠”引发神迹，将评价提升至完美。',
				},
			],
			negative: [
				{
					name: '诫罚「诸神圣裁」',
					description: '带有“传说”标签的料理或使用带有“传说”标签的食材制作的料理无法被制作，持续30秒。',
				},
			],
		},
		positiveTagMapping: {
			高级: '月之民不食糟糠',
			传说: '令后人传诵的功绩',
			灼热: '不要让血冷下来',
			小巧: '锻炼不宜多吃',
		},
	},
	{
		name: '爱莲',
		dlc: 5,
		places: ['魔界'],
		price: '300-500',
		positiveTags: ['家常', '饱腹', '西式', '甜', '凉爽', '梦幻', TAG_POPULAR_POSITIVE],
		negativeTags: ['水产', '重油', '生'],
		beverageTags: ['低酒精', '可加热', '啤酒', '甘', '古典'],
		collection: true,
		spellCards: {
			positive: [
				{
					name: '「恋爱的糖果屋」',
					description:
						'当完成场上顾客的订单且至少获得普通评价后，在座位附近掉落一枚“蓬松松糖果”以供拾取，持续30秒。',
				},
			],
			negative: [
				{
					name: '「呜撒的猫咪」',
					description: '伙伴移动速度下降30%，工作速度下降50%，持续30秒。',
				},
			],
		},
		positiveTagMapping: {
			凉爽: '毕竟是猫舌头',
		},
	},
	{
		name: '魅魔',
		dlc: 5,
		places: ['魔界'],
		price: '2000-3000',
		positiveTags: ['水产', '山珍', '鲜', '生', '力量涌现', '猎奇', '菌类'],
		negativeTags: ['高级', '清淡'],
		beverageTags: ['高酒精', '可加冰', '烧酒', '西洋酒', '辛'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '「幽冥的轮回」',
					description:
						'如果场上不存在“幽玄封魔阵”则生成法阵，如果存在则为法阵填充2点能量。“幽玄封魔阵”：除魅魔以外的稀有顾客释放任意符卡时填充1点能量。能量达到7点时，消耗全部能量引发“梦符「时空一粟」”。“梦符「时空一粟」”：场上所有就座的顾客的剩余预算回复到上限，制作料理不消耗食材且瞬间完成，顾客必定给出最高评价，持续20秒。',
				},
			],
			negative: [
				{
					name: '「渎神的代价」',
					description: '受到“恶灵缠怨”：无法获得夜雀之歌类Buff，且无法触发特殊厨具效果，持续30秒。',
				},
			],
		},
		positiveTagMapping: {
			鲜: '陈腐东西不能入口',
			生: '最原始的味道',
			力量涌现: '激活身体和思维',
		},
	},
	{
		name: '露易兹',
		dlc: 5,
		places: [
			'魔界',
			'妖怪兽道',
			'人间之里',
			'博丽神社',
			'红魔馆',
			'迷途竹林',
			'魔法森林',
			'妖怪之山',
			'旧地狱',
			'地灵殿',
			'命莲寺',
			'神灵庙',
			'太阳花田',
			'辉针城',
		],
		price: '800-1000',
		positiveTags: ['水产', '西式', '甜', '适合拍照', '小巧', '特产', TAG_POPULAR_POSITIVE],
		negativeTags: ['重油', '饱腹'],
		beverageTags: ['中酒精', '可加冰', '鸡尾酒', '啤酒', '现代'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '「传奇的格列佛」',
					description:
						'露易兹召唤一架魔法相机停留在店内，如果稀有顾客本尊离开时未吃饱且预算未耗尽，则相机拍下该稀有顾客并转换为一份“旅者博客”。当日结束后“旅者博客”解放（如果拍摄时当日已结束，则立即解放），投影出其拍摄的顾客形象再次光临食堂，以此方式形成的稀稀有顾客的影像可以使用符卡，喜好和原先无异，但预算为其离开时的预算，续单上限为其离开时剩余的可点单数。',
				},
			],
			negative: [
				{
					name: '「遗落的水晶鞋」',
					description: '当晚营业结束后，再经过60秒，将会强制驱逐店铺内的顾客并关店。',
				},
			],
		},
		positiveTagMapping: {
			适合拍照: '适合发博客',
			小巧: '晚上不宜太饱',
			特产: '旅行的乐趣',
		},
	},
	{
		name: '森近霖之助',
		dlc: 0,
		places: ['人间之里', '魔法森林', '太阳花田'],
		price: '250-400',
		positiveTags: ['家常', '饱腹', '鲜', TAG_POPULAR_POSITIVE],
		negativeTags: ['重油', '下酒', '猎奇', TAG_POPULAR_NEGATIVE],
		beverageTags: ['烧酒', '啤酒'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '「香霖堂购物节」',
					description: '获得一张香霖堂购物七折的打折卡，仅限次日使用，过期作废。',
				},
			],
			negative: [
				{
					name: '「虚构的情报」',
					description: '随机隐藏已经解锁的稀有顾客的喜好信息。',
				},
			],
		},
		positiveTagMapping: {
			鲜: '嘴很刁',
		},
	},
	{
		name: '蕾米莉亚',
		dlc: 4,
		places: ['博丽神社', '红魔馆'],
		price: '4950-5000',
		positiveTags: ['高级', '传说', '西式', '甜', '生', TAG_POPULAR_POSITIVE],
		negativeTags: ['咸', '辣', '酸', TAG_ECONOMICAL],
		beverageTags: ['高酒精', '西洋酒', '水果', '甘', '古典'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '红符「红色不夜城」',
					description:
						'本日结束时使食堂进入“红色不夜城”状态（如果当日已结束，则立即触发），持续至营业结束。“红色不夜城”：普通顾客的预算不会低于500；伙伴的工作速度提高100%，如果是咲夜则将工作速度提高至极限；顾客的续单率提高100%；发动时如果蕾米莉亚本人此时依然在场，则接下来60秒内不会闭店，并以300%的速率继续刷新普通顾客。否则在场上的最后一位稀有顾客离开时，依照当晚触发的奖励符卡数量召唤对应数量的妖精女仆前来。',
				},
			],
			negative: [
				{
					name: '夜符「红雾异变再临」',
					description: '释放血雾覆盖左下角的订单区域，持续60秒。',
				},
			],
		},
		positiveTagMapping: {
			西式: '异国风味',
		},
	},
	{
		name: '魂魄妖梦',
		dlc: 0,
		places: ['妖怪兽道', '人间之里', '博丽神社', '迷途竹林'],
		price: '300-400',
		positiveTags: ['家常', '清淡', '鲜', '力量涌现'],
		negativeTags: ['重油', '咸', '猎奇'],
		beverageTags: ['无酒精', '可加热', '水果'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '狱界剑「二百由旬之一闪」',
					description: '制作料理台的料理时能瞬间完成，持续60秒。',
				},
			],
			negative: [
				{
					name: '天上剑「天人之五衰」',
					description: '顾客耐心衰减速度翻倍，且每2秒减少1点气氛，持续60秒。',
				},
			],
		},
		positiveTagMapping: {},
	},
	{
		name: '西行寺幽幽子',
		dlc: 0,
		places: ['博丽神社', '红魔馆', '迷途竹林', '神灵庙'],
		price: '1500-2000',
		positiveTags: ['肉', '水产', '高级', '传说', '饱腹', '和风', '中华', TAG_LARGE_PARTITION],
		negativeTags: ['素', '清淡', '小巧'],
		beverageTags: ['高酒精', '可加冰', '鸡尾酒'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '「食物瞬间消失术」',
					description:
						'接下来直到营业结束为止，顾客会瞬间吃下所有料理。再次触发时此符卡转化为“「墨染浮櫻化醉蝶」”。“「墨染浮櫻化醉蝶」”：幽幽子释放1/3/5/8（随使用次数提升）只蝴蝶飞向保温箱，每只蝴蝶吞噬保温箱中存储的一个料理，转化为等同于四倍料理价格的金钱（享受小费倍率加成）。',
				},
			],
			negative: [
				{
					name: '「加料加量不加价」',
					description: '接下来直到营业结束为止，料理不加满五个档位的料，都会收到差评。',
				},
			],
		},
		positiveTagMapping: {},
	},
	{
		name: '冴月麟',
		dlc: 0,
		places: ['妖怪兽道', '人间之里', '博丽神社', '红魔馆', '迷途竹林'],
		price: '400-600',
		positiveTags: ['水产', '家常', '中华', '辣', TAG_POPULAR_POSITIVE],
		negativeTags: ['重油', '下酒', '生', TAG_POPULAR_NEGATIVE],
		beverageTags: ['无酒精', '甘', '气泡'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '「扶我起来，我还能吃」',
					description:
						'包括排队顾客在内的所有顾客，有30%的概率增加一次额外续单，每位顾客的概率独立计算。通过此种方式增加的额外续单将无视预算上限。',
				},
			],
			negative: [
				{
					name: '「饭要一口一口吃才健康」',
					description: '包括排队顾客在内的所有顾客，用餐时间增加一倍，但此技能效果优先级低于立刻完食类Buff。',
				},
			],
		},
		positiveTagMapping: {},
	},
	{
		name: '立空汐',
		dlc: 0,
		places: ['妖怪兽道', '博丽神社', '红魔馆', '迷途竹林', '妖怪之山'],
		price: '500-800',
		positiveTags: ['肉', '下酒', '山珍', '和风', '力量涌现', TAG_EXPENSIVE, TAG_POPULAR_NEGATIVE],
		negativeTags: ['素', '清淡', TAG_POPULAR_POSITIVE],
		beverageTags: ['高酒精', '可加冰', '可加热'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '「不玩尽兴还想走?!」',
					description:
						'使用空间能力将在场顾客封闭起来，只要顾客还吃得下并且有能消费得起的料理，就必须消费，直到花费额度至少到达预算的70%才会解除。在解除前，顾客无法离开桌子，只能继续点单。持续60秒。',
				},
			],
			negative: [
				{
					name: '拷问「頞部陀」',
					description: `制作含有“清淡”或“素”标签的料理，最终只能做出${DARK_MATTER_NAME}，持续120秒。`,
				},
			],
		},
		positiveTagMapping: {},
	},
	{
		name: '时焉侑',
		dlc: 0,
		places: ['人间之里', '博丽神社'],
		price: '1300-1800',
		positiveTags: ['传说', '下酒', '西式', '中华', '文化底蕴', '特产'],
		negativeTags: ['水产', '重油', '饱腹'],
		beverageTags: ['中酒精', '可加冰', '鸡尾酒', '西洋酒'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '因果「推理与判断之眼」',
					description: '辨识顾客的剩余预算和点单次数，持续120秒。',
				},
			],
			negative: [
				{
					name: '律符「颠倒错乱」',
					description: '无论上的料理和酒水如何合衬顾客的心意，得到的评价都是随机的一种，持续60秒。',
				},
			],
		},
		positiveTagMapping: {},
	},
	{
		name: '饕餮尤魔',
		dlc: 1,
		places: [
			'妖怪之山',
			'妖怪兽道',
			'博丽神社',
			'红魔馆',
			'魔法森林',
			'迷途竹林',
			'旧地狱',
			'地灵殿',
			'命莲寺',
			'神灵庙',
			'太阳花田',
			'辉针城',
		],
		price: '9999-9999',
		positiveTags: ['肉', '高级', '传说', '饱腹', '鲜', '生', '力量涌现', '不可思议', TAG_LARGE_PARTITION],
		negativeTags: [],
		beverageTags: ['高酒精', '烧酒', '直饮', '辛'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '「饕餮的饕餮之宴」',
					description: '除尤魔以外的顾客都只会点最贵的食物和酒水，且这些订单不消耗预算，持续30秒。',
				},
			],
			negative: [
				{
					name: '「刚欲兽神饕餮的晚餐」',
					description:
						'暴走的尤魔将会随机吞噬掉3-5个食材和1-3个酒水，并吞噬1个厨具，使该厨具当晚无法使用。在血池地狱挑战中，会额外恢复5%的HP。',
				},
			],
		},
		positiveTagMapping: {
			饱腹: '无限胃袋',
			鲜: '不要馊掉了',
			生: '血淋淋',
			[TAG_LARGE_PARTITION]: '指缝都塞不满',
		},
	},
	{
		name: '古明地恋',
		dlc: 2,
		places: [
			'地灵殿',
			'妖怪兽道',
			'人间之里',
			'博丽神社',
			'红魔馆',
			'迷途竹林',
			'魔法森林',
			'妖怪之山',
			'旧地狱',
			'命莲寺',
			'神灵庙',
			'太阳花田',
			'辉针城',
		],
		price: '800-1200',
		positiveTags: ['咸', '甜', '生', '猎奇', '不可思议', '梦幻'],
		negativeTags: [],
		beverageTags: ['高酒精', '烧酒', '苦', '气泡'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '「自在极意无意识」',
					description:
						'顾客点单、吃饭和店员操作等所有需要冷却时间的动作，全部无冷却、无意识发动，达到理论速度的极限，持续60秒。',
				},
			],
			negative: [
				{
					name: '「自我极意无意识」',
					description: '普通顾客点单全部变成被恋恋遮住的盲单，需要通过查询图鉴喜好来完成，持续60秒。',
				},
			],
		},
		positiveTagMapping: {
			不可思议: '永远猜不到我想要什么',
		},
	},
	{
		name: '二岩猯藏',
		dlc: 3,
		places: ['妖怪兽道', '人间之里', '博丽神社', '命莲寺', '神灵庙'],
		price: '1000-1200',
		positiveTags: ['肉', '水产', '家常', '传说', '下酒', '和风', '果味', TAG_POPULAR_POSITIVE],
		negativeTags: ['灼热', '辣'],
		beverageTags: ['高酒精', '可加热', '烧酒', '古典'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '「魔卡小狸十股变化」',
					description:
						'召唤若干狸猫，变化成就座顾客的样子（不包括揣藏本人），并重新加入到排队队列中。狸猫变化的顾客，喜好和预算与变化对象无异，但所有狸猫变化成的稀有顾客整晚只能释放一次变化对象的符卡。',
				},
			],
			negative: [
				{
					name: '「惩罚无良商家的最好办法」',
					description:
						'接下来的30秒内，收到的都是叶子变成的钱币，晚间结算时才会发现，这期间获得的金钱全部不会成为收入。',
				},
			],
		},
		positiveTagMapping: {
			和风: '佐渡老家',
		},
	},
	{
		name: '八云紫',
		dlc: 5,
		places: [
			'妖怪兽道',
			'人间之里',
			'红魔馆',
			'迷途竹林',
			'魔法森林',
			'妖怪之山',
			'旧地狱',
			'地灵殿',
			'命莲寺',
			'神灵庙',
			'太阳花田',
			'辉针城',
			'月之都',
			'魔界',
		],
		price: '4000-6000',
		positiveTags: ['家常', '高级', '传说', '适合拍照', '凉爽', '猎奇', '汤羹'],
		negativeTags: ['饱腹', '菌类'],
		beverageTags: ['中酒精', '高酒精', '烧酒', '古典'],
		collection: false,
		spellCards: {
			positive: [
				{
					name: '「人与妖的梦乡」',
					description:
						'在当日结束前触发时，冻结所有剩余时间大于44秒的Buff时间，使之不再减少，直至当日结束。再次触发或在当日结束后触发，所有剩余时间大于44秒的Buff时间增加当前剩余时长的10%（每种类型的Buff至多通过此符卡增加17秒）。',
				},
			],
			negative: [
				{
					name: '「现与隐的境界」',
					description:
						'在场上开启数个会变换位置的隙间，如果接近隙间，则会被吸入其中，然后随机传送到其他隙间处，同时托盘内的酒水会消失，持续30秒。',
				},
			],
		},
		positiveTagMapping: {
			适合拍照: '食之品相',
		},
	},
] as const satisfies ICustomerRare[];
