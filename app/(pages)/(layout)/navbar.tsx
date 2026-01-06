'use client';

import {
	type JSX,
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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

import {
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	type IButtonProps,
	Link,
	Tooltip,
	cn,
	useReducedMotion,
} from '@/design/ui/components';

import { trackEvent } from '@/components/analytics';
import FontAwesomeIconLink, {
	type IFontAwesomeIconLinkProps,
} from '@/components/fontAwesomeIconLink';
import SiteInfo from '@/components/siteInfo';
import Sprite from '@/components/sprite';
import ThemeSwitcher from '@/components/themeSwitcher';

import { siteConfig } from '@/configs';
import { globalStore as store } from '@/stores';
import { checkA11yConfirmKey } from '@/utilities';

const { links, name, navItems, navMenuItems, shortName } = siteConfig;

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

interface IGitHubIconLinkProps extends Pick<
	IFontAwesomeIconLinkProps,
	'className' | 'tabIndex'
> {}

const GitHubIconLink = memo<IGitHubIconLinkProps>(function IconLink({
	className,
	tabIndex,
}) {
	const handlePress = useCallback(() => {
		trackEvent(trackEvent.category.click, 'Link', 'navbar:GitHub');
	}, []);

	return (
		<FontAwesomeIconLink
			isExternal
			icon={faGithub}
			size="lg"
			href={links.github.href}
			aria-label={links.github.label}
			aria-hidden={tabIndex === -1}
			role="button"
			tabIndex={tabIndex}
			onClick={handlePress}
			className={cn('h-5 w-5 rounded-full', className)}
		/>
	);
});

interface IGitHubLinkProps {
	showTooltip?: boolean;
}

const GitHubLink = memo<IGitHubLinkProps>(function GitHubLink({ showTooltip }) {
	const handlePress = useCallback(() => {
		trackEvent(trackEvent.category.click, 'Link', 'navbar:GitHub');
	}, []);

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
			<Link
				isExternal
				color="foreground"
				href={links.github.href}
				onClick={handlePress}
			>
				{links.github.label}
			</Link>
		</span>
	);
});

export default function Navbar() {
	const { pathname } = usePathname();
	const basePathname = `/${pathname.split('/')[1]}`;
	const router = useRouter();
	const startProgress = useProgress();
	const vibrate = useVibrate();
	const [isMenuOpened, setIsMenuOpened] = useState(false);
	const isReducedMotion = useReducedMotion();

	const isHighAppearance = store.persistence.highAppearance.use();

	const handlePress = useCallback(
		(href?: string) => {
			vibrate();
			showProgress(startProgress);
			setIsMenuOpened(false);
			if (href !== undefined) {
				router.push(href);
			}
		},
		[router, startProgress, vibrate]
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
				<NavbarItem>
					<GitHubLink showTooltip />
				</NavbarItem>
				<NavbarItem>
					<ThemeSwitcher />
				</NavbarItem>
			</NavbarContent>

			<NavbarContent
				as="div"
				justify="end"
				className="basis-1 pl-4 md:hidden"
			>
				<ThemeSwitcher
					isMenu
					className={cn({
						'pointer-events-none h-0 w-0 opacity-0': !isMenuOpened,
					})}
				/>
				<Tooltip
					showArrow
					content={isMenuOpened ? '收起菜单' : '打开菜单'}
					placement="left"
				>
					<NavbarMenuToggle
						onChange={vibrate}
						srOnlyText="打开或收起菜单"
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
								onClick={() => {
									handlePress();
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
			</NavbarMenu>
		</HeroUINavbar>
	);
}
