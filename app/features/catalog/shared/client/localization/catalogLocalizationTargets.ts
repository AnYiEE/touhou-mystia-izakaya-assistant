import {
	activateDlcLabels,
	deactivateDlcLabels,
} from '@/domain/availability/localizedLabels';
import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { NormalGuestCatalog } from '@/domain/catalog/guests/NormalGuestCatalog';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { BadgeCatalog } from '@/domain/catalog/items/BadgeCatalog';
import { ClothesCatalog } from '@/domain/catalog/items/ClothesCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import { DecorationCatalog } from '@/domain/catalog/items/DecorationCatalog';
import { FishingCollectibleCatalog } from '@/domain/catalog/items/FishingCollectibleCatalog';
import { GeneralItemCatalog } from '@/domain/catalog/items/GeneralItemCatalog';
import { PartnerCatalog } from '@/domain/catalog/items/PartnerCatalog';
import { RecordItemCatalog } from '@/domain/catalog/items/RecordItemCatalog';
import {
	activateCategoryLabels,
	deactivateCategoryLabels,
} from '@/domain/catalog/localizedCategoryLabels';
import { BADGE_LOCALIZATION_LOADERS } from '@/domain/data/badges/localization';
import { BEVERAGE_LOCALIZATION_LOADERS } from '@/domain/data/beverages/localization';
import { CLOTHES_LOCALIZATION_LOADERS } from '@/domain/data/clothes/localization';
import { COOKER_LOCALIZATION_LOADERS } from '@/domain/data/cookers/localization';
import { CURRENCY_ITEM_LOCALIZATION_LOADERS } from '@/domain/data/currencyItems/localization';
import { DECORATION_LOCALIZATION_LOADERS } from '@/domain/data/decorations/localization';
import { FISHING_COLLECTIBLE_LOCALIZATION_LOADERS } from '@/domain/data/fishingCollectibles/localization';
import { FOOD_LOCALIZATION_LOADERS } from '@/domain/data/foods/localization';
import { GENERAL_ITEM_LOCALIZATION_LOADERS } from '@/domain/data/generalItems/localization';
import { NORMAL_GUEST_LOCALIZATION_LOADERS } from '@/domain/data/guests/normal/localization';
import { SPECIAL_GUEST_LOCALIZATION_LOADERS } from '@/domain/data/guests/special/localization';
import type { TSpecialGuestEvaluationKey } from '@/domain/data/guests/special/schema';
import { INGREDIENT_LOCALIZATION_LOADERS } from '@/domain/data/ingredients/localization';
import type {
	ILocalizedEffectText,
	ILocalizedEffectsText,
	ILocalizedGuestText,
	ILocalizedItemText,
	ILocalizedRecordText,
	ILocalizedSpecialGuestText,
	TEffectItemLocalizationLoader,
	TEffectsItemLocalizationLoader,
	TGuestLocalizationLoader,
	TItemLocalizationLoader,
	TRecordLocalizationLoader,
	TSpecialGuestLocalizationLoader,
} from '@/domain/data/localization/types';
import { PARTNER_LOCALIZATION_LOADERS } from '@/domain/data/partners/localization';
import { RECORD_LOCALIZATION_LOADERS } from '@/domain/data/records/localization';
import type { TSpriteTarget } from '@/domain/data/sprites/types';
import {
	activateEvaluationLabels,
	deactivateEvaluationLabels,
} from '@/domain/evaluation/localizedLabels';
import {
	activateCollaborationLabels,
	deactivateCollaborationLabels,
} from '@/domain/labels/localizedCollaborationLabels';
import {
	activateSchedulerLabels,
	deactivateSchedulerLabels,
} from '@/domain/labels/localizedSchedulerLabels';
import {
	activateDayMapLabels,
	deactivateDayMapLabels,
} from '@/domain/maps/localizedLabels';
import {
	activatePlaceLabels,
	deactivatePlaceLabels,
} from '@/domain/places/localizedLabels';
import {
	activatePointLabels,
	deactivatePointLabels,
} from '@/domain/places/localizedPointLabels';
import {
	activateRecommendationSortProfileLabels,
	deactivateRecommendationSortProfileLabels,
} from '@/domain/recommendations/localizedLabels';

