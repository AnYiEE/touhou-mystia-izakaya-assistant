import { cn } from '@heroui/theme';
import { memo, useMemo, useRef } from 'react';

import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { type DecorationCatalog as DecorationCatalogModel } from '@/domain/catalog/items/DecorationCatalog';
import { COLLABORATION_LABEL_MAP } from '@/domain/data/labels/collaborationFacts';
import {
	SCHEDULER_FACTS,
	formatSchedulerLabels,
} from '@/domain/data/labels/schedulerFacts';
import { MAP_FACTS } from '@/domain/data/places/placeFacts';

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

interface IProps {
	data: TItemData<DecorationCatalogModel>;
}

const specialGuestCatalog = SpecialGuestCatalog.getInstance();

function DecorationSource({
	from,
}: {
	from: TItemData<DecorationCatalogModel>[number]['from'];
}) {
	if ('bond' in from) {
		const { level, specialGuest } = from.bond;
		const specialGuestName = specialGuestCatalog.getPropsById(
			specialGuest,
			'name'
		);
		const taskFact =
			'task' in from
				? SCHEDULER_FACTS[from.task.startEventLabel]
				: undefined;

		return (
			<>
				<span className="mr-1 inline-flex items-center">
					【
					<Sprite
						target="special_guest"
						recordId={specialGuest}
						size={1.25}
						className="mx-0.5 rounded-full"
					/>
					{specialGuestName}】羁绊
				</span>
				Lv.{level - 1}
				<span className="mx-0.5">➞</span>Lv.{level}
				{'task' in from && (
					<>
						，并完成任务【
						{formatSchedulerLabels(from.task.missionLabel)}】（前往
						{MAP_FACTS[from.task.map].label}的
						{taskFact?.locationLabel}与
						{taskFact?.dialogueGuestLabel}交谈）。
					</>
				)}
			</>
		);
	}

	if ('collaboration' in from) {
		return (
			<>
				开启联动【
				{COLLABORATION_LABEL_MAP[from.collaboration.collaborationLabel]}
				】后自动获得
			</>
		);
	}

	const { maps, specialGuest, story } = from.completion;
	const specialGuestName = specialGuestCatalog.getPropsById(
		specialGuest,
		'name'
	);

	return (
		<>
			地区【{MAP_FACTS[maps[0]].label}】和【
			{MAP_FACTS[maps[1]].label}】全部稀客羁绊满级，并完成【DLC
			{story.dlc}】{story.conditionLabel}后，和【{specialGuestName}
			】对话领取。
		</>
	);
}

export default memo<IProps>(function DecorationCatalog({ data }) {
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
							<span className="font-semibold">来源：</span>
							<DecorationSource from={from} />
						</p>
						<p className="break-all text-justify">
							<span className="font-semibold">效果：</span>
							{effect}
						</p>
					</ItemPopoverCard>
				</ItemPopoverContent>
			</ItemPopover>
		)
	);
});
