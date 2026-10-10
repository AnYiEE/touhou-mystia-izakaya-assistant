import { AccordionItem } from '@heroui/accordion';
import { useCallback } from 'react';

import Avatar from '@/design/ui/components/avatar';
import Ol from '@/design/ui/components/ol';

import { GUEST_RATING_KEY, GUEST_RATING_MAP } from '@/domain/evaluation/labels';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { normalGuestStore } from '@/features/catalog/guests/normal/client/state/store';
import InfoButtonBase, {
	InfoSectionTitle,
} from '@/features/catalog/guests/shared/client/components/infoButtonBase';
import { catalogGuestsMessages } from '@/features/catalog/guests/shared/messages';
import Price from '@/features/catalog/shared/client/components/Price';

import { useI18n } from '@/shared/i18n/useI18n';
import { checkLengthEmpty } from '@/shared/utilities/collections/check';

const DEFAULT_EXPANDED_KEYS = ['description', 'rating'] as const;
const DEFAULT_EXPANDED_KEYS_WITH_CHAT = [
	...DEFAULT_EXPANDED_KEYS,
	'chat',
] as const;
const DESCRIPTION_CLASS_NAMES = {
	content: 'space-y-1 break-all pt-2 text-justify text-default-900',
} as const;
const CHAT_CLASS_NAMES = {
	content: 'break-all pt-2 text-justify text-small text-default-900',
} as const;
const RATING_CLASS_NAMES = {
	content:
		'grid grid-cols-3 content-start break-all pt-2 text-justify text-small text-default-900',
} as const;
const RATING_AVATAR_CLASS_NAMES = { base: 'h-6 w-2 ring-offset-0' } as const;

export default function InfoButton() {
	const { t } = useI18n(catalogGuestsMessages);
	const currentNormalGuest = normalGuestStore.shared.guest.id.use();

	const normalGuestCatalog = normalGuestStore.instances.guest.get();
	const handleButtonPress = useCallback(() => {
		if (currentNormalGuest === null) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Info Button',
			normalGuestCatalog.getDisplayPropsById(currentNormalGuest, 'name')
		);
	}, [currentNormalGuest, normalGuestCatalog]);

	if (currentNormalGuest === null) {
		return null;
	}

	const {
		chat: currentGuestChat,
		description: currentGuestDescription,
		name: currentGuestName,
	} = normalGuestCatalog.getDisplayPropsById(currentNormalGuest);

	const defaultExpandedKeys = checkLengthEmpty(currentGuestChat)
		? DEFAULT_EXPANDED_KEYS
		: DEFAULT_EXPANDED_KEYS_WITH_CHAT;

	return (
		<InfoButtonBase
			defaultExpandedKeys={defaultExpandedKeys}
			overlayId="normal-guest.info"
			onButtonPress={handleButtonPress}
		>
			<AccordionItem
				key="description"
				aria-label={t('guests.info.introAria', {
					name: currentGuestName,
				})}
				textValue={currentGuestName}
				title={<InfoSectionTitle title={currentGuestName} />}
				classNames={DESCRIPTION_CLASS_NAMES}
			>
				<div className="flex items-center gap-4">
					<p>
						<span className="font-semibold">
							{t('guests.info.nameLabel')}
						</span>
						{currentGuestName}
					</p>
					<p>
						<span className="font-semibold">
							{t('guests.info.idLabel')}
						</span>
						<Price showSymbol={false}>{currentNormalGuest}</Price>
					</p>
				</div>
				<p className="text-small">{currentGuestDescription}</p>
			</AccordionItem>
			{checkLengthEmpty(currentGuestChat) ? null : (
				<AccordionItem
					key="chat"
					aria-label={t('guests.info.chat')}
					title={t('guests.info.chat')}
					classNames={CHAT_CLASS_NAMES}
				>
					<Ol>
						{currentGuestChat.map((chat, index) => (
							<li key={index}>{chat}</li>
						))}
					</Ol>
				</AccordionItem>
			)}
			<AccordionItem
				key="rating"
				aria-label={t('guests.info.ratingLegend')}
				title={t('guests.info.ratingLegend')}
				classNames={RATING_CLASS_NAMES}
			>
				{GUEST_RATING_KEY.filter((key) =>
					['exbad', 'norm', 'good'].includes(key)
				).map((ratingKey, index) => (
					<div key={index} className="flex items-center gap-3 px-1">
						<Avatar
							isBordered
							showFallback
							color={ratingKey}
							fallback={<div />}
							radius="sm"
							classNames={RATING_AVATAR_CLASS_NAMES}
						/>
						{GUEST_RATING_MAP[ratingKey]}
					</div>
				))}
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
						<li>{t('guests.info.help.meal.p1')}</li>
						<li>{t('guests.info.help.meal.p2')}</li>
						<li>{t('guests.info.help.meal.p3')}</li>
						<li>{t('guests.info.help.meal.p4')}</li>
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
							{t('guests.info.help.shortcutSettingsSuffix')}
						</li>
						<li>{t('guests.info.help.shortcutSearch')}</li>
					</Ol>
				</div>
			</AccordionItem>
		</InfoButtonBase>
	);
}
