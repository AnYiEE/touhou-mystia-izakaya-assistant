'use client';

import {
	type JSX,
	type Key,
	type PropsWithChildren,
	memo,
	startTransition,
	useCallback,
	useState,
} from 'react';

import { useRouter } from 'next/navigation';
import { useProgress } from 'react-transition-progress';
import { usePathname, useVibrate } from '@/hooks';

import {
	Navbar as HeroUINavbar,
	NavbarBrand,
	NavbarContent,
	NavbarItem,
	NavbarMenu,
	NavbarMenuItem,
	NavbarMenuToggle,
} from '@heroui/navbar';
import {
	FontAwesomeIcon,
	type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import {
	faChevronDown,
	faCircleInfo,
	faDesktop,
	faGear,
	faMoon,
	faSun,
	faUser,
} from '@fortawesome/free-solid-svg-icons';

import { THEME_MAP, type TTheme, useTheme } from '@/design/hooks';
import {
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownSection,
	DropdownTrigger,
	type IButtonProps,
	Link,
	Tooltip,
	cn,
} from '@/design/ui/components';
import { useReducedMotion } from '@/design/ui/hooks';

import { trackEvent } from '@/components/analytics';
import MobileAccountActionButton from '@/components/mobileAccountActionButton';
import SiteInfo from '@/components/siteInfo';
import Sprite from '@/components/sprite';
import ThemeSwitcher from '@/components/themeSwitcher';

import { siteConfig } from '@/configs';
import { accountStore, globalStore } from '@/stores';
import { checkA11yConfirmKey } from '@/utilities';
import type { TSpriteTarget } from '@/utils/sprite/types';

const { isAccountFeatureClientEnabled, links, name, navItems, shortName } =
	siteConfig;

interface IMobileIconNavItem {
	href: string;
	icon: FontAwesomeIconProps['icon'];
	label: string;
}

interface IMobileSpriteNavItem {
	href: string;
	label: string;
	sprite: TSpriteTarget;
	spriteIndex: number;
}

const MOBILE_CUSTOMER_NAV_ITEMS = [
	{
		href: '/customer-rare',
		label: '稀客',
		sprite: 'customer_rare',
		spriteIndex: 0,
	},
	{
		href: '/customer-normal',
		label: '普客',
		sprite: 'customer_normal',
		spriteIndex: 0,
	},
] as const satisfies ReadonlyArray<IMobileSpriteNavItem>;

const MOBILE_UTILITY_NAV_ITEMS = [
	{ href: '/preferences', icon: faGear, label: '设置' },
	{ href: '/about', icon: faCircleInfo, label: '关于' },
] as const satisfies ReadonlyArray<IMobileIconNavItem>;

const MOBILE_QUERY_NAV_GROUPS = navItems.flatMap((navItem) => {
	if ('href' in navItem) {
		return [];
	}

	return Object.entries(navItem).map(([label, items]) => ({ items, label }));
});

const DESKTOP_THEME_MENU_ITEMS = [
	{
		icon: faDesktop,
		key: 'theme:system',
		label: '跟随系统',
		theme: THEME_MAP.SYSTEM,
	},
	{
		icon: faSun,
		key: 'theme:light',
		label: '浅色主题',
		theme: THEME_MAP.LIGHT,
	},
	{
		icon: faMoon,
		key: 'theme:dark',
		label: '深色主题',
		theme: THEME_MAP.DARK,
	},
] as const satisfies ReadonlyArray<{
	icon: FontAwesomeIconProps['icon'];
	key: string;
	label: string;
	theme: TTheme;
}>;

const ACCOUNT_ACTION_MENU_ITEM_CLASS_NAME =
	'flex min-w-0 items-center gap-1 py-0.5 text-small';

const ACCOUNT_ACTION_MENU_SECTION_CLASS_NAMES = {
	base: 'mb-0',
	divider: 'mx-1 my-1 bg-default-200/70',
	group: 'space-y-1',
	heading:
		'px-2 pb-0.5 pt-2.5 text-tiny font-medium uppercase text-default-500',
};

const MOBILE_SECTION_TITLE_CLASS_NAME =
	'px-1 text-small font-medium text-foreground-500 dark:text-foreground-400';

const MOBILE_CARD_BASE_CLASS_NAME =
	'rounded-small border bg-content1/45 shadow-[0_1px_0_rgba(0,0,0,0.025)] transition-[background-color,border-color,box-shadow] motion-reduce:transition-none dark:bg-default-50/10 dark:shadow-none';

const MOBILE_CARD_ACTIVE_CLASS_NAME =
	'border-primary/40 text-primary-700 dark:text-primary';

const MOBILE_CARD_INACTIVE_CLASS_NAME =
	'border-default-200/75 text-foreground-700 hover:border-default-300 hover:bg-content1/65 dark:border-default-200/60 dark:hover:bg-default-50/15';

const MOBILE_ICON_FRAME_CLASS_NAME =
	'flex h-9 w-9 shrink-0 items-center justify-center rounded-small transition-colors motion-reduce:transition-none';

const MOBILE_ICON_FRAME_ACTIVE_CLASS_NAME =
	'bg-primary/10 text-primary-700 dark:bg-primary/15 dark:text-primary';

const MOBILE_ICON_FRAME_INACTIVE_CLASS_NAME =
	'bg-default-100/70 text-foreground-500 group-hover:bg-default-100 group-hover:text-foreground-700 dark:bg-default-50/20';

export function showProgress(startProgress: () => void) {
	startTransition(async () => {
		startProgress();
		await new Promise((resolve) => {
			setTimeout(resolve, 300);
		});
	});
}

interface INavbarButtonLinkProps extends Pick<
	IButtonProps,
	'className' | 'startContent' | 'fullWidth' | 'onPress'
> {
	isActivated: boolean;
}

const NavbarButtonLink = memo<PropsWithChildren<INavbarButtonLinkProps>>(
	function NavbarButtonLink({ children, className, isActivated, ...props }) {
		return (
			<Button
				size="sm"
				variant={isActivated ? 'flat' : 'light'}
				onKeyDown={checkA11yConfirmKey()}
				onPressStart={(event) => {
					event.continuePropagation();
				}}
				aria-current={isActivated ? 'page' : undefined}
				role="link"
				className={cn('text-base after:hidden', className)}
				{...props}
			>
				{children}
			</Button>
		);
	}
);

export default function Navbar() {
	const { pathname } = usePathname();
	const basePathname = `/${pathname.split('/', 2)[1]}`;
	const router = useRouter();
	const startProgress = useProgress();
	const vibrate = useVibrate();
	const [isMenuOpened, setIsMenuOpened] = useState(false);
	const isReducedMotion = useReducedMotion();
	const [theme, setTheme] = useTheme();

	const isHighAppearance = globalStore.persistence.highAppearance.use();

	const accountBootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const accountUser = accountStore.shared.user.use();

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

	const handlePress = useCallback(
		(href?: string, isInNavbarMenu?: boolean) => {
			vibrate();
			const route = () => {
				if (href !== undefined) {
					if (
						href === '/preferences' &&
						basePathname !== '/preferences'
					) {
						globalStore.setPreferencesModalIsOpen(true);
					} else {
						showProgress(startProgress);
						router.push(href);
					}
				}
			};
			if (isInNavbarMenu) {
				setIsMenuOpened(false);
				// Wait for the menu close animation to complete (the animate will take 300ms).
				setTimeout(route, isReducedMotion ? 0 : 300);
			} else {
				setIsMenuOpened(false);
				route();
			}
		},
		[basePathname, isReducedMotion, router, startProgress, vibrate]
	);

	const handleAccountMenuClick = useCallback(
		(isInNavbarMenu?: boolean) => {
			vibrate();
			trackEvent(
				trackEvent.category.click,
				'Account Button',
				isInNavbarMenu ? 'Open Modal From Menu' : 'Open Modal'
			);
			const openAccountModal = () => {
				accountStore.shared.accountModal.isOpen.set(true);
			};
			if (isInNavbarMenu) {
				setIsMenuOpened(false);
				setTimeout(openAccountModal, isReducedMotion ? 0 : 300);
			} else {
				setIsMenuOpened(false);
				openAccountModal();
			}
		},
		[isReducedMotion, vibrate]
	);

	const handleActionMenu = useCallback(
		(key: Key, isInNavbarMenu?: boolean) => {
			const actionKey = String(key);
			if (actionKey === 'account') {
				handleAccountMenuClick(isInNavbarMenu);
				return;
			}
			const themeItem = DESKTOP_THEME_MENU_ITEMS.find(
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

	const renderMobileIconNavItem = ({
		href,
		icon,
		label,
	}: IMobileIconNavItem) => {
		const isActivated = href === basePathname;
		return (
			<Button
				key={href}
				variant="light"
				onPress={() => {
					handlePress(href, true);
				}}
				onPressStart={(event) => {
					event.continuePropagation();
				}}
				className={cn(
					'group relative flex h-auto w-full min-w-0 overflow-hidden',
					MOBILE_CARD_BASE_CLASS_NAME,
					'min-h-12 items-center justify-start gap-3 px-3 py-2.5',
					isActivated
						? MOBILE_CARD_ACTIVE_CLASS_NAME
						: MOBILE_CARD_INACTIVE_CLASS_NAME
				)}
			>
				<span
					className={cn(
						MOBILE_ICON_FRAME_CLASS_NAME,
						'h-8 w-8',
						isActivated
							? MOBILE_ICON_FRAME_ACTIVE_CLASS_NAME
							: MOBILE_ICON_FRAME_INACTIVE_CLASS_NAME
					)}
				>
					<FontAwesomeIcon icon={icon} className="w-4" />
				</span>
				<span className="min-w-0 truncate text-small font-medium">
					{label}
				</span>
			</Button>
		);
	};

	const renderMobileCustomerNavItem = ({
		href,
		label,
		sprite,
		spriteIndex,
	}: IMobileSpriteNavItem) => {
		const isActivated = href === basePathname;
		return (
			<Button
				key={href}
				variant="light"
				onPress={() => {
					handlePress(href, true);
				}}
				onPressStart={(event) => {
					event.continuePropagation();
				}}
				className={cn(
					'group flex h-auto min-h-[4.35rem] w-full min-w-0 flex-col items-center justify-center gap-1.5 px-2 py-2 text-center',
					MOBILE_CARD_BASE_CLASS_NAME,
					isActivated
						? MOBILE_CARD_ACTIVE_CLASS_NAME
						: MOBILE_CARD_INACTIVE_CLASS_NAME
				)}
			>
				<span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
					{sprite === 'customer_normal' ? (
						<span className="h-9 w-9 overflow-hidden rounded-full">
							<Sprite
								target={sprite}
								index={spriteIndex}
								size={3.2}
								className="-translate-x-[0.47rem] -translate-y-px"
							/>
						</span>
					) : (
						<span className="h-9 w-9 overflow-hidden rounded-full">
							<Sprite
								target={sprite}
								index={spriteIndex}
								size={2.25}
							/>
						</span>
					)}
				</span>
				<span className="min-w-0 max-w-full">
					<span className="block truncate text-small font-medium leading-5">
						{label}
					</span>
				</span>
			</Button>
		);
	};

	const renderMobileQueryNavItem = ({
		href,
		label,
		sprite,
		spriteIndex,
	}: IMobileSpriteNavItem) => {
		const isActivated = href === basePathname;
		return (
			<Button
				key={href}
				variant="light"
				onPress={() => {
					handlePress(href, true);
				}}
				onPressStart={(event) => {
					event.continuePropagation();
				}}
				className={cn(
					'group flex h-auto min-h-[4.35rem] w-full min-w-0 flex-col items-center justify-center gap-1.5 px-2 py-2 text-center',
					MOBILE_CARD_BASE_CLASS_NAME,
					isActivated
						? MOBILE_CARD_ACTIVE_CLASS_NAME
						: MOBILE_CARD_INACTIVE_CLASS_NAME
				)}
			>
				<span
					className={cn(
						MOBILE_ICON_FRAME_CLASS_NAME,
						isActivated
							? MOBILE_ICON_FRAME_ACTIVE_CLASS_NAME
							: MOBILE_ICON_FRAME_INACTIVE_CLASS_NAME
					)}
				>
					<Sprite
						target={sprite}
						index={spriteIndex}
						size={1.45}
						className={cn({ 'rounded-full': href === '/partners' })}
					/>
				</span>
				<span className="max-w-full truncate text-small font-medium leading-5">
					{label}
				</span>
			</Button>
		);
	};

	const renderMobileAccountActionItem = () => {
		if (!shouldShowAccountAction) {
			return null;
		}

		return (
			<MobileAccountActionButton
				isDisabled={accountBootstrapStatus === 'unknown'}
				label={accountActionLabel}
				onPress={() => {
					handleAccountMenuClick(true);
				}}
			/>
		);
	};

	const renderMobileThemeActionItem = ({
		icon,
		key,
		label,
	}: (typeof DESKTOP_THEME_MENU_ITEMS)[number]) => {
		const isSelected = selectedThemeKeys.includes(key);
		return (
			<Button
				key={key}
				variant="light"
				onPress={() => {
					handleActionMenu(key);
				}}
				className={cn(
					'flex h-auto min-h-12 w-full min-w-0 flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-center',
					MOBILE_CARD_BASE_CLASS_NAME,
					isSelected
						? MOBILE_CARD_ACTIVE_CLASS_NAME
						: MOBILE_CARD_INACTIVE_CLASS_NAME
				)}
			>
				<FontAwesomeIcon icon={icon} className="w-3.5" />
				<span className="text-tiny font-medium leading-4">
					{label.replace('主题', '')}
				</span>
			</Button>
		);
	};

	const renderAccountThemeDropdownMenu = () => (
		<DropdownMenu
			disabledKeys={accountMenuDisabledKeys}
			disallowEmptySelection
			onAction={(key) => {
				handleActionMenu(key);
			}}
			selectedKeys={selectedThemeKeys}
			selectionMode="single"
			aria-label="账号和主题"
			itemClasses={{
				base: 'my-px transition-background focus:bg-default/40 data-[hover=true]:bg-default/40 data-[selectable=true]:focus:bg-default/40 motion-reduce:transition-none',
			}}
		>
			<DropdownSection
				title="账号"
				hideSelectedIcon
				showDivider
				classNames={ACCOUNT_ACTION_MENU_SECTION_CLASS_NAMES}
			>
				<DropdownItem key="account" textValue={accountActionLabel}>
					<div className={ACCOUNT_ACTION_MENU_ITEM_CLASS_NAME}>
						<FontAwesomeIcon
							icon={faUser}
							className="w-4 shrink-0"
						/>
						<span className="min-w-0 truncate">
							{accountActionLabel}
						</span>
					</div>
				</DropdownItem>
			</DropdownSection>
			<DropdownSection
				title="主题"
				classNames={ACCOUNT_ACTION_MENU_SECTION_CLASS_NAMES}
			>
				{DESKTOP_THEME_MENU_ITEMS.map(({ icon, key, label }) => (
					<DropdownItem key={key} textValue={label}>
						<div className={ACCOUNT_ACTION_MENU_ITEM_CLASS_NAME}>
							<FontAwesomeIcon icon={icon} className="w-4" />
							{label}
						</div>
					</DropdownItem>
				))}
			</DropdownSection>
		</DropdownMenu>
	);

	const renderAccountThemeDropdown = () => (
		<NavbarItem>
			<Dropdown
				shouldCloseOnScroll
				onOpenChange={vibrate}
				classNames={{
					content: cn('m-1 min-w-36 max-w-36 p-1', {
						'bg-background/70 backdrop-saturate-150':
							isHighAppearance,
					}),
				}}
			>
				<DropdownTrigger>
					<Button
						size="sm"
						variant="light"
						aria-label="账号和主题"
						title="账号和主题"
						className="gap-1 text-base"
					>
						<FontAwesomeIcon icon={faUser} className="w-3.5" />
						<span className="mr-1">账号</span>
						<FontAwesomeIcon
							icon={faChevronDown}
							size="sm"
							className="w-3 opacity-70"
						/>
					</Button>
				</DropdownTrigger>
				{renderAccountThemeDropdownMenu()}
			</Dropdown>
		</NavbarItem>
	);

	return (
		<HeroUINavbar
			isBordered
			shouldBlockScroll={false}
			disableAnimation={isReducedMotion}
			isBlurred={isHighAppearance}
			isMenuOpen={isMenuOpened}
			onMenuOpenChange={setIsMenuOpened}
			classNames={{
				base: 'pt-titlebar',
				wrapper:
					'max-w-screen-xl 3xl:max-w-screen-2xl 4xl:max-w-screen-3xl',
			}}
		>
			<NavbarContent
				as="div"
				justify="start"
				className="basis-full md:basis-1/5"
			>
				<NavbarBrand className="max-w-fit">
					<Link
						animationUnderline={false}
						color="foreground"
						href={links.index.href}
						onKeyDown={checkA11yConfirmKey()}
						onPress={() => {
							handlePress();
						}}
						aria-label={links.index.label}
						role="button"
						className="flex select-none items-center justify-start gap-1 rounded-small hover:brightness-100 active:opacity-disabled"
					>
						<span
							aria-hidden
							title={shortName}
							className="image-rendering-pixelated h-10 w-10 rounded-full bg-logo bg-cover bg-no-repeat"
						/>
						<p className="hidden font-bold lg:inline-block">
							{name}
						</p>
						<SiteInfo
							aria-hidden="false"
							fontSize={16}
							name={shortName}
							className="pointer-events-auto h-full select-auto font-bold text-foreground lg:hidden"
						/>
					</Link>
				</NavbarBrand>
				<ul className="hidden justify-start gap-4 pl-2 md:flex">
					{navItems.map((navItem, navItemIndex) => {
						if ('href' in navItem) {
							const { href, label } = navItem;
							const isActivated = href === basePathname;
							return href === '/preferences' &&
								!shouldShowPreferences ? null : (
								<NavbarItem
									key={navItemIndex}
									isActive={isActivated}
								>
									<NavbarButtonLink
										isActivated={isActivated}
										onPress={() => {
											handlePress(href);
										}}
									>
										{label}
									</NavbarButtonLink>
								</NavbarItem>
							);
						}
						return Object.entries(navItem).reduce<JSX.Element[]>(
							(
								acc,
								[dropdownLabel, dropdownItems],
								dropdownIndex
							) => {
								const isDropdownActivated = dropdownItems.some(
									({ href }) => href === basePathname
								);
								const dropdownElement = (
									<Dropdown
										key={dropdownIndex}
										shouldCloseOnScroll
										onOpenChange={vibrate}
										classNames={{
											content: cn('p-0', {
												'bg-background/70 backdrop-saturate-150':
													isHighAppearance,
											}),
										}}
									>
										<NavbarItem>
											<DropdownTrigger>
												<Button
													endContent={
														<FontAwesomeIcon
															icon={faChevronDown}
															size="sm"
														/>
													}
													size="sm"
													variant={
														isDropdownActivated
															? 'flat'
															: 'light'
													}
													className="text-base"
												>
													{dropdownLabel}
												</Button>
											</DropdownTrigger>
										</NavbarItem>
										<DropdownMenu
											items={dropdownItems}
											onAction={(key) => {
												handlePress(key as string);
											}}
											aria-label={`${dropdownLabel}列表`}
											itemClasses={{
												base: 'my-px p-0 transition-background focus:bg-default/40 data-[hover=true]:bg-default/40 data-[selectable=true]:focus:bg-default/40 motion-reduce:transition-none',
											}}
										>
											{({
												href,
												label,
												sprite,
												spriteIndex,
											}) => (
												<DropdownItem
													key={href}
													textValue={label}
												>
													<NavbarButtonLink
														fullWidth
														isActivated={
															href ===
															basePathname
														}
														startContent={
															<Sprite
																target={sprite}
																index={
																	spriteIndex
																}
																size={1.25}
																className={cn({
																	'rounded-full':
																		href ===
																		'/partners',
																})}
															/>
														}
														className="justify-start gap-1 text-small hover:brightness-100 data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent data-[hover=true]:backdrop-blur-none data-[pressed=true]:backdrop-blur-none"
													>
														{label}
													</NavbarButtonLink>
												</DropdownItem>
											)}
										</DropdownMenu>
									</Dropdown>
								);
								return [...acc, dropdownElement];
							},
							[]
						);
					})}
				</ul>
			</NavbarContent>

			<NavbarContent
				justify="end"
				className="hidden basis-full md:flex md:basis-1/5"
			>
				{shouldShowAccountAction ? (
					renderAccountThemeDropdown()
				) : (
					<NavbarItem>
						<ThemeSwitcher />
					</NavbarItem>
				)}
			</NavbarContent>

			<NavbarContent
				as="div"
				justify="end"
				className="basis-1 pl-4 md:hidden"
			>
				<Tooltip
					showArrow
					content={isMenuOpened ? '收起菜单' : '打开菜单'}
					placement="left"
				>
					<NavbarMenuToggle
						onChange={vibrate}
						srOnlyText={isMenuOpened ? '收起菜单' : '打开菜单'}
						aria-label={isMenuOpened ? '收起菜单' : '打开菜单'}
					/>
				</Tooltip>
			</NavbarContent>

			<NavbarMenu
				className={cn(
					'top-[calc(var(--navbar-height)_+_var(--announcement-bar-offset))]',
					'h-[calc(var(--safe-h-dvh)_-_var(--navbar-height)_-_var(--announcement-bar-offset))]',
					'mobile-navbar-menu-scroll gap-3.5 overflow-y-auto overflow-x-hidden px-6 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-4 sm:px-8'
				)}
			>
				<NavbarMenuItem>
					<section className="space-y-2">
						<h2 className={MOBILE_SECTION_TITLE_CLASS_NAME}>
							顾客
						</h2>
						<div className="grid grid-cols-2 gap-2">
							{MOBILE_CUSTOMER_NAV_ITEMS.map(
								renderMobileCustomerNavItem
							)}
						</div>
					</section>
				</NavbarMenuItem>
				{MOBILE_QUERY_NAV_GROUPS.map(({ items, label }) => (
					<NavbarMenuItem key={label}>
						<section className="space-y-2">
							<h2 className={MOBILE_SECTION_TITLE_CLASS_NAME}>
								{label}
							</h2>
							<div className="grid grid-cols-4 gap-2">
								{items.map(renderMobileQueryNavItem)}
							</div>
						</section>
					</NavbarMenuItem>
				))}
				<NavbarMenuItem>
					<section className="space-y-2">
						<h2 className={MOBILE_SECTION_TITLE_CLASS_NAME}>
							更多
						</h2>
						<div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2">
							{MOBILE_UTILITY_NAV_ITEMS.map((item) =>
								renderMobileIconNavItem(item)
							)}
						</div>
					</section>
				</NavbarMenuItem>
				<NavbarMenuItem>
					<section className="space-y-2">
						<h2 className={MOBILE_SECTION_TITLE_CLASS_NAME}>
							{mobileActionSectionTitle}
						</h2>
						{shouldShowAccountAction && (
							<div className="space-y-2">
								{renderMobileAccountActionItem()}
							</div>
						)}
						<div className="grid grid-cols-3 gap-2">
							{DESKTOP_THEME_MENU_ITEMS.map(
								renderMobileThemeActionItem
							)}
						</div>
					</section>
				</NavbarMenuItem>
			</NavbarMenu>
		</HeroUINavbar>
	);
}
