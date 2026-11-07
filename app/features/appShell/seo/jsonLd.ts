import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

import { type TLocale } from '@/shared/i18n/locale';
import { translate } from '@/shared/i18n/messages';
import { buildLocalePath } from '@/shared/i18n/routeLocales';
import { siteMessages } from '@/shared/site/messages';
import { SITE_METADATA } from '@/shared/site/metadata';
import { PACKAGE_METADATA } from '@/shared/site/packageMetadata';

import { getSeoContentDate } from './contentDates';

const { baseOrigin, isExportMode } = PUBLIC_RUNTIME_CONFIG;
const AUTHOR_ID = `${baseOrigin}/#author`;

function buildRootUrl(locale: TLocale, isPrefixed: boolean) {
	const path =
		isExportMode || !isPrefixed ? '/' : buildLocalePath(locale, '/');
	return path === '/' ? baseOrigin : `${baseOrigin}${path}`;
}

export function buildRootStructuredData(locale: TLocale, isPrefixed: boolean) {
	const rootUrl = buildRootUrl(locale, isPrefixed);
	const siteName = translate(siteMessages, locale, 'site.name');
	const description = translate(
		siteMessages,
		locale,
		'site.manifest.description'
	);
	const dateModified = getSeoContentDate('/');

	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@id': `${rootUrl}#website`,
				'@type': 'WebSite',
				alternateName: SITE_METADATA.enName,
				...(dateModified === undefined ? {} : { dateModified }),
				description,
				inLanguage: locale,
				name: siteName,
				publisher: { '@id': AUTHOR_ID },
				url: rootUrl,
			},
			{
				'@id': AUTHOR_ID,
				'@type': 'Person',
				name: SITE_METADATA.author.name,
				sameAs: [
					SITE_METADATA.author.url,
					PACKAGE_METADATA.repositoryUrl,
				],
				url: SITE_METADATA.author.url,
			},
		],
	};
}

interface IGuestStructuredDataOptions {
	categoryName: string;
	categoryUrl: string;
	dateModified: string | undefined;
	description: string;
	locale: TLocale;
	name: string;
	url: string;
	websiteUrl: string;
}

export function buildGuestStructuredData({
	categoryName,
	categoryUrl,
	dateModified,
	description,
	locale,
	name,
	url,
	websiteUrl,
}: IGuestStructuredDataOptions) {
	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{
						'@type': 'ListItem',
						item: { '@id': categoryUrl, name: categoryName },
						position: 1,
					},
					{
						'@type': 'ListItem',
						item: { '@id': url, name },
						position: 2,
					},
				],
			},
			{
				'@type': 'ProfilePage',
				...(dateModified === undefined ? {} : { dateModified }),
				description,
				inLanguage: locale,
				isPartOf: { '@id': `${websiteUrl}#website` },
				mainEntity: {
					'@type': 'Person',
					description,
					mainEntityOfPage: { '@id': url },
					name,
					url,
				},
				mainEntityOfPage: { '@id': url },
				name,
				publisher: { '@id': AUTHOR_ID },
				url,
			},
		],
	};
}

interface IMapStructuredDataOptions {
	dateModified: string | undefined;
	description: string;
	locale: TLocale;
	name: string;
	url: string;
	websiteUrl: string;
	worldMapName: string;
	worldMapUrl: string;
}

export function buildMapStructuredData({
	dateModified,
	description,
	locale,
	name,
	url,
	websiteUrl,
	worldMapName,
	worldMapUrl,
}: IMapStructuredDataOptions) {
	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{
						'@type': 'ListItem',
						item: { '@id': worldMapUrl, name: worldMapName },
						position: 1,
					},
					{
						'@type': 'ListItem',
						item: { '@id': url, name },
						position: 2,
					},
				],
			},
			{
				'@type': 'WebPage',
				...(dateModified === undefined ? {} : { dateModified }),
				description,
				inLanguage: locale,
				isPartOf: { '@id': `${websiteUrl}#website` },
				mainEntity: {
					'@type': 'Map',
					description,
					mainEntityOfPage: { '@id': url },
					name,
					url,
				},
				mainEntityOfPage: { '@id': url },
				name,
				publisher: { '@id': AUTHOR_ID },
				url,
			},
		],
	};
}

interface ICollectionItem {
	name: string;
	url: string;
}

interface ICollectionPageStructuredDataOptions {
	dateModified: string | undefined;
	description: string;
	items: ReadonlyArray<ICollectionItem>;
	locale: TLocale;
	name: string;
	url: string;
	websiteUrl: string;
}

export function buildCollectionPageStructuredData({
	dateModified,
	description,
	items,
	locale,
	name,
	url,
	websiteUrl,
}: ICollectionPageStructuredDataOptions) {
	const websiteName = translate(siteMessages, locale, 'site.name');
	const itemList =
		items.length === 0
			? {}
			: {
					mainEntity: {
						'@type': 'ItemList',
						itemListElement: items.map((item, index) => ({
							'@type': 'ListItem',
							item: {
								'@id': item.url,
								'@type': 'WebPage',
								name: item.name,
							},
							position: index + 1,
						})),
						numberOfItems: items.length,
					},
				};

	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{
						'@type': 'ListItem',
						item: { '@id': websiteUrl, name: websiteName },
						position: 1,
					},
					{
						'@type': 'ListItem',
						item: { '@id': url, name },
						position: 2,
					},
				],
			},
			{
				'@type': 'CollectionPage',
				...(dateModified === undefined ? {} : { dateModified }),
				description,
				inLanguage: locale,
				isPartOf: { '@id': `${websiteUrl}#website` },
				name,
				publisher: { '@id': AUTHOR_ID },
				url,
				...itemList,
			},
		],
	};
}
