import {siteConfig} from '@/configs';
import type {SiteConfig} from '@/configs/site/types';

type ValidHref = SiteConfig['navItems'][number]['href'];

function getPageTitle(target: ValidHref) {
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
