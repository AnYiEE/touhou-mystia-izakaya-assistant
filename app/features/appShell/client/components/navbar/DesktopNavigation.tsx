import {
	faChevronDown,
	faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NavbarBrand, NavbarContent, NavbarItem } from '@heroui/navbar';
import { cn } from '@heroui/theme';
import {
	type Key,
	type PropsWithChildren,
	memo,
	useCallback,
	useMemo,
} from 'react';

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
import {
	NAVIGATION_CARD_ACTIVE_CLASS_NAME,
	NAVIGATION_CARD_BASE_CLASS_NAME,
	NAVIGATION_CARD_INACTIVE_CLASS_NAME,
	NAVIGATION_ICON_FRAME_ACTIVE_CLASS_NAME,
	NAVIGATION_ICON_FRAME_CLASS_NAME,
	NAVIGATION_ICON_FRAME_INACTIVE_CLASS_NAME,
} from './navigationCardStyles';
import type { INavbarPaletteItem } from './themeItems';

const { baseURL } = PUBLIC_RUNTIME_CONFIG;
const links = SITE_LINKS;
const { name, shortName } = SITE_METADATA;
const navItems = NAV_ITEMS;

const NAVIGATION_MENU_ITEM_CLASSES = {
	base: 'p-0 data-[hover=true]:bg-transparent data-[selectable=true]:focus:bg-transparent',
} as const;

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
	paletteItems: ReadonlyArray<INavbarPaletteItem>;
	searchShortcutLabel: string;
	selectedPaletteKey: string;
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
	paletteItems,
	searchShortcutLabel,
	selectedPaletteKey,
	selectedThemeKeys,
	shouldShowAccountAction,
	shouldShowPreferences,
}: IProps) {
	const handleMenuAction = useCallback(
		(key: Key) => {
			if (typeof key === 'string') {
				onNavigate(key);
			}
		},
		[onNavigate]
	);

	const dropdownClassNames = useMemo(
		() => ({
			content: cn('p-0', {
				'bg-background/70 backdrop-saturate-150': isHighAppearance,
			}),
		}),
		[isHighAppearance]
	);

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
										classNames={dropdownClassNames}
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
											onAction={handleMenuAction}
											aria-label={`${dropdownLabel}列表`}
											classNames={{
												base: 'min-w-0 p-1',
												list: 'grid grid-cols-[repeat(3,6.75rem)] gap-1',
											}}
											itemClasses={
												NAVIGATION_MENU_ITEM_CLASSES
											}
										>
											{({
												href,
												label,
												sprite,
												spriteRecordId,
											}) => {
												const isActivated =
													href === basePathname;

												return (
													<DropdownItem
														key={href}
														textValue={label}
													>
														<Button
															fullWidth
															size="sm"
															variant="light"
															onKeyDown={checkA11yConfirmKey()}
															onPressStart={(
																event
															) => {
																event.continuePropagation();
															}}
															aria-current={
																isActivated
																	? 'page'
																	: undefined
															}
															role="link"
															className={cn(
																'group flex h-10 min-h-0 w-full min-w-0 items-center justify-start gap-1 px-1.5 py-1 text-left',
																NAVIGATION_CARD_BASE_CLASS_NAME,
																isActivated
																	? NAVIGATION_CARD_ACTIVE_CLASS_NAME
																	: NAVIGATION_CARD_INACTIVE_CLASS_NAME
															)}
														>
															<span
																className={cn(
																	NAVIGATION_ICON_FRAME_CLASS_NAME,
																	'h-7 w-7',
																	isActivated
																		? NAVIGATION_ICON_FRAME_ACTIVE_CLASS_NAME
																		: NAVIGATION_ICON_FRAME_INACTIVE_CLASS_NAME
																)}
															>
																<Sprite
																	target={
																		sprite
																	}
																	recordId={
																		spriteRecordId
																	}
																	size={1.25}
																	className={cn(
																		{
																			'rounded-full':
																				href ===
																				'/partners',
																		}
																	)}
																/>
															</span>
															<span className="min-w-0 truncate text-tiny font-medium leading-5">
																{label}
															</span>
														</Button>
													</DropdownItem>
												);
											}}
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
						paletteItems={paletteItems}
						selectedPaletteKey={selectedPaletteKey}
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
