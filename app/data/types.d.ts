import type {IBeverage} from './beverages/types';
import type {IIngredient} from './ingredients/types';
import type {IRecipe, TTagNeedCalculate} from './recipes/types';

type TDlc = 0 | 1 | 2 | 3 | 4 | 5;
type TLevel = 1 | 2 | 3 | 4 | 5;

type TBusinessman =
	| '博丽神社河童'
	| '博丽神社妖精女仆'
	| '地灵殿地狱鸦'
	| '红魔馆地精'
	| '红魔馆小恶魔'
	| '红魔馆妖精女仆'
	| '辉针城不良少年'
	| '旧地狱鬼商'
	| '迷途竹林妖怪兔'
	| '命莲寺娜兹玲'
	| '魔法森林上海人形'
	| '魔界小丑'
	| '人间之里酒屋'
	| '人间之里铃瑚屋'
	| '人间之里农户'
	| '人间之里清兰屋'
	| '人间之里香霖堂'
	| '神灵庙道士'
	| '太阳花田太阳花精'
	| '妖怪兽道萌澄果'
	| '妖怪兽道三妖精'
	| '妖怪兽道商人'
	| '妖怪之山河童'
	| '月之都月兔';

type TCollectionLocation =
	| '博丽神社参道西侧银杏'
	| '博丽神社花丛'
	| '博丽神社蘑菇'
	| '博丽神社桃树'
	| '博丽神社西侧守矢分社'
	| '博丽神社银杏'
	| '地灵殿东北侧仓库'
	| '地灵殿东侧喷泉'
	| '地灵殿花丛'
	| '地灵殿蘑菇'
	| '地灵殿水池'
	| '地灵殿西南侧酒水架'
	| '地灵殿西北侧游乐场'
	| '非迷途竹林河流'
	| '非妖怪兽道河流'
	| '红魔馆河流'
	| '红魔馆露水'
	| '红魔馆葡萄'
	| '辉针城东侧红豆树'
	| '辉针城东侧酒窖'
	| '辉针城水涡'
	| '辉针城碗之后'
	| '辉针城竹笋'
	| '辉针城竹子'
	| '旧地狱捕兽夹'
	| '旧地狱鸡窝'
	| '旧地狱桥头并蒂莲'
	| '旧地狱桥头柠檬树'
	| '旧地狱银杏'
	| '迷途竹林蘑菇'
	| '迷途竹林水涡'
	| '迷途竹林西侧泉水处'
	| '迷途竹林竹笋'
	| '迷途竹林竹子'
	| '命莲寺东北并蒂莲'
	| '命莲寺东北莲花池'
	| '命莲寺蜂巢'
	| '命莲寺西北花丛'
	| '命莲寺西南花丛'
	| '魔法森林花丛'
	| '魔法森林露水'
	| '魔法森林蘑菇'
	| '魔法森林桃树'
	| '魔法森林银杏'
	| '魔法森林中部树根'
	| '魔界辣椒丛'
	| '魔界魅魔房顶'
	| '人间之里鸡窝'
	| '人间之里农田'
	| '人间之里银杏'
	| '神灵庙北部冰块'
	| '神灵庙东侧并蒂莲'
	| '神灵庙露水'
	| '神灵庙桥头并蒂莲'
	| '神灵庙水涡'
	| '神灵庙中部栗树'
	| '神灵庙中部松树'
	| '太阳花田东侧向日葵'
	| '太阳花田蜂巢'
	| '太阳花田露水'
	| '太阳花田蘑菇'
	| '太阳花田葡萄'
	| '太阳花田树桩'
	| '太阳花田桃树'
	| '太阳花田温室'
	| '太阳花田西北香椿树'
	| '太阳花田西侧鲜花'
	| '太阳花田银杏'
	| '太阳花田中部温室'
	| '太阳花田中部鲜花'
	| '妖怪兽道捕兽夹'
	| '妖怪兽道东侧'
	| '妖怪兽道东侧山丘（需借道博丽神社）'
	| '妖怪兽道蜂巢'
	| '妖怪兽道河流'
	| '妖怪兽道花丛'
	| '妖怪兽道露水'
	| '妖怪兽道南侧码头'
	| '妖怪兽道南侧亭子月光草（需借道迷途竹林）'
	| '妖怪之山捕兽夹'
	| '妖怪之山蜂巢'
	| '妖怪之山黑盐'
	| '妖怪之山花丛'
	| '妖怪之山黄瓜'
	| '妖怪之山南侧瀑布'
	| '妖怪之山西北瀑布'
	| '妖怪之山中心瀑布'
	| '月之都月虹池';

export type TBeverageTag = IBeverage['tags'][number] | '全部';
export type TRecipeTag =
	| IRecipe['positiveTags'][number] // eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
	| IRecipe['negativeTags'][number]
	| TTagNeedCalculate
	| '流行喜爱'
	| '流行厌恶'
	| '全部';
export type TIngredientTag = IIngredient['tags'][number];

type TPlace =
	| '博丽神社'
	| '地灵殿'
	| '红魔馆'
	| '辉针城'
	| '旧地狱'
	| '迷途竹林'
	| '命莲寺'
	| '魔法森林'
	| '魔界'
	| '人间之里'
	| '神灵庙'
	| '太阳花田'
	| '妖怪兽道'
	| '妖怪之山'
	| '月之都';

type TTask = '阿求小姐的色纸' | '女仆长的采购委托';

export interface IItemBase {
	name: string;
}

export interface ICustomerBase extends IItemBase {
	dlc: TDlc;
	places: TPlace[];
	positiveTags: TRecipeTag[];
	negativeTags: TRecipeTag[];
	beverageTags: TBeverageTag[];
}

interface IFoodFrom {
	/** @description 如果是数组，则第一个元素为出售角色，第二个元素代表是否为必然出售 */
	buy: Array<TBusinessman | [TBusinessman, boolean]>;
	/** @description 如果是数组，则第一个元素为采集地点，第二个元素代表是否为概率获得 */
	collect: Array<TCollectionLocation | [TCollectionLocation, boolean]>;
	task: TTask[];
}

export interface IFoodBase extends IItemBase {
	dlc: TDlc;
	level: TLevel;
	price: number;
	from: Partial<IFoodFrom>;
}
