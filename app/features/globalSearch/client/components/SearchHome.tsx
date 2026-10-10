import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence } from 'framer-motion';
import { Fragment } from 'react';

import Button from '@/design/ui/components/button';
import Tooltip from '@/design/ui/components/tooltip';

import type {
	IGlobalSearchExampleQuery,
	IGlobalSearchIndexItem,
	TGlobalSearchFieldType,
	TGlobalSearchSection,
} from '@/features/globalSearch/contracts';
import { globalSearchMessages } from '@/features/globalSearch/client/messages';
import {
	GLOBAL_SEARCH_FIELD_PREFIX_GROUPS,
	GLOBAL_SEARCH_SECTION_PREFIX_GROUPS,
} from '@/features/globalSearch/core/constants';
import { GLOBAL_SEARCH_LOCALIZED_SYNTAX } from '@/features/globalSearch/core/localizedSyntax';
import { getSectionDisplayLabel } from '@/features/globalSearch/core/parser';
import { type IGlobalSearchRecentState } from '@/features/globalSearch/shapes/recentSearchShape';

import { type TLocale } from '@/shared/i18n/locale';
import { useI18n } from '@/shared/i18n/useI18n';

import { SearchItemVisual } from './SearchItemVisual';
import { SearchSyntaxToken, renderSearchSyntax } from './SearchSyntax';
import { SpotlightMotionBlock } from './SpotlightMotion';

const SECTION_ALIAS_MAP = new Map(
	GLOBAL_SEARCH_SECTION_PREFIX_GROUPS.map((group) => [
		group.key,
		group.aliases[0] as string,
	])
);
const FIELD_ALIAS_MAP = new Map(
	GLOBAL_SEARCH_FIELD_PREFIX_GROUPS.map((group) => [
		group.key,
		group.aliases[0] as string,
	])
);

function getExampleSyntaxTokens(locale: TLocale) {
	const localized = GLOBAL_SEARCH_LOCALIZED_SYNTAX[locale];
	const section = (key: TGlobalSearchSection) =>
		`@${
			localized?.sections[key].aliases[0] ??
			SECTION_ALIAS_MAP.get(key) ??
			key
		}`;
	const field = (key: TGlobalSearchFieldType) =>
		`@${
			localized?.fields[key].aliases?.[0] ??
			FIELD_ALIAS_MAP.get(key) ??
			key
		}`;

	return {
		fieldTokens: (['ingredient', 'tag', 'from'] as const).map(field),
		sectionTokens: (['foods', 'beverages', 'preferences'] as const).map(
			section
		),
	};
}

function HistoryHeader({
	clearLabel,
	count,
	onClear,
	title,
}: {
	clearLabel: string;
	count: number;
	onClear: () => void;
	title: string;
}) {
	return (
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
}

export function SearchHome({
	examplePreviewItemMap,
	examples,
	locale,
	onApplyQuery,
	onClearItems,
	onClearQueries,
	onOpenItem,
	recentItems,
	recentState,
}: {
	examplePreviewItemMap: ReadonlyMap<string, IGlobalSearchIndexItem | null>;
	examples: ReadonlyArray<IGlobalSearchExampleQuery>;
	locale: TLocale;
	onApplyQuery: (query: string, source: string) => void;
	onClearItems: () => void;
	onClearQueries: () => void;
	onOpenItem: (item: IGlobalSearchIndexItem) => void;
	recentItems: ReadonlyArray<IGlobalSearchIndexItem>;
	recentState: IGlobalSearchRecentState;
}) {
	const { t } = useI18n(globalSearchMessages);
	const { fieldTokens, sectionTokens } = getExampleSyntaxTokens(locale);
	const renderTokens = (tokens: ReadonlyArray<string>) =>
		tokens.map((token, index) => (
			<Fragment key={token}>
				{index > 0 && t('spotlight.home.separator')}
				<SearchSyntaxToken>{token}</SearchSyntaxToken>
			</Fragment>
		));
	const hasRecentHistory =
		recentItems.length > 0 || recentState.queries.length > 0;

	return (
		<div className="space-y-5 px-0.5 py-0.5">
			<SpotlightMotionBlock motionKey="examples" className="space-y-3">
				<div className="space-y-1 px-0.5">
					<h3 className="text-small font-semibold text-foreground-700">
						{t('spotlight.home.title')}
					</h3>
					<p className="text-tiny leading-5 text-foreground-500">
						{t('spotlight.home.introPrefix')}
						{renderTokens(sectionTokens)}
						{t('spotlight.home.sectionSuffix')}
						{renderTokens(fieldTokens)}
						{t('spotlight.home.fieldSuffix')}
					</p>
				</div>
				<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
					{examples.map(({ description, query }) => (
						<Button
							key={query}
							size="sm"
							variant="light"
							onPress={() => {
								onApplyQuery(query, 'Use Example Query');
							}}
							className="h-auto min-h-14 justify-start gap-2.5 rounded-small border border-default-200/55 bg-background/45 px-2.5 py-2 text-left backdrop-blur data-[hover=true]:border-primary/25 data-[hover=true]:bg-primary/10 dark:bg-content1/30"
						>
							<SearchItemVisual
								item={examplePreviewItemMap.get(query)}
								size="sm"
							/>
							<span className="min-w-0">
								<span className="block truncate text-small font-medium">
									{renderSearchSyntax(query)}
								</span>
								<span className="block truncate text-tiny text-foreground-500">
									{description}
								</span>
							</span>
						</Button>
					))}
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
								{t('spotlight.history.title')}
							</h3>
						</div>
						<div className="space-y-3">
							<AnimatePresence mode="popLayout" initial={false}>
								{recentItems.length > 0 && (
									<SpotlightMotionBlock
										motionKey="recent-items"
										className="space-y-2"
									>
										<HistoryHeader
											title={t(
												'spotlight.history.recentOpen'
											)}
											count={recentItems.length}
											clearLabel={t(
												'spotlight.history.clearRecentOpen'
											)}
											onClear={onClearItems}
										/>
										<div className="flex flex-wrap gap-2">
											{recentItems.map((item) => (
												<Button
													key={item.id}
													size="sm"
													variant="flat"
													onPress={() => {
														onOpenItem(item);
													}}
													className="h-8 max-w-full gap-1.5 rounded-small border border-default-200/55 bg-background/45 px-2 text-foreground-600 backdrop-blur data-[hover=true]:border-primary/25 data-[hover=true]:bg-primary/10 data-[hover=true]:text-primary-700 dark:bg-content1/30"
												>
													<SearchItemVisual
														item={item}
														size="sm"
													/>
													<span className="min-w-0 truncate">
														{getSectionDisplayLabel(
															item.section,
															item.sectionLabel,
															locale
														)}{' '}
														⦁ {item.name}
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
										<HistoryHeader
											title={t(
												'spotlight.history.recentQuery'
											)}
											count={recentState.queries.length}
											clearLabel={t(
												'spotlight.history.clearRecentQuery'
											)}
											onClear={onClearQueries}
										/>
										<div className="flex flex-wrap gap-2">
											{recentState.queries.map(
												(recentQuery) => (
													<Button
														key={recentQuery}
														size="sm"
														variant="flat"
														onPress={() => {
															onApplyQuery(
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
}
