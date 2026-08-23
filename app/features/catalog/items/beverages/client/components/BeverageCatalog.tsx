import { cn } from '@heroui/theme';
import { memo, useMemo, useRef } from 'react';

import { type BeverageCatalog as BeverageCatalogModel } from '@/domain/catalog/food/BeverageCatalog';
import { BEVERAGE_TAG_MAP } from '@/domain/data/tags/tagFacts';

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
	data: TItemData<BeverageCatalogModel>;
}

export default memo<IProps>(function BeverageCatalog({ data }) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const { defaultOpenedPopover, getPopoverOpenChangeProps } =
		useOpenedItemPopover(popoverCardRef, data);
	const { checkDefaultOpen, checkShouldEffect, getPopoverKey } =
		useItemPopoverState(defaultOpenedPopover);
	const presentationData = useMemo(
		() =>
			data.map((item) => ({
				description: {
					description: item.description,
					level: item.level,
					price: item.price,
				},
				item,
				tags: {
					beverage: item.tags.map((tag) => BEVERAGE_TAG_MAP[tag]),
				},
			})),
		[data]
	);

	return presentationData.map(
		(
			{ description, item: { dlc, from, id, name, price }, tags },
			dataIndex
		) => (
			<ItemPopover
				key={getPopoverKey(dataIndex, id)}
				showArrow
				/** @todo Add it back after {@link https://github.com/heroui-inc/heroui/issues/3736} is fixed. */
				// backdrop={isHighAppearance ? 'blur' : 'opaque'}
				defaultOpen={checkDefaultOpen(id)}
				{...getPopoverOpenChangeProps(id)}
			>
				<ItemPopoverTrigger>
					<ItemCard
						isHoverable={checkShouldEffect(id)}
						isPressable={checkShouldEffect(id)}
						name={name}
						description={<Price>{price}</Price>}
						image={
							<Sprite
								target="beverage"
								recordId={id}
								size={3}
								className={cn({
									'-translate-x-0.5': id === 17,
									'-translate-x-px': id === 22,
									'translate-x-px': id === 19 || id === 5003,
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
					<ItemShareButton name={name} recordId={id} />
					<ItemPopoverCard
						target="beverage"
						id={id}
						name={name}
						description={description}
						dlc={dlc}
						tags={tags}
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
