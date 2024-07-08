'use client';

import {Component, type ErrorInfo, type PropsWithChildren} from 'react';

interface IState {
	error: Error | null;
	info: ErrorInfo | null;
	hasError: boolean;
}

interface IProps extends PropsWithChildren<object> {}

export default class ErrorBoundary extends Component<IProps, IState> {
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
					<h1 className="text-2xl font-bold">Oops, something went wrong!</h1>
					<p className="text-lg">{this.state.error?.toString()}</p>
					<pre className="flex flex-col gap-2 text-wrap break-all font-mono">
						<code>{this.state.error?.stack}</code>
						<code>{this.state.info?.componentStack}</code>
					</pre>
					<button
						className="cursor-pointer bg-content1 p-2 hover:bg-content2"
						onClick={this.handleClick.bind(this)}
					>
						Click here to reset local storage and reload the page.
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}
