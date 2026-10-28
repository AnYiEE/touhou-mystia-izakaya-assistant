import { type TLocalizedMessageTable } from '@/shared/i18n/messages';

const DONATION_MESSAGES_ZH_CN = {
	'donation.apology':
		'对于在使用过程中打扰到您，我深感歉意。您可以点击下方按钮暂时关闭此弹窗。感谢您一路以来的理解与支持。',
	'donation.appeal':
		'如果{shortName}对您的游戏体验有所帮助，欢迎通过支付宝进行捐赠。每一份支持，都是对我长久以来无偿开发和不断优化的认可，也是让{shortName}继续成长、陪伴更多玩家的动力。',
	'donation.close': '关闭弹窗',
	'donation.cost':
		'作为个人开发者，我已经无偿开发维护{shortName}多年。为了让您随时能打开{shortName}、及时查到最新内容并体验到更多更好用的功能，我需要持续投入大量的时间和费用以保障网站的正常访问、更新并完善功能。更多的支持可以帮助我承担这些长期投入，也能让{shortName}更稳定地提供服务。',
	'donation.heading': '感谢您使用{name}！',
	'donation.intro':
		'您已经在{shortName}内做出了{count}次互动，相信您已经体验到了{shortName}带来的便利，希望它在您游玩《东方夜雀食堂》的过程中真正帮到了您。',
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
			'I am sorry for any disruption this pop-up may have caused while you were using the site. You can use the button below to close this pop-up for now. Thank you for your continued understanding and support.',
		'donation.appeal':
			'If {shortName} has improved your experience with the game, you are welcome to donate through Alipay (mainland China only). Every contribution recognizes the years of unpaid development and continuous improvements behind the project, and gives {shortName} the momentum to keep growing alongside more players.',
		'donation.close': 'Close',
		'donation.cost':
			'As an independent developer, I have developed and maintained {shortName} for free for many years. Keeping it accessible when you need it, keeping its content up to date, and continuing to improve its features require a substantial ongoing investment of time and money. More support would help me cover these long-term costs and allow {shortName} to provide a more stable service.',
		'donation.heading': 'Thank you for using {name}!',
		'donation.intro':
			'You have interacted with {shortName} {count} times. I hope it has made things more convenient for you and genuinely helped you while you play Touhou Mystia’s Izakaya.',
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
			'利用中にポップアップでお邪魔してしまい申し訳ありません。下のボタンから、このポップアップを一時的に閉じることができます。これまでのご理解とご支援に感謝いたします。',
		'donation.appeal':
			'{shortName}がゲームをプレイするうえでお役に立っているなら、Alipay（中国本土のみ）からのご支援を歓迎します。一つひとつのご支援が、長年にわたる無償開発と継続的な改善を支え、{shortName}がさらに成長し、より多くのプレイヤーに寄り添う力になります。',
		'donation.close': '閉じる',
		'donation.cost':
			'個人開発者として、私は{shortName}を長年無償で開発・維持してきました。いつでも{shortName}を開き、最新の内容を確認し、より使いやすい機能を利用していただけるよう、サイトを安定して利用できる環境の維持、最新情報の更新、機能改善には、引き続き多くの時間と費用をかける必要があります。より多くのご支援をいただければ、こうした長期的な費用を負担し、{shortName}をより安定して提供できるようになります。',
		'donation.heading': '{name}をご利用いただきありがとうございます！',
		'donation.intro':
			'{shortName}内で{count}回操作していただきました。{shortName}の便利さを感じ、『東方夜雀食堂』をプレイする中で本当にお役に立てていれば幸いです。',
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
			'이용 중 팝업으로 불편을 드려 죄송합니다. 아래 버튼을 눌러 이 팝업을 잠시 닫을 수 있습니다. 그동안 보내 주신 이해와 응원에 감사드립니다.',
		'donation.appeal':
			'게임 경험에 도움이 되었다면 Alipay(중국 본토 전용)를 통한 후원을 환영합니다. 모든 후원은 오랫동안 이어 온 무료 개발과 지속적인 개선을 인정해 주는 것이며, 더 많은 플레이어와 함께 계속 성장할 수 있는 힘이 됩니다.',
		'donation.close': '닫기',
		'donation.cost':
			'저는 개인 개발자로서 {shortName} 개발과 유지보수를 오랫동안 무료로 해 왔습니다. 언제든 {shortName} 페이지에서 최신 내용을 확인하고 더 편리한 기능을 이용하실 수 있도록, 사이트 운영과 콘텐츠 업데이트, 기능 개선에 계속 많은 시간과 비용을 투자해야 합니다. 더 많은 후원은 이러한 장기적인 비용을 감당하고 안정적인 서비스 제공에 도움이 됩니다.',
		'donation.heading': '{name} 이용에 감사드립니다!',
		'donation.intro':
			'{shortName}에서 {count}회 기능을 이용해 주셨습니다. {shortName}의 편리한 기능이 ‘동방 야작식당’을 플레이하시는 동안 실제로 도움이 되었기를 바랍니다.',
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
			'對於在使用過程中打擾到您，我深感歉意。您可以點擊下方按鈕暫時關閉此彈窗。感謝您一路以來的理解與支持。',
		'donation.appeal':
			'如果{shortName}對您的遊戲體驗有所幫助，歡迎透過支付寶進行捐贈。每一份支持，都是對我長久以來無償開發和不斷優化的認可，也是讓{shortName}繼續成長、陪伴更多玩家的動力。',
		'donation.close': '關閉彈窗',
		'donation.cost':
			'作為個人開發者，我已經無償開發與維護{shortName}多年。為了讓您隨時能開啟{shortName}、及時查到最新內容並體驗到更多更好用的功能，我需要持續投入大量的時間和費用，以保障網站的正常瀏覽、更新並完善功能。更多的支持可以幫助我承擔這些長期投入，也能讓{shortName}更穩定地提供服務。',
		'donation.heading': '感謝您使用{name}！',
		'donation.intro':
			'您已經在{shortName}內做出了{count}次互動，相信您已經體驗到了{shortName}帶來的便利，希望它在您遊玩《東方夜雀食堂》的過程中真正幫到了您。',
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
