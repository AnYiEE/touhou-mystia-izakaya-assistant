'use client';

import {memo, useCallback, useEffect, useMemo, useState} from 'react';

import {THEME_MAP, type TTheme, useTheme} from '@/design/hooks';
import {useMounted, useVibrate} from '@/hooks';

import {
	DropdownItem,
	DropdownMenu,
	type DropdownProps,
	DropdownTrigger,
	type Selection,
	Spinner,
} from '@nextui-org/react';
import {faCircleHalfStroke, faMoon, faSun} from '@fortawesome/free-solid-svg-icons';

import {cn} from '@/design/ui/components';

import Dropdown from '@/components/dropdown';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Tooltip from '@/components/tooltip';

import {globalStore as store} from '@/stores';
import {toGetValueCollection} from '@/utilities';

const THEME_LABEL_MAP = {
	dark: '深色主题',
	light: '浅色主题',
	list: '可选主题列表',
	switcher: '切换主题',
	system: '跟随系统',
} as const satisfies Record<TTheme, string> & Record<'list' | 'switcher', string>;

interface IProps extends Pick<DropdownProps, 'className'> {
	isMenu?: boolean;
}

export default memo<IProps>(function ThemeSwitcher({className, isMenu}) {
	const isMounted = useMounted();
	const [theme, setTheme] = useTheme();
	const [selectedTheme, setSelectedTheme] = useState(new Set([theme]) as SelectionSet);
	const vibrate = useVibrate();

	const isHighAppearance = store.persistence.highAppearance.use();

	const onSelectedThemeChange = useCallback(
		(value: Selection) => {
			const newValue = value as SelectionSet;
			const currentSelectedTheme = newValue.values().next().value as TTheme;

			setTheme(currentSelectedTheme);
			setSelectedTheme(newValue);
		},
		[setTheme]
	);

	useEffect(() => {
		if (!selectedTheme.has(theme)) {
			setSelectedTheme(new Set([theme]));
		}
	}, [selectedTheme, theme]);

	const themeIcon = useMemo(() => {
		if (selectedTheme.has(THEME_MAP.LIGHT)) {
			return faSun;
		}
		if (selectedTheme.has(THEME_MAP.DARK)) {
			return faMoon;
		}
		return faCircleHalfStroke;
	}, [selectedTheme]);

	if (!isMounted) {
		return (
			<div className="flex h-5 w-5 items-center justify-center">
				<Spinner
					color="default"
					title={THEME_LABEL_MAP.switcher}
					classNames={{
						base: 'flex',
						wrapper: 'h-4 w-4',
					}}
				/>
			</div>
		);
	}

	return (
		<Dropdown
			shouldCloseOnScroll
			showArrow
			onOpenChange={vibrate}
			classNames={{
				content: cn('p-0 [&>[data-slot="base"]]:w-max', {
					'bg-background/70 backdrop-saturate-150': isHighAppearance,
				}),
			}}
		>
			<Tooltip showArrow content={THEME_LABEL_MAP.switcher} placement={isMenu ? 'left' : 'bottom'}>
				<span className="flex">
					<DropdownTrigger>
						<FontAwesomeIconButton
							disableAnimation={isMenu}
							icon={themeIcon}
							aria-label={THEME_LABEL_MAP.switcher}
							className={cn(
								'h-min w-min min-w-min bg-transparent !text-medium',
								isMenu ? 'h-full text-foreground' : 'text-default-400 dark:text-default-500',
								className
							)}
						/>
					</DropdownTrigger>
				</span>
			</Tooltip>
			<DropdownMenu
				disallowEmptySelection
				items={Object.values(THEME_MAP).map(toGetValueCollection)}
				selectedKeys={selectedTheme}
				selectionMode="single"
				onSelectionChange={onSelectedThemeChange}
				aria-label={THEME_LABEL_MAP.list}
				className="w-28"
				itemClasses={{
					base: 'my-px transition-background data-[hover=true]:bg-default/40 data-[selectable=true]:focus:bg-default/40',
				}}
			>
				{({value}) => <DropdownItem key={value}>{THEME_LABEL_MAP[value]}</DropdownItem>}
			</DropdownMenu>
		</Dropdown>
	);
});
