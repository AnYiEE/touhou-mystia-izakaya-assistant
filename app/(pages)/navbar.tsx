'use client';

import {type PropsWithChildren, type ReactNode, memo, useCallback, useReducer} from 'react';
import {usePathname} from 'next/navigation';
import clsx from 'clsx';

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

interface INavbarLinkProps extends Pick<LinkProps, 'href'> {
	label: ReactNode;
	isActive: boolean;
}

const NavbarLink = memo(function NavbarLink({
	href = '#',
	isActive = false,
	label: children,
}: Partial<PropsWithChildren<INavbarLinkProps>>) {
	return (
		<Button as={Link} size="sm" variant={isActive ? 'faded' : 'light'} href={href} className="text-base">
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
				aria-label={siteConfig.links.github.label}
				href={siteConfig.links.github.href}
				className={className}
			/>
		),
		[]
	);

	if (showTooltip) {
		return (
			<Tooltip showArrow content={siteConfig.links.github.label}>
				<span className="flex">
					<IconLink />
				</span>
			</Tooltip>
		);
	}

	return (
		<span className="flex gap-1">
			<IconLink className="text-foreground" />
			<Link isExternal color="foreground" href={siteConfig.links.github.href}>
				{siteConfig.links.github.label}
			</Link>
		</span>
	);
});

export default memo(function Navbar() {
	const pathname = usePathname();
	const [isMenuOpen, setMenuOpen] = useReducer((current) => !current, false);

	return (
		<NextUINavbar maxWidth="xl" position="sticky" isMenuOpen={isMenuOpen} onMenuOpenChange={setMenuOpen}>
			<NavbarContent justify="start" className="basis-full md:basis-1/5">
				<NavbarBrand as="li" className="max-w-fit gap-3">
					<Link color="foreground" href="/" className="flex select-none items-center justify-start gap-1">
						<span className={clsx(styles['logo'], 'h-10 w-10 rounded-full')} title={shortName} />
						<p className="font-bold">
							<span className="hidden lg:inline">{siteConfig.name}</span>
							<span className="inline lg:hidden">{siteConfig.shortName}</span>
						</p>
					</Link>
				</NavbarBrand>
				<ul className="ml-2 hidden justify-start gap-4 md:flex">
					{siteConfig.navItems.map(({href, label}) => {
						const isActive = href === pathname;
						return (
							<NavbarItem key={href} isActive={isActive}>
								<NavbarLink isActive={isActive} href={href} label={label} />
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
				<NavbarMenuToggle />
			</NavbarContent>

			<NavbarMenu>
				<div className="mx-4 mt-2 flex flex-col gap-2">
					{siteConfig.navMenuItems.map(({href, label}) => {
						const isActive = href === pathname;
						return (
							<NavbarMenuItem key={href} isActive={isActive}>
								<Link
									color={isActive ? 'primary' : 'foreground'}
									size="lg"
									onPress={setMenuOpen}
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
