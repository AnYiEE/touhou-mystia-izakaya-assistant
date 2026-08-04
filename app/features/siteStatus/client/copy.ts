export const SITE_VISITOR_STATUS_MESSAGE_MAP = {
	failed: '获取在线人数失败',
	loading: '正在获取在线人数',
} as const;

export function createSiteVisitorCountMessage(visitorCount: number) {
	return `实时${visitorCount}人在线`;
}
