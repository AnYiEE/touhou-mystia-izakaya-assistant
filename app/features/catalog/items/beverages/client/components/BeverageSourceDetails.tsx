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

import {
	formatCollectionPointYield,
	formatPrayerYield,
	formatSourceReference,
	getCollectionPointRefreshTimeHours,
} from '@/features/catalog/items/shared/sourceReferenceFormatting';

import { checkObjectOrStringEmpty } from '@/shared/utilities/collections/check';

interface IProps {
	from: IBeverage['from'];
	id: IBeverage['id'];
}

export default function BeverageSourceDetails({ from, id }: IProps) {
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
				const probability = `概率${isBuy ? '出售' : '掉落'}`;
				const way = isBuy
					? '购买'
					: isFishingAdvanced
						? '高级垂钓'
						: isPrayer
							? '祈愿'
							: isTask
								? '任务'
								: '采集';
				const label = `${probability}，使用摆件【超级钓鱼竿】`;
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
																	? `${item[1]}%${probability}`
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
															: `采集点出现时间：${collectableTimeRange[0]}-${collectableTimeRange[1]}点`;
													const refreshTime =
														isCollect
															? getCollectionPointRefreshTimeHours(
																	reference
																)
															: null;
													const refreshTimeContent =
														refreshTime === null
															? null
															: `采集点刷新周期：${refreshTime}小时`;
													const timingContent =
														collectableTimeRangeContent !==
															null &&
														refreshTimeContent !==
															null
															? `${collectableTimeRangeContent}，${refreshTimeContent}`
															: (collectableTimeRangeContent ??
																refreshTimeContent);
													const yieldContent =
														isCollect
															? formatCollectionPointYield(
																	reference as TCollectionPointReference,
																	2,
																	id
																)
															: isPrayer
																? formatPrayerYield(
																		reference as IPrayerReference,
																		2,
																		id
																	)
																: null;
													const itemContent =
														formatSourceReference(
															reference
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
														.join('；');
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
											: formatSourceReference(item)}
									</Ol.Li>
								))
							) : (
								<Ol.Li>初始拥有</Ol.Li>
							)}
						</Ol>
					</Fragment>
				);
			})}
		</ScrollShadow>
	);
}
