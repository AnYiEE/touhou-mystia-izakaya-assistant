'use client';

import clsx from 'clsx';
import {useTheme} from 'next-themes';

import {useMounted} from '@/hooks';

import {useSwitch, Tooltip, type SwitchProps} from '@nextui-org/react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faMoon, faSun} from '@fortawesome/free-solid-svg-icons';

interface ThemeSwitchProps {
	className?: string;
	classNames?: SwitchProps['classNames'];
}

export default function ThemeSwitcher({className, classNames}: ThemeSwitchProps) {
	const isMounted = useMounted();
	const {theme, setTheme} = useTheme();

	const label = `切换至${theme === 'light' ? '深色' : '浅色'}模式`;

	const onChange = () => {
		theme === 'light' ? setTheme('dark') : setTheme('light');
	};

	const {Component, slots, isSelected, getBaseProps, getInputProps, getWrapperProps} = useSwitch({
		onChange,
		isSelected: theme === 'light',
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
					{!isSelected ? (
						<FontAwesomeIcon icon={faSun} size="lg" />
					) : (
						<FontAwesomeIcon icon={faMoon} size="lg" />
					)}
				</div>
			</Tooltip>
		</Component>
	);
}
