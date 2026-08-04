export const SSO_AUTHORIZE_MESSAGE_MAP = {
	authorizationCancelled: '授权已取消。',
	authorizationExpired: '授权上下文已过期，请从外部服务重新发起登录。',
	invalidRequest: '授权请求无效或已失效，请从外部服务重新发起登录。',
	networkFailed: '网络连接失败，请稍后重试。',
	rateLimited: '操作过于频繁，请稍后再试。',
} as const;

export function createSsoAuthorizeRateLimitedMessage(retryAfter: number) {
	return `操作过于频繁，请${Math.ceil(retryAfter)}秒后再试。`;
}
