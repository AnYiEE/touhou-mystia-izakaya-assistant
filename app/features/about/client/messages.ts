import type { TLocalizedMessageTable } from '@/shared/i18n/messages';

const ABOUT_MESSAGES_ZH_CN = {
	'about.changelog.commitsLink': 'GitHub',
	'about.changelog.commitsTitle': '{source}提交记录',
	'about.changelog.subTitle.prefix': '以下为更新摘要，前往',
	'about.changelog.subTitle.suffix': '可以查看完整的提交记录。',
	'about.changelog.title': '更新日志',
	'about.introduction.donateLink': '向我捐赠',
	'about.introduction.githubLink': 'GitHub仓库',
	'about.introduction.p1.prefix':
		'“{name}”（英语：{enName}）网站（下文中称“本网站”或“{shortName}”）是由此',
	'about.introduction.p1.suffix':
		'所有者（下文中称“开发者”或“我”）为游戏《东方夜雀食堂》开发的辅助工具。',
	'about.introduction.p2':
		'{shortName}提供顾客图鉴（包括羁绊奖励和符卡效果查询）、搭配稀客和普客的料理套餐，以及料理（食谱）、酒水、食材、厨具、摆件、衣服、伙伴、货币、道具、唱片、垂钓收藏和徽章查询等功能，通过本网站（https://{baseURL}）以及现在或未来可能提供的其他网站、计算机软件、移动应用程序或其他类似的产品和服务，为{shortName}用户（下文中称“玩家”或“您”）的游玩过程提供相关信息和帮助。',
	'about.introduction.p3':
		'{shortName}还提供账号系统，您可以通过注册账号来使用云备份套餐搭配数据、在多个设备间同步数据等功能。账号系统支持通过用户名和密码登录，并提供会话管理、密码修改、账号注销等基础账号功能。',
	'about.introduction.p4':
		'此外，{shortName}实现了轻量级单点登录（SSO）能力，允许外部应用或服务请求您的授权以获取您的{shortName}账号身份。您可以在授权页面自主决定是否授权；授权后可在账号设置中随时撤销已授予的授权。',
	'about.introduction.p5':
		'{shortName}中的数据直接提取自游戏《东方夜雀食堂》，因此在大多数情况下本网站所提供的信息是准确的。但受游戏版本迭代，以及开发、维护的频率和时效性等各方面因素的影响，本网站所提供的信息仍可能和游戏中的实际内容存在差异。请您知悉并以游戏内信息为准。',
	'about.introduction.p6.prefix':
		'如果{shortName}对您的游玩过程有所帮助，您可以考虑',
	'about.introduction.p6.suffix':
		'以支持{shortName}的开发和维护。但请注意，该捐赠仅为您个人的自愿行为，并非面向公众的募捐，仅构成平等主体之间的民事赠与关系，不附带任何物质或其他回报。',
	'about.introduction.title': '项目介绍',
	'about.legal.account.cookie.p1':
		'{shortName}使用必要的会话Cookie来维持您的登录状态和提供SSO授权流程中的安全上下文传递。会话Cookie在您退出登录或关闭浏览器后失效（受限于浏览器的实际行为）。SSO相关的临时上下文Cookie设置了较短的过期时间，并在授权完成后自动清除。',
	'about.legal.account.cookie.title': 'Cookie与会话',
	'about.legal.account.deletion.p1':
		'您可以在登录后随时选择注销账号。注销后，您的用户名、密码哈希以及其他直接关联您个人身份的数据将被删除或不可逆地去标识化处理。您通过账号功能产生的套餐搭配数据等用户生成内容，如不涉及第三方权益或法定义务保留，也将在注销时一并清除。为履行网络安全法规定的日志留存义务以及防范安全事件的合理需要，部分服务器日志和经去标识化的安全记录可能会在法定期限内继续保留。',
	'about.legal.account.deletion.title': '账号注销与数据留存',
	'about.legal.account.minor.p1':
		'{shortName}未对访问者年龄进行主动验证，亦不面向未成年人提供差异化服务。如您为未成年人，请在监护人知情并同意的前提下注册账号和使用本网站的各项功能（包括SSO授权和捐赠行为）。监护人应就未成年人使用本网站的行为承担指导和监督责任。',
	'about.legal.account.minor.title': '未成年人保护',
	'about.legal.account.register.p1':
		'当您注册{shortName}账号时，您需要提供用户名和密码，也可以选择设置昵称。用户名和昵称将会公开显示，密码在服务器端仅存储其不可逆的哈希摘要。此外，系统会在您登录时自动生成会话标识，并记录账号的创建时间、最近登录时间、登录失败次数和账号状态等必要信息。上述信息的收集基于您自愿注册账号的同意行为，且为实现账号服务功能（包括身份验证、会话管理、安全防护和密码找回等）所必需。',
	'about.legal.account.register.title': '账号注册与个人信息收集',
	'about.legal.account.security.p1.prefix':
		'您有责任妥善保管您的账号凭据（用户名和密码），并对通过您账号发生的所有活动负责。如您发现账号存在未经授权的使用或安全漏洞，请及时通过',
	'about.legal.account.security.p1.suffix':
		'反馈。作为开发者，我将采取合理的技术和管理措施保护您账号信息的安全，包括密码哈希存储、登录频率限制、CSRF防护以及会话安全管理，但无法保证绝对的安全。',
	'about.legal.account.security.title': '账号安全与用户义务',
	'about.legal.account.sso.p1':
		'{shortName}支持将您的账号身份通过单点登录（SSO）授权给外部应用或服务。当您同意授权时，外部应用将获得您的用户标识和账号状态信息，并可能据此提供个性化服务。{shortName}仅作为身份提供方，对外部应用如何使用所获得的信息不承担责任。您应自行评估外部应用的可信度后再决定是否授权。授权关系建立后，当您的账号状态发生变更（如被禁用或删除），{shortName}将主动通知已获得您授权的相关外部应用。您可以在账号设置中查看并撤销已授予的授权；撤销后外部应用将无法继续查询您的账号状态。注销账号也将自动解除所有已授予的授权。',
	'about.legal.account.sso.title': 'SSO授权与第三方数据共享',
	'about.legal.account.title': '账号相关',
	'about.legal.general.p1':
		'以下法律声明适用于中华人民共和国境内（不含香港特别行政区、澳门特别行政区、台湾地区）以及{shortName}服务器实际所在地的相关法律、法规、政府规章和其他具有强制性的规定。本声明约束所有访问、使用{shortName}服务和内容的用户。如本声明与中华人民共和国以外司法辖区的强制性规则存在冲突，以该司法辖区的强制性规则为准，但本网站仍保留依据适用法律对服务进行限制或中止的权利。',
	'about.legal.general.p2':
		'在使用{shortName}前，请您仔细阅读并同意本法律声明的全部内容。如您不同意，请停止使用；如您继续使用，则视为您接受本声明。',
	'about.legal.general.title': '总则',
	'about.legal.liability.p1':
		'作为开发者，我无法保证{shortName}的内容在所有司法管辖区均合法。您在访问、使用、复制或传播{shortName}中的内容时，可能触及您所在司法管辖区的法律规定。我不对您因违法使用本网站内容而导致的任何后果承担责任（法律规定不得免责的情形除外）。',
	'about.legal.liability.p2':
		'{shortName}始终在不断更改和改进，可能随时增加或删除功能，也可能暂停或彻底停止服务。我不为{shortName}的具体功能、可靠性、可用性或满足您需要的能力作任何承诺。某些司法管可能对适销性、特定用途适用性或不侵权等默示保证有法定要求。在法律允许的范围内，夜雀助手排除任何明示或默示保证。',
	'about.legal.liability.p3':
		'本网站仅作为个人兴趣项目，不提供任何有偿服务或附加权益。',
	'about.legal.liability.title': '责任限制与免责',
	'about.legal.license.p1':
		'作为开发者，我在此向您授予一项可撤销、不可转让、非独占的使用许可，仅用于合法访问、浏览本网站和基于本网站公开内容的非商业性参考用途。除非取得另行书面许可或内容另有明确标注，本声明未明示授权的权利均由我保留，未行使权利并不构成对该权利的放弃或默示许可。{shortName}开发和运营过程中产生的原创内容，包括页面设计、数据库结构、数据整理成果、原创文本、程序代码及其他数字资产的知识产权，除另有说明外，均归我所有或依法享有合法使用权。',
	'about.legal.license.p2':
		'使用{shortName}并不意味您获得或拥有{shortName}或其内所涉及的名称、商标、产品等的任何权利和知识产权。除非获得相关权利人或法律的明确许可，否则您不得非法使用{shortName}中的任何内容。请勿删除、隐藏或更改{shortName}上显示的任何条款、政策或法律声明。{shortName}内所涉及的名称、商标、产品等均为各自权利人的资产，仅供识别。{shortName}内所展示的游戏原始素材，包括但不限于图像素材、设定文本及相关标识，其著作权及其他相关权利归',
	'about.legal.license.p2.suffix':
		'所有，{shortName}的开发者已获得来自相关著作权人的非商业使用授权，仅用于识别、展示和说明用途。',
	'about.legal.license.p3':
		'{shortName}现收录部分第三方Mod项目内容。相关Mod内容为基于原作的非官方同人二次创作，其版权结构可能同时涉及原作著作权方权利、Mod项目原创资源权利以及Mod中包含的其他第三方资源。{shortName}不对第三方Mod项目内容主张任何权利。对于第三方Mod项目中明确声明不属于其原创或授权范围的资源，其相关权利仍归原权利人所有。{shortName}未对该类资源授予任何再分发或二次创作许可，您在使用、复制或传播相关内容时，应自行确认其行为符合原权利人的授权范围。除上述明确排除的内容外，第三方Mod项目原创资源的许可适用其项目自身声明的协议。您如需使用该等原创资源，应遵守对应许可条款。具体权利义务以相关项目在对应版本发布时所附版权声明为准。如对某一文件的版权状态存在疑问，应视为不属于默认授权范围，除非存在明确许可标注。',
	'about.legal.license.p4.link': '原作者',
	'about.legal.license.p5.licenseLink': '见此',
	'about.legal.license.p5.middle':
		'，您可以在遵守该协议的前提下，自由使用所有公开内容。您也可以前往',
	'about.legal.license.p5.prefix':
		'{shortName}的源代码基于{license}协议开源，协议',
	'about.legal.license.p5.suffix': '反馈任何问题、提出建议或发起合并请求。',
	'about.legal.license.title': '使用许可与知识产权',
	'about.legal.network.p1':
		'作为开发者，根据《中华人民共和国网络安全法》，我有义务采取技术措施监测和记录网络运行状态和安全事件，并保存服务器日志不少于六个月（184日）。日志可能包括您的IP地址、访问时间、访问页面、浏览器信息和您在本网站的操作记录等。上述信息仅用于网络安全维护和服务运行保障，以及依法履行监测义务，并在达到处理目的后依法删除或去标识化处理。此外，本网站使用自建分析系统所需的Cookie进行站点使用情况统计（如页面访问量），不涉及广告追踪或跨站行为画像。',
	'about.legal.network.title': '网络安全与日志',
	'about.legal.securityLink': 'GitHub',
	'about.legal.title': '法律声明',
} as const;

