import type { TDlc } from '@/domain/data/shared/types';

/**
 * @description Mod content starts at DLC9 (MetaMystia). Every packaged DLC,
 * including DLC2.5, belongs to the main group, and each later mod DLC value
 * forms one more group, so an additional mod (DLC10, ...) yields another
 * divider and section without further changes.
 */
function isModDlc(dlc: TDlc) {
	return dlc >= 9;
}

interface IContentDlcSection<TItem> {
	dlc: TDlc;
	items: ReadonlyArray<TItem>;
}

interface IContentDlcLayout<TItem> {
	/** @description Base game and packaged DLC content, in input order. */
	mainItems: ReadonlyArray<TItem>;
	/** @description One section per mod DLC, ordered by DLC value. */
	modSections: ReadonlyArray<IContentDlcSection<TItem>>;
}

export function groupItemsByContentDlc<TItem>(
	items: ReadonlyArray<TItem>,
	getContentDlc: (item: TItem) => TDlc | undefined
): IContentDlcLayout<TItem> {
	const mainItems: TItem[] = [];
	const modItemsByDlc = new Map<TDlc, TItem[]>();

	items.forEach((item) => {
		const dlc = getContentDlc(item);
		if (dlc === undefined || !isModDlc(dlc)) {
			mainItems.push(item);
			return;
		}

		const modItems = modItemsByDlc.get(dlc);
		if (modItems === undefined) {
			modItemsByDlc.set(dlc, [item]);
		} else {
			modItems.push(item);
		}
	});

	return {
		mainItems,
		modSections: [...modItemsByDlc]
			.sort(([leftDlc], [rightDlc]) => leftDlc - rightDlc)
			.map(([dlc, modItems]) => ({ dlc, items: modItems })),
	};
}
