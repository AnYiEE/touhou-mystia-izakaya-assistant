'use client';

import { faHeart, faRightToBracket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { memo, useCallback } from 'react';

import Button from '@/design/ui/components/button';
import Heading from '@/design/ui/components/heading';

import {
	type TFeatureAccessReason,
	type TFeatureModuleKey,
	isSsoAppFeatureModuleKey,
} from '@/domain/featureAccess/contracts';

import { useAccountLoginRequiredAction } from '@/features/account/client/hooks/useAccountLoginRequiredAction';
import { requestDonationModalOpen } from '@/features/donations/client/requestDonationModalOpen';
import { useFeatureModuleAccess } from '@/features/featureAccess/client/useFeatureModuleAccess';
import {
	type TFeatureAccessMessageKey,
	featureAccessMessages,
} from '@/features/featureAccess/messages';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { useI18n } from '@/shared/i18n/useI18n';

const REASON_MESSAGE_KEYS = {
	denied: {
		body: 'featureAccess.body.denied',
		title: 'featureAccess.title.denied',
	},
	'grant-required': {
		body: 'featureAccess.body.grantRequired',
		title: 'featureAccess.title.grantRequired',
	},
	'login-required': {
		body: 'featureAccess.body.loginRequired',
		title: 'featureAccess.title.loginRequired',
	},
	unavailable: {
		body: 'featureAccess.body.unavailable',
		title: 'featureAccess.title.unavailable',
	},
} as const satisfies Record<
	Exclude<TFeatureAccessReason, 'allowed'>,
	{ body: TFeatureAccessMessageKey; title: TFeatureAccessMessageKey }
>;

function checkDisplayReason(
	reason: TFeatureAccessReason
): reason is Exclude<TFeatureAccessReason, 'allowed'> {
	return reason !== 'allowed';
}

interface IProps {
	className?: string;
	featureName?: string;
	isActionFullWidth?: boolean;
	moduleKey: TFeatureModuleKey;
	onLoginPress?: () => void;
	onRetry?: () => void;
	reasonOverride?: Exclude<TFeatureAccessReason, 'allowed'>;
	showBody?: boolean;
	showTitle?: boolean;
}

export default memo<IProps>(function FeatureAccessNotice({
	className,
	featureName,
	isActionFullWidth,
	moduleKey,
	onLoginPress,
	onRetry,
	reasonOverride,
	showBody,
	showTitle,
}: IProps) {
	const { t } = useI18n(featureAccessMessages);
	const access = useFeatureModuleAccess(moduleKey);
	const { allowed, isLoading, reason, refresh } = access;
	const displayReason = reasonOverride ?? reason;

	const handleRefresh = useCallback(() => {
		void refresh().catch(() => {});
	}, [refresh]);

	const handleLogin = useAccountLoginRequiredAction();
	const vibrate = useVibrate();

	const handlePromptLogin = useCallback(() => {
		onLoginPress?.();
		handleLogin();
	}, [handleLogin, onLoginPress]);

	const handleDonate = useCallback(() => {
		vibrate();
		void requestDonationModalOpen('manual');
	}, [vibrate]);

	if (
		(reasonOverride === undefined && (isLoading || allowed)) ||
		displayReason === null ||
		!checkDisplayReason(displayReason)
	) {
		return null;
	}

	const messages = REASON_MESSAGE_KEYS[displayReason];
	const resolvedFeatureName =
		featureName ??
		(moduleKey === 'account.sync'
			? t('featureAccess.module.accountSync.label')
			: moduleKey === 'maps.full'
				? t('featureAccess.module.mapsFull.label')
				: moduleKey === 'maps.preview'
					? t('featureAccess.module.mapsPreview.label')
					: moduleKey === 'sso.use'
						? t('featureAccess.module.ssoUse.label')
						: isSsoAppFeatureModuleKey(moduleKey)
							? t('featureAccess.module.ssoApp.fallbackLabel')
							: t('featureAccess.label.fallbackFeature'));
	const shouldShowTitle = showTitle ?? false;
	const shouldShowBody = showBody ?? true;
	const shouldShowDonationAction =
		displayReason === 'login-required' &&
		(moduleKey === 'maps.full' || moduleKey === 'maps.preview');
	const shouldUseFullWidthAction =
		Boolean(isActionFullWidth) || shouldShowDonationAction;
	const action =
		displayReason === 'login-required'
			? {
					label: t('featureAccess.action.login'),
					onPress: handlePromptLogin,
				}
			: displayReason === 'unavailable'
				? {
						label: t('featureAccess.action.retry'),
						onPress: onRetry ?? handleRefresh,
					}
				: null;

	return (
		<div
			role="status"
			className={
				shouldShowBody
					? (className ??
						'rounded-medium border border-warning/40 bg-warning/5 p-3 text-small')
					: 'flex flex-wrap gap-2'
			}
		>
			{shouldShowTitle && (
				<Heading as="h3" isFirst className="!mb-2 !mt-0">
					{t(messages.title, { feature: resolvedFeatureName })}
				</Heading>
			)}
			{shouldShowBody && (
				<p className="leading-5 text-foreground-600">
					{t(messages.body, { feature: resolvedFeatureName })}
				</p>
			)}
			{action !== null && (
				<div
					className={cn(
						shouldShowBody ? 'mt-3' : 'mt-2',
						shouldShowDonationAction
							? 'grid w-full grid-cols-3 gap-2'
							: cn(
									'flex flex-wrap gap-2',
									isActionFullWidth && 'w-full'
								)
					)}
				>
					{shouldShowDonationAction && (
						<Button
							color="secondary"
							fullWidth
							size="sm"
							startContent={<FontAwesomeIcon icon={faHeart} />}
							variant="flat"
							onPress={handleDonate}
							className="!w-full"
						>
							{t('featureAccess.action.donate')}
						</Button>
					)}
					<Button
						color="primary"
						fullWidth={shouldUseFullWidthAction}
						size="sm"
						startContent={
							displayReason === 'login-required' ? (
								<FontAwesomeIcon icon={faRightToBracket} />
							) : undefined
						}
						variant="flat"
						onPress={action.onPress}
						className={cn(
							shouldShowDonationAction && 'col-span-2',
							shouldUseFullWidthAction && '!w-full'
						)}
					>
						{action.label}
					</Button>
				</div>
			)}
		</div>
	);
});
