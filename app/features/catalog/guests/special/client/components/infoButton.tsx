import { AccordionItem } from '@heroui/accordion';
import { cn } from '@heroui/theme';
import { memo, useCallback } from 'react';

import Avatar from '@/design/ui/components/avatar';
import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import Ol from '@/design/ui/components/ol';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import PressElement from '@/design/ui/components/pressElement';
import Tooltip from '@/design/ui/components/tooltip';
import { useBreakpoint } from '@/design/ui/hooks/useBreakpoint';

import { LABEL_MAP } from '@/domain/data/guests/special/formatTokens';
import { MAP_FACTS } from '@/domain/data/places/placeFacts';
import type { TRewardType } from '@/domain/data/shared/types';
import {
	GUEST_EVALUATION_KEY_MAP,
	GUEST_RATING_MAP,
} from '@/domain/evaluation/labels';
import { getEvaluationLabelByText } from '@/domain/evaluation/localizedLabels';
import type { TRatingKey } from '@/domain/evaluation/types';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import {
	type TAppShellMessageKey,
	appShellMessages,
} from '@/features/appShell/client/messages';
import InfoButtonBase, {
	InfoSectionTitle,
} from '@/features/catalog/guests/shared/client/components/infoButtonBase';
import { catalogGuestsMessages } from '@/features/catalog/guests/shared/messages';
import { specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import { getSpecialGuestTachiePath } from '@/features/catalog/presentation/tachiePaths';
import Price from '@/features/catalog/shared/client/components/Price';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import Tachie from '@/features/catalog/shared/client/components/Tachie';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';

import { useI18n } from '@/shared/i18n/useI18n';
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

type TRewardLabelType = Exclude<TRewardType, '采集'>;

const REWARD_TYPE_MESSAGE_KEYS = {
	伙伴: 'appShell.nav.partners',
	厨具: 'appShell.nav.cookers',
	摆件: 'appShell.nav.decorations',
	料理: 'appShell.nav.foods',
	衣服: 'appShell.nav.clothes',
	道具: 'appShell.nav.items',
} as const satisfies Record<TRewardLabelType, TAppShellMessageKey>;

const LevelLabel = memo<ILevelLabelProps>(function LevelLabel({ level }) {
	return (
		<span className="whitespace-nowrap font-medium">
			{typeof level === 'number' ? 'Lv.' : ''}
			{level}：
		</span>
	);
});

export default memo<IProps>(function InfoButton({ desktopTriggerContainer }) {
	const { t } = useI18n(catalogGuestsMessages);
	const { t: tAppShell } = useI18n(appShellMessages);
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
			specialGuestCatalog.getDisplayPropsById(currentSpecialGuest, 'name')
		);
	}, [currentSpecialGuest, specialGuestCatalog]);

	if (currentSpecialGuest === null) {
		return null;
	}

	const currentSpecialGuestData =
		specialGuestCatalog.getDisplayPropsById(currentSpecialGuest);
	const {
		chat: currentSpecialGuestChat,
		description: currentSpecialGuestDescriptionSeed,
		evaluation: currentSpecialGuestEvaluationSeed,
		maps: currentSpecialGuestMaps,
		name: currentSpecialGuestName,
		spellCards: currentSpecialGuestSpellCards,
	} = currentSpecialGuestData;
	const currentSpecialGuestDescription = Array.isArray(
		currentSpecialGuestDescriptionSeed
	)
		? currentSpecialGuestDescriptionSeed
		: [currentSpecialGuestDescriptionSeed, null, null];
	const currentSpecialGuestEvaluation: Record<string, string | null> =
		currentSpecialGuestEvaluationSeed;
	const {
		bondClothes,
		bondCooker,
		bondDecorations,
		bondFoods,
		bondGeneralItems,
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

	const getLabel = (type: TRewardLabelType) =>
		t('guests.info.viewItemTip', {
			type: tAppShell(REWARD_TYPE_MESSAGE_KEYS[type]),
		});

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
				aria-label={t('guests.info.introAria', {
					name: currentSpecialGuestName,
				})}
				textValue={currentSpecialGuestName}
				title={<InfoSectionTitle title={currentSpecialGuestName} />}
				classNames={DESCRIPTION_CLASS_NAMES}
			>
				<div className="flex items-center gap-4">
					<p>
						<span className="font-semibold">
							{t('guests.info.idLabel')}
						</span>
						<Price showSymbol={false}>{currentSpecialGuest}</Price>
					</p>
					<p className="flex items-center">
						<span className="font-semibold">
							{t('guests.info.tachieLabel')}
						</span>
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
									{t('guests.info.viewTachie')}
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
					aria-label={t('guests.info.bondAria', {
						name: currentSpecialGuestName,
					})}
					title={t('guests.info.bond')}
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
						{bondGeneralItems.map(({ id, level, name }) => (
							<p key={id} className="flex items-center">
								<LevelLabel level={level} />
								<Tooltip
									showArrow
									content={getLabel('道具')}
									placement="right"
								>
									<PressElement
										onPress={() => {
											openWindow('items', id, name);
										}}
										aria-label={getLabel('道具')}
										role="button"
										tabIndex={0}
										className={cn(
											'underline-dotted-offset2 inline-flex cursor-pointer items-center',
											CLASSNAME_FOCUS_VISIBLE_OUTLINE
										)}
									>
										<Sprite
											target="item"
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
								{t('guests.info.gatherPlace', {
									place: currentSpecialGuestMainPlace,
								})}
							</p>
						)}
						{bondPartner !== null && (
							<p className="flex items-center">
								<LevelLabel
									level={tAppShell('appShell.nav.partners')}
								/>
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
					aria-label={t('guests.info.spellCardsAria', {
						name: currentSpecialGuestName,
					})}
					title={t('guests.info.spellCards')}
					classNames={DESCRIPTION_CLASS_NAMES}
				>
					{hasPositiveSpellCards && (
						<div className="space-y-1">
							<p className="text-large font-semibold text-exgood-border dark:text-exgood">
								{t('guests.info.spellCardPositive')}
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
								{t('guests.info.spellCardNegative')}
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
					aria-label={t('guests.info.chat')}
					title={t('guests.info.chat')}
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
				aria-label={t('guests.info.ratingConversations')}
				title={t('guests.info.ratingConversations')}
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
											{getEvaluationLabelByText(
												evaluation
											)}
											{evaluationKey === 'exbad' &&
											hasNegativeSpellCards ? (
												<span className="font-normal">
													{t(
														'guests.info.releaseNegative'
													)}
												</span>
											) : evaluationKey === 'exgood' &&
											  hasPositiveSpellCards ? (
												<span className="font-normal">
													{t(
														'guests.info.releasePositive'
													)}
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
				aria-label={t('guests.info.help')}
				title={t('guests.info.help')}
				classNames={DESCRIPTION_CLASS_NAMES}
			>
				<div>
					<p className="font-semibold">
						{t('guests.info.mealSection')}
					</p>
					<Ol className="text-small">
						<li>{t('guests.info.help.special.p1')}</li>
						<li>{t('guests.info.help.special.p2')}</li>
						<li>{t('guests.info.help.special.p3')}</li>
						<li>{t('guests.info.help.special.p4')}</li>
						<li>{t('guests.info.help.special.p5')}</li>
					</Ol>
				</div>
				<div>
					<p className="font-semibold">
						{t('guests.info.shortcutsSection')}
					</p>
					<Ol className="text-small">
						<li>
							<span className="hidden md:inline">
								{t('guests.info.help.shortcutSettings')}
							</span>
							<span className="md:hidden">
								{t('guests.info.help.shortcutSettingsMobile')}
							</span>
							{t(
								'guests.info.help.shortcutSettingsSuffixSpecial'
							)}
						</li>
						<li>{t('guests.info.help.shortcutSearch')}</li>
					</Ol>
				</div>
			</AccordionItem>
		</InfoButtonBase>
	);
});
