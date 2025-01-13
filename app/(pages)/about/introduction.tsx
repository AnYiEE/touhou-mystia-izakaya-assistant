import {Link, Tooltip} from '@/design/ui/components';

import Heading from '@/components/heading';
import QRCode from '@/components/qrCode';

import {siteConfig} from '@/configs';

const {domain, enName, links, name, shortName} = siteConfig;

export default function Introduction() {
	return (
		<>
			<Heading isFirst>项目介绍</Heading>
			<div className="space-y-2 break-all text-justify indent-8">
				<p>
					“{name}”（英语：{enName}）网站（下文中称“本网站”或“{shortName}
					”）是由此
					<Link
						isExternal
						showAnchorIcon
						href={links.github.href}
						title={links.github.label}
						className="rounded-small indent-0 font-medium"
					>
						GitHub仓库
					</Link>
					所有者（下文中称“开发者”或“我”） 为游戏《东方夜雀食堂》开发的辅助工具。
				</p>
				<p>
					{shortName}
					提供顾客图鉴（包括羁绊奖励和符卡效果查询）、搭配稀客和普客的料理套餐，以及料理（食谱）、酒水、食材、厨具、摆件、衣服和伙伴查询等功能，通过本网站（https://
					{domain}
					）、现在或未来可能提供的其他网站、计算机软件、移动应用程序、其他类似产品或服务，为{shortName}
					用户（下文中称“玩家”或“您”）的游玩过程提供帮助。
				</p>
				<p>
					{shortName}
					中的数据直接提取自游戏《东方夜雀食堂》，故在大多数情况下，本网站所提供的信息是准确无误的。但受游戏版本迭代，以及开发、维护的频率和时效性等各方面因素的影响，本网站所提供的信息仍可能和现时游戏中的信息存在差异，敬请知悉，并以游戏中的信息为准。
				</p>
				<p>
					如果{shortName}对您的游玩过程有所帮助，您可以考虑
					<Tooltip
						showArrow
						content={
							<QRCode text={links.donate.href} className="w-24">
								{links.donate.label.replace('链接', '码')}
							</QRCode>
						}
						classNames={{
							content: 'px-1',
						}}
					>
						<Link
							isExternal
							showAnchorIcon
							href={links.donate.href}
							title={links.donate.label}
							className="rounded-small indent-0 font-medium"
						>
							向我捐赠
						</Link>
					</Tooltip>
					以支持{shortName}
					的开发和维护。但请注意，这仅是个人求助行为，而非公开募捐，属于一般的民事赠与行为，仅构成平等主体之间的民事法律关系。
				</p>
			</div>
		</>
	);
}
