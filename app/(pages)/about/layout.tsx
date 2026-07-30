import { type Metadata } from 'next';

import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';

export const metadata: Metadata = { title: getPageTitle('/about') };

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
