import { type Metadata } from 'next';
import { cache } from 'react';

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
import { DAY_MAP_EXTRA_FACTS } from '@/domain/data/maps/dayMapExtraFacts';
import { DAY_MAP_LOCALIZATION_LOADERS } from '@/domain/data/maps/localization';
import type { TDayMapLabel } from '@/domain/data/maps/types';
import { PARTNER_LOCALIZATION_LOADERS } from '@/domain/data/partners/localization';
import { PLACE_LOCALIZATION_LOADERS } from '@/domain/data/places/localization';
import { MAP_FACTS } from '@/domain/data/places/placeFacts';
import { RECORD_LOCALIZATION_LOADERS } from '@/domain/data/records/localization';

import {
	APP_SHELL_NAV_LABEL_KEYS,
	appShellMessages,
} from '@/features/appShell/client/messages';
import { type TSitePath } from '@/features/appShell/navigation/config';
import { getSeoContentDate } from '@/features/appShell/seo/contentDates';
import { derivativeProjectsMessages } from '@/features/derivativeProjects/client/messages';
import { DERIVATIVE_PROJECTS_PAGE_PATH } from '@/features/derivativeProjects/links';
import { mapsMessages } from '@/features/maps/client/messages';
import { MAPS_PAGE_PATH } from '@/features/maps/links';
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
const SEO_DESCRIPTION_MAX_LENGTH = 160;
const SEO_DESCRIPTION_MIN_WORD_BOUNDARY_CHARACTERS = 120;
const OPEN_GRAPH_LOCALE_MAP = {
	en: 'en_US',
	ja: 'ja_JP',
	ko: 'ko_KR',
	'zh-CN': 'zh_CN',
	'zh-TW': 'zh_TW',
} as const satisfies Record<TLocale, string>;

