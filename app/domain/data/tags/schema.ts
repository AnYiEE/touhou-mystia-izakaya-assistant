import { type DARK_MATTER_META_MAP, type DYNAMIC_TAG_MAP } from './tagFacts';

export type TBeverageTagSchema =
	| '无酒精'
	| '低酒精'
	| '中酒精'
	| '高酒精'
	| '可加冰'
	| '可加热'
	| '烧酒'
	| '清酒'
	| '鸡尾酒'
	| '西洋酒'
	| '利口酒'
	| '啤酒'
	| '直饮'
	| '水果'
	| '甘'
	| '辛'
	| '苦'
	| '气泡'
	| '古典'
	| '现代'
	| '提神';

export type TIngredientTagSchema =
	| (typeof DYNAMIC_TAG_MAP)['expensive']
	| '肉'
	| '水产'
	| '素'
	| '家常'
	| '高级'
	| '传说'
	| '重油'
	| '清淡'
	| '下酒'
	| '饱腹'
	| '山珍'
	| '海味'
	| '西式'
	| '咸'
	| '鲜'
	| '甜'
	| '生'
	| (typeof DYNAMIC_TAG_MAP)['signature']
	| '适合拍照'
	| '凉爽'
	| '猎奇'
	| '文化底蕴'
	| '菌类'
	| '不可思议'
	| '小巧'
	| '梦幻'
	| '特产'
	| '果味'
	| '辣'
	| '酸'
	| '毒'
	| '天罚';

type TRecipeRawTagSchema =
	| (typeof DARK_MATTER_META_MAP)['positiveTag']
	| (typeof DYNAMIC_TAG_MAP)['economical']
	| (typeof DYNAMIC_TAG_MAP)['largePartition']
	| '肉'
	| '水产'
	| '素'
	| '家常'
	| '高级'
	| '传说'
	| '重油'
	| '清淡'
	| '下酒'
	| '饱腹'
	| '山珍'
	| '海味'
	| '和风'
	| '西式'
	| '中华'
	| '咸'
	| '鲜'
	| '甜'
	| '生'
	| (typeof DYNAMIC_TAG_MAP)['signature']
	| '适合拍照'
	| '凉爽'
	| '灼热'
	| '力量涌现'
	| '猎奇'
	| '文化底蕴'
	| '菌类'
	| '不可思议'
	| '小巧'
	| '梦幻'
	| '特产'
	| '果味'
	| '汤羹'
	| '烧烤'
	| '辣'
	| '燃起来了'
	| '酸'
	| '毒';

type TTagNeedCalculate =
	| (typeof DYNAMIC_TAG_MAP)['economical']
	| (typeof DYNAMIC_TAG_MAP)['expensive'];
type TPopularTag =
	| (typeof DYNAMIC_TAG_MAP)['popularNegative']
	| (typeof DYNAMIC_TAG_MAP)['popularPositive'];

export type TRecipeTagSchema =
	| TRecipeRawTagSchema
	| TTagNeedCalculate
	| TPopularTag;
