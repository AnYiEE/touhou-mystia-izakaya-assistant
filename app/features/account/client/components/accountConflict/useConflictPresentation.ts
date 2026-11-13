'use client';

import isNil from 'lodash/isNil.js';
import { useCallback, useMemo } from 'react';

import {
	PALETTE_MESSAGE_KEYS,
	type TThemeMessageKey,
	themeMessages,
} from '@/design/theme/messages';

import {
	SYNC_NAMESPACE_MAP,
	type TSyncNamespace,
} from '@/domain/account/contracts';
import { getDlcLabel } from '@/domain/availability/localizedLabels';
import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { NormalGuestCatalog } from '@/domain/catalog/guests/NormalGuestCatalog';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import type { TRecipeId } from '@/domain/data/foods/types';
import type { TDlc } from '@/domain/data/shared/types';
import type { TFoodTagId } from '@/domain/data/tags/types';
import { RECOMMENDATION_SORT_PROFILE_LABEL_MAP } from '@/domain/recommendations/labels';
import { getRecommendationSortProfileLabel } from '@/domain/recommendations/localizedLabels';
import { type TRecommendationSortProfile } from '@/domain/recommendations/sortProfiles';

import {
	type TAccountMessageKey,
	accountMessages,
} from '@/features/account/client/messages';
import { getFoodTagLabel } from '@/features/catalog/shared/client/localization/tagLabels';
import { getLocaleMenuLabel } from '@/features/preferences/client/localeMenuItems';
import { preferencesMessages } from '@/features/preferences/client/messages';

import {
	SYSTEM_LOCALE_PREFERENCE,
	parseLocalePreference,
} from '@/shared/i18n/locale';
import { useI18n } from '@/shared/i18n/useI18n';
import { checkIsRecord } from '@/shared/utilities/objects/checkIsRecord';

import {
	CONFLICT_BOOLEAN_VALUE_LABEL_KEYS,
	CONFLICT_VALUE_LABEL_KEYS,
	SYNC_NAMESPACE_LABEL_KEYS,
	getConflictDifferences,
} from './presentation';

const CONFLICT_THEME_VALUE_LABEL_KEYS: Record<string, TThemeMessageKey> = {
	black: PALETTE_MESSAGE_KEYS.black,
	dark: 'theme.short.dark',
	green: PALETTE_MESSAGE_KEYS.green,
	izakaya: PALETTE_MESSAGE_KEYS.izakaya,
	light: 'theme.short.light',
	pink: PALETTE_MESSAGE_KEYS.pink,
	system: 'theme.short.system',
	white: PALETTE_MESSAGE_KEYS.white,
};

/**
 * @description Persisted collision evidence keeps its canonical identifier
 * (the Simplified Chinese label written when the evidence is created); only
 * the rendered text follows the active locale, and unknown labels pass
 * through unchanged.
 */
const COLLISION_SOURCE_LABEL_KEYS: Record<string, TAccountMessageKey> = {
	兼容队列版本: 'account.sync.collision.canonicalQueue',
	新客户端保留版本: 'account.sync.collision.nextClient',
	旧标签页版本: 'account.sync.collision.legacyQueue',
	转换前保留版本: 'account.sync.collision.preMigration',
};
const IGNORED_CONFLICT_DIFFERENCE_PATHS: Partial<
	Record<TSyncNamespace, ReadonlyArray<string>>
> = {
	'customer_rare.plans': ['activeId'],
	'global.preferences': ['donationModal'],
};
const NUMERIC_PATH_PATTERN = /^-?\d+$/u;

function getMealGuestDisplayName(namespace: TSyncNamespace, path: string) {
	if (!NUMERIC_PATH_PATTERN.test(path)) {
		return null;
	}

	const guestId = Number(path);
	if (namespace === SYNC_NAMESPACE_MAP.normalGuestMeals) {
		const catalog = NormalGuestCatalog.getInstance();
		const guest = catalog.data.find(({ id }) => id === guestId);
		return guest === undefined
			? null
			: catalog.getDisplayPropsById(guest.id, 'name');
	}
	if (namespace === SYNC_NAMESPACE_MAP.specialGuestMeals) {
		const catalog = SpecialGuestCatalog.getInstance();
		const guest = catalog.data.find(({ id }) => id === guestId);
		return guest === undefined
			? null
			: catalog.getDisplayPropsById(guest.id, 'name');
	}

	return null;
}

