import fs from 'fs';

const filePath = 'app/data/i18n/en.ts';
let content = fs.readFileSync(filePath, 'utf8');

const fixes: Record<string, string> = {
	'差点儿吞噬了幻想乡的可怕的家伙。原以为恢复神志后就会世界和平，结果一见面就想吃了我？！现在偶尔也会到食堂用餐，有时候会看着我咽口水…我这辈子都不想再见到这个亡灵。':
		"A terrifying being who nearly devoured Gensokyo. I thought there would be peace once she regained her senses, but the moment we met, she wanted to eat me?! Now she occasionally comes to dine, and sometimes I catch her staring at me and swallowing... I never want to see this ghost again in my life.",
	'师傅原来身患贫血症和哮喘症，真是让人担心啊（我只在这里叫一下应该可以吧？）。虽然认识这么久，师傅对我的态度依然不太亲切，但却教了我不少知识，我可不能辜负她。':
		"Master actually suffers from anemia and asthma, which is really worrying (it should be okay if I call her that just here, right?). Even though we've known each other for so long, Master still isn't very warm toward me, but she's taught me a lot of knowledge. I can't let her down.",
	'希望这家店的食材可以新鲜一点，猫的嘴可是很刁的。':
		"I hope this restaurant's ingredients can be a bit fresher. Cats have very discerning palates, you know.",
	'帕秋莉小姐总是手不离书，一直盯着书本看眼睛不会累吗？而且书上说的也不一定都是对的啊，像这样光读书不出门，就算知识渊博，常识却稍微有些不足呢。':
		"Miss Patchouli always has a book in hand. Doesn't her eyes get tired from staring at books all the time? Besides, what's written in books isn't always right. Reading all day without going out—even if she's knowledgeable, she's a bit lacking in common sense.",
	'带有\u201c传说\u201d标签的料理或使用带有\u201c传说\u201d标签的食材制作的料理无法被制作，持续30秒。':
		'Dishes with the "Legend" tag or dishes made with ingredients with the "Legend" tag cannot be prepared, lasting 30 seconds.',
	'带有\u201c猎奇\u201d标签的食物制作速度提高30%，且额外提供30%续单率，持续30秒。':
		'Food with the "Bizarre" tag has 30% faster preparation speed and provides an extra 30% reorder rate, lasting 30 seconds.',
	'开动飞碟转盘，必然Miss，结果为以下四种情况中的一种：红红绿：无论上什么菜都必然获得极度不满的评价，持续15秒；绿绿〇：食材和酒水消耗量提高到三倍，持续15秒；蓝蓝〇：收入减少66%，持续15秒；红红蓝：同时获得以上三种buff。':
		"Spin the UFO roulette, guaranteed Miss. The result is one of the following four outcomes: Red-Red-Green: Any dish served will receive an extremely dissatisfied rating, lasting 15 seconds; Green-Green-○: Ingredient and beverage consumption triples, lasting 15 seconds; Blue-Blue-○: Income reduced by 66%, lasting 15 seconds; Red-Red-Blue: All three debuffs activate simultaneously.",
	'开动飞碟转盘，必然中奖，结果为以下四种情况中的一种：红红红：无论上什么菜都必然获得最高等级的评价，持续15秒；绿绿绿：食材和酒水不会被消耗，持续15秒；蓝蓝蓝：收入提高100%，持续15秒；红绿蓝：同时获得以上三种Buff。':
		"Spin the UFO roulette, guaranteed jackpot. The result is one of the following four outcomes: Red-Red-Red: Any dish served will receive the highest rating, lasting 15 seconds; Green-Green-Green: Ingredients and beverages won't be consumed, lasting 15 seconds; Blue-Blue-Blue: Income increased by 100%, lasting 15 seconds; Red-Green-Blue: All three buffs activate simultaneously.",
	'当完成场上顾客的订单且至少获得普通评价后，在座位附近掉落一枚\u201c蓬松松糖果\u201d以供拾取，持续30秒。':
		'After completing a customer\'s order and receiving at least a normal rating, a "Fluffy Candy" drops near the seat for pickup, lasting 30 seconds.',
	'影狼小姐似乎很在意皮肤，这么爱美的狼人还真是第一次见呢。草根妖怪的日常真是平和又热闹。偶尔忍不住也会想…如果我不开店，大概也在过着这样的生活吧。':
		"Miss Kagerou seems to care a lot about her skin. This is the first time I've seen such a beauty-conscious werewolf. The daily life of grassroots youkai is really peaceful yet lively. Sometimes I can't help but think... if I didn't run a restaurant, I'd probably be living that kind of life too.",
	'影狼小姐作为狼的部分，是在外面世界已经绝种的本州狼。一度被敬仰、被崇拜，最后却落得灭绝下场真可怜。幻想乡的人类和妖怪要多多爱护我们兽（禽）类呀！':
		"The wolf part of Miss Kagerou is the Japanese wolf, which has gone extinct in the outside world. Once revered and worshiped, yet ultimately driven to extinction—how pitiful. Humans and youkai of Gensokyo should take better care of us beasts (and birds)!",
	'性格原本也算是一板一眼的，熟悉以后经常能听到她那些毫无城府的牢骚，还时不时能看到她露出乖巧、呆萌的一面。比想象中的好应付啊…早知道这样，我就早点儿到山上来了！':
		"Her personality was originally quite rigid, but once you get to know her, you often hear her guileless complaints, and from time to time you can see her show a well-behaved, adorably clueless side. She's easier to deal with than I imagined... If I'd known, I would have come to the mountain sooner!",
	'性质上介于幽灵和怨灵之间的灵。似乎因为离世的时候怀有怨恨，所以喜欢对人类恶作剧。夜晚在屋中看到一个人的影子来回走却找不到人，就是影女捣的鬼。模样看起来有些阴沉，其实都是装出来的。':
		"A spirit whose nature falls between a ghost and a vengeful spirit. She seems to enjoy playing pranks on humans because she harbored resentment when she passed away. If you see a shadow walking back and forth in a room at night but can't find anyone, that's Kage-onna's doing. She looks somewhat gloomy, but it's all an act.",
	'总是穿着睡衣躲在树荫下的奇怪的魔法使。似乎不在意别人的眼光，对潮流什么的也不感兴趣。虽然头脑很好，不过看起来弱不禁风的样子。比起头脑好，身体好更重要啊。':
		"A strange magician who always wears pajamas and hides in the shade of trees. She doesn't seem to care about others' opinions and has no interest in trends. While she's very intelligent, she looks frail. Being physically healthy is more important than being smart.",
	'恣性洒脱的船长，甘愿成为佛门弟子，受佛门管束（其实也不太管得住），只为报答千年前的恩情。果然不能以貌取人呀。村纱小姐她，有着一颗有情有义的金子般的心呢。':
		"A free-spirited captain who willingly became a Buddhist disciple, accepting Buddhist discipline (though they can't really keep her in check), all to repay a kindness from a thousand years ago. You really can't judge a book by its cover. Miss Murasa has a golden heart full of loyalty and gratitude.",
	'想要做成一件事就会不计后果地去达成，就算自己的行为不被人理解，她也会摆出一副理所当然的态度。要说她是被欲望驱使，又觉得恰恰相反…她所做的那些事，与其说是为了欲望，或许只是单纯的性格使然。':
		"When she wants to accomplish something, she'll do it regardless of the consequences. Even if people don't understand her actions, she acts as if it's only natural. You might say she's driven by desire, but it feels like the opposite... What she does, rather than being for desire, is perhaps simply a matter of her personality.",
	'想要走进她的心房真是不容易啊。她矜持而又好客，温柔而又疏离。她之所以制作这么多人偶，会不会是因为孤独呢？':
		"It's really not easy to get close to her heart. She's reserved yet hospitable, gentle yet distant. Could the reason she makes so many dolls be because of loneliness?",
	'慕斯是一种混合鸡蛋、奶油和各种调味食材，口感香甜松软的甜品。魔界之神对此进行了改良，使用巧克力、香草与香芋的层层搭配，再放上两颗红色浆果，外观看上去犹如气派的魔界宫殿\u201c万魔殿\u201d。据说是神绮平时用来招待客人以及举办茶会时必备的高级甜点。':
		'Mousse is a sweet dessert that combines eggs, cream, and various flavoring ingredients for a soft and smooth texture. The God of Makai improved upon it, layering chocolate, vanilla, and taro, topped with two red berries, making it look like the magnificent Makai palace "Pandemonium." It is said to be a premium dessert that Shinki regularly uses to entertain guests and as a must-have for tea parties.',
	'成品带有\u201c招牌\u201d标签的今日菜单上的料理将成为明星料理。制作明星料理时，如果料理时间小于5秒，则瞬间完成；在舆论的裹挟下，追捧\u201c流行喜爱\u201d标签的顾客食用明星料理后额外提高30%续单率，返还当单酒水消耗的预算，并必定增加一次续单上限（增加续单':
		'Dishes on today\'s menu with the "Signature" tag become star dishes. When preparing star dishes, if cooking time is less than 5 seconds, it completes instantly; Driven by public opinion, customers who favor the "Popular" tag gain an extra 30% reorder rate after eating star dishes, have their beverage budget refunded for that order, and are guaranteed one additional reorder (increased reorder',
	'我发现，和她在一起的时候，会不知不觉就被她的气势带走，这就是领袖的气质吗？！不过这种感觉很轻松，说不定我们很合拍呢！难道说我也是笨蛋吗？哈哈开玩笑啦。':
		"I've noticed that when I'm with her, I unconsciously get swept up by her presence. Is this the aura of a leader?! But the feeling is quite relaxing—maybe we're well-matched! Does that mean I'm an idiot too? Haha, just kidding.",
	'我发现，帕露西小姐熟知所有人的优点！虽然大家都说帕露西小姐很善妒，但她的内心深处其实很憧憬大家吧？能够更进一步了解她真是太好了！':
		"I've discovered that Miss Parsee knows everyone's strengths! Although everyone says Miss Parsee is very jealous, deep down she actually admires everyone, right? I'm so glad I got to know her better!",
	'我很了解她，虽然看起来脾气不太好，但其实是很为朋友着想的家伙！谁能想到，就是这么个小小的萤火虫，希冀着用自己的微末光芒，孤独又决然地照亮这衰败已久的一族呢？':
		"I know her well. She may seem bad-tempered, but she's actually someone who really cares about her friends! Who would have thought that such a small firefly would hope to use her faint glow to illuminate her long-declining clan, alone yet resolute?",
	'我很喜欢拜访朋友的时候带一些手作食物，不过老板娘应该更擅长这个吧？见笑了。':
		"I really like bringing some homemade food when visiting friends, but the restaurant owner is probably better at this, right? How embarrassing.",
	'我得为之前说过的话道歉，怎么能对客人生出不想招待的念头呢？就算她气焰嚣张、目中无人、口无遮拦、毫无常识、鼻子比天高，我都必须要好好招待她！尽量吧…':
		"I need to apologize for what I said before. How could I have the thought of not wanting to serve a customer? Even if she's arrogant, condescending, foul-mouthed, lacking common sense, and has her nose higher than the sky, I must serve her properly! I'll try, at least...",
	'我得到了比灼热地狱还要热烈的感受！':
		"I've received feelings even more intense than the Blazing Hell!",
	'我所看到的…你的水平不应如此。':
		"What I see... your level shouldn't be like this.",
	'我明白为什么宠物们那么依恋觉小姐了。被繁重的工作埋没，心中还能一直牵挂着妹妹和宠物。在清冷的外表下的这份温柔，确实是会让人念念不忘呢。':
		"I understand why the pets are so attached to Miss Satori. Buried under heavy work, yet always keeping her sister and pets in her heart. This tenderness beneath her cold exterior is truly unforgettable.",
	'我的信条是\u201c坐收渔利\u201d。':
		'My motto is "reap where one has not sown."',
	'我的朋友吃了致幻蘑菇以后，居然产生了自己变成屎壳郎的幻觉，笑死我了！':
		"After my friend ate hallucinogenic mushrooms, they actually hallucinated that they turned into a dung beetle. I laughed so hard!",
	'我说，这家伙果然有什么不可告人的目的吧？总觉得她在拙劣地隐瞒着什么…不过这孩子性格这么直，我能感受到她对我是没有恶意的！所以，不管她是不是真的隐瞒了什么，我都会对她一如既往的。':
		"I'm telling you, she definitely has some hidden agenda, right? I always feel like she's clumsily hiding something... But this girl is so straightforward, I can tell she doesn't mean any harm toward me! So regardless of whether she's really hiding something, I'll treat her the same as always.",
};

const lines = content.split('\n');
let fixedCount = 0;

for (const [key, value] of Object.entries(fixes)) {
	// Find the line containing this key with empty value
	const searchFragment = key.slice(0, 30);
	let found = false;
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].includes(searchFragment) && lines[i].trimEnd().endsWith("': '',")) {
			// Replace empty value with translation
			const escapedValue = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
			lines[i] = lines[i].replace("': '',", `': '${escapedValue}',`);
			fixedCount++;
			found = true;
			break;
		}
	}
	if (!found) {
		console.log('NOT FOUND:', key.slice(0, 60));
	}
}

content = lines.join('\n');
fs.writeFileSync(filePath, content, 'utf8');
console.log(`Fixed ${fixedCount} of ${Object.keys(fixes).length} keys`);
