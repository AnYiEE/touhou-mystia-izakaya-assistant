import type { TLocalizedMessageTable } from '@/shared/i18n/messages';

const DONATION_MESSAGES_ZH_CN = {
	'donation.apology':
		'对于在使用过程中打扰到您，我深感歉意。我知道在专注游戏的时候弹窗可能会打扰您的体验，因此特别提供了下方按钮，您可以点击它暂时关闭此弹窗。希望这不会过于影响您的使用体验，也感谢您一路以来的理解与支持。',
	'donation.appeal':
		'如果{shortName}对您的游戏体验有所帮助，欢迎通过支付宝进行捐赠。每一份支持，都是对我持续无偿开发和不断优化的认可，也是让{shortName}继续成长、陪伴更多玩家的动力。',
	'donation.close': '关闭弹窗',
	'donation.cost':
		'作为个人开发者，我已经无偿持续开发和维护{shortName}多年。即便不考虑我为了让{shortName}变得更好用而投入的大量时间和精力，{shortName}的运行也离不开服务器、互联网带宽等基础设施，每年开销至少1500元，而这仅是{shortName}能够持续为玩家提供基本服务的必要成本。在必要成本之外的、更多的支持可以让我提升算力、接入CDN，带来更顺畅、更优质的使用体验，并为未来的功能和数据的及时更新提供保障。',
	'donation.heading': '感谢您使用{name}！',
	'donation.intro':
		'您已经在{shortName}内做出了超过{count}次互动，我相信经过一段时间的使用，您已经体验到了{shortName}带来的便利——顾客图鉴、料理搭配、食材查询等实用功能，希望它在您的《东方夜雀食堂》旅程中真正帮到了您，让游戏过程更轻松、方便。',
	'donation.mainlandNote': '',
	'donation.remindLater': '{days}日内不再弹出',
} as const;

export type TDonationMessageKey = keyof typeof DONATION_MESSAGES_ZH_CN;

