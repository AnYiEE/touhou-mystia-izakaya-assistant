import type {IItemBase} from '@/data/types';

export interface IKitchenware extends IItemBase {}

export type Kitchenwares = typeof import('./data').KITCHENWARE_LIST;

export type KitchenwareNames = Kitchenwares[number]['name'];
