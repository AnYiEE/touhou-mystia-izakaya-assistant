'use client';

import {Fragment, useMemo, useState} from 'react';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';

import {useOpenedFoodPopover, useThrottle} from '@/hooks';

import {Popover, PopoverTrigger, PopoverContent, Tooltip} from '@nextui-org/react';

import FoodCard from '@/components/foodCard';
import FoodPopoverCard from '@/components/foodPopoverCard';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {type SelectConfig} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton, {PinyinSortState} from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton, {type SearchConfig} from '@/components/sideSearchIconButton';
import Sprite from '@/components/sprite';

import {BEVERAGE_TAG_STYLE} from '@/constants';
import {type IBeverage} from '@/data';
import {instances} from '@/methods';
import {numberSort} from '@/utils';

const {
	food: {beverage: instance},
} = instances;

const allDlcs = instance.getValuesByProp(instance.data, 'dlc', true).sort(numberSort);
const allLevels = instance.getValuesByProp(instance.data, 'level', true).sort(numberSort);
const allTags = instance.sortedTag.map((value) => ({value}));

export default function Beverages() {
	const [pinyinSortState, setPinyinSortState] = useState<PinyinSortState>(PinyinSortState.NONE);

	const allNames = useMemo(() => {
		switch (pinyinSortState) {
			case PinyinSortState.AZ:
				return instance.getValuesByProp(instance.dataPinyinSorted, 'name', true);
			case PinyinSortState.ZA:
				return instance.getValuesByProp(instance.dataPinyinSorted.toReversed(), 'name', true);
			default:
				return instance.getValuesByProp(instance.data, 'name', true);
		}
	}, [pinyinSortState]);

	const [searchValue, setSearchValue] = useState<string | null>(null);
	const throttledSearchValue = useThrottle(searchValue);

	const searchResult = useMemo(() => {
		if (throttledSearchValue) {
			return instance.data.filter(({name}) => name.toLowerCase().includes(throttledSearchValue.toLowerCase()));
		}
		return instance.data;
	}, [throttledSearchValue]);

	const [filters, setFilters] = useState({
		dlc: [] as string[],
		tag: [] as string[],
		noTag: [] as string[],
		level: [] as string[],
	});
	const {dlc: filterDlc, level: filterLevel, tag: filterTag, noTag: filterNoTag} = filters;

	const filteredData = useMemo(
		() =>
			searchResult.filter(({dlc, level, tag: tags}) => {
				const isDlcMatch = filterDlc.length ? filterDlc.includes(dlc.toString()) : true;
				const isTagMatch = filterTag.length ? filterTag.some((tag) => (tags as string[]).includes(tag)) : true;
				const isNoTagMatch = filterNoTag.length
					? !filterNoTag.some((tag) => (tags as string[]).includes(tag))
					: true;
				const isLevelMatch = filterLevel.length ? filterLevel.includes(level.toString()) : true;

				return isDlcMatch && isLevelMatch && isTagMatch && isNoTagMatch;
			}),
		[filterDlc, filterTag, filterNoTag, filterLevel, searchResult]
	);

	const sortedData = useMemo(() => {
		switch (pinyinSortState) {
			case PinyinSortState.AZ:
				return instance.sortByPinyin(filteredData);
			case PinyinSortState.ZA:
				return instance.sortByPinyin(filteredData).reverse();
			default:
				return filteredData;
		}
	}, [filteredData, pinyinSortState]);

	const searchConfig = {
		label: '选择或输入酒水名称',
		searchItems: allNames,
		searchValue: searchValue,
		setSearchValue: setSearchValue,
	} as const satisfies SearchConfig;

	const selectConfig = [
		{
			label: 'DLC',
			items: allDlcs,
			selectedKeys: filterDlc,
			setSelectedKeys: (key) => setFilters((prev) => ({...prev, dlc: key})),
		},
		{
			label: '酒水标签（包含）',
			items: allTags,
			selectedKeys: filterTag,
			setSelectedKeys: (key) => setFilters((prev) => ({...prev, tag: key})),
		},
		{
			label: '酒水标签（排除）',
			items: allTags,
			selectedKeys: filterNoTag,
			setSelectedKeys: (key) => setFilters((prev) => ({...prev, noTag: key})),
		},
		{
			label: '等级',
			items: allLevels,
			selectedKeys: filterLevel,
			setSelectedKeys: (key) => setFilters((prev) => ({...prev, level: key})),
		},
	] as const satisfies SelectConfig;

	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const openedPopoverParam = 'select' as const;
	const [openedPopover, setOpenedPopover] = useOpenedFoodPopover(openedPopoverParam);

	const handleOpenChange = (name: string | null) => {
		const params = new URLSearchParams(searchParams);
		if (name) {
			params.set(openedPopoverParam, name);
		} else {
			params.delete(openedPopoverParam);
		}
		router.push(`${pathname}?${params.toString()}`);
		setOpenedPopover(name);
	};

	return (
		<>
			<SideButtonGroup>
				<SideSearchIconButton searchConfig={searchConfig} />
				<SidePinyinSortIconButton pinyinSortState={pinyinSortState} setPinyinSortState={setPinyinSortState} />
				<SideFilterIconButton selectConfig={selectConfig} />
			</SideButtonGroup>

			{sortedData.map(({dlc, from, name, level, price, tag: tags}, index) => {
				const levelString = `Lv.${level}`;
				const priceString = `￥${price}`;

				return (
					<Popover
						key={index}
						backdrop="opaque"
						showArrow
						isOpen={openedPopover === name}
						onOpenChange={(isOpen) => {
							handleOpenChange(isOpen ? name : null);
						}}
					>
						<PopoverTrigger className="w-full">
							<FoodCard
								isHoverable
								isPressable
								name={name}
								description={priceString}
								image={<Sprite target="beverage" name={name} size={48} />}
							/>
						</PopoverTrigger>
						<PopoverContent>
							<FoodPopoverCard.CloseButton param={openedPopoverParam} />
							<FoodPopoverCard
								target="beverage"
								name={name}
								description={
									<>
										<span>
											<span className="font-semibold">售价：</span>
											{priceString}
										</span>
										<span>
											<span className="font-semibold">等级：</span>
											{levelString}
										</span>
									</>
								}
								dlc={dlc}
								tags={{positive: tags}}
								tagColors={BEVERAGE_TAG_STYLE}
							>
								{Object.entries(from as IBeverage['from']).map(([method, target], index) => (
									<div key={index}>
										<span className="font-semibold">
											{method === 'buy' ? '购买' : method === 'task' ? '任务' : '采集'}：
										</span>
										{Array.isArray(target)
											? target.map((item, index) => (
													<Fragment key={index}>
														{Array.isArray(item) ? (
															item[1] === true ? (
																<Tooltip
																	showArrow
																	content={`概率${method === 'buy' ? '出售' : '掉落'}`}
																>
																	<span className="underline decoration-dotted">
																		{item[0]}
																	</span>
																</Tooltip>
															) : (
																item[0]
															)
														) : (
															item
														)}
														{index < target.length - 1 && '、'}
													</Fragment>
												))
											: '初始拥有'}
									</div>
								))}
							</FoodPopoverCard>
						</PopoverContent>
					</Popover>
				);
			})}
		</>
	);
}
