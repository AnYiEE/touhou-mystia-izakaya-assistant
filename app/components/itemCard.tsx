import {forwardRef, type ReactNode} from 'react';

import {Card, type CardProps} from '@nextui-org/react';

interface IProps {
	name: string;
	description: string;
	image: ReactNode;
	isDisabled: CardProps['isDisabled'];
	isHoverable: CardProps['isHoverable'];
	isPressable: CardProps['isPressable'];
	onPress: CardProps['onPress'];
}

const ItemCard = forwardRef<HTMLDivElement, Partial<IProps>>(function ItemCard(props, ref) {
	const {name, description, image, onPress, ...cardProps} = props;

	return (
		<Card shadow="sm" className="w-full" onPress={onPress ?? (() => {})} {...cardProps} ref={ref}>
			<div className="flex items-center">
				<div className="m-1 flex rounded-xl shadow-[inset_0_0_2px] shadow-foreground-400">{image}</div>
				<div className="mx-1 inline-flex flex-col text-left">
					<p className="text-small font-medium">{name ?? ''}</p>
					<p className="mt-1 text-xs font-light text-default-500">{description ?? ''}</p>
				</div>
			</div>
		</Card>
	);
});

export default ItemCard;
