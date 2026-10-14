'use client';

import { memo, useCallback, useMemo } from 'react';

import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';

import type { IWorldMapSpot, TDayMapLabel } from '@/domain/data/maps/types';
import { WORLD_MAP_FACTS } from '@/domain/data/maps/worldMapFacts';
import { getPlaceLabel } from '@/domain/places/localizedLabels';

import { mapsMessages } from '@/features/maps/client/messages';
import { getWorldMapImageUrl } from '@/features/maps/client/model/assets';
import { checkDayMapLabel } from '@/features/maps/client/model/dayMapLabels';
import {
	MAP_PILL_ACTIVE_CLASS_NAME,
	MAP_PILL_CLASS_NAME,
} from '@/features/maps/client/model/mapStyles';

import { useI18n } from '@/shared/i18n/useI18n';

import type { IMapView } from './MapViewport';

interface IProps {
	currentMap: TDayMapLabel | null;
	onEnter: (map: TDayMapLabel) => void;
	view: IMapView;
}

interface ILabelOffset {
	left: number;
	top: number;
}

interface ILabelPlacement extends ILabelOffset {
	/** @description No free position was found; the label only shows on hover or focus. */
	isCollapsed: boolean;
}

interface IRect {
	bottom: number;
	left: number;
	right: number;
	top: number;
}

const CONNECTED_PLACES: ReadonlySet<string> = new Set(
	WORLD_MAP_FACTS.connections.flat()
);

const DOT_RADIUS_PX = 8;
const LABEL_HEIGHT_PX = 24;
const LABEL_GAP_PX = 4;
const LABEL_ICON_WIDTH_PX = 16;
const DEFAULT_LABEL_PLACEMENT: ILabelPlacement = {
	isCollapsed: false,
	left: 0,
	top: DOT_RADIUS_PX + LABEL_GAP_PX,
};

function estimateLabelWidth(text: string, hasIcon: boolean) {
	let width = 18;
	for (const character of text) {
		// CJK glyphs take a full em at text-small (14px); Latin letters about half.
		width += (character.codePointAt(0) ?? 0) <= 0xff ? 7.5 : 14;
	}
	return width + (hasIcon ? LABEL_ICON_WIDTH_PX : 0);
}

function checkOverlap(left: IRect, right: IRect) {
	return (
		left.left < right.right &&
		right.left < left.right &&
		left.top < right.bottom &&
		right.top < left.bottom
	);
}

/** @description Greedy label placement: below, above, right, then left of each dot. */
function placeLabels(
	spots: ReadonlyArray<{
		hasIcon: boolean;
		name: string;
		x: number;
		y: number;
	}>
) {
	const occupied: IRect[] = spots.map(({ x, y }) => ({
		bottom: y + DOT_RADIUS_PX,
		left: x - DOT_RADIUS_PX,
		right: x + DOT_RADIUS_PX,
		top: y - DOT_RADIUS_PX,
	}));

	return spots.map(({ hasIcon, name, x, y }): ILabelPlacement => {
		const width = estimateLabelWidth(name, hasIcon);
		const candidates: ILabelOffset[] = [
			{ left: -width / 2, top: DOT_RADIUS_PX + LABEL_GAP_PX },
			{
				left: -width / 2,
				top: -DOT_RADIUS_PX - LABEL_GAP_PX - LABEL_HEIGHT_PX,
			},
			{ left: DOT_RADIUS_PX + LABEL_GAP_PX, top: -LABEL_HEIGHT_PX / 2 },
			{
				left: -DOT_RADIUS_PX - LABEL_GAP_PX - width,
				top: -LABEL_HEIGHT_PX / 2,
			},
		];
		const toRect = ({ left, top }: ILabelOffset): IRect => ({
			bottom: y + top + LABEL_HEIGHT_PX,
			left: x + left,
			right: x + left + width,
			top: y + top,
		});
		const chosen = candidates.find((candidate) => {
			const rect = toRect(candidate);
			return !occupied.some((item) => checkOverlap(item, rect));
		});
		if (chosen === undefined) {
			return {
				...(candidates[0] ?? DEFAULT_LABEL_PLACEMENT),
				isCollapsed: true,
			};
		}
		occupied.push(toRect(chosen));
		return { ...chosen, isCollapsed: false };
	});
}

