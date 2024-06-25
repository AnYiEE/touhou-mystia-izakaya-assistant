import {siteConfig} from '@/configs';
import type {TSiteConfig} from '@/configs/site/types';

type THref = TSiteConfig['navItems'][number]['href'];

function getPageTitle(target: THref) {
	return siteConfig.navItems
		.map(({label, href}) => {
			if (href === target) {
				return label;
			}
			return '';
		})
		.join('');
}

export {getPageTitle};
