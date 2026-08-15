'use client';

import {
	faCircleHalfStroke,
	faDesktop,
	faMoon,
	faSun,
} from '@fortawesome/free-solid-svg-icons';
import {
	FontAwesomeIcon,
	type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import { Spinner } from '@heroui/spinner';
import { cn } from '@heroui/theme';
import { type Key, memo, useCallback, useMemo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import {
	DARK_PALETTE_PRESENTATION_MAP,
	LIGHT_PALETTE_PRESENTATION_MAP,
} from '@/design/theme/palettePresentation';
import {
	DARK_PALETTE_MAP,
	LIGHT_PALETTE_MAP,
	THEME_MAP,
} from '@/design/theme/runtime/constants';
import type {
	TDarkPalette,
	TLightPalette,
	TTheme,
} from '@/design/theme/runtime/types';
import { useTheme } from '@/design/theme/runtime/useTheme';
import Dropdown, {
	DropdownItem,
	DropdownMenu,
	DropdownSection,
	DropdownTrigger,
	type IDropdownProps,
} from '@/design/ui/components/dropdown';
import FontAwesomeIconButton from '@/design/ui/components/fontAwesomeIconButton';
import { toSelectionKeySet } from '@/design/ui/components/selectionKeys';
import Tooltip from '@/design/ui/components/tooltip';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { useHydrated } from '@/shared/react/useHydrated';
import { toGetValueCollection } from '@/shared/utilities/objects/convertCollection';

interface IPaletteItem {
	key: string;
	label: string;
	palette: TDarkPalette | TLightPalette;
	swatchClassName: string;
}

const THEME_ICON_MAP = {
	dark: faMoon,
	light: faSun,
	system: faCircleHalfStroke,
} as const satisfies Record<TTheme, FontAwesomeIconProps['icon']>;

const THEME_LABEL_MAP = {
	dark: '深色主题',
	light: '浅色主题',
	list: '可选主题列表',
	switcher: '切换主题',
	system: '跟随系统',
} as const satisfies Record<TTheme, string> &
	Record<'list' | 'switcher', string>;

const THEME_LABEL_ICON_MAP = {
	dark: faMoon,
	light: faSun,
	system: faDesktop,
} as const satisfies Record<TTheme, FontAwesomeIconProps['icon']>;

const THEME_ITEMS = Object.values(THEME_MAP).map(toGetValueCollection);
const DARK_PALETTE_ITEMS = Object.values(DARK_PALETTE_MAP).map((palette) => ({
	...DARK_PALETTE_PRESENTATION_MAP[palette],
	key: `dark-palette:${palette}`,
	palette,
}));
const LIGHT_PALETTE_ITEMS = Object.values(LIGHT_PALETTE_MAP).map((palette) => ({
	...LIGHT_PALETTE_PRESENTATION_MAP[palette],
	key: `light-palette:${palette}`,
	palette,
}));
const THEME_BY_KEY: ReadonlyMap<string, TTheme> = new Map(
	THEME_ITEMS.map(({ value }) => [value, value])
);
const DARK_PALETTE_BY_KEY: ReadonlyMap<string, TDarkPalette> = new Map(
	DARK_PALETTE_ITEMS.map(({ key, palette }) => [key, palette])
);
const LIGHT_PALETTE_BY_KEY: ReadonlyMap<string, TLightPalette> = new Map(
	LIGHT_PALETTE_ITEMS.map(({ key, palette }) => [key, palette])
);
const THEME_SPINNER_CLASS_NAMES = { base: 'flex', wrapper: 'h-5 w-5' } as const;
const THEME_MENU_ITEM_CLASSES = {
	base: 'my-px transition-background focus:bg-default/40 data-[hover=true]:bg-default/40 data-[selectable=true]:focus:bg-default/40 motion-reduce:transition-none',
} as const;
const THEME_MENU_SECTION_CLASS_NAMES = {
	base: 'mb-0',
	divider: 'mx-1 my-1 bg-default-200/70',
	group: 'space-y-1',
	heading:
		'block px-2 pb-0.5 pt-2.5 text-tiny font-medium uppercase text-default-500',
};

interface IProps extends Pick<IDropdownProps, 'className'> {
	isMenu?: boolean;
}

export default memo<IProps>(function ThemeSwitcher({ className, isMenu }) {
	const { isHighAppearance } = useDesignPreferences();
	const isMounted = useHydrated();
	const vibrate = useVibrate();

	const [
		theme,
		setTheme,
		lightPalette,
		setLightPalette,
		darkPalette,
		setDarkPalette,
		resolvedTheme,
	] = useTheme();

	const paletteItems: ReadonlyArray<IPaletteItem> =
		resolvedTheme === THEME_MAP.LIGHT
			? LIGHT_PALETTE_ITEMS
			: DARK_PALETTE_ITEMS;
	const selectedPaletteKey =
		resolvedTheme === THEME_MAP.LIGHT
			? `light-palette:${lightPalette}`
			: `dark-palette:${darkPalette}`;
	const selectedKeys = useMemo(
		() => toSelectionKeySet([theme, selectedPaletteKey]),
		[selectedPaletteKey, theme]
	);

	const handleMenuAction = useCallback(
		(key: Key) => {
			if (typeof key !== 'string') {
				return;
			}

			const nextTheme = THEME_BY_KEY.get(key);
			if (nextTheme !== undefined) {
				setTheme(nextTheme);
				trackEvent(
					trackEvent.category.click,
					'Theme Button',
					nextTheme
				);
				return;
			}

			const nextDarkPalette = DARK_PALETTE_BY_KEY.get(key);
			if (nextDarkPalette !== undefined) {
				setDarkPalette(nextDarkPalette);
				trackEvent(
					trackEvent.category.click,
					'Theme Button',
					`dark-palette:${nextDarkPalette}`
				);
				return;
			}

			const nextLightPalette = LIGHT_PALETTE_BY_KEY.get(key);
			if (nextLightPalette !== undefined) {
				setLightPalette(nextLightPalette);
				trackEvent(
					trackEvent.category.click,
					'Theme Button',
					`light-palette:${nextLightPalette}`
				);
			}
		},
		[setDarkPalette, setLightPalette, setTheme]
	);

	const currentThemeIcon = THEME_ICON_MAP[theme];
	const dropdownClassNames = useMemo(
		() => ({
			content: cn('p-0 [&>[data-slot="base"]]:w-max', {
				'bg-background/70 backdrop-saturate-150': isHighAppearance,
			}),
		}),
		[isHighAppearance]
	);

	if (!isMounted) {
		return (
			<div className="flex h-5 w-5 items-center justify-center">
				<Spinner
					color="default"
					title={THEME_LABEL_MAP.switcher}
					classNames={THEME_SPINNER_CLASS_NAMES}
				/>
			</div>
		);
	}

	return (
		<Dropdown
			shouldCloseOnScroll
			showArrow
			onOpenChange={vibrate}
			classNames={dropdownClassNames}
		>
			<Tooltip
				showArrow
				content={THEME_LABEL_MAP.switcher}
				placement={isMenu ? 'left' : 'bottom'}
			>
				<span className="flex">
					<DropdownTrigger>
						<FontAwesomeIconButton
							disableAnimation={isMenu}
							icon={currentThemeIcon}
							aria-label={THEME_LABEL_MAP.switcher}
							className={cn(
								'h-5 w-5 min-w-min bg-transparent !text-medium',
								isMenu
									? 'h-full text-foreground'
									: 'text-primary-600 dark:text-default-foreground',
								className
							)}
						/>
					</DropdownTrigger>
				</span>
			</Tooltip>
			<DropdownMenu
				disallowEmptySelection
				selectedKeys={selectedKeys}
				selectionMode="multiple"
				onAction={handleMenuAction}
				aria-label={THEME_LABEL_MAP.list}
				className="w-28"
				itemClasses={THEME_MENU_ITEM_CLASSES}
			>
				<DropdownSection
					showDivider
					title="主题"
					classNames={THEME_MENU_SECTION_CLASS_NAMES}
				>
					{THEME_ITEMS.map(({ value }) => (
						<DropdownItem
							key={value}
							textValue={THEME_LABEL_MAP[value]}
						>
							<div className="flex items-center gap-1">
								<FontAwesomeIcon
									icon={THEME_LABEL_ICON_MAP[value]}
									className="w-4 pb-px opacity-80"
								/>
								{THEME_LABEL_MAP[value]}
							</div>
						</DropdownItem>
					))}
				</DropdownSection>
				<DropdownSection
					items={paletteItems}
					title="主题配色"
					classNames={THEME_MENU_SECTION_CLASS_NAMES}
				>
					{({ key, label, swatchClassName }) => (
						<DropdownItem
							key={key}
							closeOnSelect={false}
							textValue={label}
						>
							<div className="flex items-center gap-1.5">
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
				</DropdownSection>
			</DropdownMenu>
		</Dropdown>
	);
});