export const donationMessages = {
	en: {
		'donation.apology':
			'I am sorry for interrupting you while you play. A pop-up can be disruptive when you are focused on the game, so the button below lets you close it for a while. I hope it does not affect your experience too much, and thank you for your understanding and support all along.',
		'donation.appeal':
			'If {shortName} has been helpful to your play, you are welcome to donate via Alipay (mainland China). Every contribution recognizes my ongoing unpaid development and keeps {shortName} growing for more players.',
		'donation.close': 'Close',
		'donation.cost':
			'As an individual developer, I have been building and maintaining {shortName} for free for years. Even setting aside the time and effort I have put into making it better, running {shortName} still needs servers, bandwidth and other infrastructure — at least 1,500 yuan per year, which is only the basic cost of keeping the service available. Support beyond that lets me add computing power and a CDN, deliver a smoother and better experience, and keep future features and data updates on time.',
		'donation.heading': 'Thanks for using {name}!',
		'donation.intro':
			'You have made over {count} interactions in {shortName}. After some time with it, I believe you have enjoyed the convenience it brings — the guest compendium, meal pairing, ingredient lookup and other useful features — and I hope it has truly helped you on your journey through Touhou Mystia’s Izakaya, making the game easier and more enjoyable.',
		'donation.mainlandNote': 'Alipay (mainland China only)',
		'donation.remindLater': 'Do not show again for {days} days',
	},
	ja: {
		'donation.apology':
			'ゲーム中にポップアップでお邪魔してしまい申し訳ありません。集中しているときに表示されるとご迷惑かと思いますので、下のボタンからしばらく非表示にできます。ご理解とご支援に感謝いたします。',
		'donation.appeal':
			'{shortName}がお役に立っているなら、Alipay（中国本土）からのご支援を歓迎します。一つひとつのご支援が、私の無償開発を支え、{shortName}をさらに成長させる力になります。',
		'donation.close': '閉じる',
		'donation.cost':
			'個人開発者として、私は{shortName}を長年無償で開発・維持してきました。{shortName}を使いやすくするために費やした時間と労力を別にしても、サーバーや帯域などのインフラが欠かせず、年間で少なくとも1500元かかります。これはプレイヤーの皆様に基本サービスを届け続けるための必要最低限の費用です。さらにご支援いただければ、計算資源の増強やCDNの導入により、より快適で高品質な体験と、今後の機能・データの速やかな更新をお約束できます。',
		'donation.heading':
			'いつも{name}をご利用いただきありがとうございます！',
		'donation.intro':
			'あなたは{shortName}で{count}回以上のかかわりを持ってくださいました。しばらく使っていただければ、お客様図鑑・お料理の組み合わせ・食材検索などの便利な機能を実感していただけたことと思います。『東方夜雀食堂』の旅がより快適になるよう、お役に立てていれば幸いです。',
		'donation.mainlandNote': 'Alipay（中国本土のみ）',
		'donation.remindLater': '{days}日間表示しない',
	},
	ko: {
		'donation.apology':
			'게임을 즐기시는 중에 팝업으로 방해드려 죄송합니다. 집중하실 때 팝업이 불편하실 수 있어 아래 버튼으로 잠시 닫아 두실 수 있습니다. 이용에 너무 불편이 없으시길 바라며, 늘 이해와 응원에 감사드립니다.',
		'donation.appeal':
			'{shortName}이(가) 게임 경험에 도움이 되었다면 Alipay(중국 본토)를 통한 후원을 환영합니다. 모든 후원은 제 무료 개발을 인정해 주는 것이며, {shortName}이(가) 더 많은 플레이어와 함께 성장하는 힘이 됩니다.',
		'donation.close': '닫기',
		'donation.cost':
			'저는 개인 개발자로서 {shortName}을(를) 오랫동안 무료로 개발하고 유지해 왔습니다. {shortName}을(를) 더 쓸모 있게 만들기 위해 쏟은 시간과 노력을 제외하더라도, 서버와 대역폭 같은 인프라가 필요해 매년 최소 1500위안이 듭니다. 이는 플레이어 여러분께 기본 서비스를 계속 제공하기 위한 최소한의 비용입니다. 그 이상의 지원을 받으면 컴퓨팅 자원을 늘리고 CDN을 도입해 더 원활하고 나은 경험을 드리고, 앞으로의 기능과 데이터 업데이트도 제때 제공할 수 있습니다.',
		'donation.heading': '{name}을(를) 이용해 주셔서 감사합니다!',
		'donation.intro':
			'{shortName}에서 {count}회 이상 상호작용하셨네요. 얼마간 사용하시면서 손님 도감, 요리 조합, 재료 검색 등 편리한 기능을 경험하셨으리라 생각합니다. ‘동방 야작식당’ 여정에서 게임이 한층 편하고 즐거워지길 바랍니다.',
		'donation.mainlandNote': 'Alipay(중국 본토 전용)',
		'donation.remindLater': '{days}일 동안 다시 표시 안 함',
	},
	'zh-CN': DONATION_MESSAGES_ZH_CN,
	'zh-TW': {
		'donation.apology':
			'對於在使用過程中打擾到您，我深感歉意。我知道在專注遊戲的時候彈窗可能會打擾您的體驗，因此特別提供了下方按鈕，您可以點擊它暫時關閉此彈窗。希望這不會過於影響您的使用體驗，也感謝您一路以來的理解與支持。',
		'donation.appeal':
			'如果{shortName}對您的遊戲體驗有所幫助，歡迎透過支付寶（中國大陸）進行捐贈。每一份支持，都是對我持續無償開發和不斷優化的認可，也是讓{shortName}繼續成長、陪伴更多玩家的動力。',
		'donation.close': '關閉彈窗',
		'donation.cost':
			'作為個人開發者，我已經無償持續開發和維護{shortName}多年。即便不考慮我為了讓{shortName}變得更好用而投入的大量時間和精力，{shortName}的運行也離不開伺服器、網際網路頻寬等基礎設施，每年開銷至少1500元，而這僅是{shortName}能夠持續為玩家提供基本服務的必要成本。在必要成本之外的、更多的支持可以讓我提升算力、接入CDN，帶來更順暢、更優質的使用體驗，並為未來的功能和資料的及時更新提供保障。',
		'donation.heading': '感謝您使用{name}！',
		'donation.intro':
			'您已經在{shortName}內做出了超過{count}次互動，我相信經過一段時間的使用，您已經體驗到了{shortName}帶來的便利——顧客圖鑑、料理搭配、食材查詢等實用功能，希望它在您的《東方夜雀食堂》旅程中真正幫到了您，讓遊戲過程更輕鬆、方便。',
		'donation.mainlandNote': '（中國大陸的支付寶）',
		'donation.remindLater': '{days}日內不再彈出',
	},
} satisfies TLocalizedMessageTable<TDonationMessageKey>;
