'use client';

import {type ElementRef, forwardRef, memo} from 'react';

import {Card, type CardProps, cn} from '@nextui-org/react';

import {globalStore as store} from '@/stores';

interface IProps extends Omit<CardProps, 'className' | 'classNames'> {
	name: ReactNodeWithoutBoolean;
	description?: ReactNodeWithoutBoolean;
	image: ReactNodeWithoutBoolean;
}

export default memo(
	forwardRef<ElementRef<typeof Card>, IProps>(function ItemCard({description, image, name, ...cardProps}, ref) {
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
				{...cardProps}
				ref={ref}
			>
				<div className="flex items-center gap-1">
					<div className="m-1 flex rounded-xl shadow-[inset_0_0_2px] shadow-foreground-400">{image}</div>
					<div className="mr-2 space-y-1 text-left">
						<p className="text-small font-medium text-default-700">{name}</p>
						{description !== undefined && (
							<p className="text-tiny text-default-400 dark:text-default-500">{description}</p>
						)}
					</div>
				</div>
			</Card>
		);
	})
);
