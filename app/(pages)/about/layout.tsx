import {type Metadata} from 'next';

import {getPageTitle} from '@/utils';

export const metadata: Metadata = {
	title: getPageTitle('/about'),
};

export {default} from '@/(pages)/layouts';
