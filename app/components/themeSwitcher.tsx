'use client';

import {memo, useCallback, useEffect, useState} from 'react';
import {useTheme} from 'next-themes';
import clsx from 'clsx';

import {Theme, useMounted, useSystemTheme} from '@/hooks';

import {Spinner, Tooltip, useSwitch} from '@nextui-org/react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCircleHalfStroke, faMoon, faSun} from '@fortawesome/free-solid-svg-icons';
import {checkA11yConfirmKey} from '@/utils';

enum ThemeLabel {
	dark = '深色',
	light = '浅色',
	system = '跟随系统',
}

interface IProps {
	isMenu: boolean;
}

export default memo(function ThemeSwitcher({isMenu}: Partial<IProps>) {
	const isMounted = useMounted();
	const {theme, setTheme} = useTheme();
	const systemTheme = useSystemTheme();
	const [nextTheme, setNextTheme] = useState('');

	useEffect(() => {
		if (theme === Theme.system) {
			setNextTheme(systemTheme === Theme.light ? ThemeLabel.dark : ThemeLabel.light);
		} else {
			setNextTheme(theme === Theme.light ? ThemeLabel.dark : ThemeLabel.light);
		}
	}, [theme, systemTheme]);

	const onChange = useCallback(() => {
		if (theme === Theme.system) {
			setTheme(systemTheme === Theme.light ? Theme.dark : Theme.light);
		} else {
			setTheme(theme === Theme.light ? Theme.dark : Theme.light);
		}
	}, [theme, systemTheme, setTheme]);

	const label = `切换至${nextTheme}模式`;

	const {Component, slots, isSelected, getBaseProps, getInputProps, getWrapperProps} = useSwitch({
		'aria-label': label,
		isSelected: theme !== Theme.system,
		onChange,
		onKeyDown: (event) => {
			if (checkA11yConfirmKey(event)) {
				onChange();
			}
		},
	});

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
		<Component
			{...getBaseProps({
				className:
					'cursor-pointer p-0 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
			})}
			tabIndex={0}
			role="button"
		>
			<input className="hidden" {...getInputProps()} />
			<Tooltip showArrow content={label}>
				<div
					{...getWrapperProps()}
					className={slots.wrapper({
						class: clsx(
							'm-0 h-auto w-auto bg-transparent p-0 group-data-[selected=true]:bg-transparent',
							isMenu ? '!text-foreground' : '!text-default-500'
						),
					})}
				>
					{isSelected ? (
						theme === Theme.light ? (
							<FontAwesomeIcon icon={faMoon} size="lg" />
						) : (
							<FontAwesomeIcon icon={faSun} size="lg" />
						)
					) : (
						<FontAwesomeIcon icon={faCircleHalfStroke} size="lg" />
					)}
				</div>
			</Tooltip>
		</Component>
	);
});
