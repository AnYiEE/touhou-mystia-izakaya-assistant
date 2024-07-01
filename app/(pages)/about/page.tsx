import {memo} from 'react';

import {Link} from '@nextui-org/react';

import DataManager from './dataManager';
import H1 from './h1';

import {siteConfig} from '@/configs';

const {description, name, shortName, links} = siteConfig;

export default memo(function About() {
	return (
		<div>
			<H1 isFirst>项目介绍</H1>
			<div className="flex flex-col gap-2 break-all indent-8 leading-6">
				<p>{description}</p>
				<p>
					使用{name}（以下简称“{shortName}”）并不意味您拥有
					{shortName}
					或其内所涉及的公司名称、商标、产品等的任何知识产权和所有权。除非您获得相关内容所有者的明确许可或法律许可，否则您不得非法使用
					{shortName}中的任何内容。请勿删除、隐藏或更改
					{shortName}上显示的或随{shortName}一同显示的任何条款、政策或法律声明。
					{shortName}
					内所涉及的公司名称、商标、产品等均为其各自所有者的资产，仅供识别。游戏素材版权均归
					<Link isExternal href={links.steam.href} title={links.steam.label} className="contents">
						原作者
					</Link>
					所有。
				</p>
				<p>
					{shortName}的源代码基于GNU General Public License v3.0协议或其更新版本开源，协议
					<Link
						isExternal
						href={links.steam.href}
						title="The GNU General Public License v3.0"
						className="contents"
					>
						见此
					</Link>
					，您可以在遵守该协议的前提下自由使用所有公开内容。您也可以前往
					<Link isExternal href={links.github.href} title={links.github.label} className="contents">
						Github
					</Link>
					反馈任何问题、提出建议或发起合并请求。
				</p>
				<p>
					{shortName}
					中的数据主要来自于游戏官方QQ群中的“《东方夜雀食堂》大词典（缩印本）第四版·第1次修订.xlsx”、“夜雀食堂菜肴、酒水、普客、steam成就词典（截至DLC4）
					.xls”等几份文件。由于数据核对程度、游戏版本迭代等各方面因素，{shortName}
					所提供的信息可能与现时游戏中的信息存在差异，敬请知悉，并以游戏中的信息为准。
				</p>
				<p>
					如果{shortName}对您的游玩过程有所帮助，您可以考虑
					<Link isExternal href={links.donate.href} title={links.donate.label} className="contents">
						向我捐赠
					</Link>
					。但请您注意，这仅是捐赠，无论捐赠与否都不会影响您使用{shortName}的体验。{shortName}
					始终在不断更改和改进，可能随时增加或删除功能，也可能暂停或彻底停止服务。无论您捐赠与否，{shortName}
					都不为具体功能、可靠性、可用性或满足您需要的能力作任何承诺。某些司法管辖区域会规定特定保证，例如适销性、特定目的适用性及不侵权的默示保证。在法律允许的范围内，
					{shortName}排除所有保证。
				</p>
			</div>
			<H1>已知问题</H1>
			<ul className="flex list-inside list-decimal flex-col gap-2">
				<li>
					表格无法排序多个列：
					<Link isExternal showAnchorIcon href="https://github.com/nextui-org/nextui/issues/2282">
						issue#2282
					</Link>
				</li>
				<li>
					表格点击排序后默认升序：NextUI的
					<Link isExternal showAnchorIcon href="https://nextui.org/docs/components/table#api">
						Table组件
					</Link>
					尚未提供相关设置项
				</li>
			</ul>
			<DataManager />
		</div>
	);
});
