import { GLOBAL_SEARCH_SECTION_PATH_MAP } from './constants';
import type { TGlobalSearchSection } from './types';

const PATH_SECTION_ENTRIES = Object.entries(
	GLOBAL_SEARCH_SECTION_PATH_MAP
).filter(([section]) => section !== 'preferences') as Array<
	[TGlobalSearchSection, string]
>;

export function getGlobalSearchSectionFromPathname(pathname: string) {
	return (
		PATH_SECTION_ENTRIES.find(
			([, path]) => pathname === path || pathname.startsWith(`${path}/`)
		)?.[0] ?? null
	);
}
