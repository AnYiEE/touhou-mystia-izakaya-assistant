import {memo, useCallback} from 'react';

import {
	Accordion,
	AccordionItem,
	Avatar,
	Divider,
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

import {customerRatingColorMap} from './constants';
import {useCustomerRareStore, useGlobalStore} from '@/stores';

export default memo(function SettingsButton() {
	const customerStore = useCustomerRareStore();
	const globalStore = useGlobalStore();

	const popularTags = globalStore.popularTags.get();
	const isNegativePopularTag = globalStore.persistence.popular.isNegative.use();
	const selectedPopularTag = globalStore.selectedPopularTag.use();

	const isShowTagDescription = customerStore.persistence.customer.showTagDescription.use();

	const onIsNegativePopularTagChange = useCallback(
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
		<Popover showArrow offset={10} placement="bottom-end">
			<Tooltip
				showArrow
				content={<p title="全局设置会影响所有客人">全局设置和更多信息</p>}
				offset={0}
				placement="left"
			>
				<span className="absolute -right-1 bottom-1">
					<PopoverTrigger>
						<FontAwesomeIconButton
							icon={faGear}
							variant="light"
							aria-label="全局设置和更多信息"
							className="h-4 w-4 text-default-400 hover:opacity-80 data-[hover]:bg-transparent"
						/>
					</PopoverTrigger>
				</span>
			</Tooltip>
			<PopoverContent>
				<div className="flex max-w-44 flex-col px-1 py-2">
					<h2 className="mb-2 text-base font-bold">全局设置</h2>
					<div className="flex flex-col gap-2">
						<div className="flex items-center">
							<span className="mr-2 whitespace-nowrap">流行喜爱</span>
							<Switch
								isSelected={isNegativePopularTag}
								size="sm"
								onValueChange={onIsNegativePopularTagChange}
								aria-label={`设置为流行${isNegativePopularTag ? '喜爱' : '厌恶'}`}
								classNames={{
									wrapper: 'bg-primary',
								}}
							/>
							<span className="whitespace-nowrap">流行厌恶</span>
						</div>
						<div className="flex items-center">
							<span className="mr-2 whitespace-nowrap">标签</span>
							<Select
								items={popularTags}
								defaultSelectedKeys={selectedPopularTag}
								selectedKeys={selectedPopularTag}
								size="sm"
								variant="flat"
								onSelectionChange={onSelectedPopularTagChange}
								aria-label="选择游戏中现时流行的标签"
								title="选择游戏中现时流行的标签"
							>
								{({value}) => <SelectItem key={value}>{value}</SelectItem>}
							</Select>
						</div>
						<Divider />
						<div className="flex items-center">
							<span className="mr-2 whitespace-nowrap">显示料理标签描述</span>
							<Switch
								endContent={<span>关</span>}
								startContent={<span>开</span>}
								isSelected={isShowTagDescription}
								size="sm"
								onValueChange={customerStore.persistence.customer.showTagDescription.set}
								aria-label={`${isShowTagDescription ? '隐藏' : '显示'}料理标签描述`}
								classNames={{
									endContent: 'leading-none',
									startContent: 'leading-none',
									wrapper: 'bg-default-300 dark:bg-default-200',
								}}
							/>
						</div>
						<Divider />
					</div>
					<Accordion
						isCompact
						keepContentMounted
						className="m-0 p-0"
						itemClasses={{
							base: 'mb-1 mt-3 text-base font-bold',
							content: 'mt-2 py-0 font-normal',
							trigger: 'm-0 p-0',
						}}
					>
						<AccordionItem key="help" aria-label="特别说明" title="特别说明">
							<div className="flex flex-col text-justify text-xs">
								<p className="mb-1 font-semibold">选单时</p>
								<ol className="list-inside list-disc">
									<li>
										单击套餐卡片中的厨具可以为当前套餐标记是否使用“夜雀”系列厨具，厨具类别是套餐最终评级的参考维度之一。
									</li>
									<li>
										长按客人卡片中的标签可以将该标签视为客人的点单需求，客人的点单需求是否被满足是最终评级的参考维度之一。
									</li>
									<li>双击客人卡片中的标签可以将该标签添加至表格筛选列表或从中移除。</li>
									<li>“保存套餐”按钮仅会在选择了料理和酒水，且选定了客人的点单需求标签时被启用。</li>
								</ol>
							</div>
						</AccordionItem>
						<AccordionItem key="rating" aria-label="评级图例" title="评级图例">
							<div className="flex flex-col gap-2 text-justify text-xs">
								{(['极度不满', '不满', '普通', '满意', '完美'] as const).map((rating) => (
									<div key={rating} className="mb-1 flex items-center gap-3 px-1">
										<Avatar
											isBordered
											showFallback
											color={customerRatingColorMap[rating]}
											fallback={<div></div>}
											radius="sm"
											classNames={{
												base: 'h-4 w-px ring-offset-0',
											}}
										/>
										{rating}
									</div>
								))}
							</div>
						</AccordionItem>
					</Accordion>
				</div>
			</PopoverContent>
		</Popover>
	);
});
