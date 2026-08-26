import { memo, useRef } from 'react';

import type { TSpriteId, TSpriteTarget } from '@/domain/data/sprites/types';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import type { TItemCard } from '@/features/analytics/contracts';
import ItemCard from '@/features/catalog/shared/client/components/ItemCard';
import {
	ItemPopover,
	ItemPopoverContent,
	ItemPopoverTrigger,
} from '@/features/catalog/shared/client/components/ItemPopover';
import ItemPopoverCard from '@/features/catalog/shared/client/components/ItemPopoverCard';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import { useItemPopoverState } from '@/features/catalog/shared/client/hooks/useItemPopoverState';
import { useOpenedItemPopover } from '@/features/catalog/shared/client/hooks/useOpenedItemPopover';
import { ItemPopoverCloseButton } from '@/features/itemSharing/client/components/ItemPopoverCloseButton';
import { ItemShareButton } from '@/features/itemSharing/client/components/ItemShareButton';
import type {
	TShareableItemId,
	TShareableItemName,
} from '@/features/itemSharing/contracts';

interface ICollectibleItem<TTarget extends TSpriteTarget> {
	description: string;
	dlc: number;
	id: TSpriteId<TTarget> & TShareableItemId;
	name: TShareableItemName;
}

interface IProps<
	TTarget extends TSpriteTarget,
	TItem extends ICollectibleItem<TTarget>,
> {
	cardDescription?: (item: TItem) => ReactNodeWithoutBoolean;
	children?: (item: TItem) => ReactNodeWithoutBoolean;
	data: ReadonlyArray<TItem>;
	descriptionLabel?: string;
	details?: (item: TItem) => ReactNodeWithoutBoolean;
	summaryDetails?: (item: TItem) => ReactNodeWithoutBoolean;
	target: TTarget;
	trackingLabel: TItemCard;
}

function CollectibleCatalog<
	TTarget extends TSpriteTarget,
	TItem extends ICollectibleItem<TTarget>,
>({
	cardDescription,
	children,
	data,
	descriptionLabel,
	details,
	summaryDetails,
	target,
	trackingLabel,
}: IProps<TTarget, TItem>) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const { defaultOpenedPopover, getPopoverOpenChangeProps } =
		useOpenedItemPopover(popoverCardRef, data);
	const { checkDefaultOpen, checkShouldEffect, getPopoverKey } =
		useItemPopoverState(defaultOpenedPopover);

	return data.map((item, dataIndex) => {
		const { description, dlc, id, name } = item;
		return (
			<ItemPopover
				key={getPopoverKey(dataIndex, id)}
				showArrow
				defaultOpen={checkDefaultOpen(id)}
				{...getPopoverOpenChangeProps(id)}
			>
				<ItemPopoverTrigger>
					<ItemCard
						isHoverable={checkShouldEffect(id)}
						isPressable={checkShouldEffect(id)}
						name={name}
						description={cardDescription?.(item)}
						image={
							<Sprite target={target} recordId={id} size={3} />
						}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								trackingLabel,
								name
							);
						}}
					/>
				</ItemPopoverTrigger>
				<ItemPopoverContent>
					<ItemPopoverCloseButton />
					<ItemShareButton name={name} recordId={id} />
					<ItemPopoverCard
						target={target}
						id={id}
						name={name}
						description={{ description }}
						{...(descriptionLabel === undefined
							? {}
							: { descriptionLabel })}
						details={details?.(item)}
						summaryDetails={summaryDetails?.(item)}
						dlc={dlc}
						ref={popoverCardRef}
					>
						{children?.(item)}
					</ItemPopoverCard>
				</ItemPopoverContent>
			</ItemPopover>
		);
	});
}

export default memo(CollectibleCatalog) as unknown as typeof CollectibleCatalog;
