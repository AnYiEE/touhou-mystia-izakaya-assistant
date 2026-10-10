'use client';

import isNil from 'lodash/isNil.js';
import { useCallback, useMemo } from 'react';

import {
	PALETTE_MESSAGE_KEYS,
	type TThemeMessageKey,
	themeMessages,
} from '@/design/theme/messages';

import { type TSyncNamespace } from '@/domain/account/contracts';
import { getDlcLabel } from '@/domain/availability/localizedLabels';
import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import { type TDlc } from '@/domain/data/shared/types';
import { RECOMMENDATION_SORT_PROFILE_LABEL_MAP } from '@/domain/recommendations/labels';
import { getRecommendationSortProfileLabel } from '@/domain/recommendations/localizedLabels';
import { type TRecommendationSortProfile } from '@/domain/recommendations/sortProfiles';

import {
	type TAccountMessageKey,
	accountMessages,
} from '@/features/account/client/messages';

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
	const { t: tTheme } = useI18n(themeMessages);

	const formatValue = useCallback(
		(value: unknown, path?: string): string => {
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
				return String(value);
			}
			if (typeof value === 'string') {
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
				return t('account.conflict.value.notSet');
			}
			if (Array.isArray(value)) {
				if (value.length === 0) {
					return t('account.conflict.value.none');
				}

				const preview: string = value
					.slice(0, 3)
					.map((item) => {
						if (
							path === 'hiddenItems.dlcs' &&
							typeof item === 'string'
						) {
							const dlc = Number(item) as TDlc;
							if (Object.hasOwn(DLC_LABEL_MAP, dlc)) {
								return getDlcLabel(dlc);
							}
						}

						return formatValue(item);
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
		[t, tTheme]
	);

	const getDifferences = useCallback(
		(
			cloud: unknown,
			local: unknown,
			merged: unknown
		): IConflictPresentedDifferences => {
			const result = getConflictDifferences(cloud, local, merged);

			return {
				hasMore: result.hasMore,
				items: result.items.map((item) => ({
					cloud: item.cloud,
					label:
						item.labelKey === null
							? item.labelFallback === ''
								? t('account.conflict.field.other')
								: item.labelFallback
							: t(item.labelKey),
					local: item.local,
					merged: item.merged,
					path: item.path,
				})),
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
