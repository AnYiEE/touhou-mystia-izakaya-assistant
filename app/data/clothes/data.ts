/* eslint-disable sort-keys */
import type {IClothes} from './types';

export const CLOTHES_LIST = [
	{
		id: -1,
		name: '夜雀服',
		description: '米斯蒂娅平常穿的衣服。',
		dlc: 0,
		gif: false,
		izakaya: false,
		from: [
			{
				self: true,
			},
		],
	},
	{
		id: -2,
		name: '雀酒屋工作装',
		description: '米斯蒂娅工作时穿的衣服。一般情况下会在工作时换上。',
		dlc: 0,
		gif: false,
		izakaya: false,
		from: [
			{
				self: true,
			},
		],
	},
	{
		id: 23,
		name: '黑色套装',
		description: '有着宵暗妖怪风格的服饰套装。但其实只是把原来的衣服染黑了而已，眼罩倒是很有趣。',
		dlc: 0,
		gif: true,
		izakaya: false,
		from: [
			{
				bond: '露米娅',
			},
		],
	},
	{
		id: 24,
		name: '中华风校服',
		description: '上白泽慧音利用学童们用剩下的布料缝制而成的衣裳。似乎是中国某个时代，女孩子开始读书时候穿的衣服。',
		dlc: 0,
		gif: false,
		izakaya: false,
		from: [
			{
				bond: '上白泽慧音',
			},
		],
	},
	{
		id: 25,
		name: '褪色的巫女服',
		description:
			'博丽灵梦收拾仓库时找到的有点儿褪色的旧巫女服。穿上后感觉自己多少能体会到巫女的身份之重，但绝不可以自称巫女。',
		dlc: 0,
		gif: false,
		izakaya: false,
		from: [
			{
				bond: '博丽灵梦',
			},
		],
	},
	{
		id: 26,
		name: '睡衣',
		description: '帕秋莉·诺蕾姬送的舒服又保暖的家居服，穿上就不想脱下来了。',
		dlc: 0,
		gif: false,
		izakaya: false,
		from: [
			{
				bond: '帕秋莉',
			},
		],
	},
	{
		id: 27,
		name: '访问着和服',
		description: '蓬莱山辉夜送的制式严谨的访问着，穿起来有点儿费劲。',
		dlc: 0,
		gif: false,
		izakaya: false,
		from: [
			{
				bond: '蓬莱山辉夜',
			},
		],
	},
	{
		id: 56,
		name: '偶像服',
		description: '为了演唱会特意赶制的“鸟兽伎乐”乐队演出服。',
		dlc: 0,
		gif: false,
		izakaya: false,
		from: ['首次举办演唱会时自动获得'],
	},
	{
		id: 31,
		name: '水手服',
		description: '从位于博丽神社的守矢分社中离奇获得的服饰，似乎在外界很流行。',
		dlc: 0,
		gif: false,
		izakaya: false,
		from: ['持有100枚“银色的青蛙硬币”时自动获得'],
	},
	{
		id: 54,
		name: '万圣节特典晚装',
		description: '在2021年万圣节期间登录游戏获得的限定晚装，结合万圣节的气氛做了特别的设计，可爱又精怪。',
		dlc: 0,
		gif: false,
		izakaya: true,
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: {
						currency: '银色的青蛙硬币',
						amount: 25,
					},
				},
			},
		],
	},
	{
		id: 57,
		name: '锦绣中国娃娃',
		description:
			'在2022年春节活动期间登陆游戏获得的限定礼服，红黄配色象征着喜气和财富，在春回大地、万象更新的这一天尽情收获祝福吧。',
		dlc: 0,
		gif: false,
		izakaya: true,
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: {
						currency: '银色的青蛙硬币',
						amount: 25,
					},
				},
			},
		],
	},
	{
		id: 58,
		name: '执事服',
		description:
			'《东方夜雀食堂》在2021年获得国产游戏销量榜第17名，为感谢各位玩家的支持，特意制作了帅气的执事服以表谢意！未来还请多多指教！',
		dlc: 0,
		gif: false,
		izakaya: false,
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: {
						currency: '银色的青蛙硬币',
						amount: 15,
					},
				},
			},
		],
	},
	{
		id: 59,
		name: '圣诞节特典晚装',
		description:
			'在2021年圣诞节活动期间登陆游戏获得的限定礼服，毛茸茸的非常暖和，在注重保暖的同时也没有舍弃可爱。在冬日里看到这样一抹亮色，会让人心情变得很好吧？',
		dlc: 0,
		gif: false,
		izakaya: true,
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: {
						currency: '银色的青蛙硬币',
						amount: 25,
					},
				},
			},
		],
	},
	{
		id: 60,
		name: '蛋糕裙',
		description:
			'在2023年米斯蒂娅角色日活动期间登陆游戏获得的限定礼服。蓬松可爱的蛋糕裙既纯真又梦幻，寄寓着希冀之情，为庆贺米斯蒂娅角色日及《东方夜雀食堂》Nintendo Switch企划启动，而特意制作的纪念物。',
		dlc: 0,
		gif: false,
		izakaya: false,
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: {
						currency: '银色的青蛙硬币',
						amount: 15,
					},
				},
			},
		],
	},
	{
		id: 1002,
		name: '魔女服',
		description:
			'魔理沙小姐用业余的时间设计出来的衣服，因为她最近有了点儿钱，设计的方面就张扬了很多。她说如果下次异变的时候，就穿这个出去让灵梦羡慕羡慕。',
		dlc: 1,
		gif: false,
		izakaya: false,
		from: [
			{
				bond: '雾雨魔理沙',
			},
		],
	},
	{
		id: 1001,
		name: '冬季水手服',
		description:
			'听说是外面世界冬季穿的水手服，为了对抗冬天的冷空气，特意加长了袖子和裙子的长度，以及进行了深色的设计，看起来保暖多了…但是等等，为什么冬季还要穿水手服？！',
		dlc: 1,
		gif: false,
		izakaya: false,
		from: [
			{
				bond: '东风谷早苗',
			},
		],
	},
	{
		id: 2001,
		name: '花魁浴衣',
		description:
			'花魁比赛的战利品。地底以强为尊，所以花魁在地底指的是力量最强大之人。穿上它象征着得到最强者的认可，在旧都相当惹人注目。',
		dlc: 2,
		gif: false,
		izakaya: false,
		from: [
			{
				bond: '星熊勇仪',
			},
		],
	},
	{
		id: 2002,
		name: '星尘披风套装',
		description:
			'从外侧看平平无奇，但是内侧却有着点点星辰，非常神奇甚至中二感满满的披风！作为妖怪，被夜空包裹会有种奇妙的安心感。',
		dlc: 2,
		gif: true,
		izakaya: false,
		from: [
			{
				bond: '灵乌路空',
			},
		],
	},
	{
		id: 3001,
		name: '海盗服',
		description: '曾经随着村纱东飘西泊的船长服，是村纱海上生涯的重要见证，同时也是船长荣耀的象征。',
		dlc: 3,
		gif: false,
		izakaya: false,
		from: [
			{
				bond: '村纱水蜜',
			},
		],
	},
	{
		id: 3002,
		name: '仙女服',
		description: '散发着缕缕仙气的纱裙。轻盈的丝纱质感，薄如蝉翼，似乎随时将化蝶飞去。',
		dlc: 3,
		gif: false,
		izakaya: false,
		from: [
			{
				bond: '霍青娥',
			},
		],
	},
	{
		id: 4003,
		name: '花的报恩',
		description: '用鲜花编织的小裙子。鲜花上附着了花之主的魔力，故而永不凋谢。',
		dlc: 4,
		gif: false,
		izakaya: false,
		from: [
			{
				bond: '风见幽香',
			},
		],
	},
	{
		id: 4004,
		name: '番长服',
		description:
			'正邪为二把手准备的队服。巧妙地融合了不良、夜雀和音乐的元素，穿起来帅气非凡的同时还能彰显自我。可以看出制作者花了不少心思。',
		dlc: 4,
		gif: false,
		izakaya: false,
		from: [
			{
				bond: '鬼人正邪',
			},
		],
	},
	{
		id: 5009,
		name: '军乐队礼服',
		description: '月之使者中军乐队的礼服，穿在身上有种威风凛凛的感觉！搭配的乐器是小号，也是我擅长的乐器之一哦！',
		dlc: 5,
		gif: false,
		izakaya: false,
		from: [
			{
				bond: '绵月依姬',
			},
		],
	},
	{
		id: 5010,
		name: '海滩度假装',
		description:
			'露易兹小姐亲手设计的适合在海滩度假时穿的服装。考虑了防晒和清凉的同时，还增加了许多像水母一样轻飘飘的设计，融入水中就像真的变成了水母一样。',
		dlc: 5,
		gif: false,
		izakaya: false,
		from: [
			{
				bond: '露易兹',
			},
		],
	},
	{
		id: 2500,
		name: '朋克演出服',
		description: '充满朋克灵魂的演出装束！是“鸟兽伎乐”乐队的起点，真希望有机会可以继续尽情地咆哮和歌唱啊！',
		dlc: 2.5,
		gif: false,
		izakaya: false,
		from: [
			{
				buy: {
					name: '【人间之里】香霖堂',
					price: {
						currency: '银色的青蛙硬币',
						amount: 10,
					},
				},
			},
			'完成“爱乐者的挑战赛”任务后自动获得',
		],
	},
] as const satisfies IClothes[];
