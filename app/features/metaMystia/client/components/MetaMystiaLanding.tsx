'use client';

import { faWindows } from '@fortawesome/free-brands-svg-icons';
import {
	faBookOpen,
	faShirt,
	faStar,
	faUserGroup,
	faUtensils,
} from '@fortawesome/free-solid-svg-icons';
import {
	FontAwesomeIcon,
	type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { useMemo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import Card from '@/design/ui/components/card';
import Link from '@/design/ui/components/link';

import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { getSpecialGuestTachiePath } from '@/features/catalog/presentation/tachiePaths';
import Tachie from '@/features/catalog/shared/client/components/Tachie';
import {
	META_MYSTIA_LINKS,
	META_MYSTIA_QQ_GROUP_NUMBER,
	META_MYSTIA_VIDEOS,
} from '@/features/metaMystia/links';

import BilibiliVideo from './BilibiliVideo';

const links = META_MYSTIA_LINKS;

const specialGuest = SpecialGuestCatalog.getInstance();

/** Names of the special guests added by the MetaMystia dataset (DLC 9). */
const META_MYSTIA_GUEST_NAMES = specialGuest.data
	.filter(({ dlc }) => dlc === 9)
	.map(({ name }) => name);

/**
 * Hero row order: Shinki stands in the center with Yuki and Mai, her Makai companions, on her right.
 * 大妖精、小恶魔、芙兰朵露、八意永琳、神绮、雪、舞、秋静叶、秋穰子、八云蓝
 */
const HERO_GUEST_IDS = [
	9000, 9001, 9002, 9003, 9004, 11000, 11001, 10000, 10001, 10002,
] as const satisfies ReadonlyArray<TSpecialGuestId>;
const HERO_GUESTS = HERO_GUEST_IDS.map((id) => ({
	id,
	name: specialGuest.getPropsById(id, 'name'),
	src: getSpecialGuestTachiePath(id),
}));
/** Guests shown below the `lg` breakpoint, where the whole row does not fit; the range stays centered on Shinki. */
const COMPACT_HERO_GUEST_RANGE = { end: 7, start: 2 } as const;
/** Guests added back from the `md` breakpoint; the range also stays centered on Shinki. */
const MEDIUM_HERO_GUEST_RANGE = { end: 8, start: 1 } as const;

/** 5 guests below `md`, 7 from `md`, and all 10 from `lg`. */
function getHeroGuestVisibilityClassName(index: number) {
	if (
		index >= COMPACT_HERO_GUEST_RANGE.start &&
		index < COMPACT_HERO_GUEST_RANGE.end
	) {
		return;
	}

	return index >= MEDIUM_HERO_GUEST_RANGE.start &&
		index < MEDIUM_HERO_GUEST_RANGE.end
		? 'hidden md:block'
		: 'hidden lg:block';
}

interface IFeature {
	description: string;
	icon: FontAwesomeIconProps['icon'];
	title: string;
}

const FEATURES = [
	{
		description:
			'一人开房，好友加入。白天各自行动，夜晚一起经营同一家店，分工做菜、上菜和接待顾客。',
		icon: faUserGroup,
		title: '多人联机',
	},
	{
		description: `通过ResourceEx资源包，迎来${META_MYSTIA_GUEST_NAMES.slice(0, 3).join('、')}等${META_MYSTIA_GUEST_NAMES.length}位新稀客，以及新的料理、食材和酒水。单人游玩也能体验。`,
		icon: faUtensils,
		title: '新稀客与新料理',
	},
	{
		description:
			'换上喜欢的角色和服装外观，房间里的其他玩家也能看到你的新造型。',
		icon: faShirt,
		title: '皮肤系统',
	},
] as const satisfies ReadonlyArray<IFeature>;

function trackLinkClick(name: string) {
	trackEvent(trackEvent.category.click, 'Link', `meta-mystia:${name}`);
}

export default function MetaMystiaLanding() {
	const { isHighAppearance } = useDesignPreferences();

	const featureCardClassNames = useMemo(
		() => ({
			base: cn('p-4', isHighAppearance && 'bg-content1/40 backdrop-blur'),
		}),
		[isHighAppearance]
	);

	return (
		<div className="mx-auto flex min-h-main-content w-full max-w-3xl flex-col items-center gap-8 text-center">
			<section className="flex flex-col items-center">
				<div aria-hidden className="mb-4 flex items-end justify-center">
					{HERO_GUESTS.map(({ id, name, src }, index) => (
						<Tachie
							key={id}
							aria-hidden
							alt={name}
							src={src}
							className={cn(
								'-mx-1.5 h-[min(7rem,30vw)] w-auto md:-mx-2.5 md:h-36',
								getHeroGuestVisibilityClassName(index)
							)}
						/>
					))}
				</div>
				<p className="text-small text-foreground-500 md:text-base">
					《东方夜雀食堂》非官方联机Mod
				</p>
				<h1 className="my-2 text-4xl font-bold tracking-wider md:text-5xl">
					MetaMystia
				</h1>
				<p className="text-large md:text-xl">
					让原本只能单人游玩的夜雀食堂，
					<span className="inline-block">真正“热闹”起来</span>
				</p>
			</section>
			<section className="flex w-full max-w-xs flex-col gap-3 md:max-w-none md:flex-row md:justify-center">
				<Button
					as={Link}
					isExternal
					animationUnderline={false}
					color="primary"
					size="lg"
					variant="shadow"
					href={links.download.href}
					role="link"
					startContent={<FontAwesomeIcon icon={faWindows} />}
					title={links.download.label}
					onPress={() => {
						trackLinkClick('Download');
					}}
				>
					下载一键安装工具
				</Button>
				<Button
					as={Link}
					isExternal
					animationUnderline={false}
					color="primary"
					size="lg"
					variant="flat"
					href={links.docs.href}
					role="link"
					startContent={<FontAwesomeIcon icon={faBookOpen} />}
					title={links.docs.label}
					onPress={() => {
						trackLinkClick('Docs');
					}}
				>
					阅读使用文档
				</Button>
			</section>
			<p className="-mt-4 text-small text-foreground-500">
				<span className="block">
					欢迎加入QQ群
					<Link
						isExternal
						showAnchorIcon
						href={links.qqGroup.href}
						title={links.qqGroup.label}
						onPress={() => {
							trackLinkClick('QQ group');
						}}
						className="ml-1 rounded-small text-small"
					>
						{META_MYSTIA_QQ_GROUP_NUMBER}
					</Link>
					交流反馈
				</span>
				<span className="block">
					觉得有意思的话，欢迎到
					<Link
						isExternal
						showAnchorIcon
						href={links.github.href}
						title={links.github.label}
						onPress={() => {
							trackLinkClick('GitHub star');
						}}
						className="ml-1 rounded-small text-small"
					>
						GitHub
					</Link>
					<span className="inline-block">
						给MetaMystia点个Star
						<FontAwesomeIcon
							icon={faStar}
							className="ml-1 text-warning"
						/>
					</span>
				</span>
			</p>
			<section className="w-full">
				<h2 className="mb-3 text-xl font-semibold">联机实况</h2>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{META_MYSTIA_VIDEOS.map(({ aid, title }) => (
						<BilibiliVideo key={aid} aid={aid} title={title} />
					))}
				</div>
			</section>
			<section className="grid w-full grid-cols-1 gap-4 text-left md:grid-cols-3">
				{FEATURES.map(({ description, icon, title }) => (
					<Card
						key={title}
						shadow="sm"
						classNames={featureCardClassNames}
					>
						<h2 className="mb-1 flex items-center gap-2 font-semibold">
							<FontAwesomeIcon
								icon={icon}
								className="w-4 text-primary-600 dark:text-primary"
							/>
							{title}
						</h2>
						<p className="text-small text-foreground-600">
							{description}
						</p>
					</Card>
				))}
			</section>
		</div>
	);
}
