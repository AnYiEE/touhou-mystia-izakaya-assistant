import type { TItemLocalizationLoader } from '@/domain/data/localization/types';

export const COOKER_LOCALIZATION_LOADERS = {
	en: async () => {
		const localizationModule = await import('./en');
		return localizationModule.COOKER_LOCALIZATION_EN;
	},
	ja: async () => {
		const localizationModule = await import('./ja');
		return localizationModule.COOKER_LOCALIZATION_JA;
	},
	ko: async () => {
		const localizationModule = await import('./ko');
		return localizationModule.COOKER_LOCALIZATION_KO;
	},
	'zh-TW': async () => {
		const localizationModule = await import('./zh-TW');
		return localizationModule.COOKER_LOCALIZATION_ZH_TW;
	},
} satisfies TItemLocalizationLoader;
