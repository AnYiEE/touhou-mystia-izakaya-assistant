'use client';

import { useMemo } from 'react';

import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import { getCatalogSearchFilterAction } from '@/features/catalog/globalSearch/client/filterActions';
import { useCatalogSearchContributor } from '@/features/catalog/globalSearch/client/useCatalogSearchContributor';
import { getCatalogSearchFieldValueOrderMap } from '@/features/catalog/globalSearch/fieldValueOrdering';
import { createCatalogSearchSuggestionRecordMap } from '@/features/catalog/globalSearch/suggestionRecords';
import type {
	IGlobalSearchIndexItem,
	TGlobalSearchIndexSection,
} from '@/features/globalSearch/contracts';
import {
	GLOBAL_SEARCH_EXAMPLE_QUERIES,
	checkGlobalSearchSectionMatches,
} from '@/features/globalSearch/core/constants';
import { getGlobalSearchSectionFromPathname } from '@/features/globalSearch/core/context';
import {
	createGlobalSearchFieldValueCache,
	createRelaxedGlobalSearchQuery,
	getGlobalSearchFieldValueDisplayText,
	getGlobalSearchFieldValueMatches,
	getGlobalSearchFieldValueSuggestions,
} from '@/features/globalSearch/core/fieldValueSuggestions';
import {
	getGlobalSearchPrefixSuggestions,
	getSectionPrefixGroup,
	parseGlobalSearchQuery,
} from '@/features/globalSearch/core/parser';
import { searchGlobalIndex } from '@/features/globalSearch/core/search';
import { buildPreferenceSearchIndex } from '@/features/preferences/client/globalSearch/searchItems';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

function getExamplePreviewItem({
	index,
	previewSection,
	query,
}: {
	index: ReadonlyArray<IGlobalSearchIndexItem>;
	previewSection?: TGlobalSearchIndexSection;
	query: string;
}) {
	const ast = parseGlobalSearchQuery(query);
	const representativeSection = previewSection ?? ast.resultSection;
	const results = searchGlobalIndex({ ast, contextSection: null, index });
	const [firstResult] = results;

	if (representativeSection === null) {
		return firstResult?.item ?? null;
	}
	const previewResult = results.find(({ item }) =>
		checkGlobalSearchSectionMatches(representativeSection, item.section)
	);
	if (previewResult !== undefined) {
		return previewResult.item;
	}

	return (
		index.find((item) =>
			checkGlobalSearchSectionMatches(representativeSection, item.section)
		) ??
		firstResult?.item ??
		null
	);
}

