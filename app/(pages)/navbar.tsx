'use client';

import {type JSX, type PropsWithChildren, memo, startTransition, useReducer} from 'react';
import {twJoin, twMerge} from 'tailwind-merge';

import {usePathname} from 'next/navigation';
import {useProgress} from 'react-transition-progress';

import {
	Button,
	type ButtonProps,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	Link,
	type LinkProps,
	NavbarBrand,
	NavbarContent,
	NavbarItem,
	NavbarMenu,
	NavbarMenuItem,
	NavbarMenuToggle,
	Navbar as NextUINavbar,
} from '@nextui-org/react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faGithub} from '@fortawesome/free-brands-svg-icons';
import {faChevronDown} from '@fortawesome/free-solid-svg-icons';

import Dropdown from '@/components/dropdown';
import FontAwesomeIconLink, {type IFontAwesomeIconLinkProps} from '@/components/fontAwesomeIconLink';
import ThemeSwitcher from '@/components/themeSwitcher';
import Sprite from '@/components/sprite';
import Tooltip from '@/components/tooltip';

import {type TSitePath, siteConfig} from '@/configs';
import {globalStore as store} from '@/stores';
import {toggleBoolean} from '@/utils';

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
	extends Pick<ButtonProps, 'className' | 'startContent' | 'fullWidth'>,
		Pick<LinkProps, 'href'> {
	isActivated: boolean;
}

const NavbarLink = memo<PropsWithChildren<INavbarLinkProps>>(function NavbarLink({
	className,
	isActivated,
	children,
	...props
}) {
	const startProgress = useProgress();

	return (
		<Button
			as={Link}
			size="sm"
			variant={isActivated ? 'flat' : 'light'}
			onPress={() => {
				showProgress(startProgress);
			}}
			className={twMerge('text-base', className)}
			{...props}
		>
			{children}
		</Button>
	);
});

interface IGitHubIconLinkProps extends Pick<IFontAwesomeIconLinkProps, 'className'> {}

const GitHubIconLink = memo<IGitHubIconLinkProps>(function IconLink({className}) {
	return (
		<FontAwesomeIconLink
			isExternal
			icon={faGithub}
			size="lg"
			href={links.github.href}
			aria-label={links.github.label}
			className={className}
		/>
	);
});

interface IGitHubLinkProps {
	showTooltip?: boolean;
}

const GitHubLink = memo<IGitHubLinkProps>(function GitHubLink({showTooltip}) {
	if (showTooltip) {
		return (
			<Tooltip showArrow content={links.github.label}>
				<span className="flex">
					<GitHubIconLink className="dark:text-default-500" />
				</span>
			</Tooltip>
		);
	}

	return (
		<span className="flex gap-1">
			<GitHubIconLink className="text-foreground" />
			<Link isExternal color="foreground" href={links.github.href} referrerPolicy="same-origin">
				{links.github.label}
			</Link>
		</span>
	);
});

export default function Navbar() {
	const pathname = usePathname() as TSitePath;
	const startProgress = useProgress();
	const [isMenuOpened, toggleMenuOpened] = useReducer(toggleBoolean, false);

	const isShowBackgroundImage = store.persistence.backgroundImage.use();

	// Support parallel routing pages.
	const shouldShowPreferences = pathname !== '/' && pathname !== '/about';

	return (
		<NextUINavbar
			isBordered
			shouldHideOnScroll
			isBlurred={isShowBackgroundImage}
			maxWidth="xl"
			isMenuOpen={isMenuOpened}
			onMenuOpenChange={toggleMenuOpened}
			classNames={{
				base: 'pt-titlebar',
			}}
		>
			<NavbarContent as="div" justify="start" className="basis-full md:basis-1/5">
				<NavbarBrand className="max-w-fit">
					<Link
						color="foreground"
						href={links.index.href}
						onPress={() => {
							showProgress(startProgress);
						}}
						aria-label={links.index.label}
						className="flex select-none items-center justify-start gap-1"
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
										classNames={{
											content: twJoin(
												'min-w-24 p-0',
												isShowBackgroundImage && 'bg-background/70 backdrop-saturate-150'
											),
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
											aria-label={`${dropdownLabel}列表`}
											itemClasses={{
												base: 'my-px p-0 transition-background data-[hover=true]:bg-default/40',
											}}
										>
											{dropdownItems.map(({href, label, sprite}, dropdownItemIndex) => (
												<DropdownItem key={dropdownItemIndex} textValue={label}>
													<NavbarLink
														fullWidth
														isActivated={href === pathname}
														href={href}
														startContent={<Sprite target={sprite} size={1.25} />}
														className="justify-start gap-1 text-sm data-[hover=true]:bg-transparent"
													>
														{label}
													</NavbarLink>
												</DropdownItem>
											))}
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
				<ThemeSwitcher isMenu />
				<Tooltip showArrow content={isMenuOpened ? '收起菜单' : '打开菜单'} placement="left">
					<NavbarMenuToggle aria-label={isMenuOpened ? '收起菜单' : '打开菜单'} />
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
								onPress={() => {
									showProgress(startProgress);
									toggleMenuOpened();
								}}
								href={href}
								className={twJoin(
									(isActivated || href === '/preferences') && 'underline underline-offset-4'
								)}
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
