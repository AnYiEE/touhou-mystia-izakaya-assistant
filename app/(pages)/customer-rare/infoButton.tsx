import {type ReactElement, memo} from 'react';

import {AccordionItem, Avatar, Popover, PopoverContent, PopoverTrigger, ScrollShadow, Tooltip} from '@nextui-org/react';

import {customerRatingColorMap} from './constants';
import InfoButtonBase from './infoButtonBase';
import Sprite from '@/components/sprite';

import type {TReward} from '@/data/customer_rare/types';
import {customerRareStore as store} from '@/stores';

interface ILevelLabelProps {
	level: number;
}

const LevelLabel = memo<ILevelLabelProps>(function LevelLabel({level}) {
	return <span className="font-medium">Lv.{level}：</span>;
});

export default memo(function InfoButton() {
	const currentCustomerData = store.shared.customer.data.use();

	const instance_recipe = store.instances.recipe.get();

	if (!currentCustomerData) {
		return null;
	}

	const {name: currentCustomerName, target: currentCustomerTarget} = currentCustomerData;

	const instance_customer = store.instances[currentCustomerTarget as 'customer_rare'].get();

	const {bondRewards: currentCustomerBondRewards, places: currentCustomerPlaces} =
		instance_customer.getPropsByName(currentCustomerName);

	const [currentCustomerMainPlace] = currentCustomerPlaces;

	const bondRecipesData = instance_recipe.getBondRecipes(currentCustomerData);
	const {length: bondRecipesDataLength} = bondRecipesData;
	const {length: currentCustomerBondRewardsLength} = currentCustomerBondRewards;

	const getDescription = (type: TReward['type'], description: TReward['description']) => {
		switch (type) {
			case '厨具': {
				const descriptionSplitArray = (description as string).split('：');
				return `${descriptionSplitArray.shift()}效果：${descriptionSplitArray.join('：')}`;
			}
			case '伙伴':
				return `解锁条件：${currentCustomerMainPlace}地区全部角色羁绊满级`;
			default:
				return `${type}效果：${description}`;
		}
	};

	return (
		<InfoButtonBase defaultExpandedKeys={['bond']}>
			{bondRecipesDataLength > 0 || currentCustomerBondRewardsLength > 0 ? (
				<AccordionItem key="bond" aria-label={`${currentCustomerName}羁绊奖励`} title="羁绊奖励">
					<div className="flex flex-col gap-2 text-justify text-xs">
						<div className="space-y-1">
							{bondRecipesData.map(({name, level}, index) => (
								<p key={index} className="flex items-center">
									<LevelLabel level={level} />
									<Sprite target="recipe" name={name} size={1.25} className="mr-0.5" />
									{name}
									{index < bondRecipesDataLength - 1 && <br />}
								</p>
							))}
							{currentCustomerBondRewards.map(({description, reward, type}, index) => (
								<p key={index} className="leading-5">
									<LevelLabel level={5} />
									{description === null ? (
										`${type}【${reward}】`
									) : (
										<>
											{type}【
											<Popover showArrow offset={7}>
												<Tooltip
													showArrow
													content={getDescription(type, description)}
													offset={4}
												>
													<span className="cursor-pointer">
														<PopoverTrigger>
															<span
																role="button"
																tabIndex={0}
																className="underline decoration-dotted underline-offset-2"
															>
																{reward}
															</span>
														</PopoverTrigger>
													</span>
												</Tooltip>
												<PopoverContent>{getDescription(type, description)}</PopoverContent>
											</Popover>
											】
										</>
									)}
								</p>
							))}
						</div>
					</div>
				</AccordionItem>
			) : (
				(null as unknown as ReactElement)
			)}
			<AccordionItem key="help" aria-label="特别说明" title="特别说明">
				<ScrollShadow hideScrollBar size={16} className="max-h-48 text-justify text-xs">
					<p className="mb-1 text-sm font-semibold">选单时</p>
					<ol className="list-inside list-disc">
						<li>
							点击顾客卡片中的标签可以将该标签视为顾客的点单需求，点单需求的满足程度是套餐评级时的参考维度之一。
						</li>
						<li>
							点击套餐卡片中的厨具可以为当前套餐标记是否使用“夜雀”系列厨具，厨具类别是套餐评级时的参考维度之一。
						</li>
						<li>“保存套餐”按钮仅会在选择了料理和酒水，且选定了顾客的点单需求标签时被启用。</li>
					</ol>
					<p className="mb-1 mt-2 text-sm font-semibold">交互时</p>
					<ol className="list-inside list-disc">
						<li>
							<span className="hidden md:inline">点击顶部的“设置”按钮</span>
							<span className="md:hidden">点击右上角的按钮打开菜单。再点击“设置”按钮</span>
							，可以更改设置或使用数据管理功能。
						</li>
						<li>
							{/* cSpell:ignore haixian */}
							所有的搜索框都支持模糊搜索，如使用“海鲜”、“haixian”或“hx”均可搜索到“海鲜味噌汤”。
						</li>
					</ol>
				</ScrollShadow>
			</AccordionItem>
			<AccordionItem key="rating" aria-label="评级图例" title="评级图例">
				<div className="flex flex-col gap-2 text-justify text-xs">
					{(['极度不满', '不满', '普通', '满意', '完美'] as const).map((rating) => (
						<div key={rating} className="mb-1 flex items-center gap-3 px-1">
							<Avatar
								isBordered
								showFallback
								color={customerRatingColorMap[rating]}
								fallback={<div></div>}
								radius="sm"
								classNames={{
									base: 'h-4 w-px ring-offset-0',
								}}
							/>
							{rating}
						</div>
					))}
				</div>
			</AccordionItem>
		</InfoButtonBase>
	);
});
