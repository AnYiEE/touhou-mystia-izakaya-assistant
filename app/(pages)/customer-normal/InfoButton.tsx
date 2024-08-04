import {memo} from 'react';

import {Accordion, AccordionItem, Avatar, Popover, PopoverContent, PopoverTrigger, Tooltip} from '@nextui-org/react';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';

import {customerRatingColorMap} from './constants';

export default memo(function InfoButton() {
	return (
		<Popover showArrow offset={0} placement="left">
			<Tooltip showArrow content="更多信息" offset={-4} placement="left">
				<span className="absolute -right-1 bottom-0">
					<PopoverTrigger>
						<FontAwesomeIconButton
							icon={faInfoCircle}
							variant="light"
							aria-label="更多信息"
							className="h-4 w-4 text-default-400 hover:opacity-80 data-[hover]:bg-transparent"
						/>
					</PopoverTrigger>
				</span>
			</Tooltip>
			<PopoverContent>
				<div className="max-w-44">
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
									<li>双击或中键单击顾客卡片中的标签可以将该标签添加至表格筛选列表或从中移除。</li>
									<li>“保存套餐”按钮仅会在选择了料理和酒水时被启用。</li>
									<li>评级时，默认您已选择了正确的料理和酒水。</li>
								</ol>
							</div>
						</AccordionItem>
						<AccordionItem key="rating" aria-label="评级图例" title="评级图例">
							<div className="flex flex-col gap-2 text-justify text-xs">
								{(['普通', '满意'] as const).map((rating) => (
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
