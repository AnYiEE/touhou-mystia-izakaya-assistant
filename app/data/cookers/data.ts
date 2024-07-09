import type {ICooker} from './types';

export const COOKER_LIST = [
	{
		name: '烤架',
	},
	{
		name: '料理台',
	},
	{
		name: '油锅',
	},
	{
		name: '蒸锅',
	},
	{
		name: '煮锅',
	},
] as const satisfies ICooker[];
