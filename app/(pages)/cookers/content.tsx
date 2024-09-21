import {Fragment, type PropsWithChildren, memo, useRef} from 'react';

import {useOpenedItemPopover} from '@/hooks';

import {Popover, PopoverContent, PopoverTrigger, Tooltip} from '@nextui-org/react';

import {TrackCategory, trackEvent} from '@/components/analytics';
import ItemCard from '@/components/itemCard';
import ItemPopoverCard from '@/components/itemPopoverCard';
import Sprite from '@/components/sprite';

import {type ICooker, type TCookerCategories} from '@/data';
// import {globalStore as store} from '@/stores';
import {type Cooker} from '@/utils';

interface INameProps {
	category: TCookerCategories;
}

const Name = memo<PropsWithChildren<INameProps>>(function Name({category, children}) {
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
	data: Cooker['data'];
}

export default memo<IProps>(function Content({data}) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const [openedPopover] = useOpenedItemPopover(popoverCardRef);

	// const isShowBackgroundImage = store.persistence.backgroundImage.use();

	return data.map(({category, dlc, effect, from, name, type}, dataIndex) => (
		<Popover
			key={dataIndex}
			showArrow
			// backdrop={isShowBackgroundImage ? 'blur' : 'opaque'}
			isOpen={openedPopover ? openedPopover === name : (undefined as unknown as boolean)}
		>
			<PopoverTrigger>
				<ItemCard
					isHoverable={openedPopover ? openedPopover === name : true}
					isPressable={openedPopover ? openedPopover === name : true}
					name={<Name category={category}>{name}</Name>}
					image={<Sprite target="cooker" name={name} size={3} />}
					onPress={() => {
						trackEvent(TrackCategory.Click, 'Cooker Card', name);
					}}
				/>
			</PopoverTrigger>
			<PopoverContent>
				<ItemPopoverCard.CloseButton />
				<ItemPopoverCard.ShareButton name={name} />
				<ItemPopoverCard
					target="cooker"
					name={name}
					displayName={<Name category={category}>{name}</Name>}
					description={{type}}
					dlc={dlc}
					ref={popoverCardRef}
				>
					<p className="-mt-1">
						<span className="font-semibold">来源：</span>
						{typeof from === 'string'
							? from
							: Object.entries(from).map((fromObject, index) => {
									type TFrom = Exclude<ICooker['from'], string>;
									const [method, target] = fromObject as [keyof TFrom, TFrom[keyof TFrom]];
									const isBond = method === 'bond';
									const isBuy = method === 'buy';
									const isSelf = method === 'self';
									return (
										<Fragment key={index}>
											{isBond ? (
												<>
													<span className="pr-1">【{target}】羁绊</span>
													Lv.4
													<span className="px-0.5">➞</span>Lv.5
												</>
											) : (
												<>
													{isBuy && target}
													{isSelf && 'buy' in from && '、'}
													{isSelf && '初始拥有'}
												</>
											)}
										</Fragment>
									);
								})}
					</p>
					{effect !== null && (
						<p className="text-justify">
							<span className="font-semibold">效果：</span>
							{Array.isArray(effect) ? (
								(effect[1] as boolean) ? (
									<Popover showArrow offset={6} size="sm">
										<Tooltip showArrow content="只有米斯蒂娅使用才有此效果" offset={3} size="sm">
											<span className="underline-dotted-offset2 cursor-pointer">
												<PopoverTrigger>
													<span tabIndex={0}>{effect[0]}</span>
												</PopoverTrigger>
											</span>
										</Tooltip>
										<PopoverContent>只有米斯蒂娅使用才有此效果</PopoverContent>
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
			</PopoverContent>
		</Popover>
	));
});
