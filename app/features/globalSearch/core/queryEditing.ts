import type {
	IGlobalSearchFieldCondition,
	IGlobalSearchPrefixSuggestion,
} from '@/features/globalSearch/contracts';

import { parseGlobalSearchQuery } from './parser';

export function insertPrefixSuggestion(
	value: string,
	suggestion: Pick<IGlobalSearchPrefixSuggestion, 'insertText' | 'kind'>
) {
	const trimmedValue = value.trimEnd();
	const appendSuggestion = () =>
		trimmedValue.length === 0
			? suggestion.insertText
			: `${trimmedValue} ${suggestion.insertText}`;
	const activePrefixPattern = /(^|\s)@[^\s@]*$/u;
	const activePrefixMatch = activePrefixPattern.exec(value);

	if (activePrefixMatch === null) {
		return appendSuggestion();
	}

	const tokenCount =
		trimmedValue.length === 0 ? 0 : trimmedValue.split(/\s+/u).length;
	const ast = parseGlobalSearchQuery(value);

	if (
		suggestion.kind === 'field' &&
		ast.resultSection !== null &&
		tokenCount === 1
	) {
		return appendSuggestion();
	}

	return value.replace(/(^|\s)@[^\s@]*$/u, `$1${suggestion.insertText}`);
}

export function getPrefixTokenDeletionRange(
	value: string,
	cursorIndex: number
) {
	const pattern = /(^|\s)(@[^\s@]+)/gu;

	for (const match of value.matchAll(pattern)) {
		const [, leadingSpace, token] = match;
		const tokenStart = match.index + (leadingSpace ?? '').length;
		const tokenEnd = tokenStart + (token ?? '').length;
		const deletionEnd = value[tokenEnd] === ' ' ? tokenEnd + 1 : tokenEnd;

		if (cursorIndex !== tokenEnd && cursorIndex !== deletionEnd) {
			continue;
		}

		return {
			end: deletionEnd,
			start:
				tokenStart > 0 &&
				deletionEnd === value.length &&
				value[tokenStart - 1] === ' '
					? tokenStart - 1
					: tokenStart,
		};
	}

	return null;
}

export function replaceActiveFieldValue(
	value: string,
	prefix: string,
	suggestion: string
) {
	const prefixIndex = value.lastIndexOf(prefix);
	if (prefixIndex === -1) {
		const trimmedValue = value.trimEnd();
		return trimmedValue.length === 0
			? `${prefix} ${suggestion}`
			: `${trimmedValue} ${prefix} ${suggestion}`;
	}

	const beforePrefix = value.slice(0, prefixIndex).trimEnd();
	const prefixWithSuggestion = `${prefix} ${suggestion}`;

	return beforePrefix.length === 0
		? prefixWithSuggestion
		: `${beforePrefix} ${prefixWithSuggestion}`;
}

export function getFieldValueTokenDeletionRange({
	cursorIndex,
	fieldCondition,
	hasExactMatch,
	value,
}: {
	cursorIndex: number;
	fieldCondition: IGlobalSearchFieldCondition | null;
	hasExactMatch: (fieldCondition: IGlobalSearchFieldCondition) => boolean;
	value: string;
}) {
	if (fieldCondition === null || cursorIndex !== value.length) {
		return null;
	}

	const keyword = fieldCondition.keyword.trim();
	const keywordEnd = value.endsWith(' ') ? cursorIndex - 1 : cursorIndex;
	const keywordStart = keywordEnd - keyword.length;
	if (
		keyword.length === 0 ||
		value.slice(keywordStart, keywordEnd) !== keyword ||
		!hasExactMatch(fieldCondition)
	) {
		return null;
	}

	return { end: cursorIndex, start: keywordStart };
}
