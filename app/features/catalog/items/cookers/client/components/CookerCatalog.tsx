import { cn } from '@heroui/theme';
import { type PropsWithChildren, memo, useMemo, useRef } from 'react';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import Tooltip from '@/design/ui/components/tooltip';

import { type CookerCatalog as CookerCatalogModel } from '@/domain/catalog/items/CookerCatalog';
import {
	COOKER_SERIES_LABEL_MAP,
	COOKER_TYPE_LABEL_MAP,
} from '@/domain/data/cookers/cookerFacts';

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
	category: (typeof COOKER_SERIES_LABEL_MAP)[keyof typeof COOKER_SERIES_LABEL_MAP];
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
	data: TItemData<CookerCatalogModel>;
}

export default memo<IProps>(function CookerCatalog({ data }) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const { defaultOpenedPopover, getPopoverOpenChangeProps } =
		useOpenedItemPopover(popoverCardRef, data);
	const { checkDefaultOpen, checkShouldEffect, getPopoverKey } =
		useItemPopoverState(defaultOpenedPopover);
	const openWindow = useViewInNewWindow();
	const presentationData = useMemo(
		() =>
			data.map((record) => {
				const category = COOKER_SERIES_LABEL_MAP[record.series];
				const types = record.availableTypes.map(
					(type) => COOKER_TYPE_LABEL_MAP[type]
				);
				const type = types.length === 1 ? types[0] : types;

				return {
					...record,
					cardName: <Name category={category}>{record.name}</Name>,
					displayName: <Name category={category}>{record.name}</Name>,
					presentationDescription: {
						description: record.description,
						...(type === undefined ? {} : { type }),
					},
				};
			}),
		[data]
	);

	return presentationData.map(
		(
			{
				cardName,
				displayName,
				dlc,
				effect,
				from,
				id,
				name,
				presentationDescription,
			},
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
						name={cardName}
						image={
							<Sprite
								target="cooker"
								recordId={id}
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
					<ItemShareButton name={name} recordId={id} />
					<ItemPopoverCard
						target="cooker"
						id={id}
						name={name}
						displayName={displayName}
						description={presentationDescription}
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
