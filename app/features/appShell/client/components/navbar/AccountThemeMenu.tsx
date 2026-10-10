import {
	faChevronDown,
	faGlobe,
	faUser,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NavbarItem } from '@heroui/navbar';
import { cn } from '@heroui/theme';
import debounce from 'lodash/debounce.js';
import {
	type Key,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import { PALETTE_MESSAGE_KEYS, themeMessages } from '@/design/theme/messages';
import Button from '@/design/ui/components/button';
import Dropdown, {
	DropdownItem,
	DropdownMenu,
	DropdownSection,
	DropdownTrigger,
} from '@/design/ui/components/dropdown';
import { toSelectionKeySet } from '@/design/ui/components/selectionKeys';

import { appShellMessages } from '@/features/appShell/client/messages';
import {
	LOCALE_MENU_ITEMS,
	resolveLocaleMenuPreference,
	toLocaleMenuKey,
} from '@/features/preferences/client/localeMenuItems';
import { preferencesMessages } from '@/features/preferences/client/messages';
import {
	setLocalePreference,
	useLocalePreference,
} from '@/features/preferences/client/state/localeRuntime';

import { SYSTEM_LOCALE_PREFERENCE } from '@/shared/i18n/locale';
import { useI18n } from '@/shared/i18n/useI18n';
import { checkA11yConfirmKey } from '@/shared/utilities/interaction/checkA11yConfirmKey';

import {
	NAVIGATION_CARD_ACTIVE_CLASS_NAME,
	NAVIGATION_CARD_BASE_CLASS_NAME,
	NAVIGATION_CARD_INACTIVE_CLASS_NAME,
	NAVIGATION_ICON_FRAME_ACTIVE_CLASS_NAME,
	NAVIGATION_ICON_FRAME_CLASS_NAME,
} from './navigationCardStyles';
import { type INavbarPaletteItem, NAVBAR_THEME_ITEMS } from './themeItems';

const ACCOUNT_ACTION_CARD_CLASS_NAME =
	'flex min-h-10 w-full min-w-0 items-center gap-1 px-1.5 py-1';
const PANEL_CARD_CLASS_NAME =
	'flex min-h-10 w-full min-w-0 items-center gap-1 px-1.5 py-1 text-left';
const PANEL_CARD_LABEL_CLASS_NAME = 'min-w-0 text-tiny font-medium leading-4';
const PANEL_ICON_FRAME_INACTIVE_CLASS_NAME =
	'bg-default-100/70 text-foreground-500 dark:bg-default-50/20';
const PANEL_MENU_ITEM_CLASSES = {
	base: 'my-px p-0 data-[hover=true]:bg-transparent data-[selectable=true]:focus:bg-transparent',
} as const;
const PANEL_SECTION_CLASS_NAMES = {
	base: 'mb-0',
	divider: 'mx-1 my-1 bg-default-200/70',
	group: 'grid grid-cols-[repeat(3,6.75rem)] gap-1',
	heading: 'block px-1 pb-1 pt-2 text-tiny font-medium text-foreground-500',
};
const PANEL_SINGLE_SECTION_CLASS_NAMES = {
	...PANEL_SECTION_CLASS_NAMES,
	group: 'grid grid-cols-1 gap-1',
};

interface IProps {
	accountActionLabel: string;
	accountMenuDisabledKeys: ReadonlyArray<string>;
	accountSyncPauseLabel: string | null;
	isAccountSyncPaused: boolean;
	isHighAppearance: boolean;
	onAction: (key: Key) => void;
	onOpenChange: (isOpen: boolean) => void;
	paletteItems: ReadonlyArray<INavbarPaletteItem>;
	selectedPaletteKey: string;
	selectedThemeKeys: ReadonlyArray<string>;
}

export default function AccountThemeMenu({
	accountActionLabel,
	accountMenuDisabledKeys,
	accountSyncPauseLabel,
	isAccountSyncPaused,
	isHighAppearance,
	onAction,
	onOpenChange,
	paletteItems,
	selectedPaletteKey,
	selectedThemeKeys,
}: IProps) {
	const [isOpen, setIsOpen] = useState(false);
	const menuElementRef = useRef<HTMLElement | null>(null);
	const localePreference = useLocalePreference();
	const { t: tAppShell } = useI18n(appShellMessages);
	const { t: tPreferences } = useI18n(preferencesMessages);
	const { t: tTheme } = useI18n(themeMessages);
	const isAccountActionDisabled = accountMenuDisabledKeys.includes('account');
	const handleOpenChange = useCallback(
		(nextIsOpen: boolean) => {
			setIsOpen(nextIsOpen);
			onOpenChange(nextIsOpen);
		},
		[onOpenChange]
	);
	const handleAccountAction = useCallback(() => {
		if (isAccountActionDisabled) {
			return;
		}
		handleOpenChange(false);
		onAction('account');
	}, [handleOpenChange, isAccountActionDisabled, onAction]);
	const handleMenuAction = useCallback(
		(key: Key) => {
			const nextLocalePreference = resolveLocaleMenuPreference(key);
			if (nextLocalePreference !== null) {
				setLocalePreference(nextLocalePreference);
				return;
			}
			if (String(key) !== 'account') {
				onAction(key);
			}
		},
		[onAction]
	);
	const handleMenuClickCapture = useCallback(
		(event: MouseEvent) => {
			const { target } = event;
			if (
				target instanceof Element &&
				target.closest('[data-account-action="true"]') !== null
			) {
				handleAccountAction();
			}
		},
		[handleAccountAction]
	);
	const setMenuElementRef = useCallback(
		(menuElement: HTMLElement | null) => {
			menuElementRef.current?.removeEventListener(
				'click',
				handleMenuClickCapture,
				true
			);
			menuElement?.addEventListener(
				'click',
				handleMenuClickCapture,
				true
			);
			menuElementRef.current = menuElement;
		},
		[handleMenuClickCapture]
	);

	const accountActionKeyDown = useMemo(
		() => debounce(checkA11yConfirmKey(handleAccountAction)),
		[handleAccountAction]
	);

	useEffect(
		() => () => {
			accountActionKeyDown.cancel();
		},
		[accountActionKeyDown]
	);

	const selectedKeys = useMemo(
		() =>
			toSelectionKeySet([
				...selectedThemeKeys,
				...(paletteItems.length > 0 ? [selectedPaletteKey] : []),
				toLocaleMenuKey(localePreference),
			]),
		[
			localePreference,
			paletteItems.length,
			selectedPaletteKey,
			selectedThemeKeys,
		]
	);

	const dropdownClassNames = useMemo(
		() => ({
			content: cn('m-1 p-1', {
				'bg-background/70 backdrop-saturate-150': isHighAppearance,
			}),
		}),
		[isHighAppearance]
	);

	const menu = (
		<DropdownMenu
			ref={setMenuElementRef}
			disabledKeys={accountMenuDisabledKeys}
			disallowEmptySelection
			onAction={handleMenuAction}
			selectedKeys={selectedKeys}
			selectionMode="multiple"
			aria-label={tAppShell('appShell.accountTheme.aria')}
			itemClasses={PANEL_MENU_ITEM_CLASSES}
		>
			{[
				<DropdownSection
					key="account"
					title={
						/* HeroUI intersects its collection title with the DOM title string. */
						(
							<span className="inline-flex w-full items-center justify-between gap-2">
								<span>
									{tAppShell('appShell.accountTheme.account')}
								</span>
								{accountSyncPauseLabel !== null && (
									<span className="rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-normal leading-none text-warning-700 dark:text-warning">
										{accountSyncPauseLabel}
									</span>
								)}
							</span>
						) as unknown as string
					}
					hideSelectedIcon
					showDivider
					classNames={PANEL_SINGLE_SECTION_CLASS_NAMES}
				>
					<DropdownItem
						key="account"
						closeOnSelect={false}
						data-account-action="true"
						onKeyDown={accountActionKeyDown}
						textValue={accountActionLabel}
					>
						<div
							className={cn(
								ACCOUNT_ACTION_CARD_CLASS_NAME,
								NAVIGATION_CARD_BASE_CLASS_NAME,
								NAVIGATION_CARD_INACTIVE_CLASS_NAME
							)}
						>
							<span
								className={cn(
									NAVIGATION_ICON_FRAME_CLASS_NAME,
									'h-7 w-7',
									PANEL_ICON_FRAME_INACTIVE_CLASS_NAME
								)}
							>
								<FontAwesomeIcon
									icon={faUser}
									className="w-3.5"
								/>
							</span>
							<span className="min-w-0 truncate text-tiny font-medium leading-4">
								{accountActionLabel}
							</span>
						</div>
					</DropdownItem>
				</DropdownSection>,
				<DropdownSection
					key="themes"
					showDivider
					title={tPreferences('preferences.theme.section')}
					classNames={PANEL_SECTION_CLASS_NAMES}
				>
					{NAVBAR_THEME_ITEMS.map(({ icon, key, labelKey }) => {
						const isSelected = selectedThemeKeys.includes(key);
						const label = tTheme(labelKey);
						return (
							<DropdownItem key={key} textValue={label}>
								<div
									className={cn(
										PANEL_CARD_CLASS_NAME,
										NAVIGATION_CARD_BASE_CLASS_NAME,
										isSelected
											? NAVIGATION_CARD_ACTIVE_CLASS_NAME
											: NAVIGATION_CARD_INACTIVE_CLASS_NAME
									)}
								>
									<span
										className={cn(
											NAVIGATION_ICON_FRAME_CLASS_NAME,
											'h-7 w-7',
											isSelected
												? NAVIGATION_ICON_FRAME_ACTIVE_CLASS_NAME
												: PANEL_ICON_FRAME_INACTIVE_CLASS_NAME
										)}
									>
										<FontAwesomeIcon
											icon={icon}
											className="w-4"
										/>
									</span>
									<span
										className={PANEL_CARD_LABEL_CLASS_NAME}
									>
										{label}
									</span>
								</div>
							</DropdownItem>
						);
					})}
				</DropdownSection>,
				...(paletteItems.length > 0
					? [
							<DropdownSection
								key="palettes"
								items={paletteItems}
								showDivider
								title={tPreferences(
									'preferences.palette.section'
								)}
								classNames={PANEL_SECTION_CLASS_NAMES}
							>
								{({ key, palette, swatchClassName }) => {
									const isSelected =
										selectedPaletteKey === key;
									const label = tTheme(
										PALETTE_MESSAGE_KEYS[palette]
									);
									return (
										<DropdownItem
											key={key}
											closeOnSelect={false}
											textValue={label}
										>
											<div
												className={cn(
													PANEL_CARD_CLASS_NAME,
													NAVIGATION_CARD_BASE_CLASS_NAME,
													isSelected
														? NAVIGATION_CARD_ACTIVE_CLASS_NAME
														: NAVIGATION_CARD_INACTIVE_CLASS_NAME
												)}
											>
												<span
													aria-hidden="true"
													className={cn(
														'mx-0.5 h-3.5 w-3.5 shrink-0 rounded-full',
														swatchClassName
													)}
												/>
												<span
													className={
														PANEL_CARD_LABEL_CLASS_NAME
													}
												>
													{label}
												</span>
											</div>
										</DropdownItem>
									);
								}}
							</DropdownSection>,
						]
					: []),
				<DropdownSection
					key="locales"
					title={tPreferences('preferences.language.section')}
					classNames={PANEL_SECTION_CLASS_NAMES}
				>
					{LOCALE_MENU_ITEMS.map(({ key, label, preference }) => {
						const isSelected = localePreference === preference;
						const itemLabel =
							preference === SYSTEM_LOCALE_PREFERENCE
								? tPreferences('preferences.locale.system')
								: label;
						return (
							<DropdownItem key={key} textValue={itemLabel}>
								<div
									className={cn(
										PANEL_CARD_CLASS_NAME,
										NAVIGATION_CARD_BASE_CLASS_NAME,
										isSelected
											? NAVIGATION_CARD_ACTIVE_CLASS_NAME
											: NAVIGATION_CARD_INACTIVE_CLASS_NAME
									)}
								>
									<span
										className={cn(
											NAVIGATION_ICON_FRAME_CLASS_NAME,
											'h-7 w-7',
											isSelected
												? NAVIGATION_ICON_FRAME_ACTIVE_CLASS_NAME
												: PANEL_ICON_FRAME_INACTIVE_CLASS_NAME
										)}
									>
										<FontAwesomeIcon
											icon={faGlobe}
											className="w-3.5"
										/>
									</span>
									<span
										className={PANEL_CARD_LABEL_CLASS_NAME}
									>
										{itemLabel}
									</span>
								</div>
							</DropdownItem>
						);
					})}
				</DropdownSection>,
			]}
		</DropdownMenu>
	);

	return (
		<NavbarItem>
			<Dropdown
				isOpen={isOpen}
				shouldCloseOnScroll
				onOpenChange={handleOpenChange}
				classNames={dropdownClassNames}
			>
				<DropdownTrigger>
					<Button
						size="sm"
						variant="light"
						aria-label={tAppShell('appShell.accountTheme.aria')}
						title={tAppShell('appShell.accountTheme.aria')}
						className="gap-1 text-base"
					>
						<FontAwesomeIcon icon={faUser} className="w-3.5" />
						<span className="relative mr-1">
							{tAppShell('appShell.accountTheme.account')}
							{isAccountSyncPaused && (
								<span
									aria-hidden="true"
									className="absolute -right-2 top-0 h-2 w-2 rounded-full bg-warning"
								/>
							)}
						</span>
						<FontAwesomeIcon
							icon={faChevronDown}
							size="sm"
							className="w-3 opacity-70"
						/>
					</Button>
				</DropdownTrigger>
				{menu}
			</Dropdown>
		</NavbarItem>
	);
}