import { Sprite as SpriteClass } from '@/features/catalog/presentation/SpriteModel';

import { type TLocale } from '@/shared/i18n/locale';

import { activateTagLabels, deactivateTagLabels } from './tagLabels';

interface ILocalizableCatalog<TItem> {
	readonly canonicalData: ReadonlyArray<TItem>;
	setActiveLocalizedData(
		locale: TLocale | null,
		data: ReadonlyArray<TItem> | null
	): void;
}

interface ITextItem {
	description: string | readonly [string, string | null, string | null];
	id: number;
	name: string;
}

interface IGuestTextItem extends ITextItem {
	chat: ReadonlyArray<string>;
}

interface ISpellCardFields {
	description: string;
	name: string;
}

interface ISpecialGuestTextItem extends IGuestTextItem {
	description: readonly [string, string | null, string | null];
	evaluation: Record<TSpecialGuestEvaluationKey, string | null>;
	spellCards: {
		negative?: ReadonlyArray<ISpellCardFields>;
		positive?: ReadonlyArray<ISpellCardFields>;
	};
}

interface IRecordTextItem extends ITextItem {
	trackName: string;
}

type TEntryMap<TEntry> = Readonly<Partial<Record<number, TEntry>>>;

function loadItemTextEntries(
	loaders: TItemLocalizationLoader,
	locale: TLocale
): Promise<TEntryMap<ILocalizedItemText>> | null {
	const loader = loaders[locale];
	return loader === undefined ? null : loader();
}

function loadEffectItemTextEntries(
	loaders: TEffectItemLocalizationLoader,
	locale: TLocale
): Promise<TEntryMap<ILocalizedEffectText>> | null {
	const loader = loaders[locale];
	return loader === undefined ? null : loader();
}

function loadEffectsItemTextEntries(
	loaders: TEffectsItemLocalizationLoader,
	locale: TLocale
): Promise<TEntryMap<ILocalizedEffectsText>> | null {
	const loader = loaders[locale];
	return loader === undefined ? null : loader();
}

function loadRecordEntries(
	loaders: TRecordLocalizationLoader,
	locale: TLocale
): Promise<TEntryMap<ILocalizedRecordText>> | null {
	const loader = loaders[locale];
	return loader === undefined ? null : loader();
}

function loadNormalGuestEntries(
	loaders: TGuestLocalizationLoader,
	locale: TLocale
): Promise<TEntryMap<ILocalizedGuestText>> | null {
	const loader = loaders[locale];
	return loader === undefined ? null : loader();
}

function loadSpecialGuestEntries(
	loaders: TSpecialGuestLocalizationLoader,
	locale: TLocale
): Promise<TEntryMap<ILocalizedSpecialGuestText>> | null {
	const loader = loaders[locale];
	return loader === undefined ? null : loader();
}

function applyItemText<TItem extends ITextItem>(
	item: TItem,
	entry: ILocalizedItemText | undefined
): TItem {
	if (entry === undefined) {
		return item;
	}

	return {
		...item,
		description: entry.description ?? item.description,
		name: entry.name ?? item.name,
	};
}

interface IEffectTextItem extends ITextItem {
	effect: readonly [string, boolean] | string | null;
}

interface IEffectsTextItem extends ITextItem {
	effects: ReadonlyArray<string>;
}

function applyEffectsItemText<TItem extends IEffectsTextItem>(
	item: TItem,
	entry: ILocalizedEffectsText | undefined
): TItem {
	if (entry === undefined) {
		return item;
	}

	const { description, effects, name } = entry;

	return {
		...item,
		description: description ?? item.description,
		effects:
			effects === undefined
				? item.effects
				: item.effects.map((value, index) => effects[index] ?? value),
		name: name ?? item.name,
	};
}

function applyEffectItemText<TItem extends IEffectTextItem>(
	item: TItem,
	entry: ILocalizedEffectText | undefined
): TItem {
	if (entry === undefined) {
		return item;
	}

	const localizedValue = entry.effect ?? null;
	const localizedEffect = Array.isArray(localizedValue)
		? localizedValue[0]
		: localizedValue;

	const effect =
		localizedEffect === null
			? item.effect
			: ((item.effect === null || typeof item.effect === 'string'
					? localizedEffect
					: [localizedEffect, item.effect[1]]) as TItem['effect']);

	return {
		...item,
		description: entry.description ?? item.description,
		effect,
		name: entry.name ?? item.name,
	};
}

