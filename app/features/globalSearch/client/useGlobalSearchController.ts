'use client';

import {
	type KeyboardEvent,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from 'react';

import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import type {
	IGlobalSearchIndexItem,
	IGlobalSearchMatchedField,
	IGlobalSearchPrefixSuggestion,
} from '@/features/globalSearch/contracts';
import {
	checkGlobalSearchFieldConditionHasExactValue,
	getGlobalSearchFieldValueDisplayText,
} from '@/features/globalSearch/core/fieldValueSuggestions';
import {
	getFieldValueTokenDeletionRange,
	getPrefixTokenDeletionRange,
	insertPrefixSuggestion,
	replaceActiveFieldValue,
} from '@/features/globalSearch/core/queryEditing';
import { useIsOverlayTaskActive } from '@/features/overlays/client';
import type { IOverlayShortcutDefinition } from '@/features/overlays/contracts';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { checkIsApplePlatform } from '@/infrastructure/browser/capabilities/platform';

import { closeGlobalSearch, openGlobalSearch } from './commands';
import { useGlobalSearchNavigationActions } from './navigationActions';
import {
	EMPTY_GLOBAL_SEARCH_RECENT_STATE,
	type IGlobalSearchRecentState,
	addGlobalSearchRecentEntry,
	clearGlobalSearchRecentItems,
	clearGlobalSearchRecentQueries,
	readGlobalSearchRecentState,
	writeGlobalSearchRecentState,
} from './recentSearches';
import { globalSearchStore } from './state/store';
import { useGlobalSearchModel } from './useGlobalSearchModel';

const GLOBAL_SEARCH_TRACK_ACTION = 'Global Search Button';
const SPOTLIGHT_CLOSE_RESET_DELAY_MS = 140;

function isTextEntryElement(target: EventTarget | null) {
	if (!(target instanceof HTMLElement)) {
		return false;
	}

	return (
		target.isContentEditable ||
		['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName) ||
		target.closest('[contenteditable="true"], [role="textbox"]') !== null
	);
}

export function useGlobalSearchController() {
	const isReducedMotion = useReducedMotion();
	const vibrate = useVibrate();
	const baseId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const rootRef = useRef<HTMLDivElement>(null);
	const inputBlurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
		null
	);
	const closeResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
		null
	);
	const wasOpenRef = useRef(false);

	const [query, setQuery] = useState('');
	const [isInputFocused, setIsInputFocused] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [recentState, setRecentState] = useState<IGlobalSearchRecentState>(
		EMPTY_GLOBAL_SEARCH_RECENT_STATE
	);

	const isOpen = globalSearchStore.isOpen.use();
	const isSearchActive = useIsOverlayTaskActive('global.search');
	const model = useGlobalSearchModel(query, selectedIndex);
	const navigation = useGlobalSearchNavigationActions();

	const clearCloseResetTimer = useCallback(() => {
		if (closeResetTimerRef.current === null) {
			return;
		}
		clearTimeout(closeResetTimerRef.current);
		closeResetTimerRef.current = null;
	}, []);

	const resetSearchState = useCallback(() => {
		setQuery('');
		setSelectedIndex(0);
		setIsInputFocused(false);
	}, []);

	const trackGlobalSearchAction = useCallback(
		(name: string, value?: number | string) => {
			trackEvent(
				trackEvent.category.click,
				GLOBAL_SEARCH_TRACK_ACTION,
				name,
				value
			);
		},
		[]
	);

	const open = useCallback(() => {
		if (isOpen) {
			return;
		}
		vibrate();
		trackGlobalSearchAction('Open From Shortcut');
		clearCloseResetTimer();
		resetSearchState();
		openGlobalSearch();
	}, [
		clearCloseResetTimer,
		isOpen,
		resetSearchState,
		trackGlobalSearchAction,
		vibrate,
	]);

	const shortcuts = useMemo<ReadonlyArray<IOverlayShortcutDefinition>>(
		() => [
			{
				matches: (event) => {
					const isApplePlatform = checkIsApplePlatform();
					const hasPlatformSearchModifier = isApplePlatform
						? event.metaKey && !event.ctrlKey
						: event.ctrlKey && !event.metaKey;

					return (
						event.key.toLowerCase() === 'k' &&
						hasPlatformSearchModifier &&
						!event.altKey &&
						!event.shiftKey
					);
				},
				onTrigger: open,
			},
			{
				canHandle: (event) => !isTextEntryElement(event.target),
				matches: (event) =>
					event.key === '/' &&
					!event.ctrlKey &&
					!event.metaKey &&
					!event.altKey &&
					!event.shiftKey,
				onTrigger: open,
			},
		],
		[open]
	);

	const handleCloseRequest = useCallback(() => {
		vibrate();
		trackGlobalSearchAction('Close');
		closeGlobalSearch();
	}, [trackGlobalSearchAction, vibrate]);

	const updateRecentState = useCallback(
		(nextState: IGlobalSearchRecentState) => {
			setRecentState(nextState);
			writeGlobalSearchRecentState(nextState);
		},
		[]
	);

	const addOpenedItemToRecentState = useCallback(
		(item: IGlobalSearchIndexItem) => {
			updateRecentState(
				addGlobalSearchRecentEntry({
					itemId: item.id,
					query,
					state: recentState,
				})
			);
		},
		[query, recentState, updateRecentState]
	);

	const handleOpenItem = useCallback(
		(item: IGlobalSearchIndexItem, match?: IGlobalSearchMatchedField) => {
			vibrate();
			trackGlobalSearchAction(
				item.section === 'preferences'
					? 'Open Preference'
					: 'Open Item',
				`${item.section}:${item.name}`
			);
			addOpenedItemToRecentState(item);
			navigation.openItem(item, match);
		},
		[
			addOpenedItemToRecentState,
			navigation,
			trackGlobalSearchAction,
			vibrate,
		]
	);

	const handleShareItem = useCallback(
		(item: IGlobalSearchIndexItem) => {
			vibrate();
			trackGlobalSearchAction(
				'Share Item',
				`${item.section}:${item.name}`
			);
			navigation.shareSearchItem(item);
		},
		[navigation, trackGlobalSearchAction, vibrate]
	);

	const handleOpenNewWindow = useCallback(
		(item: IGlobalSearchIndexItem, match?: IGlobalSearchMatchedField) => {
			vibrate();
			trackGlobalSearchAction(
				'Open Item In New Tab',
				`${item.section}:${item.name}`
			);
			navigation.openSearchItemInNewTab(item, match);
		},
		[navigation, trackGlobalSearchAction, vibrate]
	);

	const handleApplyFilter = useCallback(() => {
		if (model.filterAction === null) {
			return;
		}
		vibrate();
		trackGlobalSearchAction(
			'Apply Filter',
			model.filterAction.targetSection
		);
		navigation.applyFilter(model.filterAction);
	}, [model.filterAction, navigation, trackGlobalSearchAction, vibrate]);

	const clearRecentItems = useCallback(() => {
		vibrate();
		trackGlobalSearchAction('Clear Recent Items');
		updateRecentState(clearGlobalSearchRecentItems(recentState));
	}, [recentState, trackGlobalSearchAction, updateRecentState, vibrate]);

	const clearRecentQueries = useCallback(() => {
		vibrate();
		trackGlobalSearchAction('Clear Recent Queries');
		updateRecentState(clearGlobalSearchRecentQueries(recentState));
	}, [recentState, trackGlobalSearchAction, updateRecentState, vibrate]);

	const applyQueryPreset = useCallback(
		(nextQuery: string, source: string) => {
			vibrate();
			trackGlobalSearchAction(source);
			setQuery(nextQuery);
			inputRef.current?.focus();
		},
		[trackGlobalSearchAction, vibrate]
	);

	const handleBackToEmptyQuery = useCallback(() => {
		vibrate();
		trackGlobalSearchAction('Back To Search Home');
		setQuery('');
		inputRef.current?.focus();
	}, [trackGlobalSearchAction, vibrate]);

	const handlePrefixSuggestionPress = useCallback(
		(suggestion: IGlobalSearchPrefixSuggestion) => {
			vibrate();
			trackGlobalSearchAction(
				'Select Prefix Suggestion',
				`${suggestion.kind}:${suggestion.key}`
			);
			setQuery((value) => insertPrefixSuggestion(value, suggestion));
			inputRef.current?.focus();
		},
		[trackGlobalSearchAction, vibrate]
	);

	const handleFieldValueSuggestionPress = useCallback(
		(suggestion: string) => {
			const fieldCondition = model.activeFieldCondition;
			if (fieldCondition === null) {
				return;
			}
			vibrate();
			trackGlobalSearchAction(
				'Select Field Value Suggestion',
				fieldCondition.fieldType
			);
			setQuery((value) =>
				replaceActiveFieldValue(
					value,
					fieldCondition.prefix,
					getGlobalSearchFieldValueDisplayText(
						fieldCondition.fieldType,
						suggestion
					)
				)
			);
			inputRef.current?.focus();
		},
		[model.activeFieldCondition, trackGlobalSearchAction, vibrate]
	);

	const handleInputBlur = useCallback(() => {
		inputBlurTimerRef.current = setTimeout(() => {
			setIsInputFocused(false);
			inputBlurTimerRef.current = null;
		}, 120);
	}, []);

	const handleInputFocus = useCallback(() => {
		if (inputBlurTimerRef.current !== null) {
			clearTimeout(inputBlurTimerRef.current);
			inputBlurTimerRef.current = null;
		}
		setIsInputFocused(true);
	}, []);

	const handleInputKeyDown = useCallback(
		(event: KeyboardEvent<HTMLInputElement>) => {
			const { isComposing } = event.nativeEvent;
			if (event.key === 'ArrowDown') {
				event.preventDefault();
				setSelectedIndex((index) => {
					const nextIndex = Math.min(
						index + 1,
						Math.max(model.results.length - 1, 0)
					);
					vibrate(nextIndex !== index);
					return nextIndex;
				});
				return;
			}
			if (event.key === 'ArrowUp') {
				event.preventDefault();
				setSelectedIndex((index) => {
					const nextIndex = Math.max(index - 1, 0);
					vibrate(nextIndex !== index);
					return nextIndex;
				});
				return;
			}
			if (event.key === 'Enter') {
				if (isComposing) {
					return;
				}
				event.preventDefault();
				if (model.selectedResult !== null) {
					handleOpenItem(
						model.selectedResult.item,
						model.selectedResult.matches[0]
					);
				}
				return;
			}
			if (event.key !== 'Backspace' || isComposing) {
				return;
			}
			const input = event.currentTarget;
			const selectionStart = input.selectionStart ?? 0;
			const selectionEnd = input.selectionEnd ?? selectionStart;
			if (selectionStart !== selectionEnd) {
				return;
			}

			const deletionRange =
				getFieldValueTokenDeletionRange({
					cursorIndex: selectionStart,
					fieldCondition: model.activeFieldCondition,
					hasExactMatch: (fieldCondition) =>
						checkGlobalSearchFieldConditionHasExactValue(
							fieldCondition,
							model.fieldValueCache
						),
					value: query,
				}) ?? getPrefixTokenDeletionRange(query, selectionStart);
			if (deletionRange === null) {
				return;
			}

			event.preventDefault();
			const nextQuery =
				query.slice(0, deletionRange.start) +
				query.slice(deletionRange.end);
			vibrate();
			setQuery(nextQuery);
			requestAnimationFrame(() => {
				inputRef.current?.setSelectionRange(
					deletionRange.start,
					deletionRange.start
				);
			});
		},
		[handleOpenItem, model, query, vibrate]
	);

	useEffect(() => {
		setRecentState(readGlobalSearchRecentState(model.index));
	}, [model.index]);

	useEffect(
		() => () => {
			if (inputBlurTimerRef.current !== null) {
				clearTimeout(inputBlurTimerRef.current);
			}
			clearCloseResetTimer();
		},
		[clearCloseResetTimer]
	);

	useEffect(() => {
		if (wasOpenRef.current && !isOpen) {
			setIsInputFocused(false);
			clearCloseResetTimer();
			closeResetTimerRef.current = setTimeout(
				() => {
					resetSearchState();
					closeResetTimerRef.current = null;
				},
				isReducedMotion ? 0 : SPOTLIGHT_CLOSE_RESET_DELAY_MS
			);
		}
		wasOpenRef.current = isOpen;
	}, [clearCloseResetTimer, isOpen, isReducedMotion, resetSearchState]);

	useEffect(() => {
		if (!isOpen || !isSearchActive) {
			return;
		}
		if (closeResetTimerRef.current !== null) {
			clearCloseResetTimer();
			resetSearchState();
		}
		const focusFrame = requestAnimationFrame(() => {
			inputRef.current?.focus();
		});
		return () => {
			cancelAnimationFrame(focusFrame);
		};
	}, [clearCloseResetTimer, isOpen, isSearchActive, resetSearchState]);

	useEffect(() => {
		setSelectedIndex(0);
	}, [query]);

	useEffect(() => {
		setSelectedIndex((index) =>
			Math.min(index, Math.max(model.results.length - 1, 0))
		);
	}, [model.results.length]);

	useEffect(() => {
		if (
			!isOpen ||
			model.isQueryEmpty ||
			model.isPrefixSuggestionOnly ||
			model.isFieldValueSuggestionOnly ||
			model.results.length === 0
		) {
			return;
		}
		const resultElement = rootRef.current
			?.querySelectorAll<HTMLElement>('[data-global-search-result-index]')
			.values()
			.find(
				({ dataset }) =>
					dataset['globalSearchResultIndex'] ===
					model.resolvedSelectedIndex.toString()
			);
		try {
			resultElement?.scrollIntoView({ block: 'nearest' });
		} catch {
			resultElement?.scrollIntoView(true);
		}
	}, [
		isOpen,
		model.isFieldValueSuggestionOnly,
		model.isPrefixSuggestionOnly,
		model.isQueryEmpty,
		model.resolvedSelectedIndex,
		model.results.length,
	]);

	const recentItems = useMemo(
		() =>
			recentState.items
				.map((id) => model.index.find((item) => item.id === id))
				.filter(
					(item): item is IGlobalSearchIndexItem => item !== undefined
				),
		[model.index, recentState.items]
	);

	return {
		applyQueryPreset,
		baseId,
		clearRecentItems,
		clearRecentQueries,
		handleApplyFilter,
		handleBackToEmptyQuery,
		handleCloseRequest,
		handleFieldValueSuggestionPress,
		handleInputBlur,
		handleInputFocus,
		handleInputKeyDown,
		handleOpenItem,
		handleOpenNewWindow,
		handlePrefixSuggestionPress,
		handleShareItem,
		inputRef,
		isInputFocused,
		isOpen,
		model,
		query,
		recentItems,
		recentState,
		rootRef,
		setQuery,
		setSelectedIndex,
		shortcuts,
	} as const;
}

export type TGlobalSearchController = ReturnType<
	typeof useGlobalSearchController
>;
