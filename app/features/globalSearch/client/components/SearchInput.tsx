import {
	faArrowLeft,
	faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { motion } from 'framer-motion';
import { type KeyboardEventHandler, type RefObject, useMemo } from 'react';

import Button from '@/design/ui/components/button';
import Input from '@/design/ui/components/input';

import { type TGlobalSearchModel } from '@/features/globalSearch/client/useGlobalSearchModel';

import { SPOTLIGHT_CONTENT_TRANSITION } from './motion';

export function SearchInput({
	baseId,
	inputRef,
	isHighAppearance,
	isInputFocused,
	isReducedMotion,
	model,
	onBack,
	onBlur,
	onFocus,
	onKeyDown,
	onValueChange,
	query,
}: {
	baseId: string;
	inputRef: RefObject<HTMLInputElement | null>;
	isHighAppearance: boolean;
	isInputFocused: boolean;
	isReducedMotion: boolean;
	model: TGlobalSearchModel;
	onBack: () => void;
	onBlur: () => void;
	onFocus: () => void;
	onKeyDown: KeyboardEventHandler<HTMLInputElement>;
	onValueChange: (value: string) => void;
	query: string;
}) {
	const resultListId = `${baseId}-results`;
	const resultStatusId = `${baseId}-status`;
	const selectedResultOptionId =
		model.selectedResult === null
			? undefined
			: `${baseId}-result-${model.resolvedSelectedIndex}`;
	const inputControlledElementId =
		model.isQueryEmpty ||
		model.isPrefixSuggestionOnly ||
		model.isFieldValueSuggestionOnly
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
	const selectedMatch = model.selectedResult?.matches[0];
	const resultStatusText = model.isQueryEmpty
		? '输入关键词开始搜索'
		: model.isPrefixSuggestionOnly
			? `可用前缀${model.prefixSuggestions.length}个`
			: model.isFieldValueSuggestionOnly
				? `可用取值${model.fieldValueSuggestions.length}个`
				: model.selectedResult === null
					? '没有找到结果'
					: `找到${model.results.length}个结果，当前选中第${model.resolvedSelectedIndex + 1}个：${model.selectedResult.item.name}${selectedMatch === undefined ? '' : `，${selectedMatch.field.label}中命中`}`;

	const inputClassNames = useMemo(
		() => ({
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
		}),
		[isHighAppearance, isInputFocused, query.length]
	);

	return (
		<div
			className={cn(
				'sticky top-0 z-30 border-b border-default-200/70 px-4 py-3 sm:px-5',
				isHighAppearance
					? 'bg-background/65 backdrop-blur dark:bg-content1/50'
					: 'bg-background/80 dark:bg-content1/45'
			)}
		>
			<div className="flex items-center">
				<motion.div
					{...(isReducedMotion
						? {
								style: {
									opacity: model.isQueryEmpty ? 0 : 1,
									width: model.isQueryEmpty ? 0 : '3.5rem',
								},
							}
						: {
								animate: {
									opacity: model.isQueryEmpty ? 0 : 1,
									width: model.isQueryEmpty ? 0 : '3.5rem',
								},
								initial: false,
								transition: SPOTLIGHT_CONTENT_TRANSITION,
							})}
					aria-hidden={model.isQueryEmpty}
					className={cn(
						'shrink-0 overflow-hidden',
						model.isQueryEmpty && 'pointer-events-none'
					)}
				>
					<Button
						isIconOnly
						aria-label="返回搜索首页"
						isDisabled={model.isQueryEmpty}
						size="lg"
						variant="light"
						onPress={onBack}
						className={cn(
							'h-12 w-12 min-w-12 rounded-small border border-default-200/70 bg-default-100/80 text-foreground-500 shadow-sm transition-background data-[hover=true]:bg-default-100/90 data-[pressed=true]:bg-default-100 motion-reduce:transition-none dark:bg-default-100/20 dark:data-[hover=true]:bg-default-100/25 dark:data-[pressed=true]:bg-default-100/30',
							isHighAppearance &&
								'bg-default/45 backdrop-blur data-[hover=true]:bg-default/55 data-[pressed=true]:bg-default/60'
						)}
					>
						<FontAwesomeIcon icon={faArrowLeft} className="w-4" />
					</Button>
				</motion.div>
				<Input
					isClearable
					ref={inputRef}
					value={query}
					onValueChange={onValueChange}
					onBlur={onBlur}
					onFocus={onFocus}
					onKeyDown={onKeyDown}
					aria-label="全局搜索"
					aria-autocomplete="list"
					aria-describedby={resultStatusId}
					aria-expanded={!model.isQueryEmpty}
					placeholder="搜索料理、酒水、食材、稀客、设置..."
					role="combobox"
					{...inputActiveDescendantProps}
					{...inputControlsProps}
					classNames={inputClassNames}
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
	);
}
