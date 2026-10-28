import { type Transaction } from 'kysely';

import {
	type IEffectiveFeatureAccess,
	type IFeatureAccessReasonState,
	type IFeatureAccessResponse,
	type TFeatureModuleKey,
} from '@/domain/featureAccess/contracts';

import { getAccountDatabase } from '@/features/account/server/persistence/database';

import type { TDatabase } from '@/infrastructure/database/schema';

import { DEFAULT_LOCALE, type TLocale } from '@/shared/i18n/locale';

import {
	evaluateFeatureAccessForAnonymousInTransaction,
	evaluateFeatureAccessForUserInTransaction,
} from './accessService';

export function presentFeatureAccess(
	access: Readonly<Record<TFeatureModuleKey, IEffectiveFeatureAccess>>
): IFeatureAccessResponse {
	return {
		modules: Object.fromEntries(
			Object.entries(access).map(([moduleKey, state]) => [
				moduleKey,
				{
					access_level: state.policy,
					allowed: state.allowed,
					reason: state.reason,
				},
			])
		) as Record<TFeatureModuleKey, IFeatureAccessReasonState>,
	};
}

export async function presentAnonymousFeatureAccessInTransaction(
	trx: Transaction<TDatabase>,
	locale: TLocale = DEFAULT_LOCALE
) {
	return presentFeatureAccess(
		await evaluateFeatureAccessForAnonymousInTransaction(trx, locale)
	);
}

export async function presentUserFeatureAccessInTransaction(
	trx: Transaction<TDatabase>,
	userId: string,
	locale: TLocale = DEFAULT_LOCALE
) {
	return presentFeatureAccess(
		await evaluateFeatureAccessForUserInTransaction(trx, userId, locale)
	);
}

export async function presentAnonymousFeatureAccess(
	locale: TLocale = DEFAULT_LOCALE
) {
	const db = await getAccountDatabase();
	return db
		.transaction()
		.execute((trx) =>
			presentAnonymousFeatureAccessInTransaction(trx, locale)
		);
}

export async function presentUserFeatureAccess(
	userId: string,
	locale: TLocale = DEFAULT_LOCALE
) {
	const db = await getAccountDatabase();
	return db
		.transaction()
		.execute((trx) =>
			presentUserFeatureAccessInTransaction(trx, userId, locale)
		);
}
