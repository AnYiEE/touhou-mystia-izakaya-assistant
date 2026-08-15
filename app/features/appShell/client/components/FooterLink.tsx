'use client';

import { cn } from '@heroui/theme';
import { type PropsWithChildren, memo, useCallback, useMemo } from 'react';

import Link, { type ILinkProps } from '@/design/ui/components/link';
import Tooltip, { type ITooltipProps } from '@/design/ui/components/tooltip';

import { trackEvent } from '@/features/analytics/client/trackEvent';

interface IFooterLinkProps extends Pick<
	ILinkProps,
	'href' | 'isExternal' | 'onPress' | 'title'
> {
	content?: ReactNodeWithoutBoolean;
}

const FOOTER_LINK_CLASS_NAMES = {
	base: 'rounded-small text-tiny text-primary',
	underline: 'bottom-0',
} as const;

export const FooterLink = memo<PropsWithChildren<IFooterLinkProps>>(
	function FooterLink({
		children,
		content,
		href = '#',
		isExternal = true,
		title,
		...props
	}) {
		return (
			<Link
				isExternal={isExternal}
				showAnchorIcon={isExternal}
				href={href}
				aria-label={
					typeof content === 'string'
						? content
						: (title ?? (children as string))
				}
				title={title}
				classNames={FOOTER_LINK_CLASS_NAMES}
				{...props}
			>
				{children}
			</Link>
		);
	}
);

interface IFooterLinkWithTooltipProps
	extends IFooterLinkProps, Pick<ITooltipProps, 'classNames'> {
	content: ReactNodeWithoutBoolean;
	event?: { click: string; show?: true };
}

export const FooterLinkWithTooltip = memo<
	PropsWithChildren<IFooterLinkWithTooltipProps>
>(function FooterLinkWithTooltip({ classNames, event, ...props }) {
	const handleOpenChange = useCallback(
		(isOpen: boolean) => {
			if (isOpen && event?.show) {
				trackEvent(trackEvent.category.show, 'Tooltip', event.click);
			}
		},
		[event]
	);

	const handlePress = useCallback(() => {
		if (event?.click !== undefined) {
			trackEvent(trackEvent.category.click, 'Link', event.click);
		}
	}, [event]);

	const resolvedClassNames = useMemo(
		() => ({
			...classNames,
			content: cn(
				'bg-content1/40 backdrop-blur-lg dark:bg-content1/70',
				classNames?.content
			),
		}),
		[classNames]
	);

	return (
		<Tooltip
			classNames={resolvedClassNames}
			closeDelay={10}
			content={props.content}
			isDisabled={!props.content}
			offset={1}
			size="sm"
			onOpenChange={handleOpenChange}
		>
			<span>
				<FooterLink onPress={handlePress} {...props} />
			</span>
		</Tooltip>
	);
});
