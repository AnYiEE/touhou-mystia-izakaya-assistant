import { cn } from '@heroui/theme';
import { type PropsWithChildren, type ReactNode, memo } from 'react';

interface IProps extends Pick<HTMLDivElementAttributes, 'className'> {
	count?: number | undefined;
	icon?: ReactNode | undefined;
}

export default memo<PropsWithChildren<IProps>>(function LabeledDivider({
	children,
	className,
	count,
	icon,
}) {
	return (
		<div
			className={cn(
				'flex items-center gap-2 leading-none text-foreground-400',
				className
			)}
		>
			{icon ?? (
				<span
					aria-hidden
					className="h-3.5 w-1 rounded-full bg-primary/70"
				/>
			)}
			<span className="whitespace-nowrap text-small font-medium">
				{children}
			</span>
			{count !== undefined && (
				<span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-default-200/70 px-1.5 text-tiny">
					{count}
				</span>
			)}
		</div>
	);
});
