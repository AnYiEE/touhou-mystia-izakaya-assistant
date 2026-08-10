import {
	faChevronDown,
	faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NavbarBrand, NavbarContent, NavbarItem } from '@heroui/navbar';
import { cn } from '@heroui/theme';
import { type Key, type PropsWithChildren, memo } from 'react';

import Button, { type IButtonProps } from '@/design/ui/components/button';
import Dropdown, {
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
} from '@/design/ui/components/dropdown';
import Link from '@/design/ui/components/link';
import SiteInfo from '@/design/ui/components/siteInfo';
import Tooltip from '@/design/ui/components/tooltip';

import { SITE_LINKS } from '@/features/appShell/links';
import { NAV_ITEMS } from '@/features/appShell/navigation/config';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import ThemeSwitcher from '@/features/preferences/client/components/ThemeSwitcher';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

import { SITE_METADATA } from '@/shared/site/metadata';
import { checkA11yConfirmKey } from '@/shared/utilities/interaction/checkA11yConfirmKey';

import AccountThemeMenu from './AccountThemeMenu';

const { baseURL } = PUBLIC_RUNTIME_CONFIG;
const links = SITE_LINKS;
const { name, shortName } = SITE_METADATA;
const navItems = NAV_ITEMS;

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

interface IProps {
	accountActionLabel: string;
	accountMenuDisabledKeys: ReadonlyArray<string>;
	accountSyncPauseLabel: string | null;
	basePathname: string;
	isAccountSyncPaused: boolean;
	isHighAppearance: boolean;
	onAccountThemeAction: (key: Key) => void;
	onDropdownOpenChange: (isOpen: boolean) => void;
	onNavigate: (href?: string) => void;
	onSearchPress: () => void;
	searchShortcutLabel: string;
	selectedThemeKeys: ReadonlyArray<string>;
	shouldShowAccountAction: boolean;
	shouldShowPreferences: boolean;
}

export default function DesktopNavigation({
	accountActionLabel,
	accountMenuDisabledKeys,
	accountSyncPauseLabel,
	basePathname,
	isAccountSyncPaused,
	isHighAppearance,
	onAccountThemeAction,
	onDropdownOpenChange,
	onNavigate,
	onSearchPress,
	searchShortcutLabel,
	selectedThemeKeys,
	shouldShowAccountAction,
	shouldShowPreferences,
}: IProps) {
	return (
		<>
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
							onNavigate();
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
							baseUrl={baseURL}
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
											onNavigate(href);
										}}
									>
										{label}
									</NavbarButtonLink>
								</NavbarItem>
							);
						}
						return Object.entries(navItem).map(
							([dropdownLabel, dropdownItems], dropdownIndex) => {
								const isDropdownActivated = dropdownItems.some(
									({ href }) => href === basePathname
								);
								const dropdownElement = (
									<Dropdown
										key={dropdownIndex}
										shouldCloseOnScroll
										onOpenChange={onDropdownOpenChange}
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
												onNavigate(key as string);
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
								return dropdownElement;
							}
						);
					})}
				</ul>
			</NavbarContent>

			<NavbarContent
				justify="end"
				className="hidden basis-full md:flex md:basis-1/5"
			>
				<NavbarItem>
					<Tooltip
						showArrow
						placement="left"
						content={
							<span className="flex items-center gap-1">
								搜索
								<kbd className="rounded-small bg-default/40 px-1 py-0.5 text-tiny">
									{searchShortcutLabel}
								</kbd>
								<span className="text-tiny text-foreground-400">
									或
								</span>
								<kbd className="rounded-small bg-default/40 px-1 py-0.5 text-tiny">
									/
								</kbd>
							</span>
						}
					>
						<Button
							isIconOnly
							size="sm"
							variant="light"
							aria-label="搜索"
							onPress={() => {
								onSearchPress();
							}}
							className="text-base"
						>
							<FontAwesomeIcon
								icon={faMagnifyingGlass}
								className="w-4"
							/>
						</Button>
					</Tooltip>
				</NavbarItem>
				{shouldShowAccountAction ? (
					<AccountThemeMenu
						accountActionLabel={accountActionLabel}
						accountMenuDisabledKeys={accountMenuDisabledKeys}
						accountSyncPauseLabel={accountSyncPauseLabel}
						isAccountSyncPaused={isAccountSyncPaused}
						isHighAppearance={isHighAppearance}
						onAction={onAccountThemeAction}
						onOpenChange={onDropdownOpenChange}
						selectedThemeKeys={selectedThemeKeys}
					/>
				) : (
					<NavbarItem>
						<ThemeSwitcher />
					</NavbarItem>
				)}
			</NavbarContent>
		</>
	);
}
