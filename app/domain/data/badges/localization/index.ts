import type { TItemLocalizationLoader } from '@/domain/data/localization/types';

export const BADGE_LOCALIZATION_LOADERS = {
	en: async () => {
		const localizationModule = await import('./en');
		return localizationModule.BADGE_LOCALIZATION_EN;
	},
	ja: async () => {
		const localizationModule = await import('./ja');
		return localizationModule.BADGE_LOCALIZATION_JA;
	},
	ko: async () => {
		const localizationModule = await import('./ko');
		return localizationModule.BADGE_LOCALIZATION_KO;
	},
	'zh-TW': async () => {
		const localizationModule = await import('./zh-TW');
		return localizationModule.BADGE_LOCALIZATION_ZH_TW;
	},
} satisfies TItemLocalizationLoader;
