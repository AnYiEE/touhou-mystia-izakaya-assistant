'use client';

import { useCallback } from 'react';

import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { getMerchantLabel } from '@/domain/places/localizedLabels';
import { getPointLabel } from '@/domain/places/localizedPointLabels';

import { useCatalogLocalizationRevision } from '@/features/catalog/shared/client/localization/catalogLocalizationRevision';
import { mapsMessages } from '@/features/maps/client/messages';
import type {
	IDayMapCharacterEntity,
	TDayMapEntity,
} from '@/features/maps/client/model/dayMapEntities';
import {
	checkDayMapLabel,
	getDayMapLabel,
} from '@/features/maps/client/model/dayMapLabels';

import { useI18n } from '@/shared/i18n/useI18n';

const specialGuestCatalog = SpecialGuestCatalog.getInstance();

export function getTransitionTargetName(target: string, fallback: string) {
	return checkDayMapLabel(target) ? getDayMapLabel(target) : fallback;
}

export function getCharacterName({ character }: IDayMapCharacterEntity) {
	if (character.specialGuest !== null) {
		return specialGuestCatalog.getDisplayPropsById(
			character.specialGuest,
			'name'
		);
	}
	if (character.kind === 'merchant' && character.merchant !== null) {
		return getMerchantLabel(character.merchant);
	}

	return character.name;
}

/** @description Localized display name of a map entity. */
export function useDayMapEntityName() {
	const revision = useCatalogLocalizationRevision();
	const { t } = useI18n(mapsMessages);

	return useCallback(
		(entity: TDayMapEntity) => {
			void revision;
			switch (entity.layer) {
				case 'collectable':
					return getPointLabel(entity.displayLabel);
				case 'fishing':
					return t('maps.kind.fishing');
				case 'teleport':
					return t('maps.kind.teleport');
				case 'transition':
					return getTransitionTargetName(
						entity.transition.target,
						entity.transition.targetName
					);
				default:
					return getCharacterName(entity);
			}
		},
		[revision, t]
	);
}
