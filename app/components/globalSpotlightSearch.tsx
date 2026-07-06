'use client';

import {
	type KeyboardEvent,
	type PropsWithChildren,
	type UIEvent,
	memo,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { useRouter } from 'next/navigation';
import { usePathname, useVibrate } from '@/hooks';

import {
	faArrowLeft,
	faArrowUpRightFromSquare,
	faFilter,
	faLink,
	faMagnifyingGlass,
	faShare,
	faSliders,
	faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
	Button,
	Input,
	Modal,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Snippet,
	Tooltip,
	cn,
} from '@/design/ui/components';
import { useReducedMotion } from '@/design/ui/hooks';

import { trackEvent } from '@/components/analytics';
import Sprite from '@/components/sprite';
import TagsComponent from '@/components/tags';

import { siteConfig } from '@/configs';
import {
	ALL_PLACES,
	BEVERAGE_TAG_STYLE,
	DLC_LABEL_MAP,
	INGREDIENT_TAG_STYLE,
	PLACE_DLC_MAP,
	RECIPE_TAG_STYLE,
	type TDlc,
	type TTag,
} from '@/data';
import {
	GLOBAL_SEARCH_EXAMPLE_QUERIES,
	GLOBAL_SEARCH_RECENT_STORAGE_KEY,
	GLOBAL_SEARCH_SECTION_PATH_MAP,
	type IGlobalSearchIndexField,
	type IGlobalSearchIndexItem,
	type IGlobalSearchMatchedField,
	type IGlobalSearchResult,
	buildGlobalSearchIndex,
	buildGlobalSearchPreferenceIndex,
	checkGlobalSearchSectionMatches,
	getFieldPrefixGroup,
	getFieldPrefixLabel,
	getGlobalSearchFilterAction,
	getGlobalSearchPrefixSuggestions,
	getGlobalSearchSectionFromPathname,
	getGlobalSearchSectionPath,
	getSectionPrefixGroup,
	parseGlobalSearchQuery,
	searchGlobalIndex,
} from '@/lib/globalSearch';
import { createItemShareData, createItemShareUrl } from '@/lib/itemShare';
import { accountStore, globalStore as store } from '@/stores';
import {
	checkIsApplePlatform,
	createBoundedRuntimeCache,
	getPinyin,
	numberSort,
	pinyinSort,
	processPinyin,
} from '@/utilities';
import { safeStorage } from '@/utilities/safeStorage';
import {
	Beverage,
	Clothes,
	Cooker,
	Currency,
	CustomerNormal,
	CustomerRare,
	Ingredient,
	Ornament,
	Partner,
	Recipe,
} from '@/utils';
import type { TSpriteTarget } from '@/utils/sprite/types';

interface IRecentState {
	items: string[];
	queries: string[];
}

const EMPTY_RECENT_STATE: IRecentState = { items: [], queries: [] };
const MAX_RECENT_ITEMS = 8;
const MAX_RECENT_QUERIES = 8;
const GLOBAL_SEARCH_TRACK_ACTION = 'Global Search Button';

const SPOTLIGHT_MODAL_MOTION_PROPS = {
	variants: {
		enter: {
			opacity: 1,
			scale: 1,
			transition: { duration: 0.16, ease: 'easeOut' },
		},
		exit: {
			opacity: 0,
			scale: 0.985,
			transition: { duration: 0.12, ease: 'easeIn' },
		},
		initial: { opacity: 0, scale: 0.985 },
	},
} as const;

const SPOTLIGHT_CONTENT_TRANSITION = {
	duration: 0.22,
	ease: 'easeInOut',
	layout: { duration: 0.22, ease: 'easeInOut', type: 'tween' },
	type: 'tween',
} as const;

const SPOTLIGHT_LIST_TRANSITION = {
	duration: 0.22,
	ease: 'easeInOut',
	layout: { duration: 0.22, ease: 'easeInOut', type: 'tween' },
	type: 'tween',
} as const;

const SPOTLIGHT_CLOSE_RESET_DELAY = 140;

const SPOTLIGHT_BLOCK_VARIANTS = {
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -6 },
	initial: { opacity: 0, y: 8 },
} as const;

const SPOTLIGHT_MAIN_CONTENT_VARIANTS = {
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -5 },
	initial: { opacity: 0, y: 6 },
} as const;

const SPOTLIGHT_RESULT_VARIANTS = {
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -4 },
	initial: { opacity: 0, y: 6 },
} as const;

const SPOTLIGHT_PREVIEW_VARIANTS = {
	animate: { opacity: 1, x: 0 },
	exit: { opacity: 0, x: 8 },
	initial: { opacity: 0, x: 8 },
} as const;

const MATCH_FIELD_SPRITE_TARGET_MAP: Partial<
	Record<IGlobalSearchIndexField['fieldType'], TSpriteTarget>
> = { cooker: 'cooker', ingredient: 'ingredient' };

const EMPTY_SCROLL_STATE = { bottom: false, top: false };
const SCROLL_EDGE_THRESHOLD = 1;
const SEARCH_SYNTAX_TOKEN_CLASS_NAME =
	'inline-flex max-w-full items-center rounded-small border border-default-200/70 bg-default/30 px-1 py-0.5 align-baseline font-semibold leading-4 text-foreground-600 dark:border-default-100/20 dark:bg-default-100/10 dark:text-foreground-500';
const GLOBAL_SEARCH_VALUE_SUGGESTION_FIELD_TYPES = new Set<
	IGlobalSearchIndexField['fieldType']
>([
	'beverage-tag',
	'category',
	'cooker',
	'customer-tag',
	'dlc',
	'ingredient',
	'level',
	'moving-speed',
	'name',
	'negative-tag',
	'place',
	'positive-tag',
	'speed',
	'tag',
	'type',
	'working-speed',
]);

function getSpotlightScrollState(element: HTMLDivElement) {
	const maxScrollTop = element.scrollHeight - element.clientHeight;
	const canScroll = maxScrollTop > SCROLL_EDGE_THRESHOLD;

	return {
		bottom:
			canScroll &&
			element.scrollTop < maxScrollTop - SCROLL_EDGE_THRESHOLD,
		top: canScroll && element.scrollTop > SCROLL_EDGE_THRESHOLD,
	};
}

interface IMotionBlockProps extends PropsWithChildren<object> {
	className?: string;
	motionKey: number | string;
}

const SpotlightMotionBlock = memo<IMotionBlockProps>(
	function SpotlightMotionBlock({ children, className, motionKey }) {
		const isReducedMotion = useReducedMotion();

		if (isReducedMotion) {
			return <div className={className}>{children}</div>;
		}

		return (
			<motion.div
				layout="position"
				key={motionKey}
				animate="animate"
				exit="exit"
				initial="initial"
				transition={SPOTLIGHT_CONTENT_TRANSITION}
				variants={SPOTLIGHT_BLOCK_VARIANTS}
				className={className}
			>
				{children}
			</motion.div>
		);
	}
);

const SpotlightPreviewMotion = memo<IMotionBlockProps>(
	function SpotlightPreviewMotion({ children, className, motionKey }) {
		const isReducedMotion = useReducedMotion();

		if (isReducedMotion) {
			return <div className={className}>{children}</div>;
		}

		return (
			<AnimatePresence mode="popLayout" initial={false}>
				<motion.div
					layout="position"
					key={motionKey}
					animate="animate"
					exit="exit"
					initial="initial"
					transition={SPOTLIGHT_CONTENT_TRANSITION}
					variants={SPOTLIGHT_PREVIEW_VARIANTS}
					className={className}
				>
					{children}
				</motion.div>
			</AnimatePresence>
		);
	}
);

const SpotlightScrollMask = memo<PropsWithChildren<{ className?: string }>>(
	function SpotlightScrollMask({ children, className }) {
		const isHighAppearance = store.persistence.highAppearance.use();
		const scrollRef = useRef<HTMLDivElement>(null);
		const contentRef = useRef<HTMLDivElement>(null);
		const [scrollState, setScrollState] = useState(EMPTY_SCROLL_STATE);

		const updateScrollState = useCallback((element = scrollRef.current) => {
			if (element === null) {
				return;
			}

			const nextScrollState = getSpotlightScrollState(element);

			setScrollState((currentScrollState) =>
				currentScrollState.bottom === nextScrollState.bottom &&
				currentScrollState.top === nextScrollState.top
					? currentScrollState
					: nextScrollState
			);
		}, []);

		const handleScroll = useCallback(
			(event: UIEvent<HTMLDivElement>) => {
				updateScrollState(event.currentTarget);
			},
			[updateScrollState]
		);

		useEffect(() => {
			const scrollElement = scrollRef.current;
			if (scrollElement === null) {
				return;
			}

			const handleResize = () => {
				updateScrollState(scrollElement);
			};

			handleResize();

			if (typeof ResizeObserver === 'undefined') {
				globalThis.addEventListener('resize', handleResize);

				return () => {
					globalThis.removeEventListener('resize', handleResize);
				};
			}

			// eslint-disable-next-line compat/compat -- Progressive enhancement; scroll state still updates on scroll and window resize without ResizeObserver.
			const resizeObserver = new ResizeObserver(handleResize);
			resizeObserver.observe(scrollElement);

			const contentElement = contentRef.current;

			if (contentElement !== null) {
				resizeObserver.observe(contentElement);
			}

			globalThis.addEventListener('resize', handleResize);

			return () => {
				resizeObserver.disconnect();
				globalThis.removeEventListener('resize', handleResize);
			};
		}, [updateScrollState]);

		const maskBackgroundClassName = isHighAppearance
			? 'from-background/90 via-background/50 dark:from-content1/70 dark:via-content1/45'
			: 'from-background via-background/70 dark:from-content1 dark:via-content1/70';

		return (
			<div className="relative min-h-0 overflow-hidden">
				<div
					ref={scrollRef}
					onScroll={handleScroll}
					className={cn(
						'overflow-y-auto overflow-x-hidden scrollbar-hide',
						className
					)}
				>
					<div ref={contentRef}>{children}</div>
				</div>
				<div
					aria-hidden
					className={cn(
						'pointer-events-none absolute inset-x-0 top-0 z-10 h-4 bg-gradient-to-b to-transparent transition-opacity motion-reduce:transition-none',
						maskBackgroundClassName,
						scrollState.top ? 'opacity-100' : 'opacity-0'
					)}
				/>
				<div
					aria-hidden
					className={cn(
						'pointer-events-none absolute inset-x-0 bottom-0 z-10 h-4 bg-gradient-to-t to-transparent transition-opacity motion-reduce:transition-none',
						maskBackgroundClassName,
						scrollState.bottom ? 'opacity-100' : 'opacity-0'
					)}
				/>
			</div>
		);
	}
);

