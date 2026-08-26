/* eslint-disable sort-keys */
export const MERCHANT_LABEL_MAP = {
	ThreeFairies: '蹦蹦跳跳的三妖精',
	MengChengGuo: '萌澄果',
	Merchant_BeastForest: '杂货商人',
	WineMerchant_HumanVillage: '酒商',
	Merchant_Ringo: '铃瑚',
	Merchant_HumanVillage: '农户',
	Merchant_Seiran: '清兰',
	Rinnosuke: '香霖堂',
	WineMerchant_HakureiShrine: '河童商人',
	Merchant_Maid: '妖精女仆',
	Merchant_Goblin: '地精商人',
	Yousei_Tired: '匿名妖精女仆',
	Koakuma: '小恶魔',
	Merchant_YokaiRabbitDelicacy: '美食妖怪兔',
	Merchant_MagicForest_Shanghai: '上海人形',
	Merchant_YoukaiMountain_Kappa: '河童商人',
	Merchant_FormerHell_Ghost: '鬼商',
	Merchant_EarthSpiritsPalace_HellCrow: '地狱鸦',
	Merchant_MyourenTemple_Nazrin: '娜兹玲',
	Merchant_DivineSpiritMausoleum_Taoist: '道士',
	Merchant_GardenOfTheSun_SunFairy: '太阳花精',
	Merchant_ShiningNeedleCastle_FuRyouShounenn: '不良少年',
	Merchant_LunarCapital_MoonRabbit: '月兔',
	DLC5_Makai_Merchant_Ellen_MagicShop: '蓬松松爱莲♡魔法店',
	Merchant_Makai_Clown: '小丑',
} as const;
/* eslint-enable sort-keys */

export type TMerchantLabel = keyof typeof MERCHANT_LABEL_MAP;
