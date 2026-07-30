import { cn } from '@heroui/theme';
import { memo, useRef } from 'react';

import { type Beverage } from '@/domain/catalog/food/Beverage';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { BEVERAGE_TAG_STYLE } from '@/features/catalog/presentation/tagStyles';
import ItemCard from '@/features/catalog/shared/client/components/ItemCard';
import {
	ItemPopover,
	ItemPopoverContent,
	ItemPopoverTrigger,
} from '@/features/catalog/shared/client/components/ItemPopover';
import ItemPopoverCard from '@/features/catalog/shared/client/components/ItemPopoverCard';
import Price from '@/features/catalog/shared/client/components/Price';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import { useItemPopoverState } from '@/features/catalog/shared/client/hooks/useItemPopoverState';
import { useOpenedItemPopover } from '@/features/catalog/shared/client/hooks/useOpenedItemPopover';
import type { TItemData } from '@/features/catalog/shared/contracts';
import { ItemPopoverCloseButton } from '@/features/itemSharing/client/components/ItemPopoverCloseButton';
import { ItemShareButton } from '@/features/itemSharing/client/components/ItemShareButton';

import BeverageSourceDetails from './BeverageSourceDetails';

interface IProps {
	data: TItemData<Beverage>;
}

export default memo<IProps>(function BeverageCatalog({ data }) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const { defaultOpenedPopover, getPopoverOpenChangeProps } =
		useOpenedItemPopover(popoverCardRef);
	const { checkDefaultOpen, checkShouldEffect, getPopoverKey } =
		useItemPopoverState(defaultOpenedPopover);

	return data.map(
		(
			{ description, dlc, from, id, level, name, price, tags },
			dataIndex
		) => (
			<ItemPopover
				key={getPopoverKey(dataIndex, name)}
				showArrow
				/** @todo Add it back after {@link https://github.com/heroui-inc/heroui/issues/3736} is fixed. */
				// backdrop={isHighAppearance ? 'blur' : 'opaque'}
				defaultOpen={checkDefaultOpen(name)}
				{...getPopoverOpenChangeProps(name)}
			>
				<ItemPopoverTrigger>
					<ItemCard
						isHoverable={checkShouldEffect(name)}
						isPressable={checkShouldEffect(name)}
						name={name}
						description={<Price>{price}</Price>}
						image={
							<Sprite
								target="beverage"
								name={name}
								size={3}
								className={cn({
									'-translate-x-0.5': name === '教父',
									'-translate-x-px': name === '玉露茶',
									'translate-x-px':
										name === '冬酿' || name === '太空啤酒',
								})}
							/>
						}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Beverage Card',
								name
							);
						}}
					/>
				</ItemPopoverTrigger>
				<ItemPopoverContent>
					<ItemPopoverCloseButton />
					<ItemShareButton name={name} />
					<ItemPopoverCard
						target="beverage"
						id={id}
						name={name}
						description={{ description, level, price }}
						dlc={dlc}
						tags={{ beverage: tags }}
						tagColors={BEVERAGE_TAG_STYLE}
						ref={popoverCardRef}
					>
						<BeverageSourceDetails from={from} />
					</ItemPopoverCard>
				</ItemPopoverContent>
			</ItemPopover>
		)
	);
});
