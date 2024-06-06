'use client';

import {useCallback, useEffect, useState} from 'react';
import {useTheme} from 'next-themes';
import clsx from 'clsx';

import {useMounted} from '@/hooks';

import {useSwitch, Tooltip, type SwitchProps} from '@nextui-org/react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCircleHalfStroke, faMoon, faSun} from '@fortawesome/free-solid-svg-icons';

interface ThemeSwitchProps {
	className?: string;
	classNames?: SwitchProps['classNames'];
}

export default function ThemeSwitcher({className, classNames}: ThemeSwitchProps) {
	const isMounted = useMounted();
	const {theme, setTheme} = useTheme();
	const [systemTheme, setSystemTheme] = useState('');
	const [nextTheme, setNextTheme] = useState('');

	useEffect(() => {
		setSystemTheme(window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
	}, []);

	useEffect(() => {
		const query = '(prefers-color-scheme: light)';
		const handleChange = (event: MediaQueryListEvent) => {
			setSystemTheme(event.matches ? 'light' : 'dark');
		};
		window.matchMedia(query).addEventListener('change', handleChange);
		return () => {
			window.matchMedia(query).removeEventListener('change', handleChange);
		};
	});

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
		isSelected: theme !== 'system',
		'aria-label': label,
	});

	if (!isMounted) return null;

	return (
		<Component
			{...getBaseProps({
				className: clsx('cursor-pointer p-0 transition-opacity hover:opacity-80', className, classNames?.base),
			})}
		>
			<input className="hidden" {...getInputProps()} />
			<Tooltip showArrow content={label}>
				<div
					{...getWrapperProps()}
					className={slots.wrapper({
						class: clsx(
							'm-0 h-auto w-auto bg-transparent p-0 !text-default-500 group-data-[selected=true]:bg-transparent',
							classNames?.wrapper
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
}
