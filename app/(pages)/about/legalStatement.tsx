'use client';

import { Link } from '@/design/ui/components';

import { trackEvent } from '@/components/analytics';
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
					作为开发者，我向您授予一项可撤销、不可转让、非独占的许可，仅允许您合法访问和使用
					{shortName}
					及其公开内容。除非另有书面许可，本声明未明示授权的权利均由我保留，未行使权利并不构成对该权利的放弃或默示许可。
					{shortName}
					在开发和运营过程中产生的页面结构设计、数据库结构、数据整理成果、文本说明、原创标注内容、前端与后端程序代码及其他数字资产的知识产权，除另有说明外，均归开发者所有或依法享有合法使用权。
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
					使用{shortName}并不意味您获得或拥有
					{shortName}
					或其内所涉及的名称、商标、产品等的任何权利和知识产权。除非获得相关内容所有者的明确许可或法律许可，否则您不得非法使用
					{shortName}中的任何内容。请勿删除、隐藏或更改
					{shortName}上显示的或随{shortName}
					一同显示的任何条款、政策或法律声明。
					{shortName}
					内所涉及的名称、商标、产品等均为其各自所有者的资产，仅供识别。
					{shortName}
					内所展示的游戏原始素材，包括但不限于图像素材、设定文本及相关标识，其著作权及其他相关权利归
					<Link
						isExternal
						showAnchorIcon
						href={links.steam.href}
						title={links.steam.label}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Link',
								'about:Steam'
							);
						}}
						className="rounded-small indent-0"
					>
						原作者
					</Link>
					所有，{shortName}
					的开发者已获得来自相关著作权人的非商业使用授权，仅用于识别、展示和说明用途。
				</p>
				<p>
					{shortName}
					现收录部分第三方Mod项目内容。相关Mod内容为基于原作的非官方同人二次创作，其版权结构可能同时涉及原作著作权方权利、Mod项目原创资源权利以及Mod中包含但不属于其原创授权范围的资源。
					{shortName}
					不对第三方Mod项目内容主张任何权利。对于第三方Mod项目中明确声明不属于其原创或授权范围的资源，其相关权利仍归原权利人所有。
					{shortName}
					不对该类资源授予任何再分发或二次创作许可，您在使用、复制或传播相关内容时，应自行确认其行为符合原权利人的授权范围。除上述明确排除的内容外，第三方Mod项目原创资源的许可适用其项目自身声明的协议。您如需使用该等原创资源，应遵守对应许可条款。具体权利义务以相关项目在对应版本发布时所附版权声明为准。如对某一文件的版权状态存在疑问，应视为不属于默认授权范围，除非存在明确许可标注。
				</p>
				<p>
					{shortName}的源代码基于{links.gnuLicense.label}
					协议开源，协议
					<Link
						isExternal
						showAnchorIcon
						href={links.gnuLicense.href}
						title={links.gnuLicense.label}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Link',
								'License'
							);
						}}
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
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Link',
								'about:GitHub'
							);
						}}
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
