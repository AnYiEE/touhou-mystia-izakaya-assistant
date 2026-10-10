/* eslint-disable func-names, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, require-unicode-regexp */
// @ts-nocheck

const script = (messages: {
	errorTemplate: string;
	storageWarning: string;
}) => {
	const applyTemplate = (
		template: string,
		values: Record<string, string>
	) => {
		let result = template;
		for (const key of Object.keys(values)) {
			result = result.split(`{${key}}`).join(values[key]);
		}
		return result;
	};

	/**
	 * @description Add `globalThis` polyfill for Chrome < 71.
	 * @see {@link https://mathiasbynens.be/notes/globalthis}
	 */
	if (typeof globalThis !== 'object') {
		Object.prototype.__defineGetter__('__magic__', function () {
			return this;
		});
		__magic__.globalThis = __magic__;
		delete Object.prototype.__magic__;
	}

	/**
	 * @description Add `queueMicrotask` polyfill for Chrome < 71.
	 */
	if (typeof queueMicrotask !== 'function') {
		const promise = Promise.resolve();
		globalThis.queueMicrotask = (callback) => {
			promise.then(callback).catch((error: unknown) => {
				setTimeout(() => {
					throw error;
				}, 0);
			});
		};
	}

	/**
	 * @description Remove the <meta> tag added by the Quark browser, it disrupts hydration.
	 */ // cSpell:ignore lowpri
	const targetNode = document.head.querySelector(
		'meta[name="wpk-bid_lowpri"]'
	);
	if (targetNode !== null) {
		targetNode.remove();
		for (const node of document.head.childNodes) {
			if (
				node.nodeType === Node.TEXT_NODE &&
				node.textContent.trim() === ''
			) {
				node.remove();
				break;
			}
		}
	}

	/**
	 * @description Global sync error handler for non-network errors.
	 */
	globalThis.addEventListener('error', (event) => {
		const { colno, error, filename, lineno, message } = event;
		const errorStack =
			error === null || error === undefined ? undefined : error.stack;

		if (
			/fetch|load\sfail|loading\schunk|network|net::|ResizeObserver/i.test(
				message
			)
		) {
			return;
		}

		alert(
			applyTemplate(messages.errorTemplate, {
				colno,
				filename,
				lineno,
				message,
				stack: errorStack ? `\n\n${errorStack}` : '',
			})
		);
	});

	try {
		const testKey = '__test__';
		localStorage.setItem(testKey, '');
		localStorage.removeItem(testKey);
	} catch {
		alert(messages.storageWarning);
	}
};

export default function Polyfills({
	errorTemplate,
	storageWarning,
}: {
	errorTemplate: string;
	storageWarning: string;
}) {
	const scriptArgs = JSON.stringify([
		{ errorTemplate, storageWarning },
	]).slice(1, -1);

	return (
		<script
			suppressHydrationWarning
			dangerouslySetInnerHTML={{
				__html: `(${script.toString()})(${scriptArgs})`,
			}}
		/>
	);
}
