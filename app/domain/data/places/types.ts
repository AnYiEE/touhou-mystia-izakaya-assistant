export type TMapLabel =
	| 'BeastForest'
	| 'HumanVillage'
	| 'HakureiShrine'
	| 'ScarletMansion'
	| 'BambooForest'
	| 'DLC1_MagicForest'
	| 'DLC1_YoukaiMountain'
	| 'DLC2_FormerHell'
	| 'DLC2_EarthSpiritsPalace'
	| 'DLC3_MyourenTemple'
	| 'DLC3_DivineSpiritMausoleum'
	| 'DLC4_GardenOfTheSun'
	| 'DLC4_ShiningNeedleCastle'
	| 'DLC5_LunarCapital'
	| 'DLC5_Makai';

export type TMapDisplayLabel =
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

export type TMerchantLabel =
	| '河童商人'
	| '妖精女仆'
	| '地狱鸦'
	| '地精商人'
	| '小恶魔'
	| '匿名妖精女仆'
	| '不良少年'
	| '鬼商'
	| '美食妖怪兔'
	| '娜兹玲'
	| '上海人形'
	| '小丑'
	| '酒商'
	| '铃瑚'
	| '农户'
	| '清兰'
	| '香霖堂'
	| '道士'
	| '太阳花精'
	| '萌澄果'
	| '蹦蹦跳跳的三妖精'
	| '杂货商人'
	| '“强买强卖”商店'
	| '月兔'
	| '蓬松松爱莲♡魔法店'
	| '雪'
	| '舞';

export type TMapMerchantLabel = Exclude<TMerchantLabel, '“强买强卖”商店'>;

export interface IMapMerchantReference {
	label: TMapMerchantLabel;
	map: TMapLabel;
	specialGuest?: never;
}

export interface ISpecialGuestMerchantReference {
	label: '“强买强卖”商店';
	map?: never;
	specialGuest: 29;
}

export type TMerchantReference =
	| IMapMerchantReference
	| ISpecialGuestMerchantReference;

export type TCollectionPointLabel =
	| '花丛'
	| '蘑菇堆（西侧）'
	| '蘑菇堆（东侧）'
	| '水涡'
	| '桃树'
	| '桃树（蜂蜜）'
	| '桃树（露水）'
	| '西侧守矢分社（祈愿）'
	| '银杏树'
	| '仓库'
	| '酒水架（北侧）'
	| '酒水架（南侧）'
	| '酒水架（西北侧）'
	| '喷泉（东侧）'
	| '喷泉（东北侧）'
	| '喷泉（东南侧）'
	| '喷泉（西侧）'
	| '喷泉（西南侧）'
	| '游乐场'
	| '冰块堆'
	| '露水点'
	| '葡萄架'
	| '水涡（河流右侧）'
	| '水涡（河流左侧）'
	| '红豆树'
	| '酒窖'
	| '水涡（上方）'
	| '水涡（下方）'
	| '碗之后'
	| '月光草'
	| '竹笋堆'
	| '竹子'
	| '捕兽夹（中部）'
	| '捕兽夹（东侧）'
	| '鸡窝'
	| '拱桥（上方）'
	| '拱桥（下方）'
	| '柠檬树'
	| '蘑菇堆'
	| '西侧泉水'
	| '蜂巢'
	| '花丛（西北侧）'
	| '花丛（西南侧）'
	| '莲花池（右侧）'
	| '莲花池（中部右）'
	| '莲花池（中部左）'
	| '莲花池（左侧）'
	| '萝卜'
	| '桃子'
	| '中部树根'
	| '东侧'
	| '东南侧花丛'
	| '河流'
	| '辣椒丛'
	| '魅魔房顶'
	| '西北侧'
	| '西南侧迷宫'
	| '水涡（湖泊右下）'
	| '水涡（湖泊左下）'
	| '水涡（码头左侧）'
	| '农田'
	| '水涡（东侧）'
	| '水涡（拱桥上方）'
	| '水涡（河流上方）'
	| '水涡（木桥西侧）'
	| '水涡（入口楼梯上方）'
	| '水涡（入口楼梯下方）'
	| '西南侧莲花'
	| '中部栗树'
	| '中部松树'
	| '东侧向日葵丛（风祝/尼格罗尼）'
	| '东侧向日葵丛（水獭祭）'
	| '花丛（西侧）'
	| '花丛（中部）'
	| '树桩'
	| '温室'
	| '西北香椿树'
	| '中部温室'
	| '捕兽夹'
	| '东侧山丘（需借道博丽神社）'
	| '东南侧雀酒'
	| '露水点（南侧亭子）'
	| '露水点（小屋后方）'
	| '露水点（小屋前方）'
	| '码头'
	| '南侧亭子（需借道迷途竹林）'
	| '水涡（木桥上方右侧二）'
	| '水涡（木桥上方右侧三）'
	| '水涡（木桥上方右侧四）'
	| '水涡（木桥上方右侧一）'
	| '水涡（木桥上方左侧）'
	| '水涡（码头左上）'
	| '水涡（码头左下）'
	| '黑盐'
	| '黄瓜堆'
	| '南侧瀑布'
	| '西北瀑布'
	| '中心瀑布'
	| '月虹池（右上）'
	| '月虹池（右下）'
	| '月虹池（左上）'
	| '月虹池（左下）';

export interface IMapCollectionPointReference {
	excludedMaps?: never;
	label: TCollectionPointLabel;
	map: TMapLabel;
}

export interface IExcludedMapCollectionPointReference {
	excludedMaps: readonly [TMapLabel, ...TMapLabel[]];
	label: TCollectionPointLabel;
	map?: never;
}

export type TCollectionPointReference =
	| IExcludedMapCollectionPointReference
	| IMapCollectionPointReference;

export type TTaskLabel =
	| '阿求小姐的色纸'
	| '女仆长的采购委托'
	| '月都试炼'
	| '最终收网行动';

export interface ITaskReference {
	task: TTaskLabel;
}
