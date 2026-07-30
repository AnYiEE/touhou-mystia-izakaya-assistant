'use client';

import { cn } from '@heroui/theme';
import { memo } from 'react';

interface IAdminMetadataProps {
	metadata: Record<string, unknown>;
}

export const AdminMetadata = memo<IAdminMetadataProps>(function AdminMetadata({
	metadata,
}) {
	const entries = Object.entries(metadata);
	if (entries.length === 0) {
		return <span className="text-foreground-400">无</span>;
	}

	return (
		<div className="flex max-w-96 flex-wrap gap-1">
			{entries.map(([key, value]) => (
				<span
					key={key}
					className={cn(
						'inline-flex max-w-full rounded-small bg-default/40 px-2 py-1',
						'font-mono text-[0.68rem] leading-4 text-foreground-500'
					)}
				>
					<span className="truncate">
						{key}:{' '}
						{typeof value === 'string' || typeof value === 'number'
							? value
							: JSON.stringify(value)}
					</span>
				</span>
			))}
		</div>
	);
});
