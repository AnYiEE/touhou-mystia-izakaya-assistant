import {memo, useRef} from 'react';

import {useOpenedItemPopover} from '@/hooks';

import {PopoverContent} from '@nextui-org/react';

import {TrackCategory, trackEvent} from '@/components/analytics';
import ItemCard from '@/components/itemCard';
import ItemPopoverCard from '@/components/itemPopoverCard';
import Popover from '@/components/popover';
import Sprite from '@/components/sprite';

// import {globalStore as store} from '@/stores';
import {type Currency} from '@/utils';

interface IProps {
	data: Currency['data'];
}

export default memo<IProps>(function Content({data}) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const [openedPopover] = useOpenedItemPopover(popoverCardRef);

	// const isHighAppearance = store.persistence.highAppearance.use();

	return data.map(({description, dlc, from, id, name}, dataIndex) => (
		<Popover
			key={dataIndex}
			showArrow
			/** @todo Add it back after {@link https://github.com/nextui-org/nextui/issues/3736} is fixed. */
			// backdrop={isHighAppearance ? 'blur' : 'opaque'}
			isOpen={openedPopover ? openedPopover === name : (undefined as unknown as boolean)}
		>
			<ItemPopoverCard.Trigger>
				<ItemCard
					isHoverable={openedPopover ? openedPopover === name : true}
					isPressable={openedPopover ? openedPopover === name : true}
					name={name}
					image={<Sprite target="currency" name={name} size={3} />}
					onPress={() => {
						trackEvent(TrackCategory.Click, 'Currency Card', name);
					}}
				/>
			</ItemPopoverCard.Trigger>
			<PopoverContent>
				<ItemPopoverCard.CloseButton />
				<ItemPopoverCard.ShareButton name={name} />
				<ItemPopoverCard
					target="currency"
					id={id}
					name={name}
					description={{description}}
					dlc={dlc}
					ref={popoverCardRef}
				>
					<p>
						<span className="font-semibold">来源：</span>
						{typeof from === 'string' ? from : `地区【${from.task}】支线任务`}
					</p>
				</ItemPopoverCard>
			</PopoverContent>
		</Popover>
	));
});
