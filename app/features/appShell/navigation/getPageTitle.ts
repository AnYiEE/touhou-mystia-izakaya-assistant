import { NAV_MENU_ITEMS, type TSitePath } from './config';

export function getPageTitle(target: TSitePath) {
	const pageTitle = NAV_MENU_ITEMS.find(({ href }) => href === target)?.label;

	if (pageTitle === undefined) {
		throw new Error(
			`[features/appShell/navigation/getPageTitle]: page title not found for target page: ${target}`
		);
	}

	return pageTitle;
}
