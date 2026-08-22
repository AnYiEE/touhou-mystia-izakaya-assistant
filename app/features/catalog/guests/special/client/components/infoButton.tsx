import { AccordionItem } from '@heroui/accordion';
import { cn } from '@heroui/theme';
import { memo, useCallback } from 'react';
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

import { LABEL_MAP } from '@/domain/data/guests/special/formatTokens';
import { MAP_FACTS } from '@/domain/data/places/placeFacts';
import type { TRewardType } from '@/domain/data/shared/types';
import {
	GUEST_EVALUATION_KEY_MAP,
	GUEST_RATING_MAP,
} from '@/domain/evaluation/labels';
import type { TRatingKey } from '@/domain/evaluation/types';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import InfoButtonBase, {
	InfoSectionTitle,
} from '@/features/catalog/guests/shared/client/components/infoButtonBase';
import { specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import { getSpecialGuestTachiePath } from '@/features/catalog/presentation/tachiePaths';
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

const DEFAULT_EXPANDED_KEYS = ['description'] as const;
const DEFAULT_EXPANDED_KEYS_WITH_BOND = [
	...DEFAULT_EXPANDED_KEYS,
	'bond',
] as const;
const DEFAULT_EXPANDED_KEYS_WITH_CARD = [
	...DEFAULT_EXPANDED_KEYS,
	'card',
] as const;
const DEFAULT_EXPANDED_KEYS_WITH_BOND_AND_CARD = [
	...DEFAULT_EXPANDED_KEYS_WITH_BOND,
	'card',
] as const;
const DESCRIPTION_CLASS_NAMES = {
	content: 'space-y-1 break-all pt-2 text-justify text-default-900',
} as const;
const BOND_CLASS_NAMES = {
	content: 'flex-col gap-2 pt-2 text-default-900 data-[open=true]:flex',
} as const;
const CHAT_CLASS_NAMES = {
	content: 'break-all pt-2 text-justify text-small text-default-900',
} as const;
const RATING_CLASS_NAMES = {
	content:
		'space-y-1 break-all pt-2 text-justify text-small text-default-900',
} as const;
const RATING_AVATAR_CLASS_NAMES = { base: 'h-6 w-2 ring-offset-0' } as const;

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

	const currentSpecialGuest = specialGuestStore.shared.guest.id.use();
	const bondRewards = specialGuestStore.bondRewards.use();

	const specialGuestCatalog = specialGuestStore.instances.guest.get();
	const handleButtonPress = useCallback(() => {
		if (currentSpecialGuest === null) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Info Button',
			specialGuestCatalog.getPropsById(currentSpecialGuest, 'name')
		);
	}, [currentSpecialGuest, specialGuestCatalog]);

	if (currentSpecialGuest === null) {
		return null;
	}

	const {
		chat: currentSpecialGuestChat,
		description: currentSpecialGuestDescription,
		evaluation: currentSpecialGuestEvaluation,
		maps: currentSpecialGuestMaps,
		name: currentSpecialGuestName,
		spellCards: currentSpecialGuestSpellCards,
	} = specialGuestCatalog.getPropsById(currentSpecialGuest);
	const {
		bondClothes,
		bondCooker,
		bondDecorations,
		bondFoods,
		bondPartner,
		collection: currentSpecialGuestCollection,
		hasBondRewards,
	} = bondRewards;

	const currentSpecialGuestMainPlace =
		MAP_FACTS[currentSpecialGuestMaps[0]].label;
	const hasSpellCards = !checkLengthEmpty(
		Object.keys(currentSpecialGuestSpellCards)
	);
	const hasNegativeSpellCards =
		hasSpellCards &&
		'negative' in currentSpecialGuestSpellCards &&
		!checkLengthEmpty<unknown>(currentSpecialGuestSpellCards.negative);
	const hasPositiveSpellCards =
		hasSpellCards &&
		'positive' in currentSpecialGuestSpellCards &&
		!checkLengthEmpty<unknown>(currentSpecialGuestSpellCards.positive);

	const defaultExpandedKeys = hasBondRewards
		? hasSpellCards
			? DEFAULT_EXPANDED_KEYS_WITH_BOND_AND_CARD
			: DEFAULT_EXPANDED_KEYS_WITH_BOND
		: hasSpellCards
			? DEFAULT_EXPANDED_KEYS_WITH_CARD
			: DEFAULT_EXPANDED_KEYS;

	const getLabel = (type: TRewardType) =>
		`点击：在新窗口中查看此${type}的详情`;

	return (
		<InfoButtonBase
			showMobileTextTrigger
			defaultExpandedKeys={defaultExpandedKeys}
			desktopTriggerContainer={desktopTriggerContainer}
			overlayId="special-guest.info"
			onButtonPress={handleButtonPress}
		>
			<AccordionItem
				key="description"
				aria-label={`${currentSpecialGuestName}介绍`}
				textValue={currentSpecialGuestName}
				title={<InfoSectionTitle title={currentSpecialGuestName} />}
				classNames={DESCRIPTION_CLASS_NAMES}
			>
				<div className="flex items-center gap-4">
					<p>
						<span className="font-semibold">ID：</span>
						<Price showSymbol={false}>{currentSpecialGuest}</Price>
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
										target="special_guest"
										recordId={currentSpecialGuest}
										size={1.25}
										className="mr-0.5 rounded-full"
									/>
									查看立绘
								</span>
							</PopoverTrigger>
							<PopoverContent>
								<Tachie
									alt={currentSpecialGuestName}
									src={getSpecialGuestTachiePath(
										currentSpecialGuest
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
						{currentSpecialGuestDescription[0]}
					</p>
					{currentSpecialGuestDescription[1] !== null && (
						<p>
							<span className="font-semibold">Lv.3：</span>
							{currentSpecialGuestDescription[1]}
						</p>
					)}
					{currentSpecialGuestDescription[2] !== null && (
						<p>
							<span className="font-semibold">Lv.5：</span>
							{currentSpecialGuestDescription[2]}
						</p>
					)}
				</div>
			</AccordionItem>
			{hasBondRewards ? (
				<AccordionItem
					key="bond"
					aria-label={`${currentSpecialGuestName}羁绊奖励`}
					title="羁绊奖励"
					classNames={BOND_CLASS_NAMES}
				>
					<div className="grid grid-cols-2 content-start gap-1">
						{bondFoods.map(({ id, level, name }) => (
							<p key={id} className="flex items-center">
								<LevelLabel level={level} />
								<Tooltip
									showArrow
									content={getLabel('料理')}
									placement="right"
								>
									<PressElement
										onPress={() => {
											openWindow('foods', id, name);
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
											target="food"
											recordId={id}
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
											openWindow(
												'cookers',
												bondCooker.id,
												bondCooker.name
											);
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
											recordId={bondCooker.id}
											size={1.25}
											className="mr-0.5"
										/>
										{bondCooker.name}
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
											openWindow(
												'clothes',
												bondClothes.id,
												bondClothes.name
											);
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
											recordId={bondClothes.id}
											size={1.25}
											className="mr-0.5"
										/>
										{bondClothes.name}
									</PressElement>
								</Tooltip>
							</p>
						)}
						{bondDecorations.map(({ id, level, name }) => (
							<p key={id} className="flex items-center">
								<LevelLabel level={level} />
								<Tooltip
									showArrow
									content={getLabel('摆件')}
									placement="right"
								>
									<PressElement
										onPress={() => {
											openWindow('decorations', id, name);
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
											target="decoration"
											recordId={id}
											size={1.25}
											className="mr-0.5"
										/>
										{name}
									</PressElement>
								</Tooltip>
							</p>
						))}
						{currentSpecialGuestCollection && (
							<p className="flex items-center leading-5">
								<LevelLabel level={5} />
								采集【{currentSpecialGuestMainPlace}】
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
											openWindow(
												'partners',
												bondPartner.id,
												bondPartner.name
											);
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
											recordId={bondPartner.id}
											size={1.25}
											className="mr-0.5 rounded-full"
										/>
										{bondPartner.name}
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
					aria-label={`${currentSpecialGuestName}符卡效果`}
					title="符卡效果"
					classNames={DESCRIPTION_CLASS_NAMES}
				>
					{hasPositiveSpellCards && (
						<div className="space-y-1">
							<p className="text-large font-semibold text-exgood-border dark:text-exgood">
								奖励符卡
							</p>
							<div className="space-y-1.5">
								{currentSpecialGuestSpellCards.positive.map(
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
								{currentSpecialGuestSpellCards.negative.map(
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
			{checkLengthEmpty(currentSpecialGuestChat) ? null : (
				<AccordionItem
					key="chat"
					aria-label="闲聊对话"
					title="闲聊对话"
					classNames={CHAT_CLASS_NAMES}
				>
					<Ol>
						{currentSpecialGuestChat.map((chat, index) => (
							<li key={index}>{chat}</li>
						))}
					</Ol>
				</AccordionItem>
			)}
			<AccordionItem
				key="rating"
				aria-label="评价对话"
				title="评价对话"
				classNames={RATING_CLASS_NAMES}
			>
				{Object.entries(GUEST_EVALUATION_KEY_MAP).map(
					([evaluation, evaluationKey], index) => {
						const specialGuestEvaluation =
							currentSpecialGuestEvaluation[evaluationKey];
						if (evaluationKey in GUEST_RATING_MAP) {
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
										classNames={RATING_AVATAR_CLASS_NAMES}
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
										{specialGuestEvaluation !== null && (
											<p>{specialGuestEvaluation}</p>
										)}
									</div>
								</div>
							);
						}
						return specialGuestEvaluation === null ? null : (
							<p key={index}>
								<span className="font-semibold">
									{evaluation}：
								</span>
								{specialGuestEvaluation}
							</p>
						);
					}
				)}
			</AccordionItem>
			<AccordionItem
				key="help"
				aria-label="特别说明"
				title="特别说明"
				classNames={DESCRIPTION_CLASS_NAMES}
			>
				<div>
					<p className="font-semibold">搭配套餐</p>
					<Ol className="text-small">
						<li>
							顾客标签和套餐评级按一般营业情景计算。任务中的临时偏好、符卡改判等特殊情况可能不会反映在结果中。
						</li>
						<li>
							除流行趋势标签外，点击顾客卡片中的料理或酒水标签，可以将其设为点单需求；默认也会用该标签筛选对应表格，这项联动可在设置中关闭。
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
