import type {ICooker as _ICooker} from '@/data/cookers/types';
import type {TCookerNames} from '@/data';

export interface ICooker<T extends TCookerNames = TCookerNames> extends _ICooker {
	name: T;
}
