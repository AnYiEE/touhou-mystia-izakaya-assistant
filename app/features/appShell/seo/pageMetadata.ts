import { type Metadata } from 'next';

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
import { INGREDIENT_LOCALIZATION_LOADERS } from '@/domain/data/ingredients/localization';
import { PARTNER_LOCALIZATION_LOADERS } from '@/domain/data/partners/localization';
import { RECORD_LOCALIZATION_LOADERS } from '@/domain/data/records/localization';

import {
	APP_SHELL_NAV_LABEL_KEYS,
	appShellMessages,
} from '@/features/appShell/client/messages';
import type { TSitePath } from '@/features/appShell/navigation/config';
import {
	META_MYSTIA_GUESTS,
	META_MYSTIA_SHOWCASE_GROUPS,
} from '@/features/metaMystia/content';
import { META_MYSTIA_PAGE_PATH } from '@/features/metaMystia/links';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

import { DEFAULT_LOCALE, type TLocale } from '@/shared/i18n/locale';
import { translate } from '@/shared/i18n/messages';
import {
	CANONICAL_LOCALE_PREFIX_MAP,
	HREFLANG_LOCALE_MAP,
	buildLocalePath,
} from '@/shared/i18n/routeLocales';
import {
	META_MYSTIA_KEYWORDS_BY_LOCALE,
	SITE_KEYWORDS_BY_LOCALE,
	SITE_KEYWORDS_LENGTH,
} from '@/shared/site/keywords';
import { type TSiteMessageKey, siteMessages } from '@/shared/site/messages';
import { SITE_METADATA } from '@/shared/site/metadata';

const { baseOrigin, cdnUrl, isExportMode, isOffline } = PUBLIC_RUNTIME_CONFIG;
const { author, enName } = SITE_METADATA;

export interface IMetadataLocaleContext {
	/** @description True when the request used a virtual locale prefix. */
	isPrefixed: boolean;
	locale: TLocale;
}

/**
 * @description Effective locale of the current request for metadata.
 * Static export has no request context and always renders the default
 * locale; the pre-hydration script corrects the document attributes there.
 */
export async function readMetadataLocaleContext(): Promise<IMetadataLocaleContext> {
	if (isExportMode) {
		return { isPrefixed: false, locale: DEFAULT_LOCALE };
	}

	const requestLocaleModule =
		await import('@/features/preferences/server/requestLocale');

	return requestLocaleModule.readRequestLocaleContext();
}

export function getLocalizedPageTitle(locale: TLocale, href: TSitePath) {
	return translate(appShellMessages, locale, APP_SHELL_NAV_LABEL_KEYS[href]);
}

export function buildAbsoluteSiteUrl(path: string) {
	return path === '/' ? baseOrigin : `${baseOrigin}${path}`;
}

/**
 * @description Full hreflang alternate set of one internal path:
 * `zh-Hans` and `x-default` point at the un-prefixed URL, the others at their
 * canonical locale prefix.
 */
export function buildLocaleAlternateLanguages(path: string) {
	const languages: Record<string, string> = {};
	for (const [hreflang, locale] of Object.entries(HREFLANG_LOCALE_MAP)) {
		languages[hreflang] = buildAbsoluteSiteUrl(
			buildLocalePath(locale, path)
		);
	}
	languages['x-default'] = buildAbsoluteSiteUrl(path);

	return languages;
}

export function buildPageAlternates(
	path: string,
	locale: TLocale,
	isPrefixed: boolean
): Metadata['alternates'] | undefined {
	if (isExportMode) {
		return undefined;
	}

	const hasCanonicalPrefix =
		isPrefixed && CANONICAL_LOCALE_PREFIX_MAP[locale] !== '';

	return {
		canonical: buildAbsoluteSiteUrl(
			hasCanonicalPrefix ? buildLocalePath(locale, path) : path
		),
		languages: buildLocaleAlternateLanguages(path),
	};
}

interface ILocalizedNameEntry {
	name: string | null;
}

type TNamesLoader = () => Promise<
	Readonly<Partial<Record<number, ILocalizedNameEntry>>>
>;

interface ICatalogNamesSource {
	canonicalData: ReadonlyArray<{ id: number; name: string }>;
	loaders: Readonly<Partial<Record<TLocale, TNamesLoader>>>;
}

const CATALOG_NAMES_SOURCE_BY_HREF: Readonly<
	Partial<Record<TSitePath, ICatalogNamesSource>>
> = {
	'/badges': {
		canonicalData: BadgeCatalog.getInstance().canonicalData,
		loaders: BADGE_LOCALIZATION_LOADERS,
	},
	'/beverages': {
		canonicalData: BeverageCatalog.getInstance().canonicalData,
		loaders: BEVERAGE_LOCALIZATION_LOADERS,
	},
	'/clothes': {
		canonicalData: ClothesCatalog.getInstance().canonicalData,
		loaders: CLOTHES_LOCALIZATION_LOADERS,
	},
	'/cookers': {
		canonicalData: CookerCatalog.getInstance().canonicalData,
		loaders: COOKER_LOCALIZATION_LOADERS,
	},
	'/currencies': {
		canonicalData: CurrencyItemCatalog.getInstance().canonicalData,
		loaders: CURRENCY_ITEM_LOCALIZATION_LOADERS,
	},
	'/decorations': {
		canonicalData: DecorationCatalog.getInstance().canonicalData,
		loaders: DECORATION_LOCALIZATION_LOADERS,
	},
	'/fishing-collectibles': {
		canonicalData: FishingCollectibleCatalog.getInstance().canonicalData,
		loaders: FISHING_COLLECTIBLE_LOCALIZATION_LOADERS,
	},
	'/foods': {
		canonicalData: FoodCatalog.getInstance().canonicalData,
		loaders: FOOD_LOCALIZATION_LOADERS,
	},
	'/ingredients': {
		canonicalData: IngredientCatalog.getInstance().canonicalData,
		loaders: INGREDIENT_LOCALIZATION_LOADERS,
	},
	'/items': {
		canonicalData: GeneralItemCatalog.getInstance().canonicalData,
		loaders: GENERAL_ITEM_LOCALIZATION_LOADERS,
	},
	'/normal-guests': {
		canonicalData: NormalGuestCatalog.getInstance().canonicalData,
		loaders: NORMAL_GUEST_LOCALIZATION_LOADERS,
	},
	'/partners': {
		canonicalData: PartnerCatalog.getInstance().canonicalData,
		loaders: PARTNER_LOCALIZATION_LOADERS,
	},
	'/records': {
		canonicalData: RecordItemCatalog.getInstance().canonicalData,
		loaders: RECORD_LOCALIZATION_LOADERS,
	},
	'/special-guests': {
		canonicalData: SpecialGuestCatalog.getInstance().canonicalData,
		loaders: SPECIAL_GUEST_LOCALIZATION_LOADERS,
	},
};

