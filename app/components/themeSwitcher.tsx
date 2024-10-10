import {memo, useCallback, useEffect, useMemo, useState} from 'react';
import {twJoin} from 'tailwind-merge';

import {usePathname} from 'next/navigation';
import {useTheme} from 'next-themes';
import {useMounted, useVibrate} from '@/hooks';

import {DropdownItem, DropdownMenu, DropdownTrigger, type Selection, Spinner} from '@nextui-org/react';
import {faCircleHalfStroke, faMoon, faSun} from '@fortawesome/free-solid-svg-icons';

import Dropdown from '@/components/dropdown';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Tooltip from '@/components/tooltip';

import {type TSitePath} from '@/configs';
import {globalStore as store} from '@/stores';

enum Theme {
	dark = 'dark',
	light = 'light',
	system = 'system',
}

enum ThemeLabel {
	dark = '深色主题',
	light = '浅色主题',
	system = '跟随系统',
	list = '可选主题列表',
	switcher = '切换主题',
}

interface IProps {
	isMenu?: boolean;
}

export default memo<IProps>(function ThemeSwitcher({isMenu}) {
	const isMounted = useMounted();
	const pathname = usePathname() as TSitePath;
	const {theme, setTheme} = useTheme();
	const [selectedTheme, setSelectedTheme] = useState(new Set([theme]) as SelectionSet);
	const vibrate = useVibrate();

	const isHighAppearance = store.persistence.highAppearance.use();

	const handleOpenChange = useCallback(
		(isOpen: boolean) => {
			if (isOpen) {
				vibrate();
			}
		},
		[vibrate]
	);

	const onSelectedThemeChange = useCallback(
		(value: Selection) => {
			const newValue = value as SelectionSet;
			const currentSelectedTheme = newValue.values().next().value as Theme;

			setTheme(currentSelectedTheme);
			setSelectedTheme(newValue);
		},
		[setTheme]
	);

	useEffect(() => {
		if (theme && !selectedTheme.has(theme)) {
			setSelectedTheme(new Set([theme]));
		}
	}, [selectedTheme, theme]);

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

	const themeIcon = useMemo(() => {
		if (selectedTheme.has(Theme.light)) {
			return faSun;
		}
		if (selectedTheme.has(Theme.dark)) {
			return faMoon;
		}
		return faCircleHalfStroke;
	}, [selectedTheme]);

	if (!isMounted) {
		return (
			<div className="flex h-5 w-5 items-center justify-center">
				<Spinner
					color="default"
					title={ThemeLabel.switcher}
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
			showArrow
			onOpenChange={handleOpenChange}
			classNames={{
				content: twJoin('min-w-28 p-0', isHighAppearance && 'bg-background/70 backdrop-saturate-150'),
			}}
		>
			<Tooltip showArrow content={ThemeLabel.switcher} placement={isMenu ? 'left' : 'bottom'}>
				<span className={twJoin('flex', isMenu && 'h-full')}>
					<DropdownTrigger>
						<FontAwesomeIconButton
							disableAnimation={isMenu}
							icon={themeIcon}
							aria-label={ThemeLabel.switcher}
							className={twJoin(
								'h-min w-min min-w-min bg-transparent text-medium',
								isMenu ? 'h-full text-foreground' : 'text-default-400 dark:text-default-500'
							)}
						/>
					</DropdownTrigger>
				</span>
			</Tooltip>
			<DropdownMenu
				disallowEmptySelection
				selectedKeys={selectedTheme}
				selectionMode="single"
				onSelectionChange={onSelectedThemeChange}
				aria-label={ThemeLabel.list}
				className="w-28"
				itemClasses={{
					base: 'my-px transition-background data-[hover=true]:bg-default/40 data-[selectable=true]:focus:bg-default/40',
				}}
			>
				<DropdownItem key={Theme.dark}>{ThemeLabel.dark}</DropdownItem>
				<DropdownItem key={Theme.light}>{ThemeLabel.light}</DropdownItem>
				<DropdownItem key={Theme.system}>{ThemeLabel.system}</DropdownItem>
			</DropdownMenu>
		</Dropdown>
	);
});
