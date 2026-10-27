'use client';

import { memo } from 'react';
import {
	faDisplay,
	faDoorOpen,
	faFish,
	faLightbulb,
	faMagnifyingGlass,
	faToriiGate,
	faWandMagicSparkles,
	faWineBottle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';

import { useMapAsset } from '@/features/maps/client/assets/MapAssetContext';
import { getCharacterSpriteUrl } from '@/features/maps/client/model/assets';
import {
	type TDayMapEntity,
	getPrimaryProduct,
} from '@/features/maps/client/model/dayMapEntities';
import { getDayMapInteractionIcon } from '@/features/maps/client/model/dayMapInteractionIcons';
import { DAY_MAP_LAYER_COLORS } from '@/features/maps/client/model/mapStyles';

import ProductSprite from './ProductSprite';

interface IProps {
	className?: string;
	entity: TDayMapEntity;
	/** @description Box edge in rem. */
	size: number;
}

const CHIP_ICONS = {
	facility: faDisplay,
	fishing: faFish,
	prayer: faToriiGate,
	teleport: faWandMagicSparkles,
	transition: faDoorOpen,
} as const;

function getTaskIcon(key: string) {
	if (key.startsWith('Bottle_')) {
		return faWineBottle;
	}
	if (key.startsWith('Lantern_')) {
		return faLightbulb;
	}
	return faMagnifyingGlass;
}

/** @description Characters show their in-game sprite; other entities their product or map icon. */
export default memo<IProps>(function DayMapEntityIcon({
	className,
	entity,
	size,
}) {
	const style = { height: `${size}rem`, width: `${size}rem` };
	const characterSpriteUrl =
		'character' in entity && entity.character.sprite !== null
			? getCharacterSpriteUrl(entity.character.sprite)
			: null;
	const characterAsset = useMapAsset(characterSpriteUrl);

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
		case 'facility':
		case 'fishing':
		case 'prayer':
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
		case 'interaction':
		case 'task': {
			const icon =
				entity.layer === 'interaction'
					? getDayMapInteractionIcon(entity.interaction.kind)
					: getTaskIcon(entity.task.key);
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
					<FontAwesomeIcon icon={icon} />
				</span>
			);
		}
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
									backgroundImage:
										characterAsset.objectUrl === null
											? undefined
											: `url('${characterAsset.objectUrl}')`,
								}
					}
				/>
			);
		}
	}
});
