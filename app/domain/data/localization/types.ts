import type { TSpecialGuestEvaluationKey } from '@/domain/data/guests/special/schema';

import { type TLocale } from '@/shared/i18n/locale';

export type TLocalizedText = string | null;

export interface ILocalizedItemText {
	description: TLocalizedText;
	name: TLocalizedText;
}

export interface ILocalizedEffectText extends ILocalizedItemText {
	effect?: TLocalizedEffect;
}

export interface ILocalizedEffectsText extends ILocalizedItemText {
	effects?: ReadonlyArray<TLocalizedText>;
}

export type TLocalizedEffect =
	TLocalizedText | readonly [TLocalizedText, boolean];

export interface ILocalizedGuestText extends ILocalizedItemText {
	chat: ReadonlyArray<TLocalizedText>;
}

export interface ILocalizedSpellCardText {
	description: TLocalizedText;
	name: TLocalizedText;
}

export interface ILocalizedSpecialGuestText {
	chat: ReadonlyArray<TLocalizedText>;
	description: readonly [TLocalizedText, TLocalizedText, TLocalizedText];
	evaluation: Record<TSpecialGuestEvaluationKey, TLocalizedText>;
	name: TLocalizedText;
	spellCards: {
		negative?: ReadonlyArray<ILocalizedSpellCardText>;
		positive?: ReadonlyArray<ILocalizedSpellCardText>;
	};
}

export interface ILocalizedRecordText extends ILocalizedItemText {
	trackName: TLocalizedText;
}

export interface ILocalizedTagLabels {
	beverageTags: Readonly<Partial<Record<number, TLocalizedText>>>;
	foodTags: Readonly<Partial<Record<number, TLocalizedText>>>;
}

export interface IPlaceLocalization {
	labels: Readonly<Partial<Record<string, TLocalizedText>>>;
	merchants: Readonly<Partial<Record<string, TLocalizedText>>>;
}

export interface ICollaborationLocalization {
	labels: Readonly<Partial<Record<string, TLocalizedText>>>;
}

export interface IDayMapLocalization {
	/** @description Keyed by `IDayMapCharacter['id']`. */
	characters: Readonly<Partial<Record<string, TLocalizedText>>>;
	/** @description Extra day-map places and exit targets without a place label. */
	places: Readonly<Partial<Record<string, TLocalizedText>>>;
}

export type TItemLocalizationLoader = Partial<
	Record<
		TLocale,
		() => Promise<Readonly<Partial<Record<number, ILocalizedItemText>>>>
	>
>;

export type TEffectItemLocalizationLoader = Partial<
	Record<
		TLocale,
		() => Promise<Readonly<Partial<Record<number, ILocalizedEffectText>>>>
	>
>;

export type TEffectsItemLocalizationLoader = Partial<
	Record<
		TLocale,
		() => Promise<Readonly<Partial<Record<number, ILocalizedEffectsText>>>>
	>
>;

export type TGuestLocalizationLoader = Partial<
	Record<
		TLocale,
		() => Promise<Readonly<Partial<Record<number, ILocalizedGuestText>>>>
	>
>;

export type TSpecialGuestLocalizationLoader = Partial<
	Record<
		TLocale,
		() => Promise<
			Readonly<Partial<Record<number, ILocalizedSpecialGuestText>>>
		>
	>
>;

export type TRecordLocalizationLoader = Partial<
	Record<
		TLocale,
		() => Promise<Readonly<Partial<Record<number, ILocalizedRecordText>>>>
	>
>;

export type TTagLocalizationLoader = Partial<
	Record<TLocale, () => Promise<ILocalizedTagLabels>>
>;

export type TPlaceLocalizationLoader = Partial<
	Record<TLocale, () => Promise<IPlaceLocalization>>
>;

export type TCollaborationLocalizationLoader = Partial<
	Record<TLocale, () => Promise<ICollaborationLocalization>>
>;

export type TDayMapLocalizationLoader = Partial<
	Record<TLocale, () => Promise<IDayMapLocalization>>
>;
