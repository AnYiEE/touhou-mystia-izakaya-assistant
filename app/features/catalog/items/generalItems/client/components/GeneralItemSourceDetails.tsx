import { Fragment, memo, useMemo } from 'react';

import Tooltip from '@/design/ui/components/tooltip';

import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import type { IGeneralItem } from '@/domain/data/generalItems/schema';
import {
	SCHEDULER_FACTS,
	formatSchedulerLabels,
} from '@/domain/data/labels/schedulerFacts';
import { getSourceEntries } from '@/domain/data/shared/sourceEntries';
import { getCollaborationLabel } from '@/domain/labels/localizedCollaborationLabels';
import { formatSchedulerTaskLabel } from '@/domain/labels/localizedSchedulerLabels';
import { getMapLabel } from '@/domain/places/localizedLabels';

import { catalogItemsMessages } from '@/features/catalog/items/shared/messages';
import Price from '@/features/catalog/shared/client/components/Price';
import SpecialGuestBondReference from '@/features/catalog/shared/client/components/SpecialGuestBondReference';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import { catalogSharedMessages } from '@/features/catalog/shared/client/messages';
import {
	type TItemRoutePath,
	type TShareableItemId,
	type TShareableItemName,
} from '@/features/itemSharing/contracts';
import {
	CollaborationMapLink,
	TaskMapLinks,
} from '@/features/maps/client/components/MapLinks';

import { useI18n } from '@/shared/i18n/useI18n';

interface IProps {
	id: number;
	from: IGeneralItem['from'];
	openWindow: (
		path: TItemRoutePath,
		recordId: TShareableItemId,
		name: TShareableItemName
	) => void;
}

type TGeneralItemSource = ReturnType<
	typeof getSourceEntries<IGeneralItem['from']>
>[number];

const currencyItemCatalog = CurrencyItemCatalog.getInstance();
const specialGuestCatalog = SpecialGuestCatalog.getInstance();

function renderSpecialGuest(
	specialGuest: Parameters<typeof specialGuestCatalog.getPropsById>[0],
	tag: { close: string; open: string }
) {
	const specialGuestName = specialGuestCatalog.getDisplayPropsById(
		specialGuest,
		'name'
	);
	return (
		<span className="mr-1 inline-flex items-center">
			{tag.open}
			<Sprite
				target="special_guest"
				recordId={specialGuest}
				size={1.25}
				className="mx-0.5 rounded-full"
			/>
			{specialGuestName}
			{tag.close}
		</span>
	);
}

const GeneralItemSource = memo<{
	openWindow: IProps['openWindow'];
	source: TGeneralItemSource;
	tag: { close: string; open: string };
}>(function GeneralItemSource({ openWindow, source, tag }) {
	const { t } = useI18n(catalogItemsMessages);

	if ('areaTask' in source) {
		return t('items.source.areaTask', {
			map: getMapLabel(source.areaTask.map),
			task: source.areaTask.task,
		});
	}

	if ('collaboration' in source) {
		return t('items.source.collaborationTerminal', {
			label: getCollaborationLabel(
				source.collaboration.collaborationLabel
			),
		});
	}

	if ('holdingCurrencyItem' in source) {
		const { amount, currencyItem } = source.holdingCurrencyItem;
		const currencyItemName = currencyItemCatalog.getDisplayPropsById(
			currencyItem,
			'name'
		);
		const actionLabel = t('items.source.actionCurrency', {
			label: currencyItemName,
		});
		return (
			<>
				{t('items.source.holdingPrefix')}
				<span className="inline-flex items-center">
					<Price showSymbol={false}>{amount}×</Price>
					<Tooltip
						showArrow
						content={actionLabel}
						offset={1}
						size="sm"
					>
						<Sprite
							target="currency_item"
							recordId={currencyItem}
							size={1.25}
							onPress={() => {
								openWindow(
									'currencies',
									currencyItem,
									currencyItemName
								);
							}}
							aria-label={actionLabel}
							role="button"
						/>
					</Tooltip>
				</span>
				{t('items.source.holdingSuffix')}
			</>
		);
	}

	if ('schedulerLabel' in source) {
		const fact = SCHEDULER_FACTS[source.schedulerLabel];
		if ('specialGuestBond' in fact) {
			const { level, specialGuest } = fact.specialGuestBond;
			return (
				<SpecialGuestBondReference
					level={level}
					specialGuest={specialGuest}
				/>
			);
		}
		return formatSchedulerLabels(source.schedulerLabel);
	}

	if ('taskReward' in source) {
		return t('items.source.task', {
			label: formatSchedulerTaskLabel(
				formatSchedulerLabels(source.taskReward)
			),
		});
	}

	return (
		<>
			{renderSpecialGuest(source.positiveSpellCard, tag)}
			{t('items.source.rewardSpellCardSuffix')}
		</>
	);
});

export default function GeneralItemSourceDetails({
	from,
	id,
	openWindow,
}: IProps) {
	const { t } = useI18n(catalogItemsMessages);
	const { t: tShared } = useI18n(catalogSharedMessages);

	const sourceTag = useMemo(
		() => ({
			close: tShared('catalog.guestTag.close'),
			open: tShared('catalog.guestTag.open'),
		}),
		[tShared]
	);

	return (
		<p>
			<span className="font-semibold">{t('items.source.from')}</span>
			{getSourceEntries<IGeneralItem['from']>(from).map(
				(source, index) => (
					<Fragment key={index}>
						{index > 0 && t('items.source.listSeparator')}
						<GeneralItemSource
							source={source}
							openWindow={openWindow}
							tag={sourceTag}
						/>
						{'collaboration' in source && (
							<CollaborationMapLink itemId={id} />
						)}
						{'schedulerLabel' in source && (
							<TaskMapLinks
								itemId={id}
								task={source.schedulerLabel}
							/>
						)}
						{'taskReward' in source && (
							<TaskMapLinks
								itemId={id}
								task={source.taskReward}
							/>
						)}
					</Fragment>
				)
			)}
		</p>
	);
}