/**
 * @description First `count` record names of one catalogue in display order,
 * projected through the locale overlay. Missing translations fall back to the
 * canonical name; Simplified Chinese reads the canonical data directly.
 */
export async function readLocalizedCatalogNames(
	href: TSitePath,
	locale: TLocale,
	count: number
): Promise<ReadonlyArray<string>> {
	const source: ICatalogNamesSource | undefined =
		CATALOG_NAMES_SOURCE_BY_HREF[href];
	if (source === undefined) {
		return [];
	}

	const items = source.canonicalData.slice(0, count);
	if (locale === DEFAULT_LOCALE) {
		return items.map(({ name }) => name);
	}

	const loader = source.loaders[locale];
	if (loader === undefined) {
		return items.map(({ name }) => name);
	}

	const entries = await loader();

	return items.map(({ id, name }) => entries[id]?.name ?? name);
}

export interface ICatalogPageMetadataOptions {
	descriptionKey: TSiteMessageKey;
	href: TSitePath;
	isPrefixed: boolean;
	locale: TLocale;
	names: ReadonlyArray<string>;
}

export function buildCatalogPageMetadata({
	descriptionKey,
	href,
	isPrefixed,
	locale,
	names,
}: ICatalogPageMetadataOptions): Metadata {
	const title = getLocalizedPageTitle(locale, href);
	const itemSeparator = translate(
		siteMessages,
		locale,
		'site.seo.itemSeparator'
	);
	const siteDescription = translate(
		siteMessages,
		locale,
		'site.manifest.description'
	);
	const description = translate(siteMessages, locale, descriptionKey, {
		description: siteDescription,
		items: names.join(itemSeparator),
		name: title,
	});
	const keywords = SITE_KEYWORDS_BY_LOCALE[locale].toSpliced(
		SITE_KEYWORDS_LENGTH,
		Infinity,
		...names
	);
	const alternates = buildPageAlternates(href, locale, isPrefixed);

	return {
		title,

		description,
		keywords,
		...(alternates === undefined ? {} : { alternates }),
	};
}

export function buildMetaMystiaPageMetadata({
	isPrefixed,
	locale,
}: {
	isPrefixed: boolean;
	locale: TLocale;
}): Metadata {
	const {
		beverages: { records: beverages },
		clothes: { records: clothes },
		foods: { records: foods },
		ingredients: { records: ingredients },
	} = META_MYSTIA_SHOWCASE_GROUPS;

	const title = translate(siteMessages, locale, 'site.seo.metaMystia.title');
	const description = translate(
		siteMessages,
		locale,
		'site.seo.metaMystia.description',
		{
			beverages: beverages.length,
			clothes: clothes.length,
			foods: foods.length,
			guests: META_MYSTIA_GUESTS.length,
			ingredients: ingredients.length,
		}
	);
	const keywords = SITE_KEYWORDS_BY_LOCALE[locale].toSpliced(
		SITE_KEYWORDS_LENGTH,
		Infinity,
		...META_MYSTIA_KEYWORDS_BY_LOCALE[locale]
	);
	const alternates = buildPageAlternates(
		META_MYSTIA_PAGE_PATH,
		locale,
		isPrefixed
	);

	return {
		title,

		description,
		keywords,
		...(alternates === undefined ? {} : { alternates }),
	};
}

/**
 * @description Site-wide metadata. The default title keeps the historical
 * `<name> - <English name>` shape, collapsing to just the English name when a
 * locale already uses it as the site name.
 */
export function buildRootMetadata(locale: TLocale): Metadata {
	const siteName = translate(siteMessages, locale, 'site.name');
	const siteShortName = translate(siteMessages, locale, 'site.shortName');
	const defaultTitle =
		siteName === enName ? siteName : `${siteName} - ${enName}`;

	return {
		title: { default: defaultTitle, template: `%s | ${defaultTitle}` },

		description: translate(
			siteMessages,
			locale,
			'site.manifest.description'
		),
		keywords: [...SITE_KEYWORDS_BY_LOCALE[locale]],

		appleWebApp: true,
		applicationName: siteShortName,

		authors: author,
		icons: {
			apple: `${cdnUrl}/icons/apple-touch-icon.png`,
			icon: `${cdnUrl}/favicon.ico`,
		},

		...(isOffline
			? {}
			: {
					twitter: { card: 'summary' },
					verification: {
						other: {
							// cSpell:ignore codeva
							'baidu-site-verification': 'codeva-aSffMaEHAj',
						},
					},
				}),
	};
}
