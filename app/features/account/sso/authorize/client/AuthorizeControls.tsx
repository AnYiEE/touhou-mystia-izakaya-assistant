'use client';

import { useCallback, useRef, useState } from 'react';

import Button from '@/design/ui/components/button';

import {
	SSO_AUTHORIZE_MESSAGE_MAP,
	createSsoAuthorizeRateLimitedMessage,
} from '@/features/account/sso/authorize/copy';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { fetchServiceApi } from '@/infrastructure/http/client/fetchServiceApi';
import { ServiceApiError } from '@/infrastructure/http/client/serviceApiError';
import { FILE_TYPE_JSON } from '@/infrastructure/http/mediaTypes';

type TSsoAuthorizeIntent = 'agree' | 'cancel';

interface ISsoAuthorizeSubmitResponse {
	redirect_url: string;
}

interface ISsoAuthorizeControlsProps {
	transactionId: string;
}

function createSubmitErrorMessage(error: unknown) {
	if (error instanceof ServiceApiError) {
		if (error.status === 429) {
			return error.retryAfter === null
				? SSO_AUTHORIZE_MESSAGE_MAP.rateLimited
				: createSsoAuthorizeRateLimitedMessage(error.retryAfter);
		}
		if (error.status === 0) {
			return SSO_AUTHORIZE_MESSAGE_MAP.networkFailed;
		}
	}

	return SSO_AUTHORIZE_MESSAGE_MAP.invalidRequest;
}

export default function SsoAuthorizeControls({
	transactionId,
}: ISsoAuthorizeControlsProps) {
	const vibrate = useVibrate();

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
					setMessage(createSubmitErrorMessage(error));
				})
				.finally(() => {
					submitInFlightRef.current = false;
					setSubmittingIntent(null);
				});
		},
		[transactionId, vibrate]
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
					同意并继续
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
					取消
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
