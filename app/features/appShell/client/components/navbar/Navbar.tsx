'use client';

import { Navbar as HeroUINavbar } from '@heroui/navbar';
import { useRouter } from 'next/navigation';
import { type Key, useCallback, useEffect, useRef, useState } from 'react';
import { useProgress } from 'react-transition-progress';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import { useTheme } from '@/design/theme/runtime/useTheme';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import { accountStore } from '@/features/account/client/state/accountStore';
import { getAccountSyncPauseIndicator } from '@/features/account/client/sync/accountSyncPauseIndicator';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import { showProgress } from '@/features/appShell/client/progress';
import { openGlobalSearch } from '@/features/globalSearch/client/commands';
import GlobalSpotlightSearch from '@/features/globalSearch/client/components/GlobalSpotlightSearch';
import {
	MOBILE_NAV_MENU_EXIT_DELAY_MS,
	handoffOverlay,
	requestOverlayClose,
	requestOverlayCloseAndWait,
	requestOverlayOpen,
	useCoordinatedOverlay,
} from '@/features/overlays/client';
import type { TOverlayId } from '@/features/overlays/contracts';
import { openPreferencesModal } from '@/features/preferences/client/overlayCommands';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { checkIsApplePlatform } from '@/infrastructure/browser/capabilities/platform';
import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

import DesktopNavigation from './DesktopNavigation';
import MobileNavigationMenu from './MobileNavigationMenu';
import { NAVBAR_THEME_ITEMS } from './themeItems';

const { isAccountFeatureClientEnabled } = PUBLIC_RUNTIME_CONFIG;