function getHiddenCatalogItemDisplayName(path: string, value: unknown) {
	if (typeof value !== 'number') {
		return null;
	}

	switch (path) {
		case 'table.hiddenItems.beverages': {
			const catalog = BeverageCatalog.getInstance();
			const item = catalog.data.find(({ id }) => id === value);
			return item === undefined
				? null
				: catalog.getDisplayPropsById(item.id, 'name');
		}
		case 'table.hiddenItems.foods': {
			const catalog = FoodCatalog.getInstance();
			const item = catalog.data.find(({ id }) => id === value);
			return item === undefined
				? null
				: catalog.getDisplayPropsById(item.id, 'name');
		}
		case 'table.hiddenItems.ingredients': {
			const catalog = IngredientCatalog.getInstance();
			const item = catalog.data.find(({ id }) => id === value);
			return item === undefined
				? null
				: catalog.getDisplayPropsById(item.id, 'name');
		}
	}

	return null;
}

function getSavedMealDisplaySummary(value: unknown) {
	if (!checkIsRecord(value) || !checkIsRecord(value['food'])) {
		return null;
	}

	const { recipeId } = value['food'];
	if (typeof recipeId !== 'number') {
		return null;
	}

	let foodName: string;
	try {
		foodName = FoodCatalog.getInstance().getDisplayPropsById(
			FoodCatalog.getInstance().getRecipeOwnerById(recipeId as TRecipeId)
				.food.id,
			'name'
		);
	} catch {
		return null;
	}

	const names = [foodName];
	const { beverage } = value;
	if (typeof beverage === 'number') {
		const catalog = BeverageCatalog.getInstance();
		const item = catalog.data.find(({ id }) => id === beverage);
		if (item !== undefined) {
			names.push(catalog.getDisplayPropsById(item.id, 'name'));
		}
	}

	const { extraIngredients } = value['food'];
	if (Array.isArray(extraIngredients)) {
		const catalog = IngredientCatalog.getInstance();
		for (const ingredient of extraIngredients) {
			if (typeof ingredient !== 'number') {
				return null;
			}
			const item = catalog.data.find(({ id }) => id === ingredient);
			if (item === undefined) {
				return null;
			}
			names.push(catalog.getDisplayPropsById(item.id, 'name'));
		}
	}

	return names.join(' - ');
}

function getPlanDisplayName(value: unknown) {
	if (!checkIsRecord(value) || typeof value['name'] !== 'string') {
		return null;
	}

	const name = value['name'].trim();
	return name.length === 0 ? null : name;
}

function getListPreview(
	values: ReadonlyArray<unknown>,
	formatItem: (value: unknown) => string | null
) {
	const preview: string[] = [];
	for (const value of values) {
		const formatted = formatItem(value);
		if (formatted === null) {
			return null;
		}
		preview.push(formatted);
	}
	return preview;
}

export interface IConflictPresentedDifference {
	cloud: unknown;
	label: string;
	local: unknown;
	merged: unknown;
	path: string;
}

export interface IConflictPresentedDifferences {
	hasMore: boolean;
	items: IConflictPresentedDifference[];
}

