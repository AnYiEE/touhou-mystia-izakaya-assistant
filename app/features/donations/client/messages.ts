import { type TLocalizedMessageTable } from '@/shared/i18n/messages';

const DONATION_MESSAGES_ZH_CN = {
	'donation.apology':
		'对于使用过程中给您带来的打扰，我深感歉意。我知道玩家专心游戏时，弹窗可能会影响体验，因此提供了下方按钮，您可以暂时关闭此弹窗。希望这不会给您带来太大困扰，也感谢您一直以来的理解与支持。',
	'donation.appeal':
		'如果{shortName}对您的游戏体验有所帮助，欢迎通过支付宝进行捐赠。每一份支持，都是对我长期无偿开发和持续改进的认可，也能让{shortName}继续成长，陪伴更多玩家。',
	'donation.close': '关闭弹窗',
	'donation.cost':
		'作为个人开发者，我已经无偿开发和维护{shortName}多年。为了方便您随时打开{shortName}、查询最新内容并使用更多实用功能，我需要持续投入大量时间和费用，以维持网站正常运行、更新内容并完善功能。',
	'donation.costDetails':
		'即使不考虑我在改进{shortName}上投入的大量时间和精力，{shortName}的运行也离不开服务器、互联网带宽等基础设施，每年至少需要1500元。而这只是维持基本服务的最低成本。超出基本维护成本的支持，可以让我提升算力、接入CDN，带来更顺畅、更优质的使用体验，并确保未来的功能和数据能够及时更新。',
	'donation.heading': '感谢您使用{name}！',
	'donation.intro':
		'您已经在{shortName}中进行了超过{count}次互动。经过一段时间的使用，我想您已经体会到{shortName}带来的便利——顾客图鉴、料理搭配、食材查询等实用功能。希望它在您游玩《东方夜雀食堂》的过程中真正帮到了您，让游玩过程更轻松、方便。',
	'donation.mainlandNote': '',
	'donation.nudge.body': '欢迎支持{shortName}日常运营',
	'donation.nudge.dismiss': '收起（{seconds}）',
	'donation.nudge.support': '支持一下',
	'donation.nudge.title': '这些功能帮到您了吗？',
	'donation.other.githubStar': '在GitHub上点个Star',
	'donation.other.qqGroup': '加入QQ群',
	'donation.remindLater': '{days}日内不再弹出',
} as const;

export type TDonationMessageKey = keyof typeof DONATION_MESSAGES_ZH_CN;

