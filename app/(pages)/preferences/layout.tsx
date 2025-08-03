import { type Metadata } from 'next';

import { getPageTitle } from '@/utilities';

export const metadata: Metadata = {
	title: getPageTitle('/preferences'),

	robots: { index: false },
};

export { default } from '@/(pages)/layouts';
