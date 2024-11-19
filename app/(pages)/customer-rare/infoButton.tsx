import {Fragment, type ReactElement, memo} from 'react';
import {twJoin} from 'tailwind-merge';

import {useViewInNewWindow} from '@/hooks';

import {AccordionItem, Avatar, Divider, ScrollShadow} from '@nextui-org/react';

import InfoButtonBase from './infoButtonBase';
import Ol from '@/components/ol';
import Sprite from '@/components/sprite';
import Tooltip from '@/components/tooltip';

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

	const currentCustomerName = store.shared.customer.name.use();

	const instance_clothes = store.instances.clothes.get();
	const instance_cooker = store.instances.cooker.get();
	const instance_customer = store.instances.customer.get();
	const instance_ornament = store.instances.ornament.get();
	const instance_partner = store.instances.partner.get();
	const instance_recipe = store.instances.recipe.get();

	if (currentCustomerName === null) {
		return null;
	}

	const {
		collection: currentCustomerCollection,
		description: currentCustomerDescription,
		id: currentCustomerId,
		places: currentCustomerPlaces,
		spellCards: currentCustomerSpellCards,
	} = instance_customer.getPropsByName(currentCustomerName);

	const [currentCustomerMainPlace] = currentCustomerPlaces;

	const bondClothes = instance_clothes.getBondClothes(currentCustomerName);
	const bondCooker = instance_cooker.getBondCooker(currentCustomerName);
	const bondPartner = instance_partner.getBondPartner(currentCustomerName);

	const bondOrnamentsData = instance_ornament.getBondOrnaments(currentCustomerName);
	const {length: bondOrnamentsDataLength} = bondOrnamentsData;

	const bondRecipesData = instance_recipe.getBondRecipes(currentCustomerName);
	const {length: bondRecipesDataLength} = bondRecipesData;

	const hasBondRewards =
		currentCustomerCollection ||
		bondClothes !== null ||
		bondCooker !== null ||
		bondPartner !== null ||
		bondRecipesDataLength > 0 ||
		bondOrnamentsDataLength > 0;
	const hasSpellCards = Object.keys(currentCustomerSpellCards).length > 0;
	const hasNegativeSpellCards =
		hasSpellCards &&
		'negative' in currentCustomerSpellCards &&
		(currentCustomerSpellCards.negative as unknown[]).length > 0;
	const hasPositiveSpellCards =
		hasSpellCards &&
		'positive' in currentCustomerSpellCards &&
		(currentCustomerSpellCards.positive as unknown[]).length > 0;

	const getDefaultExpandedKeys = () => {
		const defaultExpandedKeys = [];

		if (hasBondRewards) {
			defaultExpandedKeys.push('bond');
		}
		if (hasSpellCards) {
			defaultExpandedKeys.push('card');
		}
		if (defaultExpandedKeys.length === 0) {
			defaultExpandedKeys.push('description');
		}

		return defaultExpandedKeys;
	};

	const getLabel = (type: TRewardType) => `点击：在新窗口中查看此${type}的详情`;

	return (
		<InfoButtonBase defaultExpandedKeys={getDefaultExpandedKeys()}>
			<AccordionItem key="description" aria-label="稀客介绍" title="稀客介绍">
				<ScrollShadow hideScrollBar size={16} className="max-h-48 break-all text-justify text-xs">
					<p className="mb-1 text-sm">
						<span className="font-semibold">ID：</span>
						{currentCustomerId}
					</p>
					<p>
						<span className="font-semibold">Lv.1：</span>
						{currentCustomerDescription[0]}
					</p>
					{currentCustomerDescription[1] !== null && (
						<p>
							<span className="font-semibold">Lv.3：</span>
							{currentCustomerDescription[1]}
						</p>
					)}
					{currentCustomerDescription[2] !== null && (
						<p>
							<span className="font-semibold">Lv.5：</span>
							{currentCustomerDescription[2]}
						</p>
					)}
				</ScrollShadow>
			</AccordionItem>
			{hasBondRewards ? (
				<AccordionItem key="bond" aria-label={`${currentCustomerName}羁绊奖励`} title="羁绊奖励">
					<div className="flex flex-col gap-2 text-xs">
						<div className="space-y-1">
							{bondRecipesData.map(({level, name}, index) => (
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
							{bondOrnamentsData.map(({level, name}, index) => (
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
							{currentCustomerCollection && (
								<>
									{bondClothes === null &&
										bondCooker === null &&
										bondOrnamentsDataLength === 0 &&
										bondRecipesDataLength > 1 && <Divider />}
									<p className="flex items-center leading-5">
										<LevelLabel level={5} />
										采集【{currentCustomerMainPlace}】
									</p>
								</>
							)}
							{bondPartner !== null && (
								<>
									{bondClothes === null &&
										bondCooker === null &&
										bondOrnamentsDataLength === 0 &&
										bondRecipesDataLength > 1 &&
										!currentCustomerCollection && <Divider />}
									<p className="flex items-center">
										<LevelLabel level="伙伴" />
										<Tooltip showArrow content={getLabel('伙伴')} placement="left" size="sm">
											<span
												onClick={() => {
													openWindow('partners', bondPartner);
												}}
												onKeyDown={(event) => {
													if (checkA11yConfirmKey(event)) {
														openWindow('partners', bondPartner);
													}
												}}
												aria-label={getLabel('伙伴')}
												role="button"
												tabIndex={0}
												className="underline-dotted-offset2 inline-flex cursor-pointer items-center"
											>
												<Sprite
													target="partner"
													name={bondPartner}
													size={1.25}
													className="mr-0.5 rounded-full"
												/>
												{bondPartner}
											</span>
										</Tooltip>
									</p>
								</>
							)}
						</div>
					</div>
				</AccordionItem>
			) : (
				(null as unknown as ReactElement)
			)}
			{hasSpellCards ? (
				<AccordionItem key="card" aria-label={`${currentCustomerName}符卡效果`} title="符卡效果">
					<ScrollShadow
						hideScrollBar
						size={16}
						className="max-h-32 break-all text-justify text-xs md:max-h-48"
					>
						{hasPositiveSpellCards && (
							<>
								<p className="mb-1 text-sm font-semibold">奖励符卡</p>
								{currentCustomerSpellCards.positive.map(({description, name}, index) => (
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
								{currentCustomerSpellCards.negative.map(({description, name}, index) => (
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
				<ScrollShadow hideScrollBar size={16} className="max-h-48 text-xs">
					<p className="mb-1 text-sm font-semibold">选单时</p>
					<Ol>
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
					</Ol>
					<p className="mb-1 mt-2 text-sm font-semibold">交互时</p>
					<Ol>
						<li>
							<span className="hidden md:inline">点击顶部的“设置”按钮</span>
							<span className="md:hidden">点击右上角的按钮打开菜单。再点击“设置”按钮</span>
							，可以更改设置或使用数据管理功能。
						</li>
						<li>
							{/* cSpell:ignore haixian */}
							所有的搜索框都支持模糊搜索，如使用“海鲜”、“haixian”或“hx”均可搜索到“海鲜味噌汤”。
						</li>
					</Ol>
				</ScrollShadow>
			</AccordionItem>
			<AccordionItem key="rating" aria-label="评级图例" title="评级图例">
				<div className="flex flex-col gap-2 text-xs">
					{(['极度不满', '不满', '普通', '满意', '完美'] as const).map((rating, index) => (
						<div key={index} className="mb-1 flex items-center gap-3 px-1">
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
							{rating === '极度不满'
								? `${rating}（释放惩罚符卡）`
								: rating === '完美'
									? `${rating}（释放奖励符卡）`
									: rating}
						</div>
					))}
				</div>
			</AccordionItem>
		</InfoButtonBase>
	);
}
