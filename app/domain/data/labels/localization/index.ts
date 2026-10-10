import type { TCollaborationLocalizationLoader } from '@/domain/data/localization/types';

export const COLLABORATION_LOCALIZATION_LOADERS = {
	en: async () => {
		const localizationModule = await import('./en');
		return localizationModule.COLLABORATION_LOCALIZATION_EN;
	},
	ja: async () => {
		const localizationModule = await import('./ja');
		return localizationModule.COLLABORATION_LOCALIZATION_JA;
	},
	ko: async () => {
		const localizationModule = await import('./ko');
		return localizationModule.COLLABORATION_LOCALIZATION_KO;
	},
	'zh-TW': async () => {
		const localizationModule = await import('./zh-TW');
		return localizationModule.COLLABORATION_LOCALIZATION_ZH_TW;
	},
} satisfies TCollaborationLocalizationLoader;
