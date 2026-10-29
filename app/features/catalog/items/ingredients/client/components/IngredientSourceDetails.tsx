import { cn } from '@heroui/theme';
import { Fragment } from 'react';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import Ol from '@/design/ui/components/ol';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import ScrollShadow from '@/design/ui/components/scrollShadow';
import Tooltip from '@/design/ui/components/tooltip';

import type { IIngredient } from '@/domain/data/ingredients/schema';
import type {
	IPrayerReference,
	ITaskReference,
	TCollectionPointReference,
	TMapLabel,
	TMerchantReference,
} from '@/domain/data/places/types';
import { getSourceEntries } from '@/domain/data/shared/sourceEntries';
import { getCollaborationLabel } from '@/domain/labels/localizedCollaborationLabels';

import { renderSourceReference } from '@/features/catalog/items/shared/client/renderSourceReference';
import { catalogItemsMessages } from '@/features/catalog/items/shared/messages';
import {
	type TSourceReference,
	formatCollectionPointYield,
	formatPrayerYield,
	formatSourceReference,
	getCollectionPointRefreshTimeHours,
} from '@/features/catalog/items/shared/sourceReferenceFormatting';
import {
	CollaborationMapLink,
	CollectionPointMapLink,
	FishingMapLink,
	MerchantMapLink,
	TaskMapLinks,
} from '@/features/maps/client/components/MapLinks';

import { useI18n } from '@/shared/i18n/useI18n';
import { checkObjectOrStringEmpty } from '@/shared/utilities/collections/check';

interface IProps {
	from: IIngredient['from'];
	id: IIngredient['id'];
}

