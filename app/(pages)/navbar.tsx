'use client';

import {type JSX, type PropsWithChildren, memo, startTransition, useReducer} from 'react';
import {usePathname} from 'next/navigation';
import {useProgress} from 'react-transition-progress';
import {twMerge} from 'tailwind-merge';

import {
	Button,
	type ButtonProps,
	Dropdown,
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
	Tooltip,
} from '@nextui-org/react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faGithub} from '@fortawesome/free-brands-svg-icons';
import {faChevronDown} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconLink, {type IFontAwesomeIconLinkProps} from '@/components/fontAwesomeIconLink';
import ThemeSwitcher from '@/components/themeSwitcher';
import Sprite from '@/components/sprite';

import {siteConfig} from '@/configs';
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
	label: ReactNodeWithoutBoolean;
	isActivated: boolean;
}

const NavbarLink = memo(function NavbarLink({
	className,
	fullWidth,
	href = '#',
	isActivated = false,
	label: children,
	startContent,
}: Partial<PropsWithChildren<INavbarLinkProps>>) {
	const startProgress = useProgress();

	return (
		<Button
			as={Link}
			fullWidth={fullWidth}
			size="sm"
			startContent={startContent}
			variant={isActivated ? 'faded' : 'light'}
			href={href}
			onPress={() => {
				showProgress(startProgress);
			}}
			role="link"
			className={twMerge('text-base', className)}
		>
			{children}
		</Button>
	);
});

interface IGitHubIconLinkProps extends Pick<IFontAwesomeIconLinkProps, 'className'> {}

const GitHubIconLink = memo(function IconLink({className}: IGitHubIconLinkProps) {
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
	showTooltip: boolean;
}

const GitHubLink = memo(function GitHubLink({showTooltip}: Partial<IGitHubLinkProps>) {
	if (showTooltip) {
		return (
			<Tooltip showArrow content={links.github.label}>
				<span className="flex">
					<GitHubIconLink />
				</span>
			</Tooltip>
		);
	}

	return (
		<span className="flex gap-1">
			<GitHubIconLink className="text-foreground" />
			<Link isExternal color="foreground" href={links.github.href}>
				{links.github.label}
			</Link>
		</span>
	);
});

export default memo(function Navbar() {
	const pathname = usePathname();
	const startProgress = useProgress();
	const [isMenuOpened, toggleMenuOpened] = useReducer(toggleBoolean, false);

	return (
		<NextUINavbar
			maxWidth="xl"
			position="sticky"
			isMenuOpen={isMenuOpened}
			onMenuOpenChange={toggleMenuOpened}
			classNames={{
				base: 'pt-titlebar',
			}}
		>
			<NavbarContent justify="start" className="basis-full md:basis-1/5">
				<NavbarBrand as="li" className="max-w-fit">
					<Link
						color="foreground"
						href="/"
						onPress={() => {
							showProgress(startProgress);
						}}
						aria-label="首页"
						className="flex select-none items-center justify-start gap-1"
					>
						<span
							role="img"
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
					{navItems.map((navItem) => {
						if ('href' in navItem) {
							const {href, label} = navItem;
							const isActivated = href === pathname;
							return (
								<NavbarItem key={href} isActive={isActivated}>
									<NavbarLink isActivated={isActivated} href={href} label={label} />
								</NavbarItem>
							);
						}
						return Object.entries(navItem).reduce<JSX.Element[]>((acc, [dropdownLabel, dropdownItems]) => {
							const isDropdownActivated = dropdownItems.some(({href}) => href === pathname);
							const dropdownElement = (
								<Dropdown
									key={dropdownLabel}
									classNames={{
										content: 'min-w-24 p-0',
									}}
								>
									<NavbarItem>
										<DropdownTrigger>
											<Button
												endContent={<FontAwesomeIcon icon={faChevronDown} size="sm" />}
												size="sm"
												variant={isDropdownActivated ? 'faded' : 'light'}
												className="border-none text-base"
											>
												{dropdownLabel}
											</Button>
										</DropdownTrigger>
									</NavbarItem>
									<DropdownMenu
										aria-label={`${dropdownLabel}列表`}
										itemClasses={{
											base: 'my-px p-0',
										}}
									>
										{dropdownItems.map(({href, label, sprite}) => (
											<DropdownItem key={href} textValue={label}>
												<NavbarLink
													fullWidth
													isActivated={href === pathname}
													href={href}
													label={label}
													startContent={<Sprite target={sprite} size={1.25} />}
													className="justify-start gap-1 text-sm"
												/>
											</DropdownItem>
										))}
									</DropdownMenu>
								</Dropdown>
							);
							return [...acc, dropdownElement];
						}, []);
					})}
				</ul>
			</NavbarContent>

			<NavbarContent justify="end" className="hidden basis-full md:flex md:basis-1/5">
				<NavbarItem className="flex gap-2">
					<GitHubLink showTooltip />
				</NavbarItem>
				<ThemeSwitcher />
			</NavbarContent>

			<NavbarContent justify="end" className="basis-1 pl-4 md:hidden">
				<ThemeSwitcher isMenu />
				<Tooltip showArrow content={isMenuOpened ? '收起菜单' : '打开菜单'} placement="left">
					<NavbarMenuToggle aria-label={isMenuOpened ? '收起菜单' : '打开菜单'} />
				</Tooltip>
			</NavbarContent>

			<NavbarMenu>
				<div className="mx-4 mt-2 flex flex-col gap-2">
					{navMenuItems.map(({href, label}) => {
						const isActivated = href === pathname;
						return (
							<NavbarMenuItem key={href} isActive={isActivated}>
								<Link
									color={isActivated ? 'primary' : 'foreground'}
									size="lg"
									onPress={() => {
										showProgress(startProgress);
										toggleMenuOpened();
									}}
									href={href}
								>
									{label}
								</Link>
							</NavbarMenuItem>
						);
					})}
					<NavbarMenuItem>
						<GitHubLink />
					</NavbarMenuItem>
				</div>
			</NavbarMenu>
		</NextUINavbar>
	);
});
