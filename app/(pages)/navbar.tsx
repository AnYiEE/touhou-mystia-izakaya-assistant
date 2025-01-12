'use client';

import {type JSX, type PropsWithChildren, memo, startTransition, useCallback, useState} from 'react';

import {useRouter} from 'next/navigation';
import {useProgress} from 'react-transition-progress';
import {usePathname, useVibrate} from '@/hooks';

import {
	NavbarBrand,
	NavbarContent,
	NavbarItem,
	NavbarMenu,
	NavbarMenuItem,
	NavbarMenuToggle,
	Navbar as NextUINavbar,
} from '@nextui-org/navbar';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faGithub} from '@fortawesome/free-brands-svg-icons';
import {faChevronDown} from '@fortawesome/free-solid-svg-icons';

import {
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	type IButtonProps,
	type ILinkProps,
	Link,
	Tooltip,
	cn,
} from '@/design/ui/components';

import FontAwesomeIconLink, {type IFontAwesomeIconLinkProps} from '@/components/fontAwesomeIconLink';
import ThemeSwitcher from '@/components/themeSwitcher';
import Sprite from '@/components/sprite';

import {siteConfig} from '@/configs';
import {globalStore as store} from '@/stores';
import {checkA11yConfirmKey} from '@/utilities';

const {links, name, navItems, navMenuItems, shortName} = siteConfig;

export function showProgress(startProgress: () => void) {
	startTransition(async () => {
		startProgress();
		await new Promise((resolve) => {
			setTimeout(resolve, 300);
		});
	});
}

interface INavbarLinkProps
	extends Pick<IButtonProps, 'className' | 'startContent' | 'fullWidth'>,
		Pick<ILinkProps, 'href'> {
	isActivated: boolean;
}

const NavbarLink = memo<PropsWithChildren<INavbarLinkProps>>(function NavbarLink({
	children,
	className,
	isActivated,
	...props
}) {
	const startProgress = useProgress();
	const vibrate = useVibrate();

	const handlePress = useCallback(() => {
		vibrate();
		showProgress(startProgress);
	}, [startProgress, vibrate]);

	return (
		<Button
			as={Link}
			size="sm"
			variant={isActivated ? 'flat' : 'light'}
			onPress={handlePress}
			role="link"
			className={cn('text-base', className)}
			{...props}
		>
			{children}
		</Button>
	);
});

interface IGitHubIconLinkProps extends Pick<IFontAwesomeIconLinkProps, 'className' | 'tabIndex'> {}

const GitHubIconLink = memo<IGitHubIconLinkProps>(function IconLink({className, tabIndex}) {
	return (
		<FontAwesomeIconLink
			isExternal
			icon={faGithub}
			size="lg"
			href={links.github.href}
			aria-label={links.github.label}
			aria-hidden={tabIndex === -1}
			tabIndex={tabIndex}
			className={cn('h-5 w-5 rounded-full', className)}
		/>
	);
});

interface IGitHubLinkProps {
	showTooltip?: boolean;
}

const GitHubLink = memo<IGitHubLinkProps>(function GitHubLink({showTooltip}) {
	if (showTooltip) {
		return (
			<Tooltip showArrow content={links.github.label} placement="bottom">
				<span className="flex">
					<GitHubIconLink className="text-primary-600 dark:text-default-foreground" />
				</span>
			</Tooltip>
		);
	}

	return (
		<span className="flex gap-1">
			<GitHubIconLink tabIndex={-1} />
			<Link isExternal color="foreground" href={links.github.href}>
				{links.github.label}
			</Link>
		</span>
	);
});

