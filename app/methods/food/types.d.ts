import {type foodInstances} from './index';

export type TFoodInstances = (typeof foodInstances)[keyof typeof foodInstances];
