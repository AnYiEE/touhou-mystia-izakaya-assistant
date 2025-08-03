import { type ReactElement, memo } from 'react';

import useBreakpoint from 'use-breakpoint';
import { useViewInNewWindow } from '@/hooks';

import { AccordionItem } from '@heroui/accordion';

import {
	Avatar,
	CLASSNAME_FOCUS_VISIBLE_OUTLINE,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	cn,
} from '@/design/ui/components';

import InfoButtonBase from './infoButtonBase';
import Ol from '@/components/ol';
import PressElement from '@/components/pressElement';
import Price from '@/components/price';
import Sprite from '@/components/sprite';
import Tachie from '@/components/tachie';

import {
	CUSTOMER_EVALUATION_KEY_MAP,
	CUSTOMER_RATING_MAP,
	LABEL_MAP,
	type TRatingKey,
	type TRewardType,
} from '@/data';
import { customerRareStore as store } from '@/stores';
import { checkEmpty } from '@/utilities';

interface ILevelLabelProps {
	level: number | string;
}

const LevelLabel = memo<ILevelLabelProps>(function LevelLabel({ level }) {
	return (
		<span className="font-medium">
			{typeof level === 'number' ? 'Lv.' : ''}
			{level}：
		</span>
	);
});

export default function InfoButton() {
	const openWindow = useViewInNewWindow();
	const { breakpoint: placement } = useBreakpoint(
		{ bottom: -1, 'right-start': 426 },
		'bottom'
	);

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
		chat: currentCustomerChat,
		collection: currentCustomerCollection,
		description: currentCustomerDescription,
		evaluation: currentCustomerEvaluation,
		id: currentCustomerId,
		places: currentCustomerPlaces,
		spellCards: currentCustomerSpellCards,
	} = instance_customer.getPropsByName(currentCustomerName);

	const [currentCustomerMainPlace] = currentCustomerPlaces;

	const bondClothes = instance_clothes.getBondClothes(currentCustomerName);
	const bondCooker = instance_cooker.getBondCooker(currentCustomerName);
	const bondOrnamentsData =
		instance_ornament.getBondOrnaments(currentCustomerName);
	const bondPartner = instance_partner.getBondPartner(currentCustomerName);
	const bondRecipesData = instance_recipe.getBondRecipes(currentCustomerName);

	const hasBondRewards =
		currentCustomerCollection ||
		bondClothes !== null ||
		bondCooker !== null ||
		bondPartner !== null ||
		!checkEmpty(bondOrnamentsData) ||
		!checkEmpty(bondRecipesData);
	const hasSpellCards = !checkEmpty(Object.keys(currentCustomerSpellCards));
	const hasNegativeSpellCards =
		hasSpellCards &&
		'negative' in currentCustomerSpellCards &&
		!checkEmpty<unknown>(currentCustomerSpellCards.negative);
	const hasPositiveSpellCards =
		hasSpellCards &&
		'positive' in currentCustomerSpellCards &&
		!checkEmpty<unknown>(currentCustomerSpellCards.positive);

	const getDefaultExpandedKeys = () => {
		const defaultExpandedKeys = ['description'];

		if (hasBondRewards) {
			defaultExpandedKeys.push('bond');
		}
		if (hasSpellCards) {
			defaultExpandedKeys.push('card');
		}

		return defaultExpandedKeys;
	};

	const getLabel = (type: TRewardType) =>
		`点击：在新窗口中查看此${type}的详情`;

	return (
		<InfoButtonBase defaultExpandedKeys={getDefaultExpandedKeys()}>
			<AccordionItem
				key="description"
				aria-label="稀客介绍"
				title="稀客介绍"
				classNames={{
					content:
						'space-y-1 break-all pt-2 text-justify text-default-900',
				}}
			>
				<div className="flex items-center gap-4">
					<p>
						<span className="font-semibold">ID：</span>
						<Price showSymbol={false}>{currentCustomerId}</Price>
					</p>
					<p className="flex items-center">
						<span className="font-semibold">立绘：</span>
						<Popover
							placement={placement}
							showArrow={placement === 'bottom'}
						>
							<PopoverTrigger>
								<span
									role="button"
									tabIndex={0}
									className={cn(
										'underline-dotted-offset2 inline-flex cursor-pointer items-center',
										CLASSNAME_FOCUS_VISIBLE_OUTLINE
									)}
								>
									<Sprite
										target="customer_rare"
										name={currentCustomerName}
										size={1.25}
										className="mr-0.5 rounded-full"
									/>
									查看立绘
								</span>
							</PopoverTrigger>
							<PopoverContent>
								<Tachie
									alt={currentCustomerName}
									src={instance_customer.getTachiePath(
										currentCustomerName
									)}
									width={240}
								/>
							</PopoverContent>
						</Popover>
					</p>
				</div>
				<div className="text-small">
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
				</div>
			</AccordionItem>
			{hasBondRewards ? (
				<AccordionItem
					key="bond"
					aria-label={`${currentCustomerName}羁绊奖励`}
					title="羁绊奖励"
					classNames={{
						content:
							'flex-col gap-2 pt-2 text-default-900 data-[open=true]:flex',
					}}
				>
					<div className="grid grid-cols-2 content-start gap-1">
						{bondRecipesData.map(({ level, name }, index) => (
							<p key={index} className="flex items-center">
								<LevelLabel level={level} />
								<Tooltip
									showArrow
									content={getLabel('料理')}
									placement="right"
								>
									<PressElement
										as="span"
										onPress={() => {
											openWindow('recipes', name);
										}}
										aria-label={getLabel('料理')}
										role="button"
										tabIndex={0}
										className={cn(
											'underline-dotted-offset2 inline-flex cursor-pointer items-center',
											CLASSNAME_FOCUS_VISIBLE_OUTLINE
										)}
									>
										<Sprite
											target="recipe"
											name={name}
											size={1.25}
											className="mr-0.5"
										/>
										{name}
									</PressElement>
								</Tooltip>
							</p>
						))}
						{bondCooker !== null && (
							<p className="flex items-center">
								<LevelLabel level={5} />
								<Tooltip
									showArrow
									content={getLabel('厨具')}
									placement="right"
								>
									<PressElement
										as="span"
										onPress={() => {
											openWindow('cookers', bondCooker);
										}}
										aria-label={getLabel('厨具')}
										role="button"
										tabIndex={0}
										className={cn(
											'underline-dotted-offset2 inline-flex cursor-pointer items-center',
											CLASSNAME_FOCUS_VISIBLE_OUTLINE
										)}
									>
										<Sprite
											target="cooker"
											name={bondCooker}
											size={1.25}
											className="mr-0.5"
										/>
										{bondCooker}
									</PressElement>
								</Tooltip>
							</p>
						)}
						{bondClothes !== null && (
							<p className="flex items-center">
								<LevelLabel level={5} />
								<Tooltip
									showArrow
									content={getLabel('衣服')}
									placement="right"
								>
									<PressElement
										as="span"
										onPress={() => {
											openWindow('clothes', bondClothes);
										}}
										aria-label={getLabel('衣服')}
										role="button"
										tabIndex={0}
										className={cn(
											'underline-dotted-offset2 inline-flex cursor-pointer items-center',
											CLASSNAME_FOCUS_VISIBLE_OUTLINE
										)}
									>
										<Sprite
											target="clothes"
											name={bondClothes}
											size={1.25}
											className="mr-0.5"
										/>
										{bondClothes}
									</PressElement>
								</Tooltip>
							</p>
						)}
						{bondOrnamentsData.map(({ level, name }, index) => (
							<p key={index} className="flex items-center">
								<LevelLabel level={level} />
								<Tooltip
									showArrow
									content={getLabel('摆件')}
									placement="right"
								>
									<PressElement
										as="span"
										onPress={() => {
											openWindow('ornaments', name);
										}}
										aria-label={getLabel('摆件')}
										role="button"
										tabIndex={0}
										className={cn(
											'underline-dotted-offset2 inline-flex cursor-pointer items-center',
											CLASSNAME_FOCUS_VISIBLE_OUTLINE
										)}
									>
										<Sprite
											target="ornament"
											name={name}
											size={1.25}
											className="mr-0.5"
										/>
										{name}
									</PressElement>
								</Tooltip>
							</p>
						))}
						{currentCustomerCollection && (
							<p className="flex items-center leading-5">
								<LevelLabel level={5} />
								采集【{currentCustomerMainPlace}】
							</p>
						)}
						{bondPartner !== null && (
							<p className="flex items-center">
								<LevelLabel level="伙伴" />
								<Tooltip
									showArrow
									content={getLabel('伙伴')}
									placement="right"
								>
									<PressElement
										as="span"
										onPress={() => {
											openWindow('partners', bondPartner);
										}}
										aria-label={getLabel('伙伴')}
										role="button"
										tabIndex={0}
										className={cn(
											'underline-dotted-offset2 inline-flex cursor-pointer items-center',
											CLASSNAME_FOCUS_VISIBLE_OUTLINE
										)}
									>
										<Sprite
											target="partner"
											name={bondPartner}
											size={1.25}
											className="mr-0.5 rounded-full"
										/>
										{bondPartner}
									</PressElement>
								</Tooltip>
							</p>
						)}
					</div>
				</AccordionItem>
			) : (
				(null as unknown as ReactElement)
			)}
			{hasSpellCards ? (
				<AccordionItem
					key="card"
					aria-label={`${currentCustomerName}符卡效果`}
					title="符卡效果"
					classNames={{
						content:
							'space-y-1 break-all pt-2 text-justify text-default-900',
					}}
				>
					{hasPositiveSpellCards && (
						<div className="space-y-1">
							<p className="text-large font-semibold text-exgood-border dark:text-exgood">
								奖励符卡
							</p>
							<div className="space-y-1.5">
								{currentCustomerSpellCards.positive.map(
									({ description, name }, index) => (
										<div
											key={index}
											className="space-y-0.5"
										>
											<p className="font-medium">
												{name}
											</p>
											<div className="ml-4 text-small">
												{description
													.split(LABEL_MAP.br)
													.map((text, line) => (
														<p
															key={`${index}-${line}`}
														>
															{text}
														</p>
													))}
											</div>
										</div>
									)
								)}
							</div>
						</div>
					)}
					{hasNegativeSpellCards && (
						<div
							className={cn('space-y-1', {
								'!mt-2': hasPositiveSpellCards,
							})}
						>
							<p className="text-large font-semibold text-bad dark:text-bad-border">
								惩罚符卡
							</p>
							<div className="space-y-1.5">
								{currentCustomerSpellCards.negative.map(
									({ description, name }, index) => (
										<div
											key={index}
											className="space-y-0.5"
										>
											<p className="font-medium">
												{name}
											</p>
											<div className="ml-4 text-small">
												{description
													.split(LABEL_MAP.br)
													.map((text, line) => (
														<p
															key={`${index}-${line}`}
														>
															{text}
														</p>
													))}
											</div>
										</div>
									)
								)}
							</div>
						</div>
					)}
				</AccordionItem>
			) : (
				(null as unknown as ReactElement)
			)}
			{checkEmpty(currentCustomerChat) ? (
				(null as unknown as ReactElement)
			) : (
				<AccordionItem
					key="chat"
					aria-label="闲聊对话"
					title="闲聊对话"
					classNames={{
						content:
							'break-all pt-2 text-justify text-small text-default-900',
					}}
				>
					<Ol>
						{currentCustomerChat.map((chat, index) => (
							<li key={index}>{chat}</li>
						))}
					</Ol>
				</AccordionItem>
			)}
			<AccordionItem
				key="rating"
				aria-label="评价对话"
				title="评价对话"
				classNames={{
					content:
						'space-y-1 break-all pt-2 text-justify text-small text-default-900',
				}}
			>
				{Object.entries(CUSTOMER_EVALUATION_KEY_MAP).map(
					([evaluation, evaluationKey], index) => {
						const customerEvaluation =
							currentCustomerEvaluation[evaluationKey];
						if (evaluationKey in CUSTOMER_RATING_MAP) {
							return (
								<div
									key={index}
									className="flex items-center gap-3 px-1"
								>
									<Avatar
										isBordered
										showFallback
										color={evaluationKey as TRatingKey}
										fallback={<div></div>}
										radius="sm"
										classNames={{
											base: 'h-6 w-2 ring-offset-0',
										}}
									/>
									<div>
										<p className="font-semibold">
											{evaluation}
											{evaluation === '极度不满' ? (
												<span className="font-normal">
													（释放惩罚符卡）
												</span>
											) : evaluation === '完美' ? (
												<span className="font-normal">
													（释放奖励符卡）
												</span>
											) : null}
										</p>
										{customerEvaluation !== null && (
											<p>{customerEvaluation}</p>
										)}
									</div>
								</div>
							);
						}
						return customerEvaluation === null ? null : (
							<p key={index}>
								<span className="font-semibold">
									{evaluation}：
								</span>
								{customerEvaluation}
							</p>
						);
					}
				)}
			</AccordionItem>
			<AccordionItem
				key="help"
				aria-label="特别说明"
				title="特别说明"
				classNames={{
					content:
						'space-y-1 break-all pt-2 text-justify text-default-900',
				}}
			>
				<div>
					<p className="font-semibold">选单时</p>
					<Ol className="text-small">
						<li>
							顾客卡片中的标签和最终的套餐评级只适合一般情景。在任务中的顾客可能临时存在其他的偏好标签；如果有提供改判效果的符卡生效，此时的套餐评级也可能会不够准确。
						</li>
						<li>
							点击顾客卡片中的标签可以将该标签视为顾客的点单需求，点单需求的满足程度是套餐评级时的参考维度之一。
						</li>
						<li>
							点击套餐卡片中的厨具可以为当前套餐标记是否使用“夜雀”系列厨具，厨具类别是套餐评级时的参考维度之一。
						</li>
						<li>
							“保存套餐”按钮仅会在选择了料理和酒水，且选定了顾客的点单需求标签时被启用。
						</li>
					</Ol>
				</div>
				<div>
					<p className="font-semibold">交互时</p>
					<Ol className="text-small">
						<li>
							<span className="hidden md:inline">
								点击顶部的“设置”按钮
							</span>
							<span className="md:hidden">
								点击右上角的按钮打开菜单。再点击“设置”按钮
							</span>
							，可以更改设置或使用数据管理功能。
						</li>
						<li>
							{/* cSpell:ignore haixian */}
							所有的搜索框都支持模糊搜索，如使用“海鲜”、“haixian”或“hx”均可搜索到“海鲜味噌汤”。
						</li>
					</Ol>
				</div>
			</AccordionItem>
		</InfoButtonBase>
	);
}
