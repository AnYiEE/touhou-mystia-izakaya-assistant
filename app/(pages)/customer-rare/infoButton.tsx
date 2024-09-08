import {type ReactElement, memo} from 'react';
import {twJoin} from 'tailwind-merge';

import {useViewInNewWindow} from '@/hooks';

import {
	AccordionItem,
	Avatar,
	Image,
	Popover,
	PopoverContent,
	PopoverTrigger,
	ScrollShadow,
	Tooltip,
} from '@nextui-org/react';

import {customerRatingColorMap} from './constants';
import InfoButtonBase from './infoButtonBase';
import Sprite from '@/components/sprite';

import type {TReward} from '@/data/customer_rare/types';
import {customerRareStore as store} from '@/stores';
import {checkA11yConfirmKey} from '@/utils';

interface ILevelLabelProps {
	level: number | string;
}

const LevelLabel = memo<ILevelLabelProps>(function LevelLabel({level}) {
	return (
		<span className="font-medium">
			{typeof level === 'number' ? 'Lv.' : ''}
			{level}：
		</span>
	);
});

export default memo(function InfoButton() {
	const openWindow = useViewInNewWindow();

	const currentCustomerData = store.shared.customer.data.use();

	const instance_rare = store.instances.customer_rare.get();
	const instance_recipe = store.instances.recipe.get();

	if (!currentCustomerData) {
		return null;
	}

	const {name: currentCustomerName, target: currentCustomerTarget} = currentCustomerData;

	const instance_customer = store.instances[currentCustomerTarget as 'customer_rare'].get();

	const {
		bondRewards: currentCustomerBondRewards,
		spellCards: currentCustomerSpellCards,
		places: currentCustomerPlaces,
	} = instance_customer.getPropsByName(currentCustomerName);

	const [currentCustomerMainPlace] = currentCustomerPlaces;

	const bondRecipesData = instance_recipe.getBondRecipes(currentCustomerData);
	const {length: bondRecipesDataLength} = bondRecipesData;
	const {length: currentCustomerBondRewardsLength} = currentCustomerBondRewards;

	const getDescription = ({description, reward, type}: TReward) => {
		switch (type) {
			case '厨具': {
				const descriptionSplitArray = (description as string).split('：');
				return `${descriptionSplitArray.shift()}效果：${descriptionSplitArray.join('：')}`;
			}
			case '服装':
				return (
					<Image
						removeWrapper
						draggable={false}
						src={instance_rare.getTachiePath(
							'clothes',
							reward,
							reward === '黑色套装' || reward === '星尘披风套装'
						)}
						width={120}
						alt={reward}
						title={reward}
						className="my-1 select-none"
					/>
				);
			case '伙伴':
				return (
					<div className="flex flex-col items-center">
						<Image
							removeWrapper
							draggable={false}
							src={instance_rare.getTachiePath('partners', reward)}
							width={100}
							alt={`${reward}立绘`}
							title={reward}
							className="my-1 select-none"
						/>
						<p>
							解锁条件：
							{description === true ? `地区【${currentCustomerMainPlace}】全部稀客羁绊满级` : description}
						</p>
					</div>
				);
			default:
				return `${type}效果：${description}`;
		}
	};

	const hasBondRewards = bondRecipesDataLength > 0 || currentCustomerBondRewardsLength > 0;
	const hasSpellCards = Object.keys(currentCustomerSpellCards).length > 0;
	const hasNegativeSpellCards = hasSpellCards && (currentCustomerSpellCards.negative as unknown[]).length > 0;
	const hasPositiveSpellCards = hasSpellCards && (currentCustomerSpellCards.positive as unknown[]).length > 0;

	const label = '点击：在新窗口中查看此料理的详情';

	return (
		<InfoButtonBase defaultExpandedKeys={[hasBondRewards ? 'bond' : 'card']}>
			{hasBondRewards ? (
				<AccordionItem key="bond" aria-label={`${currentCustomerName}羁绊奖励`} title="羁绊奖励">
					<div className="flex flex-col gap-2 text-justify text-xs">
						<div className="space-y-1">
							{bondRecipesData.map(({name, level}, index) => (
								<p key={index} className="flex items-center">
									<LevelLabel level={level} />
									<Tooltip showArrow content={label} placement="left" size="sm">
										<span
											onClick={() => {
												openWindow('recipes', name);
											}}
											onKeyDown={(event) => {
												if (checkA11yConfirmKey(event)) {
													openWindow('recipes', name);
												}
											}}
											aria-label={label}
											role="button"
											tabIndex={0}
											className="underline-dotted-offset2 inline-flex cursor-pointer items-center"
										>
											<Sprite target="recipe" name={name} size={1.25} className="mr-0.5" />
											{name}
										</span>
									</Tooltip>
									{index < bondRecipesDataLength - 1 && <br />}
								</p>
							))}
							{currentCustomerBondRewards.map((bondReward, index) => (
								<p key={index} className="leading-5">
									<LevelLabel
										level={
											bondReward.type === '伙伴' && bondReward.description !== true ? '其他' : 5
										}
									/>
									{bondReward.type === '采集'
										? `${bondReward.type}【${bondReward.reward}】`
										: (() => {
												const hasTachie =
													bondReward.type === '服装' || bondReward.type === '伙伴';
												const placement = hasTachie ? 'left' : 'top';
												return (
													<>
														{bondReward.type}【
														<Popover
															showArrow
															offset={hasTachie ? 15 : 6}
															size="sm"
															placement={placement}
														>
															<Tooltip
																showArrow
																content={getDescription(bondReward)}
																offset={hasTachie ? 12 : 3}
																placement={placement}
																size="sm"
															>
																<span className="inline-flex cursor-pointer">
																	<PopoverTrigger>
																		<span
																			role="button"
																			tabIndex={0}
																			className="underline-dotted-offset2"
																		>
																			{bondReward.reward}
																		</span>
																	</PopoverTrigger>
																</span>
															</Tooltip>
															<PopoverContent>
																{getDescription(bondReward)}
															</PopoverContent>
														</Popover>
														】
													</>
												);
											})()}
								</p>
							))}
						</div>
					</div>
				</AccordionItem>
			) : (
				(null as unknown as ReactElement)
			)}
			{hasSpellCards ? (
				<AccordionItem key="card" aria-label={`${currentCustomerName}符卡效果`} title="符卡效果">
					<ScrollShadow hideScrollBar size={16} className="max-h-48 text-justify text-xs">
						{hasPositiveSpellCards && (
							<>
								<p className="mb-1 text-sm font-semibold">奖励符卡</p>
								{currentCustomerSpellCards.positive.map(({name, description}, index) => (
									<div key={index} className="mb-0.5">
										<p className="font-medium">{name}</p>
										<div className="ml-3 mt-0.5 text-xs">
											<p>{description}</p>
										</div>
									</div>
								))}
							</>
						)}
						{hasNegativeSpellCards && (
							<>
								<p className={twJoin('mb-1 text-sm font-semibold', hasPositiveSpellCards && 'mt-2')}>
									惩罚符卡
								</p>
								{currentCustomerSpellCards.negative.map(({name, description}, index) => (
									<div key={index} className="mb-0.5">
										<p className="font-medium">{name}</p>
										<div className="ml-3 mt-0.5 text-xs">
											<p>{description}</p>
										</div>
									</div>
								))}
							</>
						)}
					</ScrollShadow>
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
