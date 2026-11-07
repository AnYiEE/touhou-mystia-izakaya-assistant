function readContentDates() {
	const value =
		typeof __SEO_CONTENT_DATES__ === 'string'
			? __SEO_CONTENT_DATES__
			: undefined;
	if (value === undefined) {
		return {};
	}

	try {
		const parsed: unknown = JSON.parse(value);
		if (typeof parsed !== 'object' || parsed === null) {
			return {};
		}

		return Object.fromEntries(
			Object.entries(parsed).filter(
				(entry): entry is [string, string] =>
					typeof entry[1] === 'string'
			)
		);
	} catch {
		return {};
	}
}

const contentDates = readContentDates();

const CONTENT_DATE_PREFIXES = [
	'/special-guests/',
	'/normal-guests/',
	'/maps/',
] as const;

export function getSeoContentDate(path: string) {
	const directDate = contentDates[path];
	if (directDate !== undefined) {
		return directDate;
	}

	for (const prefix of CONTENT_DATE_PREFIXES) {
		if (path.startsWith(prefix)) {
			return contentDates[prefix.slice(0, -1)];
		}
	}

	return contentDates[path];
}
