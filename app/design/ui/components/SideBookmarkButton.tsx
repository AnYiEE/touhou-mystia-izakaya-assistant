'use client';

import { memo } from 'react';

import { type IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';

import Button, { type IButtonProps } from './button';

export const SIDE_BOOKMARK_POSITION_CLASS_NAME =
	'fixed left-0 top-[calc(var(--navbar-height,4rem)+var(--announcement-bar-offset,0rem)+2rem)] z-30 xl:top-[calc(var(--navbar-height,4rem)+var(--announcement-bar-offset,0rem)+2.5rem)]';

interface IProps extends Omit<IButtonProps, 'children'> {
	icon: IconDefinition;
	label: string;
}

export default memo<IProps>(function SideBookmarkButton({
	className,
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
				'min-h-24 w-6 !min-w-6 rounded-l-none rounded-r-medium border border-l-0 border-default/70 bg-background px-0 py-3 font-medium text-default-foreground shadow-[inset_-1px_0_0_rgb(255_255_255_/_0.42),0_2px_7px_rgb(0_0_0_/_0.08),0_8px_18px_-14px_rgb(0_0_0_/_0.18)] ring-1 ring-inset ring-white/25 transition-all data-[hover=true]:translate-x-0.5 data-[hover=true]:border-default/90 data-[hover=true]:shadow-[inset_-1px_0_0_rgb(255_255_255_/_0.48),0_3px_9px_rgb(0_0_0_/_0.09),0_10px_20px_-14px_rgb(0_0_0_/_0.2)] motion-reduce:data-[hover=true]:translate-x-0 xl:min-h-28 xl:w-8 xl:!min-w-8 dark:border-default/20 dark:bg-default/40 dark:shadow-none dark:ring-0 dark:data-[hover=true]:border-default/40 dark:data-[hover=true]:shadow-none',
				className
			)}
			{...props}
		>
			<span className="flex h-full w-full flex-col items-center justify-center gap-1.5 xl:gap-2">
				<FontAwesomeIcon
					className="text-[10px] opacity-90 xl:text-tiny"
					icon={icon}
				/>
				<span className="text-[10px] leading-none [writing-mode:vertical-rl] xl:text-tiny">
					{label}
				</span>
			</span>
		</Button>
	);
});