interface ISpotProps {
	isCurrent: boolean;
	labelPlacement: ILabelPlacement;
	onEnter: (map: TDayMapLabel) => void;
	spot: IWorldMapSpot;
	zoom: number;
}

const WorldMapSpot = memo<ISpotProps>(function WorldMapSpot({
	isCurrent,
	labelPlacement,
	onEnter,
	spot,
	zoom,
}) {
	const { t } = useI18n(mapsMessages);

	const {
		place,
		position: [x, y],
	} = spot;
	const map = checkDayMapLabel(place) ? place : null;
	const name = getPlaceLabel(place);
	const isTeleportOnly = !CONNECTED_PLACES.has(place);

	const handleClick = useCallback(() => {
		if (map !== null) {
			onEnter(map);
		}
	}, [map, onEnter]);

	return (
		<div
			className="absolute h-0 w-0"
			style={{ left: x * zoom, top: y * zoom }}
		>
			<button
				aria-disabled={map === null}
				aria-label={
					map === null
						? `${name}（${t('maps.detail.noMap')}）`
						: t('maps.world.enter', { map: name })
				}
				title={
					isTeleportOnly ? t('maps.world.teleportOnly') : undefined
				}
				type="button"
				onClick={handleClick}
				className={cn(
					'group absolute -left-2 -top-2 h-4 w-4 rounded-full',
					CLASSNAME_FOCUS_VISIBLE_OUTLINE,
					map === null ? 'cursor-default' : 'cursor-pointer'
				)}
			>
				<span
					aria-hidden
					className={cn(
						'block h-4 w-4 rounded-full border-2 border-white bg-[#ffa800] shadow-[0_0_0_3px_rgba(0,0,0,0.35)] transition-transform duration-150 group-hover:scale-125 group-focus-visible:scale-125 motion-reduce:transition-none',
						{ 'scale-125 ring-4 ring-[#ffa800]/60': isCurrent }
					)}
				/>
				<span
					className={cn(
						'absolute flex h-6 items-center gap-1 px-2 text-small font-semibold transition-colors duration-150 motion-reduce:transition-none',
						MAP_PILL_CLASS_NAME,
						'group-hover:bg-[#ffa800] group-hover:text-black group-focus-visible:bg-[#ffa800] group-focus-visible:text-black',
						isCurrent && MAP_PILL_ACTIVE_CLASS_NAME,
						labelPlacement.isCollapsed &&
							!isCurrent &&
							'z-10 hidden group-hover:flex group-focus-visible:flex'
					)}
					style={{
						left: labelPlacement.left + DOT_RADIUS_PX,
						top: labelPlacement.top + DOT_RADIUS_PX,
					}}
				>
					{isTeleportOnly && (
						<FontAwesomeIcon icon={faWandMagicSparkles} size="xs" />
					)}
					{name}
				</span>
			</button>
		</div>
	);
});

export default memo<IProps>(function WorldMapLayer({
	currentMap,
	onEnter,
	view,
}) {
	const { x: offsetX, y: offsetY, zoom } = view;

	const labelPlacements = useMemo(
		() =>
			placeLabels(
				WORLD_MAP_FACTS.spots.map(({ place, position: [x, y] }) => ({
					hasIcon: !CONNECTED_PLACES.has(place),
					name: getPlaceLabel(place),
					x: x * zoom,
					y: y * zoom,
				}))
			),
		[zoom]
	);

	return (
		<div
			className="absolute left-0 top-0"
			style={{ transform: `translate3d(${offsetX}px, ${offsetY}px, 0)` }}
		>
			<span
				aria-hidden
				className="pointer-events-none absolute left-0 top-0 bg-[length:100%_100%] bg-no-repeat"
				style={{
					backgroundImage: `url('${getWorldMapImageUrl(WORLD_MAP_FACTS.image)}')`,
					height: WORLD_MAP_FACTS.height * zoom,
					width: WORLD_MAP_FACTS.width * zoom,
				}}
			/>
			{WORLD_MAP_FACTS.spots.map((spot, index) => (
				<WorldMapSpot
					key={spot.place}
					isCurrent={spot.place === currentMap}
					labelPlacement={
						labelPlacements[index] ?? DEFAULT_LABEL_PLACEMENT
					}
					onEnter={onEnter}
					spot={spot}
					zoom={zoom}
				/>
			))}
		</div>
	);
});
