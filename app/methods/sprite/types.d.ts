import {type spriteInstances} from './index';

export type TSpriteInstances = (typeof spriteInstances)[keyof typeof spriteInstances];
