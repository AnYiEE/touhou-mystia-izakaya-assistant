'use client';

import {Component, type ErrorInfo, type PropsWithChildren} from 'react';

interface IErrorBoundaryState {
	error: Error | null;
	info: ErrorInfo | null;
	hasError: boolean;
}

interface IProps extends PropsWithChildren<object> {}

export default class ErrorBoundary extends Component<IProps, IErrorBoundaryState> {
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
				<div>
					<h2 style={{all: 'revert'}}>Oops, something went wrong!</h2>
					<pre style={{all: 'revert', margin: '2rem 0'}}>
						<code>{this.state.error?.toString()}</code>
						<code>{this.state.info?.componentStack}</code>
					</pre>
					<button onClick={this.handleClick.bind(this)} style={{all: 'revert', cursor: 'pointer'}}>
						Click here to reset local storage and reload the page.
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}
