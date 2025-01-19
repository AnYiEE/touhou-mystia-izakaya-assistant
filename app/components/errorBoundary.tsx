'use client';

import {Component, type ErrorInfo, type PropsWithChildren} from 'react';

import {trackEvent} from '@/components/analytics';

import {siteConfig} from '@/configs';

const {links} = siteConfig;

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

	private handleClick(shouldClear: boolean) {
		if (shouldClear) {
			try {
				localStorage.clear();
			} catch (error) {
				console.error(error);
				alert(error);
			}
		}
		location.reload();
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
		trackEvent(trackEvent.category.Error, 'Global', message);
	}

	public override render() {
		if (this.state.hasError) {
			return (
				<div className="space-y-3 p-4">
					<h1 className="text-2xl font-bold">出错啦！以下是错误信息：</h1>
					<p className="text-large">{this.state.error?.toString()}</p>
					<pre className="space-y-2 whitespace-pre-wrap break-all font-mono">
						<code>{this.state.error?.stack}</code>
						<code>{this.state.info?.componentStack}</code>
					</pre>
					<button
						className="mx-auto block w-1/2 cursor-pointer rounded-medium bg-content1 p-2 transition-background hover:bg-content2 motion-reduce:transition-none"
						onClick={this.handleClick.bind(this, false)}
					>
						点此重试（仅刷新页面）
					</button>
					<button
						className="mx-auto block w-1/2 cursor-pointer rounded-medium bg-content1 p-2 transition-background hover:bg-content2 motion-reduce:transition-none"
						onClick={this.handleClick.bind(this, true)}
					>
						点此重试（将清空已保存的数据）
					</button>
					<p className="text-center text-small">
						请完整复制或截图上方的错误信息，
						<a
							href={links.qqGroup.href}
							referrerPolicy="same-origin"
							target="_blank"
							className="font-medium text-primary hover:underline hover:underline-offset-2"
						>
							{links.qqGroup.label}
						</a>
						以反馈问题。
					</p>
				</div>
			);
		}

		return this.props.children;
	}
}
