'use client';

import { Navbar as HeroUINavbar } from '@heroui/navbar';
import { useRouter } from 'next/navigation';
import {
	type Key,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { useProgress } from 'react-transition-progress';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import { THEME_MAP } from '@/design/theme/runtime/constants';
import { useTheme } from '@/design/theme/runtime/useTheme';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import { getAccountActionLabel } from '@/features/account/client/copy';
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

import { useHydrated } from '@/shared/react/useHydrated';

import DesktopNavigation from './DesktopNavigation';
import MobileNavigationMenu from './MobileNavigationMenu';
import {
	NAVBAR_DARK_PALETTE_ITEMS,
	NAVBAR_LIGHT_PALETTE_ITEMS,
	NAVBAR_THEME_ITEMS,
} from './themeItems';

const { isAccountFeatureClientEnabled } = PUBLIC_RUNTIME_CONFIG;

const NAVBAR_CLASS_NAMES = {
	base: 'pt-titlebar',
	wrapper: 'max-w-screen-xl 3xl:max-w-screen-2xl 4xl:max-w-screen-3xl',
} as const;

export default function Navbar() {
	const { pathname } = usePathname();
	const startProgress = useProgress();
	const router = useRouter();
	const basePathname = `/${pathname.split('/', 2)[1]}`;

	const { isHighAppearance } = useDesignPreferences();
	const isHydrated = useHydrated();
	const isReducedMotion = useReducedMotion();
	const [
		theme,
		setTheme,
		lightPalette,
		setLightPalette,
		darkPalette,
		setDarkPalette,
		resolvedTheme,
	] = useTheme();
	const vibrate = useVibrate();

	const [isApplePlatform, setIsApplePlatform] = useState(false);
	const [isMenuOpened, setIsMenuOpened] = useState(false);
	const menuCloseActionVersionRef = useRef(0);

	const accountBootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const accountUser = accountStore.shared.user.use();
	const { isPaused: isAccountSyncPaused, label: accountSyncPauseLabel } =
		getAccountSyncPauseIndicator(accountUser?.sync_status);

	const shouldShowAccountAction =
		isAccountFeatureClientEnabled && accountBootstrapStatus !== 'disabled';
	const accountActionLabel = getAccountActionLabel(
		accountBootstrapStatus,
		accountUser
	);
	const accountMenuDisabledKeys = useMemo(
		() => (accountBootstrapStatus === 'unknown' ? ['account'] : []),
		[accountBootstrapStatus]
	);
	const selectedThemeKeys = useMemo(() => [`theme:${theme}`], [theme]);
	const paletteItems = isHydrated
		? resolvedTheme === THEME_MAP.LIGHT
			? NAVBAR_LIGHT_PALETTE_ITEMS
			: NAVBAR_DARK_PALETTE_ITEMS
		: [];
	const selectedPaletteKey =
		resolvedTheme === THEME_MAP.LIGHT
			? `light-palette:${lightPalette}`
			: `dark-palette:${darkPalette}`;
	const searchShortcutLabel = isApplePlatform ? '⌘K' : 'Ctrl+K';
	const getMobileMenuRootElement = useCallback(
		() =>
			document.querySelector<HTMLElement>(
				'[data-coordinated-overlay-id="navigation.mobile-menu"]'
			),
		[]
	);

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
		getRootElement: getMobileMenuRootElement,
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

	const handleMobileAccountPress = useCallback(() => {
		handleAccountMenuClick(true);
	}, [handleAccountMenuClick]);

	const handleMobileNavigate = useCallback(
		(href: string) => {
			handlePress(href, true);
		},
		[handlePress]
	);

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
			if (typeof key !== 'string') {
				return;
			}
			const actionKey = key;
			if (actionKey === 'account') {
				handleAccountMenuClick(isInNavbarMenu);
				return;
			}
			const themeItem = NAVBAR_THEME_ITEMS.find(
				({ key: themeKey }) => themeKey === actionKey
			);
			if (themeItem !== undefined) {
				setTheme(themeItem.theme);
				trackEvent(
					trackEvent.category.click,
					'Theme Button',
					themeItem.theme
				);
				return;
			}
			const darkPaletteItem = NAVBAR_DARK_PALETTE_ITEMS.find(
				({ key: darkPaletteKey }) => darkPaletteKey === actionKey
			);
			if (darkPaletteItem !== undefined) {
				setDarkPalette(darkPaletteItem.palette);
				trackEvent(
					trackEvent.category.click,
					'Theme Button',
					`dark-palette:${darkPaletteItem.palette}`
				);
				return;
			}
			const lightPaletteItem = NAVBAR_LIGHT_PALETTE_ITEMS.find(
				({ key: lightPaletteKey }) => lightPaletteKey === actionKey
			);
			if (lightPaletteItem === undefined) {
				return;
			}
			setLightPalette(lightPaletteItem.palette);
			trackEvent(
				trackEvent.category.click,
				'Theme Button',
				`light-palette:${lightPaletteItem.palette}`
			);
		},
		[handleAccountMenuClick, setDarkPalette, setLightPalette, setTheme]
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
				classNames={NAVBAR_CLASS_NAMES}
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
					paletteItems={paletteItems}
					searchShortcutLabel={searchShortcutLabel}
					selectedPaletteKey={selectedPaletteKey}
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
					onAccountPress={handleMobileAccountPress}
					onMenuToggleChange={vibrate}
					onNavigate={handleMobileNavigate}
					onSearchPress={handleMobileSearchButtonPress}
					onThemeAction={handleActionMenu}
					paletteItems={paletteItems}
					selectedPaletteKey={selectedPaletteKey}
					selectedThemeKeys={selectedThemeKeys}
					shouldShowAccountAction={shouldShowAccountAction}
				/>
			</HeroUINavbar>
		</>
	);
}
