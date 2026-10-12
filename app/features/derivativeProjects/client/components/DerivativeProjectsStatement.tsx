'use client';

import { cn } from '@heroui/theme';
import { type ReactNode } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Heading from '@/design/ui/components/heading';
import Link from '@/design/ui/components/link';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import {
	type TDerivativeProjectsMessageKey,
	derivativeProjectsMessages,
} from '@/features/derivativeProjects/client/messages';
import { DERIVATIVE_PROJECTS_LINKS } from '@/features/derivativeProjects/links';

import { useI18n } from '@/shared/i18n/useI18n';

const links = DERIVATIVE_PROJECTS_LINKS;

const INTRO_PARAGRAPH_KEYS = [
	'derivativeProjects.intro.p1',
	'derivativeProjects.intro.p2',
	'derivativeProjects.intro.p3',
	'derivativeProjects.intro.p4',
] as const satisfies ReadonlyArray<TDerivativeProjectsMessageKey>;

const ASSETS_PARAGRAPH_KEYS = [
	'derivativeProjects.assets.p1',
	'derivativeProjects.assets.p2',
	'derivativeProjects.assets.p3',
] as const satisfies ReadonlyArray<TDerivativeProjectsMessageKey>;

const ASSETS_TRAILING_PARAGRAPH_KEYS = [
	'derivativeProjects.assets.p4',
	'derivativeProjects.assets.p5',
	'derivativeProjects.assets.p6',
	'derivativeProjects.assets.p7',
] as const satisfies ReadonlyArray<TDerivativeProjectsMessageKey>;

const PROPAGATION_PARAGRAPH_KEYS = [
	'derivativeProjects.propagation.p2',
	'derivativeProjects.propagation.p3',
	'derivativeProjects.propagation.p4',
	'derivativeProjects.propagation.p5',
] as const satisfies ReadonlyArray<TDerivativeProjectsMessageKey>;

const AI_ITEM_KEYS = [
	'derivativeProjects.ai.p2.item1',
	'derivativeProjects.ai.p2.item2',
	'derivativeProjects.ai.p2.item3',
] as const satisfies ReadonlyArray<TDerivativeProjectsMessageKey>;

const FINAL_BULLET_KEYS = [
	'derivativeProjects.final.bullet1',
	'derivativeProjects.final.bullet2',
	'derivativeProjects.final.bullet3',
	'derivativeProjects.final.bullet4',
] as const satisfies ReadonlyArray<TDerivativeProjectsMessageKey>;

const PARAGRAPH_CLASS_NAMES = 'indent-8';
const EMPHASIS_CLASS_NAMES = 'font-medium text-foreground-700 indent-8';

interface ISectionProps {
	children: ReactNode;
	titleKey: TDerivativeProjectsMessageKey;
}

function Section({ children, titleKey }: ISectionProps) {
	const { t } = useI18n(derivativeProjectsMessages);

	return (
		<section className="flex flex-col gap-3">
			<Heading as="h2" isFirst className="mb-1 text-large">
				{t(titleKey)}
			</Heading>
			{children}
		</section>
	);
}

