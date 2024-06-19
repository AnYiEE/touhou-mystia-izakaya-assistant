'use client';

import {memo, useCallback, useEffect, useState} from 'react';
import {useTheme} from 'next-themes';
import clsx from 'clsx';

import {useMounted, useSystemTheme} from '@/hooks';

import {useSwitch, Spinner, Tooltip} from '@nextui-org/react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCircleHalfStroke, faMoon, faSun} from '@fortawesome/free-solid-svg-icons';

interface IProps {
	isMenu: boolean;
}

export default memo(function ThemeSwitcher({isMenu}: Partial<IProps>) {
	const isMounted = useMounted();
	const {theme, setTheme} = useTheme();
	const systemTheme = useSystemTheme();
	const [nextTheme, setNextTheme] = useState('');

	useEffect(() => {
		if (theme === 'system') {
			setNextTheme(systemTheme === 'light' ? '深色' : '浅色');
		} else {
			setNextTheme(theme === 'light' ? '深色' : '浅色');
		}
	}, [theme, systemTheme]);

	const onChange = useCallback(() => {
		if (theme === 'system') {
			systemTheme === 'light' ? setTheme('dark') : setTheme('light');
		} else {
			theme === 'light' ? setTheme('dark') : setTheme('light');
		}
	}, [theme, systemTheme, setTheme]);

	const label = `切换至${nextTheme}模式`;

	const {Component, slots, isSelected, getBaseProps, getInputProps, getWrapperProps} = useSwitch({
		onChange,
		onKeyDown: ({key}) => {
			[' ', 'Enter'].includes(key) && onChange();
		},
		isSelected: theme !== 'system',
		'aria-label': label,
	});

	if (!isMounted) {
		return <Spinner color="default" classNames={{wrapper: 'h-4 w-4'}} />;
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
						theme === 'light' ? (
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
