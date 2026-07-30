import { cn } from '@heroui/theme';
import { memo, useRef } from 'react';

import { type Ornament } from '@/domain/catalog/items/Ornament';

import { trackEvent } from '@/features/analytics/client/trackEvent';
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
import type { TItemData } from '@/features/catalog/shared/contracts';
import { ItemPopoverCloseButton } from '@/features/itemSharing/client/components/ItemPopoverCloseButton';
import { ItemShareButton } from '@/features/itemSharing/client/components/ItemShareButton';

import { checkObjectOrStringEmpty } from '@/shared/utilities/collections/check';

interface IProps {
	data: TItemData<Ornament>;
}

export default memo<IProps>(function OrnamentCatalog({ data }) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const { defaultOpenedPopover, getPopoverOpenChangeProps } =
		useOpenedItemPopover(popoverCardRef);
	const { checkDefaultOpen, checkShouldEffect, getPopoverKey } =
		useItemPopoverState(defaultOpenedPopover);

	return data.map(({ description, dlc, effect, from, id, name }, index) => (
		<ItemPopover
			key={getPopoverKey(index, name)}
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
					image={
						<Sprite
							target="ornament"
							name={name}
							size={3}
							className={cn({
								'-translate-x-px': name === '强运桃子',
								'translate-x-px': name === '造物者之盒',
							})}
						/>
					}
					onPress={() => {
						trackEvent(
							trackEvent.category.click,
							'Ornament Card',
							name
						);
					}}
				/>
			</ItemPopoverTrigger>
			<ItemPopoverContent>
				<ItemPopoverCloseButton />
				<ItemShareButton name={name} />
				<ItemPopoverCard
					target="ornament"
					id={id}
					name={name}
					description={{ description }}
					dlc={dlc}
					ref={popoverCardRef}
				>
					{!checkObjectOrStringEmpty(from) && (
						<p className="break-all text-justify">
							<span className="font-semibold">来源：</span>
							{typeof from === 'string' ? (
								from
							) : (
								<>
									<span className="mr-1 inline-flex items-center">
										【
										<Sprite
											target="customer_rare"
											name={from.bond}
											size={1.25}
											className="mx-0.5 rounded-full"
										/>
										{from.bond}】羁绊
									</span>
									Lv.{from.level - 1}
									<span className="mx-0.5">➞</span>Lv.
									{from.level}
									{from.description !== null && (
										<>，{from.description}</>
									)}
								</>
							)}
						</p>
					)}
					<p className="break-all text-justify">
						<span className="font-semibold">效果：</span>
						{effect}
					</p>
				</ItemPopoverCard>
			</ItemPopoverContent>
		</ItemPopover>
	));
});
