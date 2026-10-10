'use client';

import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { useInView } from 'framer-motion';
import { type ReactNode, useMemo, useRef } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Card from '@/design/ui/components/card';
import Heading from '@/design/ui/components/heading';
import Link from '@/design/ui/components/link';
import Tooltip from '@/design/ui/components/tooltip';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { GUEST_INFO_QUERY_PARAM } from '@/features/catalog/guests/shared/navigation';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import { useCatalogLocalizationRevision } from '@/features/catalog/shared/client/localization/catalogLocalizationRevision';
import { ITEM_SHARE_PARAM_NAME } from '@/features/itemSharing/contracts';
import {
	type TMetaMystiaMessageKey,
	metaMystiaMessages,
} from '@/features/metaMystia/client/messages';
import {
	type IMetaMystiaShowcaseGroup,
	META_MYSTIA_GUESTS,
	META_MYSTIA_GUEST_IDS,
	META_MYSTIA_SHOWCASE_GROUPS,
	type TMetaMystiaShowcaseTarget,
	getMetaMystiaGuestDisplayName,
	getMetaMystiaShowcaseDisplayName,
} from '@/features/metaMystia/content';

import { useI18n } from '@/shared/i18n/useI18n';

import CountUpNumber from './CountUpNumber';
import RevealOnView from './RevealOnView';

const ITEM_SPRITE_SIZE = 2;
const GUEST_SPRITE_SIZE = 3;
const ITEM_GRID_CLASS_NAME = 'grid grid-cols-4 place-items-center gap-2';
const [FIRST_META_MYSTIA_GUEST] = META_MYSTIA_GUESTS;
const META_MYSTIA_GUEST_HREF =
	FIRST_META_MYSTIA_GUEST === undefined
		? '/special-guests'
		: `/special-guests/${FIRST_META_MYSTIA_GUEST.id}?${GUEST_INFO_QUERY_PARAM}`;

const META_MYSTIA_STATS = [
	{
		labelKey: 'metaMystia.showcase.groups.guests',
		value: META_MYSTIA_GUESTS.length,
	},
	{
		labelKey: 'metaMystia.showcase.groups.foods',
		value: META_MYSTIA_SHOWCASE_GROUPS.foods.records.length,
	},
	{
		labelKey: 'metaMystia.showcase.groups.ingredients',
		value: META_MYSTIA_SHOWCASE_GROUPS.ingredients.records.length,
	},
	{
		labelKey: 'metaMystia.showcase.groups.beverages',
		value: META_MYSTIA_SHOWCASE_GROUPS.beverages.records.length,
	},
	{
		labelKey: 'metaMystia.showcase.groups.clothes',
		value: META_MYSTIA_SHOWCASE_GROUPS.clothes.records.length,
	},
] as const satisfies ReadonlyArray<{
	labelKey: TMetaMystiaMessageKey;
	value: number;
}>;

function trackShowcaseLinkClick(href: string) {
	trackEvent(trackEvent.category.click, 'Link', `meta-mystia:${href}`);
}

interface IShowcasePanelProps {
	children: ReactNode;
	count: number;
	delay?: number;
	href: string;
	label: string;
	trackName: string;
	unit: string;
}

function ShowcasePanel({
	children,
	count,
	delay = 0,
	href,
	label,
	trackName,
	unit,
}: IShowcasePanelProps) {
	const { isHighAppearance } = useDesignPreferences();
	const { t } = useI18n(metaMystiaMessages);

	const cardClassNames = useMemo(
		() => ({
			base: cn(
				'flex h-full flex-col p-4 md:p-5',
				isHighAppearance && 'bg-content1/40 backdrop-blur'
			),
		}),
		[isHighAppearance]
	);

	return (
		<RevealOnView className="h-full" delay={delay}>
			<Card shadow="sm" classNames={cardClassNames}>
				<div className="flex items-baseline justify-between gap-2">
					<h3 className="font-semibold">{label}</h3>
					<span className="text-small text-foreground-500">
						{t('metaMystia.showcase.total', { count, unit })}
					</span>
				</div>
				<div className="mt-4 flex-1">{children}</div>
				<div className="group/row mt-4 flex shrink-0 items-center gap-1 text-small">
					<Link
						isExternal
						href={href}
						onPress={() => {
							trackShowcaseLinkClick(trackName);
						}}
						className="rounded-small text-primary"
					>
						{t('metaMystia.showcase.viewCatalog')}
					</Link>
					<FontAwesomeIcon
						aria-hidden
						icon={faArrowRight}
						className="w-3 text-primary transition-transform group-hover/row:translate-x-0.5 motion-reduce:transition-none"
					/>
				</div>
			</Card>
		</RevealOnView>
	);
}

interface IGroupPanelProps<T extends TMetaMystiaShowcaseTarget> {
	delay: number;
	gridClassName: string;
	group: IMetaMystiaShowcaseGroup<T>;
	label: string;
	unit: string;
}

