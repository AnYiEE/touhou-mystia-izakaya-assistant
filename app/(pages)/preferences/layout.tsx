import {type Metadata} from 'next';

import {getPageTitle} from '@/utils';

export const metadata: Metadata = {
	title: getPageTitle('/preferences'),

	robots: {
		index: false,
	},
};

export {default} from '@/(pages)/layouts';
