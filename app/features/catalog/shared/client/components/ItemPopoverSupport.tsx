'use client';

import {
	type ReactNode,
	createContext,
	memo,
	useContext,
	useMemo,
} from 'react';

import { useParams } from '@/features/appShell/client/navigation/useParams';
import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import { ITEM_PREVIEW_PARAM_NAME } from '@/features/itemSharing/contracts';

interface IItemPopoverSupportContext {
	isEnabled: boolean;
	section: string;
}

interface IProps {
	children: ReactNode;
}

const ItemPopoverSupportContext =
	createContext<IItemPopoverSupportContext | null>(null);

export const ItemPopoverSupportProvider = memo<IProps>(
	function ItemPopoverSupportProvider({ children }) {
		const { params } = useParams();
		const { pathname } = usePathname();

		const isEnabled = !params.has(ITEM_PREVIEW_PARAM_NAME);

		const value = useMemo(
			() => ({ isEnabled, section: pathname }),
			[isEnabled, pathname]
		);

		return (
			<ItemPopoverSupportContext.Provider value={value}>
				{children}
			</ItemPopoverSupportContext.Provider>
		);
	}
);

export function useItemPopoverSupportContext() {
	return useContext(ItemPopoverSupportContext);
}
