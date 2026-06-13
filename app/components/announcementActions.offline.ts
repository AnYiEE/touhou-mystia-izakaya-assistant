export function dismissAnnouncementAction() {
	return Promise.resolve({
		data: { message: 'announcement-dismissed' },
		status: 'ok',
	});
}
