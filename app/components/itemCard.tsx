'use client';

import { memo } from 'react';

import { Card, type ICardProps, cn } from '@/design/ui/components';

import { globalStore as store } from '@/stores';

interface IProps extends Omit<ICardProps, 'className' | 'classNames'> {
	name: ReactNodeWithoutBoolean;
	description?: ReactNodeWithoutBoolean;
	image: ReactNodeWithoutBoolean;
}

export default memo<IProps>(function ItemCard({
	description,
	image,
	name,
	...props
}) {
	const isHighAppearance = store.persistence.highAppearance.use();

	return (
		<Card
			fullWidth
			shadow="sm"
			classNames={{
				base: cn('justify-center', {
					'bg-background data-[hover=true]:bg-content1 dark:bg-content1 dark:data-[hover=true]:bg-content2':
						isHighAppearance,
				}),
			}}
			{...props}
		>
			<div className="flex items-center gap-1">
				<div className="m-1 flex rounded-xl shadow-[inset_0_0_2px] shadow-foreground-400">
					{image}
				</div>
				<div className="mr-2 space-y-1 text-left">
					<p className="text-small font-medium">{name}</p>
					{description !== undefined && (
						<p className="text-tiny text-default-700">
							{description}
						</p>
					)}
				</div>
			</div>
		</Card>
	);
});
