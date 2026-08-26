import type { IFishingCollectible } from './schema';

/* eslint-disable sort-keys -- Keep identity, display, DLC, then category details as the record data-table column order. */
export const FISHING_COLLECTIBLE_RECORDS = [
	{
		id: 4100,
		name: '断裂的罪人锁链',
		description:
			'地狱用来关押罪犯的道具。上面残留着一股让人颤栗的怨念，破裂的断口似乎预示着不详的信息。',
		dlc: 4,
		map: 'BeastForest',
		requiredContentDlc: 0,
	},
	{
		id: 4101,
		name: '鲱鱼罐头',
		description:
			'外界流行的奇怪东西，没打开时天清地朗，一旦掀开一个小口，感觉马上就要去三途川报道了。',
		dlc: 4,
		map: 'HumanVillage',
		requiredContentDlc: 1,
	},
	{
		id: 4102,
		name: '遗忘的帽子',
		description:
			'只有冬天才会出现的神秘妖怪留下的帽子，她在春天时到底去哪里了呢？',
		dlc: 4,
		map: 'BeastForest',
		requiredContentDlc: 0,
	},
	{
		id: 4104,
		name: '山茶花发饰',
		description:
			'似乎是某个熟人经常佩戴的东西，但到底是谁呢？……感觉马上就要想起来了。',
		dlc: 4,
		map: 'HumanVillage',
		requiredContentDlc: 0,
	},
	{
		id: 4105,
		name: '鲸鱼帽子',
		description:
			'人类村子的酒馆“鲵吞亭”看板娘的帽子。据说深夜时分，那里会变成妖怪专用酒馆“蚕食鲵吞亭”。',
		dlc: 4,
		map: 'HumanVillage',
		requiredContentDlc: 0,
	},
	{
		id: 4106,
		name: '冻青蛙',
		description: '被冻在冰里的青蛙，想必是某个笨蛋妖精的恶作剧。',
		dlc: 4,
		map: 'ScarletMansion',
		requiredContentDlc: 0,
	},
	{
		id: 4107,
		name: '窃贼遗漏的魔法书',
		description:
			'据知情者说，这是某个刚从红魔馆满载而归的“黑白大盗”遗落的魔法书，书上厚重的魔力保护了书免遭水的侵蚀。',
		dlc: 4,
		map: 'ScarletMansion',
		requiredContentDlc: 0,
	},
	{
		id: 4108,
		name: '儿童座椅',
		description:
			'人类小孩吃饭时常用的防摔餐椅，奇怪的是，上面竟然隐约缠绕着一缕吸血鬼的魔力。',
		dlc: 4,
		map: 'ScarletMansion',
		requiredContentDlc: 0,
	},
	{
		id: 4109,
		name: '破损的阴阳玉',
		description: '据说是永夜异变时，博丽的巫女在竹林中战斗时留下的道具。',
		dlc: 4,
		map: 'BambooForest',
		requiredContentDlc: 0,
	},
	{
		id: 4110,
		name: '破损的金平糖罐',
		description: '据说是永夜异变时，森林的魔法使在竹林中战斗时留下的痕迹。',
		dlc: 4,
		map: 'BambooForest',
		requiredContentDlc: 0,
	},
	{
		id: 4111,
		name: '可拆卸耳朵',
		description: '看起来像是兔子的耳朵……这种耳朵原来是可拆卸的吗！？',
		dlc: 4,
		map: 'BambooForest',
		requiredContentDlc: 0,
	},
	{
		id: 4112,
		name: '空白卡牌',
		description: '不知道是做什么用的空白卡牌。',
		dlc: 4,
		map: 'DLC1_YoukaiMountain',
		requiredContentDlc: 1,
	},
	{
		id: 4113,
		name: '神奇手套',
		description:
			'河童们发明的手套，比空手作业时有更好的精度和稳定性，还能吸附小零件。',
		dlc: 4,
		map: 'DLC1_YoukaiMountain',
		requiredContentDlc: 1,
	},
	{
		id: 4114,
		name: '河童的假发',
		description: '似乎钓上了什么河童们的终极机密……',
		dlc: 4,
		map: 'DLC1_YoukaiMountain',
		requiredContentDlc: 1,
	},
	{
		id: 4115,
		name: '附魔钓鱼竿',
		description: '散发着诅咒气息的钓竿。咦……？我用钓竿钓上了钓竿？',
		dlc: 4,
		map: 'DLC1_MagicForest',
		requiredContentDlc: 1,
	},
	{
		id: 4116,
		name: '谜之盾牌仿制品',
		description:
			'上海人形进行防御行为时手持的盾牌，该盾牌造型据说参考了某个次元里的一年战争期间某令人闻风丧胆的恶魔所装备的盾牌……',
		dlc: 4,
		map: 'DLC1_MagicForest',
		requiredContentDlc: 1,
	},
	{
		id: 4117,
		name: '天丛云剑',
		description:
			'上古三大神器之一、破魔的神剑！在遥远的过去还流传着得神剑者得天下的传闻。',
		dlc: 4,
		map: 'DLC1_MagicForest',
		requiredContentDlc: 1,
	},
	{
		id: 4118,
		name: '血池地狱旅游传单',
		description:
			'上面写着“传说寄宿着邪恶猛兽的血池地狱一日游！详情请咨询依神姐妹旅社”的字样。',
		dlc: 4,
		map: 'DLC2_FormerHell',
		requiredContentDlc: 2,
	},
	{
		id: 4119,
		name: '旧地狱花魁的明信片',
		description:
			'旧地狱温泉街消费一定金额获赠的花魁的签名明信片，地底公认最强最美的人才能印在上面。',
		dlc: 4,
		map: 'DLC2_FormerHell',
		requiredContentDlc: 2,
	},
	{
		id: 4120,
		name: '审判账',
		description:
			'写着许多人类寿命极限的超可怕的道具……划掉名字的话是不是就可以永生了？',
		dlc: 4,
		map: 'DLC2_FormerHell',
		requiredContentDlc: 2,
	},
	{
		id: 4121,
		name: '仿制的希望之面',
		description:
			'附近的住民说前阵子常见到这个面具的制作者在把玩它，但谁也想不起来那个人到底是谁。面具上的模样似乎是一位擅长能乐的付丧神。',
		dlc: 4,
		map: 'DLC2_EarthSpiritsPalace',
		requiredContentDlc: 2,
	},
	{
		id: 4122,
		name: '紫色的电话机',
		description: '有着恐怖都市传说的道具，如果有一天突然响了，也不要去听。',
		dlc: 4,
		map: 'DLC2_EarthSpiritsPalace',
		requiredContentDlc: 2,
	},
	{
		id: 4123,
		name: '猫猫胸针',
		description: '以阿燐形象制作的地底纪念品，非常可爱，很有人气！',
		dlc: 4,
		map: 'DLC2_EarthSpiritsPalace',
		requiredContentDlc: 2,
	},
	{
		id: 4124,
		name: '没底的舀子',
		description:
			'传闻在航行中遭遇船幽灵攻击时，只要给她一把没有底的舀子，就能逃出一劫。',
		dlc: 4,
		map: 'DLC3_MyourenTemple',
		requiredContentDlc: 3,
	},
	{
		id: 4125,
		name: '宝塔',
		description:
			'星小姐经常拿在手里的宝塔，据响子说她经常把它弄丢，还嘱咐捡到的人千万不要告诉娜兹玲小姐。',
		dlc: 4,
		map: 'DLC3_MyourenTemple',
		requiredContentDlc: 3,
	},
	{
		id: 4126,
		name: '摩托车钥匙',
		description:
			'钥匙上篆刻着经文，据响子说它能驱动潜伏在寺院里的巨大黑色怪兽……',
		dlc: 4,
		map: 'DLC3_MyourenTemple',
		requiredContentDlc: 3,
	},
	{
		id: 4127,
		name: '没写完的符咒',
		description:
			'青娥小姐给僵尸写的符咒，但这个写到一半就丢弃了，上面好像写着“给我变……！”等字样。',
		dlc: 4,
		map: 'DLC3_DivineSpiritMausoleum',
		requiredContentDlc: 3,
	},
	{
		id: 4128,
		name: '鸭子救生圈',
		description:
			'为了克服僵尸对水的弱点，青娥小姐特意研究了这种可以浮水的道具。',
		dlc: 4,
		map: 'DLC3_DivineSpiritMausoleum',
		requiredContentDlc: 3,
	},
	{
		id: 4129,
		name: '旧时的古币',
		description:
			'在神子时代的一捆钱，受圣人的护佑没有受损。虽然数额很大，但在现代一毛不值。',
		dlc: 4,
		map: 'DLC3_DivineSpiritMausoleum',
		requiredContentDlc: 3,
	},
	{
		id: 4130,
		name: '陈旧的破帽子',
		description:
			'分不清是魔法帽还是睡帽，看着很残破了，品味和造型也很奇怪。',
		dlc: 4,
		map: 'HakureiShrine',
		requiredContentDlc: 0,
	},
	{
		id: 4131,
		name: '六芒星十字架',
		description: '微微发着光，很好看的装饰物，但是有强烈人类的气息和灵力？',
		dlc: 4,
		map: 'HakureiShrine',
		requiredContentDlc: 0,
	},
	{
		id: 4132,
		name: '星月睡帽',
		description:
			'有着星星和月亮图案的帽子，散发着让妖怪也齿冻胆寒的妖力……可谓沉眠的恐怖。',
		dlc: 4,
		map: 'HakureiShrine',
		requiredContentDlc: 0,
	},
	{
		id: 4133,
		name: '鼓棒',
		description:
			'在幻想乡少见的打击乐器的鼓棒，上面有特殊的雷纹，从上面的痕迹可以看出它原主人夜以继日的练习量。',
		dlc: 4,
		map: 'DLC4_GardenOfTheSun',
		requiredContentDlc: 4,
	},
	{
		id: 4134,
		name: '荧光棒',
		description:
			'Live活动用来提升现场气氛的道具，目前已经失去了电力，再也无法点亮。',
		dlc: 4,
		map: 'DLC4_GardenOfTheSun',
		requiredContentDlc: 4,
	},
	{
		id: 4135,
		name: '秘密写真底片',
		description:
			'文文小姐用她高超的摄影技术拍下的「〇〇」的「〇〇」照片，可惜只能在另一个叫华彩乱战2的世界里才能将其念写成型。',
		dlc: 4,
		map: 'DLC4_GardenOfTheSun',
		requiredContentDlc: 4,
	},
	{
		id: 4136,
		name: '通缉令',
		description:
			'画着正邪头像的通缉令，赏金是¥1000。据说不久之前只有¥100。',
		dlc: 4,
		map: 'DLC4_ShiningNeedleCastle',
		requiredContentDlc: 4,
	},
	{
		id: 4137,
		name: '航海家帽子',
		description:
			'在混混中非常流行的帽子，已经很破旧了。但为什么混混都喜欢这种风格呢？不解……',
		dlc: 4,
		map: 'DLC4_ShiningNeedleCastle',
		requiredContentDlc: 4,
	},
	{
		id: 4138,
		name: '万宝槌（赝品）',
		description:
			'正邪批量生产的万宝槌，虽然没有小人族的魔力，但是打架时对着对方脑袋上来一槌可比魔法好使多了！',
		dlc: 4,
		map: 'DLC4_ShiningNeedleCastle',
		requiredContentDlc: 4,
	},
	{
		id: 4139,
		name: '奇怪的鱼',
		description:
			'长得很好笑！因为太好笑了都舍不得用来做菜！就这样养在水里，平时不开心了看看它就会笑出来！真是太好玩了！',
		dlc: 4,
		map: 'BeastForest',
		requiredContentDlc: 0,
	},
	{
		id: 4140,
		name: '白色的塑料椅',
		description: '看到这把椅子就会有一种坐在上面背对来客的冲动。',
		dlc: 4,
		map: 'DLC5_Makai',
		requiredContentDlc: 5,
	},
	{
		id: 4141,
		name: '四次元阳电子炸弹',
		description: '上面标记着“失效的地球破坏用”字样，看起来已经没用了。',
		dlc: 4,
		map: 'DLC5_Makai',
		requiredContentDlc: 5,
	},
	{
		id: 4142,
		name: '战车模型',
		description:
			'某个工程师手工制作的战车模型。如果按比例放大以后批量生产，会是很恐怖的战斗力吧？',
		dlc: 4,
		map: 'DLC5_Makai',
		requiredContentDlc: 5,
	},
	{
		id: 4143,
		name: '社团观察记录',
		description:
			'一份报告：档案编号No.1209，检测到地球上某个俱乐部正在观察月球，未发现其威胁，不予归档。',
		dlc: 4,
		map: 'DLC5_LunarCapital',
		requiredContentDlc: 5,
	},
	{
		id: 4144,
		name: '恒常燃烧的火炬',
		description:
			'在静海里也永不熄灭的火炬，火焰向静寂的宇宙喷薄着惊人的狂气，仿佛生命力狂放一般。',
		dlc: 4,
		map: 'DLC5_LunarCapital',
		requiredContentDlc: 5,
	},
	{
		id: 4145,
		name: '遗留的酒瓶',
		description:
			'写着“千年古酒”字样的空酒瓶。虽然被喝得一滴不剩，但依然散发着地上罕见的醇香味。',
		dlc: 4,
		map: 'DLC5_LunarCapital',
		requiredContentDlc: 5,
	},
] as const satisfies Array<IFishingCollectible<number>>;
/* eslint-enable sort-keys */

export const FISHING_COLLECTIBLE_LIST =
	FISHING_COLLECTIBLE_RECORDS satisfies IFishingCollectible[];
