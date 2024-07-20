import {siteConfig} from '@/configs';
import type {TSiteConfig} from '@/configs/site/types';

type THref = TSiteConfig['navItems'][number]['href'];

const pageTitleCache = new Map<THref, string>();

function getPageTitle(target: THref) {
	if (pageTitleCache.has(target)) {
		return pageTitleCache.get(target);
	}

	const pageTitle = siteConfig.navItems
		.map(({label, href}) => {
			if (href === target) {
				return label;
			}
			return '';
		})
		.join('');

	pageTitleCache.set(target, pageTitle);

	return pageTitle;
}

export {getPageTitle};
