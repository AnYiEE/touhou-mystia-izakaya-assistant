/* eslint-disable sort-keys */
import type {IClothes} from './types';

export const CLOTHES_LIST = [
	{
		name: '夜雀服',
		dlc: 0,
		gif: false,
		izakaya: false,
		from: {
			self: true,
		},
	},
	{
		name: '雀酒屋工作装',
		dlc: 0,
		gif: false,
		izakaya: false,
		from: {
			self: true,
		},
	},
	{
		name: '黑色套装',
		dlc: 0,
		gif: true,
		izakaya: false,
		from: {
			bond: '露米娅',
		},
	},
	{
		name: '中华风校服',
		dlc: 0,
		gif: false,
		izakaya: false,
		from: {
			bond: '上白泽慧音',
		},
	},
	{
		name: '褪色的巫女服',
		dlc: 0,
		gif: false,
		izakaya: false,
		from: {
			bond: '博丽灵梦',
		},
	},
	{
		name: '睡衣',
		dlc: 0,
		gif: false,
		izakaya: false,
		from: {
			bond: '帕秋莉',
		},
	},
	{
		name: '访问着和服',
		dlc: 0,
		gif: false,
		izakaya: false,
		from: {
			bond: '蓬莱山辉夜',
		},
	},
	{
		name: '偶像服',
		dlc: 0,
		gif: false,
		izakaya: false,
		from: '首次举办演唱会时自动获得',
	},
	{
		name: '水手服',
		dlc: 0,
		gif: false,
		izakaya: false,
		from: '持有100枚“银色的青蛙硬币”时自动获得',
	},
	{
		name: '万圣节特典晚装',
		dlc: 0,
		gif: false,
		izakaya: true,
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '锦绣中国娃娃',
		dlc: 0,
		gif: false,
		izakaya: true,
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '执事服',
		dlc: 0,
		gif: false,
		izakaya: false,
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '圣诞节特典晚装',
		dlc: 0,
		gif: false,
		izakaya: true,
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '蛋糕裙',
		dlc: 0,
		gif: false,
		izakaya: false,
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '魔女服',
		dlc: 1,
		gif: false,
		izakaya: false,
		from: {
			bond: '雾雨魔理沙',
		},
	},
	{
		name: '冬季水手服',
		dlc: 1,
		gif: false,
		izakaya: false,
		from: {
			bond: '东风谷早苗',
		},
	},
	{
		name: '花魁浴衣',
		dlc: 2,
		gif: false,
		izakaya: false,
		from: {
			bond: '星熊勇仪',
		},
	},
	{
		name: '星尘披风套装',
		dlc: 2,
		gif: true,
		izakaya: false,
		from: {
			bond: '灵乌路空',
		},
	},
	{
		name: '海盗服',
		dlc: 3,
		gif: false,
		izakaya: false,
		from: {
			bond: '村纱水蜜',
		},
	},
	{
		name: '仙女服',
		dlc: 3,
		gif: false,
		izakaya: false,
		from: {
			bond: '霍青娥',
		},
	},
	{
		name: '花的报恩',
		dlc: 4,
		gif: false,
		izakaya: false,
		from: {
			bond: '风见幽香',
		},
	},
	{
		name: '番长服',
		dlc: 4,
		gif: false,
		izakaya: false,
		from: {
			bond: '鬼人正邪',
		},
	},
	{
		name: '军乐队礼服',
		dlc: 5,
		gif: false,
		izakaya: false,
		from: {
			bond: '绵月依姬',
		},
	},
	{
		name: '海滩度假装',
		dlc: 5,
		gif: false,
		izakaya: false,
		from: {
			bond: '露易兹',
		},
	},
	{
		name: '朋克演出服',
		dlc: 2.5,
		gif: false,
		izakaya: false,
		from: '【人间之里】香霖堂处兑换或完成“爱乐者的挑战赛”任务后自动获得',
	},
] as const satisfies IClothes[];
