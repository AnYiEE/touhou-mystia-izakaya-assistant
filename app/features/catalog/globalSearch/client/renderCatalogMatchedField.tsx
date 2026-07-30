import { cn } from '@heroui/theme';

import type { TSpriteTarget } from '@/domain/data/sprites/types';
import type { TTag } from '@/domain/data/tags/types';

import {
	BEVERAGE_TAG_STYLE,
	INGREDIENT_TAG_STYLE,
	RECIPE_TAG_STYLE,
} from '@/features/catalog/presentation/tagStyles';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import TagsComponent from '@/features/catalog/shared/client/components/Tags';
import type {
	IGlobalSearchIndexField,
	IGlobalSearchIndexItem,
	IGlobalSearchMatchedField,
} from '@/features/globalSearch/contracts';
import {
	checkGlobalSearchFieldTypeIsDlc,
	checkGlobalSearchNameMatchesKeyword,
	getGlobalSearchMatchedDlcDisplayText,
} from '@/features/globalSearch/core/fieldValueSuggestions';

const MATCH_FIELD_SPRITE_TARGET_MAP: Partial<
	Record<IGlobalSearchIndexField['fieldType'], TSpriteTarget>
> = { cooker: 'cooker', ingredient: 'ingredient' };

export function getCatalogMatchedFieldSpriteTarget(
	fieldType: IGlobalSearchIndexField['fieldType']
) {
	return MATCH_FIELD_SPRITE_TARGET_MAP[fieldType];
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
			checkGlobalSearchNameMatchesKeyword(name, match.keyword),
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
				checkGlobalSearchNameMatchesKeyword(tag, keyword),
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

export function renderCatalogMatchedField(
	item: IGlobalSearchIndexItem,
	match: IGlobalSearchMatchedField
) {
	if (checkGlobalSearchFieldTypeIsDlc(match.field.fieldType)) {
		return (
			<span className="min-w-0 break-words">
				{getGlobalSearchMatchedDlcDisplayText(
					match.field.text,
					match.keyword
				)}
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

	return null;
}
