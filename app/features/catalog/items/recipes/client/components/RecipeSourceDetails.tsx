import { cn } from '@heroui/theme';
import { isNil, isObject } from 'lodash';
import { Fragment } from 'react';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import Tooltip from '@/design/ui/components/tooltip';

import { type Recipe } from '@/domain/catalog/food/Recipe';
import type { IRecipe } from '@/domain/data/recipes/schema';

import Price from '@/features/catalog/shared/client/components/Price';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import type { TItemData } from '@/features/catalog/shared/contracts';
import {
	type TItemRoutePath,
	type TShareableItemName,
} from '@/features/itemSharing/contracts';

import { checkObjectOrStringEmpty } from '@/shared/utilities/collections/check';

interface IProps {
	cookTime: TItemData<Recipe>[number]['cookTime'];
	from: IRecipe['from'];
	openWindow: (path: TItemRoutePath, name: TShareableItemName) => void;
}

export default function RecipeSourceDetails({
	cookTime,
	from,
	openWindow,
}: IProps) {
	return (
		<>
			{!checkObjectOrStringEmpty(from) && (
				<p className="break-all text-justify">
					<span className="font-semibold">食谱来源：</span>
					{typeof from === 'string'
						? from
						: Object.entries(from).map((fromObject, fromIndex) => {
								type TFrom = Exclude<IRecipe['from'], string>;
								const [method, target] = fromObject as [
									keyof TFrom,
									ExtractCollectionValue<TFrom>,
								];
								const isBond =
									method === 'bond' &&
									isObject(target) &&
									'level' in target;
								const isBuy =
									method === 'buy' &&
									isObject(target) &&
									'price' in target;
								const isLevelUp =
									method === 'levelup' &&
									Array.isArray(target);
								const isSelf = method === 'self';
								const isNoPrice = isBuy && isNil(target.price);
								return (
									<Fragment key={fromIndex}>
										{isSelf ? (
											'初始拥有'
										) : isBond ? (
											<>
												<span className="mr-1 inline-flex items-center">
													【
													<Sprite
														target="customer_rare"
														name={target.name}
														size={1.25}
														className="mx-0.5 rounded-full"
													/>
													{target.name}】羁绊
												</span>
												Lv.{target.level - 1}
												<span className="mx-0.5">
													➞
												</span>
												Lv.{target.level}
											</>
										) : isBuy ? (
											<>
												{isNoPrice ? '出售于' : null}
												{target.name}
												{isNoPrice ? null : '（'}
												{isObject(target.price) ? (
													<span className="inline-flex items-center">
														<Price
															showSymbol={false}
														>
															{
																target.price
																	.amount
															}
															×
														</Price>
														<Tooltip
															showArrow
															content={`点击：在新窗口中查看货币【${target.price.currency}】的详情`}
															offset={1}
															size="sm"
														>
															<Sprite
																target="currency"
																name={
																	target.price
																		.currency
																}
																size={1.25}
																onPress={() => {
																	if (
																		isObject(
																			target.price
																		)
																	) {
																		openWindow(
																			'currencies',
																			target
																				.price
																				.currency
																		);
																	}
																}}
																aria-label={`点击：在新窗口中查看货币【${target.price.currency}】的详情`}
																role="button"
															/>
														</Tooltip>
													</span>
												) : isNoPrice ? null : (
													<Price>
														{target.price}
													</Price>
												)}
												{isNoPrice ? null : '）'}
											</>
										) : (
											isLevelUp && (
												<>
													<span className="mr-1">
														游戏等级
													</span>
													Lv.{target[0] - 1}
													<span className="mx-0.5">
														➞
													</span>
													Lv.{target[0]}
													{target[1] !== null && (
														<span className="ml-0.5">
															且已解锁地区【
															{target[1]}】
														</span>
													)}
												</>
											)
										)}
									</Fragment>
								);
							})}
				</p>
			)}
			{cookTime.min !== 0 && (
				<p>
					<Popover showArrow offset={3} size="sm">
						<Tooltip
							showArrow
							content="随游戏等级提升而降低"
							offset={1}
							size="sm"
						>
							<span className={cn('inline-flex cursor-pointer')}>
								<PopoverTrigger>
									<span
										tabIndex={0}
										className={cn(
											'font-semibold',
											CLASSNAME_FOCUS_VISIBLE_OUTLINE
										)}
									>
										<span className="underline-dotted-offset2">
											烹饪时间
										</span>
										：
									</span>
								</PopoverTrigger>
							</span>
						</Tooltip>
						<PopoverContent>随游戏等级提升而降低</PopoverContent>
					</Popover>
					{cookTime.max}秒<span className="mx-0.5">➞</span>
					{cookTime.min}秒
				</p>
			)}
		</>
	);
}
