export function getCompiledSiteStatusBuildOperationId() {
	return typeof __SITE_STATUS_BUILD_OPERATION_ID__ === 'string'
		? __SITE_STATUS_BUILD_OPERATION_ID__
		: null;
}