export interface IMetadataLocaleContext {
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

function getSiteDocumentTitle(locale: TLocale) {
	const siteName = translate(siteMessages, locale, 'site.name');
	return siteName === enName ? siteName : `${siteName} - ${enName}`;
}

export function buildAbsoluteSiteUrl(path: string) {
	return path === '/' ? baseOrigin : `${baseOrigin}${path}`;
}

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

export function buildCanonicalPageUrl(
	path: string,
	locale: TLocale,
	isPrefixed: boolean
) {
	const hasCanonicalPrefix =
		isPrefixed && CANONICAL_LOCALE_PREFIX_MAP[locale] !== '';

	return buildAbsoluteSiteUrl(
		hasCanonicalPrefix ? buildLocalePath(locale, path) : path
	);
}

function buildPageOpenGraphMetadata({
	description,
	locale,
	title,
	type,
	url,
}: {
	description: string;
	locale: TLocale;
	title: string;
	type: 'article' | 'profile' | 'website';
	url?: string;
}) {
	const siteName = translate(siteMessages, locale, 'site.name');

	return {
		alternateLocale: Object.values(OPEN_GRAPH_LOCALE_MAP).filter(
			(value) => value !== OPEN_GRAPH_LOCALE_MAP[locale]
		),
		description,
		locale: OPEN_GRAPH_LOCALE_MAP[locale],
		siteName,
		title,
		type,
		...(url === undefined ? {} : { url }),
	};
}

function buildPageSocialMetadata({
	description,
	isPrefixed,
	locale,
	path,
	title,
	type,
}: {
	description: string;
	isPrefixed: boolean;
	locale: TLocale;
	path: string;
	title: string;
	type: 'article' | 'profile' | 'website';
}) {
	const documentTitle = `${title} | ${getSiteDocumentTitle(locale)}`;

	return {
		openGraph: buildPageOpenGraphMetadata({
			description,
			locale,
			title: documentTitle,
			type,
			url: buildCanonicalPageUrl(path, locale, isPrefixed),
		}),
		twitter: {
			card: 'summary' as const,
			description,
			title: documentTitle,
		},
	};
}

function normalizeSeoDescription(value: string) {
	const compact = value.replaceAll(/\s+/gu, ' ').trim();
	const characters = compact.match(/./gu) ?? [];

	if (characters.length <= SEO_DESCRIPTION_MAX_LENGTH) {
		return compact;
	}

	const truncated = characters
		.slice(0, SEO_DESCRIPTION_MAX_LENGTH - 1)
		.join('')
		.trimEnd();
	const lastSpace = truncated.lastIndexOf(' ');
	const wordBoundary =
		lastSpace >= SEO_DESCRIPTION_MIN_WORD_BOUNDARY_CHARACTERS
			? truncated.slice(0, lastSpace).trimEnd()
			: truncated;

	return `${wordBoundary.replace(/[,:;，；：、]+$/u, '')}…`;
}

function getFirstDescription(
	value: ReadonlyArray<string | null> | string | null | undefined
) {
	if (typeof value === 'string') {
		return value;
	}

	return value?.find((item): item is string => typeof item === 'string');
}

interface ILocalizedNameEntry {
	description?: ReadonlyArray<string | null> | string | null;
	name: string | null;
}

type TNamesLoader = () => Promise<
	Readonly<Partial<Record<number, ILocalizedNameEntry>>>
>;

interface ICatalogNamesSource {
	canonicalData: ReadonlyArray<{
		description?: ReadonlyArray<string | null> | string | null;
		id: number;
		maps?: ReadonlyArray<TDayMapLabel>;
		name: string;
	}>;
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

export const readLocalizedCatalogNames = cache(
	async (
		href: TSitePath,
		locale: TLocale,
		count: number
	): Promise<ReadonlyArray<string>> => {
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
);

const readLocalizedCatalogEntry = cache(
	async (href: TSitePath, locale: TLocale, id: number) => {
		const source: ICatalogNamesSource | undefined =
			CATALOG_NAMES_SOURCE_BY_HREF[href];
		if (source === undefined) {
			return null;
		}

		const item = source.canonicalData.find((entry) => entry.id === id);
		if (item === undefined) {
			return null;
		}

		if (locale === DEFAULT_LOCALE) {
			return {
				description: item.description,
				maps: item.maps,
				name: item.name,
			};
		}

		const loader = source.loaders[locale];
		if (loader === undefined) {
			return {
				description: item.description,
				maps: item.maps,
				name: item.name,
			};
		}

		const entries = await loader();
		const localizedEntry = entries[id];

		return {
			description: localizedEntry?.description ?? item.description,
			maps: item.maps,
			name: localizedEntry?.name ?? item.name,
		};
	}
);

const readLocalizedDayMapName = cache(
	async (map: TDayMapLabel, locale: TLocale) => {
		const isExtraMap = Object.hasOwn(DAY_MAP_EXTRA_FACTS, map);
		const fallback = isExtraMap
			? DAY_MAP_EXTRA_FACTS[map as keyof typeof DAY_MAP_EXTRA_FACTS].name
			: MAP_FACTS[map as keyof typeof MAP_FACTS].label;

		if (locale === DEFAULT_LOCALE) {
			return fallback;
		}

		const placeLoader =
			PLACE_LOCALIZATION_LOADERS[
				locale as keyof typeof PLACE_LOCALIZATION_LOADERS
			];
		const localization = await placeLoader();
		const labels: Readonly<Partial<Record<string, string | null>>> =
			localization.labels;
		const localizedLabel = labels[map];
		if (localizedLabel !== null && localizedLabel !== undefined) {
			return localizedLabel;
		}

		if (isExtraMap) {
			const dayMapLoader =
				DAY_MAP_LOCALIZATION_LOADERS[
					locale as keyof typeof DAY_MAP_LOCALIZATION_LOADERS
				];
			const dayMapLocalization = await dayMapLoader();
			const places: Readonly<Partial<Record<string, string | null>>> =
				dayMapLocalization.places;
			const localizedLabel = places[map];
			if (localizedLabel !== null && localizedLabel !== undefined) {
				return localizedLabel;
			}
		}

		return fallback;
	}
);

type TGuestPagePath = '/normal-guests' | '/special-guests';

interface IGuestPageSeoOptions {
	href: TGuestPagePath;
	id: number;
	isPrefixed: boolean;
	locale: TLocale;
}

export interface IGuestPageSeoData {
	categoryName: string;
	categoryUrl: string;
	dateModified: string | undefined;
	description: string;
	name: string;
	title: string;
	url: string;
	websiteUrl: string;
}

export const readGuestPageSeoData = cache(
	async ({
		href,
		id,
		isPrefixed,
		locale,
	}: IGuestPageSeoOptions): Promise<IGuestPageSeoData | null> => {
		const entry = await readLocalizedCatalogEntry(href, locale, id);
		if (entry === null) {
			return null;
		}

		const categoryName = getLocalizedPageTitle(locale, href);
		const siteDescription = translate(
			siteMessages,
			locale,
			'site.manifest.description'
		);
		const itemSeparator = translate(
			siteMessages,
			locale,
			'site.seo.itemSeparator'
		);
		const localizedMaps = await Promise.all(
			(entry.maps ?? []).map((map) =>
				readLocalizedDayMapName(map, locale)
			)
		);
		const factDescription =
			localizedMaps.length === 0
				? null
				: translate(
						siteMessages,
						locale,
						href === '/special-guests'
							? 'site.seo.description.specialGuestFacts'
							: 'site.seo.description.normalGuestFacts',
						{
							maps: localizedMaps.join(itemSeparator),
							name: entry.name,
						}
					);
		const sourceDescription = getFirstDescription(entry.description);
		const description = normalizeSeoDescription(
			factDescription ?? sourceDescription ?? siteDescription
		);
		const siteTitle = getSiteDocumentTitle(locale);
		const canonicalPath = `${href}/${id}`;

		return {
			categoryName,
			categoryUrl: buildCanonicalPageUrl(href, locale, isPrefixed),
			dateModified: getSeoContentDate(href),
			description,
			name: entry.name,
			title: `${entry.name} | ${categoryName} | ${siteTitle}`,
			url: buildCanonicalPageUrl(canonicalPath, locale, isPrefixed),
			websiteUrl: buildCanonicalPageUrl('/', locale, isPrefixed),
		};
	}
);

export async function buildGuestPageMetadata(
	options: IGuestPageSeoOptions
): Promise<Metadata> {
	const data = await readGuestPageSeoData(options);
	if (data === null) {
		return {};
	}
	const alternates = buildPageAlternates(
		`${options.href}/${options.id}`,
		options.locale,
		options.isPrefixed
	);

	return {
		description: data.description,
		openGraph: buildPageOpenGraphMetadata({
			description: data.description,
			locale: options.locale,
			title: data.title,
			type: 'profile',
			url: data.url,
		}),
		title: { absolute: data.title },
		twitter: {
			card: 'summary',
			description: data.description,
			title: data.title,
		},
		...(alternates === undefined ? {} : { alternates }),
	};
}

interface IDayMapPageSeoOptions {
	isPrefixed: boolean;
	locale: TLocale;
	map: TDayMapLabel;
}

export interface IDayMapPageSeoData {
	dateModified: string | undefined;
	description: string;
	name: string;
	title: string;
	url: string;
	websiteUrl: string;
	worldMapName: string;
	worldMapUrl: string;
}

export const readDayMapPageSeoData = cache(
	async ({
		isPrefixed,
		locale,
		map,
	}: IDayMapPageSeoOptions): Promise<IDayMapPageSeoData> => {
		const name = await readLocalizedDayMapName(map, locale);
		const worldMapName = translate(
			mapsMessages,
			locale,
			'maps.world.title'
		);
		const mapDescription = translate(
			mapsMessages,
			locale,
			'maps.meta.description'
		);
		const description = normalizeSeoDescription(
			`${name} - ${mapDescription}`
		);
		const siteTitle = getSiteDocumentTitle(locale);

		return {
			dateModified: getSeoContentDate(MAPS_PAGE_PATH),
			description,
			name,
			title: `${name} | ${worldMapName} | ${siteTitle}`,
			url: buildCanonicalPageUrl(
				`${MAPS_PAGE_PATH}/${map}`,
				locale,
				isPrefixed
			),
			websiteUrl: buildCanonicalPageUrl('/', locale, isPrefixed),
			worldMapName,
			worldMapUrl: buildCanonicalPageUrl(
				MAPS_PAGE_PATH,
				locale,
				isPrefixed
			),
		};
	}
);

export async function buildDayMapPageMetadata(
	options: IDayMapPageSeoOptions
): Promise<Metadata> {
	const data = await readDayMapPageSeoData(options);
	const alternates = buildPageAlternates(
		`${MAPS_PAGE_PATH}/${options.map}`,
		options.locale,
		options.isPrefixed
	);

	return {
		description: data.description,
		openGraph: buildPageOpenGraphMetadata({
			description: data.description,
			locale: options.locale,
			title: data.title,
			type: 'article',
			url: data.url,
		}),
		title: { absolute: data.title },
		twitter: {
			card: 'summary',
			description: data.description,
			title: data.title,
		},
		...(alternates === undefined ? {} : { alternates }),
	};
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
	const description = normalizeSeoDescription(
		translate(siteMessages, locale, descriptionKey, {
			description: '',
			items: names.join(itemSeparator),
			name: title,
		})
	);
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
		...buildPageSocialMetadata({
			description,
			isPrefixed,
			locale,
			path: href,
			title,
			type: 'website',
		}),
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
	const normalizedDescription = normalizeSeoDescription(description);

	return {
		title,

		description: normalizedDescription,
		keywords,
		...(alternates === undefined ? {} : { alternates }),
		...buildPageSocialMetadata({
			description: normalizedDescription,
			isPrefixed,
			locale,
			path: META_MYSTIA_PAGE_PATH,
			title,
			type: 'article',
		}),
	};
}

export function buildDerivativeProjectsPageMetadata({
	isPrefixed,
	locale,
}: {
	isPrefixed: boolean;
	locale: TLocale;
}): Metadata {
	const title = translate(
		derivativeProjectsMessages,
		locale,
		'derivativeProjects.title'
	);
	const description = translate(
		derivativeProjectsMessages,
		locale,
		'derivativeProjects.meta.description'
	);
	const alternates = buildPageAlternates(
		DERIVATIVE_PROJECTS_PAGE_PATH,
		locale,
		isPrefixed
	);
	const normalizedDescription = normalizeSeoDescription(description);

	return {
		title,

		description: normalizedDescription,
		...(alternates === undefined ? {} : { alternates }),
		...buildPageSocialMetadata({
			description: normalizedDescription,
			isPrefixed,
			locale,
			path: DERIVATIVE_PROJECTS_PAGE_PATH,
			title,
			type: 'article',
		}),
	};
}

export function buildAboutPageMetadata({
	isPrefixed,
	locale,
}: {
	isPrefixed: boolean;
	locale: TLocale;
}): Metadata {
	const title = getLocalizedPageTitle(locale, '/about');
	const description = normalizeSeoDescription(
		translate(siteMessages, locale, 'site.manifest.description')
	);
	const alternates = buildPageAlternates('/about', locale, isPrefixed);

	return {
		description,
		openGraph: buildPageOpenGraphMetadata({
			description,
			locale,
			title: `${title} | ${getSiteDocumentTitle(locale)}`,
			type: 'article',
			url: buildCanonicalPageUrl('/about', locale, isPrefixed),
		}),
		title,
		twitter: {
			card: 'summary',
			description,
			title: `${title} | ${getSiteDocumentTitle(locale)}`,
		},
		...(alternates === undefined ? {} : { alternates }),
	};
}

export function buildMapsPageMetadata({
	isPrefixed,
	locale,
}: {
	isPrefixed: boolean;
	locale: TLocale;
}): Metadata {
	const title = translate(mapsMessages, locale, 'maps.world.title');
	const description = translate(
		mapsMessages,
		locale,
		'maps.meta.description'
	);
	const alternates = buildPageAlternates(MAPS_PAGE_PATH, locale, isPrefixed);
	const normalizedDescription = normalizeSeoDescription(description);

	return {
		title,

		description: normalizedDescription,
		...(alternates === undefined ? {} : { alternates }),
		...buildPageSocialMetadata({
			description: normalizedDescription,
			isPrefixed,
			locale,
			path: MAPS_PAGE_PATH,
			title,
			type: 'website',
		}),
	};
}

/**
 * @description Site-wide metadata. The default title keeps the historical
 * `<name> - <English name>` shape, collapsing to just the English name when a
 * locale already uses it as the site name.
 */
export function buildRootMetadata(
	locale: TLocale,
	isPrefixed: boolean
): Metadata {
	const siteName = translate(siteMessages, locale, 'site.name');
	const siteShortName = translate(siteMessages, locale, 'site.shortName');
	const description = normalizeSeoDescription(
		translate(siteMessages, locale, 'site.manifest.description')
	);
	const defaultTitle =
		siteName === enName ? siteName : `${siteName} - ${enName}`;

	return {
		metadataBase: new URL(baseOrigin),
		title: { default: defaultTitle, template: `%s | ${defaultTitle}` },

		description,
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
					openGraph: buildPageOpenGraphMetadata({
						description,
						locale,
						title: defaultTitle,
						type: 'website',
						url: buildCanonicalPageUrl('/', locale, isPrefixed),
					}),
					twitter: {
						card: 'summary',
						description,
						title: defaultTitle,
					},
					verification: {
						other: {
							// cSpell:ignore codeva
							'baidu-site-verification': 'codeva-aSffMaEHAj',
						},
					},
				}),
	};
}
