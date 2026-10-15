'use client';

import { memo } from 'react';

import {
	faDoorOpen,
	faFish,
	faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';

import { getCharacterSpriteUrl } from '@/features/maps/client/model/assets';
import {
	type TDayMapEntity,
	getPrimaryProduct,
} from '@/features/maps/client/model/dayMapEntities';
import { DAY_MAP_LAYER_COLORS } from '@/features/maps/client/model/mapStyles';

import ProductSprite from './ProductSprite';

interface IProps {
	className?: string;
	entity: TDayMapEntity;
	/** @description Box edge in rem. */
	size: number;
}

const CHIP_ICONS = {
	fishing: faFish,
	teleport: faWandMagicSparkles,
	transition: faDoorOpen,
} as const;

/** @description Characters show their in-game sprite; other entities their product or map icon. */
export default memo<IProps>(function DayMapEntityIcon({
	className,
	entity,
	size,
}) {
	const style = { height: `${size}rem`, width: `${size}rem` };

	switch (entity.layer) {
		case 'collectable': {
			const product = getPrimaryProduct(entity);
			return (
				<span
					aria-hidden
					className={cn(
						'flex shrink-0 items-center justify-center',
						className
					)}
					style={style}
				>
					{product !== undefined && (
						<ProductSprite
							isDecorative
							product={product}
							size={size * 0.8}
						/>
					)}
				</span>
			);
		}
		case 'fishing':
		case 'teleport':
		case 'transition':
			return (
				<span
					aria-hidden
					className={cn(
						'flex shrink-0 items-center justify-center rounded-full bg-black/75 text-tiny shadow-sm',
						DAY_MAP_LAYER_COLORS[entity.layer].icon,
						className
					)}
					style={style}
				>
					<FontAwesomeIcon icon={CHIP_ICONS[entity.layer]} />
				</span>
			);
		default: {
			const { sprite } = entity.character;
			return (
				<span
					aria-hidden
					className={cn(
						'image-rendering-pixelated block shrink-0 bg-contain bg-bottom bg-no-repeat',
						className
					)}
					style={
						sprite === null
							? style
							: {
									...style,
									backgroundImage: `url('${getCharacterSpriteUrl(sprite.file)}')`,
								}
					}
				/>
			);
		}
	}
});
