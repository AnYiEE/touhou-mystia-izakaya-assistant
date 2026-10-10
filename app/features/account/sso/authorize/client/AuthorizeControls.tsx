'use client';

import { useCallback, useRef, useState } from 'react';

import Button from '@/design/ui/components/button';

import {
	type TAccountTranslate,
	accountMessages,
} from '@/features/account/client/messages';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { fetchServiceApi } from '@/infrastructure/http/client/fetchServiceApi';
import { ServiceApiError } from '@/infrastructure/http/client/serviceApiError';
import { FILE_TYPE_JSON } from '@/infrastructure/http/mediaTypes';

import { useI18n } from '@/shared/i18n/useI18n';

type TSsoAuthorizeIntent = 'agree' | 'cancel';

interface ISsoAuthorizeSubmitResponse {
	redirect_url: string;
}

interface ISsoAuthorizeControlsProps {
	transactionId: string;
}

function createSubmitErrorMessage(error: unknown, t: TAccountTranslate) {
	if (error instanceof ServiceApiError) {
		if (error.status === 429) {
			return error.retryAfter === null
				? t('account.sso.status.rateLimited')
				: t('account.sso.status.rateLimitedWithDelay', {
						seconds: Math.ceil(error.retryAfter),
					});
		}
		if (error.status === 0) {
			return t('account.sso.status.networkFailed');
		}
	}

	return t('account.sso.status.invalidRequest');
}

export default function SsoAuthorizeControls({
	transactionId,
}: ISsoAuthorizeControlsProps) {
	const vibrate = useVibrate();
	const { t } = useI18n(accountMessages);

	const [message, setMessage] = useState<string | null>(null);
	const [submittingIntent, setSubmittingIntent] =
		useState<TSsoAuthorizeIntent | null>(null);
	const submitInFlightRef = useRef(false);

	const submit = useCallback(
		(intent: TSsoAuthorizeIntent) => {
			if (submitInFlightRef.current) {
				return;
			}

			vibrate();
			submitInFlightRef.current = true;

			trackEvent(
				trackEvent.category.click,
				'SSO Authorize Button',
				intent === 'agree' ? 'Agree' : 'Cancel'
			);

			setMessage(null);
			setSubmittingIntent(intent);

			void fetchServiceApi<ISsoAuthorizeSubmitResponse>(
				'/api/v1/sso/authorize',
				{
					body: JSON.stringify({
						intent,
						transaction_id: transactionId,
					}),
					headers: { 'Content-Type': FILE_TYPE_JSON },
					method: 'POST',
				}
			)
				.then((result) => {
					location.assign(result.redirect_url);
				})
				.catch((error: unknown) => {
					trackEvent(
						trackEvent.category.error,
						'SSO',
						'Authorize Submit',
						error instanceof ServiceApiError
							? error.status
							: undefined
					);
					setMessage(createSubmitErrorMessage(error, t));
				})
				.finally(() => {
					submitInFlightRef.current = false;
					setSubmittingIntent(null);
				});
		},
		[t, transactionId, vibrate]
	);

	return (
		<div className="space-y-3 border-t border-default-200/80 pt-4">
			<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<Button
					color="primary"
					className="sm:min-w-32"
					isDisabled={submittingIntent !== null}
					isLoading={submittingIntent === 'agree'}
					type="button"
					variant="flat"
					onPress={() => {
						submit('agree');
					}}
				>
					{t('account.sso.agreeAction')}
				</Button>
				<Button
					className="sm:min-w-24"
					isDisabled={submittingIntent !== null}
					isLoading={submittingIntent === 'cancel'}
					type="button"
					variant="flat"
					onPress={() => {
						submit('cancel');
					}}
				>
					{t('account.sso.cancelAction')}
				</Button>
			</div>
			{message === null ? null : (
				<p className="rounded-small bg-danger/10 px-3 py-2 text-small leading-6 text-danger-700 dark:text-danger">
					{message}
				</p>
			)}
		</div>
	);
}
