import {type customerInstances} from './index';

export type CustomerInstances = (typeof customerInstances)[keyof typeof customerInstances];
