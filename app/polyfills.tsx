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
	 * @description Add `BroadcastChannel` polyfill for Safari < 15.4.
	 * @see {@link https://github.com/JSmith01/broadcastchannel-polyfill}
	 */
	if (typeof BroadcastChannel !== 'function') {
		globalThis.BroadcastChannel = class {
			static channels = {};
			constructor(channel) {
				this.name = String(channel);
				this._closed = false;
				this._id = `$BroadcastChannel$${this.name}$`;
				this._mc = new MessageChannel();
				this._mc.port1.start();
				this._mc.port2.start();
				const channelGroup = BroadcastChannel.channels[this._id] ?? [];
				channelGroup.push(this);
				globalThis.addEventListener('storage', ({key, newValue, storageArea}: StorageEvent) => {
					if (storageArea !== localStorage || !key || !key.startsWith(this._id as string) || !newValue) {
						return;
					}
					this._mc.port2.postMessage(JSON.parse(newValue));
				});
			}
			close() {
				if (this._closed) {
					return;
				}
				this._closed = true;
				this._mc.port1.close();
				this._mc.port2.close();
				const channelGroup = BroadcastChannel.channels[this._id];
				channelGroup.splice(channelGroup.indexOf(this), 1);
			}
			postMessage(message) {
				if (this._closed) {
					throw new DOMException('Channel closed', 'InvalidStateError');
				}
				const key = `${this._id}${Date.now()}$${Math.random()}`;
				localStorage.setItem(key, JSON.stringify(message));
				setTimeout(() => {
					localStorage.removeItem(key);
				}, 500);
				BroadcastChannel.channels[this._id].forEach((bc) => {
					if (bc === this) {
						return;
					}
					bc._mc.port2.postMessage(message);
				});
			}
			get onmessage() {
				return this._mc.port1.onmessage;
			}
			set onmessage(value) {
				// eslint-disable-next-line unicorn/prefer-add-event-listener
				this._mc.port1.onmessage = value;
			}
			addEventListener(...args) {
				this._mc.port1.addEventListener(...args);
			}
			removeEventListener(...args) {
				this._mc.port1.removeEventListener(...args);
			}
			dispatchEvent(event) {
				return this._mc.port1.dispatchEvent(event);
			}
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
