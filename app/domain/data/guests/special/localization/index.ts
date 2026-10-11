import type { TSpecialGuestLocalizationLoader } from '@/domain/data/localization/types';

export const SPECIAL_GUEST_LOCALIZATION_LOADERS = {
	en: async () => {
		const localizationModule = await import('./en');
		return localizationModule.SPECIAL_GUEST_LOCALIZATION_EN;
	},
	ja: async () => {
		const localizationModule = await import('./ja');
		return localizationModule.SPECIAL_GUEST_LOCALIZATION_JA;
	},
	ko: async () => {
		const localizationModule = await import('./ko');
		return localizationModule.SPECIAL_GUEST_LOCALIZATION_KO;
	},
	'zh-TW': async () => {
		const localizationModule = await import('./zh-TW');
		return localizationModule.SPECIAL_GUEST_LOCALIZATION_ZH_TW;
	},
} satisfies TSpecialGuestLocalizationLoader;
