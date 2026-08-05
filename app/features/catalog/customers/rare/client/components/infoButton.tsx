import { AccordionItem } from '@heroui/accordion';
import { cn } from '@heroui/theme';
import { memo } from 'react';
import useBreakpoint from 'use-breakpoint';

import Avatar from '@/design/ui/components/avatar';
import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import Ol from '@/design/ui/components/ol';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import PressElement from '@/design/ui/components/pressElement';
import Tooltip from '@/design/ui/components/tooltip';

import { LABEL_MAP } from '@/domain/data/customers/rare/formatTokens';
import type { TRewardType } from '@/domain/data/shared/types';
import {
	CUSTOMER_EVALUATION_KEY_MAP,
	CUSTOMER_RATING_MAP,
} from '@/domain/evaluation/labels';
import type { TRatingKey } from '@/domain/evaluation/types';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { customerRareStore } from '@/features/catalog/customers/rare/client/state/store';
import InfoButtonBase, {
	InfoSectionTitle,
} from '@/features/catalog/customers/shared/client/components/infoButtonBase';
import { getCustomerRareTachiePath } from '@/features/catalog/presentation/tachiePaths';
import Price from '@/features/catalog/shared/client/components/Price';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import Tachie from '@/features/catalog/shared/client/components/Tachie';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';

interface ILevelLabelProps {
	level: number | string;
}

interface IProps {
	desktopTriggerContainer: HTMLElement | null;
}

const LevelLabel = memo<ILevelLabelProps>(function LevelLabel({ level }) {
	return (
		<span className="whitespace-nowrap font-medium">
			{typeof level === 'number' ? 'Lv.' : ''}
			{level}：
		</span>
	);
});

export default memo<IProps>(function InfoButton({ desktopTriggerContainer }) {
	const openWindow = useViewInNewWindow();
	const { breakpoint: placement } = useBreakpoint(
		{ bottom: -1, 'right-start': 426 },
		'bottom'
	);

	const currentCustomerName = customerRareStore.shared.customer.name.use();
	const bondRewards = customerRareStore.bondRewards.use();

	const instance_customer = customerRareStore.instances.customer.get();

	if (currentCustomerName === null) {
		return null;
	}

	const {
		chat: currentCustomerChat,
		description: currentCustomerDescription,
		evaluation: currentCustomerEvaluation,
		id: currentCustomerId,
		places: currentCustomerPlaces,
		spellCards: currentCustomerSpellCards,
	} = instance_customer.getPropsByName(currentCustomerName);
	const {
		bondClothes,
		bondCooker,
		bondOrnaments: bondOrnamentsData,
		bondPartner,
		bondRecipes: bondRecipesData,
		collection: currentCustomerCollection,
		hasBondRewards,
	} = bondRewards;

	const [currentCustomerMainPlace] = currentCustomerPlaces;
	const hasSpellCards = !checkLengthEmpty(
		Object.keys(currentCustomerSpellCards)
	);
	const hasNegativeSpellCards =
		hasSpellCards &&
		'negative' in currentCustomerSpellCards &&
		!checkLengthEmpty<unknown>(currentCustomerSpellCards.negative);
	const hasPositiveSpellCards =
		hasSpellCards &&
		'positive' in currentCustomerSpellCards &&
		!checkLengthEmpty<unknown>(currentCustomerSpellCards.positive);

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
		<InfoButtonBase
			showMobileTextTrigger
			defaultExpandedKeys={getDefaultExpandedKeys()}
			desktopTriggerContainer={desktopTriggerContainer}
			overlayId="customer-rare.info"
			onButtonPress={() => {
				trackEvent(
					trackEvent.category.click,
					'Info Button',
					currentCustomerName
				);
			}}
		>
			<AccordionItem
				key="description"
				aria-label={`${currentCustomerName}介绍`}
				textValue={currentCustomerName}
				title={<InfoSectionTitle title={currentCustomerName} />}
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
									src={getCustomerRareTachiePath(
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
			) : null}
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
			) : null}
			{checkLengthEmpty(currentCustomerChat) ? null : (
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
										fallback={<div />}
										radius="sm"
										classNames={{
											base: 'h-6 w-2 ring-offset-0',
										}}
									/>
									<div>
										<p className="font-semibold">
											{evaluation}
											{evaluation === '极度不满' &&
											hasNegativeSpellCards ? (
												<span className="font-normal">
													（释放惩罚符卡）
												</span>
											) : evaluation === '完美' &&
											  hasPositiveSpellCards ? (
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
					<p className="font-semibold">搭配套餐</p>
					<Ol className="text-small">
						<li>
							顾客标签和套餐评级按一般营业情景计算。任务中的临时偏好、符卡改判等特殊情况可能不会反映在结果中。
						</li>
						<li>
							点击顾客卡片中的料理或酒水标签，可以将其设为点单需求；默认也会用该标签筛选对应表格，这项联动可在设置中关闭。
						</li>
						<li>
							选择料理后，点击套餐卡片中的厨具可切换为“夜雀”系列厨具。使用后无需选择点单需求；黑暗物质不适用。
						</li>
						<li>
							保存套餐需要料理和酒水，还需分别选定料理、酒水点单需求，或标记使用“夜雀”系列厨具。
						</li>
						<li>
							“猜您想要”可按当前选择自动推荐套餐；“营业预设”可集中查看多个稀客的已保存套餐或自动推荐。
						</li>
					</Ol>
				</div>
				<div>
					<p className="font-semibold">快捷功能</p>
					<Ol className="text-small">
						<li>
							<span className="hidden md:inline">
								从顶部进入“设置”
							</span>
							<span className="md:hidden">
								使用页面右下角的“设置”按钮，或从右上角菜单进入“设置”
							</span>
							，可以调整流行趋势、明星店、自动推荐、内容显示和数据管理等选项。
						</li>
						<li>
							点击导航栏的搜索按钮可查找资料、设置或直接应用筛选。名称搜索支持中文、拼音全拼和首字母。
						</li>
					</Ol>
				</div>
			</AccordionItem>
		</InfoButtonBase>
	);
});
