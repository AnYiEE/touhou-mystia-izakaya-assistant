import {type Metadata} from 'next';

import {getPageTitle} from '@/utils';

export const metadata: Metadata = {
	title: getPageTitle('/customer-normal'),
};

export {default} from '@/(pages)/customer-rare/layout';
