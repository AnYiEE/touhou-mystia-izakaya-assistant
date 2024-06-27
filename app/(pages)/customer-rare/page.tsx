'use client';

import {memo, useCallback, useMemo, useReducer, useState} from 'react';
import clsx from 'clsx';

import {
	useAllItemNames,
	usePinyinSortConfig,
	useSearchConfig,
	useSearchResult,
	useSortedData,
	useThrottle,
} from '@/hooks';

import {Tab, Tabs, type Selection} from '@nextui-org/react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronDown, faChevronUp} from '@fortawesome/free-solid-svg-icons';

import CustomerCard from './customerCard';
import CustomerTabContent from './customerTabContent';
import RecipeTabContent from './recipeTabContent';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {TSelectConfig} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton, {PinyinSortState} from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton from '@/components/sideSearchIconButton';

import {instance_rate, instance_special} from './constants';
import type {ICurrentCustomer, ICustomerTabState, TRecipe} from './types';
import {numberSort, pinyinSort} from '@/utils';

const rareDlcs = instance_rate.getValuesByProp(instance_rate.data, 'dlc').sort(numberSort);
const specialDlcs = instance_special.getValuesByProp(instance_special.data, 'dlc').sort(numberSort);
const allDlcs = [...new Set([...rareDlcs, ...specialDlcs])].map((value) => ({value}));

const rarePlaces = instance_rate.getValuesByProp(instance_rate.data, 'place').sort(pinyinSort);
const specialPlaces = instance_special.getValuesByProp(instance_special.data, 'place').sort(pinyinSort);
const allPlaces = [...new Set([...rarePlaces, ...specialPlaces])].map((value) => ({value}));

const customerTabExpandState = {
	label: 'expand',
	buttonNode: <FontAwesomeIcon icon={faChevronDown} size="sm" />,
	contentClassName: 'h-[calc(50vh-9.25rem)] min-h-[20vw]',
	sideButtonGroupClassName: 'hidden xl:block',
} as const satisfies ICustomerTabState;

const customerTabCollapseState = {
	label: 'collapse',
	buttonNode: <FontAwesomeIcon icon={faChevronUp} size="sm" />,
	contentClassName: 'h-[50vmax]',
	sideButtonGroupClassName: '',
} as const satisfies ICustomerTabState;

function customerTabStateReducer(state: ICustomerTabState) {
	if (state.label === 'expand') {
		return customerTabCollapseState;
	}
	return customerTabExpandState;
}

