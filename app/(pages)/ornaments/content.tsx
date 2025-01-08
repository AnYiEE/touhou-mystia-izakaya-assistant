import {memo, useRef} from 'react';

import {useOpenedItemPopover} from '@/hooks';

import {PopoverContent} from '@nextui-org/react';

import {cn} from '@/design/ui/components';

import {trackEvent} from '@/components/analytics';
import ItemCard from '@/components/itemCard';
import ItemPopoverCard from '@/components/itemPopoverCard';
import Popover from '@/components/popover';
import Sprite from '@/components/sprite';

// import {globalStore as store} from '@/stores';
import {type Ornament} from '@/utils';
import type {TItemData} from '@/utils/types';

interface IProps {
	data: TItemData<Ornament>;
}

export default memo<IProps>(function Content({data}) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const [openedPopover] = useOpenedItemPopover(popoverCardRef);

	// const isHighAppearance = store.persistence.highAppearance.use();

	return data.map(({description, dlc, effect, from, id, name}, index) => (
		<Popover
			key={index}
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
					image={
						<Sprite
							target="ornament"
							name={name}
							size={3}
							className={cn({
								'-translate-x-px': name === '强运桃子',
								'translate-x-px': name === '造物者之盒',
							})}
						/>
					}
					onPress={() => {
						trackEvent(trackEvent.category.Click, 'Ornament Card', name);
					}}
				/>
			</ItemPopoverCard.Trigger>
			<PopoverContent>
				<ItemPopoverCard.CloseButton />
				<ItemPopoverCard.ShareButton name={name} />
				<ItemPopoverCard
					target="ornament"
					id={id}
					name={name}
					description={{description}}
					dlc={dlc}
					ref={popoverCardRef}
				>
					<p className="break-all text-justify">
						<span className="font-semibold">来源：</span>
						{typeof from === 'string' ? (
							from
						) : (
							<>
								<span className="mr-1 inline-flex items-center">
									【
									<Sprite
										target="customer_rare"
										name={from.bond}
										size={1.25}
										className="mx-0.5 rounded-full"
									/>
									{from.bond}】羁绊
								</span>
								Lv.{from.level - 1}
								<span className="mx-0.5">➞</span>Lv.
								{from.level}
							</>
						)}
					</p>
					<p className="break-all text-justify">
						<span className="font-semibold">效果：</span>
						{effect}
					</p>
				</ItemPopoverCard>
			</PopoverContent>
		</Popover>
	));
});
