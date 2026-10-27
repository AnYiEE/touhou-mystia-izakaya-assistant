import { type Transaction } from 'kysely';

import {
	type IFeatureModuleDefinition,
	type TFeatureModuleKey,
	type TStaticFeatureModuleKey,
	createSsoAppFeatureModuleKey,
	isSsoAppFeatureModuleKey,
} from '@/domain/featureAccess/contracts';
import {
	type IStaticFeatureModuleRegistration,
	STATIC_FEATURE_MODULE_REGISTRATION_MAP,
	type TStaticFeatureModuleLocalizationKey,
	isStaticFeatureModuleKey,
} from '@/domain/featureAccess/registry';

import { getAccountDatabase } from '@/features/account/server/persistence/database';
import {
	getLocalizedSsoClientName,
	readSsoClientNameTranslations,
} from '@/features/account/sso/server/validation';
import {
	type TFeatureAccessMessageKey,
	featureAccessMessages,
} from '@/features/featureAccess/messages';

import type { TDatabase } from '@/infrastructure/database/schema';
import { TABLE_NAME_MAP } from '@/infrastructure/database/tableNames';

import { DEFAULT_LOCALE, type TLocale } from '@/shared/i18n/locale';
import { translate } from '@/shared/i18n/messages';
import { siteMessages } from '@/shared/site/messages';

export interface ISsoFeatureModuleClient {
	deleted_at: number | null;
	disabled_at: number | null;
	id: string;
	name: string;
}

const STATIC_FEATURE_MODULE_MESSAGE_KEYS = {
	accountSync: {
		description: 'featureAccess.module.accountSync.description',
		label: 'featureAccess.module.accountSync.label',
	},
	mapsFull: {
		description: 'featureAccess.module.mapsFull.description',
		label: 'featureAccess.module.mapsFull.label',
	},
	mapsPreview: {
		description: 'featureAccess.module.mapsPreview.description',
		label: 'featureAccess.module.mapsPreview.label',
	},
	ssoUse: {
		description: 'featureAccess.module.ssoUse.description',
		label: 'featureAccess.module.ssoUse.label',
	},
} as const satisfies Record<
	TStaticFeatureModuleLocalizationKey,
	{ description: TFeatureAccessMessageKey; label: TFeatureAccessMessageKey }
>;

function createStaticFeatureModuleDefinition<
	TKey extends TStaticFeatureModuleKey,
>(
	registration: IStaticFeatureModuleRegistration<TKey>,
	locale: TLocale
): IFeatureModuleDefinition<TKey> {
	const messageKeys =
		STATIC_FEATURE_MODULE_MESSAGE_KEYS[registration.localizationKey];
	const descriptionParams =
		registration.localizationKey === 'ssoUse'
			? { shortName: translate(siteMessages, locale, 'site.shortName') }
			: undefined;
	return {
		defaultAccess: registration.defaultAccess,
		description: translate(
			featureAccessMessages,
			locale,
			messageKeys.description,
			descriptionParams
		),
		...(registration.implies === undefined
			? {}
			: { implies: registration.implies }),
		isAvailable: registration.isAvailable,
		key: registration.key,
		label: translate(featureAccessMessages, locale, messageKeys.label),
	};
}

export function listStaticFeatureModuleDefinitions(
	locale: TLocale = DEFAULT_LOCALE
) {
	return Object.values(STATIC_FEATURE_MODULE_REGISTRATION_MAP).map(
		(registration) =>
			createStaticFeatureModuleDefinition(registration, locale)
	);
}

export function createSsoAppFeatureModuleDefinition(
	client: ISsoFeatureModuleClient,
	locale: TLocale = DEFAULT_LOCALE
): IFeatureModuleDefinition {
	return {
		defaultAccess: 'authenticated',
		description: translate(
			featureAccessMessages,
			locale,
			'featureAccess.module.ssoApp.description',
			{
				client: client.name,
				shortName: translate(siteMessages, locale, 'site.shortName'),
			}
		),
		isAvailable: client.deleted_at === null && client.disabled_at === null,
		key: createSsoAppFeatureModuleKey(client.id),
		label: client.name,
	};
}

export function mergeFeatureModuleDefinitions(
	staticDefinitions: ReadonlyArray<IFeatureModuleDefinition>,
	ssoClients: ReadonlyArray<ISsoFeatureModuleClient>,
	locale: TLocale = DEFAULT_LOCALE
): ReadonlyArray<IFeatureModuleDefinition> {
	return [
		...staticDefinitions,
		...ssoClients
			.filter(({ deleted_at: deletedAt }) => deletedAt === null)
			.map((client) =>
				createSsoAppFeatureModuleDefinition(client, locale)
			),
	];
}

export async function listFeatureModuleDefinitionsInTransaction(
	trx: Transaction<TDatabase>,
	locale: TLocale = DEFAULT_LOCALE
): Promise<ReadonlyArray<IFeatureModuleDefinition>> {
	const ssoClients = await trx
		.selectFrom(TABLE_NAME_MAP.ssoClient)
		.select([
			'deleted_at',
			'disabled_at',
			'id',
			'name',
			'name_translations_json',
		])
		.where('deleted_at', 'is', null)
		.orderBy('name')
		.orderBy('id')
		.execute();
	return mergeFeatureModuleDefinitions(
		listStaticFeatureModuleDefinitions(locale),
		ssoClients.map((client) => ({
			...client,
			name: getLocalizedSsoClientName(
				{
					name: client.name,
					name_translations: readSsoClientNameTranslations(
						client.name_translations_json
					),
				},
				locale
			),
		})),
		locale
	);
}

export async function resolveFeatureModuleDefinitionInTransaction(
	trx: Transaction<TDatabase>,
	moduleKey: TFeatureModuleKey,
	locale: TLocale = DEFAULT_LOCALE
) {
	if (isStaticFeatureModuleKey(moduleKey)) {
		return createStaticFeatureModuleDefinition(
			STATIC_FEATURE_MODULE_REGISTRATION_MAP[moduleKey],
			locale
		);
	}
	if (!isSsoAppFeatureModuleKey(moduleKey)) {
		return null;
	}

	const clientId = moduleKey.slice('sso.app:'.length);
	if (clientId === '') {
		return null;
	}
	const client = await trx
		.selectFrom(TABLE_NAME_MAP.ssoClient)
		.select([
			'deleted_at',
			'disabled_at',
			'id',
			'name',
			'name_translations_json',
		])
		.where('id', '=', clientId)
		.where('deleted_at', 'is', null)
		.executeTakeFirst();
	if (client === undefined) {
		return null;
	}
	return createSsoAppFeatureModuleDefinition(
		{
			...client,
			name: getLocalizedSsoClientName(
				{
					name: client.name,
					name_translations: readSsoClientNameTranslations(
						client.name_translations_json
					),
				},
				locale
			),
		},
		locale
	);
}

export async function listFeatureModuleDefinitions(
	locale: TLocale = DEFAULT_LOCALE
) {
	const db = await getAccountDatabase();
	return db
		.transaction()
		.execute((trx) =>
			listFeatureModuleDefinitionsInTransaction(trx, locale)
		);
}

export async function resolveFeatureModuleDefinition(
	moduleKey: TFeatureModuleKey,
	locale: TLocale = DEFAULT_LOCALE
) {
	const db = await getAccountDatabase();
	return db
		.transaction()
		.execute((trx) =>
			resolveFeatureModuleDefinitionInTransaction(trx, moduleKey, locale)
		);
}
