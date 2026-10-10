import { DEFAULT_LOCALE, type TLocale } from './locale';

export type TMessageParams = Readonly<Record<string, number | string>>;
export type TLocalizedMessageTable<TKey extends string = string> = Readonly<
	Record<TLocale, Readonly<Partial<Record<TKey, string>>>>
>;

const PLACEHOLDER_PATTERN = /\{([a-zA-Z0-9_]+)\}/gu;

const isProduction = process.env.NODE_ENV === 'production';

export function formatMessage(template: string, params: TMessageParams) {
	return template.replaceAll(PLACEHOLDER_PATTERN, (match, name: string) => {
		const value = params[name];
		return value === undefined ? match : String(value);
	});
}

function warnMessage(key: string, reason: string, details?: TMessageParams) {
	if (isProduction) {
		return;
	}

	console.warn(`[i18n] ${reason}: ${key}`, details ?? '');
}

function checkMessagePlaceholders(
	key: string,
	template: string,
	params: TMessageParams
) {
	const templateNames = new Set(
		[...template.matchAll(PLACEHOLDER_PATTERN)].map(
			([, name]) => name as string
		)
	);
	const paramNames = new Set(Object.keys(params));

	for (const name of templateNames) {
		if (!paramNames.has(name)) {
			warnMessage(key, 'missing interpolation parameter', {
				parameter: name,
			});
		}
	}
	for (const name of paramNames) {
		if (!templateNames.has(name)) {
			warnMessage(key, 'unused interpolation parameter', {
				parameter: name,
			});
		}
	}
}

/**
 * @description Resolves one message from a feature-owned catalog. Missing keys
 * fall back to the default locale (zh-CN); in development a warning points at
 * the key, and interpolation placeholders are checked against the parameters.
 */
export function translate<TKey extends string>(
	messages: TLocalizedMessageTable<TKey>,
	locale: TLocale,
	key: TKey,
	params?: TMessageParams
) {
	const template = messages[locale][key] ?? messages[DEFAULT_LOCALE][key];
	if (template === undefined) {
		warnMessage(key, 'missing message');
		return key;
	}

	if (params === undefined) {
		return template;
	}

	if (!isProduction) {
		checkMessagePlaceholders(key, template, params);
	}

	return formatMessage(template, params);
}
