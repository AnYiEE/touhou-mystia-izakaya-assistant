'use client';

import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { AnimatePresence, motion } from 'framer-motion';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import ScrollMask from '@/design/ui/components/scrollMask';
import Tooltip from '@/design/ui/components/tooltip';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import { useGlobalSearchController } from '@/features/globalSearch/client/useGlobalSearchController';
import { getFieldPrefixLabel } from '@/features/globalSearch/core/parser';
import { CoordinatedModal } from '@/features/overlays/client';

import { SearchHome } from './SearchHome';
import { SearchInput } from './SearchInput';
import { SearchResults } from './SearchResults';
import { FieldValueSuggestions, PrefixSuggestions } from './SearchSuggestions';
import { renderSearchSyntax } from './SearchSyntax';
import { SpotlightMotionBlock } from './SpotlightMotion';
import {
	SPOTLIGHT_CONTENT_TRANSITION,
	SPOTLIGHT_LIST_TRANSITION,
	SPOTLIGHT_MAIN_CONTENT_VARIANTS,
	SPOTLIGHT_MODAL_MOTION_PROPS,
} from './motion';

export default function GlobalSpotlightSearch() {
	const controller = useGlobalSearchController();
	const { isHighAppearance } = useDesignPreferences();
	const isReducedMotion = useReducedMotion();
	const {
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
	} = controller;
	const {
		activeFieldCondition,
		ast,
		examplePreviewItemMap,
		fieldConditionDisplayValues,
		fieldValueSuggestions: fieldValueSuggestionValues,
		filterAction,
		isFieldValueSuggestionOnly,
		isPrefixSuggestionOnly,
		isQueryEmpty,
		nameSuggestionItemMap,
		parsedSection,
		prefixSuggestions: prefixSuggestionValues,
		shouldShowQueryMeta,
	} = model;

	const suggestionPanelClassName = cn(
		'border-b border-default-200/60 px-4 py-3 sm:px-5',
		isHighAppearance
			? 'bg-content1/25 backdrop-blur dark:bg-content1/20'
			: 'bg-default/10 dark:bg-content1/20'
	);

	const prefixSuggestions = (
		<PrefixSuggestions
			suggestions={prefixSuggestionValues}
			onPress={handlePrefixSuggestionPress}
		/>
	);
	const fieldValueSuggestions = (
		<FieldValueSuggestions
			activeFieldCondition={activeFieldCondition}
			nameSuggestionItemMap={nameSuggestionItemMap}
			resultSection={ast.resultSection}
			suggestions={fieldValueSuggestionValues}
			onPress={handleFieldValueSuggestionPress}
		/>
	);

	return (
		<CoordinatedModal
			coordination={{ id: 'global.search', shortcuts }}
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
				<SearchInput
					baseId={baseId}
					inputRef={inputRef}
					isHighAppearance={isHighAppearance}
					isInputFocused={isInputFocused}
					isReducedMotion={isReducedMotion}
					model={model}
					onBack={handleBackToEmptyQuery}
					onBlur={handleInputBlur}
					onFocus={handleInputFocus}
					onKeyDown={handleInputKeyDown}
					onValueChange={setQuery}
					query={query}
				/>

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
											结果：
											{parsedSection.label}
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
					{prefixSuggestionValues.length > 0 &&
						fieldValueSuggestionValues.length === 0 &&
						!isPrefixSuggestionOnly && (
							<motion.div
								key="prefix-suggestions"
								animate={{ height: 'auto', opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								initial={{ height: 0, opacity: 0 }}
								style={{ overflow: 'hidden' }}
								transition={SPOTLIGHT_LIST_TRANSITION}
							>
								<div className={suggestionPanelClassName}>
									{prefixSuggestions}
								</div>
							</motion.div>
						)}
				</AnimatePresence>

				<AnimatePresence initial={false}>
					{fieldValueSuggestionValues.length > 0 &&
						!isFieldValueSuggestionOnly && (
							<motion.div
								key="field-value-suggestions"
								animate={{ height: 'auto', opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								initial={{ height: 0, opacity: 0 }}
								style={{ overflow: 'hidden' }}
								transition={SPOTLIGHT_LIST_TRANSITION}
							>
								<div className={suggestionPanelClassName}>
									{fieldValueSuggestions}
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
							<div className="p-4 sm:p-5 md:h-[30rem] md:overflow-y-auto md:overflow-x-hidden md:scrollbar-hide">
								<SearchHome
									examplePreviewItemMap={
										examplePreviewItemMap
									}
									onApplyQuery={applyQueryPreset}
									onClearItems={clearRecentItems}
									onClearQueries={clearRecentQueries}
									onOpenItem={handleOpenItem}
									recentItems={recentItems}
									recentState={recentState}
								/>
							</div>
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
							<ScrollMask className="max-h-[calc(var(--safe-h-dvh)-9rem)] p-4 sm:p-5 md:h-[30rem] md:max-h-none">
								<SpotlightMotionBlock
									motionKey="prefix-suggestion-only"
									className="px-0.5 py-0.5"
								>
									{prefixSuggestions}
								</SpotlightMotionBlock>
							</ScrollMask>
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
							<ScrollMask className="max-h-[calc(var(--safe-h-dvh)-9rem)] p-4 sm:p-5 md:h-[30rem] md:max-h-none">
								<SpotlightMotionBlock
									motionKey="field-value-suggestion-only"
									className="px-0.5 py-0.5"
								>
									{fieldValueSuggestions}
								</SpotlightMotionBlock>
							</ScrollMask>
						</motion.div>
					) : (
						<SearchResults
							baseId={baseId}
							isHighAppearance={isHighAppearance}
							isReducedMotion={isReducedMotion}
							model={model}
							onApplyQuery={applyQueryPreset}
							onOpenItem={handleOpenItem}
							onOpenNewWindow={handleOpenNewWindow}
							onSelect={setSelectedIndex}
							onShareItem={handleShareItem}
							query={query}
						/>
					)}
				</AnimatePresence>
			</div>
		</CoordinatedModal>
	);
}
