/* eslint-disable sort-keys */
import type {IPartner} from './types';
import {DARK_MATTER_NAME, TAG_EXPENSIVE} from '@/data/constant';

export const PARTNER_LIST = [
	{
		name: '幽谷响子',
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
		name: '本居小铃',
		dlc: 0,
		belong: '茨木华扇',
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
		name: '高丽野阿吽',
		dlc: 0,
		belong: '博丽灵梦',
		effect: '可以免疫【苏我屠自古】惩罚符卡的击晕效果。',
		from: '解锁地区【红魔馆】后，和博丽灵梦对话',
		pay: 5,
		speed: {
			moving: '快',
			working: '慢',
		},
	},
	{
		name: '十六夜咲夜',
		dlc: 0,
		belong: '帕秋莉',
		effect: null,
		from: '完成蕾米莉亚的试炼',
		pay: 10,
		speed: {
			moving: '瞬间移动',
			working: '快',
		},
	},
	{
		name: '铃仙',
		dlc: 0,
		belong: '因幡帝',
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
		name: '魂魄妖梦',
		dlc: 0,
		belong: '魂魄妖梦',
		effect: '料理台的料理瞬间完成。',
		from: '完成主线剧情后，和地区【白玉楼】的魂魄妖梦对话，并完成第二场试炼',
		pay: 10,
		speed: {
			moving: '快',
			working: '快',
		},
	},
	{
		name: '键山雏',
		dlc: 1,
		belong: '河城荷取',
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
		name: '梦子',
		dlc: 1,
		belong: '爱丽丝',
		effect: '使用飞刀投掷上菜。',
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
		name: '琪斯美',
		dlc: 2,
		belong: '黑谷山女',
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
		name: '小野冢小町',
		dlc: 2,
		belong: '古明地觉',
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
		name: '云居一轮',
		dlc: 3,
		belong: '多多良小伞',
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
		name: '宫古芳香',
		dlc: 3,
		belong: '霍青娥',
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
		name: '拉尔瓦',
		dlc: 4,
		belong: '风见幽香',
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
		name: '赤蛮奇',
		dlc: 4,
		belong: '鬼人正邪',
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
		name: '哆来咪',
		dlc: 5,
		belong: '绵月依姬',
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
		name: '萨拉',
		dlc: 5,
		belong: '魅魔',
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
