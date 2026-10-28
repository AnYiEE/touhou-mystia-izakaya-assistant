'use client';

import { cn } from '@heroui/theme';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button, { type IButtonProps } from '@/design/ui/components/button';
import { useBreakpoint } from '@/design/ui/hooks/useBreakpoint';
import { MOTION_DURATION_MS } from '@/design/ui/motion';

import {
	ItemPopover,
	ItemPopoverContent,
	ItemPopoverTrigger,
} from '@/features/catalog/shared/client/components/ItemPopover';
import FeatureAccessNotice from '@/features/featureAccess/client/components/FeatureAccessNotice';
import { useMapAccess } from '@/features/maps/client/components/MapAccessContext';
import { mapsMessages } from '@/features/maps/client/messages';
import {
	MAP_POPOVER_CONTAINER_PADDING,
	MAP_POPOVER_CONTENT_MAX_WIDTH_CLASS_NAME,
	MAP_POPOVER_CONTENT_WIDTH_CLASS_NAME,
	MAP_POPOVER_SIDE_PLACEMENT_MIN_WIDTH,
	getMapSurfaceClassName,
} from '@/features/maps/client/model/mapStyles';

import { useI18n } from '@/shared/i18n/useI18n';

interface IProps extends Omit<IButtonProps, 'onPress'> {
	autoOpenRequest?: number | null;
	onAllowed: () => void;
	onAutoOpen?: () => void;
	onPopoverOpenChange?: (isOpen: boolean) => void;
}

export default memo<IProps>(function MapFullAccessButton({
	autoOpenRequest,
	onAllowed,
	onAutoOpen,
	onPopoverOpenChange,
	...props
}) {
	const { breakpoint: placement } = useBreakpoint(
		{ right: MAP_POPOVER_SIDE_PLACEMENT_MIN_WIDTH, top: -1 },
		'top'
	);
	const { isHighAppearance } = useDesignPreferences();
	const { t } = useI18n(mapsMessages);
	const {
		cancelAccessRequest,
		fullReason,
		markAccountModalOrigin,
		policy,
		requestAccess,
	} = useMapAccess();

	const isPopoverOpenRef = useRef(false);
	const isOpeningAccountModalRef = useRef(false);
	const lastAutoOpenRequestRef = useRef<number | null>(null);
	const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const onPopoverOpenChangeRef = useRef(onPopoverOpenChange);
	onPopoverOpenChangeRef.current = onPopoverOpenChange;

	const [isOpen, setIsOpen] = useState(false);

	const classNames = useMemo(
		() => ({
			content: cn(
				getMapSurfaceClassName(isHighAppearance),
				MAP_POPOVER_CONTENT_MAX_WIDTH_CLASS_NAME
			),
		}),
		[isHighAppearance]
	);

	const handleBlockedPress = useCallback(() => {
		requestAccess({ moduleKey: 'maps.full', onAllowed });
	}, [onAllowed, requestAccess]);

	const handlePopoverOpenChange = useCallback(
		(isOpen: boolean) => {
			setIsOpen(isOpen);
			isPopoverOpenRef.current = isOpen;
			if (isOpen) {
				if (closeTimerRef.current !== null) {
					clearTimeout(closeTimerRef.current);
					closeTimerRef.current = null;
				}
				onPopoverOpenChange?.(true);
				return;
			}

			if (!isOpeningAccountModalRef.current) {
				cancelAccessRequest();
			}
			closeTimerRef.current = setTimeout(() => {
				closeTimerRef.current = null;
				if (!isPopoverOpenRef.current) {
					onPopoverOpenChange?.(false);
				}
			}, MOTION_DURATION_MS.fast + 50);
		},
		[cancelAccessRequest, onPopoverOpenChange]
	);

	const handleAccessLogin = useCallback(() => {
		markAccountModalOrigin();
		isOpeningAccountModalRef.current = true;
		setIsOpen(false);
		handlePopoverOpenChange(false);
		setTimeout(() => {
			isOpeningAccountModalRef.current = false;
		}, 250);
	}, [handlePopoverOpenChange, markAccountModalOrigin]);

	useEffect(() => {
		if (
			autoOpenRequest === null ||
			autoOpenRequest === undefined ||
			policy.mode === 'full' ||
			autoOpenRequest === lastAutoOpenRequestRef.current
		) {
			return;
		}
		lastAutoOpenRequestRef.current = autoOpenRequest;
		handleBlockedPress();
		handlePopoverOpenChange(true);
		onAutoOpen?.();
	}, [
		autoOpenRequest,
		handleBlockedPress,
		handlePopoverOpenChange,
		onAutoOpen,
		policy.mode,
	]);

	useEffect(
		() => () => {
			if (closeTimerRef.current !== null) {
				clearTimeout(closeTimerRef.current);
			}
			const shouldReportClosed =
				isPopoverOpenRef.current || closeTimerRef.current !== null;
			isPopoverOpenRef.current = false;
			if (shouldReportClosed) {
				onPopoverOpenChangeRef.current?.(false);
			}
		},
		[]
	);

	if (policy.mode === 'full') {
		return <Button {...props} onPress={onAllowed} />;
	}

	return (
		<span className={props.fullWidth ? 'block w-full' : 'inline-flex'}>
			<ItemPopover
				containerPadding={MAP_POPOVER_CONTAINER_PADDING}
				showArrow
				isOpen={isOpen}
				classNames={classNames}
				placement={placement}
				onOpenChange={handlePopoverOpenChange}
			>
				<ItemPopoverTrigger shouldStyleExpandedState={false}>
					<Button {...props} onClickEvent={handleBlockedPress} />
				</ItemPopoverTrigger>
				<ItemPopoverContent>
					<div
						className={cn(
							MAP_POPOVER_CONTENT_WIDTH_CLASS_NAME,
							'p-3'
						)}
					>
						<div className="space-y-2 text-tiny leading-5 text-foreground-500">
							{(fullReason ?? 'unavailable') ===
								'login-required' && (
								<p className="font-medium text-foreground-700">
									{t('maps.access.title')}
								</p>
							)}
							<p>{t('maps.access.body')}</p>
							<FeatureAccessNotice
								className="rounded-small border border-default-200/60 bg-default-50/30 p-2 text-tiny dark:border-white/10 dark:bg-white/[0.07] dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.06),0_8px_20px_rgb(0_0_0_/_0.14)]"
								isActionFullWidth
								moduleKey="maps.full"
								onLoginPress={handleAccessLogin}
								reasonOverride={fullReason ?? 'unavailable'}
								showBody={fullReason !== 'login-required'}
							/>
						</div>
					</div>
				</ItemPopoverContent>
			</ItemPopover>
		</span>
	);
});
