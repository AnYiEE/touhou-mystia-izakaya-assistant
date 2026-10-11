import { type ReactNode } from 'react';

import { groupItemsByContentDlc } from '@/domain/availability/contentDlc';
import type { TDlc } from '@/domain/data/shared/types';

import ContentDlcDivider from '@/features/catalog/shared/client/components/ContentDlcDivider';
import OfficialContentDivider from '@/features/catalog/shared/client/components/OfficialContentDivider';

export function renderContentDlcSections<TEntry>(
	entries: ReadonlyArray<TEntry>,
	getContentDlc: (entry: TEntry) => TDlc,
	renderEntry: (entry: TEntry, index: number) => ReactNode
): ReactNode[] {
	const { mainItems, modSections } = groupItemsByContentDlc(
		entries,
		getContentDlc
	);
	const nodes: ReactNode[] = [];
	let dataIndex = 0;

	const pushEntries = (sectionEntries: ReadonlyArray<TEntry>) => {
		sectionEntries.forEach((entry) => {
			nodes.push(renderEntry(entry, dataIndex));
			dataIndex += 1;
		});
	};

	if (modSections.length > 0 && mainItems.length > 0) {
		nodes.push(
			<OfficialContentDivider
				key="content-official"
				count={mainItems.length}
				className="col-span-full mb-2 w-full"
			/>
		);
	}
	pushEntries(mainItems);
	modSections.forEach(({ dlc, items }) => {
		if (dataIndex > 0) {
			nodes.push(
				<ContentDlcDivider
					key={`content-dlc:${dlc}`}
					count={items.length}
					dlc={dlc}
					className="col-span-full my-2 w-full"
				/>
			);
		}
		pushEntries(items);
	});

	return nodes;
}
