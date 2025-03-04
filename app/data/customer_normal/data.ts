/* eslint-disable sort-keys */
import type {ICustomerNormal} from './types';
import {DYNAMIC_TAG_MAP} from '@/data/constant';

export const CUSTOMER_NORMAL_LIST = [
	{
		id: 0,
		name: '妖怪兔',
		description:
			'兔子就算变成了妖怪，也还是喜欢甘甜新鲜的味道呢，真是可爱。当然啦，已经成为了妖怪，不吃肉是不可能的。吃肉的样子也很可爱。',
		dlc: 0,
		places: ['妖怪兽道', '红魔馆', '迷途竹林', '魔法森林', '妖怪之山', '地灵殿'],
		positiveTags: [
			'家常',
			'咸',
			'鲜',
			'甜',
			DYNAMIC_TAG_MAP.signature,
			'凉爽',
			'力量涌现',
			'果味',
			DYNAMIC_TAG_MAP.popularPositive,
		],
		beverageTags: ['无酒精'],
		chat: [
			'注重健康的生活才能长寿呜撒！这就是妖怪兔的智慧呜撒！',
			'一般来说遇到我们的Boss可以获得幸运呜撒！不过如果是在这里的话。',
			'竹林很漂亮的呜撒！笋也很好吃呜撒！但是外人不许进去呜撒！',
			'满月的时候，会有人变得奇怪呜撒…和我们可没关系哦！',
			'乌冬？听起来很有亲切感呜撒！会很好吃吧！',
		],
	},
	{
		id: 1,
		name: '妖怪猫',
		description:
			'妖怪猫特征是两尾分岔成两股，据说妖力越大，分岔越明显。明明长得那么可爱，性格却很凶！幻想乡就连野猫的嘴巴也很刁呢。',
		dlc: 0,
		places: ['妖怪兽道', '博丽神社', '红魔馆', '迷途竹林', '魔法森林', '妖怪之山', '地灵殿'],
		positiveTags: ['肉', '海味', '中华', DYNAMIC_TAG_MAP.signature, '凉爽', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['可加冰', '啤酒', '苦'],
		chat: [
			'希望这家店的食材可以新鲜一点，猫的嘴可是很刁的。',
			'晚上有这么大的红灯笼的店铺，乍一看还挺吓人的呢。',
			'说猫有九条命的人，绝对是和猫有仇吧！',
			'听说妖兽尾巴越多则越强，但一般妖怪猫都只有两条尾巴。',
			'沾到水的感觉很讨厌啊，下雨天就只想在家里睡觉。',
		],
	},
	{
		id: 2,
		name: '妖怪狸',
		description:
			'性格暴躁，总是摆出一副老油条的样子，其实也没啥本事吧。不过，它们似乎很擅长变幻，要警惕它们用叶子来付账！',
		dlc: 0,
		places: ['妖怪兽道', '博丽神社', '红魔馆', '迷途竹林', '魔法森林', '妖怪之山', '命莲寺'],
		positiveTags: ['肉', '重油', '饱腹', '山珍', '咸', DYNAMIC_TAG_MAP.signature, DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['甘', '辛'],
		chat: [
			'今天遇到的那个神社的巫女真的好可怕啊。',
			'别一直盯着我呀，酒都不好喝了。',
			'知道啦！我不会拿叶子来付款的啦！',
			'老大最近又得到了很多付丧神，这下我们的力量就更强大了！',
			'月亮很漂亮吧？可是你看到的，是真正的月亮吗？',
		],
	},
	{
		id: 3,
		name: '妖怪狐',
		description:
			'经常用一副过来人的口气说话，有种倚老卖老的感觉。不过，可能是因为活得比较久，有时候也会说一些似乎挺有用的话。',
		dlc: 0,
		places: ['妖怪兽道', '红魔馆', '迷途竹林', '妖怪之山', '旧地狱'],
		positiveTags: ['肉', '和风', '中华', DYNAMIC_TAG_MAP.signature, '小巧', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['直饮'],
		chat: [
			'我倒要看看现在的年轻人的居酒屋搞得怎么样。',
			'对长者放尊重点，我掉过的P点比你吃过的米还多。',
			'酒这东西，年轻人都喜欢兑水喝…不行，不行。',
			'如果加入某些高级的食材，料理的氛围也会变得高级！给我好好记住啊！',
			'要多读书多看报…就算天狗的报纸不太靠谱，但是偶尔也有稀有情报。',
		],
	},
	{
		id: 4,
		name: '蟒蛇精',
		description:
			'似乎是上古的凶兽…曾经是这样认为的。实际见了之后，才发现只是一只馋怪而已。食量很大，而且对口感的要求很高。',
		dlc: 0,
		places: ['妖怪兽道', '妖怪之山', '旧地狱'],
		positiveTags: ['肉', '下酒', '山珍', '力量涌现', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['烧酒', '清酒'],
		chat: [
			'妖兽果然还是要吃肉啊！',
			'那里的夜雀看起来很好吃的样子…什么，是店员不是吃的啊。',
			'虽然人类很害怕兽道，但是其实路上好东西很多。',
			'黑暗中的红灯笼店，看到的一瞬间脚就已经踏进来了。',
			'说起来，兽道的野猪如果能拿来做料理的话，应该会很好吃吧。',
		],
	},
	{
		id: 5,
		name: '人类小孩',
		description:
			'吵吵闹闹的人类小不点儿，这种家伙要是在以前…现在好好接触下来以后，偶尔看着他们亲近自己的笑脸，会不知不觉地感到疲劳减少，真是奇怪啊。',
		dlc: 0,
		places: ['人间之里'],
		positiveTags: [
			'肉',
			'家常',
			'饱腹',
			'中华',
			'咸',
			'甜',
			DYNAMIC_TAG_MAP.signature,
			'凉爽',
			DYNAMIC_TAG_MAP.popularPositive,
		],
		beverageTags: ['无酒精'],
		chat: [
			'耶！攒够零花钱出来玩了！',
			'不想上课啊…偷偷跑出来不会被慧音老师发现吧？',
			'慧音老师的课真的好——无——聊！如果是阿求姐姐来上的话大概会不一样吧？',
			'小孩子也有小孩子的烦恼，需要借果汁消愁！',
			'上次从一个妖精手里抢到了和我一样高的向日葵诶。',
		],
	},
	{
		id: 6,
		name: '人类男性',
		description:
			'看着也不是多了不起的角色，却总是自说自话。尤其是喝了酒就喜欢发牢骚。不过在人类这一种族中，似乎是体格最强的存在，常被依赖着。',
		dlc: 0,
		places: ['人间之里', '命莲寺', '神灵庙'],
		positiveTags: ['肉', '下酒', '和风', '咸', '鲜', '灼热', '文化底蕴', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['可加热', '烧酒'],
		chat: [
			'干了一天活过来喝一杯！',
			'饿死了饿死了，已经闻到食物的香气了。',
			'我女儿让我去香霖堂买什么…手鸡？现在的小孩子啊。',
			'真是麻烦啊，今天又被上面的人刁难了，还是喝酒开心啊！',
			'店主！为什么没有烧鸟啊！啊…别这么看着我啊。',
		],
	},
	{
		id: 7,
		name: '人类女性',
		description:
			'只要聚在一起就会有说不完的话，基本说的都是些生活琐事，或者互相奉承衣服首饰什么的。偶尔还能听到关于料理的技巧，这点倒是挺好的。',
		dlc: 0,
		places: ['人间之里', '博丽神社', '命莲寺', '神灵庙'],
		positiveTags: ['水产', '高级', '咸', '鲜', DYNAMIC_TAG_MAP.signature, '凉爽', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['可加冰'],
		chat: [
			'听说看到报春精会带来好运，我也想见一见呢。',
			'邻居太太的手工很好，每次都能把衣裳裁出不同的花样，真让人羡慕啊。',
			'小儿子最近太淘了，上次还抓了一只妖精回家，幸好最后没出什么事。',
			'不是自己做的饭吃起来就是没有心理负担呢。',
			'呼呼~比起那种大叔才会喜欢的烈酒，我还是更喜欢温和一点的饮料。',
		],
	},
	{
		id: 8,
		name: '人类长者',
		description:
			'人类的长者充其量也不过活了几十年罢了，对我们妖怪来说是很短的岁月。但是有些老人身上似乎有种仙人般的气质…偶尔听听老人的话，应该也不会吃亏吧。',
		dlc: 0,
		places: ['人间之里', '博丽神社', '神灵庙'],
		positiveTags: ['高级', DYNAMIC_TAG_MAP.signature, '适合拍照', '灼热', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['低酒精'],
		chat: [
			'今天天气不错…不过以前有段时间天气很糟糕，一会起雾一会地震一会冰雹的。',
			'我这把年纪了，实在是没法住在魔法森林附近…太潮湿了，关节成天疼。',
			'活的久了，什么都能看得到。梅花和樱花一起盛开的夏日什么的，还是挺好的。',
			'在这个地方活着啊，还是要顺应时代，不能太墨守成规啊。',
			'今年的季节很正常呢，真是难得。',
		],
	},
	{
		id: 9,
		name: '左卫门',
		description:
			'据说是人类里的有名的大胃王，为了追寻美味，甚至不惜离开村子到处旅行…能平安地活着真是不容易啊，就让我来满足你的胃吧。',
		dlc: 0,
		places: ['人间之里', '博丽神社'],
		positiveTags: ['高级', '生', '力量涌现', '猎奇', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['高酒精'],
		chat: [
			'稗田家的大小姐，可是什么都知道呢，就是身体不太好，哎。',
			'自从有了慧音老师，村里的人都能读书了。',
			'虽然对自家的田地很自信，但是终究还是比不过妖怪之山那边有神明眷顾的田地啊。',
			'人间之里当然是只有人类的村子啦！嗯？你那个怀疑的眼神是怎么回事？',
			'虽然兽道的妖怪也很可怕，但是最麻烦的果然是那只横冲直撞的山猪。',
		],
	},
	{
		id: 10,
		name: '座敷童子',
		description:
			'一直以为座敷童子是地缚灵的一种，没想到这种认知是错误的。似乎只要依附在什么东西上，就可以到处往来的样子。对了，听说座敷童子会给店家带来好运，至少希望这个传言是真的呢。',
		dlc: 0,
		places: ['博丽神社'],
		positiveTags: ['山珍', '和风', '甜', '生', DYNAMIC_TAG_MAP.signature, '凉爽', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['无酒精', '低酒精'],
		chat: [
			'虽然名字是童子，但我已经不是小孩子了！',
			'就算是咱们座敷童子，偶尔也想要周游世界呢。',
			'座敷童子其实并不是像地缚灵那样，只能呆在固定的场所里哦。',
			'可恶，不能输在气势上，一定要装作常来的样子。',
			'谁说座敷童子不能出门，我们之前还去过外界呢…啊，这个好像不能说出来！',
		],
	},
	{
		id: 11,
		name: '河童',
		description:
			'传说中的河童只是擅于弄水，幻想乡里的河童却还擅于经商，可以说是我的大前辈。那份游刃有余地拨着算盘的身姿，偶尔会让我移不开眼睛呢。',
		dlc: 0,
		places: ['博丽神社', '红魔馆', '魔法森林', '妖怪之山'],
		positiveTags: [
			'高级',
			'海味',
			DYNAMIC_TAG_MAP.signature,
			'灼热',
			'猎奇',
			'小巧',
			DYNAMIC_TAG_MAP.largePartition,
			DYNAMIC_TAG_MAP.popularPositive,
		],
		beverageTags: ['甘'],
		chat: [
			'哦？原来也有这种店面啊。',
			'没有学过的菜谱就算强行做出来也会奇奇怪怪的，还是循序渐进的好。',
			'区区住在林子里的猴子，是不会明白河里的乐趣。',
			'在幻想乡里你是东洋派还是西洋派？选哪边都会得罪另一边吧。',
			'虽然香霖堂会卖些奇怪的稀有玩意儿，但我觉得还是我们的商品更实用一些。',
		],
	},
	{
		id: 12,
		name: '地精',
		description:
			'让人有点儿头疼的客人。虽然性格挺沉稳的，但似乎因为长相，会吓到一些人类客人。真是搞不懂，明明和其他妖怪同桌都没问题啊…',
		dlc: 0,
		places: [],
		positiveTags: ['高级', '重油', '山珍', '凉爽', '灼热', '力量涌现', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['清酒', '西洋酒'],
		chat: [
			'来了幻想乡这么久，还是一出门就会被盯着看。',
			'人类就是喜欢以貌取人的生物！',
			'还以为住进洋馆就能过上好日子，结果还是有那么多活要干啊。',
			'我们虽然长得丑了那么一点点，但干活可是很麻利的。',
			'长得好看有什么用，难道长得好看就可以不吃饭吗？',
		],
	},
	{
		id: 13,
		name: '鸦天狗',
		description:
			'谈吐虽然彬彬有礼，却又感觉有点儿强势。这是时常跑外勤的鸦天狗这一类天狗的通性，我实在有些不擅于应付。不过来者是客，我会努力照顾好的！',
		dlc: 0,
		places: ['博丽神社', '红魔馆', '迷途竹林', '妖怪之山'],
		positiveTags: ['高级', DYNAMIC_TAG_MAP.signature, '适合拍照', '菌类', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['烧酒', '清酒'],
		chat: [
			'秋天的话，妖怪之山的枫叶会非常漂亮。',
			'虽然奇怪的传闻很多…但是我还是很尊重博丽的巫女大人的。',
			'我很喜欢拜访朋友的时候带一些手作食物，不过老板娘应该更擅长这个吧？见笑了。',
			'神秘的洋馆的传闻？你是说北边的那个，还是西边的那个呢？这可是幻想乡。',
			'只要好好去完成客人的要求，就不会被特地刁难。',
		],
	},
	{
		id: 14,
		name: '妖精',
		description:
			'妖精其实不用吃东西，它们看见人吃美味的东西就模仿着吃。喜欢热闹，也喜欢恶作剧，千万要注意别着了它们的道！',
		dlc: 0,
		places: ['红魔馆', '迷途竹林', '魔法森林'],
		positiveTags: ['鲜', '甜', '适合拍照', '菌类', '梦幻', '特产', '果味', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['直饮', '水果', '甘', '气泡'],
		chat: [
			'哗~虽然妖精是不用吃东西的，但是还是来叨扰啦！',
			'放心吧！虽然我们喜欢恶作剧，但是有那种东西在的店还是不会干什么的哗。',
			'那种东西指的是？…哗，就是门口那张，品味独特的符纸。',
			'妖精和妖怪的区别？简单地说，我们更加可爱一点！',
			'雾之湖最近来了外人，明明是妖怪却用着奇怪的东西进行可疑的作业。',
		],
	},
	{
		id: 1000,
		name: '白狼天狗',
		description:
			'天狗的社会有严密的等级制度，山中侍卫这一职务基本都是由白狼天狗担当。大概是职责所在，他们多数的性格比较严肃，但有时候喝多了也会口无遮拦。',
		dlc: 1,
		places: ['妖怪之山'],
		positiveTags: [
			'肉',
			'重油',
			'饱腹',
			'山珍',
			'咸',
			'鲜',
			'生',
			DYNAMIC_TAG_MAP.signature,
			'特产',
			DYNAMIC_TAG_MAP.popularPositive,
		],
		beverageTags: ['中酒精', '高酒精', '烧酒', '清酒'],
		chat: [
			'我们跑腿的只能在山上做些低端基本的工作。',
			'听说鬼又开始在幻想乡行动了？该不会卷土重来吧？',
			'居然跑来这种地方开店，真是知道怎么给我们增加工作量啊。',
			'那些高级天狗的实力比我们强多了，我们护卫的意义到底在哪里？',
		],
	},
	{
		id: 1001,
		name: '山姥',
		description:
			'住在妖怪山上的非常孤僻的种族，哪怕是同族之间也几乎没有交流。有传言说她们会抓走在山中迷路的小孩…但这是误会，虽然她们经常撂狠话，可她们只是不善言谈，其实是非常直爽善良的妖怪。',
		dlc: 1,
		places: ['妖怪之山'],
		positiveTags: ['肉', '家常', '高级', '饱腹', '鲜', '力量涌现', '猎奇', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['高酒精', '烧酒', '直饮', '古典'],
		chat: [
			'看什么看！再看挖了你的眼睛哦！',
			'山姥是没有集团和组织，喜欢单独行动的种族。',
			'这座山可不仅仅是天狗的东西。',
			'这世间居然有食堂这种存在，这个时代的大家已经懒得连饭也不做了吗？',
		],
	},
	{
		id: 1002,
		name: '山童',
		description:
			'舍弃了河的河童，跑到妖怪之山的深处建立了大本营，依然是山上的专家！在经济方面的研究尤其先进，构筑着复杂的金钱系统，是我完全无法理解的领域。',
		dlc: 1,
		places: ['妖怪之山'],
		positiveTags: [
			'高级',
			'山珍',
			DYNAMIC_TAG_MAP.signature,
			'灼热',
			'猎奇',
			'小巧',
			DYNAMIC_TAG_MAP.largePartition,
			DYNAMIC_TAG_MAP.popularPositive,
		],
		beverageTags: ['中酒精', '苦'],
		chat: [
			'河流什么的，我们早就不在意了。',
			'玩模拟战争的游戏把我给玩饿了！等我吃饱了回去再战个痛快！',
			'区区住在河里的两栖类，是不会明白山上的乐趣。',
			'村子里的经济和山中的经济是两个完全不同的系统。',
		],
	},
	{
		id: 1003,
		name: '魔法使',
		description:
			'魔法森林里生长着许多有助于魔法使提高魔力的蘑菇，因此这里住着好多魔法使。她们大多独居，性格比较孤僻，大概魔法修行本身就是一件寂寞的事情吧。',
		dlc: 1,
		places: ['魔法森林'],
		positiveTags: [
			'素',
			'家常',
			'高级',
			'传说',
			'清淡',
			'西式',
			'鲜',
			'适合拍照',
			'凉爽',
			DYNAMIC_TAG_MAP.popularPositive,
		],
		beverageTags: ['可加热', '鸡尾酒', '西洋酒', '提神'],
		chat: [
			'魔法是一种超自然力，但归根结底，其本核还是科学。',
			'遇到认识但几乎没有来往的人的时候，上前打招呼真是需要勇气啊。',
			'进行魔法研究的时候必须全神贯注，为了不被打扰，魔法使几乎都是独居。',
			'修行魔法是很费钱的。如果我能早点学会舍食魔法，就能把吃饭的钱省下来研究魔法了。',
		],
	},
	{
		id: 1004,
		name: '森之妖精',
		description:
			'妖精越多，大自然就会越有生机。魔法森林的各种物资都非常丰富，这是因为森林中寄宿许多妖精。据说每棵树都有妖精寄宿其中。妖精多恶作剧也多，要小心才行呢。',
		dlc: 1,
		places: ['魔法森林'],
		positiveTags: [
			'家常',
			'和风',
			'中华',
			'鲜',
			'甜',
			DYNAMIC_TAG_MAP.signature,
			'凉爽',
			'小巧',
			'梦幻',
			DYNAMIC_TAG_MAP.popularPositive,
		],
		beverageTags: ['无酒精', '低酒精', '清酒', '水果', '甘'],
		chat: [
			'森林里的地穴探险非常有意思！不过基本都是些怕寒妖精的家。',
			'刚刚来的路上差点被食人牵牛花吞了，好险好险！',
			'长在树上的妖怪西瓜你见过吗？被砸到真的很痛啊。',
			'我的朋友吃了致幻蘑菇以后，居然产生了自己变成屎壳郎的幻觉，笑死我了！',
		],
	},
	{
		id: 1005,
		name: '迷之人形',
		description:
			'来历不明的人偶。暂时还不确定是不是付丧神。毕竟森林里住着一位能够操纵人偶的魔法使…但这些人偶看起来实在不像是被操纵的，大概还是付丧神吧？',
		dlc: 1,
		places: ['魔法森林'],
		positiveTags: ['家常', '咸', '生', '适合拍照', '猎奇', '菌类', '小巧', '梦幻', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['水果', '苦', '气泡', '提神'],
		chat: [
			'森林太潮湿了，感觉自己身上都要发霉了。',
			'无名之丘有一片美丽的铃兰花田，真想去看看啊。',
			'人类什么的，我真是受够了。',
			'森林里不长记性的妖精太多了，到底什么时候才能别把我当玩具啊。',
		],
	},
	{
		id: 2000,
		name: '土蜘蛛',
		description:
			'潜伏在黑暗风穴内的土蜘蛛。虽然大多数性格让人难以理解，但对待建筑事业的态度十分认真虔诚，同伴之间也会经常探讨建筑学的问题。值得我学习呢。',
		dlc: 2,
		places: ['旧地狱'],
		positiveTags: [
			'肉',
			'重油',
			'饱腹',
			'山珍',
			'鲜',
			'甜',
			'生',
			'猎奇',
			DYNAMIC_TAG_MAP.largePartition,
			DYNAMIC_TAG_MAP.popularPositive,
		],
		beverageTags: ['中酒精', '可加冰', '利口酒', '直饮', '甘', '苦', '现代'],
		chat: [
			'我也想变得像山女小姐一样受欢迎啊。',
			'这么明亮的洞窟真是第一次见啊。',
			'店里要是出现虫子的话，我可以帮你解决哦。',
			'疾病其实是调味料哦。',
		],
	},
	{
		id: 2001,
		name: '鬼',
		description:
			'远古时期就已经存在、传说中幻想乡最强的妖怪种族！但其实已经离开幻想乡很久了，没想到原来是盘踞在地底世界。鬼族性格爽朗但凶猛，绝对不能对他们说谎哦！',
		dlc: 2,
		places: ['旧地狱'],
		positiveTags: [
			'肉',
			'高级',
			'传说',
			'下酒',
			'鲜',
			'力量涌现',
			'特产',
			'燃起来了',
			DYNAMIC_TAG_MAP.popularPositive,
		],
		beverageTags: ['中酒精', '高酒精', '烧酒', '直饮'],
		chat: [
			'能喝酒的地方越多越好。',
			'地上现在还有能够退治鬼的专家吗？',
			'这儿的热闹程度完全不亚于旧地狱街道上的酒馆啊。',
			'小麻雀，快把酒满上吧。',
		],
	},
	{
		id: 2002,
		name: '骨女',
		description:
			'非常擅长打扮的姐姐们，谈吐温柔又成熟。手上总是执着一盏牡丹花灯，据说可以迷惑过路的人类。实际上在洞穴遇到时，会帮我照亮前面的路。',
		dlc: 2,
		places: ['旧地狱'],
		positiveTags: ['素', '清淡', '鲜', '生', '凉爽', '猎奇', '菌类', '酸', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['低酒精', '可加热', '啤酒', '水果', '苦'],
		chat: [
			'那个桥姬每个晚上都在钉稻草人，怪吓人的。',
			'再美的皮相，其实都是浮云。',
			'取悦自己才是最重要的。',
			'既然决定要游戏人间，怎么能没有美食相伴。',
		],
	},
	{
		id: 2003,
		name: '地狱鸦',
		description:
			'栖息于旧地狱最深处的地狱鸦。住在旧地狱的妖怪基本上都是因为原住地成了废墟，继而迁居于此，但地狱鸦本来就住在地狱，是这里最早的住民。',
		dlc: 2,
		places: ['地灵殿'],
		positiveTags: ['肉', '家常', '山珍', '海味', '咸', '小巧', '燃起来了', '酸', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['中酒精', '可加热', '啤酒', '辛', '苦'],
		chat: [
			'看守灼热地狱的那只乌鸦变成了三只足，看起来太奇怪了。',
			'你家的生意就像地狱一样红红火火咧。',
			'乌鸦曾经也是被供奉的神鸟，一朝走下神坛就成了不祥之鸟。',
			'鸟脑袋是从什么时候开始变成了笨蛋的代名词？',
		],
	},
	{
		id: 2004,
		name: '姑获鸟',
		description:
			'传说中穿上羽毛就是鸟，脱下羽毛就会变成少女的妖怪。通过收集别人的指甲可以预知福祸，所以从事占卜业的很多。大概是为了保持神秘，说话总是神神叨叨的。',
		dlc: 2,
		places: ['地灵殿'],
		positiveTags: ['水产', '家常', '清淡', '鲜', '猎奇', '文化底蕴', '酸', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['低酒精', '可加热', '烧酒', '苦'],
		chat: [
			'姑获鸟，姑获鸟抱走孩子；夏获鸟，夏获鸟收养孩子。',
			'不要的指甲可以给我哦。',
			'姑获鸟、鬼车鸟、九头鸟，这是三种妖怪啦。',
			'把孩子的衣服晾在外面就是暗号。',
		],
	},
	{
		id: 2005,
		name: '豹女',
		description:
			'野性十足的妖兽。性格爽朗而任性。出于种族天性，我有点儿害怕她们…不过，虽然豹子本身的实力很强大，但能成为妖怪的数量似乎并不多。',
		dlc: 2,
		places: ['地灵殿'],
		positiveTags: ['肉', '高级', '重油', '山珍', '海味', '生', '灼热', '特产', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['中酒精', '高酒精', '直饮', '辛'],
		chat: [
			'捕猎虽然有趣，偶尔这样吃吃饭也不错。',
			'这家店的主人居然是麻雀。',
			'不想成为别人的盘中餐，就好好做好盘中餐吧。',
			'麻雀究竟能做出什么样的料理呢。',
		],
	},
	{
		id: 3000,
		name: '僧侣',
		description:
			'人类可能不太了解，但我知道…命莲寺的修行僧几乎都是妖怪。虽说也会进行什么六个菠萝蜜的修行，但谁也没看出究竟有什么效果，不少妖怪在修行之外依然我行我素。',
		dlc: 3,
		places: ['命莲寺'],
		positiveTags: ['肉', '家常', '下酒', '山珍', '力量涌现', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['中酒精', '高酒精', '可加热', '烧酒', '古典'],
		chat: [
			'所谓“酒肉穿肠过，佛祖心中留”嘛。',
			'白天的命莲寺非常安静庄严，晚上却很热闹。',
			'住持会定期在寺庙里举办怪谈大会，相当刺激哦。',
			'佛心传法，声若雷霆。',
		],
	},
	{
		id: 3001,
		name: '妖怪鼠',
		description:
			'幻想乡随处可见的探宝者。要是能和它们打好关系，以后就不用担心丢东西了。不过委托它们寻找食物的话，可能会在拿回来之前就被它们啃光。',
		dlc: 3,
		places: ['命莲寺'],
		positiveTags: ['家常', '高级', '梦幻', '果味', DYNAMIC_TAG_MAP.largePartition, DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['鸡尾酒', '利口酒', '水果', '甘', '现代'],
		chat: [
			'村子里关于耗子药的使用已经普及，不能掉以轻心啊。',
			'我们的老大住在一个到处都埋着宝藏的神秘之地。',
			'“芝士上的洞都是被老鼠咬出来的”这种谣言究竟是谁传出来的？',
			'这世上没有我们找不到的东西。',
			'我们认为是宝藏的东西，人类总不这样认为。',
		],
	},
	{
		id: 3002,
		name: '八尺大人',
		description:
			'身长八尺的鬼怪，总是戴着一顶宽檐帽所以皮肤很白。过去还喜欢穿白色连衣裙，结果白天的时候存在感很低，几乎整个种族都饿瘦了。现在有些上进的也开始寻找其他更能增加注视的服饰了。',
		dlc: 3,
		places: ['命莲寺'],
		positiveTags: ['和风', '西式', '鲜', '适合拍照', '凉爽', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['低酒精', '可加冰', '鸡尾酒', '西洋酒', '利口酒'],
		chat: [
			'对妖怪来说，没有存在感就和人类患上绝症一样。',
			'光长个不长肉也不一定好啊。',
			'每次我们说想要增肥，都会被认为是在炫耀。',
			'如果失去标志性的装束，我们还会被称为八尺大人吗？',
			'妖怪的改革也是很艰难的。',
		],
	},
	{
		id: 3003,
		name: '道士',
		description:
			'在神灵庙里有不少拜神子为师，希望学习仙术的弟子。不过似乎只被支使用来打杂。看起来总是一副斗志昂扬、雄心勃勃的样子…说不定打杂也是一个很有趣的工作？',
		dlc: 3,
		places: ['神灵庙'],
		positiveTags: [
			'家常',
			'清淡',
			'山珍',
			DYNAMIC_TAG_MAP.signature,
			'小巧',
			'特产',
			DYNAMIC_TAG_MAP.popularPositive,
		],
		beverageTags: ['低酒精', '苦', '现代', '提神'],
		chat: [
			'传说庙里的那位圣人就是曾经名满天下的贵人。',
			'圣人今天也倾听了我的烦恼，为我指点迷津。',
			'在哪里能买到圣人同款耳机呢？',
			'要是真的清心寡欲就不会想要成仙了吧？',
			'修仙路漫漫，还是先填饱肚子吧！',
		],
	},
	{
		id: 3004,
		name: '僵尸',
		description:
			'受邪仙操纵的僵尸。虽然是尸体但是不会腐烂，拥有比生前更强劲的力量。脑子不太好使，想与之沟通也很困难，但胜在不挑食。据说人类要是被咬到会暂时变成它们的同类，感觉还挺有趣的。就像“僵尸体验卡”？',
		dlc: 3,
		places: ['神灵庙'],
		positiveTags: [
			DYNAMIC_TAG_MAP.expensive,
			DYNAMIC_TAG_MAP.economical,
			DYNAMIC_TAG_MAP.largePartition,
			'肉',
			'水产',
			'素',
			'家常',
			'高级',
			'传说',
			'重油',
			'清淡',
			'下酒',
			'饱腹',
			'山珍',
			'海味',
			'和风',
			'西式',
			'中华',
			'咸',
			'鲜',
			'甜',
			'生',
			DYNAMIC_TAG_MAP.signature,
			'适合拍照',
			'凉爽',
			'灼热',
			'力量涌现',
			'猎奇',
			'文化底蕴',
			'菌类',
			'不可思议',
			'小巧',
			'梦幻',
			'特产',
			'果味',
			'汤羹',
			'烧烤',
			'辣',
			'燃起来了',
			'酸',
			'毒',
			DYNAMIC_TAG_MAP.popularPositive,
			DYNAMIC_TAG_MAP.popularNegative,
		],
		beverageTags: [
			'无酒精',
			'低酒精',
			'中酒精',
			'高酒精',
			'可加冰',
			'可加热',
			'烧酒',
			'清酒',
			'鸡尾酒',
			'西洋酒',
			'利口酒',
			'啤酒',
			'直饮',
			'水果',
			'甘',
			'辛',
			'苦',
			'气泡',
			'古典',
			'现代',
			'提神',
		],
		chat: [
			'碟子…不许吃。',
			'要腐烂了。',
			'曾经有谁对我说过…要好好吃饭才能快高长大。',
			'有好多事都想不起来了。',
			'要记住…只能吃碟子上的东西。',
		],
	},
	{
		id: 3005,
		name: '仙人',
		description:
			'通过长年累月的修行获得超越常人能力的人类，对很多妖怪来说是上等佳肴，活得可谓是多灾多厄了。大概是因为活得太艰难，所以他们的性格都有些古怪…',
		dlc: 3,
		places: ['神灵庙'],
		positiveTags: ['素', '高级', '清淡', '小巧', '梦幻', '果味', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['低酒精', '清酒', '水果', '甘', '气泡', '古典'],
		chat: [
			'没想到在仙界也能感受到市井烟火气。',
			'我什么时候也能有自己的仙界呢？',
			'终于把那个缠人的死神甩掉了。',
			'人类长寿一些难道是什么罪过吗？',
			'好不容易把今日要诵读的万遍真言给念完了。',
		],
	},
	{
		id: 4000,
		name: '小人族',
		description:
			'传说中是少彦名神的后裔一族，身长只有一寸左右。因为一直在城里没有出去过，所以普遍缺乏常识，但拥有很强的求知心，对外界十分向往。',
		dlc: 4,
		places: ['辉针城'],
		positiveTags: ['传说', '和风', '力量涌现', '小巧', '梦幻', '燃起来了', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['可加冰', '可加热', '啤酒', '甘', '古典'],
		chat: [
			'美食的传承离不开挑剔的美食家。',
			'地上是不是有很多这样的店呢。',
			'差不多也该出去走走了。',
			'现在的社会无论什么种族都能这样欢聚一堂吗？',
		],
	},
	{
		id: 4001,
		name: '不良少年',
		description:
			'正邪从幻想乡四处蛊惑来的各种族男性，几乎都是对未来感到迷茫的年轻人，对于正邪提出的“宏图伟业”感到热血沸腾而追随于她。但似乎现在更加迷茫了…',
		dlc: 4,
		places: ['辉针城'],
		positiveTags: ['家常', '下酒', '饱腹', '和风', '力量涌现', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['高酒精', '可加热', '烧酒', '啤酒', '苦', '提神'],
		chat: ['俺已经闻到饭香啦！', '所有的乡愁都是因为馋。', '之后该怎么办呢。', '差不多也该考虑考虑以后了。'],
	},
	{
		id: 4002,
		name: '不良少女',
		description:
			'正邪从幻想乡四处蛊惑来的各种族女性，几乎都是对未来感到迷茫的年轻人，对于正邪提出的“宏图伟业”感到热血沸腾而追随于她。但似乎现在更加迷茫了…',
		dlc: 4,
		places: ['辉针城'],
		positiveTags: ['家常', '高级', '和风', '适合拍照', '灼热', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['中酒精', '啤酒', '水果', '气泡', '现代'],
		chat: [
			'之后该怎么办呢。',
			'差不多也该考虑考虑以后了。',
			'要是我足够努力也能开个这样的店吗？',
			'只是坐下来就已经觉得胃里暖暖的。',
		],
	},
	{
		id: 4003,
		name: '玩具兵',
		description:
			'因为万宝槌的力量而活过来的道具。似乎受哪位高人指点，将体内本该被回收的小槌魔力转化成了自己的魔力，从此得到了真正的生命。',
		dlc: 4,
		places: ['辉针城'],
		positiveTags: ['海味', '西式', DYNAMIC_TAG_MAP.signature, '凉爽', '不可思议', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['西洋酒', '利口酒', '直饮', '现代'],
		chat: [
			'最深刻体会到活着的快乐就是吃东西的时候。',
			'人生得意须尽欢，胡吃海塞需尽兴。',
			'吃饱了才有力气去守护。',
			'我可是圣诞节最受欢迎的礼物之一哦。',
		],
	},
	{
		id: 4004,
		name: '铃兰花精',
		description:
			'寄宿在铃兰花中的妖精。每天都在致力于解开“梅蒂欣小姐说的铃铃究竟是谁”之谜，目前的悬赏已经高达九十九颗“史上最圆的石头”，依然没有人能解开谜题。',
		dlc: 4,
		places: ['太阳花田'],
		positiveTags: ['下酒', '生', '小巧', '梦幻', '毒', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['中酒精', '直饮', '辛', '气泡'],
		chat: ['铃铃到底是谁呢。', '以毒攻毒最美味了！', '铃兰的毒是神经的毒哦。', '那个灯笼和铃兰有点像呢。'],
	},
	{
		id: 4005,
		name: '太阳花精',
		description:
			'寄宿在向日葵中的妖精。据说向日葵之所以一直向着太阳，就是因为她们偷偷躲在背后给花转向。这一招把不少人类都骗倒了，是她们引以为傲的绝技。',
		dlc: 4,
		places: ['太阳花田'],
		positiveTags: ['鲜', '甜', '力量涌现', '不可思议', '特产', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['利口酒', '水果', '甘', '气泡'],
		chat: [
			'我最喜欢在花田玩捉迷藏游戏了。',
			'居然在我们最爱的游乐场里建了一个食堂。',
			'托老板娘的福，花田更热闹了！',
			'不要在花田里留下垃圾哦！',
		],
	},
	{
		id: 4006,
		name: '玫瑰花精',
		description:
			'寄宿在玫瑰花中的妖精。不知道她们从哪里听说，玫瑰是某颗星球上独一份的、最娇贵的花，于是掀起了要集体搬家的热潮。不过还没有妖精成功。',
		dlc: 4,
		places: ['太阳花田'],
		positiveTags: ['高级', '西式', DYNAMIC_TAG_MAP.signature, '适合拍照', '小巧', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['低酒精', '鸡尾酒', '甘', '现代'],
		chat: [
			'那颗星球，是叫B612吗？',
			'这家店没有包间吗？',
			'我其实是个妖精美食家哦。',
			'我不是挑食，只是正好不爱吃那些口味。',
		],
	},
	{
		id: 4007,
		name: '影女',
		description:
			'性质上介于幽灵和怨灵之间的灵。似乎因为离世的时候怀有怨恨，所以喜欢对人类恶作剧。夜晚在屋中看到一个人的影子来回走却找不到人，就是影女捣的鬼。模样看起来有些阴沉，其实都是装出来的。',
		dlc: 4,
		places: ['太阳花田'],
		positiveTags: ['家常', '和风', '生', '凉爽', '猎奇', '不可思议', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['高酒精', '可加冰', '苦', '古典', '提神'],
		chat: [
			'我好恨呐。',
			'稍微用头发挡住眼睛，可以更轻松地把人吓倒。',
			'这份怨恨，将流向…我的胃里！',
			'吃饱了才好恶作剧。',
			'我只是装得阴沉的样子啦。',
		],
	},
	{
		id: 5000,
		name: '纸牌兵',
		description:
			'由魔界造物主的魔力所化的纸牌人。性格老实到木讷，即使没有被安排工作也会非常自觉地去巡逻。另外总在期待着有什么人从天而降的样子，似乎和什么兔子洞的故事有关？',
		dlc: 5,
		places: ['魔界'],
		positiveTags: [
			'家常',
			'重油',
			'饱腹',
			'咸',
			DYNAMIC_TAG_MAP.signature,
			'凉爽',
			DYNAMIC_TAG_MAP.popularPositive,
		],
		beverageTags: ['中酒精', '可加热', '苦', '提神'],
		chat: [
			'好久没有人从“兔子洞”掉下来了。',
			'不知道那位小姐在地上过得怎么样呢。',
			'不同花色的我们性格其实也有点不同。',
			'我们的王总是温柔而睿智。',
		],
	},
	{
		id: 5001,
		name: '小丑',
		description:
			'由魔界造物主的魔力所化的纸牌人，担当着类似士兵长的职位。不仅没有长官的架子，连能安排给士兵们的工作也没有。整天在魔界各处游荡，比起士兵长，更像街头艺人什么的。',
		dlc: 5,
		places: ['魔界'],
		positiveTags: ['高级', '下酒', '生', '适合拍照', '猎奇', '菌类', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['可加冰', '利口酒', '直饮', '辛'],
		chat: [
			'没什么事可做呢。',
			'索性辞职去当个流浪艺人好了。',
			'真希望能品尝更多美食呐。',
			'地上的小丑是怎么样的呢？',
		],
	},
	{
		id: 5002,
		name: '疯帽匠',
		description:
			'擅长制帽和剪裁的匠人。据说在保存制帽用的毛毡布时需要用到水银，因此他们经常发生水银中毒的抽搐现象，有时甚至会出现幻觉，所以被称为疯帽匠。但我知道，在疯癫的外衣下是对自己作品的热烈和执着。',
		dlc: 5,
		places: ['魔界'],
		positiveTags: ['西式', '适合拍照', '猎奇', '菌类', '不可思议', '梦幻', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['高酒精', '西洋酒', '现代', '提神'],
		chat: ['帽子帽子扔锅里！', '帽子着火了！', '沉迷工作时根本想不起来要吃饭。', '吃完再回去做帽子吧！'],
	},
	{
		id: 5003,
		name: '月人',
		description:
			'居住在月之都的人。他们舍弃了寿命，致力于去除污秽以消除生死。但他们并非不老不死，也会因为事故和战争而死去，身上还是微微带有一丝污秽。',
		dlc: 5,
		places: ['月之都'],
		positiveTags: ['传说', '清淡', '海味', '中华', '不可思议', '梦幻', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['清酒', '鸡尾酒', '水果', '气泡', '现代'],
		chat: [
			'吃夜宵是不是有点不够矜持啊？',
			'不能太耽于口腹之欲。',
			'老板娘是新来的月之使者吗？',
			'丰姬大人桃子吃得太多了。',
		],
	},
	{
		id: 5004,
		name: '捣药兔',
		description:
			'负责捣药的月兔。看起来像是在捣年糕，但臼里的东西其实是药。捣药的行为并不是为了产出有价值的药，而是为了替某个人赎罪。因为一直重复着看起来毫无益处的劳动，积累了不少疲倦。',
		dlc: 5,
		places: ['月之都'],
		positiveTags: ['饱腹', '山珍', '和风', '中华', '甜', '凉爽', DYNAMIC_TAG_MAP.popularPositive],
		beverageTags: ['中酒精', '烧酒', '啤酒', '甘', '提神'],
		chat: [
			'好想念XX大人。',
			'XX大人应该没有吃过这个吧？',
			'地上的兔子捣的确实是年糕吧？',
			'兔子们倒是不讨厌污秽。',
		],
	},
	{
		id: 5005,
		name: '月之使者',
		description:
			'负责月都警备工作的月兔。月之使者这个工作在月兔的一众工作中相对纪律比较严格。为保证在关键时刻能和地上人进行交战，它们需要接受非常严格的训练，很不轻松。',
		dlc: 5,
		places: ['月之都'],
		positiveTags: [
			'传说',
			'饱腹',
			'西式',
			DYNAMIC_TAG_MAP.signature,
			'力量涌现',
			'特产',
			DYNAMIC_TAG_MAP.popularPositive,
		],
		beverageTags: ['无酒精', '可加热', '苦', '现代', '提神'],
		chat: ['最近训练强度是不是加大了呀。', '感觉我好像长出了肌肉。'],
	},
] as const satisfies ICustomerNormal[];
