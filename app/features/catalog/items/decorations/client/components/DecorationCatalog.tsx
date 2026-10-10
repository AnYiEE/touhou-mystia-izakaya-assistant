import { cn } from '@heroui/theme';
import { memo, useMemo, useRef } from 'react';

import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { type DecorationCatalog as DecorationCatalogModel } from '@/domain/catalog/items/DecorationCatalog';
import {
	SCHEDULER_FACTS,
	formatSchedulerLabels,
} from '@/domain/data/labels/schedulerFacts';
import { getCollaborationLabel } from '@/domain/labels/localizedCollaborationLabels';
import {
	getSchedulerTaskGuestLabel,
	getSchedulerTaskLocationLabel,
} from '@/domain/labels/localizedSchedulerLabels';
import { getMapLabel } from '@/domain/places/localizedLabels';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { catalogItemsMessages } from '@/features/catalog/items/shared/messages';
import ItemCard from '@/features/catalog/shared/client/components/ItemCard';
import {
	ItemPopover,
	ItemPopoverContent,
	ItemPopoverTrigger,
} from '@/features/catalog/shared/client/components/ItemPopover';
import ItemPopoverCard from '@/features/catalog/shared/client/components/ItemPopoverCard';
import SpecialGuestBondReference from '@/features/catalog/shared/client/components/SpecialGuestBondReference';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import { useItemPopoverState } from '@/features/catalog/shared/client/hooks/useItemPopoverState';
import { useOpenedItemPopover } from '@/features/catalog/shared/client/hooks/useOpenedItemPopover';
import type { TItemData } from '@/features/catalog/shared/contracts';
import { ItemPopoverCloseButton } from '@/features/itemSharing/client/components/ItemPopoverCloseButton';
import { ItemShareButton } from '@/features/itemSharing/client/components/ItemShareButton';

import { useI18n } from '@/shared/i18n/useI18n';

interface IProps {
	data: TItemData<DecorationCatalogModel>;
}

const specialGuestCatalog = SpecialGuestCatalog.getInstance();

function DecorationSource({
	from,
}: {
	from: TItemData<DecorationCatalogModel>[number]['from'];
}) {
	const { t } = useI18n(catalogItemsMessages);

	if ('bond' in from) {
		const { level, specialGuest } = from.bond;
		const taskFact =
			'task' in from
				? SCHEDULER_FACTS[from.task.startEventLabel]
				: undefined;

		return (
			<>
				<SpecialGuestBondReference
					level={level}
					specialGuest={specialGuest}
				/>
				{'task' in from && (
					<>
						{t('items.source.bondTaskSuffix', {
							guest: getSchedulerTaskGuestLabel(
								taskFact?.dialogueGuestLabel ?? ''
							),
							location: getSchedulerTaskLocationLabel(
								taskFact?.locationLabel ?? ''
							),
							map: getMapLabel(from.task.map),
							task: formatSchedulerLabels(from.task.missionLabel),
						})}
					</>
				)}
			</>
		);
	}

	if ('collaboration' in from) {
		return t('items.source.collaborationTerminal', {
			label: getCollaborationLabel(from.collaboration.collaborationLabel),
		});
	}

	const { maps, specialGuest, story } = from.completion;
	const specialGuestName = specialGuestCatalog.getDisplayPropsById(
		specialGuest,
		'name'
	);

	return t('items.source.bondCompletion', {
		condition: story.conditionLabel,
		dlc: story.dlc,
		guest: specialGuestName,
		map1: getMapLabel(maps[0]),
		map2: getMapLabel(maps[1]),
	});
}

export default memo<IProps>(function DecorationCatalog({ data }) {
	const { t } = useI18n(catalogItemsMessages);
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const { defaultOpenedPopover, getPopoverOpenChangeProps } =
		useOpenedItemPopover(popoverCardRef, data);
	const { checkDefaultOpen, checkShouldEffect, getPopoverKey } =
		useItemPopoverState(defaultOpenedPopover);
	const presentationData = useMemo(
		() =>
			data.map((record) => ({
				...record,
				presentationDescription: { description: record.description },
			})),
		[data]
	);

	return presentationData.map(
		({ dlc, effect, from, id, name, presentationDescription }, index) => (
			<ItemPopover
				key={getPopoverKey(index, id)}
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
								target="decoration"
								recordId={id}
								size={3}
								className={cn({
									'-translate-x-px': id === 34,
									'translate-x-px': id === 5014,
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
					<ItemShareButton name={name} recordId={id} />
					<ItemPopoverCard
						target="decoration"
						id={id}
						name={name}
						description={presentationDescription}
						dlc={dlc}
						ref={popoverCardRef}
					>
						<p className="break-all text-justify">
							<span className="font-semibold">
								{t('items.source.from')}
							</span>
							<DecorationSource from={from} />
						</p>
						<p className="break-all text-justify">
							<span className="font-semibold">
								{t('items.source.effect')}
							</span>
							{effect}
						</p>
					</ItemPopoverCard>
				</ItemPopoverContent>
			</ItemPopover>
		)
	);
});
