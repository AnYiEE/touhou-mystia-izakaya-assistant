import type { TPlaceLocalizationLoader } from '@/domain/data/localization/types';

export const PLACE_LOCALIZATION_LOADERS = {
	en: async () => {
		const localizationModule = await import('./en');
		return localizationModule.PLACE_LOCALIZATION_EN;
	},
	ja: async () => {
		const localizationModule = await import('./ja');
		return localizationModule.PLACE_LOCALIZATION_JA;
	},
	ko: async () => {
		const localizationModule = await import('./ko');
		return localizationModule.PLACE_LOCALIZATION_KO;
	},
	'zh-TW': async () => {
		const localizationModule = await import('./zh-TW');
		return localizationModule.PLACE_LOCALIZATION_ZH_TW;
	},
} satisfies TPlaceLocalizationLoader;
