import Button from '@/design/ui/components/button';

import { getCatalogMatchedFieldSpriteTarget } from '@/features/catalog/globalSearch/client/renderCatalogMatchedField';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import type {
	IGlobalSearchFieldCondition,
	IGlobalSearchIndexItem,
	IGlobalSearchPrefixSuggestion,
	TGlobalSearchSection,
} from '@/features/globalSearch/contracts';
import { getGlobalSearchFieldValueDisplayText } from '@/features/globalSearch/core/fieldValueSuggestions';
import { getFieldPrefixLabel } from '@/features/globalSearch/core/parser';

import { renderSearchSyntax } from './SearchSyntax';

export function PrefixSuggestions({
	onPress,
	suggestions,
}: {
	onPress: (suggestion: IGlobalSearchPrefixSuggestion) => void;
	suggestions: ReadonlyArray<IGlobalSearchPrefixSuggestion>;
}) {
	return (
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
				{suggestions.map((suggestion) => (
					<Button
						key={`${suggestion.kind}:${suggestion.key}`}
						size="sm"
						variant="light"
						onPress={() => {
							onPress(suggestion);
						}}
						className="flex h-9 min-w-0 justify-between gap-2 rounded-small border border-default-200/55 bg-background/45 px-2 text-left text-small transition data-[hover=true]:border-primary/25 data-[hover=true]:bg-primary/10 motion-reduce:transition-none dark:bg-content1/30"
					>
						<span className="min-w-0 truncate font-medium text-foreground-700">
							{renderSearchSyntax(`@${suggestion.alias}`)}
						</span>
						<span className="shrink-0 text-tiny text-foreground-400">
							{suggestion.kind === 'section'
								? '分区'
								: (suggestion.valueTypeLabel ?? '字段')}
						</span>
					</Button>
				))}
			</div>
		</>
	);
}

export function FieldValueSuggestions({
	activeFieldCondition,
	nameSuggestionItemMap,
	onPress,
	resultSection,
	suggestions,
}: {
	activeFieldCondition: IGlobalSearchFieldCondition | null;
	nameSuggestionItemMap: ReadonlyMap<string, IGlobalSearchIndexItem>;
	onPress: (suggestion: string) => void;
	resultSection: null | TGlobalSearchSection;
	suggestions: ReadonlyArray<string>;
}) {
	const fieldLabel =
		activeFieldCondition === null
			? ''
			: getFieldPrefixLabel(
					activeFieldCondition.fieldType,
					resultSection
				);
	const spriteTarget =
		activeFieldCondition === null
			? undefined
			: getCatalogMatchedFieldSpriteTarget(
					activeFieldCondition.fieldType
				);

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
				{suggestions.map((suggestion, suggestionIndex) => {
					const suggestionDisplayText =
						activeFieldCondition === null
							? suggestion
							: getGlobalSearchFieldValueDisplayText(
									activeFieldCondition.fieldType,
									suggestion
								);
					const nameSuggestionItem =
						activeFieldCondition?.fieldType === 'name'
							? nameSuggestionItemMap.get(suggestion)
							: undefined;
					const suggestionSpriteTarget =
						nameSuggestionItem?.spriteTarget ?? spriteTarget;
					const suggestionSpriteName =
						nameSuggestionItem?.targetName ?? suggestion;

					return (
						<Button
							key={`${suggestion}:${nameSuggestionItem?.section ?? 'field'}:${suggestionIndex}`}
							size="sm"
							variant="light"
							onPress={() => {
								onPress(suggestion);
							}}
							className="flex h-9 min-w-0 justify-between gap-2 rounded-small border border-default-200/55 bg-background/45 px-2 text-left text-small transition data-[hover=true]:border-primary/25 data-[hover=true]:bg-primary/10 motion-reduce:transition-none dark:bg-content1/30"
						>
							<span className="flex min-w-0 items-center gap-1.5">
								{suggestionSpriteTarget !== undefined && (
									<span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-small border border-default-200/55 bg-default/35">
										<Sprite
											target={suggestionSpriteTarget}
											name={suggestionSpriteName as never}
											size={1}
										/>
									</span>
								)}
								<span className="min-w-0 truncate font-medium text-foreground-700">
									{suggestionDisplayText}
								</span>
							</span>
							<span className="shrink-0 text-tiny text-foreground-400">
								{nameSuggestionItem?.sectionLabel ?? fieldLabel}
							</span>
						</Button>
					);
				})}
			</div>
		</>
	);
}
