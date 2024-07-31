'use client';

import {type JSX, type PropsWithChildren, memo, useCallback, useReducer} from 'react';
import {usePathname} from 'next/navigation';
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

import FontAwesomeIconLink from '@/components/fontAwesomeIconLink';
import ThemeSwitcher from '@/components/themeSwitcher';

import {siteConfig} from '@/configs';
import {toggleBoolean} from '@/utils';

const {links, name, navItems, navMenuItems, shortName} = siteConfig;

interface INavbarLinkProps extends Pick<ButtonProps, 'className' | 'fullWidth'>, Pick<LinkProps, 'href'> {
	label: ReactNodeWithoutBoolean;
	isActivated: boolean;
}

const NavbarLink = memo(function NavbarLink({
	className,
	fullWidth,
	href = '#',
	isActivated = false,
	label: children,
}: Partial<PropsWithChildren<INavbarLinkProps>>) {
	return (
		<Button
			as={Link}
			fullWidth={fullWidth}
			size="sm"
			variant={isActivated ? 'faded' : 'light'}
			href={href}
			role="link"
			className={twMerge('text-base', className)}
		>
			{children}
		</Button>
	);
});

interface IGithubLinkProps {
	showTooltip: boolean;
}

const GithubLink = memo(function GithubLink({showTooltip}: Partial<IGithubLinkProps>) {
	const IconLink = useCallback(
		({className}: {className?: string}) => (
			<FontAwesomeIconLink
				isExternal
				icon={faGithub}
				size="lg"
				href={links.github.href}
				aria-label={links.github.label}
				className={className}
			/>
		),
		[]
	);

	if (showTooltip) {
		return (
			<Tooltip showArrow content={links.github.label}>
				<span className="flex">
					<IconLink />
				</span>
			</Tooltip>
		);
	}

	return (
		<span className="flex gap-1">
			<IconLink className="text-foreground" />
			<Link isExternal color="foreground" href={links.github.href}>
				{links.github.label}
			</Link>
		</span>
	);
});

export default memo(function Navbar() {
	const pathname = usePathname();
	const [isMenuOpened, setMenuOpened] = useReducer(toggleBoolean, false);

	return (
		<NextUINavbar
			maxWidth="xl"
			position="sticky"
			isMenuOpen={isMenuOpened}
			onMenuOpenChange={setMenuOpened}
			classNames={{
				base: 'pt-titlebar',
			}}
		>
			<NavbarContent justify="start" className="basis-full md:basis-1/5">
				<NavbarBrand as="li" className="max-w-fit">
					<Link
						color="foreground"
						href="/"
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
										content: 'min-w-20 p-0',
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
										className="w-20"
										itemClasses={{
											base: 'my-px p-0',
										}}
									>
										{dropdownItems.map(({href, label}) => (
											<DropdownItem key={href} textValue={label}>
												<NavbarLink
													fullWidth
													isActivated={href === pathname}
													href={href}
													label={label}
													className="justify-start text-sm"
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
					<GithubLink showTooltip />
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
									onPress={setMenuOpened}
									href={href}
								>
									{label}
								</Link>
							</NavbarMenuItem>
						);
					})}
					<NavbarMenuItem>
						<GithubLink />
					</NavbarMenuItem>
				</div>
			</NavbarMenu>
		</NextUINavbar>
	);
});
