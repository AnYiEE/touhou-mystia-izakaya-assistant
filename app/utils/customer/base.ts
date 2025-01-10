import type {ICustomer} from './types';
import {Item} from '@/utils/item/base';

export class Customer<Target extends ICustomer[]> extends Item<Target> {}
