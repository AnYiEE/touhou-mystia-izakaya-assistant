import {type foodInstances} from './index';

export type FoodInstances = (typeof foodInstances)[keyof typeof foodInstances];
