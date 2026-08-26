import { cn } from '@heroui/theme';
import { memo, useMemo, useRef } from 'react';
import useBreakpoint from 'use-breakpoint';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';

import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { type PartnerCatalog as PartnerCatalogModel } from '@/domain/catalog/items/PartnerCatalog';
import type { TPartnerSource } from '@/domain/data/partners/schema';
import { MAP_FACTS, PLACE_LABEL_MAP } from '@/domain/data/places/placeFacts';
import { SPEED_LABEL_MAP } from '@/domain/data/partners/speedFacts';

import { trackEvent } from '@/features/analytics/client/trackEvent';
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

interface IProps {
	data: TItemData<PartnerCatalogModel>;
}

const specialGuestCatalog = SpecialGuestCatalog.getInstance();

function formatPartnerSource(source: TPartnerSource) {
	if ('self' in source) {
		return '初始拥有';
	}
	if ('mapMainTask' in source) {
		return `完成地区【${MAP_FACTS[source.mapMainTask.map].label}】主线任务`;
	}
	if ('allMapSpecialGuestBondsMaxed' in source) {
		return `地区【${MAP_FACTS[source.allMapSpecialGuestBondsMaxed.map].label}】全部稀客羁绊满级`;
	}
	if ('unlockedMapDialogue' in source) {
		return `解锁地区【${MAP_FACTS[source.unlockedMapDialogue.map].label}】后，和【${specialGuestCatalog.getPropsById(source.unlockedMapDialogue.specialGuest, 'name')}】对话。`;
	}
	if ('datedMapTrial' in source) {
		return `解锁地区【${MAP_FACTS[source.datedMapTrial.map].label}】后，完成由【${specialGuestCatalog.getPropsById(source.datedMapTrial.specialGuest, 'name')}】于${source.datedMapTrial.month}月${source.datedMapTrial.day}日发起的试炼。`;
	}

	return `${source.storyDialogue.prerequisiteLabel}后，和地区【${PLACE_LABEL_MAP[source.storyDialogue.placeLabel]}】的【${specialGuestCatalog.getPropsById(source.storyDialogue.specialGuest, 'name')}】对话，选择“${source.storyDialogue.dialogueOptionLabel}”。`;
}

export default memo<IProps>(function PartnerCatalog({ data }) {
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
							<span className="font-semibold">来源：</span>
							{formatPartnerSource(from)}
						</p>
						<p>
							<span className="font-semibold">
								支付当天营收的：
							</span>
							{pay}%
						</p>
						<p>
							<span className="font-semibold">移动速度：</span>
							{SPEED_LABEL_MAP[speed.moving]}
						</p>
						<p>
							<span className="font-semibold">工作速度：</span>
							{SPEED_LABEL_MAP[speed.working]}
						</p>
						{effect !== null && (
							<p className="break-all text-justify">
								<span className="font-semibold">效果：</span>
								{effect}
							</p>
						)}
						<p>
							<span className="font-semibold">立绘：</span>
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
										查看立绘
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
