import type { ILocalizedSpecialGuestText } from '@/domain/data/localization/types';

export const SPECIAL_GUEST_LOCALIZATION_EN = {
	0: {
		chat: [
			'Your favorite neighbor is here to support you!',
			"Wha... why are you looking at me like that!? I won't affect your izakaya's sanitation!",
			'The bugs near your house...? No! I have nothing to do with them!',
			'For the Insect Renaissance! We are now broadcasting "Insect News"——why are you telling me to shut up!',
			"Fireflies in the night sky~ Isn't it romantic? Why not stop and savor this moment a little longer?",
		],
		description: [
			"An old friend of mine who loves insects. I really can't handle the swarm around her, even though I've known her for so many years.",
			"Although she looks like an ordinary youkai firefly, she's actually the last heir of a powerful ancient insect race, which is why she always acts as if she's better than everyone else.",
			"She always cares about her friends despite the fact that she sometimes acts as if she's in a bad mood. I wonder if this tiny firefly can light up the future of her fallen species on her own?",
		],
		evaluation: {
			bad: 'Oh! Thanks.',
			exbad: "That's how you treat me, huh? Behold, the might of the swarm!",
			exgood: 'With how satisfying this dish is... I would have to reward you!',
			good: "It seems you know us insects' taste pretty well!",
			lackmoneyangry:
				"You dare rip off the great Wriggle Nightbug, you've got some nerve!",
			lackmoneynormal:
				'I owe you one~Come and ask me for help next time!',
			norm: 'Wow, not bad at all!',
			repell: 'You dare throw out the Wriggle Nightbug?!',
			seenRepell: "Ah, I'm totally disappointed.",
		},
		name: 'Wriggle Nightbug',
		spellCards: {
			negative: [
				{
					description:
						"Summon a large group of flying insects, and they bite! Will drive away every single guest in the izakaya. For a small restaurant, this is a very scary skill! That's not gonna fly with the health inspectors!",
					name: 'Wriggle Sign "Nightbug Tornado"',
				},
			],
			positive: [
				{
					description:
						"Summon a large group of fireflies, enhancing your izakaya's atmosphere. Guests are 30% more likely to appear.",
					name: 'Lamp Sign "Firefly Phenomenon"',
				},
			],
		},
	},
	1: {
		chat: [
			'The black night has given me black eyes, why not use them to search for darkness~',
			"Don't I look like a saint crucified on a cross?",
			"It's too bright in here. Do you have a dark mode?",
			'Some people call me "The Third Mistress of the Scarlet Devil Mansion". Do you know why?',
			'I have to dim the darkness around me just to eat here.',
		],
		description: [
			"An old friend of mine. She was born in darkness, molded by it. I'm pretty sure her head is completely empty, but that doesn't mean much coming from me.",
			"She's always wandering around and I have no idea what she's doing all day. Every time we meet, she shares something I have never heard before. Where in the world did she visit this time?",
			"The longer we know each other, the more mysterious her past becomes. If I ask her about it, she'll just say she doesn't remember. Nevertheless, we'll always be good friends, always.",
		],
		evaluation: {
			bad: 'Is——that it——?',
			exbad: 'Is this the so-called Dark Matter?',
			exgood: 'Your cooking is making the meat glow!',
			good: "It's very tasty!",
			lackmoneyangry:
				'The fixed price of your food is like humans and their decimal system!',
			lackmoneynormal: "That's everything I have now...",
			norm: 'Pretty good~',
			repell: "Why can't you allow me to eat?",
			seenRepell: 'Will you kick me out like that?',
		},
		name: 'Rumia',
		spellCards: {
			negative: [
				{
					description:
						"Releases darkness in the kitchen, making it impossible to tell where's what, including the beverage rack. Lasts 20 seconds.",
					name: 'Darkness Sign "Demarcation"',
				},
			],
			positive: [
				{
					description:
						"Randomly obtain three meat ingredients already recorded in the notebook. Wondering how moonlight generates mystery meats, and why the meat-loving Rumia is willing them to you?. . . You'll fry your small bird brain.",
					name: 'Moon Sign "Moonlight Ray"',
				},
			],
		},
	},
	2: {
		chat: [
			"I'm not here because I'm hungry, I'm here for quality control!",
			'You need to work hard and pay back your debt on time!',
			"Don't assume I'll cut you some slack just because you cook for me~",
			"Should I bring my kitties with me the next time I'm here?",
			'May I have a kitty bag? I want to save the leftovers for my kitties.',
		],
		description: [
			"Rather than calling her the black cat of misfortune, I would say it's more appropriate to call her the black cat of madness.",
			"She keeps saying she's here to supervise me. Really? I've always paid debts on time!",
			"I'm pretty sure she has some devilish schemes in mind, and she's hiding something from me. . . At least she's frank when she wants to talk and I don't think she's trying to harm me. In any case, I'll treat her as I always do~",
		],
		evaluation: {
			bad: "It's so-so.",
			exbad: 'Even a stray cat would not eat anything like this!',
			exgood: "It's good... No! It's delicious!",
			good: 'You have my compliments, this is a fine dish.',
			lackmoneyangry: 'It seems our interest rate is too high for you...',
			lackmoneynormal:
				"Oops, I don't have enough to pay, but I can give you a discount the next time you need a loan.",
			norm: 'Not bad!',
			repell: 'Fine! There was no point staying anyway!',
			seenRepell:
				"Don't give up on any guest, you've got to work hard and pay your debt!",
		},
		name: 'Chen',
		spellCards: {
			negative: [
				{
					description:
						'Summon kittens that guests involuntarily want to pet, distracting guests. Reduces the chance of new guests arriving.',
					name: 'Direction Sign "Kimontonkou"',
				},
			],
			positive: [
				{
					description:
						'Randomly obtain three fish ingredients already recorded in the notebook. Occasionally gives rare ingredients. Wondering how the fish comes out of nowhere, and why the fish-loving Chen is willing them to you? . . . No use thinking about it.',
					name: 'Hermit Sign "Fenghuang Egg"',
				},
			],
		},
	},
	3: {
		chat: [
			'I could never imagine that I would one day step foot in a youkai-owned izakaya.',
			"I can't come here often, so I treasure each and every visit.",
			'You can actually gather some very interesting information in a place like this.',
			'As the head of the Hieda family, I have lots of responsibilities on my shoulder.',
			"Nowadays, what's the motivation for completing the Gensokyo Chronicle...",
		],
		description: [
			"The head of the noble Hieda family in the Human Village. She's also the author of Gensokyo Chronicle!",
			"She is very talented but unfortunately, she's always weak due to her poor health. In spite of it, she surprisingly still visits my izakaya occasionally. It's always a pleasant surprise when I see her, but I'm always worried that she might pass out here. . .",
			"She's always elegant but maybe a little rebellious at times? Reincarnation. . . I mean, she's just a girl, right?",
		],
		evaluation: {
			bad: 'Thanks.',
			exbad: '....Unacceptable, to be honest.',
			exgood: 'Among my reincarnations, I have never tasted any cuisine with such a good flavor!',
			good: 'The trip today was worth it just for the chance to try this.',
			lackmoneyangry:
				"A black-hearted businessman. I'd take a note of this.",
			lackmoneynormal:
				"My servants are not with me now and I don't have enough to pay, please forgive me...",
			norm: 'I appreciate it.',
			repell: "I'd surely put you in a chapter of the Gensokyo Chronicle!",
			seenRepell: 'I thought you were different from the other youkai...',
		},
		name: 'Hieda no Akyuu',
		spellCards: {
			negative: [
				{
					description:
						"Akyuu will expose one of izakaya's disheartening history, forcing the izakaya's atmosphere to drop to zero. Every guest in the izakaya will be depressed upon hearing this as well.",
					name: 'Symposium "Unscrupulous Restaurant\'s Dark History"',
				},
			],
			positive: [
				{
					description:
						'Obtain a signed washi by a famous novelist. You can exchange it for something special!',
					name: 'Writing "Is This All The Work Of Youkai Too?"',
				},
			],
		},
	},
	4: {
		chat: [
			'There is a lot of history behind food as well.',
			'Impossible, perhaps the memory archives during full moons are incomplete...',
			"Past events aren't sufficient to be called history. Only when they are recorded do they become so.",
			'The students are bored out of their minds... Should I expand the curriculum?',
			'Sometimes, a cuisine bears more than tastes. It also bears memories and feelings.',
		],
		description: [
			"She's half-youkai, half-human and currently teaching in the Human Village. For me at least, she's closer to a human rather than a youkai.",
			"Even though she's a youkai, she's trusted and respected by other humans. For humans in the village, she's more reliable than the miko. I heard that she's also handling the miko's tasks in the village.",
			'She treats humans and youkai fairly without discriminating either party. The word "saint" comes to mind when I think of her.',
		],
		evaluation: {
			bad: 'You can certainly do better if you practice harder.',
			exbad: "It's flavorless, so there's no regrets if I happen to discard it.",
			exgood: 'This is excellent! There must be an history of the cooking technique behind such a fine dish!',
			good: 'Pretty tasty, looks like you have put a lot of work into it.',
			lackmoneyangry:
				"I'm afraid the price is not affordable for the people of Gensokyo.",
			lackmoneynormal: "Sorry, I'll keep an eye on my funds next time.",
			norm: 'Not bad, I believe you can further improve it.',
			repell: "If you were my student, I'd have to headbutt you!",
			seenRepell: 'Behavior like that is rather rude.',
		},
		name: 'Keine Kamishirasawa',
		spellCards: {
			negative: [
				{
					description:
						"Kamishirasawa Homing Headbutt! You will be stunned by Keine-sensei's headbutt for 20 seconds. Smash the movement buttons to recover sooner.",
					name: 'Land Sign "Secret Skill - Headbutt"',
				},
			],
			positive: [
				{
					description:
						"Three Sacred Treasures - Sword Randomly obtain two kinds of vegetables. Three Sacred Treasures - Mirror For the next 15 seconds, new dishes will not cost any ingredients. Three Sacred Treasures - Orb Opens up the lock to the heart. Randomly reveal a special guest's unknown secret. Assuming they still have unknown secrets left, that is. Three Sacred Treasures - Country Keine-sensei has seen enough. She is satisfied. She will personally promote your izakaya, attracting many villagers to come and dine. ——Isn't it common sense for three sacred treasures to have four pieces?",
					name: 'Land Sign "Three Sacred Treasures"',
				},
			],
		},
	},
	5: {
		chat: [
			'Hermits eat more than just clouds.',
			"The Human Village recently established an animal protection agency. That's great.",
			'I left Gensokyo for far too long. This place has changed so much, and I have to adapt as well.',
			'Alas, I always have to remind everyone what they must do.',
			'Was the miko doing alright the last time you saw her? I have to remind her to keep up with her training.',
		],
		description: [
			"A mysterious hermit with a long face. Pretty sure she's somehow different from other hermits. . . Well, just a feeling though. I've never met any other hermit before.",
			'Are all hermits always serious? Feels like I\'m getting lectured and scolded every time I talk to her. . . Anyway, having a hermit as my guest is always a remarkable achievement. Hey, do you know that hermits like her routinely eat something known as "afterglow"?',
			"She may be a little too talkative at times, but she cares about others. Kinda like an older sister? Now that I've known her for a while, chatting with her is a lot easier. She's more easy-going than I originally thought.",
		],
		evaluation: {
			bad: 'You need a lot more practice.',
			exbad: 'Disgusting!',
			exgood: 'Exceptional! Even a hermit cannot resist its temptation!',
			good: 'Great! You deserve my compliment.',
			lackmoneyangry:
				"There's filthy desire behind such ridiculous prices.",
			lackmoneynormal:
				'My carelessness has led to deficit... To compensate, how about a free training session at my place?',
			norm: "Not bad! But don't feel proud yet!",
			repell: 'She thinks the phoenix would crave a rotten dead rat!',
			seenRepell:
				'The mighty steed starves while the cripple donkey laughs with pride!',
		},
		name: 'Kasen Ibaraki',
		spellCards: {
			negative: [
				{
					description:
						'All the guests will be forced to train like a hermit! They lose all mortal desires and will only order the cheapest food and green tea for the next 30 seconds.',
					name: 'Karma Meditation Training For Mortal Desires',
				},
			],
			positive: [
				{
					description:
						"Kasen has seen enough. She's satisfied. She asks her pet tiger to perform for her, but you are the one who gets the tips. . .! Every once in a while, all guests dining and waiting in line will tip you a random amount between 1-30 yen.",
					name: 'Artistic Expressions For Fierce Beasts',
				},
			],
		},
	},
	6: {
		chat: [
			"When it comes to business, I'm actually your senpai... Hey! What's with that look!",
			"Don't force yourself to understand what you can't or you won't live long here in Gensokyo.",
			'You need to self-reflect first. Before asking someone, you have to think carefully and state your thoughts first.',
			"I don't have any violent tendencies. That's why I've lived so long.",
			"You need to renovate your izakaya. How about visiting my shop for some new decorations? I'll give you a bulk discount.",
		],
		description: [
			"He claims that he's just an ordinary merchant, but he really doesn't know how to run a business. . . He's frequently out of stock and the prices are almost entirely arbitrary. That said, there is a chance that I can find something useful from his store.",
			null,
			null,
		],
		evaluation: {
			bad: 'Just so-so.',
			exbad: 'How dare you start a business with this.',
			exgood: 'Excellent! Is this sparrow actually a talented chef?',
			good: "Pretty good! I didn't know you could make such a thing!",
			lackmoneyangry:
				'How could anyone sell anything more ridiculous than I do?!',
			lackmoneynormal:
				"Not enough cash on me... Next time you visit my store, I'll give you 1% off!",
			norm: 'Changing up my order occasionally does no harm.',
			repell: "You won't have another chance to visit my store!",
			seenRepell: "Don't you have a conscience being a proprietress?",
		},
		name: 'Rinnosuke Morichika',
		spellCards: {
			negative: [
				{
					description:
						"One of your special guest's known secrets will be hidden. . .",
					name: 'Fictitious Intelligence Report',
				},
			],
			positive: [
				{
					description:
						"Obtain one Kourindou's 30% off coupon. Expires the next day!",
					name: 'Kourindou Black Friday',
				},
			],
		},
	},
	7: {
		chat: [
			'Why does a youkai-operated izakaya have more visitors than the shrine!?',
			"If you're serving humans, then your izakaya has to be clean and sanitized.",
			"There aren't any troublemakers here today, are there? Make sure to tell me if there are.",
			'Seeing youkai dining with humans... It still feels weird as a miko.',
			'This izakaya looks quite profitable. Maybe I should open one...?',
		],
		description: [
			"An aggressive miko who lives in poverty. . . It makes me wonder if she's truly a human or not. Anyway, nobody wants to mess with her.",
			"Miss Reimu is hardly soft with others. . . Actually, that's not entirely true. She was kind to me from time to time. I'm starting to understand why so many youkai like her.",
			"She speaks harshly, but the true Reimu inside is always caring and kind. She might act nonchalant, but she always knows what she's doing. It's great to have Miss Reimu as our miko.",
		],
		evaluation: {
			bad: "It's not much better than what I can make.",
			exbad: 'You wanna get exterminated again, huh?',
			exgood: 'Worth my every last penny!',
			good: 'Great! Worth all my efforts in making money.',
			lackmoneyangry:
				'You set me up, huh? It seems you want to bite the dust!',
			lackmoneynormal:
				'You never paid for attending the feast at my place, you should offer me a discount.',
			norm: 'Not bad.',
			repell: "Damn! I've never treated you badly, how could you do this?",
			seenRepell: "You know what'll happen if they complain to me.",
		},
		name: 'Reimu Hakurei',
		spellCards: {
			negative: [
				{
					description:
						'Attacks you with three explosive seals, which will disable three random dishes on your menu. You cannot make those three dishes for the next 30 seconds.',
					name: 'Spirit Sign "Fantasy Seal"',
				},
			],
			positive: [
				{
					description:
						"Create a protective barrier, which can completely negates the next special guest's Punishment Spell Card.",
					name: 'Dream Sign "Duplex Barrier"',
				},
			],
		},
	},
	8: {
		chat: [
			'There are fewer and fewer parties now. Is something secretly happening?',
			"I actually know a lot more about you than you imagine. I've been watching.",
			"Alcohol doesn't cause intoxication, the drinker gets themselves drunk~",
			'A lively place like this is the best place for wine~',
			'Why not relieve your suppressed stress? Join me for some sake~',
		],
		description: [
			"I didn't expect to see an oni in Gensokyo. It really freaked me out the first time I saw her! Is she. . . the real deal?",
			"There's no doubt about it. She's an authentic oni. Although she's tiny in size and looks drunk all the time, I feel pressured whenever she speaks to me. No wonder why the oni were once considered as the strongest race in Gensokyo!",
			"Although the oni are a scary species, once you know them, you'll have some extremely reliable friends whom you can always trust with every cell of your body! Miss Suika appears drunk all the time, but she's actually always sharp and observant! I hope to live a carefree life like she does.",
		],
		evaluation: {
			bad: "I can take a bite or two long as there's liquor to flush it down.",
			exbad: "It's a waste for my sake to be served with this trash!",
			exgood: 'Never thought I could crave a dish even harder than alcohol!',
			good: "I've got some fine food and liquor, I'm gonna get so drunk!",
			lackmoneyangry: "This feast is diappointin'...",
			lackmoneynormal: "I'm out of cash. I owe you a beer.",
			norm: 'A nice dish to serve with alcohol!',
			repell: 'Have the oni been away for so long that your fear faded away?',
			seenRepell:
				'How could you reject any guest during a feast? How boring.',
		},
		name: 'Suika Ibuki',
		spellCards: {
			negative: [
				{
					description:
						'Three lovely mini-Suika will appear and steal three bottles of your most expensive alcohol. How could something so cute commit something so horrific?',
					name: 'Night Parade of a Million Demons',
				},
			],
			positive: [
				{
					description:
						"A lovely mini-Suika will give you a bottle of alcohol. Occasionally will give you something ultra rare! Why does Suika give you her favorite liquor? Liquor's better when everyone's together!",
					name: 'Shuten Ultimate "Oni\'s Drinking Invitation"',
				},
			],
		},
	},
	9: {
		chat: [
			"Yeah, it's a small run-down restaurant to me, but it's not that bad for an establishment of Earth.",
			'Damn those old-timers in Heaven! They never know how to change!',
			'Heaven is way more affluent than Earth, but I guess I can force myself to stay here for a while.',
			'The peasants must be rushing to this izakaya right now if they knew a resident of Heaven is visiting~',
			"There are a lot of weird things here on Earth. It's not classy, but interesting nonetheless.",
		],
		description: [
			"The infamous aggressive and arrogant delinquent celestial. I don't really want to serve a guest like her unless absolutely necessary. . .",
			"I'd like to apologize for what I wrote before. I really should treat every guest with equal respect. She might be aggressive, arrogant, angers everyone around her every time she opens her mouth, and has no common sense. . . I need to take a deep breath. . . Well, I still need to do my job and serve her! I'll do my best and control my temper. . .",
			"Actually, she is not as bad as I thought. She likes to insult others (A LOT!!!), but I'm pretty sure she's just hiding her feelings. She didn't enjoy her time in Heaven, so maybe I could make her happy if I treat her well here on Earth?",
		],
		evaluation: {
			bad: "Hmph, that's about the best you can get on the ground.",
			exbad: "It feels like I'm swallowing needles!",
			exgood: "I'm satisfied! I never thought this kind of delicacy would be possible to make in this barren world!",
			good: 'Delicacies like this could stand out, even in Heaven.',
			lackmoneyangry:
				'Hmph, my presence in your place should have been an exceptional honor for you.',
			lackmoneynormal:
				"Huh, you don't deserve anything more than that for this time!",
			norm: 'The puny creatures on land do have something to offer after all.',
			repell: 'Pathetic creature, how ridiculous!',
			seenRepell: "Foul creature, I won't even notice your existence.",
		},
		name: 'Tenshi Hinanawi',
		spellCards: {
			negative: [
				{
					description:
						"Summon a danmaku keystone from the sky and destroy a dining table, scaring off whoever is eating there. This dining table must be repaired, and you can't host new guests at that damaged table for the next 60 seconds.",
					name: 'Pillars of Divine Punishment',
				},
			],
			positive: [
				{
					description:
						"Releases celestial power from Heaven! Will skyrocket every dining guest's satisfaction level to 85%.",
					name: 'Sky of Scarlet Perception of All Humankind',
				},
			],
		},
	},
	10: {
		chat: [
			"Don't worry, I only steal...uh, borrow books. I always pay for my meals~",
			'Damn it! I lost to Reimu again!',
			"There are way too many witnesses... I can't dine and dash!",
			'Magic is an art, and art is an EXPLOSION! Cooking is not so different.',
			null,
		],
		description: [
			"A talkative human magician. She lives alone in the Forest of Magic, but she can make friends no matter what! Her friends include humans, youkai, fairies, and so on. . . Oh, she's also an expert when it comes to fungus.",
			"Even though she looks like she does nothing at all every day, she's actually the owner of the Kirisame Magic Shop! However, she rarely cleans her store! It's so messy that most people mistake it as a trash recycling station! It's only logical that she doesn't have any customers.",
			"While she could be careless at times, she's always honest and frank. Talking with her is always fun! Don't know why, but despite her rigorous training, she rarely tells others about it. She left home and became independent at a very young age. I just wish she could learn to trust her friends more so that we can shoulder her pain and help her out from time to time.",
		],
		evaluation: {
			bad: "It's average.",
			exbad: 'What the hell is this? I would rather eat raw mushrooms!',
			exgood: 'Did you cast any magic in secret? How could there be anything so tasty?!',
			good: "Such delicacy, it's good enough to be the highlight of a feast!",
			lackmoneyangry: "I'm gonna borrow some more cash!",
			lackmoneynormal:
				"I've paid my bill. You feel there's cash missing? It's none of my business--",
			norm: "Not bad. Why don'tcha teach me how it's made?",
			repell: 'Trust me, I have money to pay this time!',
			seenRepell: 'That was rather unfriendly-',
		},
		name: 'Marisa Kirisame',
		spellCards: {
			negative: [
				{
					description:
						"Randomly steal two items. These could be completed dishes, ingredients, or beverages. You don't even have time to cry before Marisa took off with something valuable. Oh, did I mention she doesn't pay the bill when she leaves this way? She denies this as stealing, saying that she'll give them back when she dies!",
					name: 'Magic Spell "I\'ll Take That!"',
				},
			],
			positive: [
				{
					description:
						"Randomly obtain three mushroom ingredients. Occasionally will give you something rare! Wondering why stars create mushrooms, and why the mushroom-loving Marisa is willing to them to you? . . .You'll be unhappy.",
					name: 'Shooting Star "Super Perseid"',
				},
			],
		},
	},
	15: {
		chat: [
			"I'm not skipping work——ok, I did at least sneak out.",
			"Miss Sakuya's throwing knives look like they have eyes!",
			'When will the mistress finally return the second volume of that manga...?',
			'I have to sneak back before the chief maid finds out~',
			"You shouldn't exercise immediately before or after a meal. Taking a nap is best~",
		],
		description: [
			"I can't believe the youkai guarding the Devil's Mansion is this kind and enthusiastic! It's a pity that she's sleeping every time I want to chat with her.",
			"Miss Meiling has to guard this huge mansion all by herself, without a single person to switch shifts with. No wonder why she's always sleeping. I hope there's something I can do to help her.",
			"It turns out Miss Meiling's homeland is on the other side of the ocean! However, there is no ocean in Gensokyo. Does it mean she can never go back home? I heard that there are many famous cuisines there! If I can make them for Miss Meiling, perhaps she would be less homesick?",
		],
		evaluation: {
			bad: "If it's just to fill my stomach...",
			exbad: 'Unacceptable! Serving me with a thing like this!',
			exgood: "Having a delicacy like this, I wouldn't regret it even if I end up with a head full of knives!",
			good: 'This is something worth risking being stabbed by knives for!',
			lackmoneyangry: 'Even a humble guard cannot afford it!',
			lackmoneynormal: "That's the last of my wage...",
			norm: "Hmm... It's tasty, I think?",
			repell: "It turns out Ma'am would do such a thing...",
			seenRepell: null,
		},
		name: 'Hong Meiling',
		spellCards: {
			negative: [
				{
					description:
						"Summon an angry panda and destroy a dining table. If there is anyone dining at that table, they won't be anymore. Decrease atmosphere points by 10, and make the table unusable for the next 90 seconds. Call an emergency repair!",
					name: 'NOver say no to pOnda',
				},
			],
			positive: [
				{
					description:
						'Meiling, high on food, starts performing tricks. For the next 30 seconds, vibe is increased by 1 every 2 seconds. While this effect is active, rare guests who have their order completed gain increased friendship!',
					name: 'Flower Sign "Gorgeous Sweet Flower"',
				},
			],
		},
	},
	24: {
		chat: [
			'Eternal life only means eternal loneliness.',
			'If you need any charcoal, just come and find me!',
			'If that bastard found a way to return to the Moon, I wonder if she will go back...',
			'From the endless flames arises the rebirthing phoenix!',
			"Don't carelessly toss away cigarette butts!",
		],
		description: [
			"An incredible human living in the depth of the Bamboo Forest of the Lost. She has almost no desire to get involved with the rest of the world. She became immortal as the result of eating something strange. (That's why you should never put anything you don't know in your mouth)",
			"Miss Mokou is so dashing! She's extremely powerful as a human and is always straightforward and to the point! I heard that spicy food lovers are all extra-extroverts! Well, Miss Mokou couldn't have a meal without spicy food!",
			"She's actually more selfless and caring than I originally thought. It seems that she has suffered tremendously in the past. Despite this, she's still helping others without expecting anything in return. I am very confident that many people will like and respect her!",
		],
		evaluation: {
			bad: 'You need some more practice.',
			exbad: "It's hard for my teeth but I'm sure it'll be harder for my liver!",
			exgood: 'Staying alive is truly... wonderful!',
			good: 'Delicacies like this are exceptional, even within the centuries I have lived.',
			lackmoneyangry:
				'The passage of time is no match for the speed at which you change the price!',
			lackmoneynormal:
				"I've been living a frugal life, that's all I have...",
			norm: 'I suppose you can do better than this.',
			repell: "...Fine. I've gotten used to it.",
			seenRepell: "Don't treat others in the way you don't like.",
		},
		name: 'Fujiwara no Mokou',
		spellCards: {
			negative: [
				{
					description:
						'For the next 30 seconds, it doesn\'t matter how good the dishes are, guests will only give at most a "fair" rating.',
					name: 'Fujiwara "Wounds of Metsuzai Temple"',
				},
			],
			positive: [
				{
					description:
						"Mokou releases flames that increase the temperatures of all kitchenware, enhancing their efficiency. (Don't ask me how that works on the cutting board. It just works, OK?) For the next 20 seconds, dishes can be completed 50% faster.",
					name: 'Undying "Fire Bird -Feng Wing Ascension-"',
				},
			],
		},
	},
	25: {
		chat: [
			'The early bird gets the worm. Should I do something productive?',
			'I gave up finding those five beautiful treasures a long time ago.',
			"I'm not a NEET! It's because Eirin nags way too much every time I head out.",
			"The rain in Gensokyo has a pH of 6, meaning it's not that acidic.",
			'An Udumbara with seven colors looks gorgeous, but a dish with seven colors feels disgusting.',
		],
		description: [
			"Rumor says she's the lunar princess and currently resides in Eientei. I really don't understand why she would give up living like as a princess and instead come to Gensokyo and live like a hermit.",
			"The lunar princess seems elegant, but somehow behaves with minimal moral standards. . . No wonder why she's the master of that black rabbit (I'm talking about her heart). . .",
			"Who knew that a noble princess also worries about jobs like us ordinary folks. You and I are not so different, Miss Kaguya. Since I'm a veteran when it comes to work experience, I should do my best to guide her and help her figure everything out!",
		],
		evaluation: {
			bad: "It's not worthy of my trip.",
			exbad: 'How dare you present such filth!',
			exgood: 'Who would think of returning to the Moon when there are delicacies this good on the Earth?',
			good: 'The taste of this cuisine is luxurious.',
			lackmoneyangry: 'Are there scammers everywhere on the Earth!?',
			lackmoneynormal:
				'Hmm, the price here seems different to that on the Moon.',
			norm: 'Food on the Earth has always been good.',
			repell: 'What a rude youkai!',
			seenRepell: 'My mood is gone all of a sudden.',
		},
		name: 'Kaguya Houraisan',
		spellCards: {
			negative: [
				{
					description:
						'Fast forward time and decrease operation hours by 30 seconds. Will forcibly end operations if it reaches midnight.',
					name: 'Divine Treasure "Jeweled Branch of Hourai -Dreamlike Paradise-"',
				},
			],
			positive: [
				{
					description:
						'Turn back time and increase operation hours by 30 seconds.',
					name: 'End of Imperishable Night -Rising World-',
				},
			],
		},
	},
	27: {
		chat: [
			'Life is a plate of magical pasta~',
			'I got slightly bored reading books all day. Might as well come out once in a while.',
			"I didn't misplace those books. Those books chose where they wanted to stay~",
			'Magic is actually not that different from science.',
			'A concoction of cooking and magic. I wonder what it would be like~',
		],
		description: [
			"A weird magician who's always wearing pajamas and sitting under the shade. She doesn't seem to care about what others say about her, nor is she interested in popular trends. She looks really weak. Instead of having a good brain, I would say having good health is more important.",
			"Miss Patchouli never puts down her books. Wouldn't her eyes get strained after reading so much? Not to mention, books could be wrong as well. Is one really smart if one never verifies what one knows? Despite reading all the books, she sometimes lacks common sense.",
			'My Sensei seems to suffer from anemia and asthma, which is rather concerning. (I should be fine calling her "Sensei" here?) We have known each other for so long, but Sensei is still a little cold to me. However, she taught me a lot, so I can\'t embarrass her!',
		],
		evaluation: {
			bad: 'Talking should be avoided during eating or sleeping.',
			exbad: 'What trash! Is this all it takes to start a business?',
			exgood: "It's difficult to reach this level of cooking, even for a knowledgeable scholar.",
			good: 'How on earth did you make this so refreshing?',
			lackmoneyangry:
				'Hoho! The price of emerald or laurel is no match for what you offer.',
			lackmoneynormal:
				"*cough* ...I'm not feeling well, I've got to go....",
			norm: 'You should be able to do better if you read a bit more.',
			repell: 'Being rude is worse than being dead!',
			seenRepell: 'Hmph, pathetic.',
		},
		name: 'Patchouli Knowledge',
		spellCards: {
			negative: [
				{
					description:
						'For the next 30 seconds, all dishes have a 50% chance of becoming Dark Matter.',
					name: 'Metal & Water Sign "Mercury Poison"',
				},
			],
			positive: [
				{
					description:
						'For the next 30 seconds, all dishes with a "Cultural Background" tag will receive the highest rating.',
					name: 'Knowledge Bizarre Adventure "Cultural Atmosphere"',
				},
			],
		},
	},
	28: {
		chat: [
			"I'm the strongest! I'm the best!",
			'Ha! My Icicle Fall can even hit flying birds!',
			'Can you stop treating me like a common, ordinary fairy?',
			'Kimchi? Just eat it before the vegetables finish fermentation.',
			"I call a timeout! Let's finish hide-and-seek with a full stomach~",
		],
		description: [
			"A fairy with ice wings. She claims to be the strongest in Gensokyo. I have no idea how she can fly with those wings. Of course, I also have no idea why her brain is always short-circuiting. She's always doing the opposite thing to everyone else. Anyway, just don't take her words seriously.",
			"Although she's just an ice fairy, she's surprisingly hot-blooded! Who knows, maybe she actually is the strongest fairy, given how courageous she is. She would always keep going no matter what. Even death cannot stop her. Bravo, bravo!",
			"I feel confident whenever I'm around her. Is this what they mean by a \"natural-born leader\"!? Maybe we have something in common? Does that mean I'm also an idiot? Hahaha, I'm just joking~",
		],
		evaluation: {
			bad: "Don't think you can get rid of me with this!",
			exbad: 'Something like this should be cryo-freezed with some English beef!',
			exgood: 'My tongue is gonna melt!',
			good: "Yummy! I'd have you serve under me from this point!",
			lackmoneyangry: 'Out! Of! Money!',
			lackmoneynormal: 'How could a fairy like me have that much cash.',
			norm: "There's a risk of biting my tongue if I eat and talk.",
			repell: 'The nerve you got sending the strongest away-',
			seenRepell: "That's not fun when you chase out your guest.",
		},
		name: 'Cirno',
		spellCards: {
			negative: [
				{
					description:
						'Randomly freezes 3 kitchenware. If you have unfinished dishes in those kitchenware, they will be frozen and shattered. Lasts 30 seconds.',
					name: 'Freeze Sign "Perfect Freeze"',
				},
			],
			positive: [
				{
					description:
						'Randomly obtain three common drinks with the "chillable" tag and 2-5 ice cubes.',
					name: 'Sweet Ice Fairy',
				},
			],
		},
	},
	29: {
		chat: [
			'Humans run out of their luck just meeting me~',
			"I can't believe a bird-brain can handle a business this big.",
			"Ho ho, It's a fine place ya got here. I've leftya alone for too long. It's time to collect the \"protection fee\" now~",
			"You're still way too inexperienced. I'll take you under my wing and teach ya how to actually run a business~",
			"You'll be lucky if you meet me! However, only lucky people can find me~",
		],
		description: [
			"A youkai rabbit who started visiting my izakaya out of nowhere. Sometimes she's just smiling there, menacingly! Just seeing her rabbit ears gives me PTSD flashbacks!",
			"She's always ripping me off by forcing me to buy expensive stuff from her. But to tell you the truth, sometimes she does carry some very useful ingredients.",
			"I don't feel good asking Miss Reimu to exterminate her all the time. . . If I have enough money on hand, then maybe it's not a bad thing to invite her once in a while? Supposedly seeing her would make one very lucky?",
		],
		evaluation: {
			bad: "It's no better than the sticky rice cakes made by my rabbits.",
			exbad: 'Ya want me to pay for such thing? I want to be compensated!',
			exgood: 'Holy Moly! ...Boss Lady! You gonna be damn rich!',
			good: 'Finally, some good luck-ing food!',
			lackmoneyangry:
				'I never ordered any of these! You should pay for whatever ya serve.',
			lackmoneynormal: "That's all I have, take it or leave it~",
			norm: 'This is what ya want me to pay for... Fine, so be it.',
			repell: "Bloody sparrow... We'll see!",
			seenRepell: "Such a bad store isn't even worth blackmailing.",
		},
		name: 'Tewi Inaba',
		spellCards: {
			negative: [
				{
					description:
						'You "were" a good kid, but it seems necessary to mark fear in your DNA once more. Activates forced sale again. If you refuse, then she will activates another punishment spell card —— Trick"Combo Disappearance Jutsu" Reset your Combo, and prevents you from accumulating new Combo for the next 30 seconds.',
					name: 'Memory "Remember That Year\'s Rabbit Horror"',
				},
			],
			positive: [
				{
					description:
						"All ingredient collection points' cooldown are instantly refreshed, and give you 1-2 extra ingredients when you collect them the next day.",
					name: 'Vitality "Luck From The Forty-Leaves Clover"',
				},
			],
		},
	},
	30: {
		chat: [
			'What kind of cuisines will this world offer? I look forward to it~',
			'The residents of this world don\'t look as "rigid" as the people in my world.',
			'Everyone here looks so cute! Even I look cute!',
		],
		description: [
			'The mascot of MCGensokyo! She traveled here via "the gate of collaboration". As the ambassador here, she is constantly telling the residents of this world to visit MCGensokyo! Her mission statement says she\'s fostering a friendlier environment and promoting each other\'s world.',
			null,
			null,
		],
		evaluation: {
			bad: 'Is this what I came all the way here for?',
			exbad: 'Is this how you show your hospitality to an exotic guest?!',
			exgood: "Excellent! I'm gonna introduce it to every single person in my world!",
			good: 'Great! Worth all the effort I traveled through the passage!',
			lackmoneyangry: 'Is it common to rip off customers over here?',
			lackmoneynormal: "Ah, I've nearly gone bankrupt.",
			norm: 'I had expectations but this is what I got.',
			repell: "Waah, I'm gonna complain to the developer about this damn place!",
			seenRepell: 'Wow- The hostess over here is a hooligan!',
		},
		name: 'Meng Chengguo',
		spellCards: {},
	},
	31: {
		chat: [
			'Sunny: Hahaha. What do you have for us today?',
			'Luna: Eh... We really look different from everyone else!',
			"Star: It's kinda cramped in here when the three of us sit together...",
			"Sunny: Ma'am! Show us the best of the best!",
			"Luna: Phew. Brought some cash with us... We don't have a lot, everyone!",
			'Star: I really want to sneak into the kitchen and learn something from that sparrow.',
		],
		description: [
			'Heroines of "Three Fairies \'Hoppin Flappin\' Great Journey!" They traveled here via "the gate of collaboration." Their endless curiosity and energy made them quite popular in this world as well. Just seeing them hopping around will make me happy for an entire day!',
			null,
			null,
		],
		evaluation: {
			bad: "Don't you feel guilty feeding fairies with this?",
			exbad: "Even a dog won't eat this damn thing!",
			exgood: "It's so good! We're getting freakin HIGH!",
			good: 'What did you put into it?! How could this be so tasty!?',
			lackmoneyangry:
				"It's a rip off! The proprietress is ripping us off!",
			lackmoneynormal:
				'We almost got imprisoned in a bottle for failing to pay...',
			norm: "It's alright.",
			repell: 'Waah-This world is bullying tiny fairies like us!',
			seenRepell: "That's what you'd call an evil proprietress!",
		},
		name: 'Three Fairies',
		spellCards: {},
	},
	36: {
		chat: [
			"My name 'Rin' is actually the same spelling as the legendary beast Kirin. Sounds awesome, right?",
			'There are way more visitors here than at my hospital.',
			'I had a patient complain today because I injected the needle with too much force...',
			"What's up with that charlatan in the bamboo forest?",
			"I ain't getting any younger ya know? Hurry up with those dishes!",
		],
		description: [
			"A human nurse working in a clinic in the Human Village. She's honest and doesn't know what euphemisms are. However, she's an excellent nurse when it comes to providing care to others. She hates patients who don't take care of themselves during recovery. For them, she will use extra force when injecting needles. . .",
			null,
			null,
		],
		evaluation: {
			bad: "It's no better than medicine.",
			exbad: "Don't think you can bully me simply because I barely show up!",
			exgood: 'My built-up fatigue during the whole day is now gone!',
			good: 'Yummy! Even a youkai can cook better than I do...',
			lackmoneyangry:
				"Bullshit! Don't ever think I would accept the price you offer!",
			lackmoneynormal: "That's everything I have now...",
			norm: 'Not bad.',
			repell: "You want me out? You don't want to see my face next time you go to the clinic!",
			seenRepell: 'Discrimination is pointless.',
		},
		name: 'Rin Satsuki',
		spellCards: {
			negative: [
				{
					description:
						'Eating too quick will harm you! You could get indigestion! All guests, including those waiting in line, will take twice as long to finish their meal. However, other buffs like Toutetsu Feast still takes precedence over this skill.',
					name: 'Slow And Savor For Health And Vigor',
				},
			],
			positive: [
				{
					description:
						"Under Satsuki Rin's special treatment, the negative effects of ingredients such as high cholesterol, high sodium, and high calories have been removed or mitigated. Guests can enjoy delicious food with maximum nutrition. All guests, including those waiting in line, independently have a 30% chance of ordering once more regardless of their budget.",
					name: 'Help Me Up! I Can Still Eat!',
				},
			],
		},
	},
	37: {
		chat: [
			'Practice good karma! Or else you will be ☆tortured☆by☆me~',
			'Good and evil will always be rewarded; it is only a question of time.',
			"I'm brutal? Hahaha! They deserved it!",
			'I have no need of sympathy for anything.',
			'Humans, treasure your precious life.',
		],
		description: [
			"A demon guard from the 8th level of Hell, aka the Hell of Blizzards. Rumor says her job is to torture prisoners there! That's so scary! She's loud and always stands out when it comes to her clothing choice and expressions. To tell you the truth, she's kind of like a yakuza. She's either fighting someone or on her way to fight someone. I'm really worried that she may get mad one day and just decide to tear down my izakaya. . .",
			null,
			null,
		],
		evaluation: {
			bad: 'Is this the best you can get above ground?',
			exbad: 'You wanna go to hell!?',
			exgood: 'I would offer you an exclusive position as a chef in Hell!',
			good: 'The food over here is truly interesting!',
			lackmoneyangry:
				'You wanna rip me off? Ask for it in Hell if you dare!',
			lackmoneynormal:
				"Why do you have the right to set the price? It's all up to me!",
			norm: 'Just average.',
			repell: 'Damn! Once I get you...',
			seenRepell:
				'Huh, so creatures on the surface bully the weak and yield to the strong too.',
		},
		name: 'Shio Tachisora',
		spellCards: {
			negative: [
				{
					description:
						'For the next 120 seconds, making any dish with the "mild" or "vegetarian" tags will become Dark Matter.',
					name: 'Torture "Arbuda"',
				},
			],
			positive: [
				{
					description:
						'Uses the ability of space to confine all diners. As long as they still have cash and have room to finish the next dish, they must order! They will continue to order and cannot leave their seat until the guest has spent over 70% of their budget.',
					name: "It's Party Time!",
				},
			],
		},
	},
	38: {
		chat: [
			'The next time hell undergoes significant changes, it will absolutely cause chaos...',
			"Tomorrow, you'll regret your stubbornness today.",
			'All evil must be punished.',
			'Even a deterministic world yields endless possibilities.',
			'That Youkai Sage... Ah, I see.',
		],
		description: [
			"She's the senior administrative officer of New Hell, the chief director of the Hell of Blizzards, and general counsel of the legal department in Hell. Why someone of her importance would visit my izakaya is completely beyond me. . .",
			null,
			null,
		],
		evaluation: {
			bad: "You'll fall behind if you don't work harder, even risk your entire business.",
			exbad: 'Painful experiences are the most important lessons.',
			exgood: 'Such delicacies on the surface could make people indulge themselves.',
			good: 'Not bad, you cook it effortlessly after some trial and error.',
			lackmoneyangry:
				'Those cheating in trade shall be sentenced to the Hell of Blades.',
			lackmoneynormal:
				"It's a sin to set an unfair price. I would only pay what you deserve per the rules.",
			norm: 'From what I have seen... you should be able to do better.',
			repell: 'Even Gensokyo could not stand a guest from Hell?',
			seenRepell: 'Their trauma would not get wiped out easily by time.',
		},
		name: 'Yuu Jien',
		spellCards: {
			negative: [
				{
					description:
						'For the next 60 seconds, all guests will give a random rating regardless of what they receive.',
					name: 'Rhythm "Upside Downtown"',
				},
			],
			positive: [
				{
					description:
						"Through the power of logic and deduction, you can now see guests' remaining budget and how many more times they will order.",
					name: 'Causation "Eyes Of Deduction And Judgment"',
				},
			],
		},
	},
	39: {
		chat: [
			'I can finally visit here while not on duty!',
			'I wholeheartedly apologize for my rudeness before. Thank you so much for forgiving me.',
			"*sigh* Fulfilling Lady Yuyuko's every desire always leaves me exhausted.",
			'Hey, if you need any assistance, tell me right away!',
			'It would be great if we could have an izakaya in the Netherworld.',
		],
		description: [
			'She serves the ghost princess of the Netherworld! She is her gardener, guard, and chef. . . That means she has to take care of 200 acres of garden, secure its perimeter and feed the gluttonous master at the same time! (None of which is an easy task.) I hope she can finally relax in my izakaya.',
			null,
			null,
		],
		evaluation: {
			bad: "Huh- It should not taste like this, shouldn't it?",
			exbad: 'This is too much even as a joke!',
			exgood: 'Ah——is this what I could never achieve?!',
			good: 'Hmm, if only I could make something so tasty!',
			lackmoneyangry:
				'My grandfather told me to turn around immediately upon getting blackmailed!',
			lackmoneynormal: 'Sorry! I can only pay this much...',
			norm: 'I should be able to make this, right?',
			repell: 'Why? Why would this happen to me...',
			seenRepell: 'I feel bad for those getting chased away...',
		},
		name: 'Youmu Konpaku',
		spellCards: {
			negative: [
				{
					description:
						'All guests lose patience twice as fast, and reduce 1 atmosphere point every 2 seconds. Last 60 seconds.',
					name: 'Heaven Sword "Five Signs of the Dying Deva"',
				},
			],
			positive: [
				{
					description:
						'Demonstrates to you an advanced sword technique. You are inspired by this move, and can complete any dishes made on the cutting board instantly.',
					name: 'Hell Realm Sword "Two Hundred Yojana in One Slash"',
				},
			],
		},
	},
	40: {
		chat: [
			"I couldn't forget the taste in my dreams, so I came back~",
			'Hmm. There are too many small bones in a night sparrow...',
			"Can I really not eat the cook behind the counter? That's too bad...",
			"Don't worry about me. Just treat me like everybody else here~",
			"Ara~ I'll be embarrassed if you stare while I eat...",
		],
		description: [
			"A scary monster who almost devoured the entire Gensokyo! I thought everything would return to normal once everything was over, but she wanted to eat me at first glance!? She comes to my izakaya occasionally, but sometimes she stares at me and starts to drool. . . I don't want to see this ghost ever again in my life!!!",
			null,
			null,
		],
		evaluation: {
			bad: 'This was not the taste I had in mind.',
			exbad: 'I would rather eat you instead~',
			exgood: "This is the very taste I've been craving!",
			good: 'Holding out for food occasionally is a right decision~',
			lackmoneyangry: 'Oops, I forgot my purse~',
			lackmoneynormal:
				'Is it time to check out? Let me see, that should do it~',
			norm: "It's a bit different from my first impressions.",
			repell: "I'm not gonna make you bankrupt~",
			seenRepell: 'Eh? The tiny sparrow is rather disappointing...',
		},
		name: 'Yuyuko Saigyouji',
		spellCards: {
			negative: [
				{
					description:
						"Until business ends, dishes which don't have all 5 ingredients will receive bad ratings.",
					name: 'All on the House',
				},
			],
			positive: [
				{
					description:
						'Until business ends, guests will finish their dishes instantly. When this spell card is activated again, it becomes "Metamorphosis of Ink-Black Cherry Petals" Yuyuko releases 1/3/5/8 (increases with each activation) butterflies which fly towards the holding cabinet. Each butterfly consumes a dish in the holding cabinet, converting it into money equivalent to 4 times the value of the dish (affected by tip bonuses).',
					name: 'Food Vanishing Technique',
				},
			],
		},
	},
	41: {
		chat: [
			'Is this also part of the Dream World?',
			'The new Mask of Hope... feels kinda lame.',
			'I learned a lot from those intense battles of emotions.',
			"Mystia's Izakaya... is great place to attract a following.",
		],
		description: [
			"A mask tsukumogami composed of 66 masks. She usually wears a staid, quiet face, and averts her gaze immediately if you look her in the eyes. You might think of her as cold at first, but she's too used to relying on her masks, so she can't understand emotions. In a certain sense, she's as innocent as a newborn—and it is true that she hasn't been too long since her birth as a youkai! She's currently trying her best to better understand emotions. I'm sure she'll be able to smile a smile that truly belongs to her one day!",
			null,
			null,
		],
		evaluation: {
			bad: 'Not good... This is the face of disappointment.',
			exbad: 'Disgusting... This is the face of outrage.',
			exgood: 'Perfect! This is the face of ecstasy.',
			good: 'Yummy. This is the face of delight.',
			lackmoneyangry: 'Expensive! This is the face of scorn.',
			lackmoneynormal: 'Wallet empty... This is the face of guilt.',
			norm: 'So-so. This is the face of calm.',
			repell: 'Kicked out... This is the face of speechlessness.',
			seenRepell:
				'How could you treat your guests like this? This is the face of astonishment.',
		},
		name: 'Hata No Kokoro',
		spellCards: {
			negative: [
				{
					description:
						'Kokoro performs the Noh of Darkness, affecting the mood of everyone present. Tip rate decreased to 0. Lasts for 66 seconds.',
					name: 'Dispirited Soul "Relief of Worldly Desires"',
				},
			],
			positive: [
				{
					description:
						'When there is no mask of emotion present, summon the corresponding mask of emotion for that day. Lasts for 30 seconds. If there is already a mask present, increase the duration of its buff by 30 seconds.',
					name: 'Blooming Soul "Shifting Four Emotions"',
				},
			],
		},
	},
	1000: {
		chat: [
			'Only a sharp businessman can make the most out of any intel.',
			"If you don't plan for success, then you'll face failure.",
			"A boat is safe in the harbor, but that's not why we build them.",
			"Potential customers don't care about anything that they aren't concerned about.",
			"There's only one rule for us capitalists: High wages and low production cost will guarantee the best quality products and maximum profits.",
			'Should I ask some kappas to focus on researching food. . .',
		],
		description: [
			"If the kappa are all entrepreneurs, then as a midboss, she is the best among them! Although it's fine for businessmen to seek profit, it would be nice if she could place friendship above business once in a while. . .",
			"Miss Nitori is really smart, especially when it comes to business and technology! I always thought that kappa were profit-oriented, but they seem to be willing to spend all their money on risky tech investments. . . I really don't understand them. . .",
			'Her ability to turn every incident into a business opportunity never ceases to amaze me. Is it possible to learn this power?',
		],
		evaluation: {
			bad: 'Pointlessly adding unnecessary things will only lower its value.',
			exbad: 'How is this place even popular in Gensokyo? This is false advertising!',
			exgood: 'I got more than what I paid for. I have to do something in return!',
			good: 'It was the right choice inviting you to open an izakaya in the mountain!',
			lackmoneyangry: "At this price!? It's a robbery!",
			lackmoneynormal:
				"I made a little money recently, but I can't afford to spend it like this!",
			norm: 'Food processing is harder than you think. You still have a way to go.',
			repell: "You won't last long treating your clients like this.",
			seenRepell:
				"Ma'am, you still don't know how to properly do business.",
		},
		name: 'Nitori Kawashiro',
		spellCards: {
			negative: [
				{
					description:
						'Summon a flood, washing away 3-5 random guests dining at the izakaya.',
					name: 'Water Sign "Kappa\'s Flash Flood"',
				},
			],
			positive: [
				{
					description:
						'For the next 120 seconds, partners can serve food and drinks remotely using kappa tech "Extending Arm."',
					name: 'Kappa "Exteeeending Aaaaarm"',
				},
			],
		},
	},
	1001: {
		chat: [
			"My shogi opponent today was pretty good. That's why the game is so interesting!",
			'Even if intruders are rare, one should always remain alert.',
			'They say kappa are geniuses, but they lose to me in both swordsmanship and shogi.',
			'The larger the faction, the greater the need for rules.',
			'Who knows what that crow tengu is planning now. . .',
		],
		description: [
			'A white wolf tengu who often patrols the Youkai Mountain and has a very keen sense of smell and hearing. Oh, she can also see things 1,000 miles away and spot intruders almost instantly! Small fry youkai like us are always afraid of entering the mountain precisely because there are guards like her everywhere in Youkai Mountain.',
			"Because Youkai Mountain rarely has intruders, she doesn't have much to do as a guard. Ever since the izakaya opened, she seems very happy to have a place to visit after work. Even with a strict face, you can read her mind through her wagging tail.",
			"She seems rigorous at first. But after she's familiar with you, she'll frequently complain about work and show her cute side. She's easier to handle than I thought. . . If I knew this earlier, I would have visited Youkai Mountain earlier!",
		],
		evaluation: {
			bad: 'Should have just ordered drinks and nothing else...',
			exbad: "You're squeezing the wallets of the working class only to serve this!?",
			exgood: 'I expected nothing less from the best of the best in Gensokyo! Thank you so much!',
			good: 'Delicious food can wash away all the fatigue from work!',
			lackmoneyangry:
				"This price tag violates Youkai Mountain's Price Regulation Treaties!",
			lackmoneynormal:
				"Guards really don't make a living wage. I can't even afford a decent meal...",
			norm: 'I can swallow this with enough alcohol...',
			repell: 'Are you looking down on the working class tengu?',
			seenRepell: "This won't unite the mountain together!",
		},
		name: 'Momiji Inubashiri',
		spellCards: {
			negative: [
				{
					description:
						'Blocks the path to the izakaya and forbids any new guests from coming in for the next 30 seconds.',
					name: 'Martial Law',
				},
			],
			positive: [
				{
					description:
						'A lot of white wolf tengus will come and dine for a short period of time.',
					name: 'Tengu Routine Sips',
				},
			],
		},
	},
	1002: {
		chat: [
			'Might not be a bad idea to go back once in a while. . .',
			"The dolls look a little worn out lately, I'll have to go back and fix them up later.",
			'Which puppet show should I perform tomorrow. . .',
			"I didn't realize how many magicians there are until I started visiting here. . .",
		],
		description: [
			"A magician who lives in the Forest of Magic with blond hair and fair skin. She's so pale that she looks like a doll. Rumor says her home is also full of dolls so vivid they look alive! It's. . . kind of creepy. . .",
			'Anyone seeing the movement of her dolls will question whether they are alive. She\'s actually very considerate of others even when she seems hard to approach. Is this what they mean by an "urban mentality?"',
			"It's not easy opening up to her. She's polite, gentle, yet distant. Having so many dolls. . . Was she lonely?",
		],
		evaluation: {
			bad: 'Might as well just let my dolls cook for me…',
			exbad: 'Why am I suffering like this when I can just use magic and stop eating!',
			exgood: 'I thought this lovely taste was only possible in fairy tales!',
			good: 'Food like this is what keeps me eating like a human~',
			lackmoneyangry:
				'Is this a new scheme? This has got to be a scam of some sort!',
			lackmoneynormal:
				"Spent too much on purchasing materials and didn't pay attention to my budget...",
			norm: "It's edible.",
			repell: "... I wasn't planning on eating anyway.",
			seenRepell:
				"The dining experience is equally important. The food won't taste good if the experience is horrible.",
		},
		name: 'Alice',
		spellCards: {
			negative: [
				{
					description:
						'Throw a magical vial at the kitchen and blow up a random kitchenware. It takes 60 seconds to repair it.',
					name: 'Magic Sign "Artful Sacrifice"',
				},
			],
			positive: [
				{
					description:
						"Alice's dolls will transform into guests and fill all remaining empty seats.",
					name: 'Waltz Between Children & Dolls',
				},
			],
		},
	},
	1003: {
		chat: [
			'Underestimating people has consequences in this world, ya know?',
			'The petroleum at the Blood Pools of Hell is also very delicious~',
			'My motto is "sit back and reap the rewards after the fight."',
			'Most members of the Goyouku Alliance act according to their own will without consulting others first.',
			'If I eat this little sparrow, I wonder if I too can create something delicious. . .',
		],
		description: [
			"The leader of some alliance in the Animal Realm. A legendary gluttonous being that can unbelievably devour anything! Her personality will be affected by the things she eats. Seems like she's on a quest for food and will occasionally visit the izakaya as a guest. . . She looks just like a small child no matter how you slice it. I hope no idiots accidentally underestimates her. . .",
			null,
			null,
		],
		evaluation: {
			bad: "I didn't come all the way to the surface and eat junk like this!",
			exbad: 'Do you really want to experience the fear, sorrow, grief, and loathing of the Blood Pools!?',
			exgood: "This exploded my taste buds! It's worthy of entering my boundless stomach!",
			good: "I've always underestimated the surface, but it was well worth the trip!",
			lackmoneyangry:
				'You want to scam me? Ask yourself if you got what it takes!',
			lackmoneynormal:
				'Savage and absurd! Almost to the level of the Animal Realm!',
			norm: 'It tastes about the same as black water.',
			repell: 'DID YOU REALLY THINK I WAS NEVER GOING TO EAT YOU!?',
			seenRepell:
				'The surface is not so different from the Animal Realm. Disappointing.',
		},
		name: 'Yuuma Toutetsu',
		spellCards: {
			negative: [
				{
					description:
						'The frenzied Yuuma will devour 3-5 random ingredients, 1-3 drinks and 1 kitchenware, making it unusable for the rest of the night. During the Hell of Blood Pools challenge, Yuuma will also recover an additional 5% HP.',
					name: 'Dinner of Avaricious Divine Beast Taotie',
				},
			],
			positive: [
				{
					description:
						'All other guests other than Yuuma will only order the most expensive food and drinks. These orders will ignore their budgets. Lasts 30 seconds.',
					name: "Toutetsu's Gluttonous Feast",
				},
			],
		},
	},
	1004: {
		chat: [
			'Human realm affairs soothen ordinary fear.',
			'A full stomach is one way to fill a person.',
			'Sweet or salty; bitter or sour. They all have meanings, and should be treated with equal respect.',
			'Even the grandest person still has to return for a bowl of food at the end of day.',
			'Before East and West, there was only North and South.',
		],
		description: [
			"A stone Jizo statue originally placed in the Forest of Magic brought to life by the forest's magic itself. If the forest has magic strong enough to do that, no wonder there are so many magicians living there, it must be really convenient for practice!",
			'I thought that a Jizo statue would be more calm and dignified. . . Turns out that she was just pretending when we first met. With just a few conversations, she completely opened up to me. What a straightforward girl~',
			"She was finally granted the gift of life, but she's a NEET!? What a shame! I have to do something to get her motivated to see the rest of the world!",
		],
		evaluation: {
			bad: "You didn't use recycled sewage oil when cooking, did you?",
			exbad: 'Bad people are just like awful dishes. The sight of it alone is enough to make me sick.',
			exgood: 'So satisfied! Having a full stomach is much better than abandoning all desires~',
			good: 'This dish is well worth the trip!',
			lackmoneyangry:
				"You stoop so low to ask money from a Jizo? Let's treat this meal as your alms to me!",
			lackmoneynormal:
				"Put it on my tab. I'll pay you later with my alms.",
			norm: 'This dish is good for survival, not so much when you want to enjoy life.',
			repell: "I'm not here for alms! I have money!",
			seenRepell: 'Everyone is equal under the natural law!',
		},
		name: 'Narumi Yatadera',
		spellCards: {
			negative: [
				{
					description:
						'Summon Karmic fires that burn three random buffs, removing them and ending their effects.',
					name: 'Jizo "Hellfire Salvation"',
				},
			],
			positive: [
				{
					description:
						'For the next 60 seconds, guests will pay 50% more tips at checkout.',
					name: 'Magic Sign "Instand Bodhi"',
				},
			],
		},
	},
	1005: {
		chat: [
			'Are the kappa getting more excited than usual recently?',
			'Now, everyone in Gensokyo will remember me, right?',
			'I want to make the name of Moriya known throughout Gensokyo!',
			"Those gods like exciting events, but they don't want to be personally involved.",
			'Will I gain weight eating this late. . . Nah, I walked a lot today. Should be fine!',
		],
		description: [
			"A miko who suddenly appeared along with Moriya Shrine several years ago. Apparently she came from the Outside World along with her two gods. . . and a lake. It's still kind of scary how bizarre it is. . .",
			"Unlike Miss Reimu who likes to stay home and drink tea, Miss Sanae is very diligent and is always seen collecting faith everywhere. Collecting faith with a human body is really remarkable! Heard she's also a living god. . .",
			"The Hakurei Shrine has a special status in Gensokyo, so it must be very difficult for the Moriya Shrine and Miss Sanae to surpass them. But under Miss Sanae's dedication, many people already have heard of the Moriya Miko! That's great!",
		],
		evaluation: {
			bad: "This kind of food can't possibly bring people together.",
			exbad: "If I served my believers this kind of stuff, they'll all lose faith in me!",
			exgood: "I almost don't want to convert you!",
			good: 'I knew delicious food is capable of collecting faith!',
			lackmoneyangry:
				"This goes against all common sense! It's way too expensive!",
			lackmoneynormal:
				'The cost of living in Gensokyo is even higher than the Outside World...',
			norm: "If you plan to collect faith with this, you'll still need to refine your cooking skill.",
			repell: 'Eh? Eh, Eh, Eh!?',
			seenRepell:
				"You won't be able to collect faith treating people like this.",
		},
		name: 'Sanae Kochiya',
		spellCards: {
			negative: [
				{
					description:
						'Sanae releases a pentagram, putting you in a sealed state that blocks all buffs for the next 30 seconds.',
					name: 'Miracle "Daytime Guest Stars"',
				},
			],
			positive: [
				{
					description:
						'Invoke the power of miracles and generate three drinks and three ingredients.',
					name: 'Divine Virtue "Bumper Crop Rice Shower"',
				},
			],
		},
	},
	2000: {
		chat: [
			'The Underworld despised by the surface is our sanctuary.',
			'The cave may be dark, but my webs are very bright.',
			'The streets have been really lively lately, go have fun once in a while~',
			'Only by deterring the darkest dark can we receive the brightest light.',
		],
		description: [
			"A friendly guide I met at The Dark Blowhole. She knows people despise her so she almost never goes to the village. But she's clearly so adorable. . . I hope everyone on the surface can get to know her as well!",
			"So Miss Yamame is actually something of an idol in the Underworld! I wouldn't expect anything less from her. Although, compared to her adorable personality, her hobbies are a bit out of the ordinary. . .",
			"Although she's always been misunderstood to the point that she's become \"despised\", it doesn't bother Miss Yamame at all. I can sense that she genuinely cares a lot for this underground world. To be able to have such an open mind is really astounding.",
		],
		evaluation: {
			bad: "I don't want to discourage you, but it doesn't really taste all that good...",
			exbad: "It's not as tasty as the prey I catch on my webs.",
			exgood: 'Being able to eat something so amazing in such a dark cave is really a blessing!',
			good: 'The atmosphere and the food are both top notch~',
			lackmoneyangry: "Your heart's darker than a black widow!",
			lackmoneynormal:
				"I'm not used to the surface's level of spending...",
			norm: "The rumored izakaya shouldn't have been this disappointing...",
			repell: "Will we be despised even if we haven't done anything?",
			seenRepell: "Don't set up shop here if you look down on us.",
		},
		name: 'Yamame Kurodani',
		spellCards: {
			negative: [
				{
					description:
						"You're tangled in Yamame's web! Movement speed decreased by 80%, lasts for 30 seconds.",
					name: 'Small Thread "Kandata\'s Rope"',
				},
			],
			positive: [
				{
					description:
						"For the next 30 seconds, queueing guests will be attracted by the idol, they won't leave even if business ends.",
					name: "Underground Idol's Party Night",
				},
			],
		},
	},
	2001: {
		chat: [
			"Admire the bridge's flowers as you're admired atop a tower.",
			"Everyone looks so happy, I'm so jealous——",
			'A bridge connects one end with the other, symbolizing the path from this world to the next.',
			"Why do the dishes beside me look so tasty, I'm so jealous——",
			'Line',
		],
		description: [
			"I originally thought she was a friendly youkai, but I heard her talking behind my back as soon as I left. . . A youkai who feeds on jealousy that can't live without the jealousy of others? That's really sad. It doesn't look like she cares though. She also has rapid mood swings, how odd.",
			"Hashihime are the youkai of bridges, as well as the guardian of bridges. Miss Parsee actually watches over others day by day to ensure safe travels between the surface and the underground. . . In that case, she's a very noble-minded youkai too.",
			"I realized Miss Parsee is familiar with everyone's good traits! Although everyone says Miss Parsee is a very jealous person, deep down she actually looks up to everyone. Getting to know more about her is really great!",
		],
		evaluation: {
			bad: 'The dishes on the other table are definitely tastier!',
			exbad: 'How the hell are you still in business with this kind of cooking?',
			exgood: "It's so delicious I even forgot about jealousy for a moment——",
			good: 'The warmth you feel when you eat this dish, it really makes me jealous——',
			lackmoneyangry: "I'm nailing this despicable store to a tree!",
			lackmoneynormal: 'Does everyone really have pockets this deep?',
			norm: "I still think other people's dishes are more delicious...",
			repell: "Kicking me out but not others customers, I'm so jealous——",
			seenRepell:
				"Kicking other customers out but not me, I'm so jealous——",
		},
		name: 'Parsee Mizuhashi',
		spellCards: {
			negative: [
				{
					description:
						"Upon the Spell Card's declaration, your partners become extremely jealous of profits not being shared with them, causing their salaries for the day to be doubled.",
					name: 'Malice Sign "Shrine Visit in the Dead of Night"',
				},
			],
			positive: [
				{
					description:
						'Parsee stokes the jealously of all current guests, increasing their budgets to the same as the richest customer present.',
					name: 'Jealousy and Overdraft',
				},
			],
		},
	},
	2002: {
		chat: [
			"Everyone's clawin' for the surface these days, is the surface really that interestin'?",
			'The warmer the sake is, the better it tastes.',
			'No need for the glass, I bring my dish wherever I go.',
			"This place's pretty lively, if ya wanna compare voices no one's louder than an oni.",
		],
		description: [
			"An oni who left Gensokyo a long time ago. She's got the spirit of an older sister with a firm and straightforward personality. She currently manages the hot springs in the streets of Former Hell. Let's go for a bath sometime!",
			"It turns out Miss Yuugi was once one of the Big Four of the Mountain. Rumors say she has an abnormal amount of strength, her grip is almost unmatched even among the oni. I never though I'd be able to meet such a powerful youkai. . . I'm still a little nervous.",
			"I thought oni had already lost interest in humans. . . but in reality Miss Yuugi secretly envies her companions freely moving about on the surface. If you're interested in the surface, just go there! That's how an oni should act!",
		],
		evaluation: {
			bad: "This dish doesn't go well with my sake.",
			exbad: "This dish is practically spittin' on my sake!",
			exgood: "I'll need good wine to go with this good food!",
			good: "Nothin' beats a good meal after bathin' in the hot springs.",
			lackmoneyangry: "First time seein' a store willing to rip-off oni.",
			lackmoneynormal: "It's not good to just have money on your mind——",
			norm: "Long as there's good sake, the dish don't really matter.",
			repell: "You really ain't afraid of death——",
			seenRepell: 'Not amused.',
		},
		name: 'Yuugi Hoshiguma',
		spellCards: {
			negative: [
				{
					description:
						"Yuugi creates three zones, limiting your movement. Lasts for 60 seconds. First Step: Safe zone; Second Step-Sinner's Shackles: Movement speed decreased by 50% when inside the zone; Third Step-Spirits and Anomalies: Entering this zone will immediately stun you for 30 seconds.",
					name: 'Big Four Arcanum "Knock Out in Three Steps"',
				},
			],
			positive: [
				{
					description:
						'Uses the Hoshiguma Dish to level up a set amount of beverages. Max chance to level up 3 Lv1 beverages. 75% chance to level up 2 Lv2 beverages. 50% chance to level up 1 Lv3 beverages.',
					name: 'From Song to Dance',
				},
			],
		},
	},
	2003: {
		chat: [
			"I won't be able read it if it's too far away. . .",
			'I have to get back to work soon.',
			'I managed to squeeze in some free time, I suppose a reward is in order.',
			'Delicacies are not only for the tongue to savor, but also for the mind to enjoy.',
		],
		description: [
			"A mind-reading youkai called the satori, her name is also Satori. Maybe she takes a lot of pride in her race or her ability? She works day in and day out, so we haven't really talked all that much. . .",
			"Miss Satori is the most hardworking mistress I've seen. Although she has pets to assist her with miscellaneous tasks, she seems to be the only one capable of administrative work. She seems to have given up many hobbies for her work, only refusing to give up mind-reading. It's not good to overwork yourself y'know.",
			"I can see why the pets admire Miss Satori so much. she's always thinking about her sister and pets despite being burdened by so much work. That warmth under her ice cold exterior truly is something you won't forget.",
		],
		evaluation: {
			bad: 'I seldom get to come here, I am a bit disappointed.',
			exbad: 'Eating this is more stressful than having work pile up.',
			exgood: 'Truly, a magnificent blend of color and flavor!',
			good: "Orin's judgment has always been good.",
			lackmoneyangry:
				'I am very aware of how much your ingredients cost.',
			lackmoneynormal:
				'Apologies, my pockets have been a little light since I gave the pets their pocket money...',
			norm: 'Eating is merely to ensure one has the proper sustenance to survive.',
			repell: 'Did you not say you would prepare a healthy dish for me?',
			seenRepell:
				"One's manners are a mirror which reflect what kind of person they are.",
		},
		name: 'Satori Komeiji',
		spellCards: {
			negative: [
				{
					description:
						'Activates a random Punishment Spell Card from a rare customer that has already been unlocked(excluding Satori herself).',
					name: 'Recollection "Unhappy Memory"',
				},
			],
			positive: [
				{
					description:
						'Activates a random Reward Spell Card from a rare customer that has already been unlocked(excluding Satori herself).',
					name: 'Recollection "Happy Memory"',
				},
			],
		},
	},
	2004: {
		chat: [
			'Knowing Okuu, having to watch the Nuclear Furnace 24/7 is really hard on her.',
			"Today's delivery of vengeful spirits is a bit too much.",
			'Next time invite Lady Satori as well.',
			'Has Lady Satori been eating her three meals on time. . .',
		],
		description: [
			"A type of cat youkai known as the kasha, she's the right-hand of the Palace of the Earth Spirits' mistress. Being able to communicate with corpses and spirits sure sounds convenient! But. . . kasha are known for stealing corpses. That's the reason she's despised right? Well, it's not nice to gossip about other people's interests. . .",
			"When you think about it, when a human has just passed away, wouldn't they be completely at a loss? If they could meet the cheerful and talkative Orin during their journey to the other side, maybe it'd mitigate some of the fears brought by death.",
			'The "black cat of bad omens" who lived in prejudice, so she had to go through such hardships. Prejudice really is awful. Good thing Orin met Miss Satori. Having a good owner can really change a pet\'s life. I wish Orin can continue living a carefree life of stealing corpses~',
		],
		evaluation: {
			bad: 'Did I make a mistake in my judgment...',
			exbad: "Yuck, it's even worse than rotten meat!",
			exgood: "It's so delicious that I'm sure it'll turn anyone into a glutton!",
			good: 'This is a once in a lifetime dish!',
			lackmoneyangry:
				"Keep forcefully shoving things down my throat and I won't even give you a single penny!",
			lackmoneynormal: "I'm a bit tight on cash lately...",
			norm: 'Can something like this really be considered appetizing...',
			repell: "You're breaking my heart, sis.",
			seenRepell: "You'll suffer losses if you act so conceited.",
		},
		name: 'Rin Kaenbyou',
		spellCards: {
			negative: [
				{
					description:
						"When Orin leaves, a vengeful spirit will be left at her table which will continue to place orders based on Orin's preferences. Vengeful spirits cannot be kicked out, nor will they pay. They will only disappear once satisfied like a normal guest.",
					name: 'Rekindling of Dead Ashes',
				},
			],
			positive: [
				{
					description:
						'For the next 30 seconds, serving beverages tagged with "Mid Alcohol" will result in the best rating.',
					name: 'Cat Sign "Cat\'s Walk"',
				},
			],
		},
	},
	2005: {
		chat: [
			'Waiting for food is the fun part~',
			'Eating the food is the best part~',
			'Rain wets the earth, food fills my stomach.',
			"If you can't use your brain, use your stomach.",
		],
		description: [
			'The hell raven guarding the Remains of Blazing Hell, with an enthusiasm that burns like the flames of Hell. She looks a bit different from other hell ravens, the only thing that makes me feel close to her is our empty heads.',
			"So the reason why Okuu appears so out of place is because her body houses the divine spirit Yatagarasu! The raven born from Hell's darkness and the divine spirit perched upon the sun, what an amazing combination! But. . . is it really okay for someone like her to have such immense power?",
			"Recently, I suddenly felt there isn't anyone more suitable than Okuu to possess this power. For her to have such immense power but not the brains required to use it, we can consider that a lucky break right? The empty-headed Okuu is really cute! I often get called empty-headed too though~",
		],
		evaluation: {
			bad: 'Needs some more heat.',
			exbad: "Would've been better grilled in the Hell of Blazing Fires.",
			exgood: "I've felt something hotter than the Hell of Blazing Fires!",
			good: 'This meal is HOT!',
			lackmoneyangry:
				"I'll just say I forgot the cash... I'm a bird-brain after all.",
			lackmoneynormal: 'A bird-brain can only store so much money.',
			norm: 'Thanks for the meal, proprietress~',
			repell: "Careful or I'll roast you!",
			seenRepell: 'Why are you chasing people away...',
		},
		name: 'Utsuho Reiuji',
		spellCards: {
			negative: [
				{
					description:
						'A nuclear explosion will occur the next time you fail to sing a perfect Sparrow Tune, disabling the kitchenware for the night. The explosion will also cause a portion of queueing customers to run for their lives.',
					name: 'Hell\'s Light "Diffuse Hellfire"',
				},
			],
			positive: [
				{
					description:
						'For the next 60 seconds, nuclear power overloads the boiling pot and steamer, allowing them to cook dishes instantly.',
					name: "Hell's Tokamak",
				},
			],
		},
	},
	2006: {
		chat: [
			'Sweet food, sweet dreams~',
			"I won't feel empty if my stomach is full!",
			"The bizarre judge was so cool——wait! That's me!",
			'Waiting, waiting——waiting for what I wonder——',
		],
		description: [
			"The little sister of the palace's mistress, a satori who closed her third eye! Her existence is thin due to her closed heart. Her mysterious figure has allowed her to garner many followers. She's always got a bright smile, but no one knows exactly what's on her mind. Not even herself.",
			null,
			null,
		],
		evaluation: {
			bad: "I'm starving yet I don't feel like eating.",
			exbad: 'A tiny sparrow will definitely look nice when hung in my house~',
			exgood: 'Such a nice sparrow will definitely look nice when hung in my house!',
			good: "Big sis says I'm full if my stomach makes funny noises!",
			lackmoneyangry: 'Why does eating cost money?',
			lackmoneynormal: 'I brought some cash with me, you can have it~',
			norm: "I'm full——",
			repell: 'Huh? What? Did you not see me?',
			seenRepell: 'Koishi loves having company!',
		},
		name: 'Koishi Komeiji',
		spellCards: {
			negative: [
				{
					description:
						'For the next 60 seconds, Koishi will hide all normal customer orders. Orders will have to be completed via checking the notebook.',
					name: 'Selfish Extreme Unconsciousness',
				},
			],
			positive: [
				{
					description:
						'For the next 60 seconds, ordering, eating, partner actions and everything else with a cooldown will have no cooldown. Everything happens unconsciously, achieving the maximum speed possible.',
					name: 'Carefree Extreme Unconsciouness',
				},
			],
		},
	},
	3000: {
		chat: [
			"I'm back! Are you shaking in fear?",
			"This place is so lively now! I'm so happy!",
			"Searching. . . target acquired! I'll scare their socks off later!",
			'Another day of not scaring anyone. . .',
		],
		description: [
			'A spirit bound to an oil-paper umbrella. She became a tsukumogami one day due to no one using her. Scaring someone she comes across is enough to make her feel over the moon.',
			"She sure is one annoying umbrella! I thought she was a cheery sort of youkai, not a crybaby. . . These sorts of people drive me to my wits' end! Good thing she recovers remarkably fast!",
			"She might show her more depressing side at times, but she's still a honest and hardworking youkai at heart. Despite always facing obstacles, she still continues to work hard in a variety of elaborate ways. I wish I had that strength too!",
		],
		evaluation: {
			bad: 'Brings no surprise at all.',
			exbad: "I'm surprised it's this bad.",
			exgood: 'Woah! Consider me surprised!',
			good: "I'm surprised it's this good!",
			lackmoneyangry: 'My pockets are empty! Surprised!?',
			lackmoneynormal: 'This was all given to me by the kids. . .',
			norm: 'Pretty good. Could do with some more surprise though.',
			repell: '*sniff*. . . I really am worthless. . .',
			seenRepell: 'I understand how it feels to be discarded like that.',
		},
		name: 'Kogasa Tatara',
		spellCards: {
			negative: [
				{
					description:
						"An enlarged version of Kogasa's umbrella appears in the waiting area, scaring away every normal queueing customer.",
					name: 'Jumbo Phantom Umbrella',
				},
			],
			positive: [
				{
					description:
						'For the next 30 seconds, dishes with the "Strange" tag cook 30% faster and provide an addition 30% chance for customers to order again.',
					name: 'Rain Sign "A Rainy Night\'s Ghost Story"',
				},
			],
		},
	},
	3001: {
		chat: [
			"Did that unlucky shinigami find out her boat's leaking?",
			"Everyone's so reserved during the day. Making some noise at night is fine, right?",
			'I envy those who can live in the moment all the time too. . .',
			"I have to send that person to Makai once I'm done eating. . .",
		],
		description: [
			"Letting a youkai who only thinks about sinking ships be the captain of the Palanquin Ship. . . I don't understand Myouren Temple at all. With her ability to cause accidents in any body of water, I'll have to keep an eye out for any puddles in my kitchen!",
			"She's been a disciple for thousands of years, yet she doesn't act like one at all. She's so used to messing around, she continues to play pranks behind the head priestess's back to this day. Although she definitely won't do anything that harms Myouren Temple.",
			"The free and easygoing captain who was willing to become a disciple of Buddhism and be restrained (not really) by it, all to repay kindness from a thousand years ago. Don't judge a book by its cover, they say. Miss Murasa truly has a loyal heart of gold.",
		],
		evaluation: {
			bad: "It's about the same as the ship's emergency rations.",
			exbad: "It's worse than the ship's emergency rations!",
			exgood: 'Your dishes shine as bright as the Palanquin Ship itself!',
			good: 'Not bad! I could use a chef like you on my crew.',
			lackmoneyangry: 'Money weighs too much for my ship to carry.',
			lackmoneynormal:
				'The cost of living on land is a lot more than living on the sea.',
			norm: "I'm not particular picky about my food.",
			repell: "I swear I'll toss you off my ship!",
			seenRepell: 'What a shame. I came here to enjoy a crowd.',
		},
		name: 'Minamitsu Murasa',
		spellCards: {
			negative: [
				{
					description:
						'A vortex spins beneath you, causing you to faint. Unable to move for 5 seconds (speed up by moving). Then movement is reversed for the next 20 seconds.',
					name: 'Drowning Sign "Deep Vortex"',
				},
			],
			positive: [
				{
					description:
						"Gain the Ship Phantom Possession for 15 seconds. Reward spell cards gained while this buff is active (excluding this spell card) have their duration increased. The length of this extension is equal to this spell card's remaining duration when a new spell card is gained.",
					name: 'Lingering Phantom of the Ship',
				},
			],
		},
	},
	3002: {
		chat: [
			'Ever heard of the izakaya urban legend?',
			'Are humans these days all idiots?',
			'Food is best enjoyed alone.',
			"I found a place I belong to after so long. I'm never leaving it.",
		],
		description: [
			"An ancient and unidentified youkai—the Nue. It's a shame she doesn't look like the one depicted in the legends. . . She's a disciple of Myouren Temple too, but I always see her wandering near the temple all alone. It seems like she doesn't get on well with others.",
			"She's just like a neglected child who tries to get everyone's attention with pranks. She wants to fit in with the temple, yet fumbles in expressing it properly. . . For someone who's been alive for so long, she sure is easy to understand.",
			'The more you worry, the more likely you are to get cold feet. . . in the end her heart is just an unidentifiable as her form. Is this the loneliness of an "unknown object"? But since she\'s already shown her true form, I\'m sure everyone will slowly understand how honest she is!',
		],
		evaluation: {
			bad: 'So and so.',
			exbad: "This isn't worth showing my true form.",
			exgood: 'Stuff like this is why I show my true form!',
			good: 'Is this the true form of good food!?',
			lackmoneyangry: 'Even bandits from the Heian era asked for less!',
			lackmoneynormal:
				"I've almost burned through all my savings from the Heian era. . .",
			norm: "You still haven't figured out the true form of good food.",
			repell: "I'm used to being alone anyhow.",
			seenRepell: 'I came here to be with the crowd.',
		},
		name: 'Nue Houjuu',
		spellCards: {
			negative: [
				{
					description:
						'Spin the wheel with a guaranteed miss, the result will be one of the following: RRG: for the next 15 seconds, the lowest rating will be given regardless of dish served; GGX: for the next 15 seconds, 3x the amount of ingredients and beverages will be expended; BBX: for the next 15 seconds, income is decreased by 66%; RRB: gain all three debuffs at once.',
					name: 'Disgust "Touhou RRB"',
				},
			],
			positive: [
				{
					description:
						'Spin the UFO wheel with a guaranteed prize, the result will be one of the following: RRR: for the next 15 seconds, the highest rating will be given regardless of dish served; GGG: for the next 15 seconds, ingredients and beverages will not be expended; BBB: for the next 15 seconds, income is increased by 100%; RGB: gain all three buffs at once.',
					name: 'Delight "Touhou RGB"',
				},
			],
		},
	},
	3003: {
		chat: [
			'These ordinary pots and pans art the footsteps of humanity.',
			"If I couldst break this plate, I'm sure business will boom in thine izakaya.",
			'Dost thou hath enough flames in the back? Shall I stoke it?',
			'The life of a chef accompanied by flames may very well suit me. . .',
		],
		description: [
			"A person from ancient times who went to sleep by cursing herself for long periods of time. Probably because of napping for too long, her thoughts are still the same as back then, completely different from a normal person's. . . She's currently working hard to learn modern knowledge, but it just resulted it her being even more out of place.",
			"Putting her outdated style aside, she actually fits the personality of a hermit pretty well, especially with her deep understanding of feng shui. I don't really get it though. . . maybe next time I renovate my shop I can have her take a look at it.",
			"If she can't leave the past behind, doesn't that mean she still misses the past? Even so, Miss Futo still decided to become a shikaisen as a test subject. I won't ever understand the loyalty of humans, but I do respect it a lot!",
		],
		evaluation: {
			bad: "I suppose tis' a hard pass.",
			exbad: "If thou can't grasp the grill, allow me to burn it down for thee!",
			exgood: 'Not even the state banquet can compare to this!',
			good: 'Mine desire for food hast been awoken!',
			lackmoneyangry:
				'Even the national treasury may not be enough for thine shop.',
			lackmoneynormal:
				'I almost hadst to eat without paying in front of so many people!',
			norm: 'Many thanks.',
			repell: 'A knave hast no morals and ignores the crux of the matter!',
			seenRepell: 'Manners maketh man.',
		},
		name: 'Mononobe no Futo',
		spellCards: {
			negative: [
				{
					description:
						'For 30 seconds after the spell card is declared, only one tray may be used to serve customers. Items remaining in the disabled tray will be burned.',
					name: 'Torch Passing "Tray Basked in Flames"',
				},
			],
			positive: [
				{
					description:
						'For 10 seconds after the spell card is declared, gain a beverage depending on the customer\'s rating. "Regular" ratings give level 1 beverages. "Satisfied" ratings give level 2 beverages. "Perfect" ratings give level 3 bevarages.',
					name: 'Saint Girl "Sun Goddess\'s Sacrifice"',
				},
			],
		},
	},
	3004: {
		chat: [
			"You're standing too close to the flames, little sparrow. . .",
			'Thanks for taking care of my cute subordinates~',
			'Food is food, regardless of when and where.',
			"Many youkai wish to eat hermits, but this is the first time I've seen one cooking for them.",
		],
		description: [
			"I'd often see her wandering around the temple playing, seemingly not very excited about the idea of training. . . but she really likes to advertise the benefits of Taoism to other people. I don't get what's on her mind. She's a hermit who looks prim and proper, but acts and thinks in a completely different way.",
			"When she wants to do something, she'll do it regardless of the consequences. Even if her actions aren't understood by anyone, she still acts like it's all a matter of fact. Rather than being controlled by her desires, I think it's the exact opposite. . . all the things she did, rather than out of desire, that's just the kind of person she is.",
			"A wicked hermit doesn't mean an evil hermit. Denied by Heaven just for thinking and acting in a different way is something I truly find incomprehensible. . . I just know Miss Seiga has a very strong personality! If becoming a celestial means getting rid of your personality, then I hope Miss Seiga continues to stay the way she is.",
		],
		evaluation: {
			bad: 'Was my judgement wrong?',
			exbad: "I'd never eat this if it weren't for my obsession!",
			exgood: "You can only taste food this good if you're alive~",
			good: 'Fasting with good food in front of you would be way too insensitive~',
			lackmoneyangry: 'Do I look like someone who smells of money?',
			lackmoneynormal:
				'The little sparrow sure knows how to squeeze her customers~',
			norm: 'You need to put in some more effort~',
			repell: 'Think before you act. . .',
			seenRepell: 'Was my judgement wrong?',
		},
		name: 'Seiga Kaku',
		spellCards: {
			negative: [
				{
					description:
						'For the next 30 seconds, rare customers are demonified. Every payment they make, regardless of rating, has a 30% chance to unleash a punishment spell card. If they were originally going to unleash one, they unleash it an additional time.',
					name: 'Demonify "Zouhuo Rumo"',
				},
			],
			positive: [
				{
					description:
						'For 30 seconds, partners can move through customers or obstacles within the izakaya.',
					name: 'Wicked Arts "No Walls Beneath Heaven"',
				},
			],
		},
	},
	3005: {
		chat: [
			'Three meals is good, four meals is bliss.',
			'Food and scenery can deter all the bleakness of the world.',
			"You don't need to worry about anything when you're dead.",
			"What's life without a glass of sake?!",
		],
		description: [
			"A vengeful spirit from ancient times. It seems like she used to harbor a deep grudge, so in essence she's one of the vengeful spirits we youkai fear so much. I'm not brave enough to get too close to her. . .",
			"After getting to know her, I find Miss Tojiko truly is a practical and open-minded person, and she's full of energy too. How unlike a vengeful spirit. I guess it's because most of her hatred has already disappeared? Whatever turned the open-minded Miss Tojiko into a vengeful spirit must have cut very, very deep. . .",
			"No way! Never in a million years would I have thought the person who caused Miss Tojiko to turn into a vengeful spirit would be Miss Futo! But it looks like they're still on very good terms!? Miss Tojiko isn't just open-minded, she could already be called a saint.",
		],
		evaluation: {
			bad: 'I could cook something better with my eyes closed.',
			exbad: 'Are you using junk to mess with me!?',
			exgood: 'I could wait for another thousand years if I had food this good!',
			good: 'This taste is more memorable than a grudge.',
			lackmoneyangry:
				'What! This meal is worth all the money the crown prince gave me!?',
			lackmoneynormal: 'My money and my hatred are both nearly gone.',
			norm: 'Better than nothing.',
			repell: "Aren't you afraid I'll harbor a grudge?",
			seenRepell: "You're a bit too petty, sparrow. . .",
		},
		name: 'Soga no Tojiko',
		spellCards: {
			negative: [
				{
					description:
						'The next time you fail to sing perfectly, heavenly thunder will strike and stun a partner for 30 seconds.',
					name: 'Retribution "Heavenly Thunder Strike"',
				},
			],
			positive: [
				{
					description:
						"Boosted my lightning, you and all your partners' movement speeds are increased by 30%!",
					name: 'Thunder\'s Shadow "Lighting Speed"',
				},
			],
		},
	},
	3009: {
		chat: [
			"You'd never believe how convenient leaves disguised as money is~",
			'This mix of modern and traditional is much to my liking.',
			"This bag of bones ain't old at all~",
			"Over there. . . hohoho, such a paltry disguise won't fool this tanuki.",
		],
		description: [
			"Leader of the tanukis, the feeling she gives off matches that of her status. She has the ability to shapeshift, but no matter how good you are at it, completely hiding your tail and ears is impossible. Her tail's size also a measure of her spiritual powers, so perhaps she never intended on hiding it in the first place.",
			null,
			null,
		],
		evaluation: {
			bad: "A bit disappointin'. . .",
			exbad: 'Oh, you wanna play? Let me show you what a real prank looks like!',
			exgood: "A meal worthy of a tanuki's favor!",
			good: 'Hohoho—as expected of the youkai I put my hopes on!',
			lackmoneyangry: "Be thankful I ain't paying you with leaves!!!",
			lackmoneynormal:
				'I have a lotta leaves, but this is all the cash I have.',
			norm: 'Is that all?',
			repell: 'Have youkai forgotten how to respect their elders?',
			seenRepell: "Drinkin' with the tanuki would be more interstin'~",
		},
		name: 'Mamizou Futatsuiwa',
		spellCards: {
			negative: [
				{
					description:
						"For the next 30 seconds, all the money you receive become leaves. You'll only discover them when totaling the day's earnings. All money earned within this period of time does not count as income. Paying with leaves is outrageous!",
					name: 'Best Way to Punish an Immoral Shopkeeper',
				},
			],
			positive: [
				{
					description:
						'Summons tanukis to shapeshift into all currently seated customers (excluding Mamizou) and rejoin the queue. Shapeshifted customers have the same preferences and budget as the person they resemble, but rare shapeshifted customers can only unleash their respective spell cards once.',
					name: 'Cardcaptor Tanuki of Ten Transformations',
				},
			],
		},
	},
	4000: {
		chat: [
			"Today's materials are a bust too. . .",
			'The crowd is where information is.',
			'A balanced work-life is the key to living longer. ~',
			"News, like dishes, require additional flourishes to make 'em kick.~",
		],
		description: [
			"Crow tengu who flies all over Gensokyo collecting material to turn into news. Also the author of the well known Bunbunmaru Newspaper. Well known not because the newspaper is particularly great, but because there's too many copies flying around.",
			"She's strong enough on her own, and with a weapon as powerful as news on her side, it's no wonder Gensokyo doesn't treat Miss Aya very well. But, I find her resolve to never give up no matter how hard it gets tends to rub off on others too. If only her articles had a bit more substance to them.",
			"Newspapers really are something to admire! Miss Aya's articles are the records of Gensokyo's past. She may have gotten a bit lost on the way. . . but there are still memories worth remembering! I hope Miss Aya can find a style of news that suits her.",
		],
		evaluation: {
			bad: 'Hey, you sure this is how you wanna do things. . .',
			exbad: 'This is awful enough to make headlines!',
			exgood: 'This dish would definitely make headlines!',
			good: 'Now this has potential to become a hot topic.',
			lackmoneyangry:
				"Be grateful I haven't written an article about these prices!",
			lackmoneynormal:
				"This is what I get for publishing so many newspapers. Almost couldn't afford a midnight snack.",
			norm: "As news it probably wouldn't turn a lot of heads~",
			repell: 'Hello!? What if I write an article about this?',
			seenRepell:
				"How am I supposed to gather information when you've kicked out all the customers?",
		},
		name: 'Aya Shameimaru',
		spellCards: {
			negative: [
				{
					description:
						'Kick off a tornado which attacks the izakaya. Toss-serving is disabled for the next 30 seconds. Also criticize the izakaya on the Bunbunmaru Newspaper, causing the famous shop bonus to disappear tomorrow.',
					name: 'Forbidden Technique of the Pen',
				},
			],
			positive: [
				{
					description:
						'Word of the shop spreads through the news. The izakaya will become a famous shop tomorrow. Returns to normal in 3 days. Famous Shop: increase guest budget by 10% and guest traffic by 5%, "signature" will become a trending tag. If the izakaya is already a famous shop, or word had already spread that night, then this spell card turns into "Peerless Chef of the Izakaya" All dishes with the "signature" tag on today\'s menu will become famous dishes. When cooking a famous dish, finish it instantly if cook time is less than 5 second(s); Guests who like the tag have an additional 30% chance to make follow-up orders when consuming a famous dish, regain budget equivalent to the drink in their order, and have a 100% chance to increase their follow-up order limit by 1. Lasts 30 seconds.',
					name: 'Crossroads of Trends Taking Gensokyo by Storm',
				},
			],
		},
	},
	4001: {
		chat: [
			'Loneliness is both poison and medicine.',
			'Poison in minute doses is medicine.',
			'Alcohol can be poison too if you overconsume it.',
			'If only sunflowers were poisonous too.',
		],
		description: [
			"A tsukumogami living in the meadow of highly poisonous lilies-of-the-valley. She was only born recently so she's seriously lacking in experience and knowledge, nor does she know how to get along with others. In the vast meadow, one could often see her talking to herself—or even dancing—a cuteness wrapped in strangeness. . . Although she's very blunt personality-wise.",
			"She's become a youkai, but her body seems to still be that of a doll's, so she's fine even if her body is filled to the brim with poison. Not very fond of humans; in the past she'd even control humans by putting poison in their food. . . Due to her age, she doesn't know how to hold herself back, so caution must be taken before she becomes more mature!",
			"Who would've thought that a poison doll would actually be a simple young girl? If you teach her something, she'll commit that something to memory. I never knew this is how it feels to see a newborn youkai slowly growing up! I'm pretty young myself, so it's not often I get to be the older youkai. Now all I want is to keep her safe and sound and let her grow up happily. . . Though I'm probably not as powerful as her.",
		],
		evaluation: {
			bad: "Lily doesn't like this flavor very much.",
			exbad: "Lily's poison is so much better!",
			exgood: 'The only other thing that makes me this satisfied is poison!',
			good: 'Me and Lily give you the thumbs up!',
			lackmoneyangry: 'Lily says you have no morals!',
			lackmoneynormal:
				'There goes most of the money Lily and I have been saving up. . .',
			norm: "These dishes aren't really much compared to poison.",
			repell: "I'm going to make these hands that kick me out rot away!!",
			seenRepell: "Lily says she's suddenly not feeling it anymore.",
		},
		name: 'Medicine Melancholy',
		spellCards: {
			negative: [
				{
					description:
						'Removes the Toxin Neutralization status effect; The melancholic poison tag is added when cooking dishes. Guests who consume this tag will not make follow-up orders. Lasts 30 seconds.',
					name: 'Convalla "Withering garden"',
				},
			],
			positive: [
				{
					description:
						'Removes the Withering garden status effect; Medicine manipulates all the possibly harmful substances in a dish, making tags not conflict with each other while cooking. Lasts for 30 seconds and immediately gives a drink with the "mid alcohol" tag',
					name: 'Analysis "Toxin Neutralization"',
				},
			],
		},
	},
	4002: {
		chat: [
			"I'm not interested in boring fights.",
			'The flowers look rather happy too.',
			"This is the first time we've had such an atmosphere.",
			'Flowers are all the company I need.',
		],
		description: [
			'She looks like an elegant and refined lady, but for some reason, many people see her as the "Tyrant of the Garden". The scary rumors about her are endless, but no one has actually seen her abuse humans or weaker youkai. Just what kind of person is she really, I wonder?',
			"Just one look at the way she takes care of the flowers and all those rumors about her fall apart in an instant. Though, I don't understand why someone with as much power as her would allow those rumors to spread. Why suffer those harmful remarks in silence?",
			"I couldn't have been more wrong! She never \"suffered\" those rumors, because she never cared in the first place, so even clearing the rumors would be superfluous. The strongest aspect of Miss Yuuka is her heart. I think, it's not her powerful strength that lets her disregard others, it's her pure and clean sense of self which makes her indomitable.",
		],
		evaluation: {
			bad: 'With such treatment, even the most friendly of flowers will refuse to bloom.',
			exbad: 'Hmph! I accept your challenge!',
			exgood: 'You have the ability to make any flower bloom!',
			good: 'I feel like a flower bud, slowly opening up.',
			lackmoneyangry:
				'You should be thankful your shop is still in one piece.',
			lackmoneynormal:
				"Skyrocketing your prices won't make for a successful business.",
			norm: "This won't earn you the favor of the flowers.",
			repell: '. . .',
			seenRepell: '. . .',
		},
		name: 'Yuuka Kazami',
		spellCards: {
			negative: [
				{
					description:
						'With a gentle smile, Yuuka walks to the topmost position of where she was seated and blows up every table in this column with a magical blast. These tables cannot be repaired for that night. All guests seated at these tables will be scared away.',
					name: 'FINAL SPARK!!!',
				},
			],
			positive: [
				{
					description:
						'Yuuka plants a flower on the field and uses her ability to make it grow. Plant an additional flower when her mood reaches maximum. Each flower produces 25 in tips every 24 seconds. When a rare guest aside from Yuuka activates a reward spell card, a random flower will absorb the power of this spell card and bloom, attracting rare guests that appear in the area to pay the izakaya a visit. Rare guests attracted by a flower will pick the flower. While a flower is in bloom, guests gain an additional 15 mood after eating. The flower will wither after 15 seconds and be converted into 1 Cloth of Fallen Petals : Able to nullify combo-ending mistakes.',
					name: 'Fragrant Beauties of Nature',
				},
			],
		},
	},
	4003: {
		chat: [
			'A half-hearted revolution will never succeed.',
			'Join me, weak youkai! We shall rise together!',
			"I'll have you under my banner one day.",
			'You\'ll only "miss the taste of home" if you\'re soft!',
		],
		description: [
			'Amanojaku with a silver tongue. Lured many young youkai—and even humans—to her cause of "overturning Gensokyo", but due to a lack of funds, she can\'t provide much for them, even having to get the tengu to show ads in their newspaper to scam tourists out of their money. . . Yeah, she\'s a troublemaker no matter how you look at it.',
			"Does Miss Seija truly intend to overthrow the strong and help the weak? I feel like she's not interested in anything that happens after the revolution. Maybe she just takes pleasure in being a menace to society and doesn't want to truly change it.",
			"Seeing your comrades leave one by one, any other person would think their cause is hopeless, but Miss Seija has never once thought of giving up. In a time where everyone leisurely lives a normal everyday life, she's part of the minority that won't rest until they reach their goals. In a sense, I find it pretty admirable. . .",
		],
		evaluation: {
			bad: 'Tastes of the weak.',
			exbad: "I'm going to overturn the world that calls this slop fine dining!",
			exgood: "I'm at max strength! I could overturn anything right now!",
			good: 'I can feel the strength! Is this the power of food?',
			lackmoneyangry: 'Think of these tips as protection money!',
			lackmoneynormal:
				'Getting filthy rich off of an izakaya. Good plan.',
			norm: 'Overturning "ordinary" still gets you "ordinary".',
			repell: "Whose turf do you think you're on!??",
			seenRepell: 'When will the weak stop being oppressed!?',
		},
		name: 'Seija Kijin',
		spellCards: {
			negative: [
				{
					description:
						'Vive la revolution! Seija and the guest with the highest budget present have their budgets reversed, and for the next 15 seconds the budget of all guests (excluding Seija) are lowered to the budget of the guest with the lowest budget present.',
					name: 'Turnabout "Reverse Ideology"',
				},
			],
			positive: [
				{
					description:
						'Using her ability to reverse everything, Seija inverts the preferences of all guests. The disliked tags of all guests (excluding Seija) will become tags that they like. Lasts for 30 seconds. If the total amount of normal guests present, including those in the queue, is not less than 7, this spell card becomes Reverse Bow "Decree of the Dream Bow of Heaven and Earth" All normal guests, including those in the queue, have their follow-up order limit increased by 1 and their budget increased by 25%. Each normal guest can only receive this effect up to 3 times.',
					name: 'Deception Sign "Reverse Psychology"',
				},
			],
		},
	},
	4004: {
		chat: [
			'Is this where all the fun stories are?',
			'Shining Needle Castle has never been this lively before. . .',
			'She comes here often too, right?',
			'Thanks for bringing some life into this lonesome castle.',
		],
		description: [
			"The owner of the castle, an inchling that idolizes Issun-boushi. Reserved and serious, she yearns to one day become a legendary hero. It's kinda refreshing to meet a sheltered damsel who desires adventure. Knowing how to make Japanese confectioneries fits her very well!",
			"She clearly aspires to go on a hero's journey, and she's made many preparations in that regard, yet she still continues to put off her adventure. She's worried about whether or not she'll leave behind a perfect legend. Maybe a bit too much. . .",
			'Miss Shinmyoumaru, letting go of her worries, finally embarks on a journey. Her aspirations are those stories of "heroes saving the world with nothing but courage". From her, I also understood that, caring too much about the result will paralyze you. I think doing what I like suits me the best!',
		],
		evaluation: {
			bad: "Wouldn't even make for good rations on a journey.",
			exbad: 'This dish is so horrid it erodes my courage!',
			exgood: 'This dish gives me the courage to embark on a journey!',
			good: 'Eating this dish felt like reading an adventure story!',
			lackmoneyangry: "I'm broke, despite being a noble. . .",
			lackmoneynormal:
				'Have we been secluded for too long? Things in the world outside are so expensive now?',
			norm: 'I guess you could use this as rations for a journey.',
			repell: 'You dare kick out a future hero!?',
			seenRepell: "As a hero, I can't allow such things to happen.",
		},
		name: 'Shinmyoumaru Sukuna',
		spellCards: {
			negative: [
				{
					description:
						'Under the effects of the Miracle Mallet, your body is enlarged to three times its original size. Lasts for 30 seconds.',
					name: 'Mini-Mallet "You Grow Big!"',
				},
			],
			positive: [
				{
					description:
						"Whack the cash register with the Miracle Mallet, adding 1 Miracle Mallet's Power to the stack. The charged power of the Miracle Mallet will inflate the revenue when business ends. The 1st stack of Miracle Mallet's Power increases revenue by 7%. Subsequent stacks increase revenue by 2%.",
					name: 'Precious Mallet "Inflation Crisis"',
				},
			],
		},
	},
	4005: {
		chat: [
			"Sleeping late isn't good for the skin. . .",
			"Going on a diet definitely isn't the way to beauty.",
			'It feels so hot even at night. . .',
			"Maybe it's time I trim my hair. . .",
			'Thank you for the hard work~',
		],
		description: [
			"An earnest and gentle werewolf. The vibe she gives off is that of a friendly neighbor's. Maybe it's because there's lunarians living in the bamboo forest, but there seems to be a lot of youkai related to the moon in there. Miss Kagerou is one of them.",
			"Miss Kagerou seems to mind her skin a lot. This is the first time I've seen a werewolf who cares so much about looking beautiful. The grassroots youkai network sure is a peaceful and bustling place. Sometimes, I wonder. . . If I hadn't opened a shop, this is probably how my life would be like.",
			'Miss Kagerou is part of the Honshu wolf species that is extinct in the Outside World. Worshiped, revered, and finally driven to extinction. How sad. The humans and youkai of Gensokyo need to care more for us beasts (and birds)!',
		],
		evaluation: {
			bad: 'Seems your cooking is on the rocks too.',
			exbad: "I can't feel any kindness from this dish.",
			exgood: 'True bliss is eating the dishes you cook!',
			good: 'I can taste the kindness from this dish!',
			lackmoneyangry:
				"If only I had a penny for every piece of fur I've shed.",
			lackmoneynormal:
				'It really is easy to eat too many midnight snacks. . .',
			norm: 'I expected better from you.',
			repell: 'Grassroots youkai have dignity too!',
			seenRepell: "Why can't we just get along?",
		},
		name: 'Kagerou Imaizumi',
		spellCards: {
			negative: [
				{
					description:
						'For the next 30 seconds, if the "filling" tag isn\'t added to a dish, the lowest rating will be given. Guests that had already disliked this tag will give the lowest rating regardless.',
					name: 'Hungry Wolf "Grand Moonlit Feast"',
				},
			],
			positive: [
				{
					description:
						'Awaken the wild nature of all guests, making them love the "meat" and "mountain delicacy" tag for the next 30 seconds. They will use their own preferences when giving ratings. Guests that had already liked these tags will give the highest rating.',
					name: 'Wolf Soul "Wild Awakening"',
				},
			],
		},
	},
	4008: {
		chat: [
			'I swear Flan has limitless energy. . .',
			"I'll take some back for Flan to try later.",
			'Maybe the fate of this shop has already changed without anyone knowing.',
			'A long ways off compared to my maid.',
		],
		description: [
			"Mistress of the Scarlet Devil Mansion. I thought she was a child at first glance, but I could hardly form a sentence with that oppressive aura she gives off. Yup, she's the real deal—a true vampire lord! It is hard to not see her as a child when she starts throwing tantrums though. . . She's not very mature yet, but she carries the fate of so many people on her back. Despite her tiny shoulders, she shelters her entire family under her own wings. It really is like she's the head of the household. Miss Remilia isn't as self-centered as most people make her out to be.",
			'Desc',
			'Desc',
		],
		evaluation: {
			bad: "I wasn't expecting much from you in the first place.",
			exbad: 'Is serving me this your way of asking to be impaled by a divine spear?',
			exgood: 'Now this is a taste which befits a noble vampire!',
			good: "You've done well this time. Maybe I can expect from you something after all.",
			lackmoneyangry: 'Sakuya only gave me this much money!',
			lackmoneynormal: "I'm not used to spending money on my own. . .",
			norm: 'Pales in comparison to what my maid makes.',
			repell: 'Hmph. Maybe I ought to put you in your place. . .',
			seenRepell: 'Maybe I should go back and have Sakuya cook.',
		},
		name: 'Remilia Scarlet',
		spellCards: {
			negative: [
				{
					description:
						'Remilia puts her might on display, releasing bloody mist which covers the orders panel on the bottom-left. Lasts for 60 seconds.',
					name: 'Night Sign "Advent of Second Scarlet Mist"',
				},
			],
			positive: [
				{
					description:
						'Remilia uses her reputation as the mistress of the Scarlet Devil Mansion to hold a midnight feast. When the day ends, the izakaya enters "Red, the Nightless Castle" status (immediately takes effect if day has already ended) and business continues. "Red, the Nightless Castle": Budget of normal guests will not be less than 500; Working speed of partners increased by 100%. If Sakuya is on-duty, her speed is raised to the max; Chance of follow-up orders increased by 100%; If Remilia herself is present at the time of activation, the shop will not close for the next 60 seconds. Instead, normal guests will continue to appear at 300% speed. Otherwise, when the last rare guest leaves, summon fairy maids equivalent to amount of reward spell cards activated that night.',
					name: 'Scarlet Sign "Red, the Nightless Castle"',
				},
			],
		},
	},
	5000: {
		chat: [
			'Another exhausting day. . .',
			'The busy day is finally over!',
			"Now's the time to reward myself!",
			'My muscles hurt. . .',
		],
		description: [
			"The lunar emissary who has the same name as Miss Reisen from Eientei. She treats me kindly seemingly because I'm from Earth, which she occasionally shows a longing for. Maybe there's a story behind it. . . Or maybe it's just because lunar emissary training is too hard.",
			"Turns out Reisen was once a medicine-pounding rabbit who fled to Gensokyo because she grew tired of the endless medicine pounding. One thing lead to another, and she became a lunar emissary. So, it's no wonder she shows a fondness for Earth. Although, she doesn't seem to like her job as a Lunar Emissary, either. She doesn't have it easy no matter where she goes, huh. . .",
			"What is it like to constantly live in regret? If time could be turned back, would she not have fled from her medicine-pounding job? Would she be happier that way? These are questions I couldn't bring myself to ask her. . . But, rather than dwelling on the past, it's better to look towards the future, right? I hope one day she can truly be free.",
		],
		evaluation: {
			bad: 'There goes another day down the drain. . .',
			exbad: 'What a terrible day. . .',
			exgood: 'THIS IS MY SAVIOR!!!',
			good: "Thanks for getting rid of the day's fatigue for me!",
			lackmoneyangry: "Even I'M not worth that much!",
			lackmoneynormal: "That's most of the money from my job. . .",
			norm: "Thank you, I've recovered my strength.",
			repell: 'I guess this is just my fate.',
			seenRepell: "There's unjust treatment everywhere in the world.",
		},
		name: 'Reisen',
		spellCards: {
			negative: [
				{
					description:
						'Reisen shoots a bullet of lunacy, continuously affecting guests present for the next 30 seconds. Guests affected by lunacy will give the worst rating if they\'re served with drinks without the "High Alcohol" tag. Note: Lunacy will interfere with lunacy. . . What does that mean?',
					name: 'Drunken Stupor',
				},
			],
			positive: [
				{
					description:
						'Call together a grand bonfire feast. Every existing rabbit will generate 1 random ingredient or 1 random drink. New rabbits that appear for the next 30 seconds will also generate an ingredient or drink. The chance for an ingredients is 80%; the chance for a drink is 20%.',
					name: "Moon Rabbits' Bonfire Feast",
				},
			],
		},
	},
	5001: {
		chat: [
			'I should eat something other than peaches every so often.',
			"I'll eat what I want, live how I want.",
			"Today's fifth meal, down the hatch!",
			'Bite off more than you can chew? Just chew faster.',
		],
		description: [
			"The older sister of the Watatsuki family. Kind and gentle with an occasional childish side. She's very popular with the moon rabbits as she rarely participates in their training, except for the occasions when she brings them snacks.",
			'Miss Toyohime really, REALLY loves peaches. She also really, REALLY loves doing nothing. Can someone as powerful as her really be free of worries like this? Being able to go around with no responsibility no matter the circumstance can be considered a kind of ability too, right?',
			"So Miss Toyohime also has something she wants to accomplish. When did the idea of retiring first come to her? Perhaps from the very beginning, she was just forced to inherit the position of the lunar emissaries' leader. The fact she hasn't retired yet is because there aren't any suitable successors, and because. . . she still has Miss Yorihime to worry about, doesn't she?",
		],
		evaluation: {
			bad: 'Peaches are better.',
			exbad: "If only so the food doesn't have to go to waste. . .",
			exgood: 'Delicious enough for me to call this my new home!',
			good: 'Delicious! I want to eat more and more!',
			lackmoneyangry: 'I already left a peach for you, no?',
			lackmoneynormal: "You'll lose credit if you're too stingy, y'know.",
			norm: 'Not wasting food is my baseline.',
			repell: 'How could you, little sparrow!',
			seenRepell: 'No bullying others, little sparrow.',
		},
		name: 'Watatsuki no Toyohime',
		spellCards: {
			negative: [
				{
					description:
						'Toyohime randomly chooses 3 local and invited rare guests who have yet to show up to be "spirited away", disallowing them from visiting the izakaya tonight.',
					name: 'New Moon "Unshaped Universe"',
				},
			],
			positive: [
				{
					description:
						'Toyohime links the sea and mountains, connecting with a location in Gensokyo, allowing the location\'s normal guests and rare guests to visit by going across the "plane". Guest traffic of the location connected by Toyohime\'s ability will be 33% of original guest traffic.',
					name: 'Radius "Intertwining Mountain and Sea"',
				},
			],
		},
	},
	5002: {
		chat: [
			'Perfect time to meditate.',
			"I should plan out tomorrow's training while waiting for the food.",
			"I'll get in some exercise once I'm finished here.",
			'I never imagined so many people would have a habit of eating after bedtime.',
		],
		description: [
			"The younger sister of the Watatsuki family. Serious and strict, she's responsible for the training of the rabbits in fighting, learning, and etiquette—pretty much everything a leader of lunar emissaries should do. While combat is hardly seen in the Lunar Capital, she still treats training with utmost strictness, and any rabbit caught slacking off will be severely punished.",
			'The rabbits are not very intimate with her because of her overly rigid personality and strict approach to training. Contrary to her easygoing elder sister, Miss Yorihime is always on guard. Maybe smart people are just prone to overthinking…',
			"Miss Yorihime inherited her master's will and wants to contribute to the Lunar Capital, which is why she always has a sense of crisis. The strict training is also in hopes that the rabbits won't die during wartime. Miss Yorihime, who carries everything on her back, is really strong and gentle. . .",
		],
		evaluation: {
			bad: '...40 marks.',
			exbad: '0 marks!',
			exgood: 'This is worth a full mark!',
			good: 'Not bad. It can have 90 marks.',
			lackmoneyangry:
				'I will not allow such insolence in the Lunar Capital!',
			lackmoneynormal: 'This price is. . . Come see me tomorrow.',
			norm: '60 marks.',
			repell: 'Am I to take this as a declaration of war?',
			seenRepell: 'An army must be fair.',
		},
		name: 'Watatsuki no Yorihime',
		spellCards: {
			negative: [
				{
					description:
						'Yorihime invokes a miracle to seal a portion of legends. For the next 30 seconds, dishes with the "legendary" tag or dishes with ingredients that have the "legendary" tag cannot be made.',
					name: 'Commandment "Judgement of the Gods"',
				},
			],
			positive: [
				{
					description:
						'Yorihime summons divine spirits, applying one Divine Laurel; if the dish provided has the "legendary" tag, an additional stack is given. If a rare guest gives a non-perfect rating, consume a stack of "Divine Laurel" to invoke a miracle, raising the rating to perfect.',
					name: 'Divine Edict "Oracle of the Gods"',
				},
			],
		},
	},
	5003: {
		chat: [
			'Make sure you eat more, Sokrates! ♡',
			'A shop like this in Makai is great news! ♡',
			'Is there anything I can do to help?',
			"I'll just sit here patiently, yup!",
		],
		description: [
			"A diligent, hardworking and kind little girl. She runs Fuwa Fuwa Ellen's Magic Shop and keeps a slightly laconic pet cat named Sokrates.",
			"Once Miss Ellen encounters anyone who needs help, she will do her absolute best to assist them, so she's a pretty friendly magician! Miss Ellen also retains considerable enthusiasm for her job, so talking with her makes me feel full of energy myself.",
			"Even though she looks and acts like a very young girl, she's actually a great magician who has already lived for thousands of years. I couldn't tell at all! I've seen no shortage of long-lived youkai myself, but Miss Ellen truly is the first person I've seen who's being able to keep this kindness and romantic innocence throughout all those years!",
		],
		evaluation: {
			bad: 'Um. . . Good effort. . .',
			exbad: 'You ought to put in some more effort. . .',
			exgood: "It's so delicious even Sokrates started sparkling!",
			good: 'Sokrates and I have no complaints!',
			lackmoneyangry: "Sorry, I'll try harder to make money. . .",
			lackmoneynormal: 'I really need to make more money soon. . .',
			norm: 'Thank you for the service!',
			repell: 'Is Sokrates not allowed in here?',
			seenRepell: 'One should treat all guests equally.',
		},
		name: 'Ellen',
		spellCards: {
			negative: [
				{
					description:
						"Sokrates intimidates the izakaya's partners, decreasing their movement speed by 30% and working speed by 50%. Lasts 30 seconds.",
					name: 'The Cat of Ulthar',
				},
			],
			positive: [
				{
					description:
						"For the next 30 seconds, after completing a guest's order with at least a normal rating, a Fuwa Fuwa Candy drops near the seat for pickup.",
					name: 'Candy House of Love',
				},
			],
		},
	},
	5004: {
		chat: [
			'This group of experimental data still needs more verification. . .',
			"Before I knew it, I hadn't eaten for several days.",
			"I'll continue experimenting after eating for a bit.",
			'I should continue my calculations while I wait.',
		],
		description: [
			'A scholar (?) that performs (dangerous?) research by herself in Makai. She calls herself a divine spirit, but everyone treats her like an evil or vengeful spirit. Regardless, her strength and confidence are definitely the real deal. I wonder, what kind of existence is she, exactly?',
			"Shockingly, Miss Mima was born from a magic experiment by the Kirisame family! But even with such origins, Miss Mima with her strong beliefs would never allow anyone to own or control her. Pursuing and discovering truth has always been Miss Mima's lifelong goal—a goal that won't change even if she has to become enemies with the Kirisame family and fight a war lasting more than a hundred years.",
			"So Miss Mima is Miss Marisa's master! I should've thought of it long ago with how much in common they share! Whether it's their persistence and focus in pursuing knowledge, or their sense of morality. . . or never showing their weak and fragile side. . . What sort of past do these two determined loners who look nothing like each other share, I wonder?",
		],
		evaluation: {
			bad: 'As frustrating as watching an amateur doing expert work.',
			exbad: 'As infuriating as frivolously disco dancing on a trove of knowledge.',
			exgood: 'As exhilarating as stumbling across an unsolved mystery!',
			good: 'As exciting as finding the formula and drawing the expected conclusion!',
			lackmoneyangry:
				'Looking down on me, are you? Have you forgotten how to fear me?',
			lackmoneynormal: 'A bit price, but within acceptable margins.',
			norm: 'As boring as a know-nothing flaunting their own knowledge.',
			repell: 'Oh? You dare do this to me? Have you considered the consequences?',
			seenRepell: 'The most efficient method. A fast thinker, I see.',
		},
		name: 'Mima',
		spellCards: {
			negative: [
				{
					description:
						"Sustain Evil Spirit's Grudge: Sparrow Tune effects cannot be obtained and effects from special stations cannot be activated for the next 30 seconds.",
					name: 'The Price of Blasphemy',
				},
			],
			positive: [
				{
					description:
						'If no "Mystic Evil-Sealing Circle" exists in the izakaya, the circle is summoned. If the circle exists, the circle will receive 2 charges of energy. "Mystic Evil-Sealing Circle": Whenever rare guests (excluding Mima) invoke any spell cards, the circle receives 1 charge of energy. When the amount of energy reaches 7, it is consumed, triggering Dream Sign "Planck of Time" All seated guests regain all of their budget, and for the next 20 seconds, cooking dishes will not use ingredients and will be completed instantly. Guests are guaranteed to give the best rating.',
					name: 'Reincarnation of the Underworld',
				},
			],
		},
	},
	5005: {
		chat: [
			'I really want to go to the human world.',
			"The human world has shops like this too, y'know?",
			"Sometimes staying in Makai like this isn't so bad.",
			"It's rare for Makai to have such lively times.",
		],
		description: [
			'A resident of Makai who often sneaks out to travel (work) in the Outside World. Always at her side is a suitcase which can move on its own. Her job consists of sharing her travels on a place called the "blog" which is apparently very popular with humans in the Outside World. How strange. Do humans like watching other people travel that much?',
			'So Miss Louise not only shares her travels, but also her creative designs. Not only is she knowledgeable and filled with many interesting ideas and creativity, she also knows the latest trends, how to give compliments, how to make desserts. . . I really hope I could be as amazing as Miss Louise is someday.',
			"Even someone who wholeheartedly acts only in the interest of humans cannot gain everyone's approval. Understanding others sure is hard, huh. But even so, Miss Louise has no plans of giving up the job she loves so much. I hope she can continue living up to her passion.",
		],
		evaluation: {
			bad: "People won't care about something of this standard even if I do post it onto the blog.",
			exbad: 'People will throws rotten tomatoes if I post this to the blog.',
			exgood: 'I simply MUST recommend this dish on my blog!',
			good: "It's so tasty I want to blog about it!",
			lackmoneyangry: 'Restaurants at tourist hotspots would be cheaper!',
			lackmoneynormal: 'This seems to be higher than the list price. . .',
			norm: 'Not great, but not bad either.',
			repell: 'Attractions that drives its guests away have no future…',
			seenRepell:
				"Attractions don't have the right to treat its guests with arrogance, no matter how renowned it is.",
		},
		name: 'Louise',
		spellCards: {
			negative: [
				{
					description:
						'The shop will close, and guests in the shop will be forcefully kicked out 60 seconds after the day ends.',
					name: 'Abandoned Glass Slipper',
				},
			],
			positive: [
				{
					description:
						'Louise summons a magical camera in the stall. If the rare guest\'s original self left the store unfulfilled and still have budget remaining, the camera takes a photograph of the rare guest and converts it into a copy of "Travel Blog". When the day ends, the "Travel Blog" is released (if the day had already ended when the photograph was taken, it will be released immediately), projecting the guest from the photograph to visit the izakaya again. Projected rare guests can use spell cards and have the same preferences as the original rare guest, but its budget and order limit starts from where the original rare guest left off at.',
					name: 'The Legendary Gulliver',
				},
			],
		},
	},
	5012: {
		chat: [
			"It has been quite some time since I've eaten out. . .",
			'I can take a long nap after this.',
			"You've come a long way. Your contributions are much appreciated.",
			'All of your efforts have not gone unnoticed.',
		],
		description: [
			"One of the sages who created Gensokyo. Words have it that she's Gensokyo's oldest youkai. Despite her elusiveness and slightly unscrupulous personality, she actually maintains the safety and stability of Gensokyo behind the scenes. . . While most don't understand her, in all likelihood there truly is no other who sincerely treats and loves Gensokyo like she does.",
			'DNT',
			'DNT',
		],
		evaluation: {
			bad: 'This thing ought to be thrown into a gap.',
			exbad: "This doesn't even qualify to be inside my gap.",
			exgood: 'Nicely done! You deserve more!',
			good: 'Not bad. Your reputation is deserved.',
			lackmoneyangry:
				"I can't turn a blind eye to such highway robbery in Gensokyo!",
			lackmoneynormal:
				"You're going a bit overboard on the business side, little sparrow.",
			norm: 'It tastes a bit different from what I imagined.',
			repell: 'Should we have a chat inside my gap?',
			seenRepell: 'This is not how I want Gensokyo to be.',
		},
		name: 'Yukari Yakumo',
		spellCards: {
			negative: [
				{
					description:
						'Open several gaps that change their location. Approaching a gap will suck you in and teleport you to another gap, while making drinks on your tray disappear. The gaps last for 30 seconds.',
					name: 'Boundary of Presence and Absence',
				},
			],
			positive: [
				{
					description:
						'When triggered before the end of the day, the duration of all buffs with more than 44 seconds will be frozen and will not decrease until the end of the day. When triggered for the second time or after day ends, the duration of all buffs with more than 44 seconds will be increased by 10% of its current duration (Each type of buff can have their duration increased by this spell card for a maximum of 17 seconds.)',
					name: 'Dream World of Humans and Youkai',
				},
			],
		},
	},
	9000: {
		chat: [],
		description: [null, null, null],
		evaluation: {
			bad: null,
			exbad: null,
			exgood: null,
			good: null,
			lackmoneyangry: null,
			lackmoneynormal: null,
			norm: null,
			repell: null,
			seenRepell: null,
		},
		name: null,
		spellCards: {},
	},
	9001: {
		chat: [],
		description: [null, null, null],
		evaluation: {
			bad: null,
			exbad: null,
			exgood: null,
			good: null,
			lackmoneyangry: null,
			lackmoneynormal: null,
			norm: null,
			repell: null,
			seenRepell: null,
		},
		name: null,
		spellCards: {},
	},
	9002: {
		chat: [],
		description: [null, null, null],
		evaluation: {
			bad: null,
			exbad: null,
			exgood: null,
			good: null,
			lackmoneyangry: null,
			lackmoneynormal: null,
			norm: null,
			repell: null,
			seenRepell: null,
		},
		name: null,
		spellCards: {},
	},
	9003: {
		chat: [],
		description: [null, null, null],
		evaluation: {
			bad: null,
			exbad: null,
			exgood: null,
			good: null,
			lackmoneyangry: null,
			lackmoneynormal: null,
			norm: null,
			repell: null,
			seenRepell: null,
		},
		name: null,
		spellCards: {},
	},
	9004: {
		chat: [],
		description: [null, null, null],
		evaluation: {
			bad: null,
			exbad: null,
			exgood: null,
			good: null,
			lackmoneyangry: null,
			lackmoneynormal: null,
			norm: null,
			repell: null,
			seenRepell: null,
		},
		name: null,
		spellCards: {},
	},
	10000: {
		chat: [],
		description: [null, null, null],
		evaluation: {
			bad: null,
			exbad: null,
			exgood: null,
			good: null,
			lackmoneyangry: null,
			lackmoneynormal: null,
			norm: null,
			repell: null,
			seenRepell: null,
		},
		name: null,
		spellCards: {},
	},
	10001: {
		chat: [],
		description: [null, null, null],
		evaluation: {
			bad: null,
			exbad: null,
			exgood: null,
			good: null,
			lackmoneyangry: null,
			lackmoneynormal: null,
			norm: null,
			repell: null,
			seenRepell: null,
		},
		name: null,
		spellCards: {},
	},
	10002: {
		chat: [],
		description: [null, null, null],
		evaluation: {
			bad: null,
			exbad: null,
			exgood: null,
			good: null,
			lackmoneyangry: null,
			lackmoneynormal: null,
			norm: null,
			repell: null,
			seenRepell: null,
		},
		name: null,
		spellCards: {},
	},
	11000: {
		chat: [],
		description: [null, null, null],
		evaluation: {
			bad: null,
			exbad: null,
			exgood: null,
			good: null,
			lackmoneyangry: null,
			lackmoneynormal: null,
			norm: null,
			repell: null,
			seenRepell: null,
		},
		name: null,
		spellCards: {},
	},
	11001: {
		chat: [],
		description: [null, null, null],
		evaluation: {
			bad: null,
			exbad: null,
			exgood: null,
			good: null,
			lackmoneyangry: null,
			lackmoneynormal: null,
			norm: null,
			repell: null,
			seenRepell: null,
		},
		name: null,
		spellCards: {},
	},
} as const satisfies Readonly<
	Partial<Record<number, ILocalizedSpecialGuestText>>
>;
