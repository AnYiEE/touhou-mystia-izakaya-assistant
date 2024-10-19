/* eslint-disable sort-keys */
import type {ICurrency} from './types';

export const CURRENCY_LIST = [
	{
		name: '奇怪的石头',
		dlc: 0,
		from: {
			task: '妖怪兽道',
		},
	},
	{
		name: '古朴的铜钱',
		dlc: 0,
		from: {
			task: '人间之里',
		},
	},
	{
		name: '破损的符咒',
		dlc: 0,
		from: {
			task: '博丽神社',
		},
	},
	{
		name: '红色的宝石',
		dlc: 0,
		from: {
			task: '红魔馆',
		},
	},
	{
		name: '发光的竹子',
		dlc: 0,
		from: {
			task: '迷途竹林',
		},
	},
	{
		name: '银色的青蛙硬币',
		dlc: 0,
		from: '地区【博丽神社】西侧守矢分社处祈愿',
	},
] as const satisfies ICurrency[];
