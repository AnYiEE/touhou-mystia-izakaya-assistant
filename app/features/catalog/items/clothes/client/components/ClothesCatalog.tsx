import { cn } from '@heroui/theme';
import { memo, useRef } from 'react';
import useBreakpoint from 'use-breakpoint';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';

import { type Clothes } from '@/domain/catalog/items/Clothes';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { getClothesTachiePath } from '@/features/catalog/presentation/tachiePaths';
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
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';

import ClothesSourceDetails from './ClothesSourceDetails';

interface IProps {
	data: TItemData<Clothes>;
}

export default memo<IProps>(function ClothesCatalog({ data }) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const { defaultOpenedPopover, getPopoverOpenChangeProps } =
		useOpenedItemPopover(popoverCardRef);
	const { checkDefaultOpen, checkShouldEffect, getPopoverKey } =
		useItemPopoverState(defaultOpenedPopover);
	const openWindow = useViewInNewWindow();
	const { breakpoint: placement } = useBreakpoint(
		{ 'right-start': 426, top: -1 },
		'top'
	);

	return data.map(
		({ description, dlc, from, id, izakaya, name }, dataIndex) => (
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
								target="clothes"
								name={name}
								size={3}
								className={cn({
									'-translate-x-0.5 scale-85':
										name === '夜雀服',
									'scale-90': name === '雀酒屋工作装',
									'translate-x-px': [
										'中华风校服',
										'锦绣中国娃娃',
										'圣诞节特典晚装',
										'魔女服',
										'仙女服',
									].includes(name),
									'translate-y-px': [
										'冬季水手服',
										'魔女服',
										'朋克演出服',
									].includes(name),
								})}
							/>
						}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Clothes Card',
								name
							);
						}}
					/>
				</ItemPopoverTrigger>
				<ItemPopoverContent>
					<ItemPopoverCloseButton />
					<ItemShareButton name={name} />
					<ItemPopoverCard
						target="clothes"
						id={id}
						name={name}
						description={{ description }}
						dlc={dlc}
						ref={popoverCardRef}
					>
						<ClothesSourceDetails
							from={from}
							openWindow={openWindow}
						/>
						<p>
							<span className="font-semibold">
								可选更改店铺装潢：
							</span>
							{izakaya ? '是' : '否'}
						</p>
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
										src={getClothesTachiePath(name)}
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
