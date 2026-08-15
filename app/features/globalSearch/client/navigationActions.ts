'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { openAccountModal } from '@/features/account/client/overlayCommands';
import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import { selectCatalogGuest } from '@/features/catalog/globalSearch/client/navigationCommands';
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
	getGlobalSearchItemNavigationHref,
	getGlobalSearchItemNavigationUrl,
	getGlobalSearchItemShareUrl,
} from '@/features/globalSearch/itemNavigation';
import {
	openItemInNewTab,
	shareItem,
} from '@/features/itemSharing/client/shareCommands';
import { handoffOverlay } from '@/features/overlays/client';
import { openPreferenceTarget } from '@/features/preferences/client/globalSearch/openPreferenceTarget';
import {
	closeSpecialGuestPlansDrawer,
	openSpecialGuestPlansDrawer,
} from '@/features/specialGuestPlans/client/drawerCommands';

import { closeGlobalSearch, setGlobalSearchTransientTarget } from './commands';
import { setSpecialGuestTutorialAllowedPathname } from './specialGuestTutorialHandoff';

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
				}
				if (action?.type === 'open-preference') {
					handoffOverlay({
						fromId: 'global.search',
						onCloseSource: closeGlobalSearch,
						onOpenTarget: () => {
							openPreferenceTarget(action.targetKey);
						},
						toId: 'preferences',
					});
				}
				if (action?.type === 'open-special-guest-plans') {
					const sourcePathname = location.pathname;
					handoffOverlay({
						fromId: 'global.search',
						isValid: () => location.pathname === sourcePathname,
						onCloseSource: closeGlobalSearch,
						onOpenTarget: () => {
							if (
								pathname !==
								GLOBAL_SEARCH_SECTION_PATH_MAP['special-guests']
							) {
								router.push(
									GLOBAL_SEARCH_SECTION_PATH_MAP[
										'special-guests'
									]
								);
							}
							openSpecialGuestPlansDrawer();
						},
						toId: 'special-guest.plan-drawer',
					});
				}
				return;
			}

			closeGlobalSearch();
			if (
				item.section === 'normal-guests' ||
				item.section === 'special-guests'
			) {
				if (item.recordId === undefined) {
					throw new Error(
						'Catalog search guest record ID is missing.'
					);
				}
				selectCatalogGuest(item.section, item.recordId);
				if (item.section === 'special-guests') {
					closeSpecialGuestPlansDrawer();
					setSpecialGuestTutorialAllowedPathname(item.href);
				}
				router.push(getGlobalSearchItemNavigationHref(item, match));
				return;
			}
			if (item.recordId === undefined) {
				throw new Error('Catalog search item record ID is missing.');
			}

			setGlobalSearchTransientTarget({
				recordId: item.recordId,
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
