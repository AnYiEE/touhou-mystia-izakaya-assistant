'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { openAccountModal } from '@/features/account/client/overlayCommands';
import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import { selectCatalogCustomer } from '@/features/catalog/globalSearch/client/navigationCommands';
import {
	closeCustomerPlansDrawer,
	openCustomerPlansDrawer,
} from '@/features/customerPlans/client/drawerCommands';
import type {
	IGlobalSearchFilterAction,
	IGlobalSearchIndexItem,
	IGlobalSearchMatchedField,
} from '@/features/globalSearch/contracts';
import {
	GLOBAL_SEARCH_SECTION_PATH_MAP,
	getGlobalSearchSectionPath,
} from '@/features/globalSearch/core/constants';
import {
	createShareableItemUrl,
	openItemInNewTab,
	shareItem,
} from '@/features/itemSharing/client/shareCommands';
import { handoffOverlay } from '@/features/overlays/client';
import { openPreferenceTarget } from '@/features/preferences/client/globalSearch/openPreferenceTarget';

import { closeGlobalSearch, setGlobalSearchTransientTarget } from './commands';
import { setCustomerRareTutorialAllowedPathname } from './customerRareTutorialHandoff';

const CUSTOMER_INFO_FIELD_TYPES = new Set<
	IGlobalSearchMatchedField['field']['fieldType']
>([
	'description',
	'chat',
	'evaluation',
	'positive-spell-card',
	'negative-spell-card',
	'reward',
]);

function checkShouldOpenCustomerInfo(
	item: IGlobalSearchIndexItem,
	match: IGlobalSearchMatchedField | undefined
) {
	return (
		(item.section === 'customer-normal' ||
			item.section === 'customer-rare') &&
		match !== undefined &&
		CUSTOMER_INFO_FIELD_TYPES.has(match.field.fieldType)
	);
}

export function getGlobalSearchItemNavigationHref(
	item: IGlobalSearchIndexItem,
	match?: IGlobalSearchMatchedField
) {
	return checkShouldOpenCustomerInfo(item, match)
		? `${item.href}?info`
		: item.href;
}

export function getGlobalSearchItemShareUrl(item: IGlobalSearchIndexItem) {
	if (typeof location === 'undefined') {
		return item.href;
	}

	if (item.section === 'preferences') {
		return `${location.origin}/preferences`;
	}
	if (
		item.section === 'customer-normal' ||
		item.section === 'customer-rare'
	) {
		return `${location.origin}${item.href}`;
	}

	return createShareableItemUrl({
		name: item.name,
		pathname: getGlobalSearchSectionPath(item.section),
	});
}

function getGlobalSearchItemNavigationUrl(
	item: IGlobalSearchIndexItem,
	match?: IGlobalSearchMatchedField
) {
	if (
		item.section === 'customer-normal' ||
		item.section === 'customer-rare'
	) {
		const href = getGlobalSearchItemNavigationHref(item, match);
		return typeof location === 'undefined'
			? href
			: `${location.origin}${href}`;
	}

	return getGlobalSearchItemShareUrl(item);
}

export function useGlobalSearchNavigationActions() {
	const { pathname } = usePathname();
	const router = useRouter();

	const openItem = useCallback(
		(item: IGlobalSearchIndexItem, match?: IGlobalSearchMatchedField) => {
			if (item.section === 'preferences') {
				const action = item.navigationAction;
				if (action?.type === 'open-account') {
					handoffOverlay({
						fromId: 'global.search',
						onCloseSource: closeGlobalSearch,
						onOpenTarget: openAccountModal,
						toId: 'account.main',
					});
					return;
				}
				if (action?.type === 'open-customer-plans') {
					const sourcePathname = globalThis.location.pathname;
					handoffOverlay({
						fromId: 'global.search',
						isValid: () =>
							globalThis.location.pathname === sourcePathname,
						onCloseSource: closeGlobalSearch,
						onOpenTarget: () => {
							if (
								pathname !==
								GLOBAL_SEARCH_SECTION_PATH_MAP['customer-rare']
							) {
								router.push(
									GLOBAL_SEARCH_SECTION_PATH_MAP[
										'customer-rare'
									]
								);
							}
							openCustomerPlansDrawer();
						},
						toId: 'customer-rare.plan-drawer',
					});
					return;
				}
				if (action?.type === 'open-preference') {
					handoffOverlay({
						fromId: 'global.search',
						onCloseSource: closeGlobalSearch,
						onOpenTarget: () => {
							openPreferenceTarget(action.targetId);
						},
						toId: 'preferences',
					});
				}
				return;
			}

			closeGlobalSearch();
			if (
				item.section === 'customer-normal' ||
				item.section === 'customer-rare'
			) {
				selectCatalogCustomer(item.section, item.name);
				if (item.section === 'customer-rare') {
					closeCustomerPlansDrawer();
					setCustomerRareTutorialAllowedPathname(item.href);
				}
				router.push(getGlobalSearchItemNavigationHref(item, match));
				return;
			}

			setGlobalSearchTransientTarget({
				name: item.name,
				section: item.section,
			});
			const targetPathname = getGlobalSearchSectionPath(item.section);
			if (pathname !== targetPathname) {
				router.push(targetPathname, { scroll: false });
			}
		},
		[pathname, router]
	);

	const applyFilter = useCallback(
		(filterAction: IGlobalSearchFilterAction) => {
			filterAction.run();
			const targetPathname =
				GLOBAL_SEARCH_SECTION_PATH_MAP[filterAction.targetSection];
			if (pathname !== targetPathname) {
				router.push(targetPathname, { scroll: false });
			}
			closeGlobalSearch();
		},
		[pathname, router]
	);

	const shareSearchItem = useCallback((item: IGlobalSearchIndexItem) => {
		shareItem(item.name, getGlobalSearchItemShareUrl(item));
	}, []);

	const openSearchItemInNewTab = useCallback(
		(item: IGlobalSearchIndexItem, match?: IGlobalSearchMatchedField) => {
			openItemInNewTab(getGlobalSearchItemNavigationUrl(item, match));
		},
		[]
	);

	return {
		applyFilter,
		openItem,
		openSearchItemInNewTab,
		shareSearchItem,
	} as const;
}
