import { type Metadata } from 'next';

import { SITE_METADATA } from '@/shared/site/metadata';

const { enName, name } = SITE_METADATA;

/**
 * @description The administration area stays Simplified Chinese; this pins
 * the title template so localized root metadata does not leak into it.
 */
export const metadata: Metadata = {
	title: {
		default: `${name} - ${enName}`,
		template: `%s | ${name} - ${enName}`,
	},
};

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
