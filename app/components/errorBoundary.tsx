'use client';

import {Component, type ErrorInfo, type PropsWithChildren, memo, useCallback} from 'react';

import {trackEvent} from '@/components/analytics';

import {siteConfig} from '@/configs';

const {links} = siteConfig;

interface IErrorFallbackProps {
	error: Error | null;
	info?: ErrorInfo | null;
}

export const ErrorFallback = memo<IErrorFallbackProps>(function ErrorFallback({error, info}) {
	const handleClick = useCallback((shouldClear: boolean) => {
		if (shouldClear) {
			try {
				localStorage.clear();
			} catch (storageError) {
				console.error(storageError);
				alert(storageError);
			}
		}
		location.reload();
	}, []);

	const Button = useCallback(
		({
			children,
			shouldClear = false,
		}: PropsWithChildren<{
			shouldClear?: boolean;
		}>) => (
			<button
				className="mx-auto block w-1/2 cursor-pointer rounded-medium bg-content1 p-2 transition-background hover:bg-content2 motion-reduce:transition-none"
				onClick={() => {
					handleClick(shouldClear);
				}}
			>
				{children}
			</button>
		),
		[handleClick]
	);

	return (
		<div className="space-y-3 p-4">
			<h1 className="text-2xl font-bold">出错啦！以下是错误信息：</h1>
			<p className="text-large">{error?.toString()}</p>
			<pre className="space-y-2 whitespace-pre-wrap break-all font-mono">
				<code>{error?.stack}</code>
				<code>{info?.componentStack}</code>
			</pre>
			<Button>点此重试（仅刷新页面）</Button>
			<Button shouldClear>点此重试（将清空已保存的数据）</Button>
			<p className="text-center text-small">
				请完整复制或截图上方的错误信息， 点击加入
				<a
					href={links.qqGroup1.href}
					referrerPolicy="same-origin"
					target="_blank"
					className="font-medium text-primary hover:underline hover:underline-offset-2"
				>
					{links.qqGroup1.label}
				</a>
				或
				<a
					href={links.qqGroup2.href}
					referrerPolicy="same-origin"
					target="_blank"
					className="font-medium text-primary hover:underline hover:underline-offset-2"
				>
					{links.qqGroup2.label}
				</a>
				以反馈问题。
			</p>
		</div>
	);
});

interface IStates {
	error: Error | null;
	info: ErrorInfo | null;
	hasError: boolean;
}

interface IProps extends PropsWithChildren<object> {}

export default class ErrorBoundary extends Component<IProps, IStates> {
	public constructor(props: IProps) {
		super(props);

		this.state = {
			error: null,
			hasError: false,
			info: null,
		};
	}

	static getDerivedStateFromError(error: Error) {
		return {
			error,
			hasError: true,
		};
	}

	public override componentDidCatch({message}: Error, info: ErrorInfo) {
		if (!this.state.hasError) {
			this.setState({
				info,
			});
		}
		trackEvent(trackEvent.category.error, 'Global', message);
	}

	public override render() {
		if (this.state.hasError) {
			return <ErrorFallback error={this.state.error} info={this.state.info} />;
		}

		return this.props.children;
	}
}