export default function DerivativeProjectsStatement() {
	const { isHighAppearance } = useDesignPreferences();
	const { t } = useI18n(derivativeProjectsMessages);

	return (
		<div className="mx-auto flex min-h-main-content w-full max-w-3xl flex-col gap-8 pb-8">
			<header className="flex flex-col gap-2">
				<p className="text-small font-medium text-primary-600 dark:text-primary">
					{t('derivativeProjects.kicker')}
				</p>
				<Heading isFirst className="mb-1">
					{t('derivativeProjects.title')}
				</Heading>
				<p className="text-small text-foreground-500">
					{t('derivativeProjects.publishInfo')}・
					<Link
						isExternal
						showAnchorIcon
						href={links.originalPost.href}
						title={links.originalPost.label}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Link',
								'derivativeProjects:OriginalPost'
							);
						}}
						className="rounded-small text-small"
					>
						{t('derivativeProjects.originalPost.label')}
					</Link>
				</p>
			</header>
			<div className="text-cjk-flow flex flex-col gap-10">
				<section className="flex flex-col gap-3">
					{INTRO_PARAGRAPH_KEYS.map((key) => (
						<p key={key} className={PARAGRAPH_CLASS_NAMES}>
							{t(key)}
						</p>
					))}
					<p className={EMPHASIS_CLASS_NAMES}>
						{t('derivativeProjects.intro.emphasis')}
					</p>
				</section>
				<Section titleKey="derivativeProjects.license.title">
					<p className={PARAGRAPH_CLASS_NAMES}>
						{t('derivativeProjects.license.p1')}
					</p>
					<p className={PARAGRAPH_CLASS_NAMES}>
						{t('derivativeProjects.license.p2')}
					</p>
					<p className={PARAGRAPH_CLASS_NAMES}>
						{t('derivativeProjects.license.p3')}
					</p>
					<p className={PARAGRAPH_CLASS_NAMES}>
						{t('derivativeProjects.license.legal.prefix')}
						<Link
							showAnchorIcon
							href={links.legal.href}
							target="_blank"
							title={t(
								'derivativeProjects.license.legal.linkLabel'
							)}
							onPress={() => {
								trackEvent(
									trackEvent.category.click,
									'Link',
									'derivativeProjects:Legal'
								);
							}}
							className="rounded-small indent-0"
						>
							{t('derivativeProjects.license.legal.linkLabel')}
						</Link>
						{t('derivativeProjects.license.legal.suffix')}
					</p>
				</Section>
				<Section titleKey="derivativeProjects.assets.title">
					{ASSETS_PARAGRAPH_KEYS.map((key) => (
						<p key={key} className={PARAGRAPH_CLASS_NAMES}>
							{t(key)}
						</p>
					))}
					<p
						className={cn(
							'rounded-medium border border-primary/30 bg-primary/10 px-4 py-3 text-foreground-700 shadow-small',
							{ 'backdrop-blur-sm': isHighAppearance }
						)}
					>
						{t('derivativeProjects.assets.notice')}
					</p>
					{ASSETS_TRAILING_PARAGRAPH_KEYS.map((key) => (
						<p key={key} className={PARAGRAPH_CLASS_NAMES}>
							{t(key)}
						</p>
					))}
				</Section>
				<Section titleKey="derivativeProjects.propagation.title">
					<p className={PARAGRAPH_CLASS_NAMES}>
						{t('derivativeProjects.propagation.p1.prefix')}
						<strong className="font-semibold text-foreground-700">
							{t('derivativeProjects.propagation.p1.strong1')}
						</strong>
						{t('derivativeProjects.propagation.p1.mid')}
						<strong className="font-semibold text-foreground-700">
							{t('derivativeProjects.propagation.p1.strong2')}
						</strong>
						{t('derivativeProjects.propagation.p1.suffix')}
					</p>
					{PROPAGATION_PARAGRAPH_KEYS.map((key) => (
						<p key={key} className={PARAGRAPH_CLASS_NAMES}>
							{t(key)}
						</p>
					))}
				</Section>
				<Section titleKey="derivativeProjects.ai.title">
					<p className={PARAGRAPH_CLASS_NAMES}>
						{t('derivativeProjects.ai.p1')}
					</p>
					<p>{t('derivativeProjects.ai.p2.lead')}</p>
					<ul className="flex flex-col gap-2">
						{AI_ITEM_KEYS.map((key) => (
							<li
								key={key}
								className="rounded-medium bg-background px-4 py-2 shadow-small"
							>
								{t(key)}
							</li>
						))}
					</ul>
					<p className={PARAGRAPH_CLASS_NAMES}>
						{t('derivativeProjects.ai.p3')}
					</p>
					<p className={EMPHASIS_CLASS_NAMES}>
						{t('derivativeProjects.ai.p4')}
					</p>
				</Section>
				<Section titleKey="derivativeProjects.final.title">
					<p className={PARAGRAPH_CLASS_NAMES}>
						{t('derivativeProjects.final.p1')}
					</p>
					<p>{t('derivativeProjects.final.p2')}</p>
					<ul className="grid gap-2 sm:grid-cols-2">
						{FINAL_BULLET_KEYS.map((key) => (
							<li
								key={key}
								className="rounded-medium bg-background px-4 py-2 shadow-small"
							>
								{t(key)}
							</li>
						))}
					</ul>
					<p className={PARAGRAPH_CLASS_NAMES}>
						{t('derivativeProjects.final.p3')}
					</p>
					<p className={PARAGRAPH_CLASS_NAMES}>
						{t('derivativeProjects.final.p4')}
					</p>
				</Section>
			</div>
			<footer className="border-t border-default-200/70 pt-6 text-right text-small text-foreground-500">
				{t('derivativeProjects.signature')}
			</footer>
		</div>
	);
}
