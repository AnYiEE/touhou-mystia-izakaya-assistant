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
import {
	type TMetaMystiaMessageKey,
	metaMystiaMessages,
} from '@/features/metaMystia/client/messages';
import { META_MYSTIA_GUESTS } from '@/features/metaMystia/content';
import {
	META_MYSTIA_LINKS,
	META_MYSTIA_QQ_GROUP_NUMBER,
	META_MYSTIA_VIDEOS,
} from '@/features/metaMystia/links';

import { type TMessageParams } from '@/shared/i18n/messages';
import { useI18n } from '@/shared/i18n/useI18n';

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

const HERO_TAGS = [
	'metaMystia.hero.tag.multiplayer',
	'metaMystia.hero.tag.content',
	'metaMystia.hero.tag.openSource',
] as const satisfies ReadonlyArray<TMetaMystiaMessageKey>;

interface IFeature {
	descriptionKey: TMetaMystiaMessageKey;
	icon: FontAwesomeIconProps['icon'];
	titleKey: TMetaMystiaMessageKey;
}

const FEATURES = [
	{
		descriptionKey: 'metaMystia.features.multiplayer.description',
		icon: faUserGroup,
		titleKey: 'metaMystia.features.multiplayer.title',
	},
	{
		descriptionKey: 'metaMystia.features.skins.description',
		icon: faShirt,
		titleKey: 'metaMystia.features.skins.title',
	},
	{
		descriptionKey: 'metaMystia.features.solo.description',
		icon: faGamepad,
		titleKey: 'metaMystia.features.solo.title',
	},
] as const satisfies ReadonlyArray<IFeature>;

interface ICommunityLink {
	href: string;
	icon: FontAwesomeIconProps['icon'];
	iconClassName: string;
	labelKey: TMetaMystiaMessageKey;
	params?: TMessageParams | undefined;
	trackName: string;
}

const COMMUNITY_LINKS = [
	{
		href: links.qqGroup.href,
		icon: faQq,
		iconClassName: 'text-qq-blue',
		labelKey: 'metaMystia.community.qqGroup',
		params: { number: META_MYSTIA_QQ_GROUP_NUMBER },
		trackName: 'QQ group',
	},
	{
		href: links.github.href,
		icon: faGithub,
		iconClassName: 'text-foreground',
		labelKey: 'metaMystia.community.github',
		params: undefined,
		trackName: 'GitHub',
	},
] as const satisfies ReadonlyArray<ICommunityLink>;

function trackLinkClick(name: string) {
	trackEvent(trackEvent.category.click, 'Link', `meta-mystia:${name}`);
}

function LandingActions() {
	const { t } = useI18n(metaMystiaMessages);

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
				title={t('metaMystia.links.download')}
				onPress={() => {
					trackLinkClick('Download');
				}}
			>
				{t('metaMystia.actions.download')}
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
				title={t('metaMystia.links.docs')}
				onPress={() => {
					trackLinkClick('Docs');
				}}
			>
				{t('metaMystia.actions.docs')}
			</Button>
		</div>
	);
}

export default function MetaMystiaLanding() {
	const { isHighAppearance } = useDesignPreferences();
	const { t } = useI18n(metaMystiaMessages);

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
						{t('metaMystia.hero.kicker')}
					</p>
				</RevealOnView>
				<RevealOnView delay={0.12}>
					<h1 className="my-3 text-4xl font-bold tracking-tight md:text-6xl">
						MetaMystia
					</h1>
				</RevealOnView>
				<RevealOnView delay={0.18}>
					<p className="text-large md:text-xl">
						{t('metaMystia.hero.tagline.prefix')}
						<span className="inline-block">
							{t('metaMystia.hero.tagline.highlight')}
						</span>
					</p>
				</RevealOnView>
				<RevealOnView className="hidden md:block" delay={0.24}>
					<p className="mt-3 max-w-xl text-small text-foreground-500">
						{t('metaMystia.hero.note')}
					</p>
				</RevealOnView>
				<RevealOnView delay={0.3}>
					<div className="mt-4 flex flex-wrap justify-center gap-2">
						{HERO_TAGS.map((tag) => (
							<span
								key={tag}
								className="rounded-full bg-content2 px-3 py-1 text-tiny text-foreground-600"
							>
								{t(tag)}
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
						subTitle={t('metaMystia.videos.subTitle')}
					>
						{t('metaMystia.videos.title')}
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
					<Heading
						as="h2"
						isFirst
						subTitle={t('metaMystia.features.subTitle')}
					>
						{t('metaMystia.features.title')}
					</Heading>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						{FEATURES.map(({ descriptionKey, icon, titleKey }) => (
							<Card
								key={titleKey}
								shadow="sm"
								classNames={featureCardClassNames}
							>
								<span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
									<FontAwesomeIcon
										icon={icon}
										className="w-4"
									/>
								</span>
								<h3 className="mb-1 font-semibold">
									{t(titleKey)}
								</h3>
								<p className="text-small text-foreground-600">
									{t(descriptionKey)}
								</p>
							</Card>
						))}
					</div>
				</section>
			</RevealOnView>
			<RevealOnView className="w-full">
				<section className="w-full rounded-large border border-primary/20 bg-primary/10 px-6 py-8 text-center">
					<h2 className="text-xl font-semibold md:text-2xl">
						{t('metaMystia.cta.title')}
					</h2>
					<p className="mt-2 text-small text-foreground-600">
						{t('metaMystia.cta.description')}
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
						subTitle={t('metaMystia.community.subTitle')}
					>
						{t('metaMystia.community.title')}
					</Heading>
					<div className="flex flex-wrap gap-3">
						{COMMUNITY_LINKS.map(
							({
								href,
								icon,
								iconClassName,
								labelKey,
								params,
								trackName,
							}) => (
								<Link
									key={href}
									isExternal
									animationUnderline={false}
									href={href}
									title={t(labelKey, params)}
									onPress={() => {
										trackLinkClick(trackName);
									}}
									className="flex items-center gap-2 rounded-full border border-default-100 bg-content1 px-4 py-2 text-small hover:border-primary/40"
								>
									<FontAwesomeIcon
										icon={icon}
										className={iconClassName}
									/>
									{t(labelKey, params)}
								</Link>
							)
						)}
					</div>
				</section>
			</RevealOnView>
		</div>
	);
}
