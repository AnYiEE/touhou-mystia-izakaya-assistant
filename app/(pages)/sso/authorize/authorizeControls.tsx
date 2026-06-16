'use client';

import { useCallback, useState } from 'react';

import { Button } from '@/design/ui/components';

import { ServiceApiError, fetchServiceApi } from '@/lib/api/serviceClient';

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
				? '操作过于频繁，请稍后再试。'
				: `操作过于频繁，请 ${Math.ceil(error.retryAfter)} 秒后再试。`;
		}
		if (error.status === 0) {
			return '网络连接失败，请稍后重试。';
		}
	}

	return '授权请求无效或已失效，请从外部服务重新发起登录。';
}

export default function SsoAuthorizeControls({
	transactionId,
}: ISsoAuthorizeControlsProps) {
	const [message, setMessage] = useState<string | null>(null);
	const [submittingIntent, setSubmittingIntent] =
		useState<TSsoAuthorizeIntent | null>(null);

	const submit = useCallback(
		(intent: TSsoAuthorizeIntent) => {
			setMessage(null);
			setSubmittingIntent(intent);

			void fetchServiceApi<ISsoAuthorizeSubmitResponse>(
				'/api/v1/sso/authorize',
				{
					body: JSON.stringify({
						intent,
						transaction_id: transactionId,
					}),
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
				}
			)
				.then((result) => {
					globalThis.location.assign(result.redirect_url);
				})
				.catch((error: unknown) => {
					setMessage(createSubmitErrorMessage(error));
				})
				.finally(() => {
					setSubmittingIntent(null);
				});
		},
		[transactionId]
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
