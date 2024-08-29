'use client';

import {Component, type ErrorInfo, type PropsWithChildren} from 'react';

import {TrackCategory, trackEvent} from '@/components/analytics';

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

	private handleClick(clear: boolean) {
		if (clear) {
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
		trackEvent(TrackCategory.Error, 'Global', message);
	}

	public override render() {
		if (this.state.hasError) {
			return (
				<div className="m-4 space-y-3">
					<h1 className="text-2xl font-bold">出错啦！以下是错误信息：</h1>
					<p className="text-lg">{this.state.error?.toString()}</p>
					<pre className="space-y-2 whitespace-pre-wrap break-all font-mono">
						<code>{this.state.error?.stack}</code>
						<code>{this.state.info?.componentStack}</code>
					</pre>
					<button
						className="mx-auto block w-1/2 cursor-pointer rounded-md bg-content1 p-2 hover:bg-content2"
						onClick={this.handleClick.bind(this, false)}
					>
						点此重试（仅刷新页面）
					</button>
					<button
						className="mx-auto block w-1/2 cursor-pointer rounded-md bg-content1 p-2 hover:bg-content2"
						onClick={this.handleClick.bind(this, true)}
					>
						点此重试（将清空已保存的数据）
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}
