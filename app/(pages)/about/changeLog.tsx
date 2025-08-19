/* eslint-disable sort-keys */
'use client';

import { Fragment } from 'react';

import { Link } from '@/design/ui/components';

import { trackEvent } from '@/components/analytics';
import Heading from '@/components/heading';

import { siteConfig } from '@/configs';
import { DARK_MATTER_META_MAP, DYNAMIC_TAG_MAP } from '@/data';
import { copyArray } from '@/utilities';

const { links } = siteConfig;

const changelog = [
	{ version: 'v0.1', changes: ['新增：料理、酒水和食材页面。'] },
	{
		version: 'v0.2',
		changes: [
			'新增：稀客套餐搭配页面。',
			'新增：支持导出稀客套餐搭配数据。',
			'新增：支持作为渐进式网络应用程序安装。',
			'新增：支持离线访问。',
			'新增：自定义亮色主题“izakaya”。',
		],
	},
	{
		version: 'v0.3',
		changes: ['新增：普客套餐搭配页面。', '新增：稀客套餐评级功能。'],
	},
	{
		version: 'v0.4',
		changes: [
			`新增：支持设置全局的“${DYNAMIC_TAG_MAP.popularPositive}”或“${DYNAMIC_TAG_MAP.popularNegative}”趋势。`,
			'新增：作为渐进式网络应用程序安装后，提供常用功能的快捷方式。',
			'改善：无障碍（键盘导航）支持。',
			'修复：稀客套餐评级逻辑。',
		],
	},
	{
		version: 'v0.5',
		changes: [
			'新增：首次进入稀客套餐搭配页面时，展示使用教程。',
			'新增：主题切换器支持选择“跟随系统”。',
			'改善：与低版本环境（包括iOS 15以下版本系统上的浏览器和macOS系统上的15以下版本的Safari浏览器）的兼容性。',
			'修复：作为渐进式网络应用程序安装后，导航栏的部分按钮被窗口控件遮挡。',
			'修复：将食谱来源纳入稀客套餐评级维度。',
		],
	},
	{
		version: 'v0.6',
		changes: [
			'新增：普客套餐评级功能。',
			'新增：部分稀客的喜爱料理标签可选择补充显示对应点单描述中的关键词以供参考。',
		],
	},
	{
		version: 'v0.7',
		changes: ['新增：设置页面。', '修复：顾客套餐评级逻辑。'],
	},
	{
		version: 'v0.8',
		changes: [
			'新增：稀客羁绊奖励数据及其展示界面。',
			'修复：顾客套餐评级逻辑。',
		],
	},
	{
		version: 'v0.9',
		changes: [
			`新增：稀客套餐评级支持“${DARK_MATTER_META_MAP.name}”。`,
			'新增：稀客符卡效果数据及其展示界面。',
			'新增：稀客、米斯蒂娅的角色和衣服立绘。',
			'新增：部分场景下支持临时唤起新窗口查看料理、酒水或食材详情。',
			'新增：部分操作支持震动反馈。',
			'修复：动态计算已保存的顾客套餐的评级。',
			'修复：顾客套餐评级逻辑。',
		],
	},
	{
		version: 'v1.0',
		changes: ['新增：食材“铃仙”、“噗噗哟果”和“强效辣椒素”。'],
	},
	{ version: 'v1.1', changes: ['新增：厨具页面。'] },
	{
		version: 'v1.2',
		changes: [
			'新增：摆件和衣服页面。',
			'新增：支持同时导出稀客和普客的套餐搭配数据。',
			`新增：料理和食材页面中的料理和食材标签将依照已设置的“${DYNAMIC_TAG_MAP.popularPositive}”或“${DYNAMIC_TAG_MAP.popularNegative}”趋势而动态调整。`,
			`修复：料理页面的部分料理未显示“${DYNAMIC_TAG_MAP.largePartition}”标签。`,
			'修复：额外食材评分逻辑。',
		],
	},
	{
		version: 'v1.3',
		changes: [
			'新增：伙伴和货币页面。',
			'新增：支持调整已保存的套餐搭配数据中的套餐顺序。',
			'修复：额外食材评分逻辑。',
		],
	},
	{
		version: 'v1.4',
		changes: [
			'新增：支持设置全局的“明星店”效果。',
			'修复：顾客套餐评级逻辑。',
		],
	},
	{
		version: 'v1.5',
		changes: [
			'新增：更新数据至游戏版本4.2.0。',
			'改善：交互体验和视觉效果。',
		],
	},
	{ version: 'v1.6', changes: ['新增：支持云备份套餐搭配数据。'] },
	{
		version: 'v1.7',
		changes: [
			'新增：支持跨标签页同步状态（如：全局设置、套餐搭配数据等）。',
			'改善：料理和酒水表格的部分状态（如：显示条目、最大行数等）不再区分页面。',
			'改善：高分辨率或宽屏显示器下页面的最大宽度。',
			'修复：顾客套餐评级逻辑。',
		],
	},
	{ version: 'v1.8', changes: ['新增：稀客预算超支容忍度数据。'] },
	{
		version: 'v1.9',
		changes: ['新增：支持全局设置料理和酒水表格中特定项目的可见性。'],
	},
] as const satisfies Array<{
	version: `v${string}`;
	changes: Array<`${'新增' | '改善' | '修复'}：${string}。`>;
}>;

export default function ChangeLog() {
	return (
		<>
			<Heading
				subTitle={
					<>
						以下为更新摘要，前往
						<Link
							isExternal
							showAnchorIcon
							href={`${links.github.href}/commits`}
							title={`${links.github.label}提交记录`}
							onPress={() => {
								trackEvent(
									trackEvent.category.click,
									'Link',
									'about:GitHub'
								);
							}}
							className="rounded-small"
						>
							GitHub
						</Link>
						可以查看完整的提交记录。
					</>
				}
			>
				更新日志
			</Heading>
			{copyArray(changelog)
				.reverse()
				.map(({ changes, version }, versionIndex) => (
					<Fragment key={versionIndex}>
						<Heading as="h2" isFirst={versionIndex === 0}>
							{version}
						</Heading>
						<ul className="list-inside list-decimal space-y-2 break-all text-justify">
							{changes.map((change, changeIndex) => (
								<li key={changeIndex}>{change}</li>
							))}
						</ul>
					</Fragment>
				))}
		</>
	);
}
