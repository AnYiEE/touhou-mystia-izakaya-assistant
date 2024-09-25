import {Fragment, memo, useRef} from 'react';
import {isObjectLike} from 'lodash';
import {twJoin} from 'tailwind-merge';

import useBreakpoint from 'use-breakpoint';
import {useOpenedItemPopover} from '@/hooks';

import {PopoverContent, PopoverTrigger} from '@nextui-org/react';

import {TrackCategory, trackEvent} from '@/components/analytics';
import ItemCard from '@/components/itemCard';
import ItemPopoverCard from '@/components/itemPopoverCard';
import Popover from '@/components/popover';
import Sprite from '@/components/sprite';
import Tachie from '@/components/tachie';

import {type IClothes} from '@/data';
import {clothesStore /* , globalStore */} from '@/stores';
import {type Clothes} from '@/utils';

interface IProps {
	data: Clothes['data'];
}

export default memo<IProps>(function Content({data}) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const [openedPopover] = useOpenedItemPopover(popoverCardRef);
	const {breakpoint: placement} = useBreakpoint(
		{
			'right-start': 426,
			top: -1,
		},
		'top'
	);

	// const isShowBackgroundImage = globalStore.persistence.backgroundImage.use();

	const instance_clothes = clothesStore.instance.get();

	return data.map(({dlc, from, izakaya, name}, dataIndex) => (
		<Popover
			key={dataIndex}
			showArrow
			// backdrop={isShowBackgroundImage ? 'blur' : 'opaque'}
			isOpen={openedPopover ? openedPopover === name : (undefined as unknown as boolean)}
		>
			<ItemPopoverCard.Trigger>
				<ItemCard
					isHoverable={openedPopover ? openedPopover === name : true}
					isPressable={openedPopover ? openedPopover === name : true}
					name={name}
					image={
						<Sprite
							target="clothes"
							name={name}
							size={3}
							className={twJoin(
								isObjectLike(from) && 'self' in from && 'scale-90',
								name === '夜雀服' && '-translate-x-0.5 scale-85'
							)}
						/>
					}
					onPress={() => {
						trackEvent(TrackCategory.Click, 'Clothes Card', name);
					}}
				/>
			</ItemPopoverCard.Trigger>
			<PopoverContent>
				<ItemPopoverCard.CloseButton />
				<ItemPopoverCard.ShareButton name={name} />
				<ItemPopoverCard target="clothes" name={name} dlc={dlc} ref={popoverCardRef}>
					<p className="-mt-1">
						<span className="font-semibold">来源：</span>
						{typeof from === 'string'
							? from
							: Object.entries(from).map((fromObject, fromIndex) => {
									type TFrom = Exclude<IClothes['from'], string>;
									const [method, target] = fromObject as [keyof TFrom, TFrom[keyof TFrom]];
									const isBuy = method === 'buy';
									const isSelf = method === 'self';
									return (
										<Fragment key={fromIndex}>
											{isBuy ? (
												target
											) : isSelf ? (
												'初始拥有'
											) : (
												<>
													<span className="pr-1">【{target}】羁绊</span>
													Lv.4
													<span className="px-0.5">➞</span>Lv. 5
												</>
											)}
										</Fragment>
									);
								})}
					</p>
					<p className="text-justify">
						<span className="font-semibold">可选更改店铺装潢：</span>
						{izakaya ? '是' : '否'}
					</p>
					<p className="text-justify">
						<span className="font-semibold">立绘：</span>
						{(() => {
							const tachie = <Tachie alt={name} src={instance_clothes.getTachiePath(name)} width={240} />;
							return (
								<Popover placement={placement} showArrow={placement === 'top'}>
									<PopoverTrigger>
										<span role="button" tabIndex={0} className="underline-dotted-offset2">
											查看立绘
										</span>
									</PopoverTrigger>
									<PopoverContent>{tachie}</PopoverContent>
								</Popover>
							);
						})()}
					</p>
				</ItemPopoverCard>
			</PopoverContent>
		</Popover>
	));
});
