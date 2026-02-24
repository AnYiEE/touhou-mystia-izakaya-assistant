'use client';

import { Link, Tooltip } from '@/design/ui/components';

import { trackEvent } from '@/components/analytics';
import Heading from '@/components/heading';
import QRCode from '@/components/qrCode';

import { siteConfig } from '@/configs';

const { baseURL, enName, links, name, shortName } = siteConfig;

export default function Introduction() {
	return (
		<>
			<Heading isFirst>项目介绍</Heading>
			<div className="space-y-2 break-all text-justify indent-8">
				<p>
					“{name}”（英语：{enName}）网站（下文中称“本网站”或“
					{shortName}
					”）是由此
					<Link
						isExternal
						showAnchorIcon
						href={links.github.href}
						title={links.github.label}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Link',
								'about:GitHub'
							);
						}}
						className="rounded-small indent-0"
					>
						GitHub仓库
					</Link>
					所有者（下文中称“开发者”或“我”）
					为游戏《东方夜雀食堂》开发的辅助工具。
				</p>
				<p>
					{shortName}
					提供顾客图鉴（包括羁绊奖励和符卡效果查询）、搭配稀客和普客的料理套餐，以及料理（食谱）、酒水、食材、厨具、摆件、衣服和伙伴查询等功能，通过本网站（https://
					{baseURL}
					）以及现在或未来可能提供的其他网站、计算机软件、移动应用程序或其他类似的产品和服务，为
					{shortName}
					用户（下文中称“玩家”或“您”）的游玩过程提供相关信息和帮助。
				</p>
				<p>
					{shortName}
					中的数据直接提取自游戏《东方夜雀食堂》，因此在大多数情况下本网站所提供的信息是准确的。但受游戏版本迭代，以及开发、维护的频率和时效性等各方面因素的影响，本网站所提供的信息仍可能和游戏中的实际内容存在差异。请您知悉并以游戏内信息为准。
				</p>
				<p>
					如果{shortName}对您的游玩过程有所帮助，您可以考虑
					<Tooltip
						showArrow
						closeDelay={10}
						content={
							<QRCode text={links.donate.href} className="w-24">
								{links.donate.label.replace('链接', '码')}
							</QRCode>
						}
						offset={1}
						onOpenChange={(isOpen) => {
							if (isOpen) {
								trackEvent(
									trackEvent.category.show,
									'Tooltip',
									'about:Donate'
								);
							}
						}}
						classNames={{ content: 'px-1' }}
					>
						<Link
							isExternal
							showAnchorIcon
							href={links.donate.href}
							title={links.donate.label}
							onPress={() => {
								trackEvent(
									trackEvent.category.click,
									'Link',
									'about:Donate'
								);
							}}
							className="rounded-small indent-0"
						>
							向我捐赠
						</Link>
					</Tooltip>
					以支持{shortName}
					的开发和维护。但请注意，该捐赠仅为您个人的自愿行为，并非面向公众的募捐，仅构成平等主体之间的民事赠与关系，不附带任何物质或其他回报。
				</p>
			</div>
		</>
	);
}
