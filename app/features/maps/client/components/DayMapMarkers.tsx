'use client';

import { memo, useCallback } from 'react';

import {
	faClock,
	faDoorOpen,
	faFish,
	faShuffle,
	faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';

import type { IDayMapArt, TDayMapPoint } from '@/domain/data/maps/types';

import { mapsMessages } from '@/features/maps/client/messages';
import { getCharacterSpriteUrl } from '@/features/maps/client/model/assets';
import {
	type IDayMapCharacterEntity,
	type IDayMapCollectableEntity,
	type TDayMapEntity,
	type TDayMapLayer,
	toContentPoint,
	toContentRect,
} from '@/features/maps/client/model/dayMapEntities';
import {
	MAP_GOLD_RING_CLASS_NAME,
	MAP_PILL_ACTIVE_CLASS_NAME,
	MAP_PILL_CLASS_NAME,
} from '@/features/maps/client/model/mapStyles';
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

const LABEL_CLASS_NAME = cn(
	'pointer-events-none absolute left-0 px-2 py-0.5 text-tiny font-medium leading-tight',
	MAP_PILL_CLASS_NAME
);

const CHARACTER_DOT_CLASS_NAMES = {
	merchant: 'bg-success',
	resident: 'bg-default-400',
	specialGuest: 'bg-[#ffa800]',
} as const;

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

	return (
		<>
			<button
				aria-label={name}
				aria-pressed={isSelected}
				title={name}
				type="button"
				onClick={handleClick}
				className={cn(
					'group absolute transition-transform duration-150 hover:-translate-y-0.5 motion-reduce:transition-none',
					CLASSNAME_FOCUS_VISIBLE_OUTLINE,
					{ 'opacity-80': isRandomSpot && !isSelected }
				)}
				style={
					sprite === null
						? {
								height,
								left: -height / 2,
								top: -height,
								width: height,
							}
						: {
								height: sprite.height * scale,
								left: -sprite.pivot[0] * scale,
								top: -sprite.pivot[1] * scale,
								width: sprite.width * scale,
							}
				}
			>
				<span
					aria-hidden
					className="absolute left-1/2 h-1.5 w-3/5 -translate-x-1/2 rounded-[50%] bg-black/35 blur-[1px]"
					style={{
						top:
							sprite === null
								? height - 3
								: sprite.pivot[1] * scale - 3,
					}}
				/>
				{sprite === null ? (
					<span className="block h-full w-full rounded-full bg-default-300" />
				) : (
					<span
						aria-hidden
						className={cn(
							'image-rendering-pixelated relative block h-full w-full bg-[length:100%_100%] bg-no-repeat',
							isSelected
								? '[filter:drop-shadow(0_0_1px_#fff)_drop-shadow(0_0_3px_#ffa800)]'
								: '[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.9))] group-hover:[filter:drop-shadow(0_0_1px_#fff)_drop-shadow(0_0_2px_#ffa800)]'
						)}
						style={{
							backgroundImage: `url('${getCharacterSpriteUrl(sprite.file)}')`,
						}}
					/>
				)}
			</button>
			{(isLabelVisible || isSelected) && (
				<span
					className={cn(
						LABEL_CLASS_NAME,
						'top-1 inline-flex -translate-x-1/2 items-center gap-1',
						{ [MAP_PILL_ACTIVE_CLASS_NAME]: isSelected }
					)}
				>
					<span
						aria-hidden
						className={cn(
							'h-1.5 w-1.5 shrink-0 rounded-full',
							CHARACTER_DOT_CLASS_NAMES[kind]
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
		</>
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
			products,
		} = entity;
		const primaryProduct =
			products.find(({ kind }) => kind === 'primary') ?? products[0];
		const isTimeLimited = showTime[0] !== 10 || showTime[1] !== 18;

		const handleClick = useCallback(() => {
			onSelect(id);
		}, [id, onSelect]);

		return (
			<>
				<button
					aria-label={name}
					aria-pressed={isSelected}
					title={name}
					type="button"
					onClick={handleClick}
					className={cn(
						'absolute -left-[0.9375rem] -top-[0.9375rem] flex h-[1.875rem] w-[1.875rem] items-center justify-center rounded-full border-2 bg-[radial-gradient(circle_at_50%_35%,#5b4630,#211810)] shadow-[0_2px_6px_rgba(0,0,0,0.5)] transition duration-150 hover:scale-110 hover:shadow-[0_0_0_3px_rgba(255,168,0,0.45)] motion-reduce:transition-none',
						CLASSNAME_FOCUS_VISIBLE_OUTLINE,
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
				</button>
				{(isLabelVisible || isSelected) && (
					<span
						className={cn(
							LABEL_CLASS_NAME,
							'top-5 -translate-x-1/2',
							{ [MAP_PILL_ACTIVE_CLASS_NAME]: isSelected }
						)}
					>
						{name}
					</span>
				)}
			</>
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
	const getName = useDayMapEntityName();

	const pxPerUnit = art.pixelsPerUnit * zoom;
	const isLabelVisible = pxPerUnit >= LABEL_VISIBLE_PX_PER_UNIT;
	const isAreaVisible = pxPerUnit >= AREA_VISIBLE_PX_PER_UNIT;

	const areas = [];
	const markers = [];

	for (const entity of entities) {
		if (hiddenLayers.has(entity.layer)) {
			continue;
		}
		const isSelected = entity.id === selectedId;
		const name = getName(entity);

		switch (entity.layer) {
			case 'fishing': {
				const rect = toContentRect(art, entity.area);
				areas.push(
					<div
						key={entity.id}
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
				markers.push(
					<Anchor
						key={entity.id}
						point={toContentPoint(art, entity.position)}
						zIndex={isSelected ? 10_000 : 3000}
						zoom={zoom}
					>
						<ChipMarker
							icon={faFish}
							iconClassName="text-sky-300"
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
				markers.push(
					<Anchor
						key={entity.id}
						point={toContentPoint(art, entity.position)}
						zIndex={isSelected ? 10_000 : 8000}
						zoom={zoom}
					>
						<ChipMarker
							icon={faWandMagicSparkles}
							iconClassName="text-fuchsia-300"
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
					areas.push(
						<div
							key={entity.id}
							aria-hidden
							className={cn(
								'pointer-events-none absolute rounded-md border-2 border-dashed bg-[#f3d28b]/10',
								isSelected
									? 'border-[#ffa800]'
									: 'border-[#f3d28b]/70'
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
				markers.push(
					<Anchor
						key={entity.id}
						point={toContentPoint(art, entity.position)}
						zIndex={isSelected ? 10_000 : 9000}
						zoom={zoom}
					>
						<ChipMarker
							icon={faDoorOpen}
							iconClassName="text-[#f3d28b]"
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
				markers.push(
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
					markers.push(
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
			{areas}
			{markers}
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
							'top-3 -translate-x-1/2',
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