export default function Navbar() {
	const { pathname } = usePathname();
	const basePathname = `/${pathname.split('/', 2)[1]}`;
	const router = useRouter();
	const startProgress = useProgress();
	const vibrate = useVibrate();
	const [isMenuOpened, setIsMenuOpened] = useState(false);
	const menuCloseActionVersionRef = useRef(0);
	const [isApplePlatform, setIsApplePlatform] = useState(false);
	const isReducedMotion = useReducedMotion();
	const [theme, setTheme] = useTheme();

	const { isHighAppearance } = useDesignPreferences();

	const accountBootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const accountUser = accountStore.shared.user.use();
	const { isPaused: isAccountSyncPaused, label: accountSyncPauseLabel } =
		getAccountSyncPauseIndicator(accountUser?.sync_status);

	const shouldShowAccountAction =
		isAccountFeatureClientEnabled && accountBootstrapStatus !== 'disabled';
	const accountActionLabel =
		accountBootstrapStatus === 'error'
			? '账号不可用'
			: accountBootstrapStatus === 'unknown'
				? '欢迎您'
				: accountUser === null
					? '未登录'
					: (accountUser.nickname ?? accountUser.username);
	const accountMenuDisabledKeys =
		accountBootstrapStatus === 'unknown' ? ['account'] : [];
	const selectedThemeKeys = [`theme:${theme}`];
	const searchShortcutLabel = isApplePlatform ? '⌘K' : 'Ctrl+K';

	const requestMenuBusinessClose = useCallback(() => {
		setIsMenuOpened(false);
		requestOverlayClose('navigation.mobile-menu');
	}, []);

	const {
		isActiveTask: isMenuActiveTask,
		isPresentationOpen: isMenuPresentationOpen,
		shouldSuppressBackdropBlur,
	} = useCoordinatedOverlay({
		dismissable: true,
		exitDelayMs: isReducedMotion ? 0 : MOBILE_NAV_MENU_EXIT_DELAY_MS,
		getRootElement: () =>
			document.querySelector<HTMLElement>(
				'[data-coordinated-overlay-id="navigation.mobile-menu"]'
			),
		id: 'navigation.mobile-menu',
		isOpen: isMenuOpened,
		keepOpenWhenCovered: true,
		onRequestClose: requestMenuBusinessClose,
	});

	const handleMenuOpenChange = useCallback(
		(isOpen: boolean) => {
			if (!isOpen) {
				if (!isMenuActiveTask) {
					return;
				}
				requestMenuBusinessClose();
				return;
			}

			requestOverlayOpen('navigation.mobile-menu', {
				onActivate: () => {
					setIsMenuOpened(true);
				},
			});
		},
		[isMenuActiveTask, requestMenuBusinessClose]
	);

	const runAfterMobileMenuClose = useCallback((callback: () => void) => {
		const closeActionVersion = ++menuCloseActionVersionRef.current;
		setIsMenuOpened(false);
		void requestOverlayCloseAndWait('navigation.mobile-menu').then(() => {
			if (menuCloseActionVersionRef.current !== closeActionVersion) {
				return;
			}
			callback();
		});
	}, []);

	const handoffFromMobileMenu = useCallback(
		(toId: TOverlayId, onOpenTarget: () => void) => {
			menuCloseActionVersionRef.current += 1;
			return handoffOverlay({
				fromId: 'navigation.mobile-menu',
				onCloseSource: () => {
					setIsMenuOpened(false);
				},
				onOpenTarget,
				toId,
			});
		},
		[]
	);

	const handlePress = useCallback(
		(href?: string, isInNavbarMenu?: boolean) => {
			vibrate();
			const route = () => {
				if (href !== undefined) {
					if (
						href === '/preferences' &&
						basePathname !== '/preferences'
					) {
						openPreferencesModal();
					} else {
						showProgress(startProgress);
						router.push(href);
					}
				}
			};
			if (isInNavbarMenu) {
				if (
					href === '/preferences' &&
					basePathname !== '/preferences'
				) {
					handoffFromMobileMenu('preferences', route);
					return;
				}

				runAfterMobileMenuClose(route);
			} else {
				handleMenuOpenChange(false);
				route();
			}
		},
		[
			basePathname,
			handleMenuOpenChange,
			handoffFromMobileMenu,
			router,
			runAfterMobileMenuClose,
			startProgress,
			vibrate,
		]
	);

	const handleAccountMenuClick = useCallback(
		(isInNavbarMenu?: boolean) => {
			vibrate();
			trackEvent(
				trackEvent.category.click,
				'Account Button',
				isInNavbarMenu ? 'Open Modal From Menu' : 'Open Modal'
			);
			const openModal = () => {
				accountStore.openAccountModal();
			};
			if (isInNavbarMenu) {
				handoffFromMobileMenu('account.main', openModal);
			} else {
				handleMenuOpenChange(false);
				openModal();
			}
		},
		[handleMenuOpenChange, handoffFromMobileMenu, vibrate]
	);

	const handleSearchButtonPress = useCallback(
		(isInNavbarMenu?: boolean) => {
			vibrate();
			trackEvent(
				trackEvent.category.click,
				'Global Search Button',
				isInNavbarMenu ? 'Open From Navbar Menu' : 'Open From Navbar'
			);
			const openSearch = () => {
				openGlobalSearch();
			};
			if (isInNavbarMenu) {
				handoffFromMobileMenu('global.search', openSearch);
			} else {
				handleMenuOpenChange(false);
				openSearch();
			}
		},
		[handleMenuOpenChange, handoffFromMobileMenu, vibrate]
	);

	const handleMobileSearchButtonPress = useCallback(() => {
		handleSearchButtonPress(isMenuOpened);
	}, [handleSearchButtonPress, isMenuOpened]);

	useEffect(() => {
		setIsApplePlatform(checkIsApplePlatform());
	}, []);

	useEffect(
		() => () => {
			menuCloseActionVersionRef.current += 1;
		},
		[]
	);

	const handleActionMenu = useCallback(
		(key: Key, isInNavbarMenu?: boolean) => {
			const actionKey = String(key);
			if (actionKey === 'account') {
				handleAccountMenuClick(isInNavbarMenu);
				return;
			}
			const themeItem = NAVBAR_THEME_ITEMS.find(
				({ key: themeKey }) => themeKey === actionKey
			);
			if (themeItem === undefined) {
				return;
			}
			setTheme(themeItem.theme);
			trackEvent(
				trackEvent.category.click,
				'Theme Button',
				themeItem.theme
			);
		},
		[handleAccountMenuClick, setTheme]
	);

	// Support parallel routing pages.
	const shouldShowPreferences = !['/', '/about', '/preferences'].includes(
		basePathname
	);

	const mobileActionSectionTitle = shouldShowAccountAction
		? '账号和主题'
		: '主题';

	return (
		<>
			<GlobalSpotlightSearch />
			<HeroUINavbar
				data-coordinated-overlay-id="navigation.mobile-menu"
				isBordered
				shouldBlockScroll={false}
				disableAnimation={isReducedMotion}
				isBlurred={isHighAppearance && !shouldSuppressBackdropBlur}
				isMenuOpen={isMenuPresentationOpen}
				onMenuOpenChange={handleMenuOpenChange}
				classNames={{
					base: 'pt-titlebar',
					wrapper:
						'max-w-screen-xl 3xl:max-w-screen-2xl 4xl:max-w-screen-3xl',
				}}
			>
				<DesktopNavigation
					accountActionLabel={accountActionLabel}
					accountMenuDisabledKeys={accountMenuDisabledKeys}
					accountSyncPauseLabel={accountSyncPauseLabel}
					basePathname={basePathname}
					isAccountSyncPaused={isAccountSyncPaused}
					isHighAppearance={isHighAppearance}
					onAccountThemeAction={handleActionMenu}
					onDropdownOpenChange={vibrate}
					onNavigate={handlePress}
					onSearchPress={handleSearchButtonPress}
					searchShortcutLabel={searchShortcutLabel}
					selectedThemeKeys={selectedThemeKeys}
					shouldShowAccountAction={shouldShowAccountAction}
					shouldShowPreferences={shouldShowPreferences}
				/>
				<MobileNavigationMenu
					accountActionLabel={accountActionLabel}
					accountSyncPauseLabel={accountSyncPauseLabel}
					basePathname={basePathname}
					isAccountActionDisabled={
						accountBootstrapStatus === 'unknown'
					}
					isHighAppearance={isHighAppearance}
					isMenuActiveTask={isMenuActiveTask}
					isMenuOpened={isMenuOpened}
					mobileActionSectionTitle={mobileActionSectionTitle}
					onAccountPress={() => {
						handleAccountMenuClick(true);
					}}
					onMenuToggleChange={vibrate}
					onNavigate={(href) => {
						handlePress(href, true);
					}}
					onSearchPress={handleMobileSearchButtonPress}
					onThemeAction={handleActionMenu}
					selectedThemeKeys={selectedThemeKeys}
					shouldShowAccountAction={shouldShowAccountAction}
				/>
			</HeroUINavbar>
		</>
	);
}