function readRecentState(): IRecentState {
	const value = safeStorage.getItem(GLOBAL_SEARCH_RECENT_STORAGE_KEY);
	if (value === null) {
		return EMPTY_RECENT_STATE;
	}

	try {
		const parsed: unknown = JSON.parse(value);
		if (
			typeof parsed === 'object' &&
			parsed !== null &&
			Array.isArray((parsed as Partial<IRecentState>).items) &&
			Array.isArray((parsed as Partial<IRecentState>).queries)
		) {
			const recentState = parsed as IRecentState;
			return {
				items: recentState.items
					.filter((item): item is string => typeof item === 'string')
					.slice(0, MAX_RECENT_ITEMS),
				queries: recentState.queries
					.filter((item): item is string => typeof item === 'string')
					.slice(0, MAX_RECENT_QUERIES),
			};
		}
	} catch {
		/* empty */
	}

	return EMPTY_RECENT_STATE;
}

function writeRecentState(state: IRecentState) {
	safeStorage.setItem(
		GLOBAL_SEARCH_RECENT_STORAGE_KEY,
		JSON.stringify(state)
	);
}

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

function replaceActivePrefix(value: string, insertText: string) {
	return value.replace(/(^|\s)@[^\s@]*$/u, `$1${insertText}`);
}

function insertPrefixSuggestion(
	value: string,
	suggestion: { insertText: string; kind: 'field' | 'section' }
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

	return replaceActivePrefix(value, suggestion.insertText);
}

