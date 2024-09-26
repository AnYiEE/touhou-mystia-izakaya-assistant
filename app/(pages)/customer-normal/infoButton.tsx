import {AccordionItem, Avatar, ScrollShadow} from '@nextui-org/react';

import InfoButtonBase from '@/(pages)/customer-rare/infoButtonBase';

import {customerRatingColorMap} from './constants';

export default function InfoButton() {
	return (
		<InfoButtonBase defaultExpandedKeys={['help']}>
			<AccordionItem key="help" aria-label="特别说明" title="特别说明">
				<ScrollShadow hideScrollBar size={16} className="max-h-48 text-justify text-xs">
					<p className="mb-1 text-sm font-semibold">选单时</p>
					<ol className="list-inside list-disc">
						<li>
							最终的套餐评级只适合一般情景，如果有提供改判效果的符卡生效，此时的套餐评级可能会不够准确。
						</li>
						<li>点击顾客卡片中的标签可以将该标签添加至表格筛选列表或从中移除。</li>
						<li>
							点击套餐卡片中的厨具可以为当前套餐标记是否使用“夜雀”系列厨具，厨具类别是套餐评级时的参考维度之一。
						</li>
						<li>“保存套餐”按钮仅会在选择了料理和酒水时被启用。</li>
						<li>评级时，默认您正确选择了该普客所点单的料理和酒水。</li>
					</ol>
					<p className="mb-1 mt-2 text-sm font-semibold">交互时</p>
					<ol className="list-inside list-disc">
						<li>
							<span className="hidden md:inline">点击顶部的“设置”按钮</span>
							<span className="md:hidden">点击右上角的按钮打开菜单。再点击“设置”按钮</span>
							，可以更改设置或使用数据管理功能。
						</li>
						<li>
							{/* cSpell:ignore haixian */}
							所有的搜索框都支持模糊搜索，如使用“海鲜”、“haixian”或“hx”均可搜索到“海鲜味噌汤”。
						</li>
					</ol>
				</ScrollShadow>
			</AccordionItem>
			<AccordionItem key="rating" aria-label="评级图例" title="评级图例">
				<div className="flex flex-col gap-2 text-justify text-xs">
					{(['普通', '满意'] as const).map((rating, index) => (
						<div key={index} className="mb-1 flex items-center gap-3 px-1">
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
		</InfoButtonBase>
	);
}