export function useConflictPresentation() {
	const { t } = useI18n(accountMessages);
	const { t: tPreferences } = useI18n(preferencesMessages);
	const { t: tTheme } = useI18n(themeMessages);

	const formatValue = useCallback(
		(value: unknown, namespace: TSyncNamespace, path?: string): string => {
			if (typeof value === 'boolean') {
				const labels =
					path === undefined
						? undefined
						: CONFLICT_BOOLEAN_VALUE_LABEL_KEYS[path];
				if (labels !== undefined) {
					return t(labels[value ? 1 : 0]);
				}

				return t(
					value
						? 'account.conflict.boolean.on'
						: 'account.conflict.boolean.off'
				);
			}
			if (typeof value === 'number') {
				if (
					namespace === SYNC_NAMESPACE_MAP.globalPreferences &&
					path === 'popularTrend.tag'
				) {
					return getFoodTagLabel(value as TFoodTagId);
				}
				return String(value);
			}
			if (typeof value === 'string') {
				if (
					namespace === SYNC_NAMESPACE_MAP.globalPreferences &&
					path === 'locale'
				) {
					const preference = parseLocalePreference(value);
					if (preference === SYSTEM_LOCALE_PREFERENCE) {
						return tPreferences('preferences.locale.system');
					}
					if (preference !== null) {
						const localeLabel = getLocaleMenuLabel(preference);
						if (localeLabel !== null) {
							return localeLabel;
						}
					}
				}
				const themeLabelKey = CONFLICT_THEME_VALUE_LABEL_KEYS[value];
				if (themeLabelKey !== undefined) {
					return tTheme(themeLabelKey);
				}

				const valueLabelKey = CONFLICT_VALUE_LABEL_KEYS[value];
				if (valueLabelKey !== undefined) {
					return t(valueLabelKey);
				}
				if (
					Object.hasOwn(RECOMMENDATION_SORT_PROFILE_LABEL_MAP, value)
				) {
					return getRecommendationSortProfileLabel(
						value as TRecommendationSortProfile
					);
				}

				return value;
			}
			if (isNil(value)) {
				if (
					namespace === SYNC_NAMESPACE_MAP.globalPreferences &&
					path === 'suggestMeals.maxExtraIngredients'
				) {
					return tPreferences('preferences.recommendation.unlimited');
				}
				return t('account.conflict.value.notSet');
			}
			if (Array.isArray(value)) {
				if (value.length === 0) {
					return t('account.conflict.value.none');
				}
				if (
					path !== undefined &&
					NUMERIC_PATH_PATTERN.test(path) &&
					(namespace === SYNC_NAMESPACE_MAP.normalGuestMeals ||
						namespace === SYNC_NAMESPACE_MAP.specialGuestMeals)
				) {
					const mealPreviews = getListPreview(
						value,
						getSavedMealDisplaySummary
					);
					if (mealPreviews !== null) {
						const preview = mealPreviews
							.slice(0, 3)
							.join(t('account.conflict.listSeparator'));
						return mealPreviews.length > 3
							? t('account.conflict.value.previewMore', {
									count: mealPreviews.length,
									preview,
								})
							: preview;
					}
					return t('account.conflict.value.savedMealCount', {
						count: value.length,
					});
				}
				if (
					namespace === SYNC_NAMESPACE_MAP.specialGuestPlans &&
					path === 'items'
				) {
					const planPreviews = getListPreview(
						value,
						getPlanDisplayName
					);
					if (planPreviews !== null) {
						const preview = planPreviews
							.slice(0, 3)
							.join(t('account.conflict.listSeparator'));
						return planPreviews.length > 3
							? t('account.conflict.value.previewMore', {
									count: planPreviews.length,
									preview,
								})
							: preview;
					}
					return t('account.conflict.value.savedPlanCount', {
						count: value.length,
					});
				}

				const preview: string = value
					.slice(0, 3)
					.map((item) => {
						const hiddenItemLabel =
							path === undefined
								? null
								: getHiddenCatalogItemDisplayName(path, item);
						if (hiddenItemLabel !== null) {
							return hiddenItemLabel;
						}
						if (
							path === 'hiddenItems.dlcs' &&
							typeof item === 'string'
						) {
							const dlc = Number(item) as TDlc;
							if (Object.hasOwn(DLC_LABEL_MAP, dlc)) {
								return getDlcLabel(dlc);
							}
						}

						return formatValue(item, namespace);
					})
					.join(t('account.conflict.listSeparator'));

				return value.length > 3
					? t('account.conflict.value.previewMore', {
							count: value.length,
							preview,
						})
					: preview;
			}
			if (checkIsRecord(value)) {
				return t('account.conflict.value.recordCount', {
					count: Object.keys(value).length,
				});
			}

			return t('account.conflict.value.unavailable');
		},
		[t, tPreferences, tTheme]
	);

	const getDifferences = useCallback(
		(
			cloud: unknown,
			local: unknown,
			merged: unknown,
			namespace: TSyncNamespace
		): IConflictPresentedDifferences => {
			const result = getConflictDifferences(cloud, local, merged, {
				ignoredPaths:
					IGNORED_CONFLICT_DIFFERENCE_PATHS[namespace] ?? [],
			});

			return {
				hasMore: result.hasMore,
				items: result.items.map((item) => {
					const mealGuestLabel =
						item.labelKey === null
							? getMealGuestDisplayName(namespace, item.path)
							: null;
					return {
						cloud: item.cloud,
						label:
							mealGuestLabel ??
							(item.labelKey === null
								? item.labelFallback === ''
									? t('account.conflict.field.other')
									: item.labelFallback
								: t(item.labelKey)),
						local: item.local,
						merged: item.merged,
						path: item.path,
					};
				}),
			};
		},
		[t]
	);

	const getNamespaceLabel = useCallback(
		(namespace: TSyncNamespace) => t(SYNC_NAMESPACE_LABEL_KEYS[namespace]),
		[t]
	);

	const getCollisionSourceLabel = useCallback(
		(label: string) => {
			const labelKey = COLLISION_SOURCE_LABEL_KEYS[label];
			return labelKey === undefined ? label : t(labelKey);
		},
		[t]
	);

	return useMemo(
		() => ({
			formatValue,
			getCollisionSourceLabel,
			getDifferences,
			getNamespaceLabel,
		}),
		[
			formatValue,
			getCollisionSourceLabel,
			getDifferences,
			getNamespaceLabel,
		]
	);
}
