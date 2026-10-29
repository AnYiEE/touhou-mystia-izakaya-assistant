import { cn } from '@heroui/theme';
import { memo, useMemo, useRef } from 'react';

import { type CurrencyItemCatalog as CurrencyItemCatalogModel } from '@/domain/catalog/items/CurrencyItemCatalog';

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
import { renderContentDlcSections } from '@/features/catalog/shared/client/renderContentDlcSections';
import type { TItemData } from '@/features/catalog/shared/contracts';
import { ItemPopoverCloseButton } from '@/features/itemSharing/client/components/ItemPopoverCloseButton';
import { ItemShareButton } from '@/features/itemSharing/client/components/ItemShareButton';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';

import CurrencyItemSourceDetails from './CurrencyItemSourceDetails';

interface IProps {
	data: TItemData<CurrencyItemCatalogModel>;
}

export default memo<IProps>(function CurrencyItemsCatalog({ data }) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const { defaultOpenedPopover, getPopoverOpenChangeProps } =
		useOpenedItemPopover(popoverCardRef, data);
	const { checkDefaultOpen, checkShouldEffect, getPopoverKey } =
		useItemPopoverState(defaultOpenedPopover);
	const openWindow = useViewInNewWindow();
	const presentationData = useMemo(
		() =>
			data.map((record) => ({
				...record,
				presentationDescription: { description: record.description },
			})),
		[data]
	);

	return renderContentDlcSections(
		presentationData,
		({ dlc }) => dlc,
		({ dlc, from, id, name, presentationDescription }, dataIndex) => (
			<ItemPopover
				key={getPopoverKey(dataIndex, id)}
				showArrow
				/** @todo Add it back after {@link https://github.com/heroui-inc/heroui/issues/3736} is fixed. */
				// backdrop={isHighAppearance ? 'blur' : 'opaque'}
				defaultOpen={checkDefaultOpen(id)}
				{...getPopoverOpenChangeProps(id)}
			>
				<ItemPopoverTrigger supportRecordId={id}>
					<ItemCard
						isHoverable={checkShouldEffect(id)}
						isPressable={checkShouldEffect(id)}
						name={name}
						image={
							<Sprite
								target="currency_item"
								recordId={id}
								size={3}
								className={cn({
									'-translate-y-px': id === 6 || id === 29,
									'translate-x-px': id === 5 || id === 5011,
								})}
							/>
						}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Currency Card',
								name
							);
						}}
					/>
				</ItemPopoverTrigger>
				<ItemPopoverContent>
					<ItemPopoverCloseButton />
					<ItemShareButton name={name} recordId={id} />
					<ItemPopoverCard
						target="currency_item"
						id={id}
						name={name}
						description={presentationDescription}
						dlc={dlc}
						ref={popoverCardRef}
					>
						<CurrencyItemSourceDetails
							from={from}
							id={id}
							openWindow={openWindow}
						/>
					</ItemPopoverCard>
				</ItemPopoverContent>
			</ItemPopover>
		)
	);
});
