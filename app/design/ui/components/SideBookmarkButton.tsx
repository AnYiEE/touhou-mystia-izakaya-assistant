'use client';

import { type IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { memo } from 'react';

import Button, { type IButtonProps } from './button';

export type TSideBookmarkExpandWidth = 1280 | 1300;

const EXPANDED_BUTTON_CLASS_NAME = {
	1280: 'xl:min-h-28 xl:w-8 xl:!min-w-8',
	1300: 'min-[1300px]:min-h-28 min-[1300px]:w-8 min-[1300px]:!min-w-8',
} as const satisfies Record<TSideBookmarkExpandWidth, string>;

const EXPANDED_CONTENT_CLASS_NAME = {
	1280: 'xl:gap-2',
	1300: 'min-[1300px]:gap-2',
} as const satisfies Record<TSideBookmarkExpandWidth, string>;

const EXPANDED_ICON_CLASS_NAME = {
	1280: 'xl:text-tiny',
	1300: 'min-[1300px]:text-tiny',
} as const satisfies Record<TSideBookmarkExpandWidth, string>;

const EXPANDED_LABEL_CLASS_NAME = {
	1280: 'xl:text-tiny',
	1300: 'min-[1300px]:text-tiny',
} as const satisfies Record<TSideBookmarkExpandWidth, string>;

export function getSideBookmarkPositionClassName(
	expandAtWidth: TSideBookmarkExpandWidth = 1280
) {
	return cn(
		'fixed left-0 top-[calc(var(--navbar-height,4rem)+var(--announcement-bar-offset,0rem)+2rem)] z-30',
		expandAtWidth === 1300
			? 'min-[1300px]:top-[calc(var(--navbar-height,4rem)+var(--announcement-bar-offset,0rem)+2.5rem)]'
			: 'xl:top-[calc(var(--navbar-height,4rem)+var(--announcement-bar-offset,0rem)+2.5rem)]'
	);
}

export const SIDE_BOOKMARK_POSITION_CLASS_NAME =
	getSideBookmarkPositionClassName();

interface IProps extends Omit<IButtonProps, 'children'> {
	expandAtWidth?: TSideBookmarkExpandWidth;
	icon: IconDefinition;
	label: string;
}

export default memo<IProps>(function SideBookmarkButton({
	className,
	expandAtWidth = 1280,
	icon,
	label,
	...props
}) {
	return (
		<Button
			color="default"
			radius="none"
			size="sm"
			variant="flat"
			className={cn(
				'min-h-24 w-6 !min-w-6 rounded-l-none rounded-r-medium border border-l-0 border-default/70 bg-background px-0 py-3 font-medium text-default-foreground shadow-[inset_-1px_0_0_rgb(255_255_255_/_0.42),0_2px_7px_rgb(0_0_0_/_0.08),0_8px_18px_-14px_rgb(0_0_0_/_0.18)] ring-1 ring-inset ring-white/25 transition-all data-[hover=true]:translate-x-0.5 data-[hover=true]:border-default/90 data-[hover=true]:shadow-[inset_-1px_0_0_rgb(255_255_255_/_0.48),0_3px_9px_rgb(0_0_0_/_0.09),0_10px_20px_-14px_rgb(0_0_0_/_0.2)] motion-reduce:data-[hover=true]:translate-x-0 dark:border-default/20 dark:bg-default/40 dark:shadow-none dark:ring-0 dark:data-[hover=true]:border-default/40 dark:data-[hover=true]:shadow-none',
				EXPANDED_BUTTON_CLASS_NAME[expandAtWidth],
				className
			)}
			{...props}
		>
			<span
				className={cn(
					'flex h-full w-full flex-col items-center justify-center gap-1.5',
					EXPANDED_CONTENT_CLASS_NAME[expandAtWidth]
				)}
			>
				<FontAwesomeIcon
					className={cn(
						'text-[10px] opacity-90',
						EXPANDED_ICON_CLASS_NAME[expandAtWidth]
					)}
					icon={icon}
				/>
				<span
					className={cn(
						'text-[10px] leading-none [writing-mode:vertical-rl]',
						EXPANDED_LABEL_CLASS_NAME[expandAtWidth]
					)}
				>
					{label}
				</span>
			</span>
		</Button>
	);
});
