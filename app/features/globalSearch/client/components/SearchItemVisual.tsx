import {
	faMagnifyingGlass,
	faSliders,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';

import Sprite from '@/features/catalog/shared/client/components/Sprite';
import type { IGlobalSearchIndexItem } from '@/features/globalSearch/contracts';

function isRoundedSpriteContentTarget(item: IGlobalSearchIndexItem) {
	return (
		item.spriteTarget !== undefined &&
		['special_guest', 'partner'].includes(item.spriteTarget)
	);
}

function getSpriteSize(item: IGlobalSearchIndexItem, size: 'md' | 'sm') {
	if (item.spriteTarget === 'normal_guest') {
		return size === 'sm' ? 1.61 : 2.2;
	}
	return size === 'sm' ? 1.15 : 1.55;
}

function getSpriteClassName(item: IGlobalSearchIndexItem, size: 'md' | 'sm') {
	return cn({
		'-translate-x-[0.2rem] -translate-y-[0.05rem]':
			item.spriteTarget === 'normal_guest' && size === 'sm',
		'-translate-x-[0.3rem] -translate-y-[0.1rem]':
			item.spriteTarget === 'normal_guest' && size === 'md',
		'rounded-full': isRoundedSpriteContentTarget(item),
	});
}

export function SearchItemVisual({
	item,
	size,
}: {
	item: IGlobalSearchIndexItem | null | undefined;
	size: 'md' | 'sm';
}) {
	const visualSizeClassName = size === 'sm' ? 'h-6 w-6' : 'h-9 w-9';
	const isNormalGuestVisual = item?.spriteTarget === 'normal_guest';
	const normalGuestCropSizeClassName =
		size === 'sm' ? 'h-[1.15rem] w-[1.15rem]' : 'h-[1.55rem] w-[1.55rem]';

	return (
		<span
			className={cn(
				'flex shrink-0 items-center justify-center overflow-hidden rounded-small border border-default-200/50 bg-default/35 shadow-sm',
				visualSizeClassName
			)}
		>
			{item?.spriteTarget === undefined ? (
				<FontAwesomeIcon
					icon={
						item?.section === 'preferences'
							? faSliders
							: faMagnifyingGlass
					}
					className={cn(
						size === 'sm' ? 'w-3' : 'w-4',
						'text-foreground-500'
					)}
				/>
			) : isNormalGuestVisual ? (
				<span
					className={cn(
						'block overflow-hidden rounded-full',
						normalGuestCropSizeClassName
					)}
				>
					<Sprite
						target={item.spriteTarget}
						recordId={item.recordId}
						size={getSpriteSize(item, size)}
						className={getSpriteClassName(item, size)}
					/>
				</span>
			) : (
				<Sprite
					target={item.spriteTarget}
					recordId={item.recordId}
					size={getSpriteSize(item, size)}
					className={getSpriteClassName(item, size)}
				/>
			)}
		</span>
	);
}
