/* eslint-disable sort-keys */
import type { TDlc } from '@/domain/data/shared/types';

import type { TPlace } from './types';

export const PLACE_DLC_MAP: Record<TPlace, TDlc> = {
	妖怪兽道: 0,
	人间之里: 0,
	博丽神社: 0,
	红魔馆: 0,
	迷途竹林: 0,
	魔法森林: 1,
	妖怪之山: 1,
	旧地狱: 2,
	地灵殿: 2,
	命莲寺: 3,
	神灵庙: 3,
	太阳花田: 4,
	辉针城: 4,
	月之都: 5,
	魔界: 5,
};

export const PLACE_UNLOCK_TIER_MAP: Record<TPlace, number> = {
	妖怪兽道: 0,
	人间之里: 1,
	魔法森林: 1,
	妖怪之山: 1,
	博丽神社: 2,
	旧地狱: 2,
	地灵殿: 2,
	红魔馆: 3,
	命莲寺: 3,
	神灵庙: 3,
	迷途竹林: 4,
	太阳花田: 4,
	辉针城: 4,
	月之都: 5,
	魔界: 5,
};

export const ALL_PLACES = Object.keys(PLACE_DLC_MAP) as TPlace[];

export const ALL_PLACES_SET = new Set<string>(ALL_PLACES);
