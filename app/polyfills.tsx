/* eslint-disable func-names, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
// @ts-nocheck

const script = () => {
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
	const targetNode = document.head.querySelector('meta[name="wpk-bid_lowpri"]');
	if (targetNode !== null) {
		targetNode.remove();
		for (const node of document.head.childNodes) {
			if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() === '') {
				node.remove();
				break;
			}
		}
	}
};

export default function Polyfills() {
	return (
		<script
			suppressHydrationWarning
			dangerouslySetInnerHTML={{
				__html: `(${script.toString()})()`,
			}}
		/>
	);
}
