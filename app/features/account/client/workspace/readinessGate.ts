import { workspaceStore } from './workspaceStore';

export function clearWorkspacePendingAttribute() {
	delete document.documentElement.dataset['workspacePending'];
}

export function releaseWorkspacePendingAttribute(canShowInitialAuth: boolean) {
	if (workspaceStore.isReady.get() && canShowInitialAuth) {
		clearWorkspacePendingAttribute();
		return;
	}
	document.documentElement.dataset['workspacePending'] = 'true';
}
