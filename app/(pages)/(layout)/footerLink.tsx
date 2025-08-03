'use client';

import { type PropsWithChildren, memo } from 'react';

import {
	type ILinkProps,
	type ITooltipProps,
	Link,
	Tooltip,
	cn,
} from '@/design/ui/components';

interface IFooterLinkProps
	extends Pick<ILinkProps, 'href' | 'isExternal' | 'title'> {
	content?: ReactNodeWithoutBoolean;
}

export const FooterLink = memo<PropsWithChildren<IFooterLinkProps>>(
	function FooterLink({
		children,
		content,
		href = '#',
		isExternal = true,
		title,
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
			>
				{children}
			</Link>
		);
	}
);

interface IFooterLinkWithTooltipProps
	extends IFooterLinkProps,
		Pick<ITooltipProps, 'classNames'> {
	content: ReactNodeWithoutBoolean;
}

export const FooterLinkWithTooltip = memo<
	PropsWithChildren<IFooterLinkWithTooltipProps>
>(function FooterLinkWithTooltip({ classNames, ...props }) {
	return (
		<Tooltip
			closeDelay={0}
			content={props.content}
			isDisabled={!props.content}
			offset={2}
			size="sm"
			classNames={{
				...classNames,
				content: cn(
					'bg-content1/40 backdrop-blur-lg dark:bg-content1/70',
					classNames?.content
				),
			}}
		>
			<span>
				<FooterLink {...props} />
			</span>
		</Tooltip>
	);
});
