import {memo, useCallback} from 'react';

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectItem,
	type Selection,
	Switch,
	Tooltip,
} from '@nextui-org/react';
import {faGear} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';

import {useCustomerRareStore, useGlobalStore} from '@/stores';

export default memo(function PopularTagSettingButton() {
	const customerStore = useCustomerRareStore();
	const globalStore = useGlobalStore();

	const popularTags = globalStore.popularTags.get();
	const popularTagIsNegative = globalStore.persistence.popular.isNegative.use();
	const selectedPopularTag = globalStore.selectedPopularTag.use();

	const onPopularTagIsNegativeChange = useCallback(
		(value: boolean) => {
			globalStore.persistence.popular.isNegative.set(value);
			customerStore.shared.recipe.page.set(1);
		},
		[customerStore.shared.recipe.page, globalStore.persistence.popular.isNegative]
	);

	const onSelectedPopularTagChange = useCallback(
		(value: Selection) => {
			globalStore.selectedPopularTag.set(value);
			customerStore.shared.recipe.page.set(1);
		},
		[customerStore.shared.recipe.page, globalStore.selectedPopularTag]
	);

	return (
		<Popover showArrow>
			<Tooltip
				showArrow
				content={<p title="全局设置，会覆盖到所有客人">设置流行喜爱或流行厌恶标签</p>}
				offset={0}
				placement="left"
			>
				<span className="absolute -right-1 bottom-1">
					<PopoverTrigger>
						<FontAwesomeIconButton
							icon={faGear}
							variant="light"
							aria-label="设置流行喜爱或流行厌恶标签"
							className="h-4 w-4 text-default-400 hover:opacity-80 data-[hover]:bg-transparent"
						/>
					</PopoverTrigger>
				</span>
			</Tooltip>
			<PopoverContent>
				<div className="flex flex-col gap-2 px-1 py-2">
					<div className="flex items-center">
						<span className="mr-2">流行喜爱</span>
						<Switch
							isSelected={popularTagIsNegative}
							size="sm"
							onValueChange={onPopularTagIsNegativeChange}
							aria-label="设置为流行厌恶"
							classNames={{
								wrapper: 'bg-primary',
							}}
						/>
						<span>流行厌恶</span>
					</div>
					<div className="flex items-center">
						<span className="mr-2 text-nowrap break-keep">标签</span>
						<Select
							items={popularTags}
							defaultSelectedKeys={selectedPopularTag}
							selectedKeys={selectedPopularTag}
							size="sm"
							variant="flat"
							onSelectionChange={onSelectedPopularTagChange}
							aria-label="选择表格每页最大行数"
							title="选择表格每页最大行数"
						>
							{({value}) => <SelectItem key={value}>{value}</SelectItem>}
						</Select>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
});
