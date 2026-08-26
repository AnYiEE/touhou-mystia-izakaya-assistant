import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	NavbarContent,
	NavbarMenu,
	NavbarMenuItem,
	NavbarMenuToggle,
} from '@heroui/navbar';
import { cn } from '@heroui/theme';

import Button from '@/design/ui/components/button';
import Tooltip from '@/design/ui/components/tooltip';

import MobileAccountActionButton from '@/features/account/client/components/MobileAccountActionButton';
import Sprite from '@/features/catalog/shared/client/components/Sprite';

import {
	type IMobileIconNavItem,
	MOBILE_GUEST_NAV_ITEMS,
	MOBILE_QUERY_NAV_GROUPS,
	MOBILE_UTILITY_NAV_ITEMS,
	type TMobileSpriteNavItem,
} from './navigationItems';
import {
	NAVIGATION_CARD_ACTIVE_CLASS_NAME,
	NAVIGATION_CARD_BASE_CLASS_NAME,
	NAVIGATION_CARD_INACTIVE_CLASS_NAME,
	NAVIGATION_ICON_FRAME_ACTIVE_CLASS_NAME,
	NAVIGATION_ICON_FRAME_CLASS_NAME,
	NAVIGATION_ICON_FRAME_INACTIVE_CLASS_NAME,
} from './navigationCardStyles';
import { type INavbarPaletteItem, NAVBAR_THEME_ITEMS } from './themeItems';

const MOBILE_SECTION_TITLE_CLASS_NAME =
	'px-1 text-small font-medium text-foreground-500 dark:text-foreground-400';

interface IProps {
	accountActionLabel: string;
	accountSyncPauseLabel: string | null;
	basePathname: string;
	isAccountActionDisabled: boolean;
	isHighAppearance: boolean;
	isMenuActiveTask: boolean;
	isMenuOpened: boolean;
	mobileActionSectionTitle: string;
	onAccountPress: () => void;
	onMenuToggleChange: (isOpen: boolean) => void;
	onNavigate: (href: string) => void;
	onSearchPress: () => void;
	onThemeAction: (key: string) => void;
	paletteItems: ReadonlyArray<INavbarPaletteItem>;
	selectedPaletteKey: string;
	selectedThemeKeys: ReadonlyArray<string>;
	shouldShowAccountAction: boolean;
}

