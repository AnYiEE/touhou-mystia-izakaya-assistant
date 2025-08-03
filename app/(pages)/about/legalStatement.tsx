import { Link } from '@/design/ui/components';

import Heading from '@/components/heading';

import { siteConfig } from '@/configs';

const { links, shortName } = siteConfig;

export default function LegalStatement() {
	return (
		<>
			<Heading>法律声明</Heading>
			<div className="space-y-2 break-all text-justify indent-8">
				<p>
					以下法律声明适用于中华人民共和国（不含香港特别行政区、澳门特别行政区、台湾地区）以及
					{shortName}
					服务器所在地的相关法律、法规、政府规章和其他具有强制性的规定。
				</p>
				<p>
					在使用{shortName}
					前，请您仔细阅读并同意本法律声明的全部内容。如您不同意，请停止使用；如您继续使用，则视为您已接受本声明。
				</p>
				<p>
					作为开发者，我向您授予一项可撤销、不可转让、非独占的许可，允许您合法使用
					{shortName}
					。除非另有书面许可，本声明未明示授权的权利均由我保留。未行使权利并不构成对该权利的放弃或默示许可。同时，我保留在开发和运营
					{shortName}
					的过程中，所产生的所有数字资产、内容和相关知识产权的所有权，未经书面许可，您不得擅自使用。
				</p>
				<p>
					作为开发者，我无法保证{shortName}
					的内容在所有司法管辖区均合法。您在访问、使用、复制或传播
					{shortName}
					中的内容时，可能触及您所在司法管辖区的法律。我不对您因违法行为导致的后果承担任何责任。
				</p>
				<p>
					作为开发者，根据《中华人民共和国网络安全法》，我有义务监测、记录网络运行状况和安全事件，并保存服务器日志至少六个月（184日）。日志可能包括您的IP地址、访问时间、访问页面、浏览器信息和您在本网站的操作记录等。
				</p>
				<p>
					使用{shortName}并不意味您拥有
					{shortName}
					或其内所涉及的名称、商标、产品等的任何知识产权和所有权。除非您获得相关内容所有者的明确许可或法律许可，否则您不得非法使用
					{shortName}中的任何内容。请勿删除、隐藏或更改
					{shortName}上显示的或随{shortName}
					一同显示的任何条款、政策或法律声明。
					{shortName}
					内所涉及的名称、商标、产品等均为其各自所有者的资产，仅供识别。游戏素材版权均归
					<Link
						isExternal
						showAnchorIcon
						href={links.steam.href}
						title={links.steam.label}
						className="rounded-small indent-0"
					>
						原作者
					</Link>
					所有。
				</p>
				<p>
					{shortName}的源代码基于{links.gnuLicense.label}
					协议开源，协议
					<Link
						isExternal
						showAnchorIcon
						href={links.gnuLicense.href}
						title={links.gnuLicense.label}
						className="rounded-small indent-0"
					>
						见此
					</Link>
					，您可以在遵守该协议的前提下，自由使用所有公开内容。您也可以前往
					<Link
						isExternal
						showAnchorIcon
						href={links.github.href}
						title={links.github.label}
						className="rounded-small indent-0"
					>
						GitHub
					</Link>
					反馈任何问题、提出建议或发起合并请求。
				</p>
				<p>
					{shortName}
					始终在不断更改和改进，可能随时增加或删除功能，也可能暂停或彻底停止服务。我不为具体功能、可靠性、可用性或满足您需要的能力作任何承诺。某些司法管辖区域会规定特定保证，例如适销性、特定目的适用性或不侵权的默示保证。在法律允许的范围内，
					{shortName}排除所有保证。
				</p>
			</div>
		</>
	);
}
