import {
	RECOMMENDATION_BRIDGE_PROTOCOL_VERSION,
	parseJsonWithUniqueMembers,
} from './shared';
import {
	type TV1RecommendationBridgeInboundMessage,
	parseV1RecommendationBridgeMessage,
} from './v1/protocol';

export {
	RECOMMENDATION_BRIDGE_PROTOCOL_VERSION,
	parseJsonWithUniqueMembers,
} from './shared';
export const BRIDGE_MESSAGE_MAX_BYTES = 32_768;

export const RECOMMENDATION_BRIDGE_CLOSE_CODES = {
	clientUpdate: 4006,
	handshakeTimeout: 4004,
	invalidMessage: 4005,
	loginEnded: 4000,
	pairingFailed: 4002,
	replaced: 4001,
	unsupportedProtocol: 4003,
} as const;

export interface IRecommendationBridgeValidationError {
	readonly path?: string;
	readonly reason: string;
}

export type TRecommendationBridgeValidationResult<T> =
	| { readonly ok: true; readonly value: T }
	| {
			readonly error: IRecommendationBridgeValidationError;
			readonly ok: false;
	  };

export function parseRecommendationBridgeMessage(
	text: string,
	protocolVersion: number
): TRecommendationBridgeValidationResult<TV1RecommendationBridgeInboundMessage> {
	if (new TextEncoder().encode(text).byteLength > BRIDGE_MESSAGE_MAX_BYTES) {
		return { error: { reason: 'message-too-large' }, ok: false };
	}
	const value = parseJsonWithUniqueMembers(text);
	if (value === null) {
		return { error: { reason: 'invalid-json' }, ok: false };
	}

	if (protocolVersion !== RECOMMENDATION_BRIDGE_PROTOCOL_VERSION) {
		return { error: { reason: 'unsupported-protocol' }, ok: false };
	}

	return parseV1RecommendationBridgeMessage(value);
}
