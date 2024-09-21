import {Fragment, type ReactElement, memo} from 'react';
import {twJoin} from 'tailwind-merge';

import useBreakpoint from 'use-breakpoint';
import {useViewInNewWindow} from '@/hooks';

import {
	AccordionItem,
	Avatar,
	Divider,
	Popover,
	PopoverContent,
	PopoverTrigger,
	ScrollShadow,
	Tooltip,
} from '@nextui-org/react';

import InfoButtonBase from './infoButtonBase';
import Sprite from '@/components/sprite';
import Tachie from '@/components/tachie';

import {customerRatingColorMap} from './constants';
import type {TRewardType} from '@/data/customer_rare/types';
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

export default function InfoButton() {
	const openWindow = useViewInNewWindow();
	const {breakpoint: placement} = useBreakpoint(
		{
			left: 426,
			top: -1,
		},
		'top'
	);

	const currentCustomerData = store.shared.customer.data.use();

	if (!currentCustomerData) {
		return null;
	}

	const instance_clothes = store.instances.clothes.get();
	const instance_cooker = store.instances.cooker.get();
	const instance_ornament = store.instances.ornament.get();
	const instance_rare = store.instances.customer_rare.get();
	const instance_recipe = store.instances.recipe.get();

	const {name: currentCustomerName, target: currentCustomerTarget} = currentCustomerData;

	const instance_customer = store.instances[currentCustomerTarget as 'customer_rare'].get();

	const {
		bondRewards: currentCustomerBondRewards,
		spellCards: currentCustomerSpellCards,
		places: currentCustomerPlaces,
	} = instance_customer.getPropsByName(currentCustomerName);

	const [currentCustomerMainPlace] = currentCustomerPlaces;

	const bondClothes = instance_clothes.getBondClothes(currentCustomerData);
	const bondCooker = instance_cooker.getBondCooker(currentCustomerData);

	const bondOrnamentsData = instance_ornament.getBondOrnaments(currentCustomerData);
	const {length: bondOrnamentsDataLength} = bondOrnamentsData;

	const bondRecipesData = instance_recipe.getBondRecipes(currentCustomerData);
	const {length: bondRecipesDataLength} = bondRecipesData;

	const {length: currentCustomerBondRewardsLength} = currentCustomerBondRewards;

	const hasBondRewards =
		bondClothes !== null ||
		bondCooker !== null ||
		bondRecipesDataLength > 0 ||
		bondOrnamentsDataLength > 0 ||
		currentCustomerBondRewardsLength > 0;
	const hasSpellCards = Object.keys(currentCustomerSpellCards).length > 0;
	const hasNegativeSpellCards = hasSpellCards && (currentCustomerSpellCards.negative as unknown[]).length > 0;
	const hasPositiveSpellCards = hasSpellCards && (currentCustomerSpellCards.positive as unknown[]).length > 0;

	const getLabel = (type: TRewardType) => `点击：在新窗口中查看此${type}的详情`;

	return (
		<InfoButtonBase defaultExpandedKeys={[hasBondRewards ? 'bond' : 'card']}>
			{hasBondRewards ? (
				<AccordionItem key="bond" aria-label={`${currentCustomerName}羁绊奖励`} title="羁绊奖励">
					<div className="flex flex-col gap-2 text-justify text-xs">
						<div className="space-y-1">
							{bondRecipesData.map(({name, level}, index) => (
								<p key={index} className="flex items-center">
									<LevelLabel level={level} />
									<Tooltip showArrow content={getLabel('料理')} placement="left" size="sm">
										<span
											onClick={() => {
												openWindow('recipes', name);
											}}
											onKeyDown={(event) => {
												if (checkA11yConfirmKey(event)) {
													openWindow('recipes', name);
												}
											}}
											aria-label={getLabel('料理')}
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
							{bondCooker !== null && (
								<>
									{bondRecipesDataLength > 1 && <Divider />}
									<p className="flex items-center">
										<LevelLabel level={5} />
										<Tooltip showArrow content={getLabel('厨具')} placement="left" size="sm">
											<span
												onClick={() => {
													openWindow('cookers', bondCooker);
												}}
												onKeyDown={(event) => {
													if (checkA11yConfirmKey(event)) {
														openWindow('cookers', bondCooker);
													}
												}}
												aria-label={getLabel('厨具')}
												role="button"
												tabIndex={0}
												className="underline-dotted-offset2 inline-flex cursor-pointer items-center"
											>
												<Sprite
													target="cooker"
													name={bondCooker}
													size={1.25}
													className="mr-0.5"
												/>
												{bondCooker}
											</span>
										</Tooltip>
									</p>
								</>
							)}
							{bondClothes !== null && (
								<>
									{bondCooker === null && bondRecipesDataLength > 1 && <Divider />}
									<p className="flex items-center">
										<LevelLabel level={5} />
										<Tooltip showArrow content={getLabel('衣服')} placement="left" size="sm">
											<span
												onClick={() => {
													openWindow('clothes', bondClothes);
												}}
												onKeyDown={(event) => {
													if (checkA11yConfirmKey(event)) {
														openWindow('clothes', bondClothes);
													}
												}}
												aria-label={getLabel('衣服')}
												role="button"
												tabIndex={0}
												className="underline-dotted-offset2 inline-flex cursor-pointer items-center"
											>
												<Sprite
													target="clothes"
													name={bondClothes}
													size={1.25}
													className="mr-0.5"
												/>
												{bondClothes}
											</span>
										</Tooltip>
									</p>
								</>
							)}
							{bondOrnamentsData.map(({name, level}, index) => (
								<Fragment key={index}>
									{index === 0 &&
										bondClothes === null &&
										bondCooker === null &&
										bondRecipesDataLength > 1 && <Divider />}
									<p className="flex items-center">
										<LevelLabel level={level} />
										<Tooltip showArrow content={getLabel('摆件')} placement="left" size="sm">
											<span
												onClick={() => {
													openWindow('ornaments', name);
												}}
												onKeyDown={(event) => {
													if (checkA11yConfirmKey(event)) {
														openWindow('ornaments', name);
													}
												}}
												aria-label={getLabel('摆件')}
												role="button"
												tabIndex={0}
												className="underline-dotted-offset2 inline-flex cursor-pointer items-center"
											>
												<Sprite target="ornament" name={name} size={1.25} className="mr-0.5" />
												{name}
											</span>
										</Tooltip>
										{index < bondOrnamentsDataLength - 1 && <br />}
									</p>
								</Fragment>
							))}
							{currentCustomerBondRewards.map(({description, reward, type}, index) => (
								<Fragment key={index}>
									{index === 0 &&
										bondClothes === null &&
										bondCooker === null &&
										bondOrnamentsDataLength === 0 &&
										bondRecipesDataLength > 1 && <Divider />}
									<p className="flex items-center leading-5">
										<LevelLabel level={type === '伙伴' && description !== true ? '其他' : 5} />
										{type === '采集'
											? `${type}【${reward}】`
											: (() => {
													const content = (
														<div className="flex flex-col items-center">
															<Tachie
																alt={reward}
																src={instance_rare.getTachiePath('partners', reward)}
																width={120}
																className="my-1"
															/>
															<p>
																解锁条件：
																{description === true
																	? `地区【${currentCustomerMainPlace}】全部稀客羁绊满级`
																	: description}
															</p>
														</div>
													);
													return (
														<>
															{type}【
															<Popover
																showArrow
																offset={placement === 'left' ? 15 : 6}
																size="sm"
																placement={placement}
															>
																<Tooltip
																	showArrow
																	content={content}
																	offset={placement === 'left' ? 12 : 3}
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
																				{reward}
																			</span>
																		</PopoverTrigger>
																	</span>
																</Tooltip>
																<PopoverContent>{content}</PopoverContent>
															</Popover>
															】
														</>
													);
												})()}
									</p>
								</Fragment>
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
							顾客卡片中的标签和最终的套餐评级只适合一般情景。在任务中的顾客可能临时存在其他的偏好标签；如果有提供改判效果的符卡生效，此时的套餐评级也可能会不够准确。
						</li>
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
}
