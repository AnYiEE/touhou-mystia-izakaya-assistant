/* eslint-disable sort-keys */
import type {IPartner} from './types';
import {DARK_MATTER_NAME, TAG_EXPENSIVE} from '@/data/constant';

export const PARTNER_LIST = [
	{
		id: 14,
		name: '幽谷响子',
		description:
			'自古以来就存在于山谷中的、正直又开朗的山彦。似乎因为现在的人类越来越迷信科学，她有些心灰意冷就出家了，如今在命莲寺修行。是我近几年认识的音乐同好。',
		dlc: 0,
		belong: null,
		effect: null,
		from: {
			self: true,
		},
		pay: 5,
		speed: {
			moving: '中等',
			working: '中等',
		},
	},
	{
		id: 18,
		name: '本居小铃',
		description:
			'人间之里古书店“铃奈庵”的店员以及店主之女。对妖怪怀有不可思议的热忱且很有主见，以强势的态度跑到夜雀食堂来打工，是个奇怪的人类小女孩。',
		dlc: 0,
		belong: ['稗田阿求', '上白泽慧音', '茨木华扇'],
		effect: null,
		from: {
			task: '人间之里',
		},
		pay: 5,
		speed: {
			moving: '慢',
			working: '快',
		},
	},
	{
		id: 19,
		name: '高丽野阿吽',
		description:
			'守护神社的狛犬。性格温和，脸上总是洋溢着笑容，看到她就感觉自己的疲劳都被治愈了。似乎还很擅长算账。这么优秀的孩子却没有在神社得到重视，那就到我的夜雀食堂来发光发亮吧！',
		dlc: 0,
		belong: ['博丽灵梦', '伊吹萃香', '比那名居天子'],
		effect: '可以免疫【苏我屠自古】惩罚符卡的击晕效果。',
		from: '解锁地区【红魔馆】后，和博丽灵梦对话。',
		pay: 5,
		speed: {
			moving: '快',
			working: '慢',
		},
	},
	{
		id: 20,
		name: '十六夜咲夜',
		description:
			'红魔馆中唯一的人类，担任着女仆长一职，据说负责了馆内几乎所有的工作…即便如此，她也能把每件事都做得完美而潇洒。因为主人不太可靠，有着咲夜小姐是红魔馆代言人的说法。',
		dlc: 0,
		belong: ['红美铃', '琪露诺', '帕秋莉'],
		effect: null,
		from: '解锁地区【红魔馆】后，完成蕾米莉亚的试炼。',
		pay: 10,
		speed: {
			moving: '瞬间移动',
			working: '快',
		},
	},
	{
		id: 21,
		name: '铃仙',
		description:
			'来自月亮的妖怪兔，有着优雅而挺拔的身姿，和地上的妖兽的气质大不相同。性格温和但似乎不太亲近人类，以妖兽来说反应也不算快，总是被帝欺负。',
		dlc: 0,
		belong: ['藤原妹红', '蓬莱山辉夜', '因幡帝'],
		effect: '顾客小费增加20%。',
		from: {
			task: '迷途竹林',
		},
		pay: 10,
		speed: {
			moving: '快',
			working: '中等',
		},
	},
	{
		id: 39,
		name: '魂魄妖梦',
		description:
			'侍奉着冥界之主的庭师兼侍卫、厨师…也就是说，她不仅要一个人照顾两百由旬的西行寺庭院，还要守卫西行寺家以及主人的安危，同时还要照顾大胃王主人的饮食需求！无论哪一个都是重担呢，希望她能在夜雀食堂得到一些治愈吧！',
		dlc: 0,
		belong: ['魂魄妖梦'],
		effect: '料理台的料理瞬间完成。',
		from: '完成主线剧情后，和地区【白玉楼】的魂魄妖梦对话，选择“重修「第二次试炼」”。',
		pay: 10,
		speed: {
			moving: '快',
			working: '快',
		},
	},
	{
		id: 1006,
		name: '键山雏',
		description:
			'为了不让厄运转移到人类身上而收集厄运的厄神。虽然名字里有个神，但其实和我一样是妖怪。明明是妖怪却满心满意为人类着想，真不可思议。这样的她还要遭受人类的排斥，实在太可怜了。最近为了进行抑制厄的修行而到夜雀食堂打工。',
		dlc: 1,
		belong: ['河城荷取', '犬走椛', '东风谷早苗'],
		effect: `瞬间完成料理，但有15%的概率制作出${DARK_MATTER_NAME}。可以将【苏我屠自古】惩罚符卡的击晕效果转移至其他伙伴。`,
		from: {
			place: '妖怪之山',
		},
		pay: 0,
		speed: {
			moving: '慢',
			working: '中等',
		},
	},
	{
		id: 1007,
		name: '梦子',
		description:
			'虽然是女仆打扮，但气势非常强，不愧是魔界之主创造的最高级的魔物。性格直爽，有时候表现出一副冷酷凶狠的样子，其实是刀子嘴豆腐心。因为想要理解爱丽丝，所以来到夜雀食堂打工。内心应该是一个很温柔的人吧。',
		dlc: 1,
		belong: ['雾雨魔理沙', '爱丽丝', '矢田寺成美'],
		effect: '使用飞刀投掷上菜（包括酒水）。',
		from: {
			place: '魔法森林',
		},
		pay: 5,
		speed: {
			moving: '中等',
			working: '快',
		},
	},
	{
		id: 2007,
		name: '琪斯美',
		description:
			'走在夜路上的时候突然从正上方掉落，撞在头顶上的古典的妖怪。性格内向，非常喜欢狭窄的地方所以一直都在桶里，似乎是这样比较有安全感？虽然不善言辞，但确实在努力地修炼着呢。',
		dlc: 2,
		belong: ['黑谷山女', '水桥帕露西', '星熊勇仪'],
		effect: '【钓瓶落之怪】驱赶普通顾客时不会受到不良影响，但会收不到钱。',
		from: {
			place: '旧地狱',
		},
		pay: 5,
		speed: {
			moving: '中等',
			working: '中等',
		},
	},
	{
		id: 2008,
		name: '小野冢小町',
		description:
			'担任三途之河的摆渡人一职的死神，似乎专门负责引渡幻想乡中人类的灵魂。因为工作态度总是不紧不慢的样子，被阎魔派来旧地狱历练，最后辗转来到了夜雀食堂。虽然懒惰成性，不过性格非常爽朗，也爱聊天，是个很好相处的伙伴。如果工作能再认真一点儿就好了。',
		dlc: 2,
		belong: ['古明地觉', '火焰猫燐', '灵乌路空'],
		effect: '【八重雾中渡】工作时会摸鱼，但顾客试图落座时会被立即拉到桌子旁。到【星熊勇仪】处泡温泉后，可使当晚工作时不会再摸鱼。',
		from: {
			place: '地灵殿',
		},
		pay: 0,
		speed: {
			moving: '慢',
			working: '慢',
		},
	},
	{
		id: 3006,
		name: '云居一轮',
		description:
			'能够使役入道的入道使，命莲寺的后厨担当。一轮小姐头脑明晰，沉着冷静。据说原本是个修炼魔法的人类，不知道为什么变成了入道使这种少见的妖怪，但似乎依然保留着人类的心。',
		dlc: 3,
		belong: ['多多良小伞', '村纱水蜜', '封兽鵺'],
		effect: '【双人成行】召唤云山和自己一起工作。',
		from: {
			place: '命莲寺',
		},
		pay: 5,
		speed: {
			moving: '中等',
			working: '快',
		},
	},
	{
		id: 3008,
		name: '宫古芳香',
		description:
			'死后被邪仙操纵着的僵尸，因为被施加了防腐的咒语所以不会腐烂。性格不明，大概已经没有自我了吧？经常念叨一些谁也听不懂的话，不过干活的力气很大！就是吃得有点儿多。',
		dlc: 3,
		belong: ['物部布都', '霍青娥', '苏我屠自古'],
		effect: `吃掉${DARK_MATTER_NAME}。每吃一份，全速度增加20%，直到200%。`,
		from: {
			place: '神灵庙',
		},
		pay: 0,
		speed: {
			moving: '慢',
			working: '慢',
		},
	},
	{
		id: 4009,
		name: '拉尔瓦',
		description:
			'凤蝶的妖精。性格似乎比一般的妖精要成熟，而且有种迷雾重重的感觉…应该是错觉吧？虽然看起来娴静温厚，不过骨子里还是喜欢恶作剧，希望她工作的时候不会捣蛋吧！',
		dlc: 4,
		belong: ['射命丸文', '梅蒂欣', '风见幽香'],
		effect: `【鳞粉乃梦泉】每隔30秒，拉尔瓦会在场上播撒一次持续15秒的催眠粉。期间稀有顾客在用餐时会忘掉自己的点单，普通顾客会爱上“${TAG_EXPENSIVE}”标签并在用餐时返还当次消耗掉的料理预算。`,
		from: {
			place: '太阳花田',
		},
		pay: 5,
		speed: {
			moving: '快',
			working: '中等',
		},
	},
	{
		id: 4010,
		name: '赤蛮奇',
		description:
			'能让头飞出去的古典妖怪辘轳首！在村落里混在人类当中生活，性格方面自尊心有点儿高，与人类和妖怪都没法打成一片，差点儿就去当不良少女了…结果却来了夜雀食堂，真是个果决的性格呢。',
		dlc: 4,
		belong: ['少名针妙丸', '鬼人正邪', '今泉影狼'],
		effect: '【分头行动】作为厨师时，赤蛮奇会分出两个头进行传菜和酒水工作；作为传菜或酒水时，会分出一个头进行另一项工作。移动速度随着头的数量减少而提升，工作速度随着头的数量减少而下降。同时，可受到【少名针妙丸】施加的“万宝槌之力”影响，使移动速度提高200%。',
		from: {
			place: '辉针城',
		},
		pay: 7,
		speed: {
			moving: '中等',
			working: '中等',
		},
	},
	{
		id: 5006,
		name: '哆来咪',
		description: '支配着梦境世界的梦貘。平时栖息于梦境世界，为了维护秩序而监视着生物的梦。',
		dlc: 5,
		belong: ['铃仙', '绵月丰姬', '绵月依姬'],
		effect: '【捕梦之网】依照顾客评价生成梦境能量，哆来咪吸收这些能量以提升自身制作料理的速度和返还食材的概率。',
		from: {
			place: '月之都',
		},
		pay: 10,
		speed: {
			moving: '慢',
			working: '慢',
		},
	},
	{
		id: 5007,
		name: '萨拉',
		description:
			'魔界的守门人。在魔界人之中实力不太强，性格很容易心软。经常作顺水人情放走偷溜出来的魔界住民，比如爱莲、露易兹…据说爱丽丝当初也是她偷偷放出去的。',
		dlc: 5,
		belong: ['爱莲', '魅魔', '露易兹'],
		effect: '【时盛运旺】处于“热火朝天”状态时，萨拉将阻止普通顾客来店，并每隔一段时间从整个幻想乡随机邀请稀有顾客来店。',
		from: {
			place: '魔界',
		},
		pay: 7,
		speed: {
			moving: '快',
			working: '中等',
		},
	},
] as const satisfies IPartner[];
