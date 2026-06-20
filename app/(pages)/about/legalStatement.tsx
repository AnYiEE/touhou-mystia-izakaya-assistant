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
			<div className="space-y-4 break-all text-justify">
				<Heading as="h2" isFirst>
					总则
				</Heading>
				<p className="indent-8">
					以下法律声明适用于中华人民共和国境内（不含香港特别行政区、澳门特别行政区、台湾地区）以及
					{shortName}
					服务器实际所在地的相关法律、法规、政府规章和其他具有强制性的规定。本声明约束所有访问、使用
					{shortName}
					服务和内容的用户。如本声明与中华人民共和国以外司法辖区的强制性规则存在冲突，以该司法辖区的强制性规则为准，但本网站仍保留依据适用法律对服务进行限制或中止的权利。
				</p>
				<p className="indent-8">
					在使用{shortName}
					前，请您仔细阅读并同意本法律声明的全部内容。如您不同意，请停止使用；如您继续使用，则视为您接受本声明。
				</p>

				<Heading as="h2">账号相关</Heading>
				<Heading as="h3" isFirst>
					账号注册与个人信息收集
				</Heading>
				<p className="indent-8">
					当您注册{shortName}
					账号时，您需要提供用户名和密码，也可以选择设置昵称。用户名和昵称将会公开显示，密码在服务器端仅存储其不可逆的哈希摘要。此外，系统会在您登录时自动生成会话标识，并记录账号的创建时间、最近登录时间、登录失败次数和账号状态等必要信息。上述信息的收集基于您自愿注册账号的同意行为，且为实现账号服务功能（包括身份验证、会话管理、安全防护和密码找回等）所必需。
				</p>

				<Heading as="h3">账号安全与用户义务</Heading>
				<p className="indent-8">
					您有责任妥善保管您的账号凭据（用户名和密码），并对通过您账号发生的所有活动负责。如您发现账号存在未经授权的使用或安全漏洞，请及时通过
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
					反馈。作为开发者，我将采取合理的技术和管理措施保护您账号信息的安全，包括密码哈希存储、登录频率限制、CSRF防护以及会话安全管理，但无法保证绝对的安全。
				</p>

				<Heading as="h3">SSO授权与第三方数据共享</Heading>
				<p className="indent-8">
					{shortName}
					支持将您的账号身份通过单点登录（SSO）授权给外部应用或服务。当您同意授权时，外部应用将获得您的用户标识和账号状态信息，并可能据此提供个性化服务。
					{shortName}
					仅作为身份提供方，对外部应用如何使用所获得的信息不承担责任。您应自行评估外部应用的可信度后再决定是否授权。授权关系建立后，当您的账号状态发生变更（如被禁用或删除），
					{shortName}
					将主动通知已获得您授权的相关外部应用。您可以在账号设置中查看并撤销已授予的授权；撤销后外部应用将无法继续查询您的账号状态。注销账号也将自动解除所有已授予的授权。
				</p>

				<Heading as="h3">账号注销与数据留存</Heading>
				<p className="indent-8">
					您可以在登录后随时选择注销账号。注销后，您的用户名、密码哈希以及其他直接关联您个人身份的数据将被删除或不可逆地去标识化处理。您通过账号功能产生的套餐搭配数据等用户生成内容，如不涉及第三方权益或法定义务保留，也将在注销时一并清除。为履行网络安全法规定的日志留存义务以及防范安全事件的合理需要，部分服务器日志和经去标识化的安全记录可能会在法定期限内继续保留。
				</p>

				<Heading as="h3">Cookie与会话</Heading>
				<p className="indent-8">
					{shortName}
					使用必要的会话Cookie来维持您的登录状态和提供SSO授权流程中的安全上下文传递。会话Cookie在您退出登录或关闭浏览器后失效（受限于浏览器的实际行为）。SSO相关的临时上下文Cookie设置了较短的过期时间，并在授权完成后自动清除。
				</p>

				<Heading as="h3">未成年人保护</Heading>
				<p className="indent-8">
					{shortName}
					未对访问者年龄进行主动验证，亦不面向未成年人提供差异化服务。如您为未成年人，请在监护人知情并同意的前提下注册账号和使用本网站的各项功能（包括SSO授权和捐赠行为）。监护人应就未成年人使用本网站的行为承担指导和监督责任。
				</p>

				<Heading as="h2">网络安全与日志</Heading>
				<p className="indent-8">
					作为开发者，根据《中华人民共和国网络安全法》，我有义务采取技术措施监测和记录网络运行状态和安全事件，并保存服务器日志不少于六个月（184日）。日志可能包括您的IP地址、访问时间、访问页面、浏览器信息和您在本网站的操作记录等。上述信息仅用于网络安全维护和服务运行保障，以及依法履行监测义务，并在达到处理目的后依法删除或去标识化处理。此外，本网站使用自建分析系统所需的Cookie进行站点使用情况统计（如页面访问量），不涉及广告追踪或跨站行为画像。
				</p>

				<Heading as="h2">责任限制与免责</Heading>
				<p className="indent-8">
					作为开发者，我无法保证{shortName}
					的内容在所有司法管辖区均合法。您在访问、使用、复制或传播
					{shortName}
					中的内容时，可能触及您所在司法管辖区的法律规定。我不对您因违法使用本网站内容而导致的任何后果承担责任（法律规定不得免责的情形除外）。
				</p>
				<p className="indent-8">
					{shortName}
					始终在不断更改和改进，可能随时增加或删除功能，也可能暂停或彻底停止服务。我不为
					{shortName}
					的具体功能、可靠性、可用性或满足您需要的能力作任何承诺。某些司法管可能对适销性、特定用途适用性或不侵权等默示保证有法定要求。在法律允许的范围内，夜雀助手排除任何明示或默示保证。
				</p>
				<p className="indent-8">
					本网站仅作为个人兴趣项目，不提供任何有偿服务或附加权益。
				</p>

				<Heading as="h2">使用许可与知识产权</Heading>
				<p className="indent-8">
					作为开发者，我在此向您授予一项可撤销、不可转让、非独占的使用许可，仅用于合法访问、浏览本网站和基于本网站公开内容的非商业性参考用途。除非取得另行书面许可或内容另有明确标注，本声明未明示授权的权利均由我保留，未行使权利并不构成对该权利的放弃或默示许可。
					{shortName}
					开发和运营过程中产生的原创内容，包括页面设计、数据库结构、数据整理成果、原创文本、程序代码及其他数字资产的知识产权，除另有说明外，均归我所有或依法享有合法使用权。
				</p>
				<p className="indent-8">
					使用{shortName}并不意味您获得或拥有
					{shortName}
					或其内所涉及的名称、商标、产品等的任何权利和知识产权。除非获得相关权利人或法律的明确许可，否则您不得非法使用
					{shortName}中的任何内容。请勿删除、隐藏或更改
					{shortName}上显示的任何条款、政策或法律声明。
					{shortName}
					内所涉及的名称、商标、产品等均为各自权利人的资产，仅供识别。
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
				<p className="indent-8">
					{shortName}
					现收录部分第三方Mod项目内容。相关Mod内容为基于原作的非官方同人二次创作，其版权结构可能同时涉及原作著作权方权利、Mod项目原创资源权利以及Mod中包含的其他第三方资源。
					{shortName}
					不对第三方Mod项目内容主张任何权利。对于第三方Mod项目中明确声明不属于其原创或授权范围的资源，其相关权利仍归原权利人所有。
					{shortName}
					未对该类资源授予任何再分发或二次创作许可，您在使用、复制或传播相关内容时，应自行确认其行为符合原权利人的授权范围。除上述明确排除的内容外，第三方Mod项目原创资源的许可适用其项目自身声明的协议。您如需使用该等原创资源，应遵守对应许可条款。具体权利义务以相关项目在对应版本发布时所附版权声明为准。如对某一文件的版权状态存在疑问，应视为不属于默认授权范围，除非存在明确许可标注。
				</p>
				<p className="indent-8">
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
			</div>
		</>
	);
}
