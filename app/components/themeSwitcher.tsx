'use client';

import {memo, useCallback, useEffect, useState} from 'react';
import {usePathname} from 'next/navigation';
import {useTheme} from 'next-themes';
import {twJoin} from 'tailwind-merge';

import {useMounted} from '@/hooks';

import {
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	type Selection,
	Spinner,
	Tooltip,
} from '@nextui-org/react';
import {faCircleHalfStroke, faMoon, faSun} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconButton from './fontAwesomeIconButton';

enum Theme {
	dark = 'dark',
	light = 'light',
	system = 'system',
}

enum ThemeLabel {
	dark = '深色主题',
	light = '浅色主题',
	system = '跟随系统',
}

interface IProps {
	isMenu: boolean;
}

export default memo(function ThemeSwitcher({isMenu}: Partial<IProps>) {
	const isMounted = useMounted();
	const pathname = usePathname();
	const {theme, setTheme} = useTheme();
	const [selectedTheme, setSelectedTheme] = useState(new Set([theme]) as SelectionSet);

	const onSelectedThemeChange = useCallback(
		(value: Selection) => {
			const newValue = value as SelectionSet;

			if (newValue.has(Theme.dark)) {
				setTheme(Theme.dark);
			} else if (newValue.has(Theme.light)) {
				setTheme(Theme.light);
			} else if (newValue.has(Theme.system)) {
				setTheme(Theme.system);
			}

			setSelectedTheme(newValue);
		},
		[setTheme]
	);

	useEffect(() => {
		document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((metaTag) => {
			if (theme === Theme.system) {
				metaTag.content = metaTag.getAttribute('default-content') as string;
			} else {
				requestAnimationFrame(() => {
					metaTag.content = getComputedStyle(document.body).backgroundColor;
				});
			}
		});
	}, [pathname, theme]);

	if (!isMounted) {
		return (
			<Spinner
				color="default"
				classNames={{
					wrapper: 'h-4 w-4',
				}}
			/>
		);
	}

	return (
		<Dropdown
			showArrow
			classNames={{
				content: 'min-w-28',
			}}
		>
			<Tooltip showArrow content="切换主题">
				<span className="flex">
					<DropdownTrigger>
						<FontAwesomeIconButton
							icon={
								selectedTheme.has(Theme.light)
									? faSun
									: selectedTheme.has(Theme.dark)
										? faMoon
										: faCircleHalfStroke
							}
							aria-label="切换主题"
							className={twJoin(
								'h-min w-min min-w-min bg-transparent text-medium',
								isMenu ? '!text-foreground' : '!text-default-500'
							)}
						/>
					</DropdownTrigger>
				</span>
			</Tooltip>
			<DropdownMenu
				disallowEmptySelection
				defaultSelectedKeys={selectedTheme}
				selectedKeys={selectedTheme}
				selectionMode="single"
				onSelectionChange={onSelectedThemeChange}
				aria-label="可选主题列表"
				className="w-28"
			>
				<DropdownItem key={Theme.dark}>{ThemeLabel.dark}</DropdownItem>
				<DropdownItem key={Theme.light}>{ThemeLabel.light}</DropdownItem>
				<DropdownItem key={Theme.system}>{ThemeLabel.system}</DropdownItem>
			</DropdownMenu>
		</Dropdown>
	);
});
