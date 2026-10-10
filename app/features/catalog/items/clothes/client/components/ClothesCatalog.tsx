import { cn } from '@heroui/theme';
import { memo, useMemo, useRef } from 'react';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import { useBreakpoint } from '@/design/ui/hooks/useBreakpoint';

import { type ClothesCatalog as ClothesCatalogModel } from '@/domain/catalog/items/ClothesCatalog';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { catalogItemsMessages } from '@/features/catalog/items/shared/messages';
import { getClothesTachiePath } from '@/features/catalog/presentation/tachiePaths';
import ItemCard from '@/features/catalog/shared/client/components/ItemCard';
import {
	ItemPopover,
	ItemPopoverContent,
	ItemPopoverTrigger,
} from '@/features/catalog/shared/client/components/ItemPopover';
import ItemPopoverCard from '@/features/catalog/shared/client/components/ItemPopoverCard';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import Tachie from '@/features/catalog/shared/client/components/Tachie';
import { useItemPopoverState } from '@/features/catalog/shared/client/hooks/useItemPopoverState';
import { useOpenedItemPopover } from '@/features/catalog/shared/client/hooks/useOpenedItemPopover';
import type { TItemData } from '@/features/catalog/shared/contracts';
import { ItemPopoverCloseButton } from '@/features/itemSharing/client/components/ItemPopoverCloseButton';
import { ItemShareButton } from '@/features/itemSharing/client/components/ItemShareButton';

import { useI18n } from '@/shared/i18n/useI18n';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';

import ClothesSourceDetails from './ClothesSourceDetails';

interface IProps {
	data: TItemData<ClothesCatalogModel>;
}

export default memo<IProps>(function ClothesCatalog({ data }) {
	const { t } = useI18n(catalogItemsMessages);
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const { defaultOpenedPopover, getPopoverOpenChangeProps } =
		useOpenedItemPopover(popoverCardRef, data);
	const { checkDefaultOpen, checkShouldEffect, getPopoverKey } =
		useItemPopoverState(defaultOpenedPopover);
	const openWindow = useViewInNewWindow();
	const { breakpoint: placement } = useBreakpoint(
		{ 'right-start': 426, top: -1 },
		'top'
	);
	const presentationData = useMemo(
		() =>
			data.map((record) => ({
				...record,
				presentationDescription: { description: record.description },
			})),
		[data]
	);

	return presentationData.map(
		(
			{ dlc, from, id, izakaya, name, presentationDescription },
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
						image={
							<Sprite
								target="clothes"
								recordId={id}
								size={3}
								className={cn({
									'-translate-x-0.5 scale-85': id === -1,
									'scale-90': id === -2,
									'translate-x-px': [
										24, 57, 59, 1002, 3002,
									].includes(id),
									'translate-y-px': [
										1001, 1002, 2500,
									].includes(id),
								})}
							/>
						}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Clothes Card',
								name
							);
						}}
					/>
				</ItemPopoverTrigger>
				<ItemPopoverContent>
					<ItemPopoverCloseButton />
					<ItemShareButton name={name} recordId={id} />
					<ItemPopoverCard
						target="clothes"
						id={id}
						name={name}
						description={presentationDescription}
						dlc={dlc}
						ref={popoverCardRef}
					>
						<ClothesSourceDetails
							from={from}
							openWindow={openWindow}
						/>
						<p>
							<span className="font-semibold">
								{t('items.source.changeDecoration')}
							</span>
							{t(
								izakaya ? 'items.source.yes' : 'items.source.no'
							)}
						</p>
						<p>
							<span className="font-semibold">
								{t('items.source.artwork')}
							</span>
							<Popover
								placement={placement}
								showArrow={placement === 'top'}
							>
								<PopoverTrigger>
									<span
										role="button"
										tabIndex={0}
										className={cn(
											'underline-dotted-offset2',
											CLASSNAME_FOCUS_VISIBLE_OUTLINE
										)}
									>
										{t('items.source.viewArtwork')}
									</span>
								</PopoverTrigger>
								<PopoverContent>
									<Tachie
										alt={name}
										src={getClothesTachiePath(id)}
										width={240}
									/>
								</PopoverContent>
							</Popover>
						</p>
					</ItemPopoverCard>
				</ItemPopoverContent>
			</ItemPopover>
		)
	);
});
