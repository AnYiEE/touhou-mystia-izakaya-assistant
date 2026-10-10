import type { TLocale } from '@/shared/i18n/locale';

const CHANGELOG_EN: Readonly<Record<string, ReadonlyArray<string>>> = {
	'v0.1': ['Added: food, beverage, and ingredient pages.'],
	'v0.2': [
		'Added: special guest meal pairing page.',
		'Added: export of special guest meal pairing data.',
		'Added: support for installing as a progressive web app.',
		'Added: offline access support.',
		'Added: the “Izakaya” page theme.',
	],
	'v0.3': [
		'Added: normal guest meal pairing page.',
		'Added: special guest meal rating.',
	],
	'v0.4': [
		'Added: support for setting the global “Trend - Popular” or “Trend - Unpopular” trend.',
		'Added: shortcuts to common features after installing as a progressive web app.',
		'Improved: accessibility (keyboard navigation).',
		'Fixed: special guest meal rating logic.',
	],
	'v0.5': [
		'Added: a tutorial shown on first entering the special guest meal pairing page.',
		'Added: the theme switcher now supports “Follow system”.',
		'Improved: compatibility with older environments (browsers on iOS versions below 15 and Safari versions below 15 on macOS).',
		'Fixed: some buttons in the navbar were covered by window controls after installing as a progressive web app.',
		'Fixed: recipe sources are now counted in the special guest meal rating dimensions.',
	],
	'v0.6': [
		'Added: normal guest meal rating.',
		'Added: for some special guests, the keywords in their order descriptions can optionally be shown alongside favorite food tags for reference.',
	],
	'v0.7': ['Added: settings page.', 'Fixed: guest meal rating logic.'],
	'v0.8': [
		'Added: special guest bond reward data and its display.',
		'Fixed: guest meal rating logic.',
	],
	'v0.9': [
		'Added: special guest meal rating now supports “Dark Matter”.',
		'Added: special guest spell card effect data and its display.',
		'Added: character and clothes art for special guests and Mystia.',
		'Added: ability to temporarily open a new window showing food, beverage, or ingredient details in some scenarios.',
		'Added: vibration feedback for some actions.',
		'Fixed: dynamically calculated ratings of saved guest meals.',
		'Fixed: guest meal rating logic.',
	],
	'v1.0': [
		'Added: the ingredients “Reisen”, “Pupuyo Fruit”, and “Strong Capsaicin”.',
	],
	'v1.1': ['Added: cookers page.'],
	'v1.2': [
		'Added: decorations and clothes pages.',
		'Added: export of special guest and normal guest meal pairing data at the same time.',
		'Added: food and ingredient tags on the food and ingredient pages now adjust dynamically according to the configured “Trend - Popular” or “Trend - Unpopular” trend.',
		'Fixed: some foods on the food page did not show the “Large Portion” tag.',
		'Fixed: extra ingredient scoring logic.',
	],
	'v1.3': [
		'Added: partners and currency pages.',
		'Added: ability to reorder saved meal pairings.',
		'Fixed: extra ingredient scoring logic.',
	],
	'v1.4': [
		'Added: support for setting the global “Famous Shop” effect.',
		'Fixed: guest meal rating logic.',
	],
	'v1.5': [
		'Added: updated data to game version 4.2.0.',
		'Improved: interaction experience and visual effects.',
	],
	'v1.6': ['Added: cloud backup of meal pairing data.'],
	'v1.7': [
		'Added: state sync across tabs (such as global settings and meal pairing data).',
		'Improved: some states of food and beverage tables (such as displayed entries and maximum rows) are no longer separated per page.',
		'Improved: maximum page width on high-resolution or widescreen monitors.',
		'Fixed: guest meal rating logic.',
	],
	'v1.8': ['Added: special guest budget overspend tolerance data.'],
	'v1.9': [
		'Added: support for setting the visibility of specific entries in food and beverage tables.',
	],
	'v1.10': [
		'Added: the ingredient detail popover can now show foods that contain the ingredient.',
	],
	'v1.11': ['Added: updated data to game version 4.2.1.'],
	'v1.12': [
		'Added: support for hiding specific datasets.',
		'Added: MetaMystia Mod extra content added to the datasets.',
		'Added: support for viewing saved meal pairing data in picture-in-picture mode.',
	],
	'v1.13': ['Added: updated the legal statement.'],
	'v1.14': ['Added: updated the legal statement.'],
	'v1.15': [
		'Added: automatic recommendation of special guest meal pairings.',
		'Added: filtering foods, beverages, and ingredients by area.',
	],
	'v1.16': ['Added: updated data to game version 4.4.0.'],
	'v2.0': [
		'Added: account system with registration, sign-in, password changes, session management, and account deletion.',
		'Added: cloud backup of meal pairing data with multi-device sync.',
		'Added: SSO single sign-on, allowing external apps to obtain user authorization and users to revoke authorized external SSO apps on their own.',
		'Added: updated the legal statement.',
	],
	'v2.1': ['Added: site-wide top announcements.'],
	'v2.2': [
		'Added: support for setting an account nickname.',
		'Added: support for changing the account username.',
		'Added: updated the legal statement.',
	],
	'v2.3': ['Added: support for creating and signing in with passkeys.'],
	'v2.4': [
		'Added: global Spotlight search to quickly find data, settings, or apply filters.',
	],
	'v2.5': [
		'Added: business plans on the special guest page, showing saved or automatically recommended meals for multiple special guests in one place.',
	],
	'v2.6': [
		'Added: support for game mods to use the special guest meal automatic recommendation algorithm and obtain results through a local WSS bridge.',
		'Added: filters by “content DLC” and “obtainable in” on data pages and in global Spotlight search.',
	],
	'v2.7': ['Added: foods now support multiple recipes.'],
	'v2.8': [
		'Added: independent identifiers for guests, foods, and other data to support duplicate names.',
		'Added: multiple color palettes for light and dark themes.',
		'Fixed: guest meal rating logic.',
	],
	'v2.9': [
		'Added: automatic recommendation now supports four strategies: “few ingredients, easy to cook”, “easy to obtain”, “low price first”, and “high price first”.',
		'Improved: “Guess What You Want” keeps the best results while offering different food and beverage pairings as much as possible, and supports viewing replaceable beverages.',
		'Improved: layout and interaction of mobile food and beverage tables.',
	],
	'v2.10': [
		'Added: items, records, fishing collectibles, and badges lookup pages.',
	],
};