export function useGlobalSearchModel(query: string, selectedIndex: number) {
	const { pathname } = usePathname();
	const catalogContributor = useCatalogSearchContributor();
	const preferenceIndex = useMemo(
		() =>
			buildPreferenceSearchIndex({
				includeAccountItems:
					PUBLIC_RUNTIME_CONFIG.isAccountFeatureClientEnabled,
			}),
		[]
	);
	const index = useMemo(
		() => [...catalogContributor.index, ...preferenceIndex],
		[catalogContributor.index, preferenceIndex]
	);
	const currentSection = getGlobalSearchSectionFromPathname(pathname);
	const ast = useMemo(() => parseGlobalSearchQuery(query), [query]);
	const searchContextSection = ast.resultSection ?? currentSection;
	const fieldValueCache = useMemo(
		() =>
			createGlobalSearchFieldValueCache({
				contextSection: searchContextSection,
				getOrderMap: getCatalogSearchFieldValueOrderMap,
				index,
				placeValues: catalogContributor.visiblePlaceValues,
			}),
		[index, searchContextSection, catalogContributor.visiblePlaceValues]
	);
	const nameSuggestionItemMap = useMemo(() => {
		const itemMap = new Map<string, IGlobalSearchIndexItem[]>();
		index.forEach((item) => {
			if (
				searchContextSection !== null &&
				!checkGlobalSearchSectionMatches(
					searchContextSection,
					item.section
				)
			) {
				return;
			}
			const items = itemMap.get(item.name);
			if (items === undefined) {
				itemMap.set(item.name, [item]);
			} else {
				items.push(item);
			}
		});
		return itemMap;
	}, [index, searchContextSection]);
	const catalogSuggestionRecordMap = useMemo(
		() => createCatalogSearchSuggestionRecordMap(index),
		[index]
	);
	const results = useMemo(
		() =>
			searchGlobalIndex({
				ast,
				contextSection: searchContextSection,
				index,
			}),
		[ast, index, searchContextSection]
	);
	const prefixSuggestions = useMemo(
		() => getGlobalSearchPrefixSuggestions(query),
		[query]
	);
	const filterAction = useMemo(
		() => getCatalogSearchFilterAction(ast, currentSection),
		[ast, currentSection]
	);
	const relaxedQuery = useMemo(
		() => createRelaxedGlobalSearchQuery(ast),
		[ast]
	);
	const activeFieldCondition = useMemo(
		() => ast.fieldConditions.at(-1) ?? null,
		[ast.fieldConditions]
	);
	const fieldConditionDisplayValues = useMemo(
		() =>
			ast.fieldConditions.map((fieldCondition) => {
				const keyword = fieldCondition.keyword.trim();
				if (keyword.length === 0) {
					return '';
				}
				const matchedValue =
					getGlobalSearchFieldValueMatches({
						fieldCondition,
						valueCache: fieldValueCache,
					})[0] ?? keyword;
				return getGlobalSearchFieldValueDisplayText(
					fieldCondition.fieldType,
					matchedValue
				);
			}),
		[ast.fieldConditions, fieldValueCache]
	);
	const fieldValueSuggestions = useMemo(
		() =>
			getGlobalSearchFieldValueSuggestions({
				fieldCondition: activeFieldCondition,
				valueCache: fieldValueCache,
			}),
		[activeFieldCondition, fieldValueCache]
	);
	const isQueryEmpty = query.trim().length === 0;
	const resolvedSelectedIndex = Math.min(
		selectedIndex,
		Math.max(results.length - 1, 0)
	);
	const selectedResult = results[resolvedSelectedIndex] ?? null;
	const parsedSection =
		ast.resultSection === null
			? null
			: getSectionPrefixGroup(ast.resultSection);
	const shouldShowQueryMeta =
		(parsedSection !== null && parsedSection !== undefined) ||
		ast.fieldConditions.length > 0 ||
		filterAction !== null ||
		ast.diagnostics.length > 0;
	const shouldShowRelaxedQuery =
		relaxedQuery.length > 0 && relaxedQuery !== query.trim();
	const isPrefixSuggestionOnly =
		fieldValueSuggestions.length === 0 &&
		prefixSuggestions.length > 0 &&
		ast.freeKeywords.length === 0 &&
		ast.fieldConditions.every(({ keyword }) => keyword.length === 0);
	const isFieldValueSuggestionOnly =
		fieldValueSuggestions.length > 0 &&
		ast.freeKeywords.length === 0 &&
		ast.fieldConditions.length > 0 &&
		ast.fieldConditions.every(({ keyword }) => keyword.length === 0);
	const examplePreviewItemMap = useMemo(
		() =>
			new Map(
				GLOBAL_SEARCH_EXAMPLE_QUERIES.map((example) => [
					example.query,
					getExamplePreviewItem({
						index,
						...('previewSection' in example
							? { previewSection: example.previewSection }
							: {}),
						query: example.query,
					}),
				])
			),
		[index]
	);

	return {
		activeFieldCondition,
		ast,
		catalogSuggestionRecordMap,
		currentSection,
		examplePreviewItemMap,
		fieldConditionDisplayValues,
		fieldValueCache,
		fieldValueSuggestions,
		filterAction,
		index,
		isFieldValueSuggestionOnly,
		isPrefixSuggestionOnly,
		isQueryEmpty,
		nameSuggestionItemMap,
		parsedSection,
		prefixSuggestions,
		relaxedQuery,
		resolvedSelectedIndex,
		results,
		selectedResult,
		shouldShowQueryMeta,
		shouldShowRelaxedQuery,
	} as const;
}

export type TGlobalSearchModel = ReturnType<typeof useGlobalSearchModel>;
