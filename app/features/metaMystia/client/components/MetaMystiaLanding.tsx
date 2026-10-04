'use client';

import { faGithub, faQq } from '@fortawesome/free-brands-svg-icons';
import {
	faBookOpen,
	faDownload,
	faGamepad,
	faShirt,
	faUserGroup,
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
import Heading from '@/design/ui/components/heading';
import Link from '@/design/ui/components/link';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { getSpecialGuestTachiePath } from '@/features/catalog/presentation/tachiePaths';
import Tachie from '@/features/catalog/shared/client/components/Tachie';
import { META_MYSTIA_GUESTS } from '@/features/metaMystia/content';
import {
	META_MYSTIA_LINKS,
	META_MYSTIA_QQ_GROUP_NUMBER,
	META_MYSTIA_VIDEOS,
} from '@/features/metaMystia/links';

import BilibiliVideo from './BilibiliVideo';
import MetaMystiaShowcase from './MetaMystiaShowcase';
import RevealOnView from './RevealOnView';

const links = META_MYSTIA_LINKS;

const HERO_GUESTS = META_MYSTIA_GUESTS.map(({ id, name }) => ({
	id,
	name,
	src: getSpecialGuestTachiePath(id),
}));
/** Guests shown below the `lg` breakpoint, where the whole row does not fit; the range stays centered on Shinki. */
const COMPACT_HERO_GUEST_RANGE = { end: 7, start: 2 } as const;
/** Guests added back from the `md` breakpoint; the range also stays centered on Shinki. */
const MEDIUM_HERO_GUEST_RANGE = { end: 8, start: 1 } as const;

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

const HERO_TAGS = ['多人联机', '内容扩展', '免费开源'] as const;

interface IFeature {
	description: string;
	icon: FontAwesomeIconProps['icon'];
	title: string;
}

const FEATURES = [
	{
		description:
			'一人开房，好友加入。白天各忙各的，夜里一起做菜、上菜、招待客人。',
		icon: faUserGroup,
		title: '多人联机',
	},
	{
		description:
			'支持游戏内、DLC和ResourceEx服装，换装后会同步给房间里所有人。',
		icon: faShirt,
		title: '皮肤系统',
	},
	{
		description:
			'单人游玩也能体验ResourceEx的新稀客、料理、酒水与羁绊剧情。',
		icon: faGamepad,
		title: '单人也能玩',
	},
] as const satisfies ReadonlyArray<IFeature>;

const COMMUNITY_LINKS = [
	{
		href: links.qqGroup.href,
		icon: faQq,
		iconClassName: 'text-qq-blue',
		label: `QQ群${META_MYSTIA_QQ_GROUP_NUMBER}`,
		trackName: 'QQ group',
	},
	{
		href: links.github.href,
		icon: faGithub,
		iconClassName: 'text-foreground',
		label: 'GitHub仓库',
		trackName: 'GitHub',
	},
] as const;

function trackLinkClick(name: string) {
	trackEvent(trackEvent.category.click, 'Link', `meta-mystia:${name}`);
}

function LandingActions() {
	return (
		<div className="mx-auto flex w-full max-w-xs flex-col gap-3 md:max-w-none md:flex-row md:justify-center">
			<Button
				as={Link}
				isExternal
				animationUnderline={false}
				color="primary"
				size="lg"
				variant="solid"
				href={links.download.href}
				role="link"
				startContent={<FontAwesomeIcon icon={faDownload} />}
				title={links.download.label}
				onPress={() => {
					trackLinkClick('Download');
				}}
			>
				下载与安装
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
		</div>
	);
}

export default function MetaMystiaLanding() {
	const { isHighAppearance } = useDesignPreferences();

	const featureCardClassNames = useMemo(
		() => ({
			base: cn(
				'h-full p-4 md:p-5',
				isHighAppearance && 'bg-content1/40 backdrop-blur'
			),
		}),
		[isHighAppearance]
	);

	return (
		<div className="mx-auto flex min-h-main-content w-full max-w-5xl flex-col items-center gap-12 text-left md:gap-16">
			<noscript>
				<style>
					{
						'.meta-mystia-reveal,.meta-mystia-item{opacity:1!important;transform:none!important}'
					}
				</style>
			</noscript>
			<section className="flex w-full flex-col items-center text-center">
				<div aria-hidden className="mb-6 flex items-end justify-center">
					<RevealOnView>
						<div className="flex items-end justify-center">
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
					</RevealOnView>
				</div>
				<RevealOnView delay={0.06}>
					<p className="text-small text-foreground-500 md:text-base">
						《东方夜雀食堂》非官方Mod
					</p>
				</RevealOnView>
				<RevealOnView delay={0.12}>
					<h1 className="my-3 text-4xl font-bold tracking-tight md:text-6xl">
						MetaMystia
					</h1>
				</RevealOnView>
				<RevealOnView delay={0.18}>
					<p className="text-large md:text-xl">
						让原本只能单人游玩的夜雀食堂，
						<span className="inline-block">真正“热闹”起来</span>
					</p>
				</RevealOnView>
				<RevealOnView className="hidden md:block" delay={0.24}>
					<p className="mt-3 max-w-xl text-small text-foreground-500">
						和朋友一起经营食堂，或单人体验全新的稀客、料理与剧情
					</p>
				</RevealOnView>
				<RevealOnView delay={0.3}>
					<div className="mt-4 flex flex-wrap justify-center gap-2">
						{HERO_TAGS.map((tag) => (
							<span
								key={tag}
								className="rounded-full bg-content2 px-3 py-1 text-tiny text-foreground-600"
							>
								{tag}
							</span>
						))}
					</div>
				</RevealOnView>
				<RevealOnView className="w-full" delay={0.36}>
					<div className="mt-6 w-full">
						<LandingActions />
					</div>
				</RevealOnView>
			</section>
			<RevealOnView className="w-full">
				<section className="w-full">
					<Heading
						as="h2"
						isFirst
						subTitle="十人同屏的夜雀食堂是什么样？"
					>
						联机实况
					</Heading>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{META_MYSTIA_VIDEOS.map(({ aid, title }) => (
							<BilibiliVideo key={aid} aid={aid} title={title} />
						))}
					</div>
				</section>
			</RevealOnView>
			<MetaMystiaShowcase />
			<RevealOnView className="w-full">
				<section className="w-full">
					<Heading as="h2" isFirst subTitle="安装之后，你可以这样玩">
						玩法亮点
					</Heading>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						{FEATURES.map(({ description, icon, title }) => (
							<Card
								key={title}
								shadow="sm"
								classNames={featureCardClassNames}
							>
								<span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
									<FontAwesomeIcon
										icon={icon}
										className="w-4"
									/>
								</span>
								<h3 className="mb-1 font-semibold">{title}</h3>
								<p className="text-small text-foreground-600">
									{description}
								</p>
							</Card>
						))}
					</div>
				</section>
			</RevealOnView>
			<RevealOnView className="w-full">
				<section className="w-full rounded-large border border-primary/20 bg-primary/10 px-6 py-8 text-center">
					<h2 className="text-xl font-semibold md:text-2xl">
						叫上朋友，一起经营夜雀食堂
					</h2>
					<p className="mt-2 text-small text-foreground-600">
						下载并安装，几分钟就能开张
					</p>
					<div className="mt-6">
						<LandingActions />
					</div>
				</section>
			</RevealOnView>
			<RevealOnView className="w-full">
				<section className="w-full">
					<Heading
						as="h2"
						isFirst
						subTitle="遇到问题或有新想法，欢迎来这里找我们"
					>
						加入社区
					</Heading>
					<div className="flex flex-wrap gap-3">
						{COMMUNITY_LINKS.map(
							({
								href,
								icon,
								iconClassName,
								label,
								trackName,
							}) => (
								<Link
									key={href}
									isExternal
									animationUnderline={false}
									href={href}
									title={label}
									onPress={() => {
										trackLinkClick(trackName);
									}}
									className="flex items-center gap-2 rounded-full border border-default-100 bg-content1 px-4 py-2 text-small hover:border-primary/40"
								>
									<FontAwesomeIcon
										icon={icon}
										className={iconClassName}
									/>
									{label}
								</Link>
							)
						)}
					</div>
				</section>
			</RevealOnView>
		</div>
	);
}
