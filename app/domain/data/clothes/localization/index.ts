import type { TItemLocalizationLoader } from '@/domain/data/localization/types';

export const CLOTHES_LOCALIZATION_LOADERS = {
	en: async () => {
		const localizationModule = await import('./en');
		return localizationModule.CLOTHES_LOCALIZATION_EN;
	},
	ja: async () => {
		const localizationModule = await import('./ja');
		return localizationModule.CLOTHES_LOCALIZATION_JA;
	},
	ko: async () => {
		const localizationModule = await import('./ko');
		return localizationModule.CLOTHES_LOCALIZATION_KO;
	},
	'zh-TW': async () => {
		const localizationModule = await import('./zh-TW');
		return localizationModule.CLOTHES_LOCALIZATION_ZH_TW;
	},
} satisfies TItemLocalizationLoader;
