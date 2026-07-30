import { safeStorage } from '../../../infrastructure/browser/storage/safeStorage';
import { STORAGE_KEY } from './constants';
import type { TTheme } from './types';
import { applyTheme, parseTheme } from './useTheme';

export function readThemePersistenceSnapshot(): TTheme {
	return parseTheme(safeStorage.getItem(STORAGE_KEY));
}

export function replaceThemePersistenceSnapshot(theme: TTheme): void {
	applyTheme(theme);
}
