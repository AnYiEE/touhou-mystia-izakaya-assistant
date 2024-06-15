import type {IKitchenware} from './types';

export const KITCHENWARE_LIST = [
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
] as const satisfies IKitchenware[];
