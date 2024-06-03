import type {IKitchenware} from './types';

const KITCHENWARE_LIST = [
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

type Kitchenwares = typeof KITCHENWARE_LIST;
type KitchenwareNames = Kitchenwares[number]['name'];

export {KITCHENWARE_LIST, type Kitchenwares, type KitchenwareNames};
