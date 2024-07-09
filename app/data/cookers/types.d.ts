import type {IItemBase} from '@/data/types';

export interface ICooker extends IItemBase {}

export type TCookers = typeof import('./data').COOKER_LIST;

export type TCookerNames = TCookers[number]['name'];
