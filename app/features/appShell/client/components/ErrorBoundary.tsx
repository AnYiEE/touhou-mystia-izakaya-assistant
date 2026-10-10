'use client';

import {
	Component,
	type ErrorInfo,
	type PropsWithChildren,
	memo,
	useCallback,
	useMemo,
} from 'react';

import {
	trackEvent,
	trackEventWithoutInteractionCount,
} from '@/features/analytics/client/trackEvent';
import {
	type TAppShellMessageKey,
	appShellMessages,
} from '@/features/appShell/client/messages';
import { SITE_LINKS } from '@/features/appShell/links';
import {
	readLocaleMirrorPreference,
	resolveEffectiveLocale,
} from '@/features/preferences/client/state/localeMirror';
import { clearSavedLocalDataBeforeReload } from '@/features/recommendations/client/cache/clearSavedData';

import { DEFAULT_LOCALE, type TLocale } from '@/shared/i18n/locale';
import { type TMessageParams, translate } from '@/shared/i18n/messages';

const links = SITE_LINKS;

function resolveErrorLocale(): TLocale {
	const preference = readLocaleMirrorPreference();
	return preference === null
		? DEFAULT_LOCALE
		: resolveEffectiveLocale(preference);
}

interface IErrorFallbackProps {
	error: Error | null;
	info?: ErrorInfo | null;
}

export const ErrorFallback = memo<IErrorFallbackProps>(function ErrorFallback({
	error,
	info,
}) {
	const locale = useMemo(resolveErrorLocale, []);
	const t = useCallback(
		(key: TAppShellMessageKey, params?: TMessageParams) =>
			translate(appShellMessages, locale, key, params),
		[locale]
	);
	const handleButtonPress = useCallback(async (shouldClear: boolean) => {
		if (shouldClear) {
			await clearSavedLocalDataBeforeReload();
		}
		const trackRetryEvent = shouldClear
			? trackEventWithoutInteractionCount
			: trackEvent;
		trackRetryEvent(
			trackRetryEvent.category.click,
			'Error Button',
			shouldClear ? 'Retry and clear' : 'Retry'
		);
		location.reload();
	}, []);

	const Button = useCallback(
		({
			children,
			shouldClear = false,
		}: PropsWithChildren<{ shouldClear?: boolean }>) => (
			<button
				className="mx-auto block w-1/2 cursor-pointer rounded-medium bg-content1 p-2 transition-background hover:bg-content2 active:bg-content2 motion-reduce:transition-none"
				onClick={() => {
					void handleButtonPress(shouldClear);
				}}
			>
				{children}
			</button>
		),
		[handleButtonPress]
	);

	const handleLinkPress = useCallback((number: number) => {
		trackEvent(
			trackEvent.category.click,
			'Link',
			`error:QQ group ${number}`
		);
	}, []);

	return (
		<div className="space-y-3 p-4">
			<h1 className="text-2xl font-bold">{t('appShell.error.title')}</h1>
			<p className="text-large">{error?.toString()}</p>
			<pre className="space-y-2 whitespace-pre-wrap break-all font-mono">
				<code>{error?.stack}</code>
				<code>{info?.componentStack}</code>
			</pre>
			<Button>{t('appShell.error.retry')}</Button>
			<Button shouldClear>{t('appShell.error.retryAndClear')}</Button>
			<p className="text-center text-small">
				{t('appShell.error.feedbackPrefix')}
				<a
					href={links.qqGroup1.href}
					referrerPolicy="same-origin"
					target="_blank"
					onClick={() => {
						handleLinkPress(1);
					}}
					className="font-medium text-primary hover:underline hover:underline-offset-2 active:underline active:underline-offset-2"
				>
					{t('appShell.links.qqGroup1')}
				</a>
				{t('appShell.error.feedbackMiddle')}
				<a
					href={links.qqGroup2.href}
					referrerPolicy="same-origin"
					target="_blank"
					onClick={() => {
						handleLinkPress(2);
					}}
					className="font-medium text-primary hover:underline hover:underline-offset-2 active:underline active:underline-offset-2"
				>
					{t('appShell.links.qqGroup2')}
				</a>
				{t('appShell.error.feedbackSuffix')}
			</p>
		</div>
	);
});

interface IStates {
	error: Error | null;
	hasError: boolean;
	info: ErrorInfo | null;
}

interface IProps extends PropsWithChildren<object> {}

export default class ErrorBoundary extends Component<IProps, IStates> {
	public constructor(props: IProps) {
		super(props);

		this.state = { error: null, hasError: false, info: null };
	}

	static getDerivedStateFromError(error: Error) {
		return { error, hasError: true };
	}

	public override componentDidCatch({ message }: Error, info: ErrorInfo) {
		this.setState({ info });
		trackEvent(trackEvent.category.error, 'Global', message);
	}

	public override render() {
		if (this.state.hasError) {
			return (
				<ErrorFallback
					error={this.state.error}
					info={this.state.info}
				/>
			);
		}

		return this.props.children;
	}
}
