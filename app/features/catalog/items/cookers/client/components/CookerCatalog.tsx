import { cn } from '@heroui/theme';
import { type PropsWithChildren, memo, useRef } from 'react';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import Tooltip from '@/design/ui/components/tooltip';

import { type Cooker } from '@/domain/catalog/items/Cooker';
import type { TCookerCategory } from '@/domain/data/cookers/types';

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
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';

import CookerSourceDetails from './CookerSourceDetails';

interface INameProps {
	category: TCookerCategory;
}

const Name = memo<PropsWithChildren<INameProps>>(function Name({
	category,
	children,
}) {
	if (typeof children !== 'string' || !children.startsWith(category)) {
		return children;
	}

	return (
		<>
			{category}
			<span className="mx-1">⦁</span>
			{children.replace(category, '')}
		</>
	);
});

interface IProps {
	data: TItemData<Cooker>;
}

export default memo<IProps>(function CookerCatalog({ data }) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const { defaultOpenedPopover, getPopoverOpenChangeProps } =
		useOpenedItemPopover(popoverCardRef);
	const { checkDefaultOpen, checkShouldEffect, getPopoverKey } =
		useItemPopoverState(defaultOpenedPopover);
	const openWindow = useViewInNewWindow();

	return data.map(
		(
			{ category, description, dlc, effect, from, id, name, type },
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
						name={<Name category={category}>{name}</Name>}
						image={
							<Sprite
								target="cooker"
								name={name}
								size={3}
								className={cn({
									'translate-y-px': name.includes('油锅'),
								})}
							/>
						}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Cooker Card',
								name
							);
						}}
					/>
				</ItemPopoverTrigger>
				<ItemPopoverContent>
					<ItemPopoverCloseButton />
					<ItemShareButton name={name} />
					<ItemPopoverCard
						target="cooker"
						id={id}
						name={name}
						displayName={<Name category={category}>{name}</Name>}
						description={{ description, type }}
						dlc={dlc}
						ref={popoverCardRef}
					>
						<CookerSourceDetails
							from={from}
							openWindow={openWindow}
						/>
						{effect !== null && (
							<p className="text-justify">
								<span className="font-semibold">效果：</span>
								{Array.isArray(effect) ? (
									(effect[1] as boolean) ? (
										<Popover showArrow offset={3} size="sm">
											<Tooltip
												showArrow
												content="只有米斯蒂娅使用才有此效果"
												offset={1}
												size="sm"
											>
												<span className="underline-dotted-offset2 cursor-pointer">
													<PopoverTrigger>
														<span
															tabIndex={0}
															className={
																CLASSNAME_FOCUS_VISIBLE_OUTLINE
															}
														>
															{effect[0]}
														</span>
													</PopoverTrigger>
												</span>
											</Tooltip>
											<PopoverContent>
												只有米斯蒂娅使用才有此效果
											</PopoverContent>
										</Popover>
									) : (
										effect[0]
									)
								) : (
									effect
								)}
							</p>
						)}
					</ItemPopoverCard>
				</ItemPopoverContent>
			</ItemPopover>
		)
	);
});
