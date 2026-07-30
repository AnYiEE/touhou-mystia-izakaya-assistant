import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { Accordion, type AccordionProps } from '@heroui/accordion';
import { Fragment, memo, useCallback, useEffect, useState } from 'react';

import FontAwesomeIconButton from '@/design/ui/components/fontAwesomeIconButton';
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
	onButtonPress?: () => void;
	overlayId: TOverlayId;
}

export default memo<IProps>(function InfoButtonBase({
	children,
	defaultExpandedKeys,
	onButtonPress,
	overlayId,
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

	return (
		<Fragment>
			<Tooltip showArrow content={buttonLabel} offset={4}>
				<FontAwesomeIconButton
					icon={faInfoCircle}
					variant="light"
					onPress={handlePress}
					aria-label={buttonLabel}
					className="absolute bottom-1 right-1 h-4 w-4 min-w-0 text-default-400 data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover data-[hover=true]:backdrop-blur-none data-[pressed=true]:backdrop-blur-none"
				/>
			</Tooltip>
			<SiteInfoBase
				baseUrl={PUBLIC_RUNTIME_CONFIG.baseURL}
				fontSize={7}
				className="absolute bottom-0 right-0"
				style={(name, fontSize) => ({
					transform: `rotate(-90deg) translateX(${fontSize * name.length - 17}px) translateY(20px)`,
				})}
			/>
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