export const donationMessages = {
	en: {
		'donation.apology':
			'I am sorry for interrupting you while you play. This pop-up can be disruptive when you are focused on the game, so you can use the button below to close it for now. I hope it does not affect your experience too much, and thank you for your understanding and support.',
		'donation.appeal':
			'If {shortName} has been helpful to your play, you are welcome to donate through Alipay (mainland China only). Every contribution is an acknowledgment of the long-term unpaid development behind the project and its ongoing improvements, and it helps {shortName} continue growing so it can reach more players.',
		'donation.close': 'Close',
		'donation.cost':
			'As an individual developer, I have developed and maintained {shortName} for free for many years. To keep {shortName} available whenever you need it, keep its content up to date, and offer more useful features, I need to keep investing substantial time and money in the site’s availability, updates, and improvements.',
		'donation.costDetails':
			'Even setting aside the time and effort I put into making {shortName} better, running {shortName} still requires servers, internet bandwidth, and other infrastructure, at a cost of at least 1,500 yuan per year. That is only the essential cost of continuing to provide players with basic services. Support beyond that can help me increase computing capacity, add a CDN, deliver a smoother and better experience, and keep future features and data updates on schedule.',
		'donation.heading': 'Thank you for using {name}!',
		'donation.intro':
			'You have interacted with {shortName} more than {count} times. After using it for a while, I believe you have experienced the convenience of features such as the guest catalog, meal pairing, and ingredient lookup. I hope it has genuinely helped you while you play Touhou Mystia’s Izakaya, making the game easier and more enjoyable.',
		'donation.mainlandNote': 'Alipay (mainland China only)',
		'donation.nudge.body': 'Help cover {shortName}’s ongoing costs.',
		'donation.nudge.dismiss': 'Dismiss ({seconds})',
		'donation.nudge.support': 'Support',
		'donation.nudge.title': 'Were these features helpful?',
		'donation.other.githubStar': 'Star the project on GitHub',
		'donation.other.qqGroup': 'Join the QQ group',
		'donation.remindLater': 'Do not show again for {days} days',
	},
	ja: {
		'donation.apology':
			'ゲーム中にポップアップでお邪魔してしまい申し訳ありません。集中しているときに表示されるとご迷惑かと思いますので、下のボタンから一時的に非表示にできます。ご理解とご支援に感謝いたします。',
		'donation.appeal':
			'{shortName}がお役に立っているなら、Alipay（中国本土のみ）からのご支援を歓迎します。一つひとつのご支援が、長年にわたる無償開発と継続的な改善を支え、{shortName}がさらに成長し、より多くのプレイヤーに寄り添う力になります。',
		'donation.close': '閉じる',
		'donation.cost':
			'個人開発者として、私は{shortName}を長年無償で開発・維持してきました。{shortName}をいつでも開いて最新の内容を確認し、より使いやすい機能を利用していただけるよう、安定した運用、情報の更新、機能改善には引き続き多くの時間と費用が必要です。',
		'donation.costDetails':
			'{shortName}を使いやすくするために費やした時間と労力を別にしても、サーバーや帯域などのインフラが欠かせず、年間で少なくとも1500元かかります。これはプレイヤーの皆様に基本サービスを届け続けるための必要最低限の費用です。これを上回るご支援は、計算資源の増強やCDNの導入、より快適で高品質な体験の提供、今後の機能・データの更新に役立ちます。',
		'donation.heading': '{name}をご利用いただきありがとうございます！',
		'donation.intro':
			'{shortName}では{count}回以上操作していただきました。しばらく使っていただければ、お客様図鑑、セットメニュー構成、食材検索などの便利な機能を実感していただけたことと思います。『東方夜雀食堂』をプレイする中で本当にお役に立てていれば幸いです。',
		'donation.mainlandNote': 'Alipay（中国本土のみ）',
		'donation.nudge.body': '{shortName}の運営へのご支援を歓迎します',
		'donation.nudge.dismiss': '閉じる（{seconds}）',
		'donation.nudge.support': '支援する',
		'donation.nudge.title': 'これらの機能はお役に立ちましたか？',
		'donation.other.githubStar': 'GitHubでプロジェクトにスターを付ける',
		'donation.other.qqGroup': 'QQグループに参加',
		'donation.remindLater': '{days}日間表示しない',
	},
	ko: {
		'donation.apology':
			'게임을 즐기시는 중에 팝업으로 방해드려 죄송합니다. 집중하실 때 팝업이 불편하게 느껴질 수 있어 아래 버튼으로 잠시 닫으실 수 있습니다. 불편이 크지 않기를 바라며, 그동안 보내 주신 이해와 응원에 감사드립니다.',
		'donation.appeal':
			'{shortName}이(가) 게임 경험에 도움이 되었다면 Alipay(중국 본토 전용)를 통한 후원을 환영합니다. 모든 후원은 오랫동안 이어 온 무료 개발과 지속적인 개선을 인정하는 뜻이며, {shortName}이(가) 더 많은 플레이어와 함께 계속 성장할 수 있는 힘이 됩니다.',
		'donation.close': '닫기',
		'donation.cost':
			'저는 개인 개발자로서 {shortName} 개발과 유지보수를 오랫동안 무료로 해 왔습니다. 언제든 {shortName}에 접속해 최신 내용을 확인하고 더 편리한 기능을 이용하실 수 있도록, 사이트 운영과 콘텐츠 업데이트, 기능 개선에 계속 많은 시간과 비용을 투자해야 합니다.',
		'donation.costDetails':
			'{shortName}을(를) 더 유용하게 만들기 위해 쏟은 시간과 노력을 제외하더라도, 서버와 대역폭 같은 인프라가 필요해 매년 최소 1500위안이 듭니다. 이는 플레이어 여러분께 기본 서비스를 계속 제공하기 위한 최소한의 비용입니다. 그 이상의 후원을 받으면 컴퓨팅 자원을 확충하고 CDN을 도입해 더 원활한 경험을 제공할 수 있으며, 향후 기능과 데이터 업데이트도 이어 갈 수 있습니다.',
		'donation.heading': '{name} 이용에 감사드립니다!',
		'donation.intro':
			'{shortName}에서 {count}회 이상 기능을 이용하셨습니다. 어느 정도 사용해 보시면서 손님 도감, 세트 메뉴 구성, 재료 검색 등 편리한 기능을 경험하셨으리라 생각합니다. 『동방야작식당』을 플레이하시는 동안 실제로 도움이 되었기를 바랍니다.',
		'donation.mainlandNote': 'Alipay(중국 본토 전용)',
		'donation.nudge.body': '{shortName}의 운영을 위한 후원을 환영합니다.',
		'donation.nudge.dismiss': '닫기({seconds})',
		'donation.nudge.support': '후원하기',
		'donation.nudge.title': '이 기능들이 도움이 되셨나요?',
		'donation.other.githubStar': 'GitHub에서 프로젝트에 스타 누르기',
		'donation.other.qqGroup': 'QQ 그룹 참여',
		'donation.remindLater': '{days}일 동안 다시 표시 안 함',
	},
	'zh-CN': DONATION_MESSAGES_ZH_CN,
	'zh-TW': {
		'donation.apology':
			'對於使用過程中給您帶來的打擾，我深感歉意。我知道玩家專心遊戲時，彈窗可能會影響體驗，因此提供了下方按鈕，您可以暫時關閉此彈窗。希望這不會給您帶來太大困擾，也感謝您一直以來的理解與支持。',
		'donation.appeal':
			'如果{shortName}對您的遊戲體驗有所幫助，歡迎透過支付寶進行捐贈。每一份支持，都是對我長期無償開發與持續改進的肯定，也是讓{shortName}繼續成長、陪伴更多玩家的動力。',
		'donation.close': '關閉彈窗',
		'donation.cost':
			'作為個人開發者，我已經無償開發和維護{shortName}多年。為了方便您隨時開啟{shortName}、查詢最新內容並使用更多實用功能，我需要持續投入大量時間和費用，以維持網站正常運作、更新內容並完善功能。',
		'donation.costDetails':
			'即使不考慮我在改進{shortName}上投入的大量時間和精力，{shortName}的運作也離不開伺服器、網際網路頻寬等基礎設施，每年至少需要1500元。而這只是維持基本服務的最低成本。超出基本維護成本的支持，可以讓我提升算力、接入CDN，帶來更順暢、更優質的使用體驗，並確保未來的功能和資料能夠及時更新。',
		'donation.heading': '感謝您使用{name}！',
		'donation.intro':
			'您已經在{shortName}中進行了超過{count}次互動。經過一段時間的使用，我想您已經體會到{shortName}帶來的便利——顧客圖鑑、套餐搭配、食材查詢等實用功能。希望它在您遊玩《東方夜雀食堂》的過程中真正幫到了您，讓遊玩過程更輕鬆、方便。',
		'donation.mainlandNote': '（中國大陸的支付寶）',
		'donation.nudge.body': '歡迎支持{shortName}日常營運',
		'donation.nudge.dismiss': '收起（{seconds}）',
		'donation.nudge.support': '支持一下',
		'donation.nudge.title': '這些功能幫到您了嗎？',
		'donation.other.githubStar': '在GitHub上點個Star',
		'donation.other.qqGroup': '加入QQ群',
		'donation.remindLater': '{days}日內不再彈出',
	},
} as const satisfies TLocalizedMessageTable<TDonationMessageKey>;
