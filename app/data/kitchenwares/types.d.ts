import type {IItemBase} from '@/data/types';

export interface IKitchenware extends IItemBase {}

export type TKitchenwares = typeof import('./data').KITCHENWARE_LIST;

export type TKitchenwareNames = TKitchenwares[number]['name'];
