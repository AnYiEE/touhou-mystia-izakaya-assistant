import { faChevronRight, faInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Accordion, type AccordionProps } from '@heroui/accordion';
import { Fragment, memo, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import Button from '@/design/ui/components/button';
import SiteInfoBase from '@/design/ui/components/siteInfo';
import Tooltip from '@/design/ui/components/tooltip';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import { useParams } from '@/features/appShell/client/navigation/useParams';
import { CUSTOMER_INFO_QUERY_PARAM } from '@/features/catalog/customers/shared/navigation';
import {
	CoordinatedModal,
	requestOverlayClose,
} from '@/features/overlays/client';
import type { TOverlayId } from '@/features/overlays/contracts';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

export function SiteInfo() {
	return (
		<SiteInfoBase
			baseUrl={PUBLIC_RUNTIME_CONFIG.baseURL}
			fontSize={8}
			className="h-full text-right"
		/>
	);
}

export function CustomerCardSiteInfo() {
	return (
		<SiteInfoBase
			baseUrl={PUBLIC_RUNTIME_CONFIG.baseURL}
			fontSize={7}
			className="absolute -bottom-[18px] right-px"
			style={(name, fontSize) => ({
				transform: `rotate(-90deg) translateX(${fontSize * name.length - 17}px) translateY(20px)`,
			})}
		/>
	);
}

interface IInfoSectionTitleProps {
	title: string;
}

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
	desktopTriggerContainer?: HTMLElement | null;
	onButtonPress?: () => void;
	overlayId: TOverlayId;
	showMobileTextTrigger?: boolean;
}

export default memo<IProps>(function InfoButtonBase({
	children,
	defaultExpandedKeys,
	desktopTriggerContainer,
	onButtonPress,
	overlayId,
	showMobileTextTrigger = false,
}) {
	const isReducedMotion = useReducedMotion();
	const { params, replaceState } = useParams();
	const [isOpened, setOpened] = useState(false);
	const vibrate = useVibrate();

	const handleClose = useCallback(() => {
		vibrate();
		setOpened(false);
		requestOverlayClose(overlayId);

		const newParams = new URLSearchParams(params);
		newParams.delete(CUSTOMER_INFO_QUERY_PARAM);
		replaceState(newParams);
	}, [overlayId, params, replaceState, vibrate]);

	const handlePress = useCallback(() => {
		vibrate();
		setOpened(true);
		onButtonPress?.();

		const newParams = new URLSearchParams(params);
		newParams.set(CUSTOMER_INFO_QUERY_PARAM, '');
		replaceState(newParams);
	}, [onButtonPress, params, replaceState, vibrate]);

	useEffect(() => {
		setOpened(params.has(CUSTOMER_INFO_QUERY_PARAM));
	}, [params]);

	const buttonLabel = '更多信息';
	const iconButton = (
		<Tooltip showArrow content="查看更多资料" offset={1} size="sm">
			<Button
				isIconOnly
				size="sm"
				variant="light"
				onPress={handlePress}
				aria-label={buttonLabel}
				data-customer-info-trigger="desktop"
				className="absolute left-[calc(50%+1.15rem)] top-[2.375rem] z-10 h-5 w-5 min-w-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-default/40 bg-content1/95 p-0 text-default-700 shadow-small data-[hover=true]:border-primary data-[pressed=true]:border-primary data-[hover=true]:bg-content1 data-[pressed=true]:bg-content1 data-[focus-visible=true]:outline-offset-1 lg:left-[calc(50%+1.414rem)] lg:top-[3.414rem]"
			>
				<FontAwesomeIcon icon={faInfo} className="text-xs" />
			</Button>
		</Tooltip>
	);
	const desktopIconButton = (
		<span className="hidden md:contents">{iconButton}</span>
	);
	const resolvedDesktopIconButton =
		desktopTriggerContainer === undefined
			? desktopIconButton
			: desktopTriggerContainer === null
				? null
				: createPortal(desktopIconButton, desktopTriggerContainer);

	return (
		<Fragment>
			{showMobileTextTrigger ? (
				<>
					<Button
						size="sm"
						variant="light"
						onPress={handlePress}
						aria-label={buttonLabel}
						data-customer-info-trigger="mobile"
						className="ml-auto h-5 w-auto min-w-0 gap-0 rounded-small bg-transparent px-0 text-tiny font-medium text-default-800 data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent md:hidden"
					>
						<span>{buttonLabel}</span>
						<FontAwesomeIcon
							icon={faChevronRight}
							className="w-1.5 text-[0.625rem]"
						/>
					</Button>
					{resolvedDesktopIconButton}
				</>
			) : (
				iconButton
			)}
			<CoordinatedModal
				coordination={{ id: overlayId }}
				isOpen={isOpened}
				onClose={handleClose}
			>
				<Accordion
					isCompact
					defaultExpandedKeys={defaultExpandedKeys ?? []}
					disableAnimation={isReducedMotion}
					selectionMode="multiple"
					itemClasses={{
						base: 'mb-1 mt-3',
						title: 'text-xl font-bold',
						trigger: 'p-0',
					}}
				>
					{children}
				</Accordion>
			</CoordinatedModal>
		</Fragment>
	);
});