function applyRecordText<TItem extends IRecordTextItem>(
	item: TItem,
	entry: ILocalizedRecordText | undefined
): TItem {
	if (entry === undefined) {
		return item;
	}

	return {
		...item,
		description: entry.description ?? item.description,
		name: entry.name ?? item.name,
		trackName: entry.trackName ?? item.trackName,
	};
}

function applyNormalGuestText<TItem extends IGuestTextItem>(
	item: TItem,
	entry: ILocalizedGuestText | undefined
): TItem {
	if (entry === undefined) {
		return item;
	}

	return {
		...item,
		chat: item.chat.map((value, index) => entry.chat[index] ?? value),
		description: entry.description ?? item.description,
		name: entry.name ?? item.name,
	};
}

function applySpecialGuestText<TItem extends ISpecialGuestTextItem>(
	item: TItem,
	entry: ILocalizedSpecialGuestText | undefined
): TItem {
	if (entry === undefined) {
		return item;
	}

	const [firstDescription, secondDescription, thirdDescription] =
		item.description;
	const description: [string, string | null, string | null] = [
		entry.description[0] ?? firstDescription,
		entry.description[1] ?? secondDescription,
		entry.description[2] ?? thirdDescription,
	];
	const evaluation: Record<TSpecialGuestEvaluationKey, string | null> = {
		...item.evaluation,
	};
	for (const key of Object.keys(
		entry.evaluation
	) as TSpecialGuestEvaluationKey[]) {
		evaluation[key] = entry.evaluation[key] ?? evaluation[key];
	}
	const spellCards: {
		negative?: ReadonlyArray<ISpellCardFields>;
		positive?: ReadonlyArray<ISpellCardFields>;
	} = { ...item.spellCards };
	const localizedPositive = entry.spellCards.positive;
	const canonicalPositive = item.spellCards.positive;
	if (localizedPositive !== undefined && canonicalPositive !== undefined) {
		spellCards.positive = canonicalPositive.map((card, index) => ({
			description:
				localizedPositive[index]?.description ?? card.description,
			name: localizedPositive[index]?.name ?? card.name,
		}));
	}
	const localizedNegative = entry.spellCards.negative;
	const canonicalNegative = item.spellCards.negative;
	if (localizedNegative !== undefined && canonicalNegative !== undefined) {
		spellCards.negative = canonicalNegative.map((card, index) => ({
			description:
				localizedNegative[index]?.description ?? card.description,
			name: localizedNegative[index]?.name ?? card.name,
		}));
	}

	return {
		...item,
		chat: item.chat.map((value, index) => entry.chat[index] ?? value),
		description,
		evaluation,
		name: entry.name ?? item.name,
		spellCards,
	};
}

export interface ICatalogLocalizationTarget {
	activate(locale: TLocale): Promise<void>;
	deactivate(): void;
}

function createLocalizationTarget<TItem extends ITextItem, TEntry>(
	catalog: ILocalizableCatalog<TItem>,
	load: (locale: TLocale) => Promise<TEntryMap<TEntry>> | null,
	apply: (item: TItem, entry: TEntry | undefined) => TItem
): ICatalogLocalizationTarget {
	return {
		activate: async (locale) => {
			const entries = await load(locale);
			if (entries === null) {
				return;
			}
			catalog.setActiveLocalizedData(
				locale,
				catalog.canonicalData.map((item) =>
					apply(item, entries[item.id])
				)
			);
		},
		deactivate: () => {
			catalog.setActiveLocalizedData(null, null);
		},
	};
}

function createItemTarget<TItem extends ITextItem>(
	catalog: ILocalizableCatalog<TItem>,
	loaders: TItemLocalizationLoader
) {
	return createLocalizationTarget<TItem, ILocalizedItemText>(
		catalog,
		(locale) => loadItemTextEntries(loaders, locale),
		applyItemText
	);
}

