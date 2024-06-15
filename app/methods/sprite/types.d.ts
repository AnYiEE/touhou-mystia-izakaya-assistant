import {type spriteInstances} from './index';

export type SpriteInstances = (typeof spriteInstances)[keyof typeof spriteInstances];