export default function IngredientSourceDetails({ from, id }: IProps) {
	const { locale, t } = useI18n(catalogItemsMessages);

	if (checkObjectOrStringEmpty(from)) {
		return null;
	}

	return (
		<ScrollShadow size={16} className="max-h-dvh-safe-half">
			{getSourceEntries<IIngredient['from']>(from).map(
				(source, fromIndex) => {
					type TFrom = Exclude<IIngredient['from'], string>;
					const [method, target] = Object.entries(source)[0] as [
						keyof TFrom,
						ExtractCollectionValue<TFrom>,
					];
					if (method === 'collaboration') {
						const sources = target as NonNullable<
							TFrom['collaboration']
						>;
						return (
							<Fragment key={fromIndex}>
								<p
									className={cn('font-semibold', {
										'mt-1': fromIndex !== 0,
									})}
								>
									{t(
										'items.source.way.collaborationTerminal'
									)}
								</p>
								<Ol className="ml-3">
									{sources.map(
										(
											{ collaborationLabel },
											labelIndex
										) => (
											<Ol.Li key={labelIndex}>
												{getCollaborationLabel(
													collaborationLabel
												)}
												<CollaborationMapLink
													itemId={id}
												/>
											</Ol.Li>
										)
									)}
								</Ol>
							</Fragment>
						);
					}
					const isBuy = method === 'buy';
					const isCollect = method === 'collect';
					const isFishing = method === 'fishing';
					const isFishingAdvanced = method === 'fishingAdvanced';
					const isPrayer = method === 'prayer';
					const isTask = method === 'task';
					const probability = t(
						isBuy
							? 'items.source.probabilitySell'
							: 'items.source.probabilityDrop'
					);
					const way = isBuy
						? t('items.source.way.buy')
						: isFishing
							? t('items.source.way.fishing')
							: isFishingAdvanced
								? t('items.source.way.fishingAdvanced')
								: isPrayer
									? t('items.source.way.prayer')
									: isTask
										? t('items.source.way.task')
										: t('items.source.way.collect');
					const label = t('items.source.fishingRodTooltip', {
						probability,
						rod: t(
							isFishing
								? 'items.source.fishingRod.normal'
								: 'items.source.fishingRod.super'
						),
					});
					return (
						<Fragment key={fromIndex}>
							<p
								className={cn('font-semibold', {
									'mt-1': fromIndex !== 0,
								})}
							>
								{isFishing || isFishingAdvanced ? (
									<Popover showArrow offset={3} size="sm">
										<Tooltip
											showArrow
											content={label}
											offset={1}
											size="sm"
										>
											<span className="inline-flex cursor-pointer">
												<PopoverTrigger>
													<span
														tabIndex={0}
														className={cn(
															'underline-dotted-offset2',
															CLASSNAME_FOCUS_VISIBLE_OUTLINE
														)}
													>
														{way}
													</span>
												</PopoverTrigger>
											</span>
										</Tooltip>
										<PopoverContent>{label}</PopoverContent>
									</Popover>
								) : (
									way
								)}
							</p>
							<Ol className="ml-3">
								{target?.map((item, targetIndex) => (
									<Ol.Li key={targetIndex}>
										{isCollect ||
										isPrayer ||
										Array.isArray(item)
											? (() => {
													const isArray =
														Array.isArray(item);
													const reference = (
														isArray ? item[0] : item
													) as TSourceReference;
													const itemProbability =
														isArray
															? isCollect
																? null
																: typeof item[1] ===
																	  'number'
																	? t(
																			'items.source.itemProbability',
																			{
																				label: probability,
																				probability:
																					item[1],
																			}
																		)
																	: item[1]
																		? probability
																		: null
															: null;
													const collectableTimeRange =
														isCollect &&
														isArray &&
														item.length === 4
															? ([
																	item[2],
																	item[3],
																] as [
																	number,
																	number,
																])
															: null;
													const collectableTimeRangeContent =
														collectableTimeRange ===
														null
															? null
															: t(
																	'items.source.spotTime',
																	{
																		end: collectableTimeRange[1],
																		start: collectableTimeRange[0],
																	}
																);
													const refreshTime =
														isCollect
															? getCollectionPointRefreshTimeHours(
																	reference
																)
															: null;
													const refreshTimeContent =
														refreshTime === null
															? null
															: t(
																	'items.source.spotRefresh',
																	{
																		hours: refreshTime,
																	}
																);
													const timingContent =
														collectableTimeRangeContent !==
															null &&
														refreshTimeContent !==
															null
															? `${collectableTimeRangeContent}${t('items.source.timingSeparator')}${refreshTimeContent}`
															: (collectableTimeRangeContent ??
																refreshTimeContent);
													const yieldContent =
														isCollect
															? formatCollectionPointYield(
																	reference as TCollectionPointReference,
																	1,
																	id,
																	locale
																)
															: isPrayer
																? formatPrayerYield(
																		reference as IPrayerReference,
																		1,
																		id,
																		locale
																	)
																: null;
													const itemContent =
														formatSourceReference(
															reference,
															locale
														);
													const tooltipText = [
														itemProbability,
														timingContent,
														yieldContent,
													]
														.filter(
															(
																content
															): content is string =>
																content !== null
														)
														.join(
															t(
																'items.source.tooltipSeparator'
															)
														);
													const tooltipContent =
														tooltipText ===
														'' ? null : (
															<p>{tooltipText}</p>
														);
													return tooltipContent ===
														null ? (
														itemContent
													) : (
														<Popover
															offset={2}
															size="sm"
														>
															<Tooltip
																content={
																	tooltipContent
																}
																closeDelay={0}
																offset={0}
																size="sm"
															>
																<span className="underline-dotted-offset2 cursor-pointer">
																	<PopoverTrigger>
																		<span
																			tabIndex={
																				0
																			}
																			className={
																				CLASSNAME_FOCUS_VISIBLE_OUTLINE
																			}
																		>
																			{
																				itemContent
																			}
																		</span>
																	</PopoverTrigger>
																</span>
															</Tooltip>
															<PopoverContent>
																{tooltipContent}
															</PopoverContent>
														</Popover>
													);
												})()
											: renderSourceReference(
													item as TSourceReference,
													locale
												)}
										{isCollect && (
											<CollectionPointMapLink
												itemId={id}
												reference={
													(Array.isArray(item)
														? item[0]
														: item) as TCollectionPointReference
												}
											/>
										)}
										{isTask && (
											<TaskMapLinks
												itemId={id}
												task={
													(Array.isArray(item)
														? (item[0] as unknown as ITaskReference)
														: (item as unknown as ITaskReference)
													).task
												}
											/>
										)}
										{isBuy && (
											<MerchantMapLink
												itemId={id}
												reference={
													(Array.isArray(item)
														? item[0]
														: item) as TMerchantReference
												}
											/>
										)}
										{(isFishing || isFishingAdvanced) && (
											<FishingMapLink
												itemId={id}
												map={item as TMapLabel}
											/>
										)}
									</Ol.Li>
								))}
							</Ol>
						</Fragment>
					);
				}
			)}
		</ScrollShadow>
	);
}