function createEffectItemTarget<TItem extends IEffectTextItem>(
	catalog: ILocalizableCatalog<TItem>,
	loaders: TEffectItemLocalizationLoader
) {
	return createLocalizationTarget<TItem, ILocalizedEffectText>(
		catalog,
		(locale) => loadEffectItemTextEntries(loaders, locale),
		applyEffectItemText
	);
}

function createEffectsItemTarget<TItem extends IEffectsTextItem>(
	catalog: ILocalizableCatalog<TItem>,
	loaders: TEffectsItemLocalizationLoader
) {
	return createLocalizationTarget<TItem, ILocalizedEffectsText>(
		catalog,
		(locale) => loadEffectsItemTextEntries(loaders, locale),
		applyEffectsItemText
	);
}

/**
 * @description Sprite model instances keep their own record views, so their
 * display projection needs the same overlay as the owning catalogue.
 */
function createSpriteTarget<TItem extends ITextItem, TEntry>(
	spriteTarget: TSpriteTarget,
	load: (locale: TLocale) => Promise<TEntryMap<TEntry>> | null,
	apply: (item: TItem, entry: TEntry | undefined) => TItem
) {
	return createLocalizationTarget<TItem, TEntry>(
		SpriteClass.getInstance(
			spriteTarget
		) as unknown as ILocalizableCatalog<TItem>,
		load,
		apply
	);
}

