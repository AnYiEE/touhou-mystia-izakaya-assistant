import type {ICustomerBase} from '@/data/types';

export interface ICustomerNormal extends ICustomerBase {}

export type CustomerNormals = typeof import('./data').CUSTOMER_NORMAL_LIST;

export type CustomerNormalNames = CustomerNormals[number]['name'];
