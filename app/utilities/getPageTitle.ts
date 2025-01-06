import {type TSitePath, siteConfig} from '@/configs';

const pageTitleCache = new Map<TSitePath, string>();

export function getPageTitle(target: TSitePath) {
	if (pageTitleCache.has(target)) {
		return pageTitleCache.get(target);
	}

	const pageTitle = siteConfig.navMenuItems.find(({href}) => href === target)?.label;
	if (pageTitle === undefined) {
		throw new Error(`[utilities/getPageTitle]: page title not found for target page: ${target}`);
	}

	pageTitleCache.set(target, pageTitle);

	return pageTitle;
}