export default memo(function CustomerRare() {
	const [currentCustomer, setCurrentCustomer] = useState<ICurrentCustomer | null>(null);
	const [currentRecipe, setCurrentRecipe] = useState<TRecipe | null>(null);
	const [selectedCustomerPositiveTags, setSelectedCustomerPositiveTags] = useState<Selection>(new Set());

	const refreshCustomer = useCallback(() => {
		setCurrentRecipe(null);
		setSelectedCustomerPositiveTags(new Set());
	}, []);

	const [customerPinyinSortState, setCustomerPinyinSortState] = useState<PinyinSortState>(PinyinSortState.NONE);

	const rareNames = useAllItemNames(instance_rate, customerPinyinSortState);
	const specialNames = useAllItemNames(instance_special, customerPinyinSortState);

	const [customerSearchValue, setCustomerSearchValue] = useState('');
	const throttledCustomerSearchValue = useThrottle(customerSearchValue);

	const rareSearchResult = useSearchResult(instance_rate, throttledCustomerSearchValue);
	const specialSearchResult = useSearchResult(instance_special, throttledCustomerSearchValue);
	type TSearchResult = typeof rareSearchResult | typeof specialSearchResult;

	const [customerFilters, setCustomerFilters] = useState({
		dlc: [] as string[],
		place: [] as string[],
		noPlace: [] as string[],
	});
	const {dlc: customerFilterDlc, place: customerFilterPlace, noPlace: customerFilterNoPlace} = customerFilters;

	const customerFilter = useCallback(
		function customerFilter<T extends TSearchResult>(target: T) {
			return target.filter(({dlc, place: places}) => {
				const isDlcMatch = customerFilterDlc.length ? customerFilterDlc.includes(dlc.toString()) : true;
				const isPlaceMatch = customerFilterPlace.length
					? customerFilterPlace.some((place) => (places as string[]).includes(place))
					: true;
				const isNoPlaceMatch = customerFilterNoPlace.length
					? !customerFilterNoPlace.some((place) => (places as string[]).includes(place))
					: true;

				return isDlcMatch && isPlaceMatch && isNoPlaceMatch;
			}) as T;
		},
		[customerFilterDlc, customerFilterPlace, customerFilterNoPlace]
	);

	const rareFilteredData = useMemo(() => customerFilter(rareSearchResult), [customerFilter, rareSearchResult]);
	const specialFilteredData = useMemo(
		() => customerFilter(specialSearchResult),
		[customerFilter, specialSearchResult]
	);

	const rareSortedData = useSortedData(instance_rate, rareFilteredData, customerPinyinSortState);
	const specialSortedData = useSortedData(instance_special, specialFilteredData, customerPinyinSortState);
	const customerSortedData = useMemo(
		() =>
			({
				customer_rare: rareSortedData,
				customer_special: specialSortedData,
			}) as const,
		[rareSortedData, specialSortedData]
	);

	const customerPinyinSortConfig = usePinyinSortConfig(customerPinyinSortState, setCustomerPinyinSortState);

	const customerSearchConfig = useSearchConfig({
		label: '选择或输入稀客名称',
		searchItems: [...rareNames, ...specialNames],
		searchValue: customerSearchValue,
		setSearchValue: setCustomerSearchValue,
	});

	const costomerSelectConfig = useMemo(
		() =>
			[
				{
					label: 'DLC',
					items: allDlcs,
					selectedKeys: customerFilterDlc,
					setSelectedKeys: (key) => setCustomerFilters((prev) => ({...prev, dlc: key})),
				},
				{
					label: '出没地点（包含）',
					items: allPlaces,
					selectedKeys: customerFilterPlace,
					setSelectedKeys: (key) => setCustomerFilters((prev) => ({...prev, place: key})),
				},
				{
					label: '出没地点（排除）',
					items: allPlaces,
					selectedKeys: customerFilterNoPlace,
					setSelectedKeys: (key) => setCustomerFilters((prev) => ({...prev, noPlace: key})),
				},
			] as const satisfies TSelectConfig,
		[customerFilterDlc, customerFilterNoPlace, customerFilterPlace]
	);

	const [customerTabState, toggleCustomerTabState] = useReducer(customerTabStateReducer, customerTabExpandState);
	const [isCustomerTabFilterHidden, setIsCustomerTabFilterHidden] = useState(false);

	return (
		<>
			<SideButtonGroup
				className={clsx(
					'md:bottom-6 xl:bottom-[calc(50%-4rem)] xl:left-6',
					customerTabState.sideButtonGroupClassName,
					isCustomerTabFilterHidden && '!hidden'
				)}
			>
				<SideSearchIconButton searchConfig={customerSearchConfig} />
				<SidePinyinSortIconButton pinyinSortConfig={customerPinyinSortConfig} />
				<SideFilterIconButton selectConfig={costomerSelectConfig} />
			</SideButtonGroup>

			<div className="w-full">
				<Tabs
					fullWidth
					size="sm"
					onSelectionChange={(key) => {
						setIsCustomerTabFilterHidden(key !== 'customer_rare');
					}}
				>
					<Tab key="customer_rare" title="稀客" className="relative">
						<CustomerTabContent
							currentCustomer={currentCustomer}
							setCurrentCustomer={setCurrentCustomer}
							customerTabState={customerTabState}
							toggleCustomerTabState={toggleCustomerTabState}
							refreshCustomer={refreshCustomer}
							sortedData={customerSortedData}
						/>
					</Tab>
					<Tab isDisabled={!currentCustomer} key="recipe" title="料理">
						<RecipeTabContent
							currentCustomer={currentCustomer}
							currentRecipe={currentRecipe}
							setCurrentRecipe={setCurrentRecipe}
							selectedCustomerPositiveTags={selectedCustomerPositiveTags}
							setSelectedCustomerPositiveTags={setSelectedCustomerPositiveTags}
						/>
					</Tab>
					<Tab isDisabled={!currentCustomer} key="beverage" title="酒水">
						<div className="h-[calc(50vh-9rem)] break-all xl:h-[calc(100vh-9rem)]">
							emptyemptyemptyemptyemptyemptyempty
						</div>
					</Tab>
					<Tab isDisabled={!(currentCustomer && currentRecipe)} key="ingredient" title="食材">
						<div className="h-[calc(50vh-9rem)] break-all xl:h-[calc(100vh-9rem)]">
							emptyemptyemptyemptyemptyemptyempty
						</div>
					</Tab>
				</Tabs>
			</div>

			<div className="flex w-full flex-col xl:min-h-[calc(100vh-6.25rem)]">
				{currentCustomer ? (
					<CustomerCard
						currentCustomer={currentCustomer}
						currentRecipe={currentRecipe}
						refreshCustomer={refreshCustomer}
						selectedCustomerPositiveTags={selectedCustomerPositiveTags}
						setSelectedCustomerPositiveTags={setSelectedCustomerPositiveTags}
					/>
				) : (
					<span className="my-auto select-none p-2 text-center font-semibold text-default-300">
						选择角色以继续
					</span>
				)}
			</div>
		</>
	);
});
