import {memo} from 'react';

import {Link} from '@nextui-org/react';

import H1 from '@/components/h1';
import H2 from '@/components/h2';
import Ul from '@/components/ul';

import {siteConfig} from '@/configs';

const {links} = siteConfig;

export default memo(function ChangeLog() {
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
							referrerPolicy="no-referrer"
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
			<H2 isFirst>v0.1</H2>
			<Ul>
				<li>新增：料理、酒水和食材页面。</li>
			</Ul>
			<H2>v0.2</H2>
			<Ul>
				<li>新增：稀客套餐搭配页面。</li>
				<li>新增：支持导出稀客套餐搭配数据。</li>
				<li>新增：支持作为渐进式网络应用程序安装。</li>
				<li>新增：支持离线访问。</li>
				<li>新增：自定义亮色主题“izakaya”。</li>
			</Ul>
			<H2>v0.3</H2>
			<Ul>
				<li>新增：普客套餐搭配页面。</li>
				<li>新增：稀客套餐评级功能。</li>
			</Ul>
			<H2>v0.4</H2>
			<Ul>
				<li>新增：搭配稀客套餐时，支持设置流行喜爱和流行厌恶标签。</li>
				<li>新增：作为渐进式网络应用程序安装后，提供常用功能的快捷方式。</li>
				<li>改善：无障碍（键盘导航）支持。</li>
				<li>修复：稀客套餐评级逻辑。</li>
			</Ul>
			<H2>v0.5</H2>
			<Ul>
				<li>新增：首次进入稀客套餐搭配页面时，展示使用教程。</li>
				<li>新增：主题切换器支持选择“跟随系统”。</li>
				<li>
					改善：与低版本环境（如：iOS 15以下版本系统上的浏览器、macOS系统上的15以下版本的Safari）的兼容性。
				</li>
				<li>修复：作为渐进式网络应用程序安装后，导航栏的部分按钮被窗口控件遮挡。</li>
				<li>修复：将菜谱来源纳入稀客套餐评级维度。</li>
			</Ul>
			<H2>v0.6</H2>
			<Ul>
				<li>新增：普客套餐评级功能。</li>
				<li>新增：部分稀客的喜爱料理标签可选择补充显示对应点单描述中的关键词以供参考。</li>
			</Ul>
			<H2>v0.7</H2>
			<Ul>
				<li>新增：设置页面。</li>
				<li>修复：顾客套餐评级逻辑。</li>
			</Ul>
			<H2>v0.8</H2>
			<Ul>
				<li>新增：稀客羁绊奖励数据及其展示界面。</li>
				<li>修复：顾客套餐评级逻辑。</li>
			</Ul>
			<H2>v0.9</H2>
			<Ul>
				<li>新增：稀客符卡效果数据及其展示界面。</li>
			</Ul>
		</>
	);
});