export const CATALOG_LOCALIZATION_TARGETS: ReadonlyArray<ICatalogLocalizationTarget> =
	[
		createItemTarget(FoodCatalog.getInstance(), FOOD_LOCALIZATION_LOADERS),
		createItemTarget(
			BeverageCatalog.getInstance(),
			BEVERAGE_LOCALIZATION_LOADERS
		),
		createItemTarget(
			IngredientCatalog.getInstance(),
			INGREDIENT_LOCALIZATION_LOADERS
		),
		createEffectItemTarget(
			CookerCatalog.getInstance(),
			COOKER_LOCALIZATION_LOADERS
		),
		createItemTarget(
			ClothesCatalog.getInstance(),
			CLOTHES_LOCALIZATION_LOADERS
		),
		createEffectItemTarget(
			DecorationCatalog.getInstance(),
			DECORATION_LOCALIZATION_LOADERS
		),
		createItemTarget(
			CurrencyItemCatalog.getInstance(),
			CURRENCY_ITEM_LOCALIZATION_LOADERS
		),
		createEffectsItemTarget(
			GeneralItemCatalog.getInstance(),
			GENERAL_ITEM_LOCALIZATION_LOADERS
		),
		createItemTarget(
			BadgeCatalog.getInstance(),
			BADGE_LOCALIZATION_LOADERS
		),
		createItemTarget(
			FishingCollectibleCatalog.getInstance(),
			FISHING_COLLECTIBLE_LOCALIZATION_LOADERS
		),
		createEffectItemTarget(
			PartnerCatalog.getInstance(),
			PARTNER_LOCALIZATION_LOADERS
		),
		createLocalizationTarget(
			RecordItemCatalog.getInstance(),
			(locale) => loadRecordEntries(RECORD_LOCALIZATION_LOADERS, locale),
			applyRecordText
		),
		createLocalizationTarget(
			NormalGuestCatalog.getInstance(),
			(locale) =>
				loadNormalGuestEntries(
					NORMAL_GUEST_LOCALIZATION_LOADERS,
					locale
				),
			applyNormalGuestText
		),
		createLocalizationTarget(
			SpecialGuestCatalog.getInstance(),
			(locale) =>
				loadSpecialGuestEntries(
					SPECIAL_GUEST_LOCALIZATION_LOADERS,
					locale
				),
			applySpecialGuestText
		),
		createSpriteTarget(
			'food',
			(locale) => loadItemTextEntries(FOOD_LOCALIZATION_LOADERS, locale),
			applyItemText
		),
		createSpriteTarget(
			'beverage',
			(locale) =>
				loadItemTextEntries(BEVERAGE_LOCALIZATION_LOADERS, locale),
			applyItemText
		),
		createSpriteTarget(
			'ingredient',
			(locale) =>
				loadItemTextEntries(INGREDIENT_LOCALIZATION_LOADERS, locale),
			applyItemText
		),
		createSpriteTarget(
			'cooker',
			(locale) =>
				loadItemTextEntries(COOKER_LOCALIZATION_LOADERS, locale),
			applyItemText
		),
		createSpriteTarget(
			'clothes',
			(locale) =>
				loadItemTextEntries(CLOTHES_LOCALIZATION_LOADERS, locale),
			applyItemText
		),
		createSpriteTarget(
			'decoration',
			(locale) =>
				loadItemTextEntries(DECORATION_LOCALIZATION_LOADERS, locale),
			applyItemText
		),
		createSpriteTarget(
			'currency_item',
			(locale) =>
				loadItemTextEntries(CURRENCY_ITEM_LOCALIZATION_LOADERS, locale),
			applyItemText
		),
		createSpriteTarget(
			'item',
			(locale) =>
				loadItemTextEntries(GENERAL_ITEM_LOCALIZATION_LOADERS, locale),
			applyItemText
		),
		createSpriteTarget(
			'badge',
			(locale) => loadItemTextEntries(BADGE_LOCALIZATION_LOADERS, locale),
			applyItemText
		),
		createSpriteTarget(
			'trophy',
			(locale) =>
				loadItemTextEntries(
					FISHING_COLLECTIBLE_LOCALIZATION_LOADERS,
					locale
				),
			applyItemText
		),
		createSpriteTarget(
			'partner',
			(locale) =>
				loadItemTextEntries(PARTNER_LOCALIZATION_LOADERS, locale),
			applyItemText
		),
		createSpriteTarget<IRecordTextItem, ILocalizedRecordText>(
			'record',
			(locale) => loadRecordEntries(RECORD_LOCALIZATION_LOADERS, locale),
			applyRecordText
		),
		createSpriteTarget<IGuestTextItem, ILocalizedGuestText>(
			'normal_guest',
			(locale) =>
				loadNormalGuestEntries(
					NORMAL_GUEST_LOCALIZATION_LOADERS,
					locale
				),
			applyNormalGuestText
		),
		createSpriteTarget<ISpecialGuestTextItem, ILocalizedSpecialGuestText>(
			'special_guest',
			(locale) =>
				loadSpecialGuestEntries(
					SPECIAL_GUEST_LOCALIZATION_LOADERS,
					locale
				),
			applySpecialGuestText
		),
		{
			activate: async (locale) => {
				await activateTagLabels(locale);
			},
			deactivate: () => {
				deactivateTagLabels();
			},
		},
		{
			activate: async (locale) => {
				await activatePlaceLabels(locale);
			},
			deactivate: () => {
				deactivatePlaceLabels();
			},
		},
		{
			activate: (locale) => {
				activatePointLabels(locale);
				return Promise.resolve();
			},
			deactivate: () => {
				deactivatePointLabels();
			},
		},
		{
			activate: async (locale) => {
				await activateDayMapLabels(locale);
			},
			deactivate: () => {
				deactivateDayMapLabels();
			},
		},
		{
			activate: async (locale) => {
				await activateCollaborationLabels(locale);
			},
			deactivate: () => {
				deactivateCollaborationLabels();
			},
		},
		{
			activate: (locale) => {
				activateDlcLabels(locale);
				return Promise.resolve();
			},
			deactivate: () => {
				deactivateDlcLabels();
			},
		},
		{
			activate: (locale) => {
				activateSchedulerLabels(locale);
				return Promise.resolve();
			},
			deactivate: () => {
				deactivateSchedulerLabels();
			},
		},
		{
			activate: (locale) => {
				activateEvaluationLabels(locale);
				return Promise.resolve();
			},
			deactivate: () => {
				deactivateEvaluationLabels();
			},
		},
		{
			activate: (locale) => {
				activateRecommendationSortProfileLabels(locale);
				return Promise.resolve();
			},
			deactivate: () => {
				deactivateRecommendationSortProfileLabels();
			},
		},
		{
			activate: (locale) => {
				activateCategoryLabels(locale);
				return Promise.resolve();
			},
			deactivate: () => {
				deactivateCategoryLabels();
			},
		},
	];
