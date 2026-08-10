import { cn } from '@heroui/theme';

export function getDrawerLayoutClassName() {
	return 'flex min-h-0 flex-1 flex-col md:flex-row';
}

export function getDrawerControlsClassName({
	isControlsCollapsed,
	isHighAppearance,
}: {
	isControlsCollapsed: boolean;
	isHighAppearance: boolean;
}) {
	return cn(
		'min-h-0 border-b border-divider transition-[width,min-width,max-width,flex-basis,padding,background-color,border-color,backdrop-filter] duration-200 ease-linear scrollbar-hide motion-reduce:transition-none md:border-b-0 md:border-r',
		isControlsCollapsed
			? 'md:w-16 md:min-w-16 md:max-w-16 md:flex-none md:basis-16'
			: 'md:w-[21rem] md:min-w-[21rem] md:max-w-[21rem] md:flex-none md:basis-[21rem]',
		isHighAppearance
			? 'bg-content1/60 backdrop-blur-md dark:bg-content1/25'
			: 'bg-content1/85 dark:bg-content1/40',
		isControlsCollapsed ? 'overflow-hidden p-4' : 'overflow-y-auto p-4'
	);
}

export function getDrawerResultsClassName(isHighAppearance: boolean) {
	return cn(
		'flex min-h-0 min-w-0 flex-1 flex-col',
		isHighAppearance
			? 'bg-background/40 dark:bg-default-50/5'
			: 'bg-background dark:bg-content1/20'
	);
}

export function getDrawerSkeletonClassName({
	className,
	isHighAppearance,
	toneClassName,
}: {
	className: string;
	isHighAppearance: boolean;
	toneClassName: string;
}) {
	return cn(className, toneClassName, { 'backdrop-blur': isHighAppearance });
}
