import { cn } from '@heroui/theme';
import { memo, useMemo, useRef } from 'react';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import { useBreakpoint } from '@/design/ui/hooks/useBreakpoint';

import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { type PartnerCatalog as PartnerCatalogModel } from '@/domain/catalog/items/PartnerCatalog';
import type { TPartnerSource } from '@/domain/data/partners/schema';
import { getMapLabel, getPlaceLabel } from '@/domain/places/localizedLabels';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import {
	CATALOG_ITEMS_SPEED_LABEL_MESSAGE_KEYS,
	type TCatalogItemsTranslate,
	catalogItemsMessages,
} from '@/features/catalog/items/shared/messages';
import { getPartnerTachiePath } from '@/features/catalog/presentation/tachiePaths';
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

interface IProps {
	data: TItemData<PartnerCatalogModel>;
}

const specialGuestCatalog = SpecialGuestCatalog.getInstance();

function formatPartnerSource(
	source: TPartnerSource,
	t: TCatalogItemsTranslate
) {
	if ('self' in source) {
		return t('items.source.initialOwned');
	}
	if ('mapMainTask' in source) {
		return t('items.source.mainTask', {
			map: getMapLabel(source.mapMainTask.map),
		});
	}
	if ('allMapSpecialGuestBondsMaxed' in source) {
		return t('items.source.allBondsMaxed', {
			map: getMapLabel(source.allMapSpecialGuestBondsMaxed.map),
		});
	}
	if ('unlockedMapDialogue' in source) {
		return t('items.source.unlockMapDialogue', {
			guest: specialGuestCatalog.getDisplayPropsById(
				source.unlockedMapDialogue.specialGuest,
				'name'
			),
			map: getMapLabel(source.unlockedMapDialogue.map),
		});
	}
	if ('datedMapTrial' in source) {
		return t('items.source.datedMapTrial', {
			day: source.datedMapTrial.day,
			guest: specialGuestCatalog.getDisplayPropsById(
				source.datedMapTrial.specialGuest,
				'name'
			),
			map: getMapLabel(source.datedMapTrial.map),
			month: source.datedMapTrial.month,
		});
	}

	return t('items.source.storyDialogue', {
		guest: specialGuestCatalog.getDisplayPropsById(
			source.storyDialogue.specialGuest,
			'name'
		),
		option: source.storyDialogue.dialogueOptionLabel,
		place: getPlaceLabel(source.storyDialogue.placeLabel),
		prerequisite: source.storyDialogue.prerequisiteLabel,
	});
}

export default memo<IProps>(function PartnerCatalog({ data }) {
	const { t } = useI18n(catalogItemsMessages);
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const { defaultOpenedPopover, getPopoverOpenChangeProps } =
		useOpenedItemPopover(popoverCardRef, data);
	const { checkDefaultOpen, checkShouldEffect, getPopoverKey } =
		useItemPopoverState(defaultOpenedPopover);
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
			{
				dlc,
				effect,
				from,
				id,
				name,
				pay,
				presentationDescription,
				speed,
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
						name={name}
						image={
							<Sprite
								target="partner"
								recordId={id}
								size={3}
								className="scale-90 rounded-xl"
							/>
						}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Partner Card',
								name
							);
						}}
					/>
				</ItemPopoverTrigger>
				<ItemPopoverContent>
					<ItemPopoverCloseButton />
					<ItemShareButton name={name} recordId={id} />
					<ItemPopoverCard
						target="partner"
						id={id}
						name={name}
						description={presentationDescription}
						dlc={dlc}
						ref={popoverCardRef}
					>
						<p>
							<span className="font-semibold">
								{t('items.source.from')}
							</span>
							{formatPartnerSource(from, t)}
						</p>
						<p>
							<span className="font-semibold">
								{t('items.source.pay')}
							</span>
							{pay}%
						</p>
						<p>
							<span className="font-semibold">
								{t('items.source.movingSpeed')}
							</span>
							{t(
								CATALOG_ITEMS_SPEED_LABEL_MESSAGE_KEYS[
									speed.moving
								]
							)}
						</p>
						<p>
							<span className="font-semibold">
								{t('items.source.workingSpeed')}
							</span>
							{t(
								CATALOG_ITEMS_SPEED_LABEL_MESSAGE_KEYS[
									speed.working
								]
							)}
						</p>
						{effect !== null && (
							<p className="break-all text-justify">
								<span className="font-semibold">
									{t('items.source.effect')}
								</span>
								{effect}
							</p>
						)}
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
										src={getPartnerTachiePath(id)}
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
