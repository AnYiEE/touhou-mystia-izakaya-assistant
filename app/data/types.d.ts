import type {IBeverage} from './beverages/types';
import type {IIngredient} from './ingredients/types';
import type {IRecipe, TTagNeedCalculate} from './recipes/types';

/** @description The meaning of "DLC 0" here refers to the base game. */
type TDlc = 0 | 1 | 2 | 3 | 4 | 5;

type TLevel = 1 | 2 | 3 | 4 | 5;

type TBusinessman =
	| '【博丽神社】河童商人'
	| '【博丽神社】妖精女仆'
	| '【地灵殿】地狱鸦'
	| '【红魔馆】地精商人'
	| '【红魔馆】小恶魔'
	| '【红魔馆】匿名妖精女仆'
	| '【辉针城】不良少年'
	| '【旧地狱】鬼商'
	| '【迷途竹林】美食妖怪兔'
	| '【命莲寺】娜兹玲'
	| '【魔法森林】上海人形'
	| '【魔界】小丑'
	| '【人间之里】酒商'
	| '【人间之里】铃瑚'
	| '【人间之里】农户'
	| '【人间之里】清兰'
	| '【人间之里】香霖堂'
	| '【神灵庙】道士'
	| '【太阳花田】太阳花精'
	| '【妖怪兽道】萌澄果'
	| '【妖怪兽道】蹦蹦跳跳的三妖精'
	| '【妖怪兽道】杂货商人'
	| '【妖怪之山】河童商人'
	| '【月之都】月兔';

type TCollectionLocation =
	| '【博丽神社】参道西侧银杏树'
	| '【博丽神社】花丛'
	| '【博丽神社】蘑菇堆'
	| '【博丽神社】桃树'
	| '【博丽神社】西侧守矢分社'
	| '【博丽神社】银杏树'
	| '【地灵殿】东北侧仓库'
	| '【地灵殿】东侧喷泉'
	| '【地灵殿】花丛'
	| '【地灵殿】蘑菇堆'
	| '【地灵殿】水池'
	| '【地灵殿】西南侧酒水架'
	| '【地灵殿】西北侧游乐场'
	| '非【迷途竹林】河流'
	| '非【妖怪兽道】河流'
	| '【红魔馆】河流'
	| '【红魔馆】露水点'
	| '【红魔馆】葡萄架'
	| '【辉针城】东侧红豆树'
	| '【辉针城】东侧酒窖'
	| '【辉针城】水涡'
	| '【辉针城】碗之后'
	| '【辉针城】竹笋堆'
	| '【辉针城】竹子'
	| '【旧地狱】捕兽夹'
	| '【旧地狱】鸡窝'
	| '【旧地狱】桥头并蒂莲'
	| '【旧地狱】桥头柠檬树'
	| '【旧地狱】银杏树'
	| '【迷途竹林】蘑菇堆'
	| '【迷途竹林】水涡'
	| '【迷途竹林】西侧泉水'
	| '【迷途竹林】竹笋堆'
	| '【迷途竹林】竹子'
	| '【命莲寺】东北并蒂莲'
	| '【命莲寺】东北莲花池'
	| '【命莲寺】蜂巢'
	| '【命莲寺】西北花丛'
	| '【命莲寺】西南花丛'
	| '【魔法森林】花丛'
	| '【魔法森林】露水点'
	| '【魔法森林】蘑菇堆'
	| '【魔法森林】桃树'
	| '【魔法森林】银杏树'
	| '【魔法森林】中部树根'
	| '【魔界】辣椒丛'
	| '【魔界】魅魔房顶'
	| '【人间之里】鸡窝'
	| '【人间之里】农田'
	| '【人间之里】银杏树'
	| '【神灵庙】北部冰块堆'
	| '【神灵庙】东侧并蒂莲'
	| '【神灵庙】露水点'
	| '【神灵庙】桥头并蒂莲'
	| '【神灵庙】水涡'
	| '【神灵庙】中部栗树'
	| '【神灵庙】中部松树'
	| '【太阳花田】东侧向日葵丛'
	| '【太阳花田】蜂巢'
	| '【太阳花田】露水点'
	| '【太阳花田】蘑菇堆'
	| '【太阳花田】葡萄架'
	| '【太阳花田】树桩'
	| '【太阳花田】桃树'
	| '【太阳花田】温室'
	| '【太阳花田】西北香椿树'
	| '【太阳花田】西侧花丛'
	| '【太阳花田】银杏树'
	| '【太阳花田】中部花丛'
	| '【太阳花田】中部温室'
	| '【妖怪兽道】捕兽夹'
	| '【妖怪兽道】东侧'
	| '【妖怪兽道】东侧山丘（需借道博丽神社）'
	| '【妖怪兽道】蜂巢'
	| '【妖怪兽道】河流'
	| '【妖怪兽道】花丛'
	| '【妖怪兽道】露水点'
	| '【妖怪兽道】南侧码头'
	| '【妖怪兽道】南侧亭子（需借道迷途竹林）'
	| '【妖怪之山】捕兽夹'
	| '【妖怪之山】蜂巢'
	| '【妖怪之山】黑盐'
	| '【妖怪之山】花丛'
	| '【妖怪之山】黄瓜堆'
	| '【妖怪之山】南侧瀑布'
	| '【妖怪之山】西北瀑布'
	| '【妖怪之山】中心瀑布'
	| '【月之都】月虹池';

export type TBeverageTag = IBeverage['tags'][number];
export type TRecipeTag =
	| IRecipe['positiveTags'][number] // eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
	| IRecipe['negativeTags'][number]
	| TTagNeedCalculate
	| '流行喜爱'
	| '流行厌恶';
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

export type TTagStyle = {
	backgroundColor: string;
	borderColor: string;
	color: string;
};

export interface ITagStyle {
	beverage?: TTagStyle;
	negative?: TTagStyle;
	positive?: TTagStyle;
}
