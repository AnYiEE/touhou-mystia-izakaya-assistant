'use client';

import {Component, type ErrorInfo, type PropsWithChildren} from 'react';

interface IStates {
	error: Error | null;
	info: ErrorInfo | null;
	hasError: boolean;
}

interface IProps extends PropsWithChildren<object> {}

export default class ErrorBoundary extends Component<IProps, IStates> {
	public constructor(props: IProps) {
		super(props);

		this.state = {error: null, hasError: false, info: null};
	}

	private handleClick() {
		try {
			localStorage.clear();
		} finally {
			location.reload();
		}
	}

	static getDerivedStateFromError(error: Error) {
		return {
			error,
			hasError: true,
		};
	}

	public override componentDidCatch(_error: Error, info: ErrorInfo) {
		if (!this.state.hasError) {
			this.setState({
				info,
			});
		}
	}

	public override render() {
		if (this.state.hasError) {
			return (
				<div className="m-4 flex flex-col gap-3">
					<h1 className="text-2xl font-bold">出错啦！以下是错误信息：</h1>
					<p className="text-lg">{this.state.error?.toString()}</p>
					<pre className="flex flex-col gap-2 whitespace-pre-wrap break-all font-mono">
						<code>{this.state.error?.stack}</code>
						<code>{this.state.info?.componentStack}</code>
					</pre>
					<button
						className="cursor-pointer bg-content1 p-2 hover:bg-content2"
						onClick={this.handleClick.bind(this)}
					>
						点此重试（将清空已保存的数据）
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}
