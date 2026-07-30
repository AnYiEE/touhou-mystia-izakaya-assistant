import { cn } from '@heroui/theme';
import { Fragment, memo, useRef } from 'react';
import useBreakpoint from 'use-breakpoint';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';

import { type Partner } from '@/domain/catalog/items/Partner';
import type { IPartner } from '@/domain/data/partners/schema';

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

import { checkObjectOrStringEmpty } from '@/shared/utilities/collections/check';

interface IProps {
	data: TItemData<Partner>;
}

export default memo<IProps>(function PartnerCatalog({ data }) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const { defaultOpenedPopover, getPopoverOpenChangeProps } =
		useOpenedItemPopover(popoverCardRef);
	const { checkDefaultOpen, checkShouldEffect, getPopoverKey } =
		useItemPopoverState(defaultOpenedPopover);
	const { breakpoint: placement } = useBreakpoint(
		{ 'right-start': 426, top: -1 },
		'top'
	);

	return data.map(
		(
			{ description, dlc, effect, from, id, name, pay, speed },
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
						name={name}
						image={
							<Sprite
								target="partner"
								name={name}
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
					<ItemShareButton name={name} />
					<ItemPopoverCard
						target="partner"
						id={id}
						name={name}
						description={{ description }}
						dlc={dlc}
						ref={popoverCardRef}
					>
						{!checkObjectOrStringEmpty(from) && (
							<p>
								<span className="font-semibold">来源：</span>
								{typeof from === 'string'
									? from
									: Object.entries(from).map(
											(fromObject, fromIndex) => {
												type TFrom = Exclude<
													IPartner['from'],
													string
												>;
												const [method, target] =
													fromObject as [
														keyof TFrom,
														ExtractCollectionValue<TFrom>,
													];
												const isPlace =
													method === 'place';
												const isSelf =
													method === 'self';
												return (
													<Fragment key={fromIndex}>
														{isPlace
															? `地区【${target}】全部稀客羁绊满级`
															: isSelf
																? '初始拥有'
																: `完成地区【${target}】主线任务`}
													</Fragment>
												);
											}
										)}
							</p>
						)}
						<p>
							<span className="font-semibold">
								支付当天营收的：
							</span>
							{pay}%
						</p>
						<p>
							<span className="font-semibold">移动速度：</span>
							{speed.moving}
						</p>
						<p>
							<span className="font-semibold">工作速度：</span>
							{speed.working}
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
										src={getPartnerTachiePath(name)}
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
