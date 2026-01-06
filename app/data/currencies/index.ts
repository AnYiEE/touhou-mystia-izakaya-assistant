import { generateSpriteConfig } from '@/data/utils';
import { CURRENCY_LIST } from './data';

export const CURRENCY_SPRITE_CONFIG = generateSpriteConfig(
	CURRENCY_LIST.length,
	{ height: 26, width: 26 },
	7
);

export * from './data';
