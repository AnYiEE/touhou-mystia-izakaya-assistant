import {memo, useRef} from 'react';

import {useOpenedItemPopover} from '@/hooks';

import {Popover, PopoverContent, PopoverTrigger} from '@nextui-org/react';

import {TrackCategory, trackEvent} from '@/components/analytics';
import ItemCard from '@/components/itemCard';
import ItemPopoverCard from '@/components/itemPopoverCard';
import Sprite from '@/components/sprite';

// import {globalStore as store} from '@/stores';
import {type Ornament} from '@/utils';

interface IProps {
	data: Ornament['data'];
}

export default memo<IProps>(function Content({data}) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const [openedPopover] = useOpenedItemPopover(popoverCardRef);

	// const isShowBackgroundImage = store.persistence.backgroundImage.use();

	return data.map(({dlc, effect, from, name}, dataIndex) => (
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
					name={name}
					image={<Sprite target="ornament" name={name} size={3} />}
					onPress={() => {
						trackEvent(TrackCategory.Click, 'Ornament Card', name);
					}}
				/>
			</PopoverTrigger>
			<PopoverContent>
				<ItemPopoverCard.CloseButton />
				<ItemPopoverCard.ShareButton name={name} />
				<ItemPopoverCard target="ornament" name={name} dlc={dlc} ref={popoverCardRef}>
					<p className="-mt-1 text-justify">
						<span className="font-semibold">来源：</span>
						{typeof from === 'string' ? (
							from
						) : (
							<>
								<span className="pr-1">【{from.name}】羁绊</span>
								Lv.{from.level - 1}
								<span className="px-0.5">➞</span>Lv.
								{from.level}
							</>
						)}
					</p>
					<p className="text-justify">
						<span className="font-semibold">效果：</span>
						{effect}
					</p>
				</ItemPopoverCard>
			</PopoverContent>
		</Popover>
	));
});
