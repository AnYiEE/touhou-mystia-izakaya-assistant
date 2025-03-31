import {Fragment, memo, useRef} from 'react';

import useBreakpoint from 'use-breakpoint';
import {useItemPopoverState, useOpenedItemPopover} from '@/hooks';

import {CLASSNAME_FOCUS_VISIBLE_OUTLINE, Popover, PopoverContent, PopoverTrigger, cn} from '@/design/ui/components';

import {trackEvent} from '@/components/analytics';
import ItemCard from '@/components/itemCard';
import ItemPopoverCard from '@/components/itemPopoverCard';
import Sprite from '@/components/sprite';
import Tachie from '@/components/tachie';

import {type IPartner} from '@/data';
import {partnersStore /* , globalStore */} from '@/stores';
import {type Partner} from '@/utils';
import type {TItemData} from '@/utils/types';

interface IProps {
	data: TItemData<Partner>;
}

export default memo<IProps>(function Content({data}) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const [openedPopover] = useOpenedItemPopover(popoverCardRef);
	const {checkDefaultOpen, checkShouldEffect} = useItemPopoverState(openedPopover);
	const {breakpoint: placement} = useBreakpoint(
		{
			'right-start': 426,
			top: -1,
		},
		'top'
	);

	// const isHighAppearance = globalStore.persistence.highAppearance.use();

	const instance = partnersStore.instance.get();

	return data.map(({description, dlc, effect, from, id, name, pay, speed}, dataIndex) => (
		<ItemPopoverCard.Popover
			key={dataIndex}
			showArrow
			/** @todo Add it back after {@link https://github.com/heroui-inc/heroui/issues/3736} is fixed. */
			// backdrop={isHighAppearance ? 'blur' : 'opaque'}
			isOpen={checkDefaultOpen(name)}
		>
			<ItemPopoverCard.Trigger>
				<ItemCard
					isHoverable={checkShouldEffect(name)}
					isPressable={checkShouldEffect(name)}
					name={name}
					image={<Sprite target="partner" name={name} size={3} className="scale-90 rounded-xl" />}
					onPress={() => {
						trackEvent(trackEvent.category.click, 'Partner Card', name);
					}}
				/>
			</ItemPopoverCard.Trigger>
			<ItemPopoverCard.Content>
				<ItemPopoverCard.CloseButton />
				<ItemPopoverCard.ShareButton name={name} />
				<ItemPopoverCard
					target="partner"
					id={id}
					name={name}
					description={{description}}
					dlc={dlc}
					ref={popoverCardRef}
				>
					<p>
						<span className="font-semibold">来源：</span>
						{typeof from === 'string'
							? from
							: Object.entries(from).map((fromObject, fromIndex) => {
									type TFrom = Exclude<IPartner['from'], string>;
									const [method, target] = fromObject as [keyof TFrom, ExtractCollectionValue<TFrom>];
									const isPlace = method === 'place';
									const isSelf = method === 'self';
									return (
										<Fragment key={fromIndex}>
											{isPlace
												? `地区【${target}】全部稀客羁绊满级`
												: isSelf
													? '初始拥有'
													: `完成地区【${target}】主线任务`}
										</Fragment>
									);
								})}
					</p>
					<p>
						<span className="font-semibold">支付当天营收的：</span>
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
						<Popover placement={placement} showArrow={placement === 'top'}>
							<PopoverTrigger>
								<span
									role="button"
									tabIndex={0}
									className={cn('underline-dotted-offset2', CLASSNAME_FOCUS_VISIBLE_OUTLINE)}
								>
									查看立绘
								</span>
							</PopoverTrigger>
							<PopoverContent>
								<Tachie alt={name} src={instance.getTachiePath(name)} width={240} />
							</PopoverContent>
						</Popover>
					</p>
				</ItemPopoverCard>
			</ItemPopoverCard.Content>
		</ItemPopoverCard.Popover>
	));
});
