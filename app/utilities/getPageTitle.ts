import {type TSitePath, siteConfig} from '@/configs';
import {memoize} from '@/utilities/memoize';

const {navMenuItems} = siteConfig;

export const getPageTitle = memoize(function getPageTitle(target: TSitePath) {
	const pageTitle = navMenuItems.find(({href}) => href === target)?.label;

	if (pageTitle === undefined) {
		throw new Error(`[utilities/getPageTitle]: page title not found for target page: ${target}`);
	}

	return pageTitle;
});
