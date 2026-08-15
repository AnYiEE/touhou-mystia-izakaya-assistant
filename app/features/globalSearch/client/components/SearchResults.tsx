import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { AnimatePresence, type Transition, motion } from 'framer-motion';
import { type Ref } from 'react';

import Button from '@/design/ui/components/button';
import ScrollMask from '@/design/ui/components/scrollMask';

import { type TGlobalSearchModel } from '@/features/globalSearch/client/useGlobalSearchModel';
import type {
	IGlobalSearchIndexItem,
	IGlobalSearchMatchedField,
	IGlobalSearchResult,
} from '@/features/globalSearch/contracts';
import {
	checkGlobalSearchFieldTypeIsDlc,
	getGlobalSearchMatchedDlcDisplayText,
} from '@/features/globalSearch/core/fieldValueSuggestions';

import { SPOTLIGHT_LIST_TRANSITION, SPOTLIGHT_RESULT_VARIANTS } from './motion';
import { SearchItemVisual } from './SearchItemVisual';
import { SearchPreview } from './SearchPreview';
import { SpotlightMotionBlock } from './SpotlightMotion';

const resultTransitionCache = new Map<number, Transition>();

function getResultTransition(index: number) {
	const delayIndex = Math.min(index, 6);
	const cachedTransition = resultTransitionCache.get(delayIndex);
	if (cachedTransition !== undefined) {
		return cachedTransition;
	}

	const transition = {
		...SPOTLIGHT_LIST_TRANSITION,
		delay: delayIndex * 0.018,
	} satisfies Transition;
	resultTransitionCache.set(delayIndex, transition);
	return transition;
}

function ResultRow({
	baseId,
	index,
	isHighAppearance,
	isSelected,
	onOpenItem,
	onSelect,
	result,
}: {
	baseId: string;
	index: number;
	isHighAppearance: boolean;
	isSelected: boolean;
	onOpenItem: (
		item: IGlobalSearchIndexItem,
		match?: IGlobalSearchMatchedField
	) => void;
	onSelect: (index: number) => void;
	result: IGlobalSearchResult;
}) {
	const { item } = result;
	const { matches } = result;
	const [match] = matches;

	return (
		<Button
			id={`${baseId}-result-${index}`}
			data-global-search-result-index={index}
			variant="light"
			role="option"
			aria-selected={isSelected}
			onPress={() => {
				onSelect(index);
			}}
			onDoubleClick={() => {
				onOpenItem(item, match);
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
			<SearchItemVisual item={item} size="md" />
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
						: `${match.field.label}中命中：${
								checkGlobalSearchFieldTypeIsDlc(
									match.field.fieldType
								)
									? getGlobalSearchMatchedDlcDisplayText(
											match.field.text,
											match.keyword
										)
									: match.snippet
							}`}
				</span>
			</span>
		</Button>
	);
}

export function SearchResults({
	baseId,
	isHighAppearance,
	isReducedMotion,
	model,
	onApplyQuery,
	onOpenItem,
	onOpenNewWindow,
	onSelect,
	onShareItem,
	query,
	ref,
}: {
	baseId: string;
	isHighAppearance: boolean;
	isReducedMotion: boolean;
	model: TGlobalSearchModel;
	onApplyQuery: (query: string, source: string) => void;
	onOpenItem: (
		item: IGlobalSearchIndexItem,
		match?: IGlobalSearchMatchedField
	) => void;
	onOpenNewWindow: (
		item: IGlobalSearchIndexItem,
		match?: IGlobalSearchMatchedField
	) => void;
	onSelect: (index: number) => void;
	onShareItem: (item: IGlobalSearchIndexItem) => void;
	query: string;
	ref?: Ref<HTMLDivElement>;
}) {
	const shouldShowPreviewPane = model.results.length > 0;

	return (
		<motion.div
			ref={ref}
			key="search-results"
			{...(isReducedMotion
				? {}
				: {
						animate: 'animate',
						exit: 'exit',
						initial: 'initial',
						transition: SPOTLIGHT_LIST_TRANSITION,
						variants: {
							animate: { opacity: 1, y: 0 },
							exit: { opacity: 0, y: -5 },
							initial: { opacity: 0, y: 6 },
						},
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
				id={`${baseId}-results`}
				aria-label="搜索结果"
				className={cn(
					'min-h-0 min-w-0 overflow-hidden border-b border-default-200/80 md:border-b-0 md:border-r',
					isHighAppearance
						? 'bg-content1/25 backdrop-blur dark:bg-content1/15'
						: 'bg-background/40 dark:bg-content1/20'
				)}
			>
				<ScrollMask className="p-3 md:h-[30rem]">
					{model.results.length === 0 ? (
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
							{model.shouldShowRelaxedQuery && (
								<div className="flex justify-center gap-2">
									<Button
										size="sm"
										variant="flat"
										onPress={() => {
											onApplyQuery(
												model.relaxedQuery,
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
						<AnimatePresence mode="popLayout" initial={false}>
							<motion.div
								key={query}
								layout="position"
								className="space-y-1.5"
							>
								{model.results.map((result, index) =>
									isReducedMotion ? (
										<div key={result.item.id}>
											<ResultRow
												baseId={baseId}
												index={index}
												isHighAppearance={
													isHighAppearance
												}
												isSelected={
													model.resolvedSelectedIndex ===
													index
												}
												onOpenItem={onOpenItem}
												onSelect={onSelect}
												result={result}
											/>
										</div>
									) : (
										<motion.div
											layout="position"
											key={result.item.id}
											animate="animate"
											exit="exit"
											initial="initial"
											transition={getResultTransition(
												index
											)}
											variants={SPOTLIGHT_RESULT_VARIANTS}
										>
											<ResultRow
												baseId={baseId}
												index={index}
												isHighAppearance={
													isHighAppearance
												}
												isSelected={
													model.resolvedSelectedIndex ===
													index
												}
												onOpenItem={onOpenItem}
												onSelect={onSelect}
												result={result}
											/>
										</motion.div>
									)
								)}
							</motion.div>
						</AnimatePresence>
					)}
				</ScrollMask>
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
					<SearchPreview
						selectedResult={model.selectedResult}
						onOpenItem={onOpenItem}
						onOpenNewWindow={onOpenNewWindow}
						onShareItem={onShareItem}
					/>
				</div>
			)}
		</motion.div>
	);
}
