'use client';

import { memo } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faUser } from '@fortawesome/free-solid-svg-icons';

import { Button, type IButtonProps, cn } from '@/design/ui/components';

interface IProps extends Pick<
	IButtonProps,
	'className' | 'isDisabled' | 'onPress' | 'onPressStart'
> {
	label: ReactNodeWithoutBoolean;
	syncStatusLabel: string | null;
}

export default memo<IProps>(function MobileAccountActionButton({
	className,
	isDisabled,
	label,
	onPress,
	onPressStart,
	syncStatusLabel,
}) {
	const pressProps = {
		...(onPress === undefined ? {} : { onPress }),
		...(onPressStart === undefined ? {} : { onPressStart }),
	};

	return (
		<Button
			isDisabled={isDisabled}
			variant="light"
			{...pressProps}
			className={cn(
				'group flex h-auto min-h-14 w-full min-w-0 items-center justify-start gap-3 rounded-small border border-default-200/75 bg-content1/45 px-3 py-2.5 shadow-[0_1px_0_rgba(0,0,0,0.025)]',
				'transition-[background-color,border-color] hover:border-default-300 hover:bg-content1/65 motion-reduce:transition-none',
				'dark:border-default-200/60 dark:bg-default-50/10 dark:shadow-none dark:hover:bg-default-50/15',
				className
			)}
		>
			<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-small bg-primary/10 text-primary-700 transition-colors motion-reduce:transition-none dark:bg-primary/15 dark:text-primary">
				<FontAwesomeIcon icon={faUser} className="w-4" />
			</span>
			<span className="min-w-0 flex-1 text-left">
				<span className="block truncate text-small font-medium text-foreground">
					{label}
				</span>
				<span className="block truncate text-tiny text-foreground-500">
					数据同步和账号安全
				</span>
			</span>
			{syncStatusLabel !== null && (
				<span className="shrink-0 rounded-full bg-warning/15 px-2 py-1 text-tiny leading-none text-warning-700 dark:text-warning">
					{syncStatusLabel}
				</span>
			)}
			<FontAwesomeIcon
				icon={faChevronRight}
				className="w-2.5 shrink-0 text-default-400 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
			/>
		</Button>
	);
});