export type TAboutMessageKey = keyof typeof ABOUT_MESSAGES_ZH_CN;

export const aboutMessages = {
	en: {
		'about.changelog.commitsLink': 'GitHub',
		'about.changelog.commitsTitle': '{source} commit history',
		'about.changelog.subTitle.prefix':
			'The following is a summary of updates; visit',
		'about.changelog.subTitle.suffix': 'to view the full commit history.',
		'about.changelog.title': 'Changelog',
		'about.introduction.donateLink': 'Donate to me',
		'about.introduction.githubLink': 'GitHub repository',
		'about.introduction.p1.prefix':
			'The “{name}” website (hereafter “this website” or “{shortName}”) is an assistant tool developed by the owner of this',
		'about.introduction.p1.suffix': 'for the game Touhou Mystia’s Izakaya.',
		'about.introduction.p2':
			'{shortName} provides a guest encyclopedia (including bond rewards and spell card effects), meal pairings for special and normal guests, and lookups for foods (recipes), beverages, ingredients, cookers, decorations, clothes, partners, currency, items, records, fishing collectibles, and badges, offering information and help for {shortName} users (hereafter “players” or “you”) through this website (https://{baseURL}) as well as other websites, computer software, mobile applications, or similar products and services that may be offered now or in the future.',
		'about.introduction.p3':
			'{shortName} also provides an account system: by registering an account, you can use cloud backups of meal pairing data and sync data across multiple devices. The account system supports username and password sign-in and provides basic account features such as session management, password changes, and account deletion.',
		'about.introduction.p4':
			'In addition, {shortName} implements lightweight single sign-on (SSO), allowing external applications or services to request your authorization to obtain your {shortName} account identity. You can decide whether to authorize on the consent page; after authorization, you can revoke granted authorizations at any time in your account settings.',
		'about.introduction.p5':
			'The data in {shortName} is extracted directly from the game Touhou Mystia’s Izakaya, so in most cases the information provided by this website is accurate. However, due to game version updates and the frequency and timeliness of development and maintenance, the information provided by this website may still differ from the actual content in the game. Please be aware of this and refer to in-game information as the standard.',
		'about.introduction.p6.prefix':
			'If {shortName} is helpful for your play, you may consider',
		'about.introduction.p6.suffix':
			'to support the development and maintenance of {shortName}. Please note that this donation is a voluntary personal act, not a public fundraising campaign; it only constitutes a civil gift between equal parties and carries no material or other return.',
		'about.introduction.title': 'About the project',
		'about.legal.account.cookie.p1':
			'{shortName} uses necessary session cookies to keep you signed in and to pass the security context during the SSO authorization flow. Session cookies expire after you sign out or close the browser (subject to the browser’s actual behavior). Temporary SSO context cookies have short expiration times and are cleared automatically once authorization completes.',
		'about.legal.account.cookie.title': 'Cookies and sessions',
		'about.legal.account.deletion.p1':
			'You may delete your account at any time after signing in. After deletion, your username, password hash, and other data directly linked to your personal identity will be deleted or irreversibly de-identified. User-generated content produced through account features, such as meal pairing data, will also be cleared upon deletion unless it involves third-party rights or a legal retention obligation. To fulfill log retention obligations under cybersecurity law and to reasonably prevent security incidents, some server logs and de-identified security records may be retained within the statutory period.',
		'about.legal.account.deletion.title':
			'Account deletion and data retention',
		'about.legal.account.minor.p1':
			'{shortName} does not actively verify visitors’ age and does not provide differentiated services for minors. If you are a minor, please register an account and use the features of this website (including SSO authorization and donations) only with the knowledge and consent of your guardian. Guardians should provide guidance and supervision for minors’ use of this website.',
		'about.legal.account.minor.title': 'Protection of minors',
		'about.legal.account.register.p1':
			'When you register a {shortName} account, you need to provide a username and password, and you may optionally set a nickname. The username and nickname will be publicly displayed; the password is stored on the server only as an irreversible hash digest. In addition, the system automatically generates a session identifier when you sign in and records necessary information such as the account creation time, last sign-in time, failed sign-in count, and account status. This information is collected based on your consent through voluntary registration and is necessary to provide account service functions (including authentication, session management, security protection, and password recovery).',
		'about.legal.account.register.title':
			'Account registration and personal information collection',
		'about.legal.account.security.p1.prefix':
			'You are responsible for keeping your account credentials (username and password) safe and for all activity that occurs through your account. If you discover unauthorized use of your account or a security vulnerability, please report it promptly via',
		'about.legal.account.security.p1.suffix':
			'. As the developer, I will take reasonable technical and administrative measures to protect your account information, including password hash storage, sign-in rate limiting, CSRF protection, and session security management, but I cannot guarantee absolute security.',
		'about.legal.account.security.title':
			'Account security and user obligations',
		'about.legal.account.sso.p1':
			'{shortName} supports authorizing your account identity to external applications or services through single sign-on (SSO). When you consent, the external application will receive your user identifier and account status information and may provide personalized services based on them. {shortName} acts only as an identity provider and is not responsible for how external applications use the information obtained. You should evaluate the trustworthiness of external applications before deciding whether to authorize. Once authorization is established, if your account status changes (such as being disabled or deleted), {shortName} will proactively notify the relevant external applications that have received your authorization. You can view and revoke granted authorizations in your account settings; after revocation, external applications can no longer query your account status. Deleting your account will also automatically terminate all granted authorizations.',
		'about.legal.account.sso.title':
			'SSO authorization and third-party data sharing',
		'about.legal.account.title': 'Accounts',
		'about.legal.general.p1':
			'The following legal statement applies to the laws, regulations, government rules, and other mandatory provisions of the People’s Republic of China (excluding the Hong Kong SAR, the Macao SAR, and the Taiwan region) as well as the jurisdiction where the {shortName} server is actually located. This statement binds all users who access or use {shortName} services and content. If this statement conflicts with mandatory rules of a jurisdiction outside the People’s Republic of China, the mandatory rules of that jurisdiction prevail, but this website still reserves the right to restrict or suspend services in accordance with applicable law.',
		'about.legal.general.p2':
			'Before using {shortName}, please read carefully and agree to the entire content of this legal statement. If you do not agree, please stop using it; if you continue to use it, you are deemed to accept this statement.',
		'about.legal.general.title': 'General provisions',
		'about.legal.liability.p1':
			'As the developer, I cannot guarantee that the content of {shortName} is legal in all jurisdictions. Accessing, using, copying, or distributing content in {shortName} may implicate the laws of your jurisdiction. I am not liable for any consequences caused by your unlawful use of this website’s content (except where liability cannot be excluded by law).',
		'about.legal.liability.p2':
			'{shortName} is constantly changing and improving; features may be added or removed at any time, and services may be suspended or terminated entirely. I make no commitment regarding the specific features, reliability, availability, or fitness for your needs of {shortName}. Some jurisdictions may have statutory requirements for implied warranties such as merchantability, fitness for a particular purpose, or non-infringement. To the extent permitted by law, Mystia’s Izakaya Assistant excludes any express or implied warranties.',
		'about.legal.liability.p3':
			'This website is a personal hobby project and provides no paid services or additional benefits.',
		'about.legal.liability.title':
			'Limitation of liability and disclaimers',
		'about.legal.license.p1':
			'As the developer, I grant you a revocable, non-transferable, non-exclusive license solely for lawful access to and browsing of this website and non-commercial reference based on its public content. Unless separately licensed in writing or explicitly marked otherwise, all rights not expressly granted by this statement are reserved by me, and failure to exercise a right does not constitute a waiver or implied license. The original content produced during the development and operation of {shortName}, including page designs, database structures, data compilation results, original text, program code, and other digital assets, is owned by me or lawfully used by me unless otherwise stated.',
		'about.legal.license.p2':
			'Using {shortName} does not mean you acquire or own any rights or intellectual property in {shortName} or the names, trademarks, products, and the like involved in it. Unless explicitly permitted by the relevant rights holders or the law, you must not unlawfully use any content in {shortName}. Do not delete, hide, or modify any terms, policies, or legal statements displayed on {shortName}. Names, trademarks, products, and the like involved in {shortName} are the assets of their respective rights holders and are used for identification only. The copyright and other related rights of the original game assets displayed in {shortName}, including but not limited to image assets, setting texts, and related marks, belong to',
		'about.legal.license.p2.suffix':
			'. The developer of {shortName} has obtained non-commercial use authorization from the relevant copyright holders for identification, display, and explanation purposes only.',
		'about.legal.license.p3':
			'{shortName} currently includes content from some third-party mod projects. Such mod content is unofficial fan-made derivative work based on the original work, and its copyright structure may involve the rights of the original work’s copyright holders, the rights in the mod project’s original resources, and other third-party resources included in the mod. {shortName} claims no rights over third-party mod project content. For resources that a third-party mod project explicitly states are not its original creation or within its authorization, the related rights remain with the original rights holders. {shortName} grants no redistribution or derivative-work permission for such resources; when using, copying, or distributing related content, you should confirm on your own that your conduct complies with the original rights holders’ authorization scope. Except for the content explicitly excluded above, the licensing of a third-party mod project’s original resources is governed by the terms declared by that project itself. If you wish to use such original resources, you should comply with the corresponding license terms. Specific rights and obligations are subject to the copyright notices attached to the relevant project at the corresponding release version. If the copyright status of a file is in doubt, it should be regarded as outside the default authorization scope unless there is an explicit license notice.',
		'about.legal.license.p4.link': 'the original creators',
		'about.legal.license.p5.licenseLink': 'see here',
		'about.legal.license.p5.middle':
			'. You may freely use all public content as long as you comply with that license. You may also visit',
		'about.legal.license.p5.prefix':
			'The source code of {shortName} is open-sourced under the {license} license; for the license,',
		'about.legal.license.p5.suffix':
			'to report any issues, make suggestions, or open merge requests.',
		'about.legal.license.title': 'Usage license and intellectual property',
		'about.legal.network.p1':
			'As the developer, under the Cybersecurity Law of the People’s Republic of China, I am obliged to take technical measures to monitor and record network operation status and security incidents and to keep server logs for no less than six months (184 days). Logs may include your IP address, access time, pages visited, browser information, and your operation records on this website. This information is used only for network security maintenance, service operation assurance, and fulfilling monitoring obligations under the law, and will be deleted or de-identified in accordance with the law once the processing purposes are achieved. In addition, this website uses cookies required by a self-built analytics system to compile site usage statistics (such as page views), without advertising tracking or cross-site behavioral profiling.',
		'about.legal.network.title': 'Cybersecurity and logs',
		'about.legal.securityLink': 'GitHub',
		'about.legal.title': 'Legal statement',
	},
	ja: {
		'about.changelog.commitsLink': 'GitHub',
		'about.changelog.commitsTitle': '{source}のコミット履歴',
		'about.changelog.subTitle.prefix': '以下は更新概要です。',
		'about.changelog.subTitle.suffix':
			'で完全なコミット履歴を確認できます。',
		'about.changelog.title': '更新履歴',
		'about.introduction.donateLink': '支援する',
		'about.introduction.githubLink': 'GitHubリポジトリ',
		'about.introduction.p1.prefix':
			'「{name}」（英語：{enName}）ウェブサイト（以下「本サイト」または「{shortName}」）は、この',
		'about.introduction.p1.suffix':
			'の所有者（以下「開発者」または「私」）がゲーム『東方夜雀食堂』のために開発した補助ツールです。',
		'about.introduction.p2':
			'{shortName}は、お客様図鑑（絆報酬やスペルカード効果の検索を含む）、レア客・一般客に合う料理セット、料理（レシピ）、お酒、食材、調理器具、置物、衣装、仲間、通貨、アイテム、レコード、釣りコレクション、バッジの検索などの機能を提供し、本サイト（https://{baseURL}）および現在または将来提供される可能性のあるその他のウェブサイト、ソフトウェア、モバイルアプリ等を通じて、{shortName}のユーザー（以下「プレイヤー」または「あなた」）のプレイに情報とサポートを提供します。',
		'about.introduction.p3':
			'{shortName}はアカウントシステムも提供します。アカウントを登録すると、セットメニュー構成データのクラウドバックアップや複数端末間のデータ同期などを利用できます。アカウントシステムはユーザー名とパスワードでのログインに対応し、セッション管理、パスワード変更、アカウント削除などの基本機能を提供します。',
		'about.introduction.p4':
			'さらに{shortName}は軽量なシングルサインオン（SSO）を実装しており、外部アプリやサービスがあなたの{shortName}アカウント身分の認可を要求できます。認可ページで承認するかどうかを自分で決められ、認可後はアカウント設定でいつでも解除できます。',
		'about.introduction.p5':
			'{shortName}のデータはゲーム『東方夜雀食堂』から直接抽出しているため、ほとんどの場合、本サイトの情報は正確です。ただし、ゲームのバージョン更新や開発・保守の頻度と即時性などの影響により、本サイトの情報がゲーム内の実際の内容と異なる場合があります。あらかじめご了承のうえ、ゲーム内の情報を優先してください。',
		'about.introduction.p6.prefix':
			'{shortName}があなたのプレイに役立ったなら、',
		'about.introduction.p6.suffix':
			'ことで{shortName}の開発と保守を支援できます。ただし、この寄付はあなた個人の自発的な行為であり、公募ではなく、対等な当事者間の民事贈与にすぎず、いかなる物資やその他の見返りも伴いません。',
		'about.introduction.title': 'プロジェクト紹介',
		'about.legal.account.cookie.p1':
			'{shortName}は、ログイン状態を維持し、SSO認可フローにおけるセキュリティコンテキストを受け渡すために、必要なセッションCookieを使用します。セッションCookieはログアウトまたはブラウザを閉じると失効します（ブラウザの実際の動作に依存します）。SSO関連の一時コンテキストCookieは有効期限を短く設定し、認可完了後に自動的に削除されます。',
		'about.legal.account.cookie.title': 'Cookieとセッション',
		'about.legal.account.deletion.p1':
			'ログイン後はいつでもアカウントを削除できます。削除後、ユーザー名、パスワードハッシュ、その他あなたの個人身分に直接関連するデータは削除または不可逆的に匿名化されます。アカウント機能を通じて生成されたセットメニュー構成データなどのユーザー生成コンテンツも、第三者の権益や法的な保存義務に関係しない限り、削除時にあわせて消去されます。サイバーセキュリティ法に定められたログ保存義務の履行およびセキュリティインシデント防止の合理的な必要のため、一部のサーバーログと匿名化されたセキュリティ記録は法定期間内保持される場合があります。',
		'about.legal.account.deletion.title': 'アカウント削除とデータ保持',
		'about.legal.account.minor.p1':
			'{shortName}は訪問者の年齢を能動的に検証しておらず、未成年者向けの差別化サービスも提供していません。未成年の方は、保護者の知情と同意のもとでアカウントを登録し、本サイトの各機能（SSO認可や寄付を含む）をご利用ください。保護者は未成年者の本サイト利用について指導と監督の責任を負います。',
		'about.legal.account.minor.title': '未成年者の保護',
		'about.legal.account.register.p1':
			'{shortName}のアカウントを登録する際は、ユーザー名とパスワードの提供が必要で、任意でニックネームを設定できます。ユーザー名とニックネームは公開表示され、パスワードはサーバー側で不可逆なハッシュ要約のみを保存します。また、ログイン時にセッション識別子を自動生成し、アカウント作成日時、最終ログイン日時、ログイン失敗回数、アカウント状態などの必要な情報を記録します。これらの情報の収集は、自発的なアカウント登録による同意に基づくものであり、アカウントサービス機能（認証、セッション管理、セキュリティ保護、パスワード再発行など）の実現に必要なものです。',
		'about.legal.account.register.title': 'アカウント登録と個人情報の収集',
		'about.legal.account.security.p1.prefix':
			'あなたはアカウント資格情報（ユーザー名とパスワード）を適切に保管し、あなたのアカウントを通じて行われるすべての活動に責任を負います。不正使用やセキュリティ上の脆弱性を発見した場合は、速やかに',
		'about.legal.account.security.p1.suffix':
			'からご連絡ください。開発者として、パスワードハッシュ保存、ログイン頻度制限、CSRF対策、セッション安全管理など、合理的な技術的・管理的措置によりアカウント情報の安全を保護しますが、絶対的な安全は保証できません。',
		'about.legal.account.security.title':
			'アカウントの安全とユーザーの義務',
		'about.legal.account.sso.p1':
			'{shortName}は、シングルサインオン（SSO）によりあなたのアカウント身分を外部アプリやサービスへ認可することをサポートします。認可に同意すると、外部アプリはあなたのユーザー識別子とアカウント状態情報を取得し、それに基づいて個別化サービスを提供する場合があります。{shortName}は身元プロバイダとしてのみ機能し、外部アプリが取得した情報をどのように使用するかについては責任を負いません。認可するかどうかは、外部アプリの信頼性を自ら評価したうえで判断してください。認可関係が成立した後、あなたのアカウント状態が変更された場合（無効化や削除など）、{shortName}は認可済みの外部アプリに主動的に通知します。付与した認可はアカウント設定で確認・解除でき、解除後は外部アプリがあなたのアカウント状態を照会できなくなります。アカウント削除時には、すべての認可が自動的に解除されます。',
		'about.legal.account.sso.title': 'SSO認可と第三者へのデータ共有',
		'about.legal.account.title': 'アカウント関連',
		'about.legal.general.p1':
			'以下の法律声明は、中華人民共和国域内（香港特別行政区、マカオ特別行政区、台湾地区を除く）および{shortName}サーバーの実際の所在地の関連法令、政府規則その他の強制規定に適用されます。本声明は、{shortName}のサービスとコンテンツにアクセスまたは使用するすべてのユーザーを拘束します。本声明が中華人民共和国以外の司法管轄区の強制規則と抵触する場合、当該司法管轄区の強制規則が優先されますが、本サイトは適用法に基づきサービスを制限または中止する権利を留保します。',
		'about.legal.general.p2':
			'{shortName}を使用する前に、本法律声明の全文をよく読み、同意してください。同意しない場合は使用を中止してください。使用を続ける場合は、本声明に同意したものとみなされます。',
		'about.legal.general.title': '総則',
		'about.legal.liability.p1':
			'開発者として、{shortName}のコンテンツがすべての司法管轄区で合法であることを保証できません。{shortName}のコンテンツにアクセス、使用、複製、伝播する際、あなたの司法管轄区の法令に触れる可能性があります。本サイトのコンテンツを違法に使用したことによるいかなる結果についても、私は責任を負いません（法律上免責できない場合を除きます）。',
		'about.legal.liability.p2':
			'{shortName}は常に変更・改善されており、いつでも機能を追加・削除し、サービスを一時停止または完全に終了する可能性があります。{shortName}の具体的な機能、信頼性、可用性、あなたのニーズを満たす能力について、私はいかなる約束も行いません。一部の司法管轄区では、商品性、特定目的への適合性、非侵害などの黙示保証に関する法定要件がある場合があります。法律で認められる範囲において、夜雀助手はいかなる明示的または黙示的保証も排除します。',
		'about.legal.liability.p3':
			'本サイトは個人の趣味プロジェクトであり、有償サービスや付加的な権益は提供しません。',
		'about.legal.liability.title': '責任の制限と免責',
		'about.legal.license.p1':
			'開発者として、私はあなたに対し、本サイトへの合法的なアクセスと閲覧、および本サイトの公開コンテンツに基づく非商業的な参考利用に限り、取消可能・譲渡不能・非独占的な使用許諾を付与します。別途書面による許諾がある場合またはコンテンツに明確な表示がある場合を除き、本声明で明示的に許諾されていない権利はすべて私が留保し、権利を行使しないことは権利の放棄や黙示的許諾を構成しません。{shortName}の開発・運営過程で生じたオリジナルコンテンツ（ページデザイン、データベース構造、データ整理成果、オリジナルテキスト、プログラムコードその他のデジタル資産を含む）の知的財産権は、別段の説明がない限り、私に帰属するか私が適法に使用権を有します。',
		'about.legal.license.p2':
			'{shortName}を使用しても、{shortName}やその中に含まれる名称、商標、製品などに関する権利や知的財産権を取得・所有するものではありません。関連する権利者や法律の明確な許諾がない限り、{shortName}内のいかなるコンテンツも不正に使用してはなりません。{shortName}上に表示される規約、ポリシー、法律声明を削除・隠蔽・改変しないでください。{shortName}内に含まれる名称、商標、製品などは各権利者の資産であり、識別のみを目的としています。{shortName}内に表示されるゲームのオリジナル素材（画像素材、設定テキスト、関連標識などを含むがこれに限らない）の著作権その他の関連権利は',
		'about.legal.license.p2.suffix':
			'に帰属し、{shortName}の開発者は関連著作権者から非商業利用の許諾を得ており、識別・展示・説明の用途にのみ使用します。',
		'about.legal.license.p3':
			'{shortName}は現在、一部のサードパーティModプロジェクトのコンテンツを収録しています。当該Modコンテンツは原作に基づく非公式の同人二次創作であり、その著作権構造は原作著作権者の権利、Modプロジェクトのオリジナルリソースの権利、およびModに含まれる他のサードパーティリソースにまたがる場合があります。{shortName}はサードパーティModプロジェクトのコンテンツに対していかなる権利も主張しません。サードパーティModプロジェクトが自らのオリジナルまたは許諾範囲に属さないと明確に表明しているリソースについては、関連する権利は元の権利者に帰属します。{shortName}は当該リソースについていかなる再配布や二次創作の許諾も付与しておらず、関連コンテンツを使用・複製・伝播する際は、その行為が元の権利者の許諾範囲に適合することを自ら確認してください。上記で明確に除外された内容を除き、サードパーティModプロジェクトのオリジナルリソースの許諾はそのプロジェクト自身が宣言するライセンスに従います。当該オリジナルリソースを使用する場合は、対応するライセンス条項を遵守してください。具体的な権利義務は、関連プロジェクトが該当バージョン公開時に添付した著作権表示に従います。あるファイルの著作権状態に疑問がある場合は、明確なライセンス表示がない限り、デフォルトの許諾範囲に含まれないものとみなします。',
		'about.legal.license.p4.link': '原作者',
		'about.legal.license.p5.licenseLink': 'こちら',
		'about.legal.license.p5.middle':
			'。同ライセンスを遵守する限り、すべての公開コンテンツを自由に利用できます。また、',
		'about.legal.license.p5.prefix':
			'{shortName}のソースコードは{license}ライセンスで公開されています。ライセンスは',
		'about.legal.license.p5.suffix':
			'から、問題の報告、提案、マージリクエストを行えます。',
		'about.legal.license.title': '使用許諾と知的財産権',
		'about.legal.network.p1':
			'開発者として、『中華人民共和国サイバーセキュリティ法』に基づき、私は技術的措置を講じてネットワークの動作状態とセキュリティインシデントを監視・記録し、サーバーログを6か月（184日）以上保存する義務があります。ログには、あなたのIPアドレス、アクセス時刻、閲覧ページ、ブラウザ情報、本サイトでの操作記録などが含まれる場合があります。これらの情報は、ネットワークセキュリティの維持とサービス運営の保障、および法令に基づく監視義務の履行にのみ使用し、処理目的の達成後は法令に従い削除または匿名化します。また、本サイトは自社開発の分析システムに必要なCookieを使用してサイト利用状況の統計（ページビューなど）を行いますが、広告追跡やクロスサイト行動プロファイリングは行いません。',
		'about.legal.network.title': 'サイバーセキュリティとログ',
		'about.legal.securityLink': 'GitHub',
		'about.legal.title': '法律声明',
	},
	ko: {
		'about.changelog.commitsLink': 'GitHub',
		'about.changelog.commitsTitle': '{source} 커밋 기록',
		'about.changelog.subTitle.prefix': '다음은 업데이트 요약입니다.',
		'about.changelog.subTitle.suffix':
			'에서 전체 커밋 기록을 볼 수 있습니다.',
		'about.changelog.title': '업데이트 내역',
		'about.introduction.donateLink': '후원하기',
		'about.introduction.githubLink': 'GitHub 저장소',
		'about.introduction.p1.prefix':
			'“{name}”(영어: {enName}) 웹사이트(이하 “본 사이트” 또는 “{shortName}”)는 이',
		'about.introduction.p1.suffix':
			'소유자(이하 “개발자” 또는 “저”)가 게임 《동방 야작식당》을 위해 개발한 보조 도구입니다.',
		'about.introduction.p2':
			'{shortName}는 손님 도감(인연 보상과 스펠카드 효과 검색 포함), 희귀 손님과 일반 손님에 맞는 요리 세트, 그리고 요리(레시피), 음료, 재료, 조리도구, 장식품, 의상, 동료, 화폐, 아이템, 레코드, 낚시 컬렉션, 배지 검색 등의 기능을 제공하며, 본 사이트(https://{baseURL})와 현재 또는 앞으로 제공될 수 있는 기타 웹사이트, 소프트웨어, 모바일 앱 등을 통해 {shortName} 사용자(이하 “플레이어” 또는 “귀하”)의 플레이에 정보와 도움을 제공합니다.',
		'about.introduction.p3':
			'{shortName}는 또한 계정 시스템을 제공합니다. 계정을 등록하면 세트 메뉴 데이터의 클라우드 백업과 여러 기기 간 데이터 동기화 등을 사용할 수 있습니다. 계정 시스템은 사용자 이름과 비밀번호 로그인을 지원하고 세션 관리, 비밀번호 변경, 계정 삭제 등 기본 기능을 제공합니다.',
		'about.introduction.p4':
			'또한 {shortName}는 경량 싱글 사인온(SSO)을 구현하여 외부 앱이나 서비스가 귀하의 {shortName} 계정 신원에 대한 권한을 요청할 수 있습니다. 권한 페이지에서 승인 여부를 스스로 결정할 수 있으며, 승인 후에는 계정 설정에서 언제든지 권한을 철회할 수 있습니다.',
		'about.introduction.p5':
			'{shortName}의 데이터는 게임 《동방 야작식당》에서 직접 추출하므로 대부분의 경우 본 사이트의 정보는 정확합니다. 다만 게임 버전 업데이트와 개발·유지보수의 빈도 및 시기 등의 영향으로 본 사이트의 정보가 게임 내 실제 내용과 다를 수 있습니다. 이를 감안하시고 게임 내 정보를 기준으로 삼아 주세요.',
		'about.introduction.p6.prefix':
			'{shortName}가 귀하의 플레이에 도움이 되었다면',
		'about.introduction.p6.suffix':
			'로 {shortName}의 개발과 유지보수를 후원할 수 있습니다. 다만 이 후원은 귀하 개인의 자발적 행위이며 대중 모금이 아니고, 대등한 당사자 간의 민사 증여에 불과하며 어떠한 물질적 대가나 보답도 따르지 않습니다.',
		'about.introduction.title': '프로젝트 소개',
		'about.legal.account.cookie.p1':
			'{shortName}는 로그인 상태를 유지하고 SSO 권한 흐름에서 보안 컨텍스트를 전달하기 위해 필요한 세션 쿠키를 사용합니다. 세션 쿠키는 로그아웃하거나 브라우저를 닫으면 만료됩니다(브라우저의 실제 동작에 따름). SSO 관련 임시 컨텍스트 쿠키는 만료 시간이 짧게 설정되며 권한 부여가 완료되면 자동으로 삭제됩니다.',
		'about.legal.account.cookie.title': '쿠키와 세션',
		'about.legal.account.deletion.p1':
			'로그인 후 언제든지 계정을 삭제할 수 있습니다. 삭제 후에는 사용자 이름, 비밀번호 해시, 그 밖에 귀하의 개인 신원과 직접 연결된 데이터가 삭제되거나 되돌릴 수 없게 비식별화됩니다. 계정 기능을 통해 생성한 세트 메뉴 데이터 등 사용자 생성 콘텐츠도 제3자의 권익이나 법적 보존 의무와 관련되지 않는 한 삭제 시 함께 지워집니다. 사이버안전법이 정한 로그 보존 의무 이행과 보안 사고 방지를 위한 합리적 필요에 따라 일부 서버 로그와 비식별화된 보안 기록은 법정 기간 동안 보존될 수 있습니다.',
		'about.legal.account.deletion.title': '계정 삭제와 데이터 보존',
		'about.legal.account.minor.p1':
			'{shortName}는 방문자의 연령을 능동적으로 검증하지 않으며 미성년자에게 차별화된 서비스를 제공하지 않습니다. 미성년자인 경우 보호자의 인지와 동의하에 계정을 등록하고 본 사이트의 기능(SSO 권한 부여와 후원 포함)을 사용해 주세요. 보호자는 미성년자의 본 사이트 이용에 대해 지도와 감독의 책임을 집니다.',
		'about.legal.account.minor.title': '미성년자 보호',
		'about.legal.account.register.p1':
			'{shortName} 계정을 등록할 때는 사용자 이름과 비밀번호를 제공해야 하며, 선택적으로 닉네임을 설정할 수 있습니다. 사용자 이름과 닉네임은 공개 표시되며 비밀번호는 서버 측에 되돌릴 수 없는 해시 요약만 저장합니다. 또한 시스템은 로그인 시 세션 식별자를 자동 생성하고 계정 생성 시각, 최근 로그인 시각, 로그인 실패 횟수, 계정 상태 등 필요한 정보를 기록합니다. 이러한 정보 수집은 자발적 계정 등록에 따른 동의에 기반하며, 계정 서비스 기능(인증, 세션 관리, 보안 보호, 비밀번호 찾기 등) 구현에 필요합니다.',
		'about.legal.account.register.title': '계정 등록과 개인정보 수집',
		'about.legal.account.security.p1.prefix':
			'귀하는 계정 자격 증명(사용자 이름과 비밀번호)을 잘 보관하고 귀하의 계정을 통해 발생하는 모든 활동에 책임이 있습니다. 계정의 무단 사용이나 보안 취약점을 발견하면 즉시',
		'about.legal.account.security.p1.suffix':
			'를 통해 알려 주세요. 개발자로서 저는 비밀번호 해시 저장, 로그인 빈도 제한, CSRF 방어, 세션 보안 관리 등 합리적인 기술적·관리적 조치로 계정 정보의 안전을 보호하지만 절대적인 안전을 보장할 수는 없습니다.',
		'about.legal.account.security.title': '계정 보안과 사용자 의무',
		'about.legal.account.sso.p1':
			'{shortName}는 싱글 사인온(SSO)을 통해 귀하의 계정 신원을 외부 앱이나 서비스에 권한 부여하는 것을 지원합니다. 권한에 동의하면 외부 앱은 귀하의 사용자 식별자와 계정 상태 정보를 받고 이를 바탕으로 개인화 서비스를 제공할 수 있습니다. {shortName}는 신원 제공자로서만 기능하며 외부 앱이 받은 정보를 어떻게 사용하는지에 대해서는 책임지지 않습니다. 권한 부여 여부는 외부 앱의 신뢰성을 스스로 평가한 뒤 결정해 주세요. 권한 관계가 성립된 후 귀하의 계정 상태가 변경되면(비활성화 또는 삭제 등) {shortName}는 권한을 받은 외부 앱에 능동적으로 알립니다. 부여한 권한은 계정 설정에서 확인하고 철회할 수 있으며, 철회 후에는 외부 앱이 귀하의 계정 상태를 조회할 수 없습니다. 계정 삭제 시 모든 권한도 자동으로 해제됩니다.',
		'about.legal.account.sso.title': 'SSO 권한 부여와 제3자 데이터 공유',
		'about.legal.account.title': '계정 관련',
		'about.legal.general.p1':
			'다음 법적 고지는 중화인민공화국 영역(홍콩 특별행정구, 마카오 특별행정구, 대만 지역 제외) 및 {shortName} 서버가 실제로 위치한 곳의 관련 법률, 법규, 정부 규칙 및 기타 강제 규정에 적용됩니다. 본 고지는 {shortName} 서비스와 콘텐츠에 접속하거나 사용하는 모든 사용자를 구속합니다. 본 고지가 중화인민공화국 이외 사법 관할구역의 강제 규칙과 충돌하는 경우 해당 관할구역의 강제 규칙이 우선하지만, 본 사이트는 적용 법률에 따라 서비스를 제한하거나 중단할 권리를 보유합니다.',
		'about.legal.general.p2':
			'{shortName}를 사용하기 전에 본 법적 고지의 전체 내용을 주의 깊게 읽고 동의해 주세요. 동의하지 않으면 사용을 중단해 주세요. 계속 사용하면 본 고지에 동의한 것으로 간주됩니다.',
		'about.legal.general.title': '총칙',
		'about.legal.liability.p1':
			'개발자로서 저는 {shortName}의 콘텐츠가 모든 사법 관할구역에서 합법임을 보장할 수 없습니다. {shortName}의 콘텐츠에 접속, 사용, 복제 또는 전파할 때 귀하가 속한 관할구역의 법률에 저촉될 수 있습니다. 본 사이트 콘텐츠를 불법적으로 사용하여 발생한 어떤 결과에 대해서도 저는 책임지지 않습니다(법률상 면책할 수 없는 경우는 제외).',
		'about.legal.liability.p2':
			'{shortName}는 항상 변경되고 개선되며, 언제든지 기능을 추가하거나 삭제할 수 있고 서비스를 일시 중지하거나 완전히 종료할 수도 있습니다. 저는 {shortName}의 구체적인 기능, 신뢰성, 가용성 또는 귀하의 필요를 충족하는 능력에 대해 어떠한 약속도 하지 않습니다. 일부 관할구역은 상품성, 특정 목적 적합성, 비침해 등 묵시적 보증에 관한 법적 요구가 있을 수 있습니다. 법이 허용하는 범위에서 밤참새 도우미는 모든 명시적 또는 묵시적 보증을 배제합니다.',
		'about.legal.liability.p3':
			'본 사이트는 개인 취미 프로젝트로서 유료 서비스나 추가 권익을 제공하지 않습니다.',
		'about.legal.liability.title': '책임 제한과 면책',
		'about.legal.license.p1':
			'개발자로서 저는 귀하에게 본 사이트에 대한 합법적 접속과 열람, 그리고 본 사이트의 공개 콘텐츠에 기반한 비상업적 참고 용도로만 사용할 수 있는, 철회 가능하고 양도 불가능하며 비독점적인 사용 허가를 부여합니다. 별도의 서면 허가가 있거나 콘텐츠에 명확한 표시가 있는 경우를 제외하고, 본 고지에서 명시적으로 허가하지 않은 권리는 모두 제가 보유하며, 권리를 행사하지 않는 것이 권리 포기나 묵시적 허가를 구성하지 않습니다. {shortName}의 개발·운영 과정에서 생산된 창작 콘텐츠(페이지 디자인, 데이터베이스 구조, 데이터 정리 성과, 창작 텍스트, 프로그램 코드 및 기타 디지털 자산 포함)의 지식재산권은 별도 설명이 없는 한 저에게 귀속되거나 제가 적법하게 사용권을 가집니다.',
		'about.legal.license.p2':
			'{shortName}를 사용한다고 해서 {shortName} 또는 그 안에 포함된 명칭, 상표, 제품 등에 대한 어떤 권리나 지식재산권을 취득하거나 보유하는 것은 아닙니다. 관련 권리자나 법률의 명확한 허가가 없는 한 {shortName}의 어떤 콘텐츠도 불법적으로 사용해서는 안 됩니다. {shortName}에 표시된 어떤 약관, 정책 또는 법적 고지도 삭제, 은닉, 변경하지 마세요. {shortName}에 포함된 명칭, 상표, 제품 등은 각 권리자의 자산이며 식별 목적으로만 사용됩니다. {shortName}에 표시된 게임 원본 소재(이미지 소재, 설정 텍스트 및 관련 표식을 포함하되 이에 국한되지 않음)의 저작권 및 기타 관련 권리는',
		'about.legal.license.p2.suffix':
			'에게 있으며, {shortName}의 개발자는 관련 저작권자로부터 비상업적 사용 허가를 받아 식별, 전시, 설명 목적으로만 사용합니다.',
		'about.legal.license.p3':
			'{shortName}는 현재 일부 제3자 모드 프로젝트의 콘텐츠를 수록하고 있습니다. 해당 모드 콘텐츠는 원작에 기반한 비공식 2차 창작이며, 그 저작권 구조는 원작 저작권자의 권리, 모드 프로젝트 고유 리소스의 권리, 그리고 모드에 포함된 기타 제3자 리소스를 함께 포함할 수 있습니다. {shortName}는 제3자 모드 프로젝트 콘텐츠에 대해 어떠한 권리도 주장하지 않습니다. 제3자 모드 프로젝트가 자신의 창작 또는 허가 범위에 속하지 않는다고 명확히 밝힌 리소스의 관련 권리는 원 권리자에게 있습니다. {shortName}는 그러한 리소스에 대해 어떠한 재배포나 2차 창작 허가도 부여하지 않으며, 관련 콘텐츠를 사용·복제·전파할 때에는 그 행위가 원 권리자의 허가 범위에 부합하는지 스스로 확인해야 합니다. 위에서 명확히 제외된 내용을 제외하고, 제3자 모드 프로젝트 고유 리소스의 허가는 해당 프로젝트가 선언한 라이선스를 따릅니다. 해당 고유 리소스를 사용하려면 해당 라이선스 조건을 준수해야 합니다. 구체적인 권리와 의무는 관련 프로젝트가 해당 버전 공개 시 첨부한 저작권 표시를 기준으로 합니다. 어떤 파일의 저작권 상태가 의심스러운 경우 명확한 라이선스 표시가 없는 한 기본 허가 범위에 포함되지 않는 것으로 봅니다.',
		'about.legal.license.p4.link': '원작자',
		'about.legal.license.p5.licenseLink': '여기',
		'about.legal.license.p5.middle':
			'. 해당 라이선스를 준수하는 한 모든 공개 콘텐츠를 자유롭게 사용할 수 있습니다. 또한',
		'about.legal.license.p5.prefix':
			'{shortName}의 소스 코드는 {license} 라이선스로 공개되어 있으며, 라이선스는',
		'about.legal.license.p5.suffix':
			'에서 문제를 알리거나 제안하고 병합 요청을 할 수 있습니다.',
		'about.legal.license.title': '사용 허가와 지식재산권',
		'about.legal.network.p1':
			'개발자로서 《중화인민공화국 사이버안전법》에 따라 저는 기술적 조치를 통해 네트워크 운영 상태와 보안 사고를 모니터링·기록하고 서버 로그를 6개월(184일) 이상 보존할 의무가 있습니다. 로그에는 귀하의 IP 주소, 접속 시각, 방문 페이지, 브라우저 정보, 본 사이트에서의 작업 기록 등이 포함될 수 있습니다. 이러한 정보는 네트워크 보안 유지와 서비스 운영 보장, 그리고 법에 따른 모니터링 의무 이행에만 사용하며 처리 목적이 달성된 후 법에 따라 삭제하거나 비식별화합니다. 또한 본 사이트는 자체 분석 시스템에 필요한 쿠키를 사용하여 사이트 이용 통계(페이지 조회수 등)를 산출하며, 광고 추적이나 교차 사이트 행동 프로파일링은 하지 않습니다.',
		'about.legal.network.title': '사이버 보안과 로그',
		'about.legal.securityLink': 'GitHub',
		'about.legal.title': '법적 고지',
	},
	'zh-CN': ABOUT_MESSAGES_ZH_CN,
	'zh-TW': {
		'about.changelog.commitsLink': 'GitHub',
		'about.changelog.commitsTitle': '{source}提交記錄',
		'about.changelog.subTitle.prefix': '以下為更新摘要，前往',
		'about.changelog.subTitle.suffix': '可以查看完整的提交記錄。',
		'about.changelog.title': '更新日誌',
		'about.introduction.donateLink': '向我捐贈',
		'about.introduction.githubLink': 'GitHub倉庫',
		'about.introduction.p1.prefix':
			'「{name}」（英語：{enName}）網站（下文中稱「本網站」或「{shortName}」）是由此',
		'about.introduction.p1.suffix':
			'所有者（下文中稱「開發者」或「我」）為遊戲《東方夜雀食堂》開發的輔助工具。',
		'about.introduction.p2':
			'{shortName}提供顧客圖鑑（包括羈絆獎勵和符卡效果查詢）、搭配稀客和普客的料理套餐，以及料理（食譜）、酒水、食材、廚具、擺件、衣服、夥伴、貨幣、道具、唱片、垂釣收藏和徽章查詢等功能，透過本網站（https://{baseURL}）以及現在或未來可能提供的其他網站、電腦軟體、行動應用程式或其他類似的產品和服務，為{shortName}使用者（下文中稱「玩家」或「您」）的遊玩過程提供相關資訊和幫助。',
		'about.introduction.p3':
			'{shortName}還提供帳號系統，您可以透過註冊帳號來使用雲端備份套餐搭配資料、在多個裝置間同步資料等功能。帳號系統支援透過使用者名稱和密碼登入，並提供工作階段管理、密碼修改、帳號註銷等基礎帳號功能。',
		'about.introduction.p4':
			'此外，{shortName}實現了輕量級單一登入（SSO）能力，允許外部應用程式或服務請求您的授權以取得您的{shortName}帳號身分。您可以在授權頁面自主決定是否授權；授權後可在帳號設定中隨時撤銷已授予的授權。',
		'about.introduction.p5':
			'{shortName}中的資料直接提取自遊戲《東方夜雀食堂》，因此在大多數情況下本網站所提供的資訊是準確的。但受遊戲版本迭代，以及開發、維護的頻率和時效性等各方面因素的影響，本網站所提供的資訊仍可能和遊戲中的實際內容存在差異。請您知悉並以遊戲內資訊為準。',
		'about.introduction.p6.prefix':
			'如果{shortName}對您的遊玩過程有所幫助，您可以考慮',
		'about.introduction.p6.suffix':
			'以支持{shortName}的開發和維護。但請注意，該捐贈僅為您個人的自願行為，並非面向公眾的募捐，僅構成平等主體之間的民事贈與關係，不附帶任何物質或其他回報。',
		'about.introduction.title': '專案介紹',
		'about.legal.account.cookie.p1':
			'{shortName}使用必要的工作階段Cookie來維持您的登入狀態和提供SSO授權流程中的安全情境傳遞。工作階段Cookie在您登出或關閉瀏覽器後失效（受限於瀏覽器的實際行為）。SSO相關的臨時情境Cookie設定了較短的過期時間，並在授權完成後自動清除。',
		'about.legal.account.cookie.title': 'Cookie與工作階段',
		'about.legal.account.deletion.p1':
			'您可以在登入後隨時選擇註銷帳號。註銷後，您的使用者名稱、密碼雜湊以及其他直接關聯您個人身分的資料將被刪除或不可逆地去識別化處理。您透過帳號功能產生的套餐搭配資料等使用者生成內容，如不涉及第三方權益或法定義務保留，也將在註銷時一併清除。為履行網路安全法規定的日誌留存義務以及防範安全事件的合理需要，部分伺服器日誌和經去識別化的安全記錄可能會在法定期限內繼續保留。',
		'about.legal.account.deletion.title': '帳號註銷與資料留存',
		'about.legal.account.minor.p1':
			'{shortName}未對訪問者年齡進行主動驗證，亦不面向未成年人提供差異化服務。如您為未成年人，請在監護人知情並同意的前提下註冊帳號和使用本網站的各項功能（包括SSO授權和捐贈行為）。監護人應就未成年人使用本網站的行為承擔指導和監督責任。',
		'about.legal.account.minor.title': '未成年人保護',
		'about.legal.account.register.p1':
			'當您註冊{shortName}帳號時，您需要提供使用者名稱和密碼，也可以選擇設定暱稱。使用者名稱和暱稱將會公開顯示，密碼在伺服器端僅儲存其不可逆的雜湊摘要。此外，系統會在您登入時自動生成工作階段識別碼，並記錄帳號的建立時間、最近登入時間、登入失敗次數和帳號狀態等必要資訊。上述資訊的收集基於您自願註冊帳號的同意行為，且為實現帳號服務功能（包括身分驗證、工作階段管理、安全防護和密碼找回等）所必需。',
		'about.legal.account.register.title': '帳號註冊與個人資訊收集',
		'about.legal.account.security.p1.prefix':
			'您有責任妥善保管您的帳號憑據（使用者名稱和密碼），並對透過您帳號發生的所有活動負責。如您發現帳號存在未經授權的使用或安全漏洞，請及時透過',
		'about.legal.account.security.p1.suffix':
			'回饋。作為開發者，我將採取合理的技術和管理措施保護您帳號資訊的安全，包括密碼雜湊儲存、登入頻率限制、CSRF防護以及工作階段安全管理，但無法保證絕對的安全。',
		'about.legal.account.security.title': '帳號安全與使用者義務',
		'about.legal.account.sso.p1':
			'{shortName}支援將您的帳號身分透過單一登入（SSO）授權給外部應用程式或服務。當您同意授權時，外部應用程式將取得您的使用者識別碼和帳號狀態資訊，並可能據此提供個人化服務。{shortName}僅作為身分提供方，對外部應用程式如何使用所取得的資訊不承擔責任。您應自行評估外部應用程式的可信度後再決定是否授權。授權關係建立後，當您的帳號狀態發生變更（如被停用或刪除），{shortName}將主動通知已取得您授權的相關外部應用程式。您可以在帳號設定中查看並撤銷已授予的授權；撤銷後外部應用程式將無法繼續查詢您的帳號狀態。註銷帳號也將自動解除所有已授予的授權。',
		'about.legal.account.sso.title': 'SSO授權與第三方資料分享',
		'about.legal.account.title': '帳號相關',
		'about.legal.general.p1':
			'以下法律聲明適用於中華人民共和國境內（不含香港特別行政區、澳門特別行政區、台灣地區）以及{shortName}伺服器實際所在地的相關法律、法規、政府規章和其他具有強制性的規定。本聲明約束所有訪問、使用{shortName}服務和內容的使用者。如本聲明與中華人民共和國以外司法管轄區的強制性規則存在衝突，以該司法管轄區的強制性規則為準，但本網站仍保留依據適用法規對服務進行限制或中止的權利。',
		'about.legal.general.p2':
			'在使用{shortName}前，請您仔細閱讀並同意本法律聲明的全部內容。如您不同意，請停止使用；如您繼續使用，則視為您接受本聲明。',
		'about.legal.general.title': '總則',
		'about.legal.liability.p1':
			'作為開發者，我無法保證{shortName}的內容在所有司法管轄區均合法。您在訪問、使用、複製或傳播{shortName}中的內容時，可能觸及您所在司法管轄區的法律規定。我不對您因違法使用本網站內容而導致的任何後果承擔責任（法律規定不得免責的情形除外）。',
		'about.legal.liability.p2':
			'{shortName}始終在不斷更改和改進，可能隨時增加或刪除功能，也可能暫停或徹底停止服務。我不為{shortName}的具體功能、可靠性、可用性或滿足您需要的能力作任何承諾。某些司法管可能對適銷性、特定用途適用性或非侵權等默示保證有法定要求。在法律允許的範圍內，夜雀助手排除任何明示或默示保證。',
		'about.legal.liability.p3':
			'本網站僅作為個人興趣專案，不提供任何有償服務或附加權益。',
		'about.legal.liability.title': '責任限制與免責',
		'about.legal.license.p1':
			'作為開發者，我在此向您授予一項可撤銷、不可轉讓、非獨佔的使用許可，僅用於合法訪問、瀏覽本網站和基於本網站公開內容的非商業性參考用途。除非取得另行書面許可或內容另有明確標註，本聲明未明示授權的權利均由我保留，未行使權利並不構成對該權利的放棄或默示許可。{shortName}開發和營運過程中產生的原創內容，包括頁面設計、資料庫結構、資料整理成果、原創文本、程式碼及其他數位資產的智慧財產權，除另有說明外，均歸我所有或依法享有合法使用權。',
		'about.legal.license.p2':
			'使用{shortName}並不意味您獲得或擁有{shortName}或其內所涉及的名稱、商標、產品等的任何權利和智慧財產權。除非獲得相關權利人或法律的明確許可，否則您不得非法使用{shortName}中的任何內容。請勿刪除、隱藏或變更{shortName}上顯示的任何條款、政策或法律聲明。{shortName}內所涉及的名稱、商標、產品等均為各自權利人的資產，僅供識別。{shortName}內所展示的遊戲原始素材，包括但不限於圖像素材、設定文本及相關標識，其著作權及其他相關權利歸',
		'about.legal.license.p2.suffix':
			'所有，{shortName}的開發者已獲得來自相關著作權人的非商業使用授權，僅用於識別、展示和說明用途。',
		'about.legal.license.p3':
			'{shortName}現收錄部分第三方Mod專案內容。相關Mod內容為基於原作的非官方同人二次創作，其版權結構可能同時涉及原作著作權方權利、Mod專案原創資源權利以及Mod中包含的其他第三方資源。{shortName}不對第三方Mod專案內容主張任何權利。對於第三方Mod專案中明確聲明不屬於其原創或授權範圍的資源，其相關權利仍歸原權利人所有。{shortName}未對該類資源授予任何再散佈或二次創作許可，您在使用、複製或傳播相關內容時，應自行確認其行為符合原權利人的授權範圍。除上述明確排除的內容外，第三方Mod專案原創資源的許可適用其專案自身聲明的協議。您如需使用該等原創資源，應遵守對應許可條款。具體權利義務以相關專案在對應版本發布時所附版權聲明為準。如對某一檔案的版權狀態存在疑問，應視為不屬於預設授權範圍，除非存在明確許可標註。',
		'about.legal.license.p4.link': '原作者',
		'about.legal.license.p5.licenseLink': '見此',
		'about.legal.license.p5.middle':
			'，您可以在遵守該協議的前提下，自由使用所有公開內容。您也可以前往',
		'about.legal.license.p5.prefix':
			'{shortName}的原始碼基於{license}協議開源，協議',
		'about.legal.license.p5.suffix':
			'回饋任何問題、提出建議或發起合併請求。',
		'about.legal.license.title': '使用許可與智慧財產權',
		'about.legal.network.p1':
			'作為開發者，根據《中華人民共和國網路安全法》，我有義務採取技術措施監測和記錄網路運行狀態和安全事件，並保存伺服器日誌不少於六個月（184日）。日誌可能包括您的IP位址、訪問時間、訪問頁面、瀏覽器資訊和您在本網站的操作記錄等。上述資訊僅用於網路安全維護和服務運行保障，以及依法履行監測義務，並在達到處理目的後依法刪除或去識別化處理。此外，本網站使用自建分析系統所需的Cookie進行站點使用情況統計（如頁面訪問量），不涉及廣告追蹤或跨站行為畫像。',
		'about.legal.network.title': '網路安全與日誌',
		'about.legal.securityLink': 'GitHub',
		'about.legal.title': '法律聲明',
	},
} as const satisfies TLocalizedMessageTable<TAboutMessageKey>;
