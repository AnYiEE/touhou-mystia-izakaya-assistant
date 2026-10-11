import type { TRecordLocalizationLoader } from '@/domain/data/localization/types';

export const RECORD_LOCALIZATION_LOADERS = {
	en: async () => {
		const localizationModule = await import('./en');
		return localizationModule.RECORD_LOCALIZATION_EN;
	},
	ja: async () => {
		const localizationModule = await import('./ja');
		return localizationModule.RECORD_LOCALIZATION_JA;
	},
	ko: async () => {
		const localizationModule = await import('./ko');
		return localizationModule.RECORD_LOCALIZATION_KO;
	},
	'zh-TW': async () => {
		const localizationModule = await import('./zh-TW');
		return localizationModule.RECORD_LOCALIZATION_ZH_TW;
	},
} satisfies TRecordLocalizationLoader;
