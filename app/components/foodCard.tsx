import {forwardRef, memo} from 'react';

import {Card, type CardProps} from '@nextui-org/react';

import {type TFoodNames} from '@/data';

interface IProps extends Omit<CardProps, 'className'> {
	name: TFoodNames;
	description: ReactNodeWithoutBoolean;
	image: ReactNodeWithoutBoolean;
}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function FoodCard({name, description, image, ...cardProps}, ref) {
		return (
			<Card
				fullWidth
				shadow="sm"
				classNames={{
					base: 'justify-center',
				}}
				{...cardProps}
				ref={ref}
			>
				<div className="flex items-center gap-1">
					<div className="m-1 flex rounded-xl shadow-[inset_0_0_2px] shadow-foreground-400">{image}</div>
					<div className="mr-2 space-y-1 text-left">
						<p className="text-small font-medium text-default-700">{name}</p>
						<p className="text-xs text-default-400 dark:text-default-500">{description}</p>
					</div>
				</div>
			</Card>
		);
	})
);