const CHANGELOG_JA: Readonly<Record<string, ReadonlyArray<string>>> = {
	'v0.1': ['追加：料理・お酒・食材ページ。'],
	'v0.2': [
		'追加：レア客のセットメニュー構成ページ。',
		'追加：レア客のセットメニュー構成データのエクスポート。',
		'追加：プログレッシブウェブアプリとしてのインストール。',
		'追加：オフラインアクセス。',
		'追加：ページテーマ「雀食堂」。',
	],
	'v0.3': [
		'追加：一般客のセットメニュー構成ページ。',
		'追加：レア客セットメニューの評価機能。',
	],
	'v0.4': [
		'追加：全体の「人気」または「不人気」トレンドを設定できる機能。',
		'追加：プログレッシブウェブアプリとしてインストール後、よく使う機能のショートカット。',
		'改善：アクセシビリティ（キーボード操作）。',
		'修正：レア客セットメニューの評価ロジック。',
	],
	'v0.5': [
		'追加：レア客のセットメニュー構成ページに初めて入る際のチュートリアル。',
		'追加：テーマ切替で「システムに従う」を選択可能に。',
		'改善：古い環境（iOS 15未満のブラウザ、macOSのSafari 15未満など）との互換性。',
		'修正：プログレッシブウェブアプリとしてインストール後、ナビゲーションバーの一部ボタンがウィンドウ操作部に隠れる問題。',
		'修正：レシピの入手元をレア客セットメニューの評価項目に追加。',
	],
	'v0.6': [
		'追加：一般客セットメニューの評価機能。',
		'追加：一部のレア客で、好みの料理タグに対応する注文説明のキーワードを参考表示できる機能。',
	],
	'v0.7': ['追加：設定ページ。', '修正：顧客セットメニューの評価ロジック。'],
	'v0.8': [
		'追加：レア客の絆報酬データとその表示画面。',
		'修正：顧客セットメニューの評価ロジック。',
	],
	'v0.9': [
		'追加：レア客セットメニューの評価が「ダークマター」に対応。',
		'追加：レア客のスペルカード効果データとその表示画面。',
		'追加：レア客とミスティアのキャラクター・衣装立ち絵。',
		'追加：一部の場面で料理・お酒・食材の詳細を新しいウィンドウで表示する機能。',
		'追加：一部操作の振動フィードバック。',
		'修正：保存済みセットメニューの評価の動的計算。',
		'修正：顧客セットメニューの評価ロジック。',
	],
	'v1.0': ['追加：食材「鈴仙」「ププヨの実」「強力カプサイシン」。'],
	'v1.1': ['追加：調理器具ページ。'],
	'v1.2': [
		'追加：置物と衣装のページ。',
		'追加：レア客と一般客のセットメニュー構成データの同時エクスポート。',
		'追加：料理・食材ページの料理・食材タグが、設定済みの「人気」または「不人気」トレンドに応じて動的に変化。',
		'修正：料理ページの一部の料理に「大盛り」タグが表示されない問題。',
		'修正：追加食材のスコアロジック。',
	],
	'v1.3': [
		'追加：仲間と通貨のページ。',
		'追加：保存済みセットメニューの順序変更。',
		'修正：追加食材のスコアロジック。',
	],
	'v1.4': [
		'追加：全体の「人気店」効果の設定。',
		'修正：顧客セットメニューの評価ロジック。',
	],
	'v1.5': [
		'追加：データをゲームバージョン4.2.0に更新。',
		'改善：操作感と視覚効果。',
	],
	'v1.6': ['追加：セットメニュー構成データのクラウドバックアップ。'],
	'v1.7': [
		'追加：タブ間の状態同期（全体設定、セットメニュー構成データなど）。',
		'改善：料理・お酒テーブルの一部の状態（表示件数、最大行数など）がページごとに分かれなくなった。',
		'改善：高解像度・ワイド画面でのページ最大幅。',
		'修正：顧客セットメニューの評価ロジック。',
	],
	'v1.8': ['追加：レア客の予算超過許容度データ。'],
	'v1.9': ['追加：料理・お酒テーブルで特定項目の表示/非表示を設定する機能。'],
	'v1.10': [
		'追加：食材ページの詳細ポップアップで、その食材を含む料理を確認する機能。',
	],
	'v1.11': ['追加：データをゲームバージョン4.2.1に更新。'],
	'v1.12': [
		'追加：特定のデータセットを非表示にする機能。',
		'追加：データセットにMetaMystia Modの追加コンテンツを追加。',
		'追加：保存済みセットメニュー構成データを「ピクチャーインピクチャー」で表示する機能。',
	],
	'v1.13': ['追加：法律声明を更新。'],
	'v1.14': ['追加：法律声明を更新。'],
	'v1.15': [
		'追加：レア客セットメニューの自動推薦。',
		'追加：地域による料理・お酒・食材の絞り込み。',
	],
	'v1.16': ['追加：データをゲームバージョン4.4.0に更新。'],
	'v2.0': [
		'追加：アカウントシステム（登録、ログイン、パスワード変更、セッション管理、アカウント削除）。',
		'追加：セットメニュー構成データのクラウドバックアップとマルチデバイス同期。',
		'追加：SSOシングルサインオン。外部アプリへのユーザー認可と、認可済み外部アプリの自主的な解除に対応。',
		'追加：法律声明を更新。',
	],
	'v2.1': ['追加：サイト上部の全体通知機能。'],
	'v2.2': [
		'追加：アカウントのニックネーム設定。',
		'追加：アカウントのユーザー名変更。',
		'追加：法律声明を更新。',
	],
	'v2.3': ['追加：パスキーの作成とログイン。'],
	'v2.4': [
		'追加：グローバルSpotlight検索。データ・設定の素早い検索や絞り込みの適用が可能。',
	],
	'v2.5': [
		'追加：レア客ページの営業プリセット。複数のレア客の保存済みまたは自動推薦セットメニューをまとめて確認可能。',
	],
	'v2.6': [
		'追加：ゲームModがローカルWSSブリッジ経由でレア客セットメニューの自動推薦アルゴリズムを利用し、結果を取得する機能。',
		'追加：資料ページとグローバルSpotlight検索で「コンテンツ帰属」と「入手可能」による絞り込みに対応。',
	],
	'v2.7': ['追加：料理が複数のレシピに対応。'],
	'v2.8': [
		'追加：顧客や料理などの資料に独立した識別子を導入し、同名コンテンツに対応。',
		'追加：ライト・ダークテーマで複数の配色に対応。',
		'修正：顧客セットメニューの評価ロジック。',
	],
	'v2.9': [
		'追加：自動推薦が「材料少なめ」「入手しやすい」「低価格優先」「高価格優先」の4つの推薦方針に対応。',
		'改善：「おすすめ」が最良の結果を保ちつつ、できるだけ異なる料理とお酒の組み合わせを提示し、差し替え可能なお酒の確認にも対応。',
		'改善：モバイルでの料理・お酒テーブルのレイアウトと操作感を最適化。',
	],
	'v2.10': [
		'追加：アイテム、レコード、釣りコレクション、バッジの検索ページ。',
	],
};

