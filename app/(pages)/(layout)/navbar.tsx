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
	faDesktop,
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

import AccountMenu from '@/components/accountMenu';
import { trackEvent } from '@/components/analytics';
import SiteInfo from '@/components/siteInfo';
import Sprite from '@/components/sprite';
import ThemeSwitcher from '@/components/themeSwitcher';

import { siteConfig } from '@/configs';
import { accountStore, globalStore } from '@/stores';
import { checkA11yConfirmKey } from '@/utilities';

const {
	isAccountFeatureClientEnabled,
	links,
	name,
	navItems,
	navMenuItems,
	shortName,
} = siteConfig;

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

const DESKTOP_ACTION_MENU_ITEM_CLASS_NAME =
	'flex min-w-0 items-center gap-1 py-0.5 text-small';

const DESKTOP_ACTION_MENU_SECTION_CLASS_NAMES = {
	base: 'mb-0',
	divider: 'mx-1 my-1 bg-default-200/70',
	group: 'space-y-1',
	heading:
		'px-2 pb-0.5 pt-2.5 text-tiny font-medium uppercase text-default-500',
};

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
	'className' | 'href' | 'startContent' | 'fullWidth' | 'onPress'
> {
	isActivated: boolean;
}

const NavbarButtonLink = memo<PropsWithChildren<INavbarButtonLinkProps>>(
	function NavbarButtonLink({ children, className, isActivated, ...props }) {
		return (
			<Button
				as={Link}
				animationUnderline={false}
				size="sm"
				variant={isActivated ? 'flat' : 'light'}
				onClick={(event) => {
					event.preventDefault();
				}}
				onKeyDown={checkA11yConfirmKey()}
				onPressStart={(event) => {
					event.continuePropagation();
				}}
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
	const basePathname = `/${pathname.split('/')[1]}`;
	const router = useRouter();
	const startProgress = useProgress();
	const vibrate = useVibrate();
	const [isMenuOpened, setIsMenuOpened] = useState(false);
	const isReducedMotion = useReducedMotion();
	const [theme, setTheme] = useTheme();

	const isHighAppearance = globalStore.persistence.highAppearance.use();

	const accountBootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const accountUser = accountStore.shared.user.use();

	const shouldShowDesktopAccountAction =
		isAccountFeatureClientEnabled && accountBootstrapStatus !== 'disabled';
	const accountActionLabel =
		accountBootstrapStatus === 'error'
			? '账号不可用'
			: accountBootstrapStatus === 'unknown'
				? '欢迎您'
				: accountUser === null
					? '未登录'
					: accountUser.username;
	const desktopAccountMenuDisabledKeys =
		accountBootstrapStatus === 'unknown' ? ['account'] : [];
	const desktopSelectedThemeKeys = [`theme:${theme}`];

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

	const handleDesktopActionMenu = useCallback(
		(key: Key) => {
			const actionKey = String(key);
			if (actionKey === 'account') {
				handleAccountMenuClick();
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
	const shouldShowPreferences =
		basePathname !== '/' && basePathname !== '/about';

	return (
		<HeroUINavbar
			isBordered
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
										href={href}
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
														href={href}
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
				{shouldShowDesktopAccountAction ? (
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
									<FontAwesomeIcon
										icon={faUser}
										className="w-3.5"
									/>
									<span className="mr-1">账号</span>
									<FontAwesomeIcon
										icon={faChevronDown}
										size="sm"
										className="w-3 opacity-70"
									/>
								</Button>
							</DropdownTrigger>
							<DropdownMenu
								disabledKeys={desktopAccountMenuDisabledKeys}
								disallowEmptySelection
								onAction={handleDesktopActionMenu}
								selectedKeys={desktopSelectedThemeKeys}
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
									classNames={
										DESKTOP_ACTION_MENU_SECTION_CLASS_NAMES
									}
								>
									<DropdownItem
										key="account"
										textValue={accountActionLabel}
									>
										<div
											className={
												DESKTOP_ACTION_MENU_ITEM_CLASS_NAME
											}
										>
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
									classNames={
										DESKTOP_ACTION_MENU_SECTION_CLASS_NAMES
									}
								>
									{DESKTOP_THEME_MENU_ITEMS.map(
										({ icon, key, label }) => (
											<DropdownItem
												key={key}
												textValue={label}
											>
												<div
													className={
														DESKTOP_ACTION_MENU_ITEM_CLASS_NAME
													}
												>
													<FontAwesomeIcon
														icon={icon}
														className="w-4"
													/>
													{label}
												</div>
											</DropdownItem>
										)
									)}
								</DropdownSection>
							</DropdownMenu>
						</Dropdown>
					</NavbarItem>
				) : (
					<NavbarItem>
						<ThemeSwitcher />
					</NavbarItem>
				)}
			</NavbarContent>

			<NavbarContent
				as="div"
				justify="end"
				className="basis-1 !gap-3 pl-4 md:hidden"
			>
				{isMenuOpened && isAccountFeatureClientEnabled && (
					<div className="flex">
						<AccountMenu onClick={handleAccountMenuClick} />
					</div>
				)}
				{isMenuOpened && <ThemeSwitcher isMenu />}
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

			<NavbarMenu className="px-10 pt-4">
				{navMenuItems.map(({ href, label }, index) => {
					const isActivated = href === basePathname;
					return href === '/preferences' &&
						!shouldShowPreferences ? null : (
						<NavbarMenuItem key={index} isActive={isActivated}>
							<Link
								color={isActivated ? 'primary' : 'foreground'}
								forcedUnderline={
									isActivated || href === '/preferences'
								}
								size="lg"
								onClick={(event) => {
									event.preventDefault();
									handlePress(href, true);
								}}
								href={href}
							>
								{label}
							</Link>
						</NavbarMenuItem>
					);
				})}
			</NavbarMenu>
		</HeroUINavbar>
	);
}
