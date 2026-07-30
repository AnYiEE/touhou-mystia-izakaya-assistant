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
import { COLLECTION_LOCATION_REFRESH_TIME_MAP } from '@/domain/data/places/collectionFacts';
import type { TCollectionLocation } from '@/domain/data/places/types';

import { checkObjectOrStringEmpty } from '@/shared/utilities/collections/check';

interface IProps {
	from: IIngredient['from'];
}

export default function IngredientSourceDetails({ from }: IProps) {
	if (checkObjectOrStringEmpty(from)) {
		return null;
	}

	return (
		<ScrollShadow size={16} className="max-h-dvh-safe-half">
			{Object.entries(from).map((fromObject, fromIndex) => {
				type TFrom = Exclude<IIngredient['from'], string>;
				const [method, target] = fromObject as [
					keyof TFrom,
					ExtractCollectionValue<TFrom>,
				];
				const isBuy = method === 'buy';
				const isCollect = method === 'collect';
				const isFishing = method === 'fishing';
				const isFishingAdvanced = method === 'fishingAdvanced';
				const isTask = method === 'task';
				const probability = `概率${isBuy ? '出售' : '掉落'}`;
				const way = isBuy
					? '购买'
					: isFishing
						? '钓鱼'
						: isFishingAdvanced
							? '高级钓鱼'
							: isTask
								? '任务'
								: '采集';
				const label = `${probability}，使用摆件【${isFishing ? '普通的' : '超级'}钓鱼竿】`;
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
									{isCollect || Array.isArray(item)
										? (() => {
												const isArray =
													Array.isArray(item);
												const itemProbability = isArray
													? typeof item[1] ===
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
													null ? null : (
														<>
															{itemProbability ===
															null
																? ''
																: '；'}
															采集点出现时间：
															{
																collectableTimeRange[0]
															}
															<span className="mx-0.5">
																-
															</span>
															{
																collectableTimeRange[1]
															}
															点
														</>
													);
												const refreshTime = isCollect
													? COLLECTION_LOCATION_REFRESH_TIME_MAP[
															(isArray
																? item[0]
																: item) as TCollectionLocation
														]
													: null;
												const refreshTimeContent =
													refreshTime ===
													null ? null : (
														<>
															{collectableTimeRange ===
															null
																? itemProbability ===
																	null
																	? ''
																	: '；'
																: '，'}
															采集点刷新周期：
															{refreshTime}
															小时
														</>
													);
												const itemContent = isArray
													? item[0]
													: item;
												const tooltipContent =
													itemProbability !== null ||
													collectableTimeRangeContent !==
														null ||
													refreshTimeContent !==
														null ? (
														<p>
															{itemProbability}
															{
																collectableTimeRangeContent
															}
															{refreshTimeContent}
														</p>
													) : null;
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
										: item}
								</Ol.Li>
							))}
						</Ol>
					</Fragment>
				);
			})}
		</ScrollShadow>
	);
}
