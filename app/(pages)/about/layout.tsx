import { type Metadata } from 'next';

import { getPageTitle } from '@/utilities';

export const metadata: Metadata = { title: getPageTitle('/about') };

export { WithPreference as default } from '@/(pages)/layouts';
