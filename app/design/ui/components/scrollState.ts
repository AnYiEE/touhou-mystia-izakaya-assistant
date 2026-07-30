export interface IScrollState {
	bottom: boolean;
	top: boolean;
}

export const DEFAULT_SCROLL_STATE: IScrollState = { bottom: false, top: false };

const SCROLL_EDGE_THRESHOLD = 1;

export function getScrollState(element: HTMLDivElement): IScrollState {
	const maxScrollTop = element.scrollHeight - element.clientHeight;
	const canScroll = maxScrollTop > SCROLL_EDGE_THRESHOLD;

	return {
		bottom:
			canScroll &&
			element.scrollTop < maxScrollTop - SCROLL_EDGE_THRESHOLD,
		top: canScroll && element.scrollTop > SCROLL_EDGE_THRESHOLD,
	};
}
