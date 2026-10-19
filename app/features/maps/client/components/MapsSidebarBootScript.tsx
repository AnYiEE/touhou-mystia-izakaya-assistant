'use client';

import { useLayoutEffect } from 'react';

import {
	MAP_SIDEBAR_COLLAPSED_BOOT_KEY,
	readBootSidebarCollapsed,
} from '@/features/maps/client/state/mapViewStore';

const MAP_SIDEBAR_BOOT_SCRIPT = `(() => {
	try {
		const isCollapsed =
			localStorage.getItem(${JSON.stringify(
				MAP_SIDEBAR_COLLAPSED_BOOT_KEY
			)}) === 'true';
		document.documentElement.dataset.mapSidebarCollapsed = String(isCollapsed);
	} catch {
		document.documentElement.dataset.mapSidebarCollapsed = 'false';
	}
})();`;

export default function MapsSidebarBootScript() {
	useLayoutEffect(() => {
		document.documentElement.dataset['mapSidebarCollapsed'] = String(
			readBootSidebarCollapsed()
		);
	}, []);

	return (
		<script
			id="maps-sidebar-boot"
			dangerouslySetInnerHTML={{ __html: MAP_SIDEBAR_BOOT_SCRIPT }}
		/>
	);
}