export default function MobileNavigationMenu({
	accountActionLabel,
	accountSyncPauseLabel,
	basePathname,
	isAccountActionDisabled,
	isHighAppearance,
	isMenuActiveTask,
	isMenuOpened,
	mobileActionSectionTitle,
	onAccountPress,
	onMenuToggleChange,
	onNavigate,
	onSearchPress,
	onThemeAction,
	paletteItems,
	selectedPaletteKey,
	selectedThemeKeys,
	shouldShowAccountAction,
}: IProps) {
	const renderMobileIconNavItem = ({
		href,
		icon,
		label,
	}: IMobileIconNavItem) => {
		const isActivated = href === basePathname;
		return (
			<Button
				key={href}
				variant="light"
				onPress={() => {
					onNavigate(href);
				}}
				onPressStart={(event) => {
					event.continuePropagation();
				}}
				className={cn(
					'group relative flex h-auto w-full min-w-0 overflow-hidden',
					NAVIGATION_CARD_BASE_CLASS_NAME,
					'min-h-12 items-center justify-start gap-3 px-3 py-2.5',
					isActivated
						? NAVIGATION_CARD_ACTIVE_CLASS_NAME
						: NAVIGATION_CARD_INACTIVE_CLASS_NAME
				)}
			>
				<span
					className={cn(
						NAVIGATION_ICON_FRAME_CLASS_NAME,
						'h-8 w-8',
						isActivated
							? NAVIGATION_ICON_FRAME_ACTIVE_CLASS_NAME
							: NAVIGATION_ICON_FRAME_INACTIVE_CLASS_NAME
					)}
				>
					<FontAwesomeIcon icon={icon} className="w-4" />
				</span>
				<span className="min-w-0 truncate text-small font-medium">
					{label}
				</span>
			</Button>
		);
	};

	const renderMobileGuestNavItem = ({
		href,
		label,
		sprite,
		spriteRecordId,
	}: TMobileSpriteNavItem) => {
		const isActivated = href === basePathname;
		return (
			<Button
				key={href}
				variant="light"
				onPress={() => {
					onNavigate(href);
				}}
				onPressStart={(event) => {
					event.continuePropagation();
				}}
				className={cn(
					'group flex h-auto min-h-[4.35rem] w-full min-w-0 flex-col items-center justify-center gap-1.5 px-2 py-2 text-center',
					NAVIGATION_CARD_BASE_CLASS_NAME,
					isActivated
						? NAVIGATION_CARD_ACTIVE_CLASS_NAME
						: NAVIGATION_CARD_INACTIVE_CLASS_NAME
				)}
			>
				<span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
					{sprite === 'normal_guest' ? (
						<span className="h-9 w-9 overflow-hidden rounded-full">
							<Sprite
								target={sprite}
								recordId={spriteRecordId}
								size={3.2}
								className="-translate-x-[0.47rem] -translate-y-px"
							/>
						</span>
					) : (
						<span className="h-9 w-9 overflow-hidden rounded-full">
							<Sprite
								target={sprite}
								recordId={spriteRecordId}
								size={2.25}
							/>
						</span>
					)}
				</span>
				<span className="min-w-0 max-w-full">
					<span className="block truncate text-small font-medium leading-5">
						{label}
					</span>
				</span>
			</Button>
		);
	};

	const renderMobileQueryNavItem = ({
		href,
		label,
		sprite,
		spriteRecordId,
	}: TMobileSpriteNavItem) => {
		const isActivated = href === basePathname;
		return (
			<Button
				key={href}
				variant="light"
				onPress={() => {
					onNavigate(href);
				}}
				onPressStart={(event) => {
					event.continuePropagation();
				}}
				className={cn(
					'group flex h-auto min-h-[4.35rem] w-full min-w-0 flex-col items-center justify-center gap-1.5 px-2 py-2 text-center',
					NAVIGATION_CARD_BASE_CLASS_NAME,
					isActivated
						? NAVIGATION_CARD_ACTIVE_CLASS_NAME
						: NAVIGATION_CARD_INACTIVE_CLASS_NAME
				)}
			>
				<span
					className={cn(
						NAVIGATION_ICON_FRAME_CLASS_NAME,
						isActivated
							? NAVIGATION_ICON_FRAME_ACTIVE_CLASS_NAME
							: NAVIGATION_ICON_FRAME_INACTIVE_CLASS_NAME
					)}
				>
					<Sprite
						target={sprite}
						recordId={spriteRecordId}
						size={1.45}
						className={cn({ 'rounded-full': href === '/partners' })}
					/>
				</span>
				<span className="max-w-full truncate text-small font-medium leading-5">
					{label}
				</span>
			</Button>
		);
	};

	const renderMobileAccountActionItem = () => {
		if (!shouldShowAccountAction) {
			return null;
		}

		return (
			<MobileAccountActionButton
				isDisabled={isAccountActionDisabled}
				label={accountActionLabel}
				syncStatusLabel={accountSyncPauseLabel}
				onPress={onAccountPress}
			/>
		);
	};

	const renderMobileThemeActionItem = ({
		icon,
		key,
		label,
	}: (typeof NAVBAR_THEME_ITEMS)[number]) => {
		const isSelected = selectedThemeKeys.includes(key);
		return (
			<Button
				key={key}
				variant="light"
				onPress={() => {
					onThemeAction(key);
				}}
				className={cn(
					'flex h-auto min-h-12 w-full min-w-0 flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-center',
					NAVIGATION_CARD_BASE_CLASS_NAME,
					isSelected
						? NAVIGATION_CARD_ACTIVE_CLASS_NAME
						: NAVIGATION_CARD_INACTIVE_CLASS_NAME
				)}
			>
				<FontAwesomeIcon icon={icon} className="w-3.5" />
				<span className="text-tiny font-medium leading-4">
					{label.replace('主题', '')}
				</span>
			</Button>
		);
	};

	const renderMobilePaletteActionItem = ({
		key,
		label,
		swatchClassName,
	}: INavbarPaletteItem) => {
		const isSelected = selectedPaletteKey === key;
		return (
			<Button
				key={key}
				variant="light"
				onPress={() => {
					onThemeAction(key);
				}}
				className={cn(
					'flex h-auto min-h-12 w-full min-w-0 items-center justify-center gap-2 px-3 py-2 text-center',
					NAVIGATION_CARD_BASE_CLASS_NAME,
					isSelected
						? NAVIGATION_CARD_ACTIVE_CLASS_NAME
						: NAVIGATION_CARD_INACTIVE_CLASS_NAME
				)}
			>
				<span
					aria-hidden="true"
					className={cn('h-4 w-4 rounded-full', swatchClassName)}
				/>
				<span className="text-small font-medium">{label}</span>
			</Button>
		);
	};

	return (
		<>
			<NavbarContent
				as="div"
				justify="end"
				className="basis-1 pl-2 md:hidden"
			>
				<div
					className={cn(
						'flex h-10 items-center gap-0.5 rounded-small border border-default-200/60 bg-default-100/45 p-0.5 text-foreground-600 transition-background motion-reduce:transition-none dark:bg-default-100/20',
						isHighAppearance && 'bg-default/35 backdrop-blur'
					)}
				>
					<Tooltip showArrow content="搜索" placement="left">
						<Button
							isIconOnly
							size="sm"
							variant="light"
							aria-label="搜索"
							onClick={onSearchPress}
							className="h-9 w-9 min-w-9 rounded-small text-base text-foreground-600 transition-background data-[hover=true]:bg-default/40 data-[pressed=true]:bg-default/50 motion-reduce:transition-none"
						>
							<FontAwesomeIcon
								icon={faMagnifyingGlass}
								className="w-4"
							/>
						</Button>
					</Tooltip>
					<span className="h-5 w-px bg-default-300/70" />
					<Tooltip
						showArrow
						content={isMenuOpened ? '收起菜单' : '打开菜单'}
						placement="left"
					>
						<NavbarMenuToggle
							onChange={onMenuToggleChange}
							srOnlyText={isMenuOpened ? '收起菜单' : '打开菜单'}
							aria-label={isMenuOpened ? '收起菜单' : '打开菜单'}
							className={cn(
								'h-9 w-9 rounded-small transition-background motion-reduce:transition-none',
								isMenuOpened
									? 'bg-default/50'
									: 'data-[hover=true]:bg-default/40',
								isHighAppearance &&
									'data-[hover=true]:bg-default/45'
							)}
						/>
					</Tooltip>
				</div>
			</NavbarContent>

			<NavbarMenu
				inert={!isMenuActiveTask}
				className={cn(
					'top-[calc(var(--navbar-height)_+_var(--announcement-bar-offset))]',
					'max-h-[calc(var(--safe-h-dvh)_-_var(--navbar-height)_-_var(--announcement-bar-offset))]',
					'mobile-navbar-menu-scroll gap-3.5 overflow-y-auto overflow-x-hidden px-6 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-4 sm:px-8'
				)}
			>
				<NavbarMenuItem>
					<section className="space-y-2">
						<h2 className={MOBILE_SECTION_TITLE_CLASS_NAME}>
							顾客
						</h2>
						<div className="grid grid-cols-2 gap-2">
							{MOBILE_GUEST_NAV_ITEMS.map(
								renderMobileGuestNavItem
							)}
						</div>
					</section>
				</NavbarMenuItem>
				{MOBILE_QUERY_NAV_GROUPS.map(({ items, label }) => (
					<NavbarMenuItem key={label}>
						<section className="space-y-2">
							<h2 className={MOBILE_SECTION_TITLE_CLASS_NAME}>
								{label}
							</h2>
							<div className="grid grid-cols-4 gap-2">
								{items.map(renderMobileQueryNavItem)}
							</div>
						</section>
					</NavbarMenuItem>
				))}
				<NavbarMenuItem>
					<section className="space-y-2">
						<h2 className={MOBILE_SECTION_TITLE_CLASS_NAME}>
							更多
						</h2>
						<div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2">
							{MOBILE_UTILITY_NAV_ITEMS.map((item) =>
								renderMobileIconNavItem(item)
							)}
						</div>
					</section>
				</NavbarMenuItem>
				<NavbarMenuItem>
					<section className="space-y-2">
						<h2 className={MOBILE_SECTION_TITLE_CLASS_NAME}>
							{mobileActionSectionTitle}
						</h2>
						{shouldShowAccountAction && (
							<div className="space-y-2">
								{renderMobileAccountActionItem()}
							</div>
						)}
						<div className="grid grid-cols-3 gap-2">
							{NAVBAR_THEME_ITEMS.map(
								renderMobileThemeActionItem
							)}
						</div>
						{paletteItems.length > 0 && (
							<div className="space-y-2 pt-1">
								<h3 className={MOBILE_SECTION_TITLE_CLASS_NAME}>
									主题配色
								</h3>
								<div className="grid grid-cols-2 gap-2">
									{paletteItems.map(
										renderMobilePaletteActionItem
									)}
								</div>
							</div>
						)}
					</section>
				</NavbarMenuItem>
			</NavbarMenu>
		</>
	);
}
