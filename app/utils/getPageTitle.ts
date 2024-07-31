import {siteConfig} from '@/configs';
import type {TSiteConfig} from '@/configs/site/types';

type ExtractNestedHref<T> = T extends {href: infer U} ? U : {[K in keyof T]: ExtractNestedHref<T[K]>}[keyof T];
type THref = ExtractNestedHref<TSiteConfig['navItems'][number]>;

const pageTitleCache = new Map<THref, string>();

function getPageTitle(target: THref) {
	if (pageTitleCache.has(target)) {
		return pageTitleCache.get(target);
	}

	const pageTitle = siteConfig.navMenuItems
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
