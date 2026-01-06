import { generateSpriteConfig } from '@/data/utils';
import { PARTNER_LIST } from './data';

export const PARTNER_SPRITE_CONFIG = generateSpriteConfig(PARTNER_LIST.length, {
	height: 184,
	width: 184,
});

export * from './data';
