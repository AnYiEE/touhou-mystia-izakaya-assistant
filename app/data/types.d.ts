import { type DYNAMIC_TAG_MAP } from '@/data/constant';

import type { IBeverage } from '@/data/beverages/types';
import type { IIngredient } from '@/data/ingredients/types';
import type { IRecipe } from '@/data/recipes/types';

/** @description The meaning of "DLC 0" here refers to the base game. */
type TDlc = 0 | 1 | 2 | 2.5 | 3 | 4 | 5;

type TLevel = 1 | 2 | 3 | 4 | 5 | 10;

type TCollectionLocation =
	| '【博丽神社】花丛'
	| '【博丽神社】蘑菇堆（西侧）'
	| '【博丽神社】蘑菇堆（东侧）'
	| '【博丽神社】水涡'
	| '【博丽神社】桃树'
	| '【博丽神社】西侧守矢分社（祈愿）'
	| '【博丽神社】银杏树'
	| '【地灵殿】仓库'
	| '【地灵殿】酒水架（北侧）'
	| '【地灵殿】酒水架（南侧）'
	| '【地灵殿】酒水架（西北侧）'
	| '【地灵殿】喷泉（东侧）'
	| '【地灵殿】喷泉（东北侧）'
	| '【地灵殿】喷泉（东南侧）'
	| '【地灵殿】喷泉（西侧）'
	| '【地灵殿】喷泉（西南侧）'
	| '【地灵殿】游乐场'
	| '【红魔馆】冰块堆'
	| '【红魔馆】露水点'
	| '【红魔馆】葡萄架'
	| '【红魔馆】水涡（河流右侧）'
	| '【红魔馆】水涡（河流左侧）'
	| '【辉针城】红豆树'
	| '【辉针城】酒窖'
	| '【辉针城】水涡（上方）'
	| '【辉针城】水涡（下方）'
	| '【辉针城】碗之后'
	| '【辉针城】月光草'
	| '【辉针城】竹笋堆'
	| '【辉针城】竹子'
	| '【旧地狱】捕兽夹（中部）'
	| '【旧地狱】捕兽夹（东侧）'
	| '【旧地狱】鸡窝'
	| '【旧地狱】拱桥（上方）'
	| '【旧地狱】拱桥（下方）'
	| '【旧地狱】柠檬树'
	| '【旧地狱】银杏树'
	| '【迷途竹林】蘑菇堆'
	| '【迷途竹林】水涡'
	| '【迷途竹林】西侧泉水'
	| '【迷途竹林】竹笋堆'
	| '【迷途竹林】竹子'
	| '【命莲寺】蜂巢'
	| '【命莲寺】花丛（西北侧）'
	| '【命莲寺】花丛（西南侧）'
	| '【命莲寺】莲花池（右侧）'
	| '【命莲寺】莲花池（中部右）'
	| '【命莲寺】莲花池（中部左）'
	| '【命莲寺】莲花池（左侧）'
	| '【魔法森林】露水点'
	| '【魔法森林】萝卜'
	| '【魔法森林】蘑菇堆'
	| '【魔法森林】桃子'
	| '【魔法森林】银杏树'
	| '【魔法森林】中部树根'
	| '【魔界】东侧'
	| '【魔界】东南侧花丛'
	| '【魔界】蜂巢'
	| '【魔界】河流'
	| '【魔界】辣椒丛'
	| '【魔界】露水点'
	| '【魔界】魅魔房顶'
	| '【魔界】蘑菇堆'
	| '【魔界】西北侧'
	| '【魔界】西南侧迷宫'
	| '【魔界】银杏树'
	| '【人间之里】水涡（湖泊右下）'
	| '【人间之里】水涡（湖泊左下）'
	| '【人间之里】水涡（码头左侧）'
	| '【人间之里】鸡窝'
	| '【人间之里】农田'
	| '【人间之里】银杏树'
	| '【神灵庙】冰块堆'
	| '【神灵庙】拱桥（下方）'
	| '【神灵庙】露水点'
	| '【神灵庙】水涡（东侧）'
	| '【神灵庙】水涡（拱桥上方）'
	| '【神灵庙】水涡（河流上方）'
	| '【神灵庙】水涡（木桥西侧）'
	| '【神灵庙】水涡（入口楼梯上方）'
	| '【神灵庙】水涡（入口楼梯下方）'
	| '【神灵庙】西南侧莲花'
	| '【神灵庙】中部栗树'
	| '【神灵庙】中部松树'
	| '【太阳花田】东侧向日葵丛（风祝/尼格罗尼）'
	| '【太阳花田】东侧向日葵丛（水獭祭）'
	| '【太阳花田】蜂巢'
	| '【太阳花田】花丛（西侧）'
	| '【太阳花田】花丛（中部）'
	| '【太阳花田】露水点'
	| '【太阳花田】蘑菇堆'
	| '【太阳花田】葡萄架'
	| '【太阳花田】树桩'
	| '【太阳花田】桃树'
	| '【太阳花田】温室'
	| '【太阳花田】西北香椿树'
	| '【太阳花田】银杏树'
	| '【太阳花田】月光草'
	| '【太阳花田】中部温室'
	| '【妖怪兽道】捕兽夹'
	| '【妖怪兽道】东侧山丘（需借道博丽神社）'
	| '【妖怪兽道】东南侧雀酒'
	| '【妖怪兽道】蜂巢'
	| '【妖怪兽道】花丛'
	| '【妖怪兽道】露水点（南侧亭子）'
	| '【妖怪兽道】露水点（小屋后方）'
	| '【妖怪兽道】露水点（小屋前方）'
	| '【妖怪兽道】码头'
	| '【妖怪兽道】南侧亭子（需借道迷途竹林）'
	| '【妖怪兽道】水涡（木桥上方右侧二）'
	| '【妖怪兽道】水涡（木桥上方右侧三）'
	| '【妖怪兽道】水涡（木桥上方右侧四）'
	| '【妖怪兽道】水涡（木桥上方右侧一）'
	| '【妖怪兽道】水涡（木桥上方左侧）'
	| '【妖怪兽道】水涡（码头左上）'
	| '【妖怪兽道】水涡（码头左下）'
	| '【妖怪之山】捕兽夹'
	| '【妖怪之山】蜂巢'
	| '【妖怪之山】黑盐'
	| '【妖怪之山】花丛'
	| '【妖怪之山】黄瓜堆'
	| '【妖怪之山】南侧瀑布'
	| '【妖怪之山】西北瀑布'
	| '【妖怪之山】中心瀑布'
	| '【月之都】桃树'
	| '【月之都】月虹池（右上）'
	| '【月之都】月虹池（右下）'
	| '【月之都】月虹池（左上）'
	| '【月之都】月虹池（左下）'
	| '非【迷途竹林】河流'
	| '非【妖怪兽道】河流';

