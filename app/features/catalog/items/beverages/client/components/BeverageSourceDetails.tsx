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

import type { IBeverage } from '@/domain/data/beverages/schema';
import type {
	IPrayerReference,
	TCollectionPointReference,
} from '@/domain/data/places/types';

import { renderSourceReference } from '@/features/catalog/items/shared/client/renderSourceReference';
import { catalogItemsMessages } from '@/features/catalog/items/shared/messages';
import {
	formatCollectionPointYield,
	formatPrayerYield,
	formatSourceReference,
	getCollectionPointRefreshTimeHours,
} from '@/features/catalog/items/shared/sourceReferenceFormatting';

import { useI18n } from '@/shared/i18n/useI18n';
import { checkObjectOrStringEmpty } from '@/shared/utilities/collections/check';

interface IProps {
	from: IBeverage['from'];
	id: IBeverage['id'];
}

export default function BeverageSourceDetails({ from, id }: IProps) {
	const { locale, t } = useI18n(catalogItemsMessages);

	if (checkObjectOrStringEmpty(from)) {
		return null;
	}

	return (
		<ScrollShadow size={16} className="max-h-dvh-safe-half">
			{Object.entries(from).map((fromObject, fromIndex) => {
				type TFrom = Exclude<IBeverage['from'], string>;
				const [method, target] = fromObject as [
					keyof TFrom,
					ExtractCollectionValue<TFrom>,
				];
				const isBuy = method === 'buy';
				const isCollect = method === 'collect';
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
					: isFishingAdvanced
						? t('items.source.way.fishingAdvanced')
						: isPrayer
							? t('items.source.way.prayer')
							: isTask
								? t('items.source.way.task')
								: t('items.source.way.collect');
				const label = t('items.source.fishingRodTooltip', {
					probability,
					rod: t('items.source.fishingRod.super'),
				});
				return (
					<Fragment key={fromIndex}>
						<p
							className={cn('font-semibold', {
								'mt-1': fromIndex !== 0,
							})}
						>
							{isFishingAdvanced ? (
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
							{Array.isArray(target) ? (
								target.map((item, targetIndex) => (
									<Ol.Li key={targetIndex}>
										{isCollect ||
										isPrayer ||
										Array.isArray(item)
											? (() => {
													const isArray =
														Array.isArray(item);
													const reference = isArray
														? item[0]
														: item;
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
																	2,
																	id,
																	locale
																)
															: isPrayer
																? formatPrayerYield(
																		reference as IPrayerReference,
																		2,
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
													item,
													locale
												)}
									</Ol.Li>
								))
							) : (
								<Ol.Li>{t('items.source.initialOwned')}</Ol.Li>
							)}
						</Ol>
					</Fragment>
				);
			})}
		</ScrollShadow>
	);
}
