import {type customerInstances} from './index';

export type TCustomerInstances = (typeof customerInstances)[keyof typeof customerInstances];
