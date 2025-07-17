'use client';

import {type PropsWithChildren, useEffect} from 'react';
import {compareVersions} from 'compare-versions';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

import {useRouter} from 'next/navigation';

import {HeroUIProvider} from '@heroui/system';
import {ProgressBar, ProgressBarProvider} from 'react-transition-progress';

import CompatibleBrowser from '@/components/compatibleBrowser';
import CustomerRareTutorial from '@/components/customerRareTutorial';

import {siteConfig} from '@/configs';
import {
	type TGlobalPersistenceState,
	customerNormalStore,
	customerRareStore,
	globalStore,
	globalStoreKey,
	ingredientsStore,
	recipesStore,
} from '@/stores';
import {toSet} from '@/utilities';

const {cdnUrl, version} = siteConfig;

interface IProps {
	locale: string;
}

export default function Providers({children, locale}: PropsWithChildren<IProps>) {
	useEffect(() => {
		// If the saved version is not set or outdated, initialize it with the current version.
		// When an outdated version is detected, the current tab will update the saved version in local storage.
		// Other tabs will monitor changes in the saved version and reload the page as needed.
		const savedVersion = globalStore.persistence.version.get();
		if (savedVersion === null || compareVersions(version, savedVersion) === 1) {
			globalStore.persistence.version.set(version);
		}

		// Initialize the user ID.
		const globalUserId = globalStore.persistence.userId.get();
		if (globalUserId === null) {
			const fpPromise = FingerprintJS.load();
			void fpPromise.then(async (fp) => {
				const fpResult = await fp.get();
				globalStore.persistence.userId.set(fpResult.visitorId);
			});
		}

		// Initialize famous shop state based on the persistence state.
		const globalFamousShop = globalStore.persistence.famousShop.get();
		customerNormalStore.shared.customer.famousShop.set(globalFamousShop);
		customerRareStore.shared.customer.famousShop.set(globalFamousShop);
		ingredientsStore.shared.famousShop.set(globalFamousShop);
		recipesStore.shared.famousShop.set(globalFamousShop);

		// Initialize popular trend based on the persistence data.
		const globalPopularTrend = globalStore.persistence.popularTrend.get();
		customerNormalStore.shared.customer.popularTrend.set(globalPopularTrend);
		customerRareStore.shared.customer.popularTrend.set(globalPopularTrend);
		ingredientsStore.shared.popularTrend.set(globalPopularTrend);
		recipesStore.shared.popularTrend.set(globalPopularTrend);

		// Initialize table state based on the persistence data.
		const globalBeverageTableColumns = globalStore.persistence.table.columns.beverage.get();
		const globalRecipeTableColumns = globalStore.persistence.table.columns.recipe.get();
		const globalTableRow = globalStore.persistence.table.row.get();
		const globalTableSelectableRows = globalStore.shared.table.selectableRows.get();
		customerNormalStore.shared.beverage.table.columns.set(toSet(globalBeverageTableColumns));
		customerNormalStore.shared.beverage.table.row.set(globalTableRow);
		customerNormalStore.shared.beverage.table.rows.set(toSet([globalTableRow.toString()]));
		customerNormalStore.shared.beverage.table.selectableRows.set(globalTableSelectableRows);
		customerNormalStore.shared.recipe.table.columns.set(toSet(globalRecipeTableColumns));
		customerNormalStore.shared.recipe.table.row.set(globalTableRow);
		customerNormalStore.shared.recipe.table.rows.set(toSet([globalTableRow.toString()]));
		customerNormalStore.shared.recipe.table.selectableRows.set(globalTableSelectableRows);
		customerRareStore.shared.beverage.table.columns.set(toSet(globalBeverageTableColumns));
		customerRareStore.shared.beverage.table.row.set(globalTableRow);
		customerRareStore.shared.beverage.table.rows.set(toSet([globalTableRow.toString()]));
		customerRareStore.shared.beverage.table.selectableRows.set(globalTableSelectableRows);
		customerRareStore.shared.recipe.table.columns.set(toSet(globalRecipeTableColumns));
		customerRareStore.shared.recipe.table.row.set(globalTableRow);
		customerRareStore.shared.recipe.table.rows.set(toSet([globalTableRow.toString()]));
		customerRareStore.shared.recipe.table.selectableRows.set(globalTableSelectableRows);
	}, []);

	const router = useRouter();

	return (
		<HeroUIProvider locale={locale} navigate={router.push}>
			<ProgressBarProvider>
				{children}
				<ProgressBar className="fixed top-0 z-60 h-1 rounded-2xl bg-primary dark:lg:h-0.5" />
				<CompatibleBrowser />
				<CustomerRareTutorial />
			</ProgressBarProvider>
		</HeroUIProvider>
	);
}

const script = (cdnPrefix: string, storeKey: string) => {
	let enable: boolean | undefined;

	try {
		const globalStorage = localStorage.getItem(storeKey);
		if (globalStorage !== null) {
			const state = (JSON.parse(globalStorage) as TGlobalPersistenceState).state.persistence;
			enable = state.highAppearance;
		}
	} catch {
		/* empty */
	}

	if (enable !== false) {
		const smoothScrollScript = document.createElement('script');
		smoothScrollScript.src = `${cdnPrefix}/SmoothScroll.min.js`;
		smoothScrollScript.async = true;
		document.head.append(smoothScrollScript);
		document.body.classList.add('bg-blend-mystia-pseudo');
	}
};

/**
 * @description Add `bg-blend-mystia-pseudo` class to body and add smooth scroll effect,
 * if the `globalStorage.highAppearance` setting is enabled.
 */
export function AddHighAppearance() {
	const scriptArgs = JSON.stringify([cdnUrl, globalStoreKey]).slice(1, -1);

	return (
		<script
			suppressHydrationWarning
			dangerouslySetInnerHTML={{
				__html: `(${script.toString()})(${scriptArgs})`,
			}}
		/>
	);
}
