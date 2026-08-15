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
import { type Selection } from '@heroui/table';
import { cn } from '@heroui/theme';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import { THEME_MAP } from '@/design/theme/runtime/constants';
import type { TTheme } from '@/design/theme/runtime/types';
import { useTheme } from '@/design/theme/runtime/useTheme';
import Dropdown, {
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	type IDropdownProps,
} from '@/design/ui/components/dropdown';
import FontAwesomeIconButton from '@/design/ui/components/fontAwesomeIconButton';
import {
	selectionToKnownValues,
	toSelectionKeySet,
} from '@/design/ui/components/selectionKeys';
import Tooltip from '@/design/ui/components/tooltip';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { useHydrated } from '@/shared/react/useHydrated';
import { toGetValueCollection } from '@/shared/utilities/objects/convertCollection';

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
const THEME_BY_KEY: ReadonlyMap<string, TTheme> = new Map(
	THEME_ITEMS.map(({ value }) => [value, value])
);
const THEME_SPINNER_CLASS_NAMES = { base: 'flex', wrapper: 'h-5 w-5' } as const;
const THEME_MENU_ITEM_CLASSES = {
	base: 'my-px transition-background focus:bg-default/40 data-[hover=true]:bg-default/40 data-[selectable=true]:focus:bg-default/40 motion-reduce:transition-none',
} as const;

interface IProps extends Pick<IDropdownProps, 'className'> {
	isMenu?: boolean;
}

export default memo<IProps>(function ThemeSwitcher({ className, isMenu }) {
	const { isHighAppearance } = useDesignPreferences();
	const isMounted = useHydrated();
	const vibrate = useVibrate();

	const [theme, setTheme] = useTheme();
	const [selectedTheme, setSelectedTheme] = useState<Set<string>>(
		new Set([theme])
	);

	const onSelectedThemeChange = useCallback(
		(value: Selection) => {
			const [currentSelectedTheme] =
				selectionToKnownValues(value, THEME_BY_KEY) ?? [];
			if (currentSelectedTheme === undefined) {
				return;
			}

			setTheme(currentSelectedTheme);
			setSelectedTheme(toSelectionKeySet([currentSelectedTheme]));
		},
		[setTheme]
	);

	useEffect(() => {
		if (!selectedTheme.has(theme)) {
			setSelectedTheme(new Set([theme]));
		}
	}, [selectedTheme, theme]);

	const currentThemeIcon = useMemo(
		() => THEME_ICON_MAP[selectedTheme.values().next().value as TTheme],
		[selectedTheme]
	);
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
				items={THEME_ITEMS}
				selectedKeys={selectedTheme}
				selectionMode="single"
				onSelectionChange={onSelectedThemeChange}
				aria-label={THEME_LABEL_MAP.list}
				className="w-28"
				itemClasses={THEME_MENU_ITEM_CLASSES}
			>
				{({ value }) => (
					<DropdownItem
						key={value}
						textValue={THEME_LABEL_MAP[value]}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Theme Button',
								value
							);
						}}
					>
						<div className="flex items-center gap-1">
							<FontAwesomeIcon
								icon={THEME_LABEL_ICON_MAP[value]}
								className="w-4 pb-px opacity-80"
							/>
							{THEME_LABEL_MAP[value]}
						</div>
					</DropdownItem>
				)}
			</DropdownMenu>
		</Dropdown>
	);
});
