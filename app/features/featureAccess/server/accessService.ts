import { type Transaction } from 'kysely';

import {
	type IEffectiveFeatureAccess,
	type TFeatureModuleKey,
} from '@/domain/featureAccess/contracts';

import { getAccountDatabase } from '@/features/account/server/persistence/database';

import type { TDatabase } from '@/infrastructure/database/schema';

import { DEFAULT_LOCALE, type TLocale } from '@/shared/i18n/locale';

import { evaluateFeatureAccessMap } from './accessEvaluation';
import { listFeatureAccessGroupModuleGrantsForUserInTransaction } from './groupRepository';
import { listFeatureModulePolicyOverridesInTransaction } from './modulePolicyRepository';
import { listFeatureModuleDefinitionsInTransaction } from './moduleRegistryService';
import { listUserFeatureAccessOverridesInTransaction } from './userAccessOverrideRepository';

export async function evaluateFeatureAccessForAnonymousInTransaction(
	trx: Transaction<TDatabase>,
	locale: TLocale = DEFAULT_LOCALE
): Promise<Readonly<Record<TFeatureModuleKey, IEffectiveFeatureAccess>>> {
	const [definitions, policies] = await Promise.all([
		listFeatureModuleDefinitionsInTransaction(trx, locale),
		listFeatureModulePolicyOverridesInTransaction(trx),
	]);
	return evaluateFeatureAccessMap({
		definitions,
		groupGrants: {},
		isAuthenticated: false,
		moduleOverrides: {},
		policies,
	});
}

export async function evaluateFeatureAccessForUserInTransaction(
	trx: Transaction<TDatabase>,
	userId: string,
	locale: TLocale = DEFAULT_LOCALE
): Promise<Readonly<Record<TFeatureModuleKey, IEffectiveFeatureAccess>>> {
	const [definitions, groupGrants, overrides, policies] = await Promise.all([
		listFeatureModuleDefinitionsInTransaction(trx, locale),
		listFeatureAccessGroupModuleGrantsForUserInTransaction(trx, userId),
		listUserFeatureAccessOverridesInTransaction(trx, userId),
		listFeatureModulePolicyOverridesInTransaction(trx),
	]);
	return evaluateFeatureAccessMap({
		definitions,
		groupGrants: Object.fromEntries(groupGrants),
		isAuthenticated: true,
		moduleOverrides: overrides,
		policies,
	});
}

export async function evaluateFeatureAccessForUser(
	userId: string,
	locale: TLocale = DEFAULT_LOCALE
) {
	const db = await getAccountDatabase();
	return db
		.transaction()
		.execute((trx) =>
			evaluateFeatureAccessForUserInTransaction(trx, userId, locale)
		);
}

export async function resolveFeatureAccessForUser(
	userId: string,
	moduleKey: TFeatureModuleKey,
	locale: TLocale = DEFAULT_LOCALE
): Promise<IEffectiveFeatureAccess | null> {
	const access = await evaluateFeatureAccessForUser(userId, locale);
	return access[moduleKey] ?? null;
}
