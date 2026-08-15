import { cn } from '@heroui/theme';
import isObject from 'lodash/isObject.js';

import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import { COOKER_TYPE_LABEL_MAP } from '@/domain/data/cookers/cookerFacts';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import { ALL_MAP_LABELS_SET, MAP_FACTS } from '@/domain/data/places/placeFacts';
import type { TMapLabel } from '@/domain/data/places/types';
import type { TSpriteTarget } from '@/domain/data/sprites/types';
import type {
	TBeverageTagLabel,
	TFoodTagLabel,
} from '@/domain/data/tags/types';

import {
	BEVERAGE_TAG_STYLE,
	FOOD_TAG_STYLE,
	INGREDIENT_TAG_STYLE,
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

import { checkIsRecord } from '@/shared/utilities/objects/checkIsRecord';

const MATCH_FIELD_SPRITE_TARGET_MAP: Partial<
	Record<IGlobalSearchIndexField['fieldType'], TSpriteTarget>
> = { 'cooker-type': 'cooker', ingredient: 'ingredient' };

function flattenFieldValue(value: unknown): string[] {
	if (typeof value === 'string' || typeof value === 'number') {
		return value.toString().split(/\s+/u).filter(Boolean);
	}
	if (Array.isArray(value)) {
		return value.flatMap(flattenFieldValue);
	}
	if (isObject(value)) {
		return Object.values(value).flatMap(flattenFieldValue);
	}

	return [];
}

function flattenNumericFieldValue(value: unknown): number[] {
	if (typeof value === 'number') {
		return [value];
	}
	if (Array.isArray(value)) {
		return value.flatMap(flattenNumericFieldValue);
	}

	return [];
}

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

	const ids = flattenNumericFieldValue(match.field.value);
	if (ids.length === 0) {
		return null;
	}

	const ingredientCatalog = IngredientCatalog.getInstance();
	const cookerCatalog = CookerCatalog.getInstance();

	return ids.map((id) => {
		const name =
			target === 'ingredient'
				? ingredientCatalog.getPropsById(id as never, 'name')
				: COOKER_TYPE_LABEL_MAP[
						id as keyof typeof COOKER_TYPE_LABEL_MAP
					];
		const recordId =
			target === 'ingredient'
				? id
				: cookerCatalog.getIdByTypeAndSeries(id as never, 0);

		return {
			isMatched:
				match.keyword.trim().length > 0 &&
				checkGlobalSearchNameMatchesKeyword(name, match.keyword),
			name,
			recordId,
			target,
		};
	});
}

function getFoodTagConfig(
	item: IGlobalSearchIndexItem,
	fieldType: IGlobalSearchIndexField['fieldType'],
	tag: string
) {
	if (fieldType === 'negative-tag') {
		return {
			tagStyle: FOOD_TAG_STYLE.negative,
			tagType: 'negative' as const,
		};
	}

	if (fieldType === 'tag' && item.section === 'foods') {
		const negativeTagField = item.fields.find(
			(field) => field.fieldType === 'negative-tag'
		);
		const negativeTags = new Set(
			flattenFieldValue(negativeTagField?.value)
		);

		if (negativeTags.has(tag)) {
			return {
				tagStyle: FOOD_TAG_STYLE.negative,
				tagType: 'negative' as const,
			};
		}
	}

	return { tagStyle: FOOD_TAG_STYLE.positive, tagType: 'positive' as const };
}

function getGuestTagConfig(
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
	if (fieldType === 'guest-tag') {
		const negativeTagField = item.fields.find(
			(field) => field.fieldType === 'negative-tag'
		);
		const beverageTagField = item.fields.find(
			(field) => field.fieldType === 'beverage-tag'
		);
		const negativeTags = new Set(
			flattenFieldValue(negativeTagField?.value)
		);
		const beverageTags = new Set(
			flattenFieldValue(beverageTagField?.value)
		);

		if (negativeTags.has(tag)) {
			return {
				tagStyle: FOOD_TAG_STYLE.negative,
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
	if (fieldType === 'negative-tag') {
		return {
			tagStyle: FOOD_TAG_STYLE.negative,
			tagType: 'negative' as const,
		};
	}

	return { tagStyle: FOOD_TAG_STYLE.positive, tagType: 'positive' as const };
}

function getMatchedFieldTagTokens(
	item: IGlobalSearchIndexItem,
	match: IGlobalSearchMatchedField
) {
	const { keyword } = match;
	const {
		field: { fieldType, value },
	} = match;
	if (
		fieldType !== 'beverage-tag' &&
		fieldType !== 'guest-tag' &&
		fieldType !== 'negative-tag' &&
		fieldType !== 'positive-tag' &&
		fieldType !== 'tag'
	) {
		return null;
	}

	const tags = flattenFieldValue(value);
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
					: item.section === 'normal-guests' ||
						  item.section === 'special-guests'
						? getGuestTagConfig(item, fieldType, tag)
						: getFoodTagConfig(item, fieldType, tag);

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

	const source = match.field.value;
	if (
		checkIsRecord(source) &&
		'bond' in source &&
		Object.keys(source).every((key) => key === 'bond')
	) {
		const { bond } = source;
		if (!checkIsRecord(bond) || typeof bond['specialGuest'] !== 'number') {
			return null;
		}

		const { specialGuest } = bond;
		const name = SpecialGuestCatalog.getInstance().getPropsById(
			specialGuest as TSpecialGuestId,
			'name'
		);
		const level = typeof bond['level'] === 'number' ? bond['level'] : null;

		return (
			<span className="inline-flex min-h-6 max-w-full flex-wrap items-center">
				<span className="mr-1 inline-flex items-center">
					【
					<Sprite
						target="special_guest"
						recordId={specialGuest as TSpecialGuestId}
						size={1.15}
						className="mx-0.5 rounded-full"
					/>
					{name}】羁绊
				</span>
				{level !== null && (
					<>
						<span>Lv.{(level - 1).toString()}</span>
						<span className="mx-0.5">➞</span>
						<span>Lv.{level.toString()}</span>
					</>
				)}
			</span>
		);
	}

	if (checkIsRecord(source) && checkIsRecord(source['levelup'])) {
		const { level, map } = source['levelup'];
		if (typeof level !== 'number') {
			return null;
		}

		const mapDisplayLabel =
			typeof map === 'string' && ALL_MAP_LABELS_SET.has(map)
				? MAP_FACTS[map as TMapLabel].label
				: null;

		return (
			<span className="inline-flex min-h-6 max-w-full flex-wrap items-center">
				<span className="mr-1">游戏等级</span>
				<span>Lv.{level - 1}</span>
				<span className="mx-0.5">➞</span>
				<span>Lv.{level}</span>
				{mapDisplayLabel !== null && (
					<span className="ml-0.5">{`且已解锁地区【${mapDisplayLabel}】`}</span>
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
					flattenFieldValue(match.field.value).join(' '),
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
				tag={tag as TBeverageTagLabel | TFoodTagLabel}
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
		return spriteTokens.map(({ isMatched, name, recordId, target }) => (
			<span
				key={`${target}:${recordId}`}
				className={cn(
					'inline-flex h-6 max-w-full items-center gap-1.5 rounded-small border px-1.5 pr-2',
					isMatched
						? 'border-primary/30 bg-primary/10 text-primary-700 dark:text-primary'
						: 'border-default-200/50 bg-default/20 text-foreground-600'
				)}
			>
				<span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-small bg-default/25">
					<Sprite
						target={target}
						recordId={recordId as never}
						size={1}
					/>
				</span>
				<span className="truncate">{name}</span>
			</span>
		));
	}

	return null;
}
