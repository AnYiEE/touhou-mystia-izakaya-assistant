/* eslint-disable sort-keys */
import {Fragment} from 'react';

import {Link} from '@nextui-org/react';

import H1 from '@/components/h1';
import H2 from '@/components/h2';
import Ul from '@/components/ul';

import {siteConfig} from '@/configs';

const {links} = siteConfig;

const changelog = [
	{
		version: 'v0.1',
		changes: ['新增：料理、酒水和食材页面。'],
	},
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
			'新增：搭配稀客套餐时，支持设置流行喜爱和流行厌恶标签。',
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
			'改善：与低版本环境（如：iOS 15以下版本系统上的浏览器、macOS系统上的15以下版本的Safari）的兼容性。',
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
		changes: ['新增：稀客羁绊奖励数据及其展示界面。', '修复：顾客套餐评级逻辑。'],
	},
	{
		version: 'v0.9',
		changes: [
			'新增：稀客套餐评级支持“黑暗物质”。',
			'新增：稀客符卡效果数据及其展示界面。',
			'新增：稀客、米斯蒂娅的角色和服装立绘。',
			'新增：部分场景下支持临时唤起新窗口查看料理、酒水或食材详情。',
			'新增：部分操作支持震动反馈。',
			'修复：动态计算已保存的顾客套餐的评级。',
			'修复：顾客套餐评级逻辑。',
		],
	},
] as const satisfies {
	version: `v${string}`;
	changes: `${string}：${string}。`[];
}[];

export default function ChangeLog() {
	return (
		<>
			<H1
				subTitle={
					<>
						以下为更新摘要，前往
						<Link
							isExternal
							showAnchorIcon
							href={`${links.github.href}/commits`}
							referrerPolicy="same-origin"
							title={`${links.github.label}提交记录`}
						>
							GitHub
						</Link>
						可以查看完整的提交记录。
					</>
				}
			>
				更新日志
			</H1>
			{changelog.map(({changes, version}, index) => (
				<Fragment key={index}>
					<H2 isFirst={index === 0}>{version}</H2>
					<Ul>
						{changes.map((change, changeIndex) => (
							<li key={changeIndex}>{change}</li>
						))}
					</Ul>
				</Fragment>
			))}
		</>
	);
}
