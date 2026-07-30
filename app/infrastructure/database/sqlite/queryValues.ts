export function escapeSqliteLikePattern(pattern: string) {
	return pattern.replace(/[\\%_]/gu, (character) => `\\${character}`);
}