export default function Navbar() {
	const pathname = usePathname();
	const router = useRouter();
	const startProgress = useProgress();
	const [isMenuOpened, setIsMenuOpened] = useState(false);
	const vibrate = useVibrate();

	const isHighAppearance = store.persistence.highAppearance.use();

	const handlePress = useCallback(() => {
		vibrate();
		showProgress(startProgress);
		setIsMenuOpened(false);
	}, [startProgress, vibrate]);

	// Support parallel routing pages.
	const shouldShowPreferences = pathname !== '/' && pathname !== '/about';

	return (
		<NextUINavbar
			isBordered
			isBlurred={isHighAppearance}
			maxWidth="xl"
			isMenuOpen={isMenuOpened}
			onMenuOpenChange={setIsMenuOpened}
			classNames={{
				base: 'pt-titlebar',
			}}
		>
			<NavbarContent as="div" justify="start" className="basis-full md:basis-1/5">
				<NavbarBrand className="max-w-fit">
					<Link
						color="foreground"
						href={links.index.href}
						onPress={handlePress}
						aria-label={links.index.label}
						className="flex select-none items-center justify-start gap-1 rounded-small hover:opacity-hover hover:brightness-100 active:opacity-disabled"
					>
						<span
							aria-hidden
							title={shortName}
							className="h-10 w-10 rounded-full bg-logo bg-cover bg-no-repeat"
						/>
						<p className="font-bold">
							<span className="hidden lg:inline">{name}</span>
							<span className="inline lg:hidden">{shortName}</span>
						</p>
					</Link>
				</NavbarBrand>
				<ul className="hidden justify-start gap-4 pl-2 md:flex">
					{navItems.map((navItem, navItemIndex) => {
						if ('href' in navItem) {
							const {href, label} = navItem;
							const isActivated = href === pathname;
							return href === '/preferences' && !shouldShowPreferences ? null : (
								<NavbarItem key={navItemIndex} isActive={isActivated}>
									<NavbarLink isActivated={isActivated} href={href}>
										{label}
									</NavbarLink>
								</NavbarItem>
							);
						}
						return Object.entries(navItem).reduce<JSX.Element[]>(
							(acc, [dropdownLabel, dropdownItems], dropdownIndex) => {
								const isDropdownActivated = dropdownItems.some(({href}) => href === pathname);
								const dropdownElement = (
									<Dropdown
										key={dropdownIndex}
										shouldCloseOnScroll
										onOpenChange={vibrate}
										classNames={{
											content: cn('p-0', {
												'bg-background/70 backdrop-saturate-150': isHighAppearance,
											}),
										}}
									>
										<NavbarItem>
											<DropdownTrigger>
												<Button
													endContent={<FontAwesomeIcon icon={faChevronDown} size="sm" />}
													size="sm"
													variant={isDropdownActivated ? 'flat' : 'light'}
													className="text-base"
												>
													{dropdownLabel}
												</Button>
											</DropdownTrigger>
										</NavbarItem>
										<DropdownMenu
											items={dropdownItems}
											aria-label={`${dropdownLabel}列表`}
											itemClasses={{
												base: 'my-px p-0 transition-background focus:bg-default/40 data-[hover=true]:bg-default/40',
											}}
										>
											{({href, label, sprite, spriteIndex}) => (
												<DropdownItem
													key={label}
													textValue={label}
													onKeyDown={checkA11yConfirmKey(() => {
														handlePress();
														router.push(href);
													})}
												>
													<NavbarLink
														fullWidth
														isActivated={href === pathname}
														href={href}
														startContent={
															<Sprite
																target={sprite}
																index={spriteIndex}
																size={1.25}
																className={cn({
																	'rounded-full': href === '/partners',
																})}
															/>
														}
														className="justify-start gap-1 text-small data-[hover=true]:bg-transparent"
													>
														{label}
													</NavbarLink>
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

			<NavbarContent justify="end" className="hidden basis-full md:flex md:basis-1/5">
				<NavbarItem>
					<GitHubLink showTooltip />
				</NavbarItem>
				<NavbarItem>
					<ThemeSwitcher />
				</NavbarItem>
			</NavbarContent>

			<NavbarContent as="div" justify="end" className="basis-1 pl-4 md:hidden">
				<ThemeSwitcher
					isMenu
					className={cn({
						'pointer-events-none h-0 w-0 opacity-0': !isMenuOpened,
					})}
				/>
				<Tooltip showArrow content={isMenuOpened ? '收起菜单' : '打开菜单'} placement="left">
					<NavbarMenuToggle
						onChange={vibrate}
						srOnlyText="打开或收起菜单"
						aria-label={isMenuOpened ? '收起菜单' : '打开菜单'}
					/>
				</Tooltip>
			</NavbarContent>

			<NavbarMenu className="px-10 pt-4">
				{navMenuItems.map(({href, label}, index) => {
					const isActivated = href === pathname;
					return href === '/preferences' && !shouldShowPreferences ? null : (
						<NavbarMenuItem key={index} isActive={isActivated}>
							<Link
								color={isActivated ? 'primary' : 'foreground'}
								size="lg"
								onClick={handlePress}
								href={href}
								className={cn({
									'underline underline-offset-4': isActivated || href === '/preferences',
								})}
							>
								{label}
							</Link>
						</NavbarMenuItem>
					);
				})}
				<NavbarMenuItem>
					<GitHubLink />
				</NavbarMenuItem>
			</NavbarMenu>
		</NextUINavbar>
	);
}
