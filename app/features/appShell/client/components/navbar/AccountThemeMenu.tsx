import { faChevronDown, faUser } from '@fortawesome/free-solid-svg-icons';
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

import Button from '@/design/ui/components/button';
import Dropdown, {
	DropdownItem,
	DropdownMenu,
	DropdownSection,
	DropdownTrigger,
} from '@/design/ui/components/dropdown';
import { toSelectionKeySet } from '@/design/ui/components/selectionKeys';

import { checkA11yConfirmKey } from '@/shared/utilities/interaction/checkA11yConfirmKey';

import { type INavbarPaletteItem, NAVBAR_THEME_ITEMS } from './themeItems';

const ACCOUNT_ACTION_MENU_ITEM_CLASS_NAME =
	'flex min-w-0 items-center gap-1 py-0.5 text-small';
const ACCOUNT_ACTION_MENU_SECTION_CLASS_NAMES = {
	base: 'mb-0',
	divider: 'mx-1 my-1 bg-default-200/70',
	group: 'space-y-1',
	heading:
		'block px-2 pb-0.5 pt-2.5 text-tiny font-medium uppercase text-default-500',
};
const ACCOUNT_THEME_MENU_ITEM_CLASSES = {
	base: 'my-px transition-background focus:bg-default/40 data-[hover=true]:bg-default/40 data-[selectable=true]:focus:bg-default/40 motion-reduce:transition-none',
} as const;

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
			]),
		[paletteItems.length, selectedPaletteKey, selectedThemeKeys]
	);

	const dropdownClassNames = useMemo(
		() => ({
			content: cn('m-1 min-w-36 max-w-36 p-1', {
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
			aria-label="账号和主题"
			itemClasses={ACCOUNT_THEME_MENU_ITEM_CLASSES}
		>
			{[
				<DropdownSection
					key="account"
					title={
						/* HeroUI intersects its collection title with the DOM title string. */
						(
							<span className="inline-flex w-full items-center justify-between gap-2">
								<span>账号</span>
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
					classNames={ACCOUNT_ACTION_MENU_SECTION_CLASS_NAMES}
				>
					<DropdownItem
						key="account"
						closeOnSelect={false}
						data-account-action="true"
						onKeyDown={accountActionKeyDown}
						textValue={accountActionLabel}
					>
						<div className={ACCOUNT_ACTION_MENU_ITEM_CLASS_NAME}>
							<FontAwesomeIcon
								icon={faUser}
								className="w-4 shrink-0"
							/>
							<span className="min-w-0 truncate">
								{accountActionLabel}
							</span>
						</div>
					</DropdownItem>
				</DropdownSection>,
				<DropdownSection
					key="themes"
					showDivider={paletteItems.length > 0}
					title="主题"
					classNames={ACCOUNT_ACTION_MENU_SECTION_CLASS_NAMES}
				>
					{NAVBAR_THEME_ITEMS.map(({ icon, key, label }) => (
						<DropdownItem key={key} textValue={label}>
							<div
								className={ACCOUNT_ACTION_MENU_ITEM_CLASS_NAME}
							>
								<FontAwesomeIcon icon={icon} className="w-4" />
								{label}
							</div>
						</DropdownItem>
					))}
				</DropdownSection>,
				...(paletteItems.length > 0
					? [
							<DropdownSection
								key="palettes"
								items={paletteItems}
								title="主题配色"
								classNames={
									ACCOUNT_ACTION_MENU_SECTION_CLASS_NAMES
								}
							>
								{({ key, label, swatchClassName }) => (
									<DropdownItem
										key={key}
										closeOnSelect={false}
										textValue={label}
									>
										<div
											className={
												ACCOUNT_ACTION_MENU_ITEM_CLASS_NAME
											}
										>
											<span
												aria-hidden="true"
												className={cn(
													'h-3.5 w-3.5 rounded-full',
													swatchClassName
												)}
											/>
											{label}
										</div>
									</DropdownItem>
								)}
							</DropdownSection>,
						]
					: []),
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
						aria-label="账号和主题"
						title="账号和主题"
						className="gap-1 text-base"
					>
						<FontAwesomeIcon icon={faUser} className="w-3.5" />
						<span className="relative mr-1">
							账号
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
