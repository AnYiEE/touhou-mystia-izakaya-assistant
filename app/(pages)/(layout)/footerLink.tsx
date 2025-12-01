'use client';

import { type PropsWithChildren, memo } from 'react';

import {
	type ILinkProps,
	type ITooltipProps,
	Link,
	Tooltip,
	cn,
} from '@/design/ui/components';

import { trackEvent } from '@/components/analytics';

interface IFooterLinkProps extends Pick<
	ILinkProps,
	'href' | 'isExternal' | 'onPress' | 'title'
> {
	content?: ReactNodeWithoutBoolean;
}

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
				classNames={{
					base: 'rounded-small text-tiny text-primary',
					underline: 'bottom-0',
				}}
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
	return (
		<Tooltip
			closeDelay={10}
			content={props.content}
			isDisabled={!props.content}
			offset={1}
			size="sm"
			onOpenChange={(isOpen) => {
				if (isOpen && event?.show) {
					trackEvent(
						trackEvent.category.show,
						'Tooltip',
						event.click
					);
				}
			}}
			classNames={{
				...classNames,
				content: cn(
					'bg-content1/40 backdrop-blur-lg dark:bg-content1/70',
					classNames?.content
				),
			}}
		>
			<span>
				<FooterLink
					onPress={() => {
						if (event?.click !== undefined) {
							trackEvent(
								trackEvent.category.click,
								'Link',
								event.click
							);
						}
					}}
					{...props}
				/>
			</span>
		</Tooltip>
	);
});
