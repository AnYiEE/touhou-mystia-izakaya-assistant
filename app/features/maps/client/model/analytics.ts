import {
	trackEvent,
	trackEventWithoutInteractionCount,
} from '@/features/analytics/client/trackEvent';
import { type TActions } from '@/features/analytics/contracts';

type TMapTrackAction = Exclude<
	Extract<TActions, `Map ${string}`>,
	'Map Gesture Button'
>;

export type TMapGesture = 'Keyboard Pan' | 'Pan' | 'Pinch' | 'Wheel';

/**
 * @description Map operations are click events. Names use map labels and
 * entity ids rather than display text, so they read the same in every
 * language: `<operation>:<map>/<entity>`.
 */
export function trackMapEvent(action: TMapTrackAction, name: string) {
	trackEvent(trackEvent.category.click, action, name);
}

/**
 * @description Pans and zooms by gesture fire continuously; callers report
 * them once per gesture, and they do not count towards the interaction count.
 */
export function trackMapGesture(gesture: TMapGesture) {
	trackEventWithoutInteractionCount(
		trackEventWithoutInteractionCount.category.click,
		'Map Gesture Button',
		gesture
	);
}

export function getMapEntityTrackName(map: string, entityId: string) {
	return `${map}/${entityId}`;
}
