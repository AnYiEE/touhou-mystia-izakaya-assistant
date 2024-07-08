import {type ReactNode, forwardRef, memo} from 'react';

import {Card, type CardProps} from '@nextui-org/react';

import {type TFoodNames} from '@/data';

interface IProps extends Omit<CardProps, 'className'> {
	name: TFoodNames;
	description: string;
	image: ReactNode;
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
				<div className="flex items-center">
					<div className="m-1 flex rounded-xl shadow-[inset_0_0_2px] shadow-foreground-400">{image}</div>
					<div className="mx-1 inline-flex flex-col text-left">
						<p className="text-small font-medium text-default-700">{name}</p>
						<p className="mt-1 text-xs text-default-500">{description}</p>
					</div>
				</div>
			</Card>
		);
	})
);
