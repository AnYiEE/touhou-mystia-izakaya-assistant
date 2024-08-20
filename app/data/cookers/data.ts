import type {ICooker} from './types';

export const COOKER_LIST = [
	{
		name: '煮锅',
	},
	{
		name: '烤架',
	},
	{
		name: '油锅',
	},
	{
		name: '蒸锅',
	},
	{
		name: '料理台',
	},
	{
		name: '夜雀煮锅',
	},
	{
		name: '夜雀烤架',
	},
	{
		name: '夜雀油锅',
	},
	{
		name: '夜雀蒸锅',
	},
	{
		name: '夜雀料理台',
	},
] as const satisfies ICooker[];