const CHANGELOG_KO: Readonly<Record<string, ReadonlyArray<string>>> = {
	'v0.1': ['추가: 요리·음료·재료 페이지.'],
	'v0.2': [
		'추가: 희귀 손님 세트 메뉴 구성 페이지.',
		'추가: 희귀 손님 세트 메뉴 데이터 내보내기.',
		'추가: 프로그레시브 웹 앱(PWA)으로 설치 지원.',
		'추가: 오프라인 접속 지원.',
		'추가: 페이지 테마 “야작식당”.',
	],
	'v0.3': [
		'추가: 일반 손님 세트 메뉴 구성 페이지.',
		'추가: 희귀 손님 세트 메뉴 평가 기능.',
	],
	'v0.4': [
		'추가: 전체 “인기 있음” 또는 “인기 없음” 트렌드 설정 지원.',
		'추가: PWA 설치 후 자주 쓰는 기능의 바로가기 제공.',
		'개선: 접근성(키보드 내비게이션).',
		'수정: 희귀 손님 세트 메뉴 평가 로직.',
	],
	'v0.5': [
		'추가: 희귀 손님 세트 메뉴 구성 페이지 첫 진입 시 사용 튜토리얼.',
		'추가: 테마 전환기에서 “시스템 따름” 선택 지원.',
		'개선: 구버전 환경(iOS 15 미만 브라우저, macOS Safari 15 미만 등)과의 호환성.',
		'수정: PWA 설치 후 내비게이션 바 일부 버튼이 창 컨트롤에 가려지는 문제.',
		'수정: 레시피 획득원을 희귀 손님 세트 메뉴 평가 항목에 반영.',
	],
	'v0.6': [
		'추가: 일반 손님 세트 메뉴 평가 기능.',
		'추가: 일부 희귀 손님의 선호 요리 태그에 대응하는 주문 설명 키워드를 참고용으로 표시.',
	],
	'v0.7': ['추가: 설정 페이지.', '수정: 손님 세트 메뉴 평가 로직.'],
	'v0.8': [
		'추가: 희귀 손님 인연 보상 데이터와 표시 화면.',
		'수정: 손님 세트 메뉴 평가 로직.',
	],
	'v0.9': [
		'추가: 희귀 손님 세트 메뉴 평가가 “어둠의 요리”를 지원.',
		'추가: 희귀 손님 스펠카드 효과 데이터와 표시 화면.',
		'추가: 희귀 손님과 미스티아의 캐릭터·의상 일러스트.',
		'추가: 일부 상황에서 요리·음료·재료 상세를 새 창으로 여는 기능.',
		'추가: 일부 동작의 진동 피드백.',
		'수정: 저장된 손님 세트 메뉴 평가의 동적 계산.',
		'수정: 손님 세트 메뉴 평가 로직.',
	],
	'v1.0': ['추가: 재료 “레이센”, “푸푸요 열매”, “강력 캡사이신”.'],
	'v1.1': ['추가: 조리도구 페이지.'],
	'v1.2': [
		'추가: 장식품과 의상 페이지.',
		'추가: 희귀 손님과 일반 손님 세트 메뉴 데이터 동시 내보내기.',
		'추가: 요리·재료 페이지의 요리·재료 태그가 설정된 “인기 있음” 또는 “인기 없음” 트렌드에 따라 동적으로 조정.',
		'수정: 요리 페이지 일부 요리에 “대량” 태그가 표시되지 않던 문제.',
		'수정: 추가 재료 점수 로직.',
	],
	'v1.3': [
		'추가: 동료와 화폐 페이지.',
		'추가: 저장된 세트 메뉴 데이터의 순서 변경.',
		'수정: 추가 재료 점수 로직.',
	],
	'v1.4': [
		'추가: 전체 “인기 가게” 효과 설정.',
		'수정: 손님 세트 메뉴 평가 로직.',
	],
	'v1.5': [
		'추가: 데이터를 게임 버전 4.2.0으로 갱신.',
		'개선: 조작감과 시각 효과.',
	],
	'v1.6': ['추가: 세트 메뉴 데이터의 클라우드 백업.'],
	'v1.7': [
		'추가: 탭 간 상태 동기화(전체 설정, 세트 메뉴 데이터 등).',
		'개선: 요리·음료 표의 일부 상태(표시 항목, 최대 행 수 등)가 페이지별로 구분되지 않도록 변경.',
		'개선: 고해상도·와이드 모니터에서 페이지 최대 너비.',
		'수정: 손님 세트 메뉴 평가 로직.',
	],
	'v1.8': ['추가: 희귀 손님 예산 초과 허용도 데이터.'],
	'v1.9': ['추가: 요리·음료 표에서 특정 항목의 표시 여부 설정.'],
	'v1.10': ['추가: 재료 페이지 상세 팝업에서 해당 재료가 포함된 요리 확인.'],
	'v1.11': ['추가: 데이터를 게임 버전 4.2.1로 갱신.'],
	'v1.12': [
		'추가: 특정 데이터셋 숨기기.',
		'추가: 데이터셋에 MetaMystia 모드 추가 콘텐츠 추가.',
		'추가: 저장된 세트 메뉴 데이터를 “픽처 인 픽처” 모드로 보기.',
	],
	'v1.13': ['추가: 법적 고지 갱신.'],
	'v1.14': ['추가: 법적 고지 갱신.'],
	'v1.15': [
		'추가: 희귀 손님 세트 메뉴 자동 추천.',
		'추가: 지역별 요리·음료·재료 필터.',
	],
	'v1.16': ['추가: 데이터를 게임 버전 4.4.0으로 갱신.'],
	'v2.0': [
		'추가: 계정 시스템(가입, 로그인, 비밀번호 변경, 세션 관리, 계정 삭제).',
		'추가: 세트 메뉴 데이터의 클라우드 백업과 다기기 동기화.',
		'추가: SSO 싱글 사인온. 외부 앱의 사용자 인증과 사용자의 자발적 철회 지원.',
		'추가: 법적 고지 갱신.',
	],
	'v2.1': ['추가: 사이트 상단 전체 공지 기능.'],
	'v2.2': [
		'추가: 계정 닉네임 설정.',
		'추가: 계정 사용자 이름 변경.',
		'추가: 법적 고지 갱신.',
	],
	'v2.3': ['추가: 패스키 생성 및 로그인.'],
	'v2.4': [
		'추가: 전역 Spotlight 검색. 데이터·설정을 빠르게 찾거나 필터를 적용.',
	],
	'v2.5': [
		'추가: 희귀 손님 페이지의 영업 프리셋. 여러 희귀 손님의 저장된 또는 자동 추천 세트 메뉴를 한곳에서 확인.',
	],
	'v2.6': [
		'추가: 게임 Mod가 로컬 WSS 브리지를 통해 희귀 손님 세트 메뉴 자동 추천 알고리즘을 사용하고 결과를 받는 기능.',
		'추가: 자료 페이지와 전역 Spotlight 검색에서 “콘텐츠 귀속”과 “획득 가능” 필터 지원.',
	],
	'v2.7': ['추가: 요리가 여러 레시피를 지원.'],
	'v2.8': [
		'추가: 손님·요리 등 자료에 독립 식별자를 도입해 동명 콘텐츠 지원.',
		'추가: 라이트·다크 테마에서 여러配色(배색) 지원.',
		'수정: 손님 세트 메뉴 평가 로직.',
	],
	'v2.9': [
		'추가: 자동 추천이 “재료 적고 만들기 쉬움”, “구하기 쉬움”, “저가 우선”, “고가 우선” 네 가지 추천 방식을 지원.',
		'개선: “원하실 것 같아요”가 최적 결과를 유지하면서 가능한 한 다양한 요리·음료 조합을 제공하고, 교체 가능한 음료 확인을 지원.',
		'개선: 모바일 요리·음료 표의 레이아웃과 조작감 최적화.',
	],
	'v2.10': ['추가: 아이템, 레코드, 낚시 컬렉션, 배지 검색 페이지.'],
};

