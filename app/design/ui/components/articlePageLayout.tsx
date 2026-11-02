import { cn } from '@heroui/theme';
import type { PropsWithChildren, ReactNode } from 'react';

interface IProps {
	className?: string;
	footer?: ReactNode;
	header?: ReactNode;
}

export default function ArticlePageLayout({
	children,
	className,
	footer,
	header,
}: PropsWithChildren<IProps>) {
	return (
		<article
			className={cn(
				'mx-auto flex min-h-main-content w-full max-w-5xl flex-col gap-8 pb-8',
				className
			)}
		>
			{header}
			<div className="article-body text-cjk-flow flex flex-col gap-10">
				{children}
			</div>
			{footer}
		</article>
	);
}