export type TMerchant =
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
	| '【因幡帝】“强买强卖”商店'
	| '【月之都】月兔'
	| '【魔界】蓬松松爱莲♡魔法店';

type TTask =
	| '阿求小姐的色纸'
	| '女仆长的采购委托'
	| '月都试炼'
	| '最终收网行动';

type TTagNeedCalculate =
	| (typeof DYNAMIC_TAG_MAP)['economical']
	| (typeof DYNAMIC_TAG_MAP)['expensive'];
type TPopularTag =
	| (typeof DYNAMIC_TAG_MAP)['popularNegative']
	| (typeof DYNAMIC_TAG_MAP)['popularPositive'];

type TBeverageTag = IBeverage['tags'][number];
type TIngredientTag = IIngredient['tags'][number] | TPopularTag;
type TRecipeTag =
	| IRecipe['positiveTags'][number] // eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
	| IRecipe['negativeTags'][number]
	| TTagNeedCalculate
	| TPopularTag;

type TPlace =
	| '妖怪兽道'
	| '人间之里'
	| '博丽神社'
	| '红魔馆'
	| '迷途竹林'
	| '魔法森林'
	| '妖怪之山'
	| '旧地狱'
	| '地灵殿'
	| '命莲寺'
	| '神灵庙'
	| '太阳花田'
	| '辉针城'
	| '月之都'
	| '魔界';

type TRewardType = '摆件' | '采集' | '厨具' | '伙伴' | '料理' | '衣服';

type TSpeed = '慢' | '中等' | '快' | '瞬间移动';

export type TDescription =
	| `${string}。`
	| `${string}？`
	| `${string}！`
	| `${string}…`;

export interface IItemBase {
	id: number;
	name: string;
	description:
		| TDescription
		| [TDescription, TDescription | null, TDescription | null];
	dlc: TDlc;
}

export interface ICustomerBase extends IItemBase {
	chat: TDescription[];
	places: TPlace[];
	positiveTags: TRecipeTag[];
	beverageTags: TBeverageTag[];
}

interface IFoodFrom {
	/** @description If it is an array, the first element represents the merchant selling the item, and the second element represents the probability of sale. */
	buy: Array<TMerchant | [TMerchant, boolean | number]>;
	/** @description If it is an array, the first element represents the collection location, and the second element represents the probability of acquisition. If there are two additional elements, they represent the time points for the appearance and disappearance of the collection location. */
	collect: Array<
		| TCollectionLocation
		| [TCollectionLocation, boolean | number]
		| [TCollectionLocation, boolean | number, number, number]
	>;
	fishing: TPlace[];
	fishingAdvanced: TPlace[];
	task: TTask[];
}

export interface IFoodBase extends IItemBase {
	level: TLevel;
	price: number;
	from: Partial<IFoodFrom>;
}

export interface ITagStyleConfig {
	backgroundColor: string;
	borderColor: string;
	color: string;
}

export interface ITagStyle {
	beverage?: ITagStyleConfig;
	negative?: ITagStyleConfig;
	positive?: ITagStyleConfig;
}
