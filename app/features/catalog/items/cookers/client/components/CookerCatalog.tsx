import { cn } from '@heroui/theme';
import { type PropsWithChildren, memo, useMemo, useRef } from 'react';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import Tooltip from '@/design/ui/components/tooltip';

import { CookerCatalog as CookerCatalogModel } from '@/domain/catalog/items/CookerCatalog';
import {
	getCookerSeriesLabel,
	getCookerTypeLabel,
} from '@/domain/catalog/localizedCategoryLabels';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { catalogItemsMessages } from '@/features/catalog/items/shared/messages';
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

import { useI18n } from '@/shared/i18n/useI18n';

import CookerSourceDetails from './CookerSourceDetails';

interface INameProps {
	category: string;
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
	const { t } = useI18n(catalogItemsMessages);
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const { defaultOpenedPopover, getPopoverOpenChangeProps } =
		useOpenedItemPopover(popoverCardRef, data);
	const { checkDefaultOpen, checkShouldEffect, getPopoverKey } =
		useItemPopoverState(defaultOpenedPopover);
	const openWindow = useViewInNewWindow();
	const presentationData = useMemo(
		() =>
			data.map((record) => {
				const category = getCookerSeriesLabel(record.series);
				const types = record.availableTypes.map((type) =>
					getCookerTypeLabel(type)
				);
				const type = types.length === 1 ? types[0] : types;
				const canonicalName =
					CookerCatalogModel.getInstance().getPropsById(
						record.id
					).name;

				return {
					...record,
					cardName: <Name category={category}>{record.name}</Name>,
					displayName: <Name category={category}>{record.name}</Name>,
					isFryingPanFamily: canonicalName.includes('油锅'),
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
				isFryingPanFamily,
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
									'translate-y-px': isFryingPanFamily,
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
								<span className="font-semibold">
									{t('items.source.effect')}
								</span>
								{Array.isArray(effect) ? (
									(effect[1] as boolean) ? (
										<Popover showArrow offset={3} size="sm">
											<Tooltip
												showArrow
												content={t(
													'items.cooker.mystiaOnly'
												)}
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
												{t('items.cooker.mystiaOnly')}
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
