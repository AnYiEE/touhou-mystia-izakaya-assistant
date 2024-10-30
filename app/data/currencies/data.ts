/* eslint-disable sort-keys */
import type {ICurrency} from './types';

export const CURRENCY_LIST = [
	{
		id: 3,
		name: '奇怪的石头',
		description: '兽道散落的奇形怪状的石头，还有点儿重。',
		dlc: 0,
		from: {
			task: '妖怪兽道',
		},
	},
	{
		id: 4,
		name: '古朴的铜钱',
		description: '人间之里散落的有些年代感的铜钱，似乎已经不再流通。',
		dlc: 0,
		from: {
			task: '人间之里',
		},
	},
	{
		id: 5,
		name: '破损的符咒',
		description: '博丽神社散落的破损的符咒，拼拼凑凑似乎也能得到点儿信息。',
		dlc: 0,
		from: {
			task: '博丽神社',
		},
	},
	{
		id: 6,
		name: '红色的宝石',
		description: '红魔馆散落的红色的宝石，在幻想乡宝石和石头也没什么区别。',
		dlc: 0,
		from: {
			task: '红魔馆',
		},
	},
	{
		id: 7,
		name: '发光的竹子',
		description: '迷途竹林偶尔看到的发光的竹子，不知道里面有什么呢。',
		dlc: 0,
		from: {
			task: '迷途竹林',
		},
	},
	{
		id: 29,
		name: '银色的青蛙硬币',
		description: '从守矢小神社中摇出的银色青蛙硬币。也许集齐一定数量会有什么好事发生？',
		dlc: 0,
		from: '地区【博丽神社】西侧守矢分社处祈愿',
	},
] as const satisfies ICurrency[];
