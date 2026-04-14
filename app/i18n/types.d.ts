export type TLocale = 'zh-hans' | 'zh-hant' | 'en' | 'ja' | 'ko';

export type TLocaleConfig = {
	/** BCP 47 language tag for `<html lang>` */
	bcp47: string;
	/** Display name in that language */
	label: string;
};

/**
 * Translation table for UI strings.
 * Keys are zh-hans original text, values are translations.
 * Missing keys fall back to the zh-hans key itself.
 */
export type TUITranslationTable = Partial<Record<string, string>>;

/**
 * Translation table for game data (entity names, descriptions, tags, etc.).
 * Keys are zh-hans original text, values are translations.
 */
export type TDataTranslationTable = Partial<Record<string, string>>;
