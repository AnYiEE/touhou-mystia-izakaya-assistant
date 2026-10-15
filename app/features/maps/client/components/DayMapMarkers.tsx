'use client';

import { type ReactNode, memo, useCallback } from 'react';

import {
	faClock,
	faDoorOpen,
	faFish,
	faShuffle,
	faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { AnimatePresence, motion } from 'framer-motion';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import type { IDayMapArt, TDayMapPoint } from '@/domain/data/maps/types';

import { mapsMessages } from '@/features/maps/client/messages';
import { getCharacterSpriteUrl } from '@/features/maps/client/model/assets';
import {
	DAY_MAP_LAYERS,
	type IDayMapCharacterEntity,
	type IDayMapCollectableEntity,
	type TDayMapEntity,
	type TDayMapLayer,
	checkTimeLimited,
	getPrimaryProduct,
	toContentPoint,
	toContentRect,
} from '@/features/maps/client/model/dayMapEntities';
import {
	DAY_MAP_LAYER_COLORS,
	MAP_GOLD_RING_CLASS_NAME,
	MAP_PILL_ACTIVE_CLASS_NAME,
	MAP_PILL_CLASS_NAME,
	MAP_PILL_HOVER_CLASS_NAME,
} from '@/features/maps/client/model/mapStyles';
import {
	MAP_FADE_ANIMATE,
	MAP_FADE_HIDDEN,
	getMapTransition,
} from '@/features/maps/client/model/motion';
import { useDayMapEntityName } from '@/features/maps/client/model/useDayMapEntityName';

import { useI18n } from '@/shared/i18n/useI18n';

import ProductSprite from './ProductSprite';

interface IProps {
	arrival: TDayMapPoint | null;
	art: IDayMapArt;
	entities: ReadonlyArray<TDayMapEntity>;
	hiddenLayers: ReadonlySet<TDayMapLayer>;
	onSelect: (id: string) => void;
	selectedId: string | null;
	zoom: number;
}

/** @description Screen pixels per world unit from which marker labels appear. */
const LABEL_VISIBLE_PX_PER_UNIT = 22;
/** @description Screen pixels per world unit from which trigger areas appear. */
const AREA_VISIBLE_PX_PER_UNIT = 10;
const CHARACTER_MIN_HEIGHT_PX = 30;
const CHARACTER_MAX_HEIGHT_PX = 84;

/** @description Labels sit inside their marker button, so they are part of its hit area. */
const LABEL_CLASS_NAME = cn(
	'absolute -translate-x-1/2 px-2 py-0.5 text-tiny font-medium leading-tight transition-colors duration-150 motion-reduce:transition-none',
	MAP_PILL_CLASS_NAME
);

interface IAnchorProps {
	children: ReactNodeWithoutBoolean;
	point: readonly [number, number];
	zIndex: number;
	zoom: number;
}

function Anchor({ children, point, zIndex, zoom }: IAnchorProps) {
	return (
		<div
			className="absolute h-0 w-0"
			style={{ left: point[0] * zoom, top: point[1] * zoom, zIndex }}
		>
			{children}
		</div>
	);
}

interface ICharacterMarkerProps {
	entity: IDayMapCharacterEntity;
	isLabelVisible: boolean;
	isSelected: boolean;
	name: string;
	onSelect: (id: string) => void;
	pxPerUnit: number;
	spotIndex: number;
}

const CharacterMarker = memo<ICharacterMarkerProps>(function CharacterMarker({
	entity,
	isLabelVisible,
	isSelected,
	name,
	onSelect,
	pxPerUnit,
	spotIndex,
}) {
	const { character, id, spots } = entity;
	const { kind, sprite } = character;
	const isRandomSpot = spots.length > 1;

	const handleClick = useCallback(() => {
		onSelect(id);
	}, [id, onSelect]);

	const height =
		sprite === null
			? CHARACTER_MIN_HEIGHT_PX
			: Math.min(
					CHARACTER_MAX_HEIGHT_PX,
					Math.max(
						CHARACTER_MIN_HEIGHT_PX,
						(sprite.height / sprite.pixelsPerUnit) * pxPerUnit
					)
				);
	const scale = sprite === null ? 1 : height / sprite.height;
	const [feetX, feetY] =
		sprite === null
			? [height / 2, height]
			: [sprite.pivot[0] * scale, sprite.pivot[1] * scale];

	return (
		<button
			aria-label={name}
			aria-pressed={isSelected}
			title={name}
			type="button"
			onClick={handleClick}
			className={cn('group absolute', CLASSNAME_FOCUS_VISIBLE_OUTLINE, {
				'opacity-80': isRandomSpot && !isSelected,
			})}
			style={
				sprite === null
					? { height, left: -feetX, top: -feetY, width: height }
					: {
							height: sprite.height * scale,
							left: -feetX,
							top: -feetY,
							width: sprite.width * scale,
						}
			}
		>
			<span
				aria-hidden
				className="absolute h-1.5 w-3/5 -translate-x-1/2 rounded-[50%] bg-black/35 blur-[1px]"
				style={{ left: feetX, top: feetY - 3 }}
			/>
			{sprite === null ? (
				<span className="block h-full w-full rounded-full bg-default-300" />
			) : (
				<span
					aria-hidden
					className={cn(
						'image-rendering-pixelated relative block h-full w-full bg-[length:100%_100%] bg-no-repeat transition-transform duration-150 group-hover:-translate-y-0.5 motion-reduce:transition-none',
						isSelected
							? '[filter:drop-shadow(0_0_1px_#fff)_drop-shadow(0_0_3px_#ffa800)]'
							: '[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.9))] group-hover:[filter:drop-shadow(0_0_1px_#fff)_drop-shadow(0_0_2px_#ffa800)]'
					)}
					style={{
						backgroundImage: `url('${getCharacterSpriteUrl(sprite.file)}')`,
					}}
				/>
			)}
			{(isLabelVisible || isSelected) && (
				<span
					aria-hidden
					className={cn(
						LABEL_CLASS_NAME,
						'inline-flex items-center gap-1',
						isSelected
							? MAP_PILL_ACTIVE_CLASS_NAME
							: MAP_PILL_HOVER_CLASS_NAME
					)}
					style={{ left: feetX, top: feetY + 4 }}
				>
					<span
						aria-hidden
						className={cn(
							'h-1.5 w-1.5 shrink-0 rounded-full',
							DAY_MAP_LAYER_COLORS[kind].dot
						)}
					/>
					{name}
					{isRandomSpot && (
						<span className="opacity-70">
							<FontAwesomeIcon icon={faShuffle} size="xs" />
							{spotIndex + 1}
						</span>
					)}
				</span>
			)}
		</button>
	);
});

interface ICollectableMarkerProps {
	entity: IDayMapCollectableEntity;
	isLabelVisible: boolean;
	isSelected: boolean;
	name: string;
	onSelect: (id: string) => void;
}

const CollectableMarker = memo<ICollectableMarkerProps>(
	function CollectableMarker({
		entity,
		isLabelVisible,
		isSelected,
		name,
		onSelect,
	}) {
		const {
			collectable: { isOffByDefault, showTime },
			id,
		} = entity;
		const primaryProduct = getPrimaryProduct(entity);
		const isTimeLimited = checkTimeLimited(showTime);

		const handleClick = useCallback(() => {
			onSelect(id);
		}, [id, onSelect]);

		return (
			<button
				aria-label={name}
				aria-pressed={isSelected}
				title={name}
				type="button"
				onClick={handleClick}
				className={cn(
					'group absolute -left-[0.9375rem] -top-[0.9375rem] h-[1.875rem] w-[1.875rem] rounded-full',
					CLASSNAME_FOCUS_VISIBLE_OUTLINE
				)}
			>
				<span
					className={cn(
						'flex h-full w-full items-center justify-center rounded-full border-2 bg-[radial-gradient(circle_at_50%_35%,#5b4630,#211810)] shadow-[0_2px_6px_rgba(0,0,0,0.5)] transition duration-150 group-hover:scale-110 group-hover:shadow-[0_0_0_3px_rgba(255,168,0,0.45)] motion-reduce:transition-none',
						isOffByDefault && 'border-dashed',
						isSelected
							? 'scale-110 border-[#ffa800] shadow-[0_0_0_3px_rgba(255,168,0,0.55)]'
							: MAP_GOLD_RING_CLASS_NAME
					)}
				>
					{primaryProduct === undefined ? (
						<span className="h-2 w-2 rounded-full bg-[#f3d28b]" />
					) : (
						<ProductSprite
							isDecorative
							product={primaryProduct}
							size={1.25}
							className={cn({ 'opacity-70': isOffByDefault })}
						/>
					)}
					{isTimeLimited && (
						<span
							aria-hidden
							className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#ffa800] text-[0.5rem] text-black shadow-sm ring-1 ring-black/40"
						>
							<FontAwesomeIcon icon={faClock} />
						</span>
					)}
				</span>
				{(isLabelVisible || isSelected) && (
					<span
						aria-hidden
						className={cn(
							LABEL_CLASS_NAME,
							'left-1/2 top-[calc(100%+0.25rem)]',
							isSelected
								? MAP_PILL_ACTIVE_CLASS_NAME
								: MAP_PILL_HOVER_CLASS_NAME
						)}
					>
						{name}
					</span>
				)}
			</button>
		);
	}
);

interface IChipMarkerProps {
	iconClassName: string;
	icon: typeof faDoorOpen;
	id: string;
	isLabelVisible: boolean;
	isSelected: boolean;
	name: string;
	onSelect: (id: string) => void;
}

const ChipMarker = memo<IChipMarkerProps>(function ChipMarker({
	icon,
	iconClassName,
	id,
	isLabelVisible,
	isSelected,
	name,
	onSelect,
}) {
	const handleClick = useCallback(() => {
		onSelect(id);
	}, [id, onSelect]);

	return (
		<button
			aria-label={name}
			aria-pressed={isSelected}
			title={name}
			type="button"
			onClick={handleClick}
			className={cn(
				'absolute left-0 top-0 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 text-tiny font-semibold transition duration-150 hover:scale-105 motion-reduce:transition-none',
				MAP_PILL_CLASS_NAME,
				CLASSNAME_FOCUS_VISIBLE_OUTLINE,
				isLabelVisible || isSelected
					? 'px-2.5 py-1'
					: 'h-7 w-7 justify-center',
				isSelected && MAP_PILL_ACTIVE_CLASS_NAME
			)}
		>
			<FontAwesomeIcon
				icon={icon}
				className={isSelected ? undefined : iconClassName}
			/>
			{(isLabelVisible || isSelected) && name}
		</button>
	);
});

export default memo<IProps>(function DayMapMarkers({
	arrival,
	art,
	entities,
	hiddenLayers,
	onSelect,
	selectedId,
	zoom,
}) {
	const { t } = useI18n(mapsMessages);
	const isReducedMotion = useReducedMotion();
	const getName = useDayMapEntityName();

	const transition = getMapTransition(isReducedMotion);
	const pxPerUnit = art.pixelsPerUnit * zoom;
	const isLabelVisible = pxPerUnit >= LABEL_VISIBLE_PX_PER_UNIT;
	const isAreaVisible = pxPerUnit >= AREA_VISIBLE_PX_PER_UNIT;

	// Grouped per layer so a layer fades in and out as a whole when toggled.
	const layerNodes = new Map<TDayMapLayer, ReactNode[]>();
	const pushNode = (layer: TDayMapLayer, node: ReactNode) => {
		const nodes = layerNodes.get(layer);
		if (nodes === undefined) {
			layerNodes.set(layer, [node]);
		} else {
			nodes.push(node);
		}
	};

	for (const entity of entities) {
		if (hiddenLayers.has(entity.layer)) {
			continue;
		}
		const isSelected = entity.id === selectedId;
		const name = getName(entity);

		switch (entity.layer) {
			case 'fishing': {
				const rect = toContentRect(art, entity.area);
				pushNode(
					entity.layer,
					<div
						key={`area:${entity.id}`}
						aria-hidden
						className={cn(
							'pointer-events-none absolute rounded-lg border-2 border-dashed bg-sky-400/15',
							isSelected
								? 'border-[#ffa800]'
								: 'border-sky-400/70'
						)}
						style={{
							height: rect.height * zoom,
							left: rect.left * zoom,
							top: rect.top * zoom,
							width: rect.width * zoom,
						}}
					/>
				);
				pushNode(
					entity.layer,
					<Anchor
						key={entity.id}
						point={toContentPoint(art, entity.position)}
						zIndex={isSelected ? 10_000 : 3000}
						zoom={zoom}
					>
						<ChipMarker
							icon={faFish}
							iconClassName={DAY_MAP_LAYER_COLORS.fishing.icon}
							id={entity.id}
							isLabelVisible={isLabelVisible}
							isSelected={isSelected}
							name={name}
							onSelect={onSelect}
						/>
					</Anchor>
				);
				break;
			}
			case 'teleport':
				pushNode(
					entity.layer,
					<Anchor
						key={entity.id}
						point={toContentPoint(art, entity.position)}
						zIndex={isSelected ? 10_000 : 8000}
						zoom={zoom}
					>
						<ChipMarker
							icon={faWandMagicSparkles}
							iconClassName={DAY_MAP_LAYER_COLORS.teleport.icon}
							id={entity.id}
							isLabelVisible={isLabelVisible}
							isSelected={isSelected}
							name={name}
							onSelect={onSelect}
						/>
					</Anchor>
				);
				break;
			case 'transition': {
				const { area } = entity.transition;
				if (area !== null && isAreaVisible) {
					const rect = toContentRect(art, area);
					pushNode(
						entity.layer,
						<div
							key={`area:${entity.id}`}
							aria-hidden
							className={cn(
								'pointer-events-none absolute rounded-md border-2 border-dashed bg-indigo-400/10',
								isSelected
									? 'border-[#ffa800]'
									: 'border-indigo-300/70'
							)}
							style={{
								height: rect.height * zoom,
								left: rect.left * zoom,
								top: rect.top * zoom,
								width: rect.width * zoom,
							}}
						/>
					);
				}
				pushNode(
					entity.layer,
					<Anchor
						key={entity.id}
						point={toContentPoint(art, entity.position)}
						zIndex={isSelected ? 10_000 : 9000}
						zoom={zoom}
					>
						<ChipMarker
							icon={faDoorOpen}
							iconClassName={DAY_MAP_LAYER_COLORS.transition.icon}
							id={entity.id}
							isLabelVisible
							isSelected={isSelected}
							name={t('maps.toTarget', { map: name })}
							onSelect={onSelect}
						/>
					</Anchor>
				);
				break;
			}
			case 'collectable': {
				const point = toContentPoint(art, entity.position);
				pushNode(
					entity.layer,
					<Anchor
						key={entity.id}
						point={point}
						zIndex={
							isSelected ? 10_000 : 4000 + Math.round(point[1])
						}
						zoom={zoom}
					>
						<CollectableMarker
							entity={entity}
							isLabelVisible={isLabelVisible}
							isSelected={isSelected}
							name={name}
							onSelect={onSelect}
						/>
					</Anchor>
				);
				break;
			}
			default:
				entity.spots.forEach((spot, spotIndex) => {
					const point = toContentPoint(art, spot);
					pushNode(
						entity.layer,
						<Anchor
							key={`${entity.id}:${spotIndex}`}
							point={point}
							zIndex={
								isSelected
									? 10_000
									: 1000 + Math.round(point[1])
							}
							zoom={zoom}
						>
							<CharacterMarker
								entity={entity}
								isLabelVisible={
									isLabelVisible &&
									entity.layer !== 'resident'
								}
								isSelected={isSelected}
								name={name}
								onSelect={onSelect}
								pxPerUnit={pxPerUnit}
								spotIndex={spotIndex}
							/>
						</Anchor>
					);
				});
		}
	}

	return (
		<div className="absolute left-0 top-0">
			<AnimatePresence initial={false}>
				{DAY_MAP_LAYERS.filter((layer) => layerNodes.has(layer)).map(
					(layer) => (
						// Unpositioned and fully opaque at rest, so markers of all
						// layers still share one stacking context for `zIndex`.
						<motion.div
							key={layer}
							animate={MAP_FADE_ANIMATE}
							exit={MAP_FADE_HIDDEN}
							initial={MAP_FADE_HIDDEN}
							transition={transition}
						>
							{layerNodes.get(layer)}
						</motion.div>
					)
				)}
			</AnimatePresence>
			{arrival !== null && (
				<Anchor
					point={toContentPoint(art, arrival)}
					zIndex={9500}
					zoom={zoom}
				>
					<span
						aria-hidden
						className="pointer-events-none absolute -left-5 -top-5 h-10 w-10 animate-ping rounded-full border-4 border-[#ffa800] motion-reduce:animate-none"
					/>
					<span
						className={cn(
							LABEL_CLASS_NAME,
							'pointer-events-none left-0 top-3',
							MAP_PILL_ACTIVE_CLASS_NAME
						)}
					>
						{t('maps.arrival')}
					</span>
				</Anchor>
			)}
		</div>
	);
});
