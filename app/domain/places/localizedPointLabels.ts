import { DEFAULT_LOCALE, type TLocale } from '@/shared/i18n/locale';

type TPointLabelTranslations = Readonly<Partial<Record<TLocale, string>>>;

/**
 * @description Collection-point and prayer labels are written by this project
 * (the game offers no equivalent text), so their translations live here rather
 * than in the generated data modules. Keys are the canonical Simplified
 * Chinese labels used by `collectionFacts.ts` and `prayerFacts.ts`.
 */
const POINT_LABEL_TRANSLATIONS: Readonly<
	Record<string, TPointLabelTranslations>
> = {
	东侧可可树: {
		en: 'East cocoa tree',
		ja: '東側のカカオの木',
		ko: '동쪽 코코아 나무',
		'zh-TW': '東側可可樹',
	},
	'东侧向日葵丛（水獭祭）': {
		en: 'East sunflowers (Dassai)',
		ja: '東側のヒマワリ畑（おそ祭り）',
		ko: '동쪽 해바라기밭(수달의 향연)',
		'zh-TW': '東側向日葵叢（水獺祭）',
	},
	'东侧向日葵丛（风祝/尼格罗尼）': {
		en: 'East sunflowers (Wind Priestess / Negroni)',
		ja: '東側のヒマワリ畑（風祝／ネグローニ）',
		ko: '동쪽 해바라기밭(카제하후리/네그로니)',
		'zh-TW': '東側向日葵叢（風祝／尼格羅尼）',
	},
	'东侧山丘（需借道博丽神社）': {
		en: 'East hill (via Hakurei Shrine)',
		ja: '東側の丘（博麗神社経由）',
		ko: '동쪽 언덕(하쿠레이 신사 경유)',
		'zh-TW': '東側山丘（需借道博麗神社）',
	},
	东侧银杏树: {
		en: 'East ginkgo tree',
		ja: '東側のイチョウの木',
		ko: '동쪽 은행나무',
		'zh-TW': '東側銀杏樹',
	},
	东北侧蘑菇堆: {
		en: 'Northeast mushroom pile',
		ja: '北東側のキノコの山',
		ko: '북동쪽 버섯 더미',
		'zh-TW': '東北側蘑菇堆',
	},
	东北侧蜂巢: {
		en: 'Northeast beehive',
		ja: '北東側の蜂の巣',
		ko: '북동쪽 벌집',
		'zh-TW': '東北側蜂巢',
	},
	东南侧花丛: {
		en: 'Southeast flower field',
		ja: '南東側の花畑',
		ko: '남동쪽 꽃밭',
		'zh-TW': '東南側花叢',
	},
	东南侧蜂巢: {
		en: 'Southeast beehive',
		ja: '南東側の蜂の巣',
		ko: '남동쪽 벌집',
		'zh-TW': '東南側蜂巢',
	},
	东南侧雀酒: {
		en: 'Southeast Sparrow Sake',
		ja: '南東側の雀酒',
		ko: '남동쪽 참새의 술',
		'zh-TW': '東南側雀酒',
	},
	中心瀑布: {
		en: 'Central waterfall',
		ja: '中央の滝',
		ko: '중앙 폭포',
		'zh-TW': '中心瀑布',
	},
	中部松树: {
		en: 'Central pine tree',
		ja: '中央の松の木',
		ko: '중앙 소나무',
		'zh-TW': '中部松樹',
	},
	中部树根: {
		en: 'Central tree roots',
		ja: '中央の木の根',
		ko: '중앙 나무뿌리',
		'zh-TW': '中部樹根',
	},
	中部栗树: {
		en: 'Central chestnut tree',
		ja: '中央の栗の木',
		ko: '중앙 밤나무',
		'zh-TW': '中部栗樹',
	},
	中部温室: {
		en: 'Central greenhouse',
		ja: '中央の温室',
		ko: '중앙 온실',
		'zh-TW': '中部溫室',
	},
	中部花丛: {
		en: 'Central flower field',
		ja: '中央の花畑',
		ko: '중앙 꽃밭',
		'zh-TW': '中部花叢',
	},
	中部蜂巢: {
		en: 'Central beehive',
		ja: '中央の蜂の巣',
		ko: '중앙 벌집',
		'zh-TW': '中部蜂巢',
	},
	仓库: { en: 'Warehouse', ja: '倉庫', ko: '창고', 'zh-TW': '倉庫' },
	农田: { en: 'Farmland', ja: '農地', ko: '농지', 'zh-TW': '農田' },
	冰块堆: {
		en: 'Ice pile',
		ja: '氷の山',
		ko: '얼음 더미',
		'zh-TW': '冰塊堆',
	},
	'南侧亭子（需借道迷途竹林）': {
		en: 'South pavilion (via the Bamboo Forest of the Lost)',
		ja: '南側のあずまや（迷いの竹林経由）',
		ko: '남쪽 정자(미혹의 죽림 경유)',
		'zh-TW': '南側亭子（需借道迷途竹林）',
	},
	南侧瀑布: {
		en: 'South waterfall',
		ja: '南側の滝',
		ko: '남쪽 폭포',
		'zh-TW': '南側瀑布',
	},
	喷泉西侧蘑菇堆: {
		en: 'Mushroom pile west of the fountain',
		ja: '噴水西側のキノコの山',
		ko: '분수 서쪽 버섯 더미',
		'zh-TW': '噴泉西側蘑菇堆',
	},
	'喷泉（东侧）': {
		en: 'Fountain (east)',
		ja: '噴水（東側）',
		ko: '분수(동쪽)',
		'zh-TW': '噴泉（東側）',
	},
	'喷泉（东北侧）': {
		en: 'Fountain (northeast)',
		ja: '噴水（北東側）',
		ko: '분수(북동쪽)',
		'zh-TW': '噴泉（東北側）',
	},
	'喷泉（东南侧）': {
		en: 'Fountain (southeast)',
		ja: '噴水（南東側）',
		ko: '분수(남동쪽)',
		'zh-TW': '噴泉（東南側）',
	},
	'喷泉（西南侧）': {
		en: 'Fountain (southwest)',
		ja: '噴水（南西側）',
		ko: '분수(남서쪽)',
		'zh-TW': '噴泉（西南側）',
	},
	巨碗后方: {
		en: 'Behind the giant bowl',
		ja: '巨大な鉢の後ろ',
		ko: '거대한 그릇 뒤',
		'zh-TW': '巨碗後方',
	},
	'拱桥（上方）': {
		en: 'Arch bridge (above)',
		ja: 'アーチ橋（上側）',
		ko: '아치교(위쪽)',
		'zh-TW': '拱橋（上方）',
	},
	'拱桥（下方）': {
		en: 'Arch bridge (below)',
		ja: 'アーチ橋（下側）',
		ko: '아치교(아래쪽)',
		'zh-TW': '拱橋（下方）',
	},
	捕兽夹: { en: 'Trap', ja: '罠', ko: '덫', 'zh-TW': '捕獸夾' },
	'捕兽夹（东侧）': {
		en: 'Trap (east)',
		ja: '罠（東側）',
		ko: '덫(동쪽)',
		'zh-TW': '捕獸夾（東側）',
	},
	'捕兽夹（中部）': {
		en: 'Trap (central)',
		ja: '罠（中央）',
		ko: '덫(중앙)',
		'zh-TW': '捕獸夾（中部）',
	},
	月光草: { en: 'Lunar Herb', ja: '月光草', ko: '월광초', 'zh-TW': '月光草' },
	'月虹池（右上）': {
		en: 'Moonbow pond (upper right)',
		ja: '月虹の池（右上）',
		ko: '월홍 연못(오른쪽 위)',
		'zh-TW': '月虹池（右上）',
	},
	'月虹池（右下）': {
		en: 'Moonbow pond (lower right)',
		ja: '月虹の池（右下）',
		ko: '월홍 연못(오른쪽 아래)',
		'zh-TW': '月虹池（右下）',
	},
	'月虹池（左上）': {
		en: 'Moonbow pond (upper left)',
		ja: '月虹の池（左上）',
		ko: '월홍 연못(왼쪽 위)',
		'zh-TW': '月虹池（左上）',
	},
	'月虹池（左下）': {
		en: 'Moonbow pond (lower left)',
		ja: '月虹の池（左下）',
		ko: '월홍 연못(왼쪽 아래)',
		'zh-TW': '月虹池（左下）',
	},
	柠檬树: {
		en: 'Lemon tree',
		ja: 'レモンの木',
		ko: '레몬 나무',
		'zh-TW': '檸檬樹',
	},
	树桩: {
		en: 'Tree stump',
		ja: '切り株',
		ko: '나무 그루터기',
		'zh-TW': '樹樁',
	},
	桃子: { en: 'Peach', ja: '桃', ko: '복숭아', 'zh-TW': '桃子' },
	桃树: { en: 'Peach tree', ja: '桃の木', ko: '복숭아나무', 'zh-TW': '桃樹' },
	'桃树（蜂蜜）': {
		en: 'Peach tree (honey)',
		ja: '桃の木（蜂蜜）',
		ko: '복숭아나무(벌꿀)',
		'zh-TW': '桃樹（蜂蜜）',
	},
	水涡: { en: 'Whirlpool', ja: '渦', ko: '소용돌이', 'zh-TW': '水渦' },
	'水涡（上方）': {
		en: 'Whirlpool (above)',
		ja: '渦（上側）',
		ko: '소용돌이(위쪽)',
		'zh-TW': '水渦（上方）',
	},
	'水涡（下方）': {
		en: 'Whirlpool (below)',
		ja: '渦（下側）',
		ko: '소용돌이(아래쪽)',
		'zh-TW': '水渦（下方）',
	},
	'水涡（东侧）': {
		en: 'Whirlpool (east)',
		ja: '渦（東側）',
		ko: '소용돌이(동쪽)',
		'zh-TW': '水渦（東側）',
	},
	'水涡（入口楼梯上方）': {
		en: 'Whirlpool (above the entrance stairs)',
		ja: '渦（入口階段の上側）',
		ko: '소용돌이(입구 계단 위쪽)',
		'zh-TW': '水渦（入口樓梯上方）',
	},
	'水涡（入口楼梯下方）': {
		en: 'Whirlpool (below the entrance stairs)',
		ja: '渦（入口階段の下側）',
		ko: '소용돌이(입구 계단 아래쪽)',
		'zh-TW': '水渦（入口樓梯下方）',
	},
	'水涡（拱桥上方）': {
		en: 'Whirlpool (above the arch bridge)',
		ja: '渦（アーチ橋の上側）',
		ko: '소용돌이(아치교 위쪽)',
		'zh-TW': '水渦（拱橋上方）',
	},
	'水涡（木桥上方右侧一）': {
		en: 'Whirlpool (first from the right above the wooden bridge)',
		ja: '渦（木橋の上側、右から一番目）',
		ko: '소용돌이(나무다리 위쪽, 오른쪽에서 첫 번째)',
		'zh-TW': '水渦（木橋上方右側一）',
	},
	'水涡（木桥上方右侧三）': {
		en: 'Whirlpool (third from the right above the wooden bridge)',
		ja: '渦（木橋の上側、右から三番目）',
		ko: '소용돌이(나무다리 위쪽, 오른쪽에서 세 번째)',
		'zh-TW': '水渦（木橋上方右側三）',
	},
	'水涡（木桥上方右侧二）': {
		en: 'Whirlpool (second from the right above the wooden bridge)',
		ja: '渦（木橋の上側、右から二番目）',
		ko: '소용돌이(나무다리 위쪽, 오른쪽에서 두 번째)',
		'zh-TW': '水渦（木橋上方右側二）',
	},
	'水涡（木桥上方右侧四）': {
		en: 'Whirlpool (fourth from the right above the wooden bridge)',
		ja: '渦（木橋の上側、右から四番目）',
		ko: '소용돌이(나무다리 위쪽, 오른쪽에서 네 번째)',
		'zh-TW': '水渦（木橋上方右側四）',
	},
	'水涡（木桥上方左侧）': {
		en: 'Whirlpool (left of the wooden bridge, above)',
		ja: '渦（木橋の上側、左側）',
		ko: '소용돌이(나무다리 위쪽, 왼쪽)',
		'zh-TW': '水渦（木橋上方左側）',
	},
	'水涡（木桥西侧）': {
		en: 'Whirlpool (west of the wooden bridge)',
		ja: '渦（木橋の西側）',
		ko: '소용돌이(나무다리 서쪽)',
		'zh-TW': '水渦（木橋西側）',
	},
	'水涡（河流上方）': {
		en: 'Whirlpool (above the river)',
		ja: '渦（川の上側）',
		ko: '소용돌이(강 위쪽)',
		'zh-TW': '水渦（河流上方）',
	},
	'水涡（河流右侧）': {
		en: 'Whirlpool (right of the river)',
		ja: '渦（川の右側）',
		ko: '소용돌이(강 오른쪽)',
		'zh-TW': '水渦（河流右側）',
	},
	'水涡（河流左侧）': {
		en: 'Whirlpool (left of the river)',
		ja: '渦（川の左側）',
		ko: '소용돌이(강 왼쪽)',
		'zh-TW': '水渦（河流左側）',
	},
	'水涡（湖泊右下）': {
		en: 'Whirlpool (lower right of the lake)',
		ja: '渦（湖の右下）',
		ko: '소용돌이(호수 오른쪽 아래)',
		'zh-TW': '水渦（湖泊右下）',
	},
	'水涡（湖泊左下）': {
		en: 'Whirlpool (lower left of the lake)',
		ja: '渦（湖の左下）',
		ko: '소용돌이(호수 왼쪽 아래)',
		'zh-TW': '水渦（湖泊左下）',
	},
	'水涡（码头左上）': {
		en: 'Whirlpool (upper left of the pier)',
		ja: '渦（桟橋の左上）',
		ko: '소용돌이(부두 왼쪽 위)',
		'zh-TW': '水渦（碼頭左上）',
	},
	'水涡（码头左下）': {
		en: 'Whirlpool (lower left of the pier)',
		ja: '渦（桟橋の左下）',
		ko: '소용돌이(부두 왼쪽 아래)',
		'zh-TW': '水渦（碼頭左下）',
	},
	'水涡（码头左侧）': {
		en: 'Whirlpool (left of the pier)',
		ja: '渦（桟橋の左側）',
		ko: '소용돌이(부두 왼쪽)',
		'zh-TW': '水渦（碼頭左側）',
	},
	河流: { en: 'River', ja: '川', ko: '강', 'zh-TW': '河流' },
	温室: { en: 'Greenhouse', ja: '温室', ko: '온실', 'zh-TW': '溫室' },
	游乐场: { en: 'Playground', ja: '遊び場', ko: '놀이터', 'zh-TW': '遊樂場' },
	码头: { en: 'Pier', ja: '桟橋', ko: '부두', 'zh-TW': '碼頭' },
	竹子: { en: 'Bamboo', ja: '竹', ko: '대나무', 'zh-TW': '竹子' },
	竹笋堆: {
		en: 'Bamboo shoot pile',
		ja: '筍の山',
		ko: '죽순 더미',
		'zh-TW': '竹筍堆',
	},
	红豆树: {
		en: 'Red bean tree',
		ja: '小豆の木',
		ko: '팥나무',
		'zh-TW': '紅豆樹',
	},
	花丛: { en: 'Flower field', ja: '花畑', ko: '꽃밭', 'zh-TW': '花叢' },
	'花丛（中部）': {
		en: 'Flower field (central)',
		ja: '花畑（中央）',
		ko: '꽃밭(중앙)',
		'zh-TW': '花叢（中部）',
	},
	'花丛（西侧）': {
		en: 'Flower field (west)',
		ja: '花畑（西側）',
		ko: '꽃밭(서쪽)',
		'zh-TW': '花叢（西側）',
	},
	'花丛（西北侧）': {
		en: 'Flower field (northwest)',
		ja: '花畑（北西側）',
		ko: '꽃밭(북서쪽)',
		'zh-TW': '花叢（西北側）',
	},
	'花丛（西南侧）': {
		en: 'Flower field (southwest)',
		ja: '花畑（南西側）',
		ko: '꽃밭(남서쪽)',
		'zh-TW': '花叢（西南側）',
	},
	'莲花池（中部右）': {
		en: 'Lotus pond (central right)',
		ja: '蓮の池（中央右）',
		ko: '연못(중앙 오른쪽)',
		'zh-TW': '蓮花池（中部右）',
	},
	'莲花池（中部左）': {
		en: 'Lotus pond (central left)',
		ja: '蓮の池（中央左）',
		ko: '연못(중앙 왼쪽)',
		'zh-TW': '蓮花池（中部左）',
	},
	'莲花池（右侧）': {
		en: 'Lotus pond (right)',
		ja: '蓮の池（右側）',
		ko: '연못(오른쪽)',
		'zh-TW': '蓮花池（右側）',
	},
	'莲花池（左侧）': {
		en: 'Lotus pond (left)',
		ja: '蓮の池（左側）',
		ko: '연못(왼쪽)',
		'zh-TW': '蓮花池（左側）',
	},
	萝卜: { en: 'Radish', ja: '大根', ko: '무', 'zh-TW': '蘿蔔' },
	葡萄架: {
		en: 'Grape trellis',
		ja: 'ぶどう棚',
		ko: '포도 시렁',
		'zh-TW': '葡萄架',
	},
	蘑菇堆: {
		en: 'Mushroom pile',
		ja: 'キノコの山',
		ko: '버섯 더미',
		'zh-TW': '蘑菇堆',
	},
	'蘑菇堆（西侧）': {
		en: 'Mushroom pile (west)',
		ja: 'キノコの山（西側）',
		ko: '버섯 더미(서쪽)',
		'zh-TW': '蘑菇堆（西側）',
	},
	蜂巢: { en: 'Beehive', ja: '蜂の巣', ko: '벌집', 'zh-TW': '蜂巢' },
	蝉蜕树: {
		en: 'Cicada slough tree',
		ja: '蝉退の木',
		ko: '매미 허물 나무',
		'zh-TW': '蟬蛻樹',
	},
	西侧守矢分社: {
		en: 'West Moriya branch shrine',
		ja: '守矢分社（西側）',
		ko: '모리야 분사(서쪽)',
		'zh-TW': '西側守矢分社',
	},
	西侧泉水: {
		en: 'West spring',
		ja: '西側の泉',
		ko: '서쪽 샘',
		'zh-TW': '西側泉水',
	},
	西侧花丛: {
		en: 'West flower field',
		ja: '西側の花畑',
		ko: '서쪽 꽃밭',
		'zh-TW': '西側花叢',
	},
	西北侧妖精雨露: {
		en: 'Northwest Fairy Dew',
		ja: '北西側の妖精の露',
		ko: '북서쪽 요정의 이슬비',
		'zh-TW': '西北側妖精雨露',
	},
	西北瀑布: {
		en: 'Northwest waterfall',
		ja: '北西の滝',
		ko: '북서쪽 폭포',
		'zh-TW': '西北瀑布',
	},
	西北香椿树: {
		en: 'Northwest Red Toon tree',
		ja: '北西の香椿の木',
		ko: '북서쪽 참죽나무',
		'zh-TW': '西北香椿樹',
	},
	西南侧莲花: {
		en: 'Southwest lotus',
		ja: '南西側の蓮',
		ko: '남서쪽 연꽃',
		'zh-TW': '西南側蓮花',
	},
	西南侧蘑菇堆: {
		en: 'Southwest mushroom pile',
		ja: '南西側のキノコの山',
		ko: '남서쪽 버섯 더미',
		'zh-TW': '西南側蘑菇堆',
	},
	西南侧蜂巢: {
		en: 'Southwest beehive',
		ja: '南西側の蜂の巣',
		ko: '남서쪽 벌집',
		'zh-TW': '西南側蜂巢',
	},
	西南侧蝉蜕树: {
		en: 'Southwest cicada slough tree',
		ja: '南西側の蝉退の木',
		ko: '남서쪽 매미 허물 나무',
		'zh-TW': '西南側蟬蛻樹',
	},
	西南侧西蓝花丛: {
		en: 'Southwest broccoli patch',
		ja: '南西側のブロッコリー畑',
		ko: '남서쪽 브로콜리밭',
		'zh-TW': '西南側西藍花叢',
	},
	辣椒丛: {
		en: 'Chili patch',
		ja: '唐辛子畑',
		ko: '고추밭',
		'zh-TW': '辣椒叢',
	},
	'酒水架（北侧）': {
		en: 'Drink rack (north)',
		ja: '飲み物棚（北側）',
		ko: '술 선반(북쪽)',
		'zh-TW': '酒水架（北側）',
	},
	'酒水架（南侧）': {
		en: 'Drink rack (south)',
		ja: '飲み物棚（南側）',
		ko: '술 선반(남쪽)',
		'zh-TW': '酒水架（南側）',
	},
	'酒水架（西北侧）': {
		en: 'Drink rack (northwest)',
		ja: '飲み物棚（北西側）',
		ko: '술 선반(북서쪽)',
		'zh-TW': '酒水架（西北側）',
	},
	酒窖: { en: 'Wine cellar', ja: '酒蔵', ko: '술 창고', 'zh-TW': '酒窖' },
	银杏树: {
		en: 'Ginkgo tree',
		ja: 'イチョウの木',
		ko: '은행나무',
		'zh-TW': '銀杏樹',
	},
	银杏树蜂巢: {
		en: 'Ginkgo tree beehive',
		ja: 'イチョウの木の蜂の巣',
		ko: '은행나무 벌집',
		'zh-TW': '銀杏樹蜂巢',
	},
	露水点: {
		en: 'Dew spot',
		ja: '露のポイント',
		ko: '이슬 지점',
		'zh-TW': '露水點',
	},
	'露水点（南侧亭子）': {
		en: 'Dew spot (south pavilion)',
		ja: '露のポイント（南側のあずまや）',
		ko: '이슬 지점(남쪽 정자)',
		'zh-TW': '露水點（南側亭子）',
	},
	'露水点（小屋前方）': {
		en: 'Dew spot (in front of the hut)',
		ja: '露のポイント（小屋の前）',
		ko: '이슬 지점(오두막 앞)',
		'zh-TW': '露水點（小屋前方）',
	},
	'露水点（小屋后方）': {
		en: 'Dew spot (behind the hut)',
		ja: '露のポイント（小屋の後ろ）',
		ko: '이슬 지점(오두막 뒤)',
		'zh-TW': '露水點（小屋後方）',
	},
	魅魔房顶: {
		en: "Mima's rooftop",
		ja: '魅魔の屋根',
		ko: '미마의 지붕',
		'zh-TW': '魅魔房頂',
	},
	鸡窝: { en: 'Chicken coop', ja: '鶏小屋', ko: '닭장', 'zh-TW': '雞窩' },
	黄瓜堆: {
		en: 'Cucumber pile',
		ja: 'きゅうりの山',
		ko: '오이 더미',
		'zh-TW': '黃瓜堆',
	},
	黑盐: { en: 'Black Salt', ja: '黒塩', ko: '블랙솔트', 'zh-TW': '黑鹽' },
};

