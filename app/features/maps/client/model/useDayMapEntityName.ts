'use client';

import { useCallback } from 'react';

import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { PartnerCatalog } from '@/domain/catalog/items/PartnerCatalog';
import { PRAYER_LABEL_MAP } from '@/domain/data/labels/prayerFacts';
import {
	getDayMapCharacterName,
	getDayMapPlaceName,
} from '@/domain/maps/localizedLabels';
import { getMerchantLabel } from '@/domain/places/localizedLabels';
import { getPointLabel } from '@/domain/places/localizedPointLabels';

import { useCatalogLocalizationRevision } from '@/features/catalog/shared/client/localization/catalogLocalizationRevision';
import { mapsMessages } from '@/features/maps/client/messages';

import { useI18n } from '@/shared/i18n/useI18n';

import {
	type IDayMapCharacterEntity,
	type TDayMapEntity,
} from './dayMapEntities';
import {
	DAY_MAP_INTERACTION_LABELS,
	getTaskInteractionLabel,
} from './dayMapInteractionLabels';
import { checkDayMapLabel, getDayMapLabel } from './dayMapLabels';

const specialGuestCatalog = SpecialGuestCatalog.getInstance();
const partnerCatalog = PartnerCatalog.getInstance();

export function getTransitionTargetName(target: string, fallback: string) {
	return checkDayMapLabel(target)
		? getDayMapLabel(target)
		: getDayMapPlaceName(target, fallback);
}

export function getCharacterName({ character }: IDayMapCharacterEntity) {
	if (character.specialGuest !== null) {
		return specialGuestCatalog.getDisplayPropsById(
			character.specialGuest,
			'name'
		);
	}
	if (character.partner !== undefined) {
		return partnerCatalog.getDisplayPropsById(character.partner, 'name');
	}
	if (
		character.kind === 'merchant' &&
		typeof character.merchant === 'string'
	) {
		return getMerchantLabel(character.merchant);
	}

	return getDayMapCharacterName(character);
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
				case 'facility':
					return t('maps.facility.collaborationTerminal');
				case 'fishing':
					return t('maps.kind.fishing');
				case 'interaction':
					return getPointLabel(
						DAY_MAP_INTERACTION_LABELS[entity.interaction.kind]
					);
				case 'prayer':
					return getPointLabel(PRAYER_LABEL_MAP[entity.prayer.label]);
				case 'task':
					return getPointLabel(
						getTaskInteractionLabel(entity.task.key)
					);
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
