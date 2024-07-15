'use client';

import {type PropsWithChildren, memo, useCallback, useReducer} from 'react';
import {usePathname} from 'next/navigation';
import clsx from 'clsx/lite';

import {
	Button,
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
import {faGithub} from '@fortawesome/free-brands-svg-icons';

import FontAwesomeIconLink from '@/components/fontAwesomeIconLink';
import ThemeSwitcher from '@/components/themeSwitcher';

import {siteConfig} from '@/configs';

import styles from './navbar.module.scss';

const {links, name, navItems, navMenuItems, shortName} = siteConfig;

interface INavbarLinkProps extends Pick<LinkProps, 'href'> {
	label: ReactNodeWithoutBoolean;
	isActive: boolean;
}

const NavbarLink = memo(function NavbarLink({
	href = '#',
	isActive = false,
	label: children,
}: Partial<PropsWithChildren<INavbarLinkProps>>) {
	return (
		<Button
			as={Link}
			size="sm"
			variant={isActive ? 'faded' : 'light'}
			href={href}
			role="link"
			className="text-base"
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
	const [isMenuOpened, setMenuOpened] = useReducer((current) => !current, false);

	return (
		<NextUINavbar
			maxWidth="xl"
			position="sticky"
			isMenuOpen={isMenuOpened}
			onMenuOpenChange={setMenuOpened}
			classNames={{
				base: 'pt-[env(titlebar-area-height,0rem)]',
			}}
		>
			<NavbarContent justify="start" className="basis-full md:basis-1/5">
				<NavbarBrand as="li" className="max-w-fit gap-3">
					<Link
						color="foreground"
						href="/"
						aria-label="首页"
						className="flex select-none items-center justify-start gap-1"
					>
						<span role="img" title={shortName} className={clsx(styles['logo'], 'h-10 w-10 rounded-full')} />
						<p className="font-bold">
							<span className="hidden lg:inline">{name}</span>
							<span className="inline lg:hidden">{shortName}</span>
						</p>
					</Link>
				</NavbarBrand>
				<ul className="hidden justify-start gap-4 pl-2 md:flex">
					{navItems.map(({href, label}) => {
						const isActivated = href === pathname;
						return (
							<NavbarItem key={href} isActive={isActivated}>
								<NavbarLink isActive={isActivated} href={href} label={label} />
							</NavbarItem>
						);
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
