import type { IRecord } from './schema';

/* eslint-disable sort-keys -- Keep identity, display, DLC, then category details as the record data-table column order. */
export const RECORD_RECORDS = [
	{
		id: 11,
		name: '唱片「妖怪兽道」 ~ 其一',
		description:
			'收录了兽道的营业之歌的唱片，一共三首，此为第一首。可以随时放在留声机里播放。',
		dlc: 0,
		musicLabel: 'BeastForest_1',
		trackName: '妖怪兽道-静夜伊始',
		original: '夜雀の歌声 ~ Night Bird',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 3, currencyItem: 3 }],
		},
	},
	{
		id: 12,
		name: '唱片「人间之里」 ~ 其一',
		description:
			'收录了人间之里的营业之歌的唱片，一共三首，此为第一首。可以随时放在留声机里播放。',
		dlc: 0,
		musicLabel: 'HumanVillage_1',
		trackName: '人间之里-三五成群',
		original: '懐かしき東方の血 ~ Old World',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 3, currencyItem: 4 }],
		},
	},
	{
		id: 13,
		name: '唱片「博丽神社」 ~ 其一',
		description:
			'收录了博丽神社的营业之歌的唱片，一共三首，此为第一首。可以随时放在留声机里播放。',
		dlc: 0,
		musicLabel: 'HakureiShrine_1',
		trackName: '博丽神社-惊闻客来',
		original: '少女绮想曲 / 夜雀の歌声 ~ Night Bird',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 3, currencyItem: 5 }],
		},
	},
	{
		id: 14,
		name: '唱片「红魔馆」 ~ 其一',
		description:
			'收录了红魔馆的营业之歌的唱片，一共三首，此为第一首。可以随时放在留声机里播放。',
		dlc: 0,
		musicLabel: 'ScarletMansion_1',
		trackName: '红魔馆-饮酒品肴',
		original: '上海紅茶館',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 3, currencyItem: 6 }],
		},
	},
	{
		id: 15,
		name: '唱片「迷途竹林」 ~ 其一',
		description:
			'收录了迷途竹林的营业之歌的唱片，一共三首，此为第一首。可以随时放在留声机里播放。',
		dlc: 0,
		musicLabel: 'BambooForest_1',
		trackName: '迷途竹林-偶有客至',
		original:
			'シンデレラケージ ~ Kagome-Kagome / 狂気の瞳 ~ Invisible Full Moon',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 3, currencyItem: 7 }],
		},
	},
	{
		id: 16,
		name: '唱片「白玉楼」 ~ 其一',
		description:
			'收录了白玉楼·最终决战的营业之歌的唱片，一共三首，此为第一首。可以随时放在留声机里播放。',
		dlc: 0,
		musicLabel: 'Hakugyokurou_1',
		trackName: '白玉楼-四面楚歌',
		original:
			'夜雀の歌声 ~ Night Bird / 妖々夢 ~ Snow or Cherry Petal / 幽霊楽団 ~ Phantom Ensemble',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 36,
		name: '唱片「妖怪兽道」 ~ 其二',
		description:
			'收录了兽道的营业之歌的唱片，一共三首，此为第二首。可以随时放在留声机里播放。',
		dlc: 0,
		musicLabel: 'BeastForest_2',
		trackName: '妖怪兽道-红灯绿酒',
		original: '夜雀の歌声 ~ Night Bird',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 3, currencyItem: 3 }],
		},
	},
	{
		id: 37,
		name: '唱片「妖怪兽道」 ~ 其三',
		description:
			'收录了兽道的营业之歌的唱片，一共三首，此为第三首。可以随时放在留声机里播放。',
		dlc: 0,
		musicLabel: 'BeastForest_3',
		trackName: '妖怪兽道-千客万来',
		original:
			'夜雀の歌声 ~ Night Bird / もう歌しか聞こえない / 蠢々秋月 ~ Mooned Insect',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 4, currencyItem: 3 }],
		},
	},
	{
		id: 38,
		name: '唱片「人间之里」 ~ 其二',
		description:
			'收录了人间之里的营业之歌的唱片，一共三首，此为第二首。可以随时放在留声机里播放。',
		dlc: 0,
		musicLabel: 'HumanVillage_2',
		trackName: '人间之里-接踵而至',
		original: '懐かしき東方の血 ~ Old World / 夜雀の歌声 ~ Night Bird',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 3, currencyItem: 4 }],
		},
	},
	{
		id: 39,
		name: '唱片「人间之里」 ~ 其三',
		description:
			'收录了人间之里的营业之歌的唱片，一共三首，此为第三首。可以随时放在留声机里播放。',
		dlc: 0,
		musicLabel: 'HumanVillage_3',
		trackName: '人间之里-人山人海',
		original:
			'懐かしき東方の血 ~ Old World / 夜雀の歌声 ~ Night Bird / プレインエイジア',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 4, currencyItem: 4 }],
		},
	},
	{
		id: 40,
		name: '唱片「博丽神社」 ~ 其二',
		description:
			'收录了博丽神社的营业之歌的唱片，一共三首，此为第二首。可以随时放在留声机里播放。',
		dlc: 0,
		musicLabel: 'HakureiShrine_2',
		trackName: '博丽神社-稀客盈门',
		original: '少女绮想曲 / 少女幻葬 ~ Necro-Fantasy',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 3, currencyItem: 5 }],
		},
	},
	{
		id: 41,
		name: '唱片「博丽神社」 ~ 其三',
		description:
			'收录了博丽神社的营业之歌的唱片，一共三首，此为第三首。可以随时放在留声机里播放。',
		dlc: 0,
		musicLabel: 'HakureiShrine_3',
		trackName: '博丽神社-座无虚席',
		original: '少女绮想曲 / 月見草 / 永夜の報い ~ Imperishable Night',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 4, currencyItem: 5 }],
		},
	},
	{
		id: 42,
		name: '唱片「红魔馆」 ~ 其二',
		description:
			'收录了红魔馆的营业之歌的唱片，一共三首，此为第二首。可以随时放在留声机里播放。',
		dlc: 0,
		musicLabel: 'ScarletMansion_2',
		trackName: '红魔馆-色味共赏',
		original: '上海紅茶館',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 3, currencyItem: 6 }],
		},
	},
	{
		id: 43,
		name: '唱片「红魔馆」 ~ 其三',
		description:
			'收录了红魔馆的营业之歌的唱片，一共三首，此为第三首。可以随时放在留声机里播放。',
		dlc: 0,
		musicLabel: 'ScarletMansion_3',
		trackName: '红魔馆-遂心快意',
		original:
			'上海紅茶館 / 亡き王女の為のセプテット / U.N.オーエンは彼女なのか？',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 4, currencyItem: 6 }],
		},
	},
	{
		id: 44,
		name: '唱片「迷途竹林」 ~ 其二',
		description:
			'收录了迷途竹林的营业之歌的唱片，一共三首，此为第二首。可以随时放在留声机里播放。',
		dlc: 0,
		musicLabel: 'BambooForest_2',
		trackName: '迷途竹林-轻车熟路',
		original: 'シンデレラケージ ~ Kagome-Kagome',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 3, currencyItem: 7 }],
		},
	},
	{
		id: 45,
		name: '唱片「迷途竹林」 ~ 其三',
		description:
			'收录了迷途竹林的营业之歌的唱片，一共三首，此为第三首。可以随时放在留声机里播放。',
		dlc: 0,
		musicLabel: 'BambooForest_3',
		trackName: '迷途竹林-欢欣狂舞',
		original:
			'竹取飛翔 ~ Lunatic Princess / シンデレラケージ ~ Kagome-Kagome / 千年幻想郷 ~ History of the Moon',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 4, currencyItem: 7 }],
		},
	},
	{
		id: 46,
		name: '唱片「白玉楼」 ~ 其二',
		description:
			'收录了白玉楼·最终决战的营业之歌的唱片，一共三首，此为第二首。可以随时放在留声机里播放。',
		dlc: 0,
		musicLabel: 'Hakugyokurou_2',
		trackName: '白玉楼-明潮暗涌',
		original:
			'幻視の夜 ~ Ghostly Eyes / 夜雀の歌声 ~ Night Bird / 幽雅に咲かせ、墨染の桜 ~ Border of Life / もう歌しか聞こえない',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 47,
		name: '唱片「白玉楼」 ~ 其三',
		description:
			'收录了白玉楼·最终决战的营业之歌的唱片，一共三首，此为第三首。可以随时放在留声机里播放。',
		dlc: 0,
		musicLabel: 'Hakugyokurou_3',
		trackName: '白玉楼-一步之遥',
		original:
			'夜雀の歌声 ~ Night Bird / 幽雅に咲かせ、墨染の桜 ~ Border of Life  / 幻視の夜 ~ Ghostly Eyes',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 1005,
		name: '唱片「妖怪之山」 ~ 其一',
		description:
			'收录了妖怪之山的营业之歌的唱片，一共三首，此为第一首。可以随时放在留声机里播放。',
		dlc: 1,
		musicLabel: 'YoukaiMountain_1',
		trackName: '妖怪之山-初见方园',
		original: '少女が見た日本の原風景',
		composer: '残实',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 1006,
		name: '唱片「妖怪之山」 ~ 其二',
		description:
			'收录了妖怪之山的营业之歌的唱片，一共三首，此为第二首。可以随时放在留声机里播放。',
		dlc: 1,
		musicLabel: 'YoukaiMountain_2',
		trackName: '妖怪之山-临风对月',
		original: '少女が見た日本の原風景',
		composer: '残实',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 1007,
		name: '唱片「妖怪之山」 ~ 其三',
		description:
			'收录了妖怪之山的营业之歌的唱片，一共三首，此为第三首。可以随时放在留声机里播放。',
		dlc: 1,
		musicLabel: 'YoukaiMountain_3',
		trackName: '妖怪之山-一览众小',
		original: '少女が見た日本の原風景',
		composer: '残实',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 1008,
		name: '唱片「魔法之森」 ~ 其一',
		description:
			'收录了森林的营业之歌的唱片，一共三首，此为第一首。可以随时放在留声机里播放。',
		dlc: 1,
		musicLabel: 'MagicForest_1',
		trackName: '魔法之森-孤芳自赏',
		original: '星の器 ~ Casket of Star / 恋色マスタースパーク',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 1009,
		name: '唱片「魔法之森」 ~ 其二',
		description:
			'收录了森林的营业之歌的唱片，一共三首，此为第二首。可以随时放在留声机里播放。',
		dlc: 1,
		musicLabel: 'MagicForest_2',
		trackName: '魔法之森-花鸟庭园',
		original:
			'星の器 ~ Casket of Star / トロヤ群の密林 / 可愛い大戦争のリフレーン',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 1010,
		name: '唱片「魔法之森」 ~ 其三',
		description:
			'收录了森林的营业之歌的唱片，一共三首，此为第三首。可以随时放在留声机里播放。',
		dlc: 1,
		musicLabel: 'MagicForest_3',
		trackName: '魔法之森-闲适静谧',
		original: '星の器 ~ Casket of Star',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 1011,
		name: '唱片「血池地狱」',
		description:
			'收录了与饕餮尤魔决战时音乐的唱片。可以随时放在留声机里播放。',
		dlc: 1,
		musicLabel: 'BloodPondHell',
		trackName: '血池地狱-吞天噬地',
		original: '水没した沈愁地獄',
		composer: '琳',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 2005,
		name: '唱片「旧地狱」 ~ 其一',
		description:
			'收录了旧地狱的营业之歌的唱片，一共三首，此为第一首。可以随时放在留声机里播放。',
		dlc: 2,
		musicLabel: 'FormerHell_1',
		trackName: '旧地狱-阴里寻晴',
		original: '旧地獄街道を行く',
		composer: '残实',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 2006,
		name: '唱片「旧地狱」 ~ 其二',
		description:
			'收录了旧地狱的营业之歌的唱片，一共三首，此为第二首。可以随时放在留声机里播放。',
		dlc: 2,
		musicLabel: 'FormerHell_2',
		trackName: '旧地狱-柳暗花明',
		original: '旧地獄街道を行く',
		composer: '残实',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 2007,
		name: '唱片「旧地狱」 ~ 其三',
		description:
			'收录了旧地狱的营业之歌的唱片，一共三首，此为第三首。可以随时放在留声机里播放。',
		dlc: 2,
		musicLabel: 'FormerHell_3',
		trackName: '旧地狱-万紫千红',
		original: '旧地獄街道を行く',
		composer: '残实',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 2008,
		name: '唱片「地灵殿」 ~ 其一',
		description:
			'收录了地灵殿的营业之歌的唱片，一共三首，此为第一首。可以随时放在留声机里播放。',
		dlc: 2,
		musicLabel: 'EarthSpiritsPalace_1',
		trackName: '地灵殿-废狱笙歌',
		original: '少女さとり ~ 3rd eye / 幽霊客船の時空を越えた旅',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 2009,
		name: '唱片「地灵殿」 ~ 其二',
		description:
			'收录了地灵殿的营业之歌的唱片，一共三首，此为第二首。可以随时放在留声机里播放。',
		dlc: 2,
		musicLabel: 'EarthSpiritsPalace_2',
		trackName: '地灵殿-独舞成影',
		original:
			'死体旅行 ~ Be of good cheer! / 少女さとり ~ 3rd eye / ネイティブフェイス',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 2010,
		name: '唱片「地灵殿」 ~ 其三',
		description:
			'收录了地灵殿的营业之歌的唱片，一共三首，此为第三首。可以随时放在留声机里播放。',
		dlc: 2,
		musicLabel: 'EarthSpiritsPalace_3',
		trackName: '地灵殿-众影成卷',
		original: '少女さとり ~ 3rd eye',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 2011,
		name: '唱片「怪诞料理大赛」~ 其一',
		description:
			'收录了怪诞料理大赛背景音乐的唱片，一共三首，此为第一首。可以随时放在留声机里播放。',
		dlc: 2,
		musicLabel: 'WackyCuisineCompetition_1',
		trackName: '料理大赛-半忧半喜',
		original: 'ハルトマンの妖怪少女',
		composer: '残实',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 2012,
		name: '唱片「怪诞料理大赛」~ 其二',
		description:
			'收录了怪诞料理大赛背景音乐的唱片，一共三首，此为第二首。可以随时放在留声机里播放。',
		dlc: 2,
		musicLabel: 'WackyCuisineCompetition_2',
		trackName: '料理大赛-亦赛亦闹',
		original: 'ハルトマンの妖怪少女',
		composer: '残实',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 2013,
		name: '唱片「怪诞料理大赛」~ 其三',
		description:
			'收录了怪诞料理大赛背景音乐的唱片，一共三首，此为第三首。可以随时放在留声机里播放。',
		dlc: 2,
		musicLabel: 'WackyCuisineCompetition_3',
		trackName: '料理大赛-一将功成',
		original: 'ハルトマンの妖怪少女',
		composer: '残实',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 3003,
		name: '唱片「命莲寺」 ~ 其一',
		description:
			'收录了命莲寺的营业之歌的唱片，一共三首，此为第一首。可以随时放在留声机里播放。',
		dlc: 3,
		musicLabel: 'MyourenTemple_1',
		trackName: '命莲寺-青山绿瓦',
		original: '春の湊に / 夜雀の歌声 ~ Night Bird / Japanese Saga',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 3004,
		name: '唱片「命莲寺」 ~ 其二',
		description:
			'收录了命莲寺的营业之歌的唱片，一共三首，此为第二首。可以随时放在留声机里播放。',
		dlc: 3,
		musicLabel: 'MyourenTemple_2',
		trackName: '命莲寺-丹书黄卷',
		original: '春の湊に / 妖怪寺',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 3005,
		name: '唱片「命莲寺」 ~ 其三',
		description:
			'收录了命莲寺的营业之歌的唱片，一共三首，此为第三首。可以随时放在留声机里播放。',
		dlc: 3,
		musicLabel: 'MyourenTemple_3',
		trackName: '命莲寺-古佛新衣',
		original: '春の湊に / 妖怪寺 / 青空の影',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 3006,
		name: '唱片「神灵庙」 ~ 其一',
		description:
			'收录了神灵庙的营业之歌的唱片，一共三首，此为第一首。可以随时放在留声机里播放。',
		dlc: 3,
		musicLabel: 'DivineSpiritMausoleum_1',
		trackName: '神灵庙-绀碧一隅',
		original: 'デザイアドライブ',
		composer: '残实',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 3007,
		name: '唱片「神灵庙」 ~ 其二',
		description:
			'收录了神灵庙的营业之歌的唱片，一共三首，此为第二首。可以随时放在留声机里播放。',
		dlc: 3,
		musicLabel: 'DivineSpiritMausoleum_2',
		trackName: '神灵庙-树静风轻',
		original: 'デザイアドライブ',
		composer: '残实',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 3008,
		name: '唱片「神灵庙」 ~ 其三',
		description:
			'收录了神灵庙的营业之歌的唱片，一共三首，此为第三首。可以随时放在留声机里播放。',
		dlc: 3,
		musicLabel: 'DivineSpiritMausoleum_3',
		trackName: '神灵庙-苔痕皆缘',
		original: 'デザイアドライブ',
		composer: '残实',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 3009,
		name: '唱片「国宴大赛」 ~ 其一',
		description:
			'收录了国宴大赛的营业之歌的唱片，一共三首，此为第三首。可以随时放在留声机里播放。',
		dlc: 3,
		musicLabel: 'DivineSpiritMausoleumCookingCompetition_1',
		trackName: '国宴大赛-殚精竭虑',
		original: '聖徳伝説　~ True Administrator / 古きユアンシェン',
		composer: '残实',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 3010,
		name: '唱片「国宴大赛」 ~ 其二',
		description:
			'收录了国宴大赛的营业之歌的唱片，一共三首，此为第三首。可以随时放在留声机里播放。',
		dlc: 3,
		musicLabel: 'DivineSpiritMausoleumCookingCompetition_2',
		trackName: '国宴大赛-精雕细琢',
		original: '聖徳伝説　~ True Administrator / 夢殿大祀廟',
		composer: '残实',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 3011,
		name: '唱片「国宴大赛」 ~ 其三',
		description:
			'收录了国宴大赛的营业之歌的唱片，一共三首，此为第三首。可以随时放在留声机里播放。',
		dlc: 3,
		musicLabel: 'DivineSpiritMausoleumCookingCompetition_3',
		trackName: '国宴大赛-超我大成',
		original: '聖徳伝説　~ True Administrator / 大神神話伝',
		composer: '残实',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 4005,
		name: '唱片「太阳花田」 ~ 其一',
		description:
			'收录了太阳花田的营业之歌的唱片，一共三首，此为第一首。可以随时放在留声机里播放。',
		dlc: 4,
		musicLabel: 'GardenOfTheSun_1',
		trackName: '太阳花田-一叶入梦',
		original: '幽梦 & 眠れる恐怖',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 4006,
		name: '唱片「太阳花田」 ~ 其二',
		description:
			'收录了太阳花田的营业之歌的唱片，一共三首，此为第二首。可以随时放在留声机里播放。',
		dlc: 4,
		musicLabel: 'GardenOfTheSun_2',
		trackName: '太阳花田-花团锦簇',
		original: '幽梦 & 眠れる恐怖',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 4007,
		name: '唱片「太阳花田」 ~ 其三',
		description:
			'收录了太阳花田的营业之歌的唱片，一共三首，此为第三首。可以随时放在留声机里播放。',
		dlc: 4,
		musicLabel: 'GardenOfTheSun_3',
		trackName: '太阳花田-金色交响',
		original: '幽梦 & 眠れる恐怖',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 4008,
		name: '唱片「辉针城」 ~ 其一',
		description:
			'收录了辉针城的营业之歌的唱片，一共三首，此为第一首。可以随时放在留声机里播放。',
		dlc: 4,
		musicLabel: 'ShiningNeedleCastle_1',
		trackName: '辉针城-悠然来声',
		original: '針小棒大の天守閣 & リバースイデオロギー',
		composer: '残实',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 4009,
		name: '唱片「辉针城」 ~ 其二',
		description:
			'收录了辉针城的营业之歌的唱片，一共三首，此为第二首。可以随时放在留声机里播放。',
		dlc: 4,
		musicLabel: 'ShiningNeedleCastle_2',
		trackName: '辉针城-回转加速',
		original: '針小棒大の天守閣 & リバースイデオロギー',
		composer: '残实',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 4010,
		name: '唱片「辉针城」 ~ 其三',
		description:
			'收录了辉针城的营业之歌的唱片，一共三首，此为第三首。可以随时放在留声机里播放。',
		dlc: 4,
		musicLabel: 'ShiningNeedleCastle_3',
		trackName: '辉针城-无垠狂飙',
		original: '針小棒大の天守閣 & リバースイデオロギー',
		composer: '残实',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 4011,
		name: '唱片「抓鬼比赛」 ~ 其一 ',
		description:
			'收录了抓鬼比赛营业之歌的的唱片，一共三首，此为第一首。可以随时放在留声机里播放。',
		dlc: 4,
		musicLabel: 'Flandre_1',
		trackName: '抓鬼比赛-吾令徐徐春风!吹散无尽幽暗!其一',
		original: ' U.N.オーエンは彼女なのか？&魔法少女達の百年祭',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 4012,
		name: '唱片「抓鬼比赛」 ~ 其二 ',
		description:
			'收录了抓鬼比赛营业之歌的的唱片，一共三首，此为第二首。可以随时放在留声机里播放。',
		dlc: 4,
		musicLabel: 'Flandre_2',
		trackName: '抓鬼比赛-吾令徐徐春风!吹散无尽幽暗!其二',
		original: ' U.N.オーエンは彼女なのか？&魔法少女達の百年祭',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 4013,
		name: '唱片「抓鬼比赛」 ~ 其三 ',
		description:
			'收录了抓鬼比赛营业之歌的的唱片，一共三首，此为第三首。可以随时放在留声机里播放。',
		dlc: 4,
		musicLabel: 'Flandre_3',
		trackName: '抓鬼比赛-吾令徐徐春风!吹散无尽幽暗!其三',
		original: ' U.N.オーエンは彼女なのか？&魔法少女達の百年祭',
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 5000,
		name: '唱片「月之都」 ~ 其一',
		description:
			'收录了月之都的营业之歌的唱片，一共三首，此为第一首。可以随时放在留声机里播放。',
		dlc: 5,
		musicLabel: 'LunarCapital_1',
		trackName: '月都-水中望月',
		original: '最も澄みわたる空と海',
		composer: '残实',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 5001,
		name: '唱片「月之都」 ~ 其二',
		description:
			'收录了月之都的营业之歌的唱片，一共三首，此为第二首。可以随时放在留声机里播放。',
		dlc: 5,
		musicLabel: 'LunarCapital_2',
		trackName: '月都-风起萧瑟',
		original: '最も澄みわたる空と海',
		composer: '残实',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 5002,
		name: '唱片「月之都」 ~ 其三',
		description:
			'收录了月之都的营业之歌的唱片，一共三首，此为第三首。可以随时放在留声机里播放。',
		dlc: 5,
		musicLabel: 'LunarCapital_3',
		trackName: '月都-古往今来',
		original: '最も澄みわたる空と海 / 無何有の郷 ~ Deep Mountain',
		composer: '残实',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 5003,
		name: '唱片「魔界」 ~ 其一',
		description:
			'收录了魔界的营业之歌的唱片，一共三首，此为第一首。可以随时放在留声机里播放。',
		dlc: 5,
		musicLabel: 'Makai_1',
		trackName: '魔界-林中秘境',
		original: "世界の果て ~ World's End / 神話幻想 ~ Infinite Being",
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 5004,
		name: '唱片「魔界」 ~ 其二',
		description:
			'收录了魔界的营业之歌的唱片，一共三首，此为第二首。可以随时放在留声机里播放。',
		dlc: 5,
		musicLabel: 'Makai_2',
		trackName: '魔界-奇花异卉',
		original: "世界の果て ~ World's End / 神話幻想 ~ Infinite Being",
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 5005,
		name: '唱片「魔界」 ~ 其三',
		description:
			'收录了魔界的营业之歌的唱片，一共三首，此为第三首。可以随时放在留声机里播放。',
		dlc: 5,
		musicLabel: 'Makai_3',
		trackName: '魔界-月暗珠明',
		original: "世界の果て ~ World's End / 神話幻想 ~ Infinite Being",
		composer: 'Hannari',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 5006,
		name: '唱片「天罗地网」 ~ 其一',
		description:
			'收录了月都试炼时营业之歌的唱片。可以随时放在留声机里播放。',
		dlc: 5,
		musicLabel: 'LunarChallenge',
		trackName: '破魔的太刀',
		original: '破邪の小太刀',
		composer: '残实',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
	{
		id: 5007,
		name: '唱片「天罗地网」 ~ 其二',
		description:
			'收录了与宫出口瑞灵决战时营业之歌的唱片。可以随时放在留声机里播放。',
		dlc: 5,
		musicLabel: 'FinalChallenge',
		trackName: '困兽之斗，天罗地网！',
		original: 'Reincarnation',
		composer: '残实',
		buy: {
			merchant: 'Rinnosuke',
			prices: [{ amount: 5, currencyItem: 29 }],
		},
	},
] as const satisfies Array<IRecord<number>>;
/* eslint-enable sort-keys */

export const RECORD_LIST = RECORD_RECORDS satisfies IRecord[];
