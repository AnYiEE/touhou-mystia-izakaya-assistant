'use client';

import {useReducer} from 'react';
import {usePathname} from 'next/navigation';

import {useMounted} from '@/hooks';

import {
	Button,
	Image,
	Link,
	Navbar as NextUINavbar,
	NavbarContent,
	NavbarMenu,
	NavbarMenuToggle,
	NavbarBrand,
	NavbarItem,
	NavbarMenuItem,
	Spinner,
	Tooltip,
} from '@nextui-org/react';
import {faGithub} from '@fortawesome/free-brands-svg-icons';

import FontAwesomeIconLink from '@/components/fontAwesomeIconLink';
import ThemeSwitcher from '@/components/themeSwitcher';

import {siteConfig} from '@/configs';

interface INavbarLinkProps {
	href: string;
	label: string;
	isActive: boolean;
}

function NavbarLink({href = '', label = '', isActive = false}: Partial<INavbarLinkProps>) {
	return (
		<Button as={Link} className="text-base" href={href} size="sm" variant={isActive ? 'faded' : 'light'}>
			{label}
		</Button>
	);
}

interface IGithubLinkProps {
	isShowTooltip: boolean;
}

function GithubLink({isShowTooltip = true}: Partial<IGithubLinkProps>) {
	const isMounted = useMounted();

	const IconLink = () => (
		<FontAwesomeIconLink
			ariaLabel={siteConfig.links.github.label}
			href={siteConfig.links.github.href}
			icon={faGithub}
			size="lg"
		/>
	);

	if (!isMounted) {
		return <Spinner color="default" size="sm" />;
	}

	if (isShowTooltip) {
		return (
			<Tooltip showArrow content={siteConfig.links.github.label}>
				<span className="flex">
					<IconLink />
				</span>
			</Tooltip>
		);
	}

	return <IconLink />;
}

export default function Navbar() {
	const pathname = usePathname();
	const [isMenuOpen, setMenuOpen] = useReducer((current) => !current, false);

	return (
		<NextUINavbar maxWidth="xl" position="sticky" isMenuOpen={isMenuOpen} onMenuOpenChange={setMenuOpen}>
			<NavbarContent justify="start" className="basis-1/5 sm:basis-full">
				<NavbarBrand as="li" className="max-w-fit gap-3">
					<Link color="foreground" className="flex select-none items-center justify-start gap-1" href="/">
						<Image alt="Logo" src="/favicon.png" className="w-8" />
						<p className="font-bold">
							<span className="hidden xl:inline">{siteConfig.name}</span>
							<span className="inline xl:hidden">{siteConfig.shortName}</span>
						</p>
					</Link>
				</NavbarBrand>
				<ul className="ml-2 hidden justify-start gap-4 sm:flex">
					{siteConfig.navItems.map(({href, label}) => {
						const isActive = href === pathname;
						return (
							<NavbarItem key={href} isActive={isActive}>
								<NavbarLink href={href} label={label} isActive={isActive} />
							</NavbarItem>
						);
					})}
				</ul>
			</NavbarContent>

			<NavbarContent justify="end" className="hidden basis-1/5 sm:flex sm:basis-full">
				<NavbarItem className="hidden gap-2 sm:flex">
					<GithubLink />
				</NavbarItem>
				<ThemeSwitcher />
			</NavbarContent>

			<NavbarContent justify="end" className="basis-1 pl-4 sm:hidden">
				<ThemeSwitcher />
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
									href={href}
									size="lg"
									onPress={() => setMenuOpen()}
								>
									{label}
								</Link>
							</NavbarMenuItem>
						);
					})}
					<NavbarMenuItem>
						<GithubLink isShowTooltip={false} />
					</NavbarMenuItem>
				</div>
			</NavbarMenu>
		</NextUINavbar>
	);
}