const CHANGELOG_ZH_TW: Readonly<Record<string, ReadonlyArray<string>>> = {
	'v0.1': ['新增：料理、酒水和食材頁面。'],
	'v0.2': [
		'新增：稀客套餐搭配頁面。',
		'新增：支援匯出稀客套餐搭配資料。',
		'新增：支援作為漸進式網頁應用程式安裝。',
		'新增：支援離線訪問。',
		'新增：頁面主題「雀食堂」。',
	],
	'v0.3': ['新增：普客套餐搭配頁面。', '新增：稀客套餐評級功能。'],
	'v0.4': [
		'新增：支援設定全域的「流行·喜愛」或「流行·厭惡」趨勢。',
		'新增：作為漸進式網頁應用程式安裝後，提供常用功能的快捷方式。',
		'改善：無障礙（鍵盤導航）支援。',
		'修復：稀客套餐評級邏輯。',
	],
	'v0.5': [
		'新增：首次進入稀客套餐搭配頁面時，展示使用教程。',
		'新增：主題切換器支援選擇「跟隨系統」。',
		'改善：與低版本環境（包括iOS 15以下版本系統上的瀏覽器和macOS系統上的15以下版本的Safari瀏覽器）的相容性。',
		'修復：作為漸進式網頁應用程式安裝後，導覽列的部分按鈕被視窗控制項遮擋。',
		'修復：將食譜來源納入稀客套餐評級維度。',
	],
	'v0.6': [
		'新增：普客套餐評級功能。',
		'新增：部分稀客的喜愛料理標籤可選擇補充顯示對應點單描述中的關鍵詞以供參考。',
	],
	'v0.7': ['新增：設定頁面。', '修復：顧客套餐評級邏輯。'],
	'v0.8': [
		'新增：稀客羈絆獎勵資料及其展示介面。',
		'修復：顧客套餐評級邏輯。',
	],
	'v0.9': [
		'新增：稀客套餐評級支援「黑暗物質」。',
		'新增：稀客符卡效果資料及其展示介面。',
		'新增：稀客、米斯蒂婭的角色和衣服立繪。',
		'新增：部分場景下支援臨時喚起新視窗查看料理、酒水或食材詳情。',
		'新增：部分操作支援震動回饋。',
		'修復：動態計算已保存的顧客套餐的評級。',
		'修復：顧客套餐評級邏輯。',
	],
	'v1.0': ['新增：食材「鈴仙」、「噗噗喲果」和「強效辣椒素」。'],
	'v1.1': ['新增：廚具頁面。'],
	'v1.2': [
		'新增：擺件和衣服頁面。',
		'新增：支援同時匯出稀客和普客的套餐搭配資料。',
		'新增：料理和食材頁面中的料理和食材標籤將依照已設定的「流行·喜愛」或「流行·厭惡」趨勢而動態調整。',
		'修復：料理頁面的部分料理未顯示「大份」標籤。',
		'修復：額外食材評分邏輯。',
	],
	'v1.3': [
		'新增：夥伴和貨幣頁面。',
		'新增：支援調整已保存的套餐搭配資料中的套餐順序。',
		'修復：額外食材評分邏輯。',
	],
	'v1.4': [
		'新增：支援設定全域的「明星店」效果。',
		'修復：顧客套餐評級邏輯。',
	],
	'v1.5': ['新增：更新資料至遊戲版本4.2.0。', '改善：互動體驗和視覺效果。'],
	'v1.6': ['新增：支援雲端備份套餐搭配資料。'],
	'v1.7': [
		'新增：支援跨分頁同步狀態（如：全域設定、套餐搭配資料等）。',
		'改善：料理和酒水表格的部分狀態（如：顯示條目、最大行數等）不再區分頁面。',
		'改善：高解析度或寬螢幕顯示器下頁面的最大寬度。',
		'修復：顧客套餐評級邏輯。',
	],
	'v1.8': ['新增：稀客預算超支容忍度資料。'],
	'v1.9': ['新增：支援設定料理和酒水表格中特定項目的可見性。'],
	'v1.10': ['新增：食材頁面的詳情彈出框中支援查看包含此食材的料理。'],
	'v1.11': ['新增：更新資料至遊戲版本4.2.1。'],
	'v1.12': [
		'新增：支援隱藏特定資料集。',
		'新增：資料集加入MetaMystia模組附加內容。',
		'新增：支援以「子母畫面」模式查看已保存的套餐搭配資料。',
	],
	'v1.13': ['新增：更新法律聲明。'],
	'v1.14': ['新增：更新法律聲明。'],
	'v1.15': [
		'新增：支援自動推薦稀客套餐搭配。',
		'新增：支援按地區篩選料理、酒水和食材。',
	],
	'v1.16': ['新增：更新資料至遊戲版本4.4.0。'],
	'v2.0': [
		'新增：帳號系統，支援註冊、登入、密碼修改、工作階段管理和帳號註銷。',
		'新增：雲端備份套餐搭配資料，支援多裝置同步。',
		'新增：SSO單一登入，支援外部應用程式取得使用者授權，支援使用者自主撤銷已授權的SSO外部應用程式。',
		'新增：更新法律聲明。',
	],
	'v2.1': ['新增：全站頂部通知功能。'],
	'v2.2': [
		'新增：支援設定帳號暱稱。',
		'新增：支援修改帳號使用者名稱。',
		'新增：更新法律聲明。',
	],
	'v2.3': ['新增：支援通行密鑰建立和登入帳號。'],
	'v2.4': ['新增：支援全域Spotlight搜尋，快速查找資料、設定或應用篩選。'],
	'v2.5': [
		'新增：稀客頁支援營業預設，可集中查看多個稀客的已保存套餐或自動推薦套餐。',
	],
	'v2.6': [
		'新增：支援遊戲Mod透過本地WSS橋接使用稀客套餐自動推薦演算法並取得推薦結果。',
		'新增：資料頁和全域Spotlight搜尋支援分別按「內容歸屬」和「可取得於」篩選。',
	],
	'v2.7': ['新增：料理支援多套食譜。'],
	'v2.8': [
		'新增：顧客、料理等資料使用獨立標識，以支援同名內容。',
		'新增：淺色和深色主題支援多種配色方案。',
		'修復：顧客套餐評級邏輯。',
	],
	'v2.9': [
		'新增：自動推薦支援「少料易做」「容易取得」「低價優先」和「高價優先」四種推薦策略。',
		'改善：「猜您想要」會在保留最優結果的同時，儘量提供不同的料理和酒水搭配，並支援查看可替換酒水。',
		'改善：最佳化行動端料理和酒水表格的佈局和操作體驗。',
	],
	'v2.10': ['新增：道具、唱片、垂釣收藏和徽章查詢頁面。'],
};

export const CHANGELOG_LOCALIZED: Readonly<
	Record<
		Exclude<TLocale, 'zh-CN'>,
		Readonly<Record<string, ReadonlyArray<string>>>
	>
> = {
	en: CHANGELOG_EN,
	ja: CHANGELOG_JA,
	ko: CHANGELOG_KO,
	'zh-TW': CHANGELOG_ZH_TW,
};
