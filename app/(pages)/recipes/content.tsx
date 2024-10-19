import {Fragment, memo, useRef} from 'react';
import {isObjectLike} from 'lodash';

import {useOpenedItemPopover, useViewInNewWindow} from '@/hooks';

import {PopoverContent, PopoverTrigger} from '@nextui-org/react';

import {TrackCategory, trackEvent} from '@/components/analytics';
import ItemCard from '@/components/itemCard';
import ItemPopoverCard from '@/components/itemPopoverCard';
import Popover from '@/components/popover';
import Price from '@/components/price';
import Sprite from '@/components/sprite';
import Tooltip from '@/components/tooltip';

import {DARK_MATTER_NAME, type IRecipe, RECIPE_TAG_STYLE} from '@/data';
// import {globalStore as store} from '@/stores';
import {type Recipe, checkA11yConfirmKey} from '@/utils';

interface IProps {
	data: Recipe['data'];
}

export default memo<IProps>(function Content({data}) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const [openedPopover] = useOpenedItemPopover(popoverCardRef);
	const openWindow = useViewInNewWindow();

	// const isHighAppearance = store.persistence.highAppearance.use();

	return data.map(
		({dlc, from, name, level, price, cooker, ingredients, negativeTags, positiveTags, max, min}, dataIndex) => (
			<Popover
				key={dataIndex}
				showArrow
				// backdrop={isHighAppearance ? 'blur' : 'opaque'}
				isOpen={openedPopover ? openedPopover === name : (undefined as unknown as boolean)}
			>
				<ItemPopoverCard.Trigger>
					<ItemCard
						isHoverable={openedPopover ? openedPopover === name : true}
						isPressable={openedPopover ? openedPopover === name : true}
						name={name}
						description={<Price>{price}</Price>}
						image={<Sprite target="recipe" name={name} size={3} />}
						onPress={() => {
							trackEvent(TrackCategory.Click, 'Recipe Card', name);
						}}
					/>
				</ItemPopoverCard.Trigger>
				<PopoverContent>
					<ItemPopoverCard.CloseButton />
					<ItemPopoverCard.ShareButton name={name} />
					<ItemPopoverCard
						target="recipe"
						name={name}
						description={{level, price}}
						dlc={dlc}
						cooker={name === DARK_MATTER_NAME ? null : cooker}
						ingredients={ingredients}
						tags={{negative: negativeTags, positive: positiveTags}}
						tagColors={RECIPE_TAG_STYLE}
						ref={popoverCardRef}
					>
						<p>
							<span className="font-semibold">食谱来源：</span>
							{typeof from === 'string'
								? from
								: Object.entries(from).map((fromObject, fromIndex) => {
										type TFrom = Exclude<IRecipe['from'], string>;
										const [method, target] = fromObject as [keyof TFrom, TFrom[keyof TFrom]];
										const isBond = method === 'bond' && isObjectLike(target) && 'level' in target;
										const isBuy = method === 'buy' && isObjectLike(target) && 'price' in target;
										const isLevelUp = method === 'levelup' && typeof target === 'number';
										const isSelf = method === 'self';
										return (
											<Fragment key={fromIndex}>
												{isSelf ? (
													'初始拥有'
												) : isBond ? (
													<>
														<span className="pr-1">
															【
															<Sprite
																target="customer_rare"
																name={target.name}
																size={1.25}
																className="mx-0.5 rounded-full align-text-bottom leading-none"
															/>
															{target.name}】羁绊
														</span>
														Lv.{target.level - 1}
														<span className="px-0.5">➞</span>Lv.
														{target.level}
													</>
												) : isBuy ? (
													<>
														{target.name}（
														<Price showSymbol={false}>{target.price.amount}×</Price>
														<Tooltip
															showArrow
															content="点击：在新窗口中查看此货币的详情"
															offset={6}
															size="sm"
														>
															<Sprite
																target="currency"
																name={target.price.currency}
																size={1.25}
																onClick={() => {
																	openWindow('currencies', target.price.currency);
																}}
																onKeyDown={(event) => {
																	if (checkA11yConfirmKey(event)) {
																		openWindow('currencies', target.price.currency);
																	}
																}}
																aria-label="点击：在新窗口中查看此货币的详情"
																role="button"
																tabIndex={0}
																className="cursor-pointer align-text-bottom leading-none"
															/>
														</Tooltip>
														）
													</>
												) : (
													isLevelUp && (
														<>
															<span className="pr-1">游戏等级</span>
															Lv.{target - 1}
															<span className="px-0.5">➞</span>Lv.
															{target}
														</>
													)
												)}
											</Fragment>
										);
									})}
						</p>
						{max !== 0 && (
							<p>
								<Popover showArrow offset={6} size="sm">
									<Tooltip showArrow content="随游戏等级提升而降低" offset={3} size="sm">
										<span className="inline-flex cursor-pointer">
											<PopoverTrigger>
												<span tabIndex={0} className="font-semibold">
													<span className="underline-dotted-offset2">烹饪时间</span>：
												</span>
											</PopoverTrigger>
										</span>
									</Tooltip>
									<PopoverContent>随游戏等级提升而降低</PopoverContent>
								</Popover>
								{max}秒<span className="px-0.5">➞</span>
								{min}秒
							</p>
						)}
					</ItemPopoverCard>
				</PopoverContent>
			</Popover>
		)
	);
});
