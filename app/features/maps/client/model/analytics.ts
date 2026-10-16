import { trackEvent } from '@/features/analytics/client/trackEvent';
import { type TActions } from '@/features/analytics/contracts';

type TMapTrackAction = Extract<TActions, `Map ${string}`>;

/**
 * @description Map operations are click events. Names use map labels and
 * entity ids rather than display text, so they read the same in every
 * language: `<operation>:<map>/<entity>`.
 */
export function trackMapEvent(action: TMapTrackAction, name: string) {
	trackEvent(trackEvent.category.click, action, name);
}

export function getMapEntityTrackName(map: string, entityId: string) {
	return `${map}/${entityId}`;
}
