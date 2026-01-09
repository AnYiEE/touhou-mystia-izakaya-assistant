import { useMemo } from 'react';

import { type TSelectConfig } from '@/components/sideFilterIconButton';

import { type TDlc } from '@/data';
import { globalStore as store } from '@/stores';
import { checkEmpty } from '@/utilities';

export function useSelectConfig(configs: TSelectConfig) {
	const hiddenDlcs = store.hiddenDlcs.use();

	const selectConfig = useMemo(
		() =>
			configs
				.map((config) => {
					if (config.label === 'DLC') {
						if (checkEmpty(hiddenDlcs)) {
							return config;
						}
						const filteredItems = config.items.filter(
							(item) => !hiddenDlcs.has(item.value as TDlc)
						);
						return {
							...config,
							items: filteredItems,
							selectedKeys: config.selectedKeys.filter((key) =>
								filteredItems.some(
									(item) => item.value === Number(key)
								)
							),
						};
					}
					return config;
				})
				.filter(
					({ items, label }) =>
						!(label === 'DLC' && items.length <= 1)
				),
		[configs, hiddenDlcs]
	);

	return selectConfig;
}
