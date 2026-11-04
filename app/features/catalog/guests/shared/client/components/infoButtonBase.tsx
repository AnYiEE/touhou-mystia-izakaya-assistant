import { faChevronRight, faInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Accordion, type AccordionProps } from '@heroui/accordion';
import {
	Fragment,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { createPortal } from 'react-dom';

import Button from '@/design/ui/components/button';
import SiteInfoBase from '@/design/ui/components/siteInfo';
import Tooltip from '@/design/ui/components/tooltip';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import { useParams } from '@/features/appShell/client/navigation/useParams';
import { catalogGuestsMessages } from '@/features/catalog/guests/shared/messages';
import { GUEST_INFO_QUERY_PARAM } from '@/features/catalog/guests/shared/navigation';
import { trackSupportGuestInfo } from '@/features/donations/client/state/supportNudgeStore';
import {
	CoordinatedModal,
	requestOverlayClose,
} from '@/features/overlays/client';
import type { TOverlayId } from '@/features/overlays/contracts';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

import { useI18n } from '@/shared/i18n/useI18n';

const EMPTY_ACCORDION_KEYS: ReadonlyArray<never> = [];
const INFO_ACCORDION_ITEM_CLASSES = {
	base: 'mb-1 mt-3',
	title: 'text-xl font-bold',
	trigger: 'p-0',
} as const;

export function SiteInfo() {
	return (
		<SiteInfoBase
			baseUrl={PUBLIC_RUNTIME_CONFIG.baseURL}
			fontSize={8}
			className="h-full text-right"
		/>
	);
}

export function GuestCardSiteInfo() {
	return (
		<SiteInfoBase
			baseUrl={PUBLIC_RUNTIME_CONFIG.baseURL}
			fontSize={7}
			className="absolute bottom-1 left-[calc(100%-0.25rem)] origin-bottom-left -rotate-90"
		/>
	);
}

interface IInfoSectionTitleProps {
	title: string;
}

const BASE_INFO_SECTION_KEY = 'description';
const GUEST_CARD_INFO_ACTIONS = [
	{ accordionKey: 'bond', messageKey: 'guests.info.bond' },
	{ accordionKey: 'card', messageKey: 'guests.info.spellCards' },
	{ accordionKey: 'chat', messageKey: 'guests.info.chat' },
	{ accordionKey: 'rating', messageKey: 'guests.info.ratingConversations' },
] as const;

type TGuestCardInfoSectionKey =
	(typeof GUEST_CARD_INFO_ACTIONS)[number]['accordionKey'];

interface IGuestCardInfoSectionButtonProps {
	label: string;
	onSectionPress: (sectionKey: TGuestCardInfoSectionKey) => void;
	sectionKey: TGuestCardInfoSectionKey;
}

const GuestCardInfoSectionButton = memo<IGuestCardInfoSectionButtonProps>(
	function GuestCardInfoSectionButton({ label, onSectionPress, sectionKey }) {
		const handlePress = useCallback(() => {
			onSectionPress(sectionKey);
		}, [onSectionPress, sectionKey]);

		return (
			<Button
				size="sm"
				variant="light"
				onClick={handlePress}
				className="h-auto min-h-7 w-full min-w-0 rounded-none px-1 py-0.5 text-center text-[0.6875rem] leading-tight text-default-500"
			>
				<span className="line-clamp-2 whitespace-normal [overflow-wrap:anywhere]">
					{label}
				</span>
			</Button>
		);
	}
);

interface IGuestCardInfoActionProps {
	onDefaultPress: () => void;
	onSectionPress: (sectionKey: TGuestCardInfoSectionKey) => void;
}

const GuestCardInfoAction = memo<IGuestCardInfoActionProps>(
	function GuestCardInfoAction({ onDefaultPress, onSectionPress }) {
		const { t } = useI18n(catalogGuestsMessages);

		return (
			<div
				data-customer-info-entry
				className="grid grid-cols-[repeat(4,minmax(0,1fr))_1.75rem] divide-x divide-default-200/50 border-t border-default-200/50 bg-default/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(255,255,255,0.35)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.4),inset_0_-1px_0_rgba(255,255,255,0.04)]"
			>
				{GUEST_CARD_INFO_ACTIONS.map(({ accordionKey, messageKey }) => (
					<GuestCardInfoSectionButton
						key={accordionKey}
						label={t(messageKey)}
						onSectionPress={onSectionPress}
						sectionKey={accordionKey}
					/>
				))}
				<Button
					isIconOnly
					size="sm"
					variant="light"
					onClick={onDefaultPress}
					aria-label={t('guests.infoButton.label')}
					className="h-auto min-h-7 w-full min-w-0 rounded-none px-0 py-0.5 text-default-500"
				>
					<FontAwesomeIcon
						icon={faChevronRight}
						className="text-[0.625rem]"
					/>
				</Button>
			</div>
		);
	}
);

export const InfoSectionTitle = memo<IInfoSectionTitleProps>(
	function InfoSectionTitle({ title }) {
		return (
			<div className="flex items-center justify-between">
				<span>{title}</span>
				<SiteInfo />
			</div>
		);
	}
);

interface IProps extends Pick<
	AccordionProps,
	'children' | 'defaultExpandedKeys'
> {
	cardInfoActionContainer?: HTMLElement | null;
	onButtonPress?: () => void;
	overlayId: TOverlayId;
	supportGuest?: { id: number; kind: 'normal' | 'special' };
}

export default memo<IProps>(function InfoButtonBase({
	cardInfoActionContainer,
	children,
	defaultExpandedKeys,
	onButtonPress,
	overlayId,
	supportGuest,
}) {
	const { t } = useI18n(catalogGuestsMessages);
	const isReducedMotion = useReducedMotion();
	const { params, replaceState } = useParams();
	const vibrate = useVibrate();

	const [isOpened, setOpened] = useState(false);
	const [openedSection, setOpenedSection] =
		useState<TGuestCardInfoSectionKey | null>(null);

	const coordination = useMemo(() => ({ id: overlayId }), [overlayId]);

	const handleClose = useCallback(() => {
		vibrate();
		setOpened(false);
		setOpenedSection(null);
		requestOverlayClose(overlayId);

		const newParams = new URLSearchParams(params);
		newParams.delete(GUEST_INFO_QUERY_PARAM);
		replaceState(newParams);
	}, [overlayId, params, replaceState, vibrate]);

	const handleOpen = useCallback(
		(sectionKey: TGuestCardInfoSectionKey | null) => {
			vibrate();
			if (supportGuest !== undefined) {
				trackSupportGuestInfo(supportGuest.kind, supportGuest.id);
			}
			setOpenedSection(sectionKey);
			setOpened(true);
			onButtonPress?.();

			const newParams = new URLSearchParams(params);
			newParams.set(GUEST_INFO_QUERY_PARAM, '');
			replaceState(newParams);
		},
		[onButtonPress, params, replaceState, supportGuest, vibrate]
	);

	const handleDefaultPress = useCallback(() => {
		handleOpen(null);
	}, [handleOpen]);

	const handleSectionPress = useCallback(
		(sectionKey: TGuestCardInfoSectionKey) => {
			handleOpen(sectionKey);
		},
		[handleOpen]
	);

	useEffect(() => {
		setOpened(params.has(GUEST_INFO_QUERY_PARAM));
	}, [params]);

	const initialExpandedKeys = useMemo<
		NonNullable<AccordionProps['defaultExpandedKeys']>
	>(
		() =>
			openedSection === null
				? (defaultExpandedKeys ?? EMPTY_ACCORDION_KEYS)
				: [BASE_INFO_SECTION_KEY, openedSection],
		[defaultExpandedKeys, openedSection]
	);

	const buttonLabel = t('guests.infoButton.label');
	const iconButton = (
		<Tooltip
			showArrow
			content={t('guests.infoButton.tooltip')}
			offset={1}
			size="sm"
		>
			<Button
				isIconOnly
				size="sm"
				variant="light"
				onClick={handleDefaultPress}
				aria-label={buttonLabel}
				data-customer-info-trigger="desktop"
				className="absolute left-[calc(50%+1.15rem)] top-[2.375rem] z-10 h-5 w-5 min-w-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-default/40 bg-content1/95 p-0 text-default-700 shadow-small data-[hover=true]:border-primary data-[pressed=true]:border-primary data-[hover=true]:bg-content1 data-[pressed=true]:bg-content1 data-[focus-visible=true]:outline-offset-1 lg:left-[calc(50%+1.414rem)] lg:top-[3.414rem]"
			>
				<FontAwesomeIcon icon={faInfo} className="text-xs" />
			</Button>
		</Tooltip>
	);
	const cardInfoAction =
		cardInfoActionContainer === undefined ||
		cardInfoActionContainer === null
			? null
			: createPortal(
					<GuestCardInfoAction
						onDefaultPress={handleDefaultPress}
						onSectionPress={handleSectionPress}
					/>,
					cardInfoActionContainer
				);

	return (
		<Fragment>
			{cardInfoActionContainer === undefined
				? iconButton
				: cardInfoAction}
			<CoordinatedModal
				coordination={coordination}
				isOpen={isOpened}
				onClose={handleClose}
			>
				<Accordion
					isCompact
					defaultExpandedKeys={initialExpandedKeys}
					disableAnimation={isReducedMotion}
					selectionMode="multiple"
					itemClasses={INFO_ACCORDION_ITEM_CLASSES}
				>
					{children}
				</Accordion>
			</CoordinatedModal>
		</Fragment>
	);
});
