import type {ICustomerBase} from '@/data/types';

export interface ICustomerNormal extends ICustomerBase {}

export type TCustomerNormals = typeof import('./data').CUSTOMER_NORMAL_LIST;

export type TCustomerNormalNames = TCustomerNormals[number]['name'];
