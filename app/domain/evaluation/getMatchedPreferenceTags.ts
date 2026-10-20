export function getMatchedPreferenceTags<T extends number>(
	currentTags: ReadonlyArray<T>,
	preferredTags: ReadonlyArray<T>
) {
	const currentTagSet = new Set(currentTags);
	return preferredTags.filter((tag) => currentTagSet.has(tag));
}
