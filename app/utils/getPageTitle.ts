import {type TSitePath, siteConfig} from '@/configs';

const pageTitleCache = new Map<TSitePath, string>();

export function getPageTitle(target: TSitePath) {
	if (pageTitleCache.has(target)) {
		return pageTitleCache.get(target);
	}

	const pageTitle = siteConfig.navMenuItems.find(({href}) => href === target)?.label ?? '';

	pageTitleCache.set(target, pageTitle);

	return pageTitle;
}