function GroupPanel<T extends TMetaMystiaShowcaseTarget>({
	delay,
	gridClassName,
	group,
	label,
	unit,
}: IGroupPanelProps<T>) {
	const [firstRecord] = group.records;
	const gridRef = useRef<HTMLDivElement>(null);
	const isGridInView = useInView(gridRef, {
		margin: '0px 0px 10% 0px',
		once: true,
	});

	return (
		<ShowcasePanel
			count={group.records.length}
			delay={delay}
			href={
				firstRecord === undefined
					? group.href
					: `${group.href}?${ITEM_SHARE_PARAM_NAME}=${firstRecord.id}`
			}
			label={label}
			trackName={group.href}
			unit={unit}
		>
			<div ref={gridRef} className={gridClassName}>
				{group.records.map(({ id }, index) => (
					<Tooltip
						key={id}
						showArrow
						content={getMetaMystiaShowcaseDisplayName(
							group.target,
							id
						)}
						offset={4}
						size="sm"
					>
						<Sprite
							className={cn(
								'meta-mystia-item transition duration-300 motion-reduce:transition-none',
								isGridInView
									? 'scale-100 opacity-100'
									: 'scale-75 opacity-0'
							)}
							recordId={id}
							size={ITEM_SPRITE_SIZE}
							style={{ transitionDelay: `${index * 15}ms` }}
							target={group.target}
						/>
					</Tooltip>
				))}
			</div>
		</ShowcasePanel>
	);
}

function GuestPanel({ delay }: { delay: number }) {
	const { t } = useI18n(metaMystiaMessages);
	const gridRef = useRef<HTMLDivElement>(null);
	const isGridInView = useInView(gridRef, {
		margin: '0px 0px 10% 0px',
		once: true,
	});
	const guests = META_MYSTIA_GUEST_IDS.map((id) => ({
		id,
		name: getMetaMystiaGuestDisplayName(id),
	}));

	return (
		<ShowcasePanel
			count={guests.length}
			delay={delay}
			href={META_MYSTIA_GUEST_HREF}
			label={t('metaMystia.showcase.groups.guests')}
			trackName="/special-guests"
			unit={t('metaMystia.showcase.units.guests')}
		>
			<div ref={gridRef} className="grid grid-cols-5 gap-x-2 gap-y-4">
				{guests.map(({ id, name }, index) => (
					<div
						key={id}
						className="group flex flex-col items-center gap-1"
					>
						<Sprite
							aria-hidden
							className={cn(
								'meta-mystia-item rounded-medium bg-content2 transition duration-300 group-hover:scale-110 motion-reduce:transition-none',
								isGridInView
									? 'scale-100 opacity-100'
									: 'scale-90 opacity-0'
							)}
							recordId={id}
							size={GUEST_SPRITE_SIZE}
							style={{ transitionDelay: `${index * 30}ms` }}
							target="special_guest"
						/>
						<span className="text-tiny text-foreground-600">
							{name}
						</span>
					</div>
				))}
			</div>
		</ShowcasePanel>
	);
}

export default function MetaMystiaShowcase() {
	const { isHighAppearance } = useDesignPreferences();
	const { t } = useI18n(metaMystiaMessages);
	useCatalogLocalizationRevision();

	const statsCardClassNames = useMemo(
		() => ({
			base: cn(
				'p-4 md:p-6',
				isHighAppearance && 'bg-content1/40 backdrop-blur'
			),
		}),
		[isHighAppearance]
	);

	return (
		<section className="w-full">
			<Heading
				as="h2"
				isFirst
				subTitle={t('metaMystia.showcase.subTitle')}
			>
				{t('metaMystia.showcase.title')}
			</Heading>
			<RevealOnView>
				<Card shadow="sm" classNames={statsCardClassNames}>
					<div className="flex flex-wrap justify-center gap-x-10 gap-y-5">
						{META_MYSTIA_STATS.map(({ labelKey, value }) => (
							<div
								key={labelKey}
								className="flex min-w-16 flex-col items-center gap-1"
							>
								<CountUpNumber
									className="text-3xl font-semibold tabular-nums text-primary"
									value={value}
								/>
								<span className="text-small text-foreground-500">
									{t(labelKey)}
								</span>
							</div>
						))}
					</div>
				</Card>
			</RevealOnView>
			<div className="mt-4 grid grid-cols-1 gap-4">
				<GuestPanel delay={0.05} />
				<GroupPanel
					delay={0.1}
					gridClassName="grid grid-cols-6 place-items-center gap-2 md:grid-cols-12"
					group={META_MYSTIA_SHOWCASE_GROUPS.foods}
					label={t('metaMystia.showcase.groups.foods')}
					unit={t('metaMystia.showcase.units.foods')}
				/>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<GroupPanel
						delay={0.15}
						gridClassName={ITEM_GRID_CLASS_NAME}
						group={META_MYSTIA_SHOWCASE_GROUPS.ingredients}
						label={t('metaMystia.showcase.groups.ingredients')}
						unit={t('metaMystia.showcase.units.ingredients')}
					/>
					<GroupPanel
						delay={0.2}
						gridClassName={ITEM_GRID_CLASS_NAME}
						group={META_MYSTIA_SHOWCASE_GROUPS.beverages}
						label={t('metaMystia.showcase.groups.beverages')}
						unit={t('metaMystia.showcase.units.beverages')}
					/>
					<GroupPanel
						delay={0.25}
						gridClassName={ITEM_GRID_CLASS_NAME}
						group={META_MYSTIA_SHOWCASE_GROUPS.clothes}
						label={t('metaMystia.showcase.groups.clothes')}
						unit={t('metaMystia.showcase.units.clothes')}
					/>
				</div>
			</div>
		</section>
	);
}