const MAP_INTERACTION_LABEL_TRANSLATIONS: Readonly<
	Record<string, TPointLabelTranslations>
> = {
	'20万贺图': {
		en: '200K celebration artwork',
		ja: '20万祝賀イラスト',
		ko: '20만 축하 일러스트',
		'zh-TW': '20萬賀圖',
	},
	CG鉴赏: {
		en: 'CG gallery',
		ja: 'CG鑑賞',
		ko: 'CG 감상',
		'zh-TW': 'CG鑑賞',
	},
	万本纪念: {
		en: '10,000 Sales Commemoration',
		ja: '万本記念',
		ko: '1만 부 기념',
		'zh-TW': '萬本紀念',
	},
	任务线索: {
		en: 'Task clue',
		ja: '任務の手がかり',
		ko: '임무 단서',
		'zh-TW': '任務線索',
	},
	博丽大祭挑战: {
		en: 'Hakurei Grand Festival challenge',
		ja: '博麗大祭の挑戦',
		ko: '하쿠레이 예대제 도전',
		'zh-TW': '博麗大祭挑戰',
	},
	博丽神社赛钱箱: {
		en: 'Hakurei Shrine donation box',
		ja: '博麗神社の賽銭箱',
		ko: '하쿠레이 신사 향전함',
		'zh-TW': '博麗神社賽錢箱',
	},
	同人图: {
		en: 'Fan art',
		ja: 'ファンアート',
		ko: '팬 아트',
		'zh-TW': '同人圖',
	},
	地藏人偶: {
		en: 'Jizo Figure',
		ja: '地蔵人形',
		ko: '지장 인형',
		'zh-TW': '地藏人偶',
	},
	展示柜: {
		en: 'Display Cabinet',
		ja: '陳列棚',
		ko: '쇼케이스',
		'zh-TW': '展示櫃',
	},
	幻想节拍: {
		en: 'Gensou Beat',
		ja: 'ゲンソウビート',
		ko: '환상 비트',
		'zh-TW': '幻想節拍',
	},
	床: { en: 'Bed', ja: 'ベッド', ko: '침대', 'zh-TW': '牀' },
	料理台: {
		en: 'Cooking table',
		ja: '料理台',
		ko: '조리대',
		'zh-TW': '料理台',
	},
	月都终端: {
		en: 'Lunar Capital terminal',
		ja: '月の都端末',
		ko: '달의 도시 단말기',
		'zh-TW': '月都終端',
	},
	河童重工电话机: {
		en: 'Kappa Heavy Duty Telephone',
		ja: '河童重工電話機',
		ko: '캇파 전화기',
		'zh-TW': '河童重工電話機',
	},
	漫画: { en: 'Comic', ja: '漫画', ko: '만화', 'zh-TW': '漫畫' },
	灯笼A: { en: 'Lantern A', ja: '提灯A', ko: '등불A', 'zh-TW': '燈籠A' },
	灯笼B: { en: 'Lantern B', ja: '提灯B', ko: '등불B', 'zh-TW': '燈籠B' },
	灯笼C: { en: 'Lantern C', ja: '提灯C', ko: '등불C', 'zh-TW': '燈籠C' },
	灯笼D: { en: 'Lantern D', ja: '提灯D', ko: '등불D', 'zh-TW': '燈籠D' },
	灯笼E: { en: 'Lantern E', ja: '提灯E', ko: '등불E', 'zh-TW': '燈籠E' },
	玉石线索: {
		en: 'Jade clue',
		ja: '玉の手がかり',
		ko: '옥 단서',
		'zh-TW': '玉石線索',
	},
	瓶子A: { en: 'Bottle A', ja: '瓶A', ko: '병A', 'zh-TW': '瓶子A' },
	瓶子B: { en: 'Bottle B', ja: '瓶B', ko: '병B', 'zh-TW': '瓶子B' },
	瓶子C: { en: 'Bottle C', ja: '瓶C', ko: '병C', 'zh-TW': '瓶子C' },
	留声机: { en: 'Phonograph', ja: '蓄音機', ko: '축음기', 'zh-TW': '留聲機' },
	衣橱: { en: 'Closet', ja: 'クローゼット', ko: '옷장', 'zh-TW': '衣櫥' },
	贺图: {
		en: 'Celebration artwork',
		ja: '祝賀イラスト',
		ko: '축하 일러스트',
		'zh-TW': '賀圖',
	},
	造物者之盒: {
		en: 'Box of Creation',
		ja: '創造者の箱',
		ko: '창조주의 상자',
		'zh-TW': '造物者之盒',
	},
	遗失书本线索: {
		en: 'Lost book clue',
		ja: '紛失した本の手がかり',
		ko: '분실된 책 단서',
		'zh-TW': '遺失書本線索',
	},
	酒水仓库: {
		en: 'Beverage storage',
		ja: '酒水倉庫',
		ko: '주류 창고',
		'zh-TW': '酒水倉庫',
	},
	飞碟老虎机: {
		en: 'UFO Slot Machine',
		ja: 'UFOスロットマシン',
		ko: '벤토라 슬롯머신',
		'zh-TW': '飛碟老虎機',
	},
	食材仓库: {
		en: 'Ingredient storage',
		ja: '食材倉庫',
		ko: '식재료 창고',
		'zh-TW': '食材倉庫',
	},
	鸡毛线索: {
		en: 'Chicken feather clue',
		ja: '鶏の羽の手がかり',
		ko: '닭 깃털 단서',
		'zh-TW': '雞毛線索',
	},
};

let activeLocale: TLocale = DEFAULT_LOCALE;

export function deactivatePointLabels() {
	activeLocale = DEFAULT_LOCALE;
}

export function activatePointLabels(locale: TLocale) {
	activeLocale = locale;
}

export function getPointLabel(canonicalLabel: string) {
	return (
		POINT_LABEL_TRANSLATIONS[canonicalLabel]?.[activeLocale] ??
		MAP_INTERACTION_LABEL_TRANSLATIONS[canonicalLabel]?.[activeLocale] ??
		canonicalLabel
	);
}
