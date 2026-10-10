import type { TGuestLocalizationLoader } from '@/domain/data/localization/types';

export const NORMAL_GUEST_LOCALIZATION_LOADERS = {
	en: async () => {
		const localizationModule = await import('./en');
		return localizationModule.NORMAL_GUEST_LOCALIZATION_EN;
	},
	ja: async () => {
		const localizationModule = await import('./ja');
		return localizationModule.NORMAL_GUEST_LOCALIZATION_JA;
	},
	ko: async () => {
		const localizationModule = await import('./ko');
		return localizationModule.NORMAL_GUEST_LOCALIZATION_KO;
	},
	'zh-TW': async () => {
		const localizationModule = await import('./zh-TW');
		return localizationModule.NORMAL_GUEST_LOCALIZATION_ZH_TW;
	},
} satisfies TGuestLocalizationLoader;