function getPrefixTokenDeletionRange(value: string, cursorIndex: number) {
	const pattern = /(^|\s)(@[^\s@]+)/gu;
	let match: RegExpExecArray | null;

	while ((match = pattern.exec(value)) !== null) {
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

function getResultPrimaryMatch(result: IGlobalSearchResult) {
	return result.matches[0];
}

function isRoundedSpriteContentTarget(item: IGlobalSearchIndexItem) {
	return (
		item.spriteTarget !== undefined &&
		['customer_rare', 'partner'].includes(item.spriteTarget)
	);
}

function getSpriteSize(item: IGlobalSearchIndexItem, size: 'sm' | 'md') {
	if (item.spriteTarget === 'customer_normal') {
		return size === 'sm' ? 1.61 : 2.2;
	}

	return size === 'sm' ? 1.15 : 1.55;
}

function getSpriteClassName(item: IGlobalSearchIndexItem, size: 'sm' | 'md') {
	return cn({
		'-translate-x-[0.2rem] -translate-y-[0.05rem]':
			item.spriteTarget === 'customer_normal' && size === 'sm',
		'-translate-x-[0.3rem] -translate-y-[0.1rem]':
			item.spriteTarget === 'customer_normal' && size === 'md',
		'rounded-full': isRoundedSpriteContentTarget(item),
	});
}

function getExamplePreviewItem({
	contextSection,
	index,
	previewSection,
	query,
}: {
	contextSection: null | IGlobalSearchIndexItem['section'];
	index: ReadonlyArray<IGlobalSearchIndexItem>;
	previewSection?: IGlobalSearchIndexItem['section'];
	query: string;
}) {
	const ast = parseGlobalSearchQuery(query);
	const representativeSection = previewSection ?? ast.resultSection;
	const results = searchGlobalIndex({ ast, contextSection, index });
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

function getItemShareUrl(item: IGlobalSearchIndexItem) {
	if (typeof location === 'undefined') {
		return item.href;
	}

	if (item.section === 'preferences') {
		return `${location.origin}/preferences`;
	}

	if (
		item.section === 'customer-normal' ||
		item.section === 'customer-rare'
	) {
		return `${location.origin}${item.href}`;
	}

	const path = getGlobalSearchSectionPath(item.section);

	return createItemShareUrl({ name: item.name, pathname: path });
}

function canShare(shareObject: ShareData) {
	if (
		typeof navigator === 'undefined' ||
		typeof navigator.canShare !== 'function' ||
		typeof navigator.share !== 'function'
	) {
		return false;
	}

	try {
		return navigator.canShare(shareObject);
	} catch {
		return false;
	}
}

function normalizeMatchText(value: string) {
	return value.toLowerCase().replaceAll(/\s+/gu, '');
}

const FIELD_VALUE_PINYIN_CACHE = createBoundedRuntimeCache<
	string,
	{ firstLetters: string; full: string }
>(4096);

function getMatchPinyin(value: string) {
	const cachedPinyin = FIELD_VALUE_PINYIN_CACHE.get(value);
	if (cachedPinyin !== undefined) {
		return cachedPinyin;
	}

	const { pinyinFirstLetters, pinyinWithoutTone } = processPinyin(
		getPinyin(value)
	);

	const pinyin = {
		firstLetters: pinyinFirstLetters,
		full: pinyinWithoutTone.join(''),
	};

	FIELD_VALUE_PINYIN_CACHE.set(value, pinyin);

	return pinyin;
}

function checkNameMatchesKeyword(name: string, keyword: string) {
	const normalizedKeyword = normalizeMatchText(keyword);
	const normalizedName = normalizeMatchText(name);

	if (
		normalizedKeyword.length === 0 ||
		normalizedName.includes(normalizedKeyword)
	) {
		return true;
	}

	const pinyin = getMatchPinyin(name);
	return (
		pinyin.full.includes(normalizedKeyword) ||
		pinyin.firstLetters.includes(normalizedKeyword)
	);
}

function getDlcLabelMeta(value: string) {
	const dlc = Number(value) as TDlc;
	const labelMeta = Number.isFinite(dlc) ? DLC_LABEL_MAP[dlc] : undefined;

	return labelMeta ?? null;
}

function getDlcSearchTexts(value: string) {
	const labelMeta = getDlcLabelMeta(value);

	return [value, labelMeta?.label ?? '', labelMeta?.shortLabel ?? ''].filter(
		Boolean
	);
}

function getDlcDisplayLabel(value: string) {
	const directLabel = getDlcLabelMeta(value)?.label;
	if (directLabel !== undefined) {
		return directLabel;
	}

	const tokenLabel = value
		.split(/\s+/u)
		.map((token) => getDlcLabelMeta(token)?.label)
		.find((label) => label !== undefined);

	return tokenLabel ?? value;
}

function getFieldValueDisplayText(
	fieldType: IGlobalSearchIndexField['fieldType'],
	value: string
) {
	return fieldType === 'dlc' ? getDlcDisplayLabel(value) : value;
}

function getMatchedFieldSpriteTokens(match: IGlobalSearchMatchedField) {
	const target = MATCH_FIELD_SPRITE_TARGET_MAP[match.field.fieldType];
	if (target === undefined) {
		return null;
	}

	const names = match.field.text.split(/\s+/u).filter(Boolean);
	if (names.length === 0) {
		return null;
	}

	return names.map((name) => ({
		isMatched:
			match.keyword.trim().length > 0 &&
			checkNameMatchesKeyword(name, match.keyword),
		name,
		target,
	}));
}

function splitMatchedFieldTags(value: string) {
	return value.split(/\s+/u).filter(Boolean);
}

function getRecipeTagConfig(
	item: IGlobalSearchIndexItem,
	fieldType: IGlobalSearchIndexField['fieldType'],
	tag: string
) {
	if (fieldType === 'negative-tag') {
		return {
			tagStyle: RECIPE_TAG_STYLE.negative,
			tagType: 'negative' as const,
		};
	}

	if (fieldType === 'tag' && item.section === 'recipes') {
		const negativeTagField = item.fields.find(
			(field) => field.fieldType === 'negative-tag'
		);
		const negativeTags = new Set(
			splitMatchedFieldTags(negativeTagField?.text ?? '')
		);

		if (negativeTags.has(tag)) {
			return {
				tagStyle: RECIPE_TAG_STYLE.negative,
				tagType: 'negative' as const,
			};
		}
	}

	return {
		tagStyle: RECIPE_TAG_STYLE.positive,
		tagType: 'positive' as const,
	};
}

function getCustomerTagConfig(
	item: IGlobalSearchIndexItem,
	fieldType: IGlobalSearchIndexField['fieldType'],
	tag: string
) {
	if (fieldType === 'beverage-tag') {
		return {
			tagStyle: BEVERAGE_TAG_STYLE.positive,
			tagType: 'positive' as const,
		};
	}
	if (fieldType === 'negative-tag') {
		return {
			tagStyle: RECIPE_TAG_STYLE.negative,
			tagType: 'negative' as const,
		};
	}
	if (fieldType === 'customer-tag') {
		const negativeTagField = item.fields.find(
			(field) => field.fieldType === 'negative-tag'
		);
		const beverageTagField = item.fields.find(
			(field) => field.fieldType === 'beverage-tag'
		);
		const negativeTags = new Set(
			splitMatchedFieldTags(negativeTagField?.text ?? '')
		);
		const beverageTags = new Set(
			splitMatchedFieldTags(beverageTagField?.text ?? '')
		);

		if (negativeTags.has(tag)) {
			return {
				tagStyle: RECIPE_TAG_STYLE.negative,
				tagType: 'negative' as const,
			};
		}
		if (beverageTags.has(tag)) {
			return {
				tagStyle: BEVERAGE_TAG_STYLE.positive,
				tagType: 'positive' as const,
			};
		}
	}

	return {
		tagStyle: RECIPE_TAG_STYLE.positive,
		tagType: 'positive' as const,
	};
}

function getMatchedFieldTagTokens(
	item: IGlobalSearchIndexItem,
	match: IGlobalSearchMatchedField
) {
	const { keyword } = match;
	const {
		field: { fieldType, text },
	} = match;
	if (
		fieldType !== 'beverage-tag' &&
		fieldType !== 'customer-tag' &&
		fieldType !== 'negative-tag' &&
		fieldType !== 'positive-tag' &&
		fieldType !== 'tag'
	) {
		return null;
	}

	const tags = splitMatchedFieldTags(text);
	if (tags.length === 0) {
		return null;
	}

	return tags.map((tag) => {
		const tagConfig =
			fieldType === 'beverage-tag' || item.section === 'beverages'
				? {
						tagStyle: BEVERAGE_TAG_STYLE.positive,
						tagType: 'positive' as const,
					}
				: item.section === 'ingredients'
					? {
							tagStyle: INGREDIENT_TAG_STYLE.positive,
							tagType: 'positive' as const,
						}
					: item.section === 'customer-normal' ||
						  item.section === 'customer-rare'
						? getCustomerTagConfig(item, fieldType, tag)
						: getRecipeTagConfig(item, fieldType, tag);

		return {
			isMatched:
				keyword.trim().length > 0 &&
				checkNameMatchesKeyword(tag, keyword),
			tag,
			...tagConfig,
		};
	});
}

function renderMatchedFieldSourceContent(match: IGlobalSearchMatchedField) {
	if (match.field.fieldType !== 'from') {
		return null;
	}

	const bondMatch = /^【(.+)】羁绊(?: Lv\.(\d+) ➞ Lv\.(\d+))?$/u.exec(
		match.field.text
	);
	if (bondMatch !== null) {
		const [, name, fromLevel, toLevel] = bondMatch;

		return (
			<span className="inline-flex min-h-6 max-w-full flex-wrap items-center">
				<span className="mr-1 inline-flex items-center">
					【
					<Sprite
						target="customer_rare"
						name={name as never}
						size={1.15}
						className="mx-0.5 rounded-full"
					/>
					{name}】羁绊
				</span>
				{fromLevel !== undefined && toLevel !== undefined && (
					<>
						<span>Lv.{fromLevel}</span>
						<span className="mx-0.5">➞</span>
						<span>Lv.{toLevel}</span>
					</>
				)}
			</span>
		);
	}

	const levelupMatch = /^游戏等级 Lv\.(\d+) ➞ Lv\.(\d+)(.*)$/u.exec(
		match.field.text
	);
	if (levelupMatch !== null) {
		const [, fromLevel, toLevel, suffix] = levelupMatch;
		const trimmedSuffix = suffix?.trim() ?? '';

		return (
			<span className="inline-flex min-h-6 max-w-full flex-wrap items-center">
				<span className="mr-1">游戏等级</span>
				<span>Lv.{fromLevel}</span>
				<span className="mx-0.5">➞</span>
				<span>Lv.{toLevel}</span>
				{trimmedSuffix.length > 0 && (
					<span className="ml-0.5">{trimmedSuffix}</span>
				)}
			</span>
		);
	}

	return null;
}

function renderMatchedFieldContent(
	item: IGlobalSearchIndexItem,
	match: IGlobalSearchMatchedField
) {
	if (match.field.fieldType === 'dlc') {
		return (
			<span className="min-w-0 break-words">
				{getDlcDisplayLabel(match.field.text)}
			</span>
		);
	}

	const sourceContent = renderMatchedFieldSourceContent(match);
	if (sourceContent !== null) {
		return sourceContent;
	}

	const tagTokens = getMatchedFieldTagTokens(item, match);
	if (tagTokens !== null) {
		return tagTokens.map(({ isMatched, tag, tagStyle, tagType }) => (
			<TagsComponent.Tag
				key={`${tagType}:${tag}`}
				tag={tag as TTag}
				tagStyle={tagStyle}
				tagType={tagType}
				className={cn(
					'text-tiny leading-5',
					isMatched &&
						'font-semibold shadow-[inset_0_0_0_0.5px_currentColor]'
				)}
			/>
		));
	}

	const spriteTokens = getMatchedFieldSpriteTokens(match);
	if (spriteTokens !== null) {
		return spriteTokens.map(({ isMatched, name, target }) => (
			<span
				key={`${target}:${name}`}
				className={cn(
					'inline-flex h-6 max-w-full items-center gap-1.5 rounded-small border px-1.5 pr-2',
					isMatched
						? 'border-primary/30 bg-primary/10 text-primary-700 dark:text-primary'
						: 'border-default-200/50 bg-default/20 text-foreground-600'
				)}
			>
				<span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-small bg-default/25">
					<Sprite target={target} name={name as never} size={1} />
				</span>
				<span className="truncate">{name}</span>
			</span>
		));
	}

	return <span className="min-w-0 break-words">{match.snippet}</span>;
}

function createRelaxedQuery(ast: ReturnType<typeof parseGlobalSearchQuery>) {
	const sectionGroup =
		ast.resultSection === null
			? null
			: getSectionPrefixGroup(ast.resultSection);
	const tokens = [
		sectionGroup === null || sectionGroup === undefined
			? ''
			: `@${sectionGroup.aliases[0]}`,
		...ast.freeKeywords,
		...ast.fieldConditions.map(({ keyword }) => keyword).filter(Boolean),
	].filter(Boolean);

	return tokens.join(' ');
}

function getFieldValueTokens(
	fieldType: IGlobalSearchIndexField['fieldType'],
	value: string
) {
	const tokens = value.split(/\s+/u).filter(Boolean);

	if (fieldType === 'dlc') {
		return tokens.filter((token) => getDlcLabelMeta(token) !== null);
	}

	if (fieldType === 'speed') {
		return tokens.map((token) => token.split('：').at(-1) ?? token);
	}

	return tokens;
}

const GLOBAL_SEARCH_BUSINESS_ORDER_MAP_CACHE = new Map<
	string,
	Map<string, number>
>();
const SPEED_VALUE_ORDER = ['慢', '中等', '快', '瞬间移动'] as const;

function createFieldValueOrderMap(values: ReadonlyArray<string>) {
	return new Map(values.map((value, index) => [value, index]));
}

function getCachedFieldValueOrderMap(
	key: string,
	values: () => ReadonlyArray<string>
) {
	const cachedMap = GLOBAL_SEARCH_BUSINESS_ORDER_MAP_CACHE.get(key);
	if (cachedMap !== undefined) {
		return cachedMap;
	}

	const orderMap = createFieldValueOrderMap(values());
	GLOBAL_SEARCH_BUSINESS_ORDER_MAP_CACHE.set(key, orderMap);

	return orderMap;
}

function getFieldValueSuggestionOrderMap({
	contextSection,
	fieldType,
}: {
	contextSection: ReturnType<typeof parseGlobalSearchQuery>['resultSection'];
	fieldType: IGlobalSearchIndexField['fieldType'];
}) {
	if (fieldType === 'beverage-tag') {
		return getCachedFieldValueOrderMap(
			'beverage-tag',
			() => Beverage.getInstance().sortedTags
		);
	}
	if (fieldType === 'tag' && contextSection === 'beverages') {
		return getCachedFieldValueOrderMap(
			'tag:beverages',
			() => Beverage.getInstance().sortedTags
		);
	}
	if (fieldType === 'type' && contextSection === 'ingredients') {
		return getCachedFieldValueOrderMap(
			'type:ingredients',
			() => Ingredient.getInstance().sortedTypes
		);
	}
	if (fieldType === 'category') {
		return getCachedFieldValueOrderMap(
			'category:cookers',
			() => Cooker.getInstance().sortedCategories
		);
	}
	if (fieldType === 'place') {
		return getCachedFieldValueOrderMap('place', () => ALL_PLACES);
	}
	if (['moving-speed', 'speed', 'working-speed'].includes(fieldType)) {
		return getCachedFieldValueOrderMap('speed', () => SPEED_VALUE_ORDER);
	}

	return null;
}

function compareFieldValueSuggestion({
	aValue,
	bValue,
	fieldType,
	orderMap,
}: {
	aValue: string;
	bValue: string;
	fieldType: IGlobalSearchIndexField['fieldType'];
	orderMap: Map<string, number> | null;
}) {
	if (orderMap !== null) {
		const aOrder = orderMap.get(aValue);
		const bOrder = orderMap.get(bValue);

		if (aOrder !== undefined && bOrder !== undefined) {
			return numberSort(aOrder, bOrder);
		}
		if (aOrder !== undefined) {
			return -1;
		}
		if (bOrder !== undefined) {
			return 1;
		}
	}

	if (fieldType === 'dlc' || fieldType === 'level') {
		const aNumber = Number(aValue);
		const bNumber = Number(bValue);

		if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) {
			return numberSort(aNumber, bNumber);
		}
	}

	return pinyinSort(aValue, bValue);
}

function checkFieldValueMatchesKeyword({
	fieldType,
	keyword,
	value,
}: {
	fieldType: IGlobalSearchIndexField['fieldType'];
	keyword: string;
	value: string;
}) {
	if (fieldType === 'dlc') {
		return getDlcSearchTexts(value).some((text) =>
			checkNameMatchesKeyword(text, keyword)
		);
	}

	return checkNameMatchesKeyword(value, keyword);
}

function checkFieldValueExactlyMatchesKeyword({
	fieldType,
	keyword,
	value,
}: {
	fieldType: IGlobalSearchIndexField['fieldType'];
	keyword: string;
	value: string;
}) {
	const normalizedKeyword = keyword.toLowerCase();
	const texts = fieldType === 'dlc' ? getDlcSearchTexts(value) : [value];

	return texts.some((text) => text.toLowerCase() === normalizedKeyword);
}

type TGlobalSearchFieldValueCache = Map<
	IGlobalSearchIndexField['fieldType'],
	string[]
>;

function createGlobalSearchFieldValueCache({
	contextSection,
	index,
	placeValues,
}: {
	contextSection:
		| null
		| ReturnType<typeof parseGlobalSearchQuery>['resultSection'];
	index: ReadonlyArray<IGlobalSearchIndexItem>;
	placeValues: ReadonlyArray<string>;
}): TGlobalSearchFieldValueCache {
	const valueMap = new Map<IGlobalSearchIndexField['fieldType'], Set<string>>(
		[['place', new Set(placeValues)]]
	);
	const fieldAllowedSectionMap = new Map<
		IGlobalSearchIndexField['fieldType'],
		null | Set<IGlobalSearchIndexItem['section']>
	>();
	const getAllowedSectionSet = (
		fieldType: IGlobalSearchIndexField['fieldType']
	) => {
		const cachedSet = fieldAllowedSectionMap.get(fieldType);
		if (cachedSet !== undefined) {
			return cachedSet;
		}

		const fieldGroup = getFieldPrefixGroup(fieldType);
		const allowedSections =
			fieldGroup !== undefined && 'sections' in fieldGroup
				? fieldGroup.sections
				: undefined;
		const allowedSectionSet =
			allowedSections === undefined
				? null
				: new Set<IGlobalSearchIndexItem['section']>(
						allowedSections as ReadonlyArray<
							IGlobalSearchIndexItem['section']
						>
					);

		fieldAllowedSectionMap.set(fieldType, allowedSectionSet);

		return allowedSectionSet;
	};
	const getValueCacheFieldTypes = (
		fieldType: IGlobalSearchIndexField['fieldType']
	) =>
		fieldType === 'moving-speed' || fieldType === 'working-speed'
			? [fieldType, 'speed' as const]
			: [fieldType];

	index.forEach((item) => {
		if (
			contextSection !== null &&
			!checkGlobalSearchSectionMatches(contextSection, item.section)
		) {
			return;
		}

		item.fields.forEach(({ fieldType, text }) => {
			if (!GLOBAL_SEARCH_VALUE_SUGGESTION_FIELD_TYPES.has(fieldType)) {
				return;
			}

			const allowedSectionSet = getAllowedSectionSet(fieldType);
			if (
				contextSection === null &&
				allowedSectionSet !== null &&
				!allowedSectionSet.has(item.section)
			) {
				return;
			}

			getValueCacheFieldTypes(fieldType).forEach((cacheFieldType) => {
				const valueSet =
					valueMap.get(cacheFieldType) ?? new Set<string>();
				getFieldValueTokens(fieldType, text).forEach((value) => {
					valueSet.add(value);
				});
				valueMap.set(cacheFieldType, valueSet);
			});
		});
	});

	const cache: TGlobalSearchFieldValueCache = new Map();
	valueMap.forEach((values, fieldType) => {
		const orderMap = getFieldValueSuggestionOrderMap({
			contextSection,
			fieldType,
		});
		cache.set(
			fieldType,
			[...values].sort((aValue, bValue) =>
				compareFieldValueSuggestion({
					aValue,
					bValue,
					fieldType,
					orderMap,
				})
			)
		);
	});

	return cache;
}

function getGlobalSearchFieldValueMatches({
	fieldCondition,
	valueCache,
}: {
	fieldCondition:
		| null
		| ReturnType<typeof parseGlobalSearchQuery>['fieldConditions'][number];
	valueCache: TGlobalSearchFieldValueCache;
}) {
	if (
		fieldCondition === null ||
		!GLOBAL_SEARCH_VALUE_SUGGESTION_FIELD_TYPES.has(
			fieldCondition.fieldType
		)
	) {
		return [];
	}

	const keyword = fieldCondition.keyword.trim();
	const values = valueCache.get(fieldCondition.fieldType) ?? [];
	const normalizedKeyword = keyword.toLowerCase();

	return values
		.filter((value) =>
			keyword.length === 0
				? true
				: checkFieldValueMatchesKeyword({
						fieldType: fieldCondition.fieldType,
						keyword,
						value,
					})
		)
		.sort((aValue, bValue) => {
			const aDisplayValue = getFieldValueDisplayText(
				fieldCondition.fieldType,
				aValue
			);
			const bDisplayValue = getFieldValueDisplayText(
				fieldCondition.fieldType,
				bValue
			);
			const aStartsWithKeyword =
				normalizedKeyword.length > 0 &&
				aDisplayValue.toLowerCase().startsWith(normalizedKeyword);
			const bStartsWithKeyword =
				normalizedKeyword.length > 0 &&
				bDisplayValue.toLowerCase().startsWith(normalizedKeyword);

			if (aStartsWithKeyword !== bStartsWithKeyword) {
				return aStartsWithKeyword ? -1 : 1;
			}

			return 0;
		});
}

function getGlobalSearchFieldValueSuggestions({
	fieldCondition,
	valueCache,
}: {
	fieldCondition:
		| null
		| ReturnType<typeof parseGlobalSearchQuery>['fieldConditions'][number];
	valueCache: TGlobalSearchFieldValueCache;
}) {
	const matches = getGlobalSearchFieldValueMatches({
		fieldCondition,
		valueCache,
	});
	const keyword = fieldCondition?.keyword.trim() ?? '';

	if (
		keyword.length > 0 &&
		matches.some((value) =>
			checkFieldValueExactlyMatchesKeyword({
				fieldType: fieldCondition?.fieldType ?? 'name',
				keyword,
				value,
			})
		)
	) {
		return [];
	}

	return matches;
}

function replaceActiveFieldValue(
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

function renderSearchSyntax(value: string) {
	return value.split(/(@[^\s@]+)/u).map((part, index) =>
		part.startsWith('@') ? (
			<span
				key={`${part}-${index}`}
				className={SEARCH_SYNTAX_TOKEN_CLASS_NAME}
			>
				{part}
			</span>
		) : (
			part
		)
	);
}

function SearchSyntaxToken({ children }: PropsWithChildren<object>) {
	return <span className={SEARCH_SYNTAX_TOKEN_CLASS_NAME}>{children}</span>;
}

export default function GlobalSpotlightSearch() {
	const { pathname } = usePathname();
	const router = useRouter();
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

	const [query, setQuery] = useState('');
	const [isApplePlatform, setIsApplePlatform] = useState(false);
	const [isInputFocused, setIsInputFocused] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [recentState, setRecentState] =
		useState<IRecentState>(EMPTY_RECENT_STATE);

	const isOpen = store.shared.globalSearch.isOpen.use();
	const isHighAppearance = store.persistence.highAppearance.use();
	const hiddenDlcs = store.hiddenDlcs.use();
	const hiddenBeverages = store.hiddenBeverages.use();
	const hiddenIngredients = store.hiddenIngredients.use();
	const hiddenRecipes = store.hiddenRecipes.use();
	const isFamousShop = store.persistence.famousShop.use();
	const popularTrend = store.persistence.popularTrend.use();
	const currentSection = getGlobalSearchSectionFromPathname(pathname);

	const visiblePlaceValues = useMemo(
		() =>
			ALL_PLACES.filter((place) => !hiddenDlcs.has(PLACE_DLC_MAP[place])),
		[hiddenDlcs]
	);
	const index = useMemo(() => {
		const isVisibleDlc = ({ dlc }: { dlc: TDlc }) => !hiddenDlcs.has(dlc);
		const customerRareInstance = CustomerRare.getInstance();
		const ingredientInstance = Ingredient.getInstance();
		const recipeInstance = Recipe.getInstance();
		const ingredients = ingredientInstance.data
			.filter(
				({ dlc, name }) =>
					isVisibleDlc({ dlc }) && !hiddenIngredients.has(name)
			)
			.map((item) => ({
				...item,
				tags: ingredientInstance.calculateTagsWithTrend(
					item.tags,
					popularTrend,
					isFamousShop
				),
			}));
		const recipes = recipeInstance.data
			.filter(
				({ dlc, ingredients: itemIngredients, name }) =>
					isVisibleDlc({ dlc }) &&
					!hiddenRecipes.has(name) &&
					itemIngredients.every(
						(ingredient) => !hiddenIngredients.has(ingredient)
					)
			)
			.map((item) => ({
				...item,
				positiveTags: recipeInstance.calculateTagsWithTrend(
					recipeInstance.composeTagsWithPopularTrend(
						item.ingredients,
						[],
						item.positiveTags,
						[],
						null
					),
					popularTrend,
					isFamousShop
				),
			}));

		return [
			...buildGlobalSearchIndex({
				beverages: Beverage.getInstance().data.filter(
					({ dlc, name }) =>
						isVisibleDlc({ dlc }) && !hiddenBeverages.has(name)
				),
				clothes: Clothes.getInstance().data.filter(isVisibleDlc),
				cookers: Cooker.getInstance().data.filter(isVisibleDlc),
				currencies: Currency.getInstance().data.filter(isVisibleDlc),
				customerNormal:
					CustomerNormal.getInstance().data.filter(isVisibleDlc),
				customerRare: customerRareInstance.data.filter((customer) =>
					customerRareInstance.isVisibleWithHiddenDlcs(
						customer,
						hiddenDlcs
					)
				),
				ingredients:
					ingredients as unknown as typeof ingredientInstance.data,
				ornaments: Ornament.getInstance().data.filter(isVisibleDlc),
				partners: Partner.getInstance().data.filter(isVisibleDlc),
				recipes,
			}),
			...buildGlobalSearchPreferenceIndex({
				includeAccountItems: siteConfig.isAccountFeatureClientEnabled,
			}),
		];
	}, [
		hiddenBeverages,
		hiddenDlcs,
		hiddenIngredients,
		hiddenRecipes,
		isFamousShop,
		popularTrend,
	]);
	const ast = useMemo(() => parseGlobalSearchQuery(query), [query]);
	const searchContextSection = ast.resultSection ?? currentSection;
	const fieldValueCache = useMemo(
		() =>
			createGlobalSearchFieldValueCache({
				contextSection: searchContextSection,
				index,
				placeValues: visiblePlaceValues,
			}),
		[index, searchContextSection, visiblePlaceValues]
	);
	const nameSuggestionItemMap = useMemo(() => {
		const itemMap = new Map<string, IGlobalSearchIndexItem>();
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

			if (!itemMap.has(item.name)) {
				itemMap.set(item.name, item);
			}
		});

		return itemMap;
	}, [index, searchContextSection]);
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
		() => getGlobalSearchFilterAction(ast, currentSection),
		[ast, currentSection]
	);
	const relaxedQuery = useMemo(() => createRelaxedQuery(ast), [ast]);
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

				return getFieldValueDisplayText(
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
	const resultListId = `${baseId}-results`;
	const resultStatusId = `${baseId}-status`;
	const selectedResultOptionId =
		selectedResult === null
			? undefined
			: `${baseId}-result-${resolvedSelectedIndex}`;
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
	const shouldShowPreviewPane = results.length > 0;
	const selectedMatch = selectedResult?.matches[0];
	const inputControlledElementId =
		isQueryEmpty || isPrefixSuggestionOnly || isFieldValueSuggestionOnly
			? undefined
			: resultListId;
	const inputActiveDescendantProps =
		inputControlledElementId === undefined ||
		selectedResultOptionId === undefined
			? {}
			: { 'aria-activedescendant': selectedResultOptionId };
	const inputControlsProps =
		inputControlledElementId === undefined
			? {}
			: { 'aria-controls': inputControlledElementId };
	const resultStatusText = isQueryEmpty
		? '输入关键词开始搜索'
		: isPrefixSuggestionOnly
			? `可用前缀${prefixSuggestions.length}个`
			: isFieldValueSuggestionOnly
				? `可用取值${fieldValueSuggestions.length}个`
				: selectedResult === null
					? '没有找到结果'
					: `找到${results.length}个结果，当前选中第${resolvedSelectedIndex + 1}个：${selectedResult.item.name}${selectedMatch === undefined ? '' : `，${selectedMatch.field.label}中命中`}`;
	const recentItems = useMemo(
		() =>
			recentState.items
				.map((id) => index.find((item) => item.id === id))
				.filter(
					(item): item is IGlobalSearchIndexItem => item !== undefined
				),
		[index, recentState.items]
	);
	const hasRecentHistory =
		recentItems.length > 0 || recentState.queries.length > 0;
	const examplePreviewItemMap = useMemo(
		() =>
			new Map(
				GLOBAL_SEARCH_EXAMPLE_QUERIES.map((example) => [
					example.query,
					getExamplePreviewItem({
						contextSection: null,
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

	const clearCloseResetTimer = useCallback(() => {
		if (closeResetTimerRef.current === null) {
			return;
		}

		clearTimeout(closeResetTimerRef.current);
		closeResetTimerRef.current = null;
	}, []);

	const close = useCallback(() => {
		store.setGlobalSearchIsOpen(false);
		setIsInputFocused(false);
		clearCloseResetTimer();
		closeResetTimerRef.current = setTimeout(
			() => {
				resetSearchState();
				closeResetTimerRef.current = null;
			},
			isReducedMotion ? 0 : SPOTLIGHT_CLOSE_RESET_DELAY
		);
	}, [clearCloseResetTimer, isReducedMotion, resetSearchState]);

	const open = useCallback(() => {
		if (isOpen) {
			return;
		}

		vibrate();
		trackGlobalSearchAction('Open From Shortcut');
		clearCloseResetTimer();
		resetSearchState();
		store.setGlobalSearchIsOpen(true);
	}, [
		clearCloseResetTimer,
		isOpen,
		resetSearchState,
		trackGlobalSearchAction,
		vibrate,
	]);

	const handleCloseRequest = useCallback(() => {
		vibrate();
		trackGlobalSearchAction('Close');
		close();
	}, [close, trackGlobalSearchAction, vibrate]);

	const updateRecentState = useCallback((nextState: IRecentState) => {
		setRecentState(nextState);
		writeRecentState(nextState);
	}, []);

	const addOpenedItemToRecentState = useCallback(
		(item: IGlobalSearchIndexItem) => {
			const trimmedQuery = query.trim();
			updateRecentState({
				items: [
					item.id,
					...recentState.items.filter((itemId) => itemId !== item.id),
				].slice(0, MAX_RECENT_ITEMS),
				queries:
					trimmedQuery.length === 0
						? recentState.queries
						: [
								trimmedQuery,
								...recentState.queries.filter(
									(item) => item !== trimmedQuery
								),
							].slice(0, MAX_RECENT_QUERIES),
			});
		},
		[query, recentState, updateRecentState]
	);

	const clearRecentItems = useCallback(() => {
		vibrate();
		trackGlobalSearchAction('Clear Recent Items');
		updateRecentState({ ...recentState, items: [] });
	}, [recentState, trackGlobalSearchAction, updateRecentState, vibrate]);

	const clearRecentQueries = useCallback(() => {
		vibrate();
		trackGlobalSearchAction('Clear Recent Queries');
		updateRecentState({ ...recentState, queries: [] });
	}, [recentState, trackGlobalSearchAction, updateRecentState, vibrate]);

	const handleOpenItem = useCallback(
		(item: IGlobalSearchIndexItem) => {
			vibrate();
			trackGlobalSearchAction(
				item.section === 'preferences'
					? 'Open Preference'
					: 'Open Item',
				`${item.section}:${item.name}`
			);
			addOpenedItemToRecentState(item);
			close();

			if (item.section === 'preferences') {
				if (item.action === 'open-account-modal') {
					accountStore.shared.accountModal.isOpen.set(true);
					return;
				}

				store.setPreferencesModalIsOpen(
					true,
					'spotlight',
					item.targetName as never
				);
				return;
			}

			if (
				item.section === 'customer-normal' ||
				item.section === 'customer-rare'
			) {
				router.push(item.href);
				return;
			}

			store.setGlobalSearchTransientTarget({
				name: item.name,
				section: item.section,
			});

			const targetPathname = getGlobalSearchSectionPath(item.section);
			if (pathname !== targetPathname) {
				router.push(targetPathname, { scroll: false });
			}
		},
		[
			addOpenedItemToRecentState,
			close,
			pathname,
			router,
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
			const shareObject = createItemShareData(
				item.name,
				getItemShareUrl(item)
			);
			if (canShare(shareObject)) {
				navigator.share(shareObject).catch(() => {});
			}
		},
		[trackGlobalSearchAction, vibrate]
	);

	const handleOpenNewWindow = useCallback(
		(item: IGlobalSearchIndexItem) => {
			vibrate();
			trackGlobalSearchAction(
				'Open Item In New Tab',
				`${item.section}:${item.name}`
			);
			globalThis.open(
				getItemShareUrl(item),
				'_blank',
				'noopener,noreferrer'
			);
		},
		[trackGlobalSearchAction, vibrate]
	);

	const handleApplyFilter = useCallback(() => {
		if (filterAction === null) {
			return;
		}

		vibrate();
		trackGlobalSearchAction('Apply Filter', filterAction.targetSection);
		filterAction.run();
		const targetPathname =
			GLOBAL_SEARCH_SECTION_PATH_MAP[filterAction.targetSection];
		if (pathname !== targetPathname) {
			router.push(targetPathname, { scroll: false });
		}
		close();
	}, [
		close,
		filterAction,
		pathname,
		router,
		trackGlobalSearchAction,
		vibrate,
	]);

	const handleBackToEmptyQuery = useCallback(() => {
		vibrate();
		trackGlobalSearchAction('Back To Search Home');
		setQuery('');
		inputRef.current?.focus();
	}, [trackGlobalSearchAction, vibrate]);

	const applyQueryPreset = useCallback(
		(nextQuery: string, source: string) => {
			vibrate();
			trackGlobalSearchAction(source);
			setQuery(nextQuery);
			inputRef.current?.focus();
		},
		[trackGlobalSearchAction, vibrate]
	);

	const handlePrefixSuggestionPress = useCallback(
		(suggestion: (typeof prefixSuggestions)[number]) => {
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
			if (activeFieldCondition === null) {
				return;
			}

			vibrate();
			trackGlobalSearchAction(
				'Select Field Value Suggestion',
				activeFieldCondition.fieldType
			);
			setQuery((value) =>
				replaceActiveFieldValue(
					value,
					activeFieldCondition.prefix,
					suggestion
				)
			);
			inputRef.current?.focus();
		},
		[activeFieldCondition, trackGlobalSearchAction, vibrate]
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

			if (event.key === 'Escape' && !isComposing) {
				event.preventDefault();
				event.stopPropagation();
				handleCloseRequest();
				return;
			}

			if (event.key === 'ArrowDown') {
				event.preventDefault();
				setSelectedIndex((index) => {
					const nextIndex = Math.min(
						index + 1,
						Math.max(results.length - 1, 0)
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
				if (selectedResult !== null) {
					handleOpenItem(selectedResult.item);
				}
				return;
			}

			if (event.key === 'Backspace' && !isComposing) {
				const input = event.currentTarget;
				const selectionStart = input.selectionStart ?? 0;
				const selectionEnd = input.selectionEnd ?? selectionStart;
				if (selectionStart !== selectionEnd) {
					return;
				}

				const deletionRange = getPrefixTokenDeletionRange(
					query,
					selectionStart
				);
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
			}
		},
		[
			handleCloseRequest,
			handleOpenItem,
			query,
			results.length,
			selectedResult,
			vibrate,
		]
	);

	useEffect(() => {
		setRecentState(readRecentState());
	}, []);

	useEffect(() => {
		setIsApplePlatform(checkIsApplePlatform());
	}, []);

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
		if (isOpen) {
			if (closeResetTimerRef.current !== null) {
				clearCloseResetTimer();
				resetSearchState();
			}
			requestAnimationFrame(() => {
				inputRef.current?.focus();
			});
		}
	}, [clearCloseResetTimer, isOpen, resetSearchState]);

	useEffect(() => {
		setSelectedIndex(0);
	}, [query]);

	useEffect(() => {
		setSelectedIndex((index) =>
			Math.min(index, Math.max(results.length - 1, 0))
		);
	}, [results.length]);

	useEffect(() => {
		if (
			!isOpen ||
			isQueryEmpty ||
			isPrefixSuggestionOnly ||
			isFieldValueSuggestionOnly ||
			results.length === 0
		) {
			return;
		}

		const resultElement = [
			...(rootRef.current?.querySelectorAll<HTMLElement>(
				'[data-global-search-result-index]'
			) ?? []),
		].find(
			({ dataset }) =>
				dataset['globalSearchResultIndex'] ===
				resolvedSelectedIndex.toString()
		);

		resultElement?.scrollIntoView({ block: 'nearest' });
	}, [
		isOpen,
		isFieldValueSuggestionOnly,
		isPrefixSuggestionOnly,
		isQueryEmpty,
		resolvedSelectedIndex,
		results.length,
	]);

	useEffect(() => {
		const handleKeyDown = (event: globalThis.KeyboardEvent) => {
			if (isOpen && event.key === 'Escape' && !event.isComposing) {
				event.preventDefault();
				handleCloseRequest();
				return;
			}

			const hasPlatformSearchModifier = isApplePlatform
				? event.metaKey && !event.ctrlKey
				: event.ctrlKey && !event.metaKey;
			const isCommandSearchShortcut =
				event.key.toLowerCase() === 'k' &&
				hasPlatformSearchModifier &&
				!event.altKey &&
				!event.shiftKey;
			if (isCommandSearchShortcut) {
				event.preventDefault();
				open();
				return;
			}

			const isPlainSlashShortcut =
				event.key === '/' &&
				!event.ctrlKey &&
				!event.metaKey &&
				!event.altKey &&
				!event.shiftKey;
			if (isPlainSlashShortcut && !isTextEntryElement(event.target)) {
				event.preventDefault();
				open();
			}
		};

		globalThis.addEventListener('keydown', handleKeyDown, {
			capture: true,
		});

		return () => {
			globalThis.removeEventListener('keydown', handleKeyDown, {
				capture: true,
			});
		};
	}, [handleCloseRequest, isApplePlatform, isOpen, open]);

	const renderItemVisual = (
		item: IGlobalSearchIndexItem | null | undefined,
		size: 'sm' | 'md'
	) => {
		const visualSizeClassName = size === 'sm' ? 'h-6 w-6' : 'h-9 w-9';
		const isCustomerNormalVisual = item?.spriteTarget === 'customer_normal';
		const customerNormalCropSizeClassName =
			size === 'sm'
				? 'h-[1.15rem] w-[1.15rem]'
				: 'h-[1.55rem] w-[1.55rem]';

		return (
			<span
				className={cn(
					'flex shrink-0 items-center justify-center overflow-hidden rounded-small border border-default-200/50 bg-default/35 shadow-sm',
					visualSizeClassName
				)}
			>
				{item?.spriteTarget === undefined ||
				item.targetName === undefined ? (
					<FontAwesomeIcon
						icon={
							item?.section === 'preferences'
								? faSliders
								: faMagnifyingGlass
						}
						className={cn(
							size === 'sm' ? 'w-3' : 'w-4',
							'text-foreground-500'
						)}
					/>
				) : isCustomerNormalVisual ? (
					<span
						className={cn(
							'block overflow-hidden rounded-full',
							customerNormalCropSizeClassName
						)}
					>
						<Sprite
							target={item.spriteTarget}
							name={item.targetName as never}
							size={getSpriteSize(item, size)}
							className={getSpriteClassName(item, size)}
						/>
					</span>
				) : (
					<Sprite
						target={item.spriteTarget}
						name={item.targetName as never}
						size={getSpriteSize(item, size)}
						className={getSpriteClassName(item, size)}
					/>
				)}
			</span>
		);
	};

	const renderHistoryHeader = (
		title: string,
		count: number,
		clearLabel: string,
		onClear: () => void
	) => (
		<div className="flex items-center gap-1.5 px-0.5">
			<h3 className="text-tiny font-semibold text-foreground-600">
				{title}
			</h3>
			<span className="rounded-small bg-default/40 px-1.5 py-0.5 text-[0.65rem] leading-none text-foreground-500">
				{count}
			</span>
			<Tooltip showArrow content={clearLabel} placement="right">
				<Button
					isIconOnly
					aria-label={clearLabel}
					size="sm"
					variant="light"
					onPress={onClear}
					className="h-5 w-5 min-w-5 rounded-small text-foreground-400 data-[hover=true]:bg-danger/10 data-[hover=true]:text-danger"
				>
					<FontAwesomeIcon icon={faTrashCan} className="w-3" />
				</Button>
			</Tooltip>
		</div>
	);

	const renderResultRow = (result: IGlobalSearchResult, index: number) => {
		const { item } = result;
		const match = getResultPrimaryMatch(result);
		const isSelected = resolvedSelectedIndex === index;

		return (
			<Button
				key={item.id}
				id={`${baseId}-result-${index}`}
				data-global-search-result-index={index}
				variant="light"
				role="option"
				aria-selected={isSelected}
				onPress={() => {
					setSelectedIndex(index);
				}}
				onDoubleClick={() => {
					handleOpenItem(item);
				}}
				className={cn(
					'flex h-auto min-h-14 w-full min-w-0 justify-start gap-3 overflow-hidden rounded-small border px-3 py-2.5 text-left transition motion-reduce:transition-none',
					isSelected
						? cn(
								'border-primary/35 bg-primary/10 text-primary-700 shadow-[inset_3px_0_0_rgba(212,151,45,0.65)] dark:text-primary',
								isHighAppearance && 'backdrop-blur'
							)
						: cn(
								'border-default-200/50 bg-background/45 data-[hover=true]:border-default-300/80 data-[hover=true]:bg-default/35 dark:bg-content1/35',
								isHighAppearance &&
									'bg-content1/40 backdrop-blur-sm data-[hover=true]:bg-content1/55 dark:bg-content1/25 dark:data-[hover=true]:bg-content1/40'
							)
				)}
			>
				{renderItemVisual(item, 'md')}
				<span className="min-w-0 flex-1 overflow-hidden">
					<span className="flex min-w-0 items-center gap-2">
						<span className="truncate text-small font-semibold">
							{item.name}
						</span>
						<span
							className={cn(
								'shrink-0 rounded-small px-1.5 py-0.5 text-tiny',
								isSelected
									? 'bg-primary/15 text-primary-700 dark:text-primary'
									: 'bg-default/40 text-foreground-500'
							)}
						>
							{item.sectionLabel}
						</span>
					</span>
					<span className="mt-0.5 block max-w-full truncate text-tiny text-foreground-500">
						{match === undefined
							? item.description
							: `${match.field.label}中命中：${match.snippet}`}
					</span>
				</span>
			</Button>
		);
	};

	const renderEmptyQuery = () => (
		<div className="space-y-5 px-0.5 py-0.5">
			<SpotlightMotionBlock motionKey="examples" className="space-y-3">
				<div className="space-y-1 px-0.5">
					<h3 className="text-small font-semibold text-foreground-700">
						搜索示例
					</h3>
					<p className="text-tiny leading-5 text-foreground-500">
						直接输入会搜索名称、简介、标签等内容，也支持拼音全拼和首字母；用
						<SearchSyntaxToken>@料理</SearchSyntaxToken>、
						<SearchSyntaxToken>@酒水</SearchSyntaxToken>、
						<SearchSyntaxToken>@设置</SearchSyntaxToken>
						限定结果分区，用
						<SearchSyntaxToken>@食材</SearchSyntaxToken>、
						<SearchSyntaxToken>@标签</SearchSyntaxToken>、
						<SearchSyntaxToken>@来源</SearchSyntaxToken>
						限定字段，前缀可组合使用。
					</p>
				</div>
				<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
					{GLOBAL_SEARCH_EXAMPLE_QUERIES.map(
						({ description, query }) => {
							const previewItem =
								examplePreviewItemMap.get(query);

							return (
								<Button
									key={query}
									size="sm"
									variant="light"
									onPress={() => {
										applyQueryPreset(
											query,
											'Use Example Query'
										);
									}}
									className="h-auto min-h-14 justify-start gap-2.5 rounded-small border border-default-200/55 bg-background/45 px-2.5 py-2 text-left backdrop-blur data-[hover=true]:border-primary/25 data-[hover=true]:bg-primary/10 dark:bg-content1/30"
								>
									{renderItemVisual(previewItem, 'sm')}
									<span className="min-w-0">
										<span className="block truncate text-small font-medium">
											{renderSearchSyntax(query)}
										</span>
										<span className="block truncate text-tiny text-foreground-500">
											{description}
										</span>
									</span>
								</Button>
							);
						}
					)}
				</div>
			</SpotlightMotionBlock>
			<AnimatePresence mode="popLayout" initial={false}>
				{hasRecentHistory && (
					<SpotlightMotionBlock
						motionKey="recent-history"
						className="space-y-3"
					>
						<div className="px-0.5">
							<h3 className="text-small font-semibold text-foreground-700">
								最近记录
							</h3>
						</div>
						<div className="space-y-3">
							<AnimatePresence mode="popLayout" initial={false}>
								{recentItems.length > 0 && (
									<SpotlightMotionBlock
										motionKey="recent-items"
										className="space-y-2"
									>
										{renderHistoryHeader(
											'最近打开',
											recentItems.length,
											'清空最近打开',
											clearRecentItems
										)}
										<div className="flex flex-wrap gap-2">
											{recentItems.map((item) => (
												<Button
													key={item.id}
													size="sm"
													variant="flat"
													onPress={() => {
														handleOpenItem(item);
													}}
													className="h-8 max-w-full gap-1.5 rounded-small border border-default-200/55 bg-background/45 px-2 text-foreground-600 backdrop-blur data-[hover=true]:border-primary/25 data-[hover=true]:bg-primary/10 data-[hover=true]:text-primary-700 dark:bg-content1/30"
												>
													{renderItemVisual(
														item,
														'sm'
													)}
													<span className="min-w-0 truncate">
														{item.sectionLabel} ·{' '}
														{item.name}
													</span>
												</Button>
											))}
										</div>
									</SpotlightMotionBlock>
								)}
							</AnimatePresence>
							<AnimatePresence mode="popLayout" initial={false}>
								{recentState.queries.length > 0 && (
									<SpotlightMotionBlock
										motionKey="recent-queries"
										className="space-y-2"
									>
										{renderHistoryHeader(
											'最近查询',
											recentState.queries.length,
											'清空最近查询',
											clearRecentQueries
										)}
										<div className="flex flex-wrap gap-2">
											{recentState.queries.map(
												(recentQuery) => (
													<Button
														key={recentQuery}
														size="sm"
														variant="flat"
														onPress={() => {
															applyQueryPreset(
																recentQuery,
																'Use Recent Query'
															);
														}}
														className="h-8 rounded-small border border-default-200/55 bg-background/45 px-2 text-foreground-600 backdrop-blur data-[hover=true]:border-primary/25 data-[hover=true]:bg-primary/10 data-[hover=true]:text-primary-700 dark:bg-content1/30"
													>
														<span className="min-w-0 truncate">
															{renderSearchSyntax(
																recentQuery
															)}
														</span>
													</Button>
												)
											)}
										</div>
									</SpotlightMotionBlock>
								)}
							</AnimatePresence>
						</div>
					</SpotlightMotionBlock>
				)}
			</AnimatePresence>
		</div>
	);

	const renderPrefixSuggestionContent = () => (
		<>
			<div className="mb-2 flex items-center gap-2 px-0.5">
				<span className="text-tiny font-semibold text-foreground-600">
					可用前缀
				</span>
				<span className="text-tiny text-foreground-400">
					选择后继续输入关键词
				</span>
			</div>
			<div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
				{prefixSuggestions.map((suggestion) => (
					<Button
						key={`${suggestion.kind}:${suggestion.key}`}
						size="sm"
						variant="light"
						onPress={() => {
							handlePrefixSuggestionPress(suggestion);
						}}
						className="flex h-9 min-w-0 justify-between gap-2 rounded-small border border-default-200/55 bg-background/45 px-2 text-left text-small transition data-[hover=true]:border-primary/25 data-[hover=true]:bg-primary/10 motion-reduce:transition-none dark:bg-content1/30"
					>
						<span className="min-w-0 truncate font-medium text-foreground-700">
							{renderSearchSyntax(`@${suggestion.alias}`)}
						</span>
						<span className="shrink-0 text-tiny text-foreground-400">
							{suggestion.kind === 'section' ? '分区' : '字段'}
						</span>
					</Button>
				))}
			</div>
		</>
	);

	const renderFieldValueSuggestionContent = () => {
		const fieldLabel =
			activeFieldCondition === null
				? ''
				: getFieldPrefixLabel(
						activeFieldCondition.fieldType,
						ast.resultSection
					);
		const spriteTarget =
			activeFieldCondition === null
				? undefined
				: MATCH_FIELD_SPRITE_TARGET_MAP[activeFieldCondition.fieldType];

		return (
			<>
				<div className="mb-2 flex items-center gap-2 px-0.5">
					<span className="text-tiny font-semibold text-foreground-600">
						可用{fieldLabel}
					</span>
					<span className="text-tiny text-foreground-400">
						选择后填入当前条件
					</span>
				</div>
				<div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
					{fieldValueSuggestions.map(
						(suggestion, suggestionIndex) => {
							const suggestionDisplayText =
								activeFieldCondition === null
									? suggestion
									: getFieldValueDisplayText(
											activeFieldCondition.fieldType,
											suggestion
										);
							const nameSuggestionItem =
								activeFieldCondition?.fieldType === 'name'
									? nameSuggestionItemMap.get(suggestion)
									: undefined;
							const suggestionSpriteTarget =
								nameSuggestionItem?.spriteTarget ??
								spriteTarget;
							const suggestionSpriteName =
								nameSuggestionItem?.targetName ?? suggestion;

							return (
								<Button
									key={`${suggestion}:${nameSuggestionItem?.section ?? 'field'}:${suggestionIndex}`}
									size="sm"
									variant="light"
									onPress={() => {
										handleFieldValueSuggestionPress(
											suggestion
										);
									}}
									className="flex h-9 min-w-0 justify-between gap-2 rounded-small border border-default-200/55 bg-background/45 px-2 text-left text-small transition data-[hover=true]:border-primary/25 data-[hover=true]:bg-primary/10 motion-reduce:transition-none dark:bg-content1/30"
								>
									<span className="flex min-w-0 items-center gap-1.5">
										{suggestionSpriteTarget !==
											undefined && (
											<span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-small border border-default-200/55 bg-default/35">
												<Sprite
													target={
														suggestionSpriteTarget
													}
													name={
														suggestionSpriteName as never
													}
													size={1}
												/>
											</span>
										)}
										<span className="min-w-0 truncate font-medium text-foreground-700">
											{suggestionDisplayText}
										</span>
									</span>
									<span className="shrink-0 text-tiny text-foreground-400">
										{nameSuggestionItem?.sectionLabel ??
											fieldLabel}
									</span>
								</Button>
							);
						}
					)}
				</div>
			</>
		);
	};

	const renderPreview = () => {
		if (selectedResult === null) {
			return (
				<SpotlightPreviewMotion
					motionKey="empty"
					className="flex h-full min-h-48 items-start justify-center px-4 pt-24 text-center"
				>
					<p className="max-w-56 text-small leading-5 text-foreground-400">
						选择一个结果查看摘要
					</p>
				</SpotlightPreviewMotion>
			);
		}

		const { item, matches } = selectedResult;
		const shareUrl = getItemShareUrl(item);
		const previewMatches = matches.filter(
			({ field }) =>
				field.fieldType !== 'description' ||
				item.description.length === 0
		);

		return (
			<div className="flex h-full min-h-0 flex-col gap-3">
				<div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pr-1.5 scrollbar-hide">
					<SpotlightPreviewMotion
						motionKey={item.id}
						className="min-w-0 space-y-3 overflow-hidden pb-0.5"
					>
						<div className="flex min-w-0 items-start gap-3 rounded-small border border-default-200/40 bg-default/20 p-2.5">
							{renderItemVisual(item, 'md')}
							<div className="min-w-0 flex-1 overflow-hidden">
								<p className="text-tiny font-medium text-foreground-500">
									{item.sectionLabel}
								</p>
								<h2 className="truncate text-lg font-semibold leading-tight">
									{item.name}
								</h2>
								{item.description.length > 0 && (
									<p className="mt-1 line-clamp-3 max-w-full break-words text-small leading-5 text-foreground-600">
										{item.description}
									</p>
								)}
							</div>
						</div>
						{previewMatches.length > 0 && (
							<div className="space-y-1">
								{previewMatches
									.slice(0, 4)
									.map((match, index) => (
										<div
											key={`${match.field.fieldType}-${index}`}
											className="flex min-h-8 min-w-0 max-w-full flex-wrap items-center overflow-hidden rounded-small border border-default-200/40 bg-default/25 px-2 py-0.5 text-small leading-5"
										>
											<span className="shrink-0 font-medium">
												{match.field.label}：
											</span>
											<span className="inline-flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1">
												{renderMatchedFieldContent(
													item,
													match
												)}
											</span>
										</div>
									))}
							</div>
						)}
					</SpotlightPreviewMotion>
				</div>
				<div className="flex min-w-0 shrink-0 flex-wrap gap-2 border-t border-default-200/60 pt-3">
					<Button
						color="primary"
						size="sm"
						className="h-9 min-w-0 flex-1 px-2 sm:flex-none sm:px-3"
						onPress={() => {
							handleOpenItem(item);
						}}
					>
						{item.section === 'preferences'
							? '打开设置'
							: '查看详情'}
					</Button>
					{item.section !== 'preferences' && (
						<>
							<Popover showArrow placement="top">
								<PopoverTrigger>
									<Button
										size="sm"
										variant="flat"
										className="h-9 min-w-0 flex-1 px-2 sm:flex-none sm:px-3"
										startContent={
											<FontAwesomeIcon icon={faShare} />
										}
										onPress={() => {
											handleShareItem(item);
										}}
									>
										分享
									</Button>
								</PopoverTrigger>
								<PopoverContent>
									<p className="mr-4 cursor-default select-none self-end text-right text-tiny text-default-500">
										点击以复制当前选中项的链接↓
									</p>
									<Snippet
										disableTooltip
										size="sm"
										symbol={
											<FontAwesomeIcon
												icon={faLink}
												className="mr-1 !align-middle text-default-700"
											/>
										}
										classNames={{
											pre: 'flex max-w-screen-p-60 items-center whitespace-normal break-all',
										}}
									>
										{shareUrl}
									</Snippet>
								</PopoverContent>
							</Popover>
							<Button
								size="sm"
								variant="flat"
								className="h-9 min-w-0 flex-1 px-2 sm:flex-none sm:px-3"
								startContent={
									<FontAwesomeIcon
										icon={faArrowUpRightFromSquare}
									/>
								}
								onPress={() => {
									handleOpenNewWindow(item);
								}}
							>
								新标签页打开
							</Button>
						</>
					)}
				</div>
			</div>
		);
	};

	return (
		<Modal
			isOpen={isOpen}
			motionProps={SPOTLIGHT_MODAL_MOTION_PROPS}
			onClose={handleCloseRequest}
			size="5xl"
			scrollShadow={false}
			classNames={{
				base: 'overflow-hidden',
				body: 'gap-0 px-0 py-0',
				closeButton: 'hidden',
				content: 'py-0',
			}}
		>
			<div
				ref={rootRef}
				className="flex min-h-0 flex-col text-foreground"
			>
				<div
					className={cn(
						'sticky top-0 z-30 border-b border-default-200/70 px-4 py-3 sm:px-5',
						isHighAppearance
							? 'bg-background/65 backdrop-blur dark:bg-content1/50'
							: 'bg-background/80 dark:bg-content1/45'
					)}
				>
					<div className="flex items-center gap-2">
						<motion.div
							{...(isReducedMotion
								? {
										style: {
											opacity: isQueryEmpty ? 0 : 1,
											width: isQueryEmpty ? 0 : '3rem',
										},
									}
								: {
										animate: {
											opacity: isQueryEmpty ? 0 : 1,
											width: isQueryEmpty ? 0 : '3rem',
										},
										initial: false,
										transition:
											SPOTLIGHT_CONTENT_TRANSITION,
									})}
							aria-hidden={isQueryEmpty}
							className={cn(
								'shrink-0 overflow-hidden',
								isQueryEmpty && 'pointer-events-none'
							)}
						>
							<Button
								isIconOnly
								aria-label="返回搜索首页"
								isDisabled={isQueryEmpty}
								size="lg"
								variant="light"
								onPress={handleBackToEmptyQuery}
								className={cn(
									'h-12 w-12 min-w-12 rounded-small border border-default-200/70 bg-default-100/80 text-foreground-500 shadow-sm transition-background data-[hover=true]:bg-default-100/90 data-[pressed=true]:bg-default-100 motion-reduce:transition-none dark:bg-default-100/20 dark:data-[hover=true]:bg-default-100/25 dark:data-[pressed=true]:bg-default-100/30',
									isHighAppearance &&
										'bg-default/45 backdrop-blur data-[hover=true]:bg-default/55 data-[pressed=true]:bg-default/60'
								)}
							>
								<FontAwesomeIcon
									icon={faArrowLeft}
									className="w-4"
								/>
							</Button>
						</motion.div>
						<Input
							isClearable
							ref={inputRef}
							value={query}
							onValueChange={setQuery}
							onBlur={handleInputBlur}
							onFocus={handleInputFocus}
							onKeyDown={handleInputKeyDown}
							aria-label="全局搜索"
							aria-autocomplete="list"
							aria-describedby={resultStatusId}
							aria-expanded={!isQueryEmpty}
							placeholder="搜索料理、酒水、食材、稀客、设置..."
							role="combobox"
							{...inputActiveDescendantProps}
							{...inputControlsProps}
							classNames={{
								base: 'min-w-0 flex-1',
								clearButton: cn(
									'bg-transparent text-foreground-500 transition duration-150 ease-out data-[hover=true]:bg-default/30 data-[pressed=true]:bg-default/40 data-[hover=true]:text-foreground-700 motion-reduce:transition-none',
									isInputFocused && query.length > 0
										? '!scale-100 !opacity-100'
										: '!pointer-events-none !scale-85 !opacity-0'
								),
								input: 'text-medium',
								inputWrapper: cn(
									'h-12 rounded-small border border-default-200/70 bg-default-100/80 shadow-sm transition-background motion-reduce:transition-none dark:bg-default-100/20',
									isHighAppearance &&
										'bg-default/45 backdrop-blur data-[hover=true]:bg-default/55'
								),
							}}
							startContent={
								<FontAwesomeIcon
									icon={faMagnifyingGlass}
									className="w-4 text-foreground-500"
								/>
							}
						/>
						<span
							id={resultStatusId}
							className="sr-only"
							aria-live="polite"
						>
							{resultStatusText}
						</span>
					</div>
				</div>

				<AnimatePresence initial={false}>
					{shouldShowQueryMeta && (
						<motion.div
							key="query-meta"
							animate={{ height: 'auto', opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							initial={{ height: 0, opacity: 0 }}
							style={{ overflow: 'hidden' }}
							transition={SPOTLIGHT_LIST_TRANSITION}
						>
							<div
								className={cn(
									'flex min-h-9 flex-wrap items-center gap-2 border-b border-default-200/60 px-4 py-2 text-tiny text-foreground-500 sm:px-5',
									isHighAppearance
										? 'bg-content1/25 backdrop-blur dark:bg-content1/20'
										: 'bg-default/10 dark:bg-content1/20'
								)}
							>
								{parsedSection !== null &&
									parsedSection !== undefined && (
										<span className="rounded-small border border-primary/20 bg-primary/10 px-2 py-1 font-medium text-primary-700 dark:text-primary">
											结果：{parsedSection.label}
										</span>
									)}
								{ast.fieldConditions.map(
									({ fieldType, keyword }, index) => {
										const fieldLabel = getFieldPrefixLabel(
											fieldType,
											ast.resultSection
										);
										const displayValue =
											fieldConditionDisplayValues[
												index
											] ?? keyword;
										return (
											<span
												key={`${fieldType}-${index}`}
												className="rounded-small border border-default-200/55 bg-background/45 px-2 py-1 dark:bg-content1/30"
											>
												{fieldLabel}
												{keyword
													? `：${displayValue}`
													: '：等待关键词'}
											</span>
										);
									}
								)}
								{filterAction !== null && (
									<Tooltip
										showArrow
										content={filterAction.description}
										placement="bottom"
									>
										<Button
											size="sm"
											variant="flat"
											color="primary"
											startContent={
												<FontAwesomeIcon
													icon={faFilter}
												/>
											}
											onPress={handleApplyFilter}
											aria-label={
												filterAction.description
											}
										>
											{filterAction.label}
										</Button>
									</Tooltip>
								)}
								{ast.diagnostics.map((diagnostic, index) => (
									<span
										key={`${diagnostic}-${index}`}
										className="rounded-small border border-warning/20 bg-warning/10 px-2 py-1 text-warning-700 dark:text-warning"
									>
										{renderSearchSyntax(diagnostic)}
									</span>
								))}
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				<AnimatePresence initial={false}>
					{prefixSuggestions.length > 0 &&
						fieldValueSuggestions.length === 0 &&
						!isPrefixSuggestionOnly && (
							<motion.div
								key="prefix-suggestions"
								animate={{ height: 'auto', opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								initial={{ height: 0, opacity: 0 }}
								style={{ overflow: 'hidden' }}
								transition={SPOTLIGHT_LIST_TRANSITION}
							>
								<div
									className={cn(
										'border-b border-default-200/60 px-4 py-3 sm:px-5',
										isHighAppearance
											? 'bg-content1/25 backdrop-blur dark:bg-content1/20'
											: 'bg-default/10 dark:bg-content1/20'
									)}
								>
									{renderPrefixSuggestionContent()}
								</div>
							</motion.div>
						)}
				</AnimatePresence>

				<AnimatePresence initial={false}>
					{fieldValueSuggestions.length > 0 &&
						!isFieldValueSuggestionOnly && (
							<motion.div
								key="field-value-suggestions"
								animate={{ height: 'auto', opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								initial={{ height: 0, opacity: 0 }}
								style={{ overflow: 'hidden' }}
								transition={SPOTLIGHT_LIST_TRANSITION}
							>
								<div
									className={cn(
										'border-b border-default-200/60 px-4 py-3 sm:px-5',
										isHighAppearance
											? 'bg-content1/25 backdrop-blur dark:bg-content1/20'
											: 'bg-default/10 dark:bg-content1/20'
									)}
								>
									{renderFieldValueSuggestionContent()}
								</div>
							</motion.div>
						)}
				</AnimatePresence>

				<AnimatePresence mode="popLayout" initial={false}>
					{isQueryEmpty ? (
						<motion.div
							key="empty-query"
							{...(isReducedMotion
								? {}
								: {
										animate: 'animate',
										exit: 'exit',
										initial: 'initial',
										transition:
											SPOTLIGHT_CONTENT_TRANSITION,
										variants:
											SPOTLIGHT_MAIN_CONTENT_VARIANTS,
									})}
							className="min-h-0 flex-1"
						>
							<SpotlightScrollMask className="max-h-[calc(var(--safe-h-dvh)-9rem)] p-4 sm:p-5 md:h-[30rem] md:max-h-none">
								{renderEmptyQuery()}
							</SpotlightScrollMask>
						</motion.div>
					) : isPrefixSuggestionOnly ? (
						<motion.div
							key="prefix-only"
							{...(isReducedMotion
								? {}
								: {
										animate: 'animate',
										exit: 'exit',
										initial: 'initial',
										transition:
											SPOTLIGHT_CONTENT_TRANSITION,
										variants:
											SPOTLIGHT_MAIN_CONTENT_VARIANTS,
									})}
							className="min-h-0 flex-1"
						>
							<SpotlightScrollMask className="max-h-[calc(var(--safe-h-dvh)-9rem)] p-4 sm:p-5 md:h-[30rem] md:max-h-none">
								<SpotlightMotionBlock
									motionKey="prefix-suggestion-only"
									className="px-0.5 py-0.5"
								>
									{renderPrefixSuggestionContent()}
								</SpotlightMotionBlock>
							</SpotlightScrollMask>
						</motion.div>
					) : isFieldValueSuggestionOnly ? (
						<motion.div
							key="field-value-only"
							{...(isReducedMotion
								? {}
								: {
										animate: 'animate',
										exit: 'exit',
										initial: 'initial',
										transition:
											SPOTLIGHT_CONTENT_TRANSITION,
										variants:
											SPOTLIGHT_MAIN_CONTENT_VARIANTS,
									})}
							className="min-h-0 flex-1"
						>
							<SpotlightScrollMask className="max-h-[calc(var(--safe-h-dvh)-9rem)] p-4 sm:p-5 md:h-[30rem] md:max-h-none">
								<SpotlightMotionBlock
									motionKey="field-value-suggestion-only"
									className="px-0.5 py-0.5"
								>
									{renderFieldValueSuggestionContent()}
								</SpotlightMotionBlock>
							</SpotlightScrollMask>
						</motion.div>
					) : (
						<motion.div
							key="search-results"
							{...(isReducedMotion
								? {}
								: {
										animate: 'animate',
										exit: 'exit',
										initial: 'initial',
										transition:
											SPOTLIGHT_CONTENT_TRANSITION,
										variants:
											SPOTLIGHT_MAIN_CONTENT_VARIANTS,
									})}
							className={cn(
								'relative grid min-h-0 min-w-0 flex-1 gap-0 overflow-visible md:h-[30rem]',
								shouldShowPreviewPane
									? 'md:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)]'
									: 'md:grid-cols-1'
							)}
						>
							<div
								role="listbox"
								id={resultListId}
								aria-label="搜索结果"
								className={cn(
									'min-h-0 min-w-0 overflow-hidden border-b border-default-200/80 md:border-b-0 md:border-r',
									isHighAppearance
										? 'bg-content1/25 backdrop-blur dark:bg-content1/15'
										: 'bg-background/40 dark:bg-content1/20'
								)}
							>
								<SpotlightScrollMask className="p-3 md:h-[30rem]">
									{results.length === 0 ? (
										<SpotlightMotionBlock
											motionKey="no-results"
											className="mx-auto flex min-h-40 max-w-sm flex-col items-center justify-center gap-2 rounded-small border border-default-200/50 bg-background/45 px-4 text-center text-small text-foreground-500 backdrop-blur dark:bg-content1/30"
										>
											<FontAwesomeIcon
												icon={faMagnifyingGlass}
												className="mb-1 w-4 text-foreground-300"
											/>
											<div className="space-y-1">
												<p className="font-medium text-foreground-600">
													没有找到结果
												</p>
												<p className="text-tiny text-foreground-400">
													试试删除部分前缀或换一个关键词
												</p>
											</div>
											{shouldShowRelaxedQuery && (
												<div className="flex justify-center gap-2">
													<Button
														size="sm"
														variant="flat"
														onPress={() => {
															applyQueryPreset(
																relaxedQuery,
																'Relax Query'
															);
														}}
													>
														放宽条件
													</Button>
												</div>
											)}
										</SpotlightMotionBlock>
									) : (
										<AnimatePresence
											mode="popLayout"
											initial={false}
										>
											<motion.div
												key={query}
												layout="position"
												className="space-y-1.5"
											>
												{results.map((result, index) =>
													isReducedMotion ? (
														<div
															key={result.item.id}
														>
															{renderResultRow(
																result,
																index
															)}
														</div>
													) : (
														<motion.div
															layout="position"
															key={result.item.id}
															animate="animate"
															exit="exit"
															initial="initial"
															transition={{
																...SPOTLIGHT_LIST_TRANSITION,
																delay:
																	Math.min(
																		index,
																		6
																	) * 0.018,
															}}
															variants={
																SPOTLIGHT_RESULT_VARIANTS
															}
														>
															{renderResultRow(
																result,
																index
															)}
														</motion.div>
													)
												)}
											</motion.div>
										</AnimatePresence>
									)}
								</SpotlightScrollMask>
							</div>
							{shouldShowPreviewPane && (
								<div
									className={cn(
										'sticky bottom-0 z-20 min-h-0 min-w-0 max-w-full overflow-hidden rounded-t-small border-t border-default-200/80 p-4 shadow-[0_-2px_10px_rgba(17,24,39,0.07)] md:static md:h-[30rem] md:rounded-none md:border-t-0 md:shadow-none',
										isHighAppearance
											? 'bg-content1/65 backdrop-blur-lg dark:bg-content1/50'
											: 'bg-background/90 dark:bg-content1/75'
									)}
								>
									{renderPreview()}
								</div>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</Modal>
	);
}
