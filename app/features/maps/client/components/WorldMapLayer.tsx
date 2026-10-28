'use client';

import {
	faRotate,
	faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { memo, useCallback, useMemo } from 'react';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';

import type { IWorldMapSpot, TDayMapLabel } from '@/domain/data/maps/types';
import { WORLD_MAP_FACTS } from '@/domain/data/maps/worldMapFacts';
import { getPlaceLabel } from '@/domain/places/localizedLabels';

import { useCatalogLocalizationRevision } from '@/features/catalog/shared/client/localization/catalogLocalizationRevision';
import { useMapAsset } from '@/features/maps/client/assets/MapAssetContext';
import { mapsMessages } from '@/features/maps/client/messages';
import { getWorldMapImageUrl } from '@/features/maps/client/model/assets';
import { checkDayMapLabel } from '@/features/maps/client/model/dayMapLabels';
import { MAP_PILL_CLASS_NAME } from '@/features/maps/client/model/mapStyles';

import { useI18n } from '@/shared/i18n/useI18n';

import { useMapAccess } from './MapAccessContext';
import { type IMapView } from './MapViewport';

interface IProps {
	isMapVisible: (map: TDayMapLabel) => boolean;
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
	spots: ReadonlyArray<{ width: number; x: number; y: number }>
) {
	const occupied: IRect[] = spots.map(({ x, y }) => ({
		bottom: y + DOT_RADIUS_PX,
		left: x - DOT_RADIUS_PX,
		right: x + DOT_RADIUS_PX,
		top: y - DOT_RADIUS_PX,
	}));

	return spots.map(({ width, x, y }): ILabelPlacement => {
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
	labelPlacement: ILabelPlacement;
	onEnter: (map: TDayMapLabel) => void;
	spot: IWorldMapSpot;
	zoom: number;
}

const WorldMapSpot = memo<ISpotProps>(function WorldMapSpot({
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
						'block h-4 w-4 rounded-full border-2 border-white bg-[#ffa800] shadow-[0_0_0_3px_rgba(0,0,0,0.35)] transition-transform duration-150 group-hover:scale-125 group-focus-visible:scale-125 motion-reduce:transition-none'
					)}
				/>
				<span
					className={cn(
						'absolute flex h-6 items-center gap-1 px-2 text-small font-semibold',
						MAP_PILL_CLASS_NAME,
						'group-hover:bg-[#ffa800] group-hover:text-black group-focus-visible:bg-[#ffa800] group-focus-visible:text-black',
						labelPlacement.isCollapsed &&
							'invisible z-10 group-hover:visible group-focus-visible:visible'
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
	isMapVisible,
	onEnter,
	view,
}) {
	const { t } = useI18n(mapsMessages);
	const { policy } = useMapAccess();
	const { x: offsetX, y: offsetY, zoom } = view;
	const localizationRevision = useCatalogLocalizationRevision();
	const {
		objectUrl: worldMapObjectUrl,
		retry: retryWorldMapAsset,
		status: worldMapStatus,
	} = useMapAsset(getWorldMapImageUrl(policy.mode === 'preview'), {
		priority: 'critical',
	});

	const handleRetry = useCallback(() => {
		retryWorldMapAsset();
	}, [retryWorldMapAsset]);

	const spots = useMemo(
		() =>
			WORLD_MAP_FACTS.spots.filter(
				({ place }) => !checkDayMapLabel(place) || isMapVisible(place)
			),
		[isMapVisible]
	);
	const labels = useMemo(() => {
		void localizationRevision;
		return spots.map(({ place, position: [x, y] }) => ({
			width: estimateLabelWidth(
				getPlaceLabel(place),
				!CONNECTED_PLACES.has(place)
			),
			x,
			y,
		}));
	}, [localizationRevision, spots]);
	const labelPlacements = useMemo(
		() =>
			placeLabels(
				labels.map(({ width, x, y }) => ({
					width,
					x: x * zoom,
					y: y * zoom,
				}))
			),
		[labels, zoom]
	);

	return (
		<div
			className="absolute left-0 top-0"
			style={{ transform: `translate3d(${offsetX}px, ${offsetY}px, 0)` }}
		>
			{worldMapObjectUrl !== null && (
				// eslint-disable-next-line @next/next/no-img-element -- Object URLs cannot be represented by next/image.
				<img
					aria-hidden
					alt=""
					draggable={false}
					src={worldMapObjectUrl}
					className="image-rendering-pixelated pointer-events-none absolute left-0 top-0 max-w-none object-fill"
					style={{
						height: WORLD_MAP_FACTS.height * zoom,
						width: WORLD_MAP_FACTS.width * zoom,
					}}
				/>
			)}
			{worldMapStatus === 'error' && (
				<button
					aria-label={t('maps.asset.retry')}
					title={t('maps.asset.error')}
					type="button"
					onClick={handleRetry}
					className={cn(
						'absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/75 text-white shadow-md',
						CLASSNAME_FOCUS_VISIBLE_OUTLINE
					)}
				>
					<FontAwesomeIcon icon={faRotate} />
				</button>
			)}
			{spots.map((spot, index) => (
				<WorldMapSpot
					key={spot.place}
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
