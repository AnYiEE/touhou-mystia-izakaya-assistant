import { Fragment } from 'react';

import Tooltip from '@/design/ui/components/tooltip';

import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import type { IGeneralItem } from '@/domain/data/generalItems/schema';
import { COLLABORATION_LABEL_MAP } from '@/domain/data/labels/collaborationFacts';
import {
	SCHEDULER_FACTS,
	formatSchedulerLabels,
	formatTaskLabel,
} from '@/domain/data/labels/schedulerFacts';
import { MAP_FACTS } from '@/domain/data/places/placeFacts';

import Price from '@/features/catalog/shared/client/components/Price';
import SpecialGuestBondReference from '@/features/catalog/shared/client/components/SpecialGuestBondReference';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import type {
	TItemRoutePath,
	TShareableItemId,
	TShareableItemName,
} from '@/features/itemSharing/contracts';

interface IProps {
	from: IGeneralItem['from'];
	openWindow: (
		path: TItemRoutePath,
		recordId: TShareableItemId,
		name: TShareableItemName
	) => void;
}

const currencyItemCatalog = CurrencyItemCatalog.getInstance();
const specialGuestCatalog = SpecialGuestCatalog.getInstance();

function renderSpecialGuest(
	specialGuest: Parameters<typeof specialGuestCatalog.getPropsById>[0]
) {
	const specialGuestName = specialGuestCatalog.getPropsById(
		specialGuest,
		'name'
	);
	return (
		<span className="mr-1 inline-flex items-center">
			【
			<Sprite
				target="special_guest"
				recordId={specialGuest}
				size={1.25}
				className="mx-0.5 rounded-full"
			/>
			{specialGuestName}】
		</span>
	);
}

function GeneralItemSource({
	openWindow,
	source,
}: {
	openWindow: IProps['openWindow'];
	source: IGeneralItem['from'][number];
}) {
	if ('areaTask' in source) {
		return `地区【${MAP_FACTS[source.areaTask.map].label}】${source.areaTask.task}`;
	}

	if ('collaborationUnlock' in source) {
		return `通过联动终端【${COLLABORATION_LABEL_MAP[source.collaborationUnlock.collaborationLabel]}】选项领取`;
	}

	if ('holdingCurrencyItem' in source) {
		const { amount, currencyItem } = source.holdingCurrencyItem;
		const currencyItemName = currencyItemCatalog.getPropsById(
			currencyItem,
			'name'
		);
		const actionLabel = `点击：在新窗口中查看货币【${currencyItemName}】的详情`;
		return (
			<>
				持有
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
				时自动获得
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
		return `任务${formatTaskLabel(formatSchedulerLabels(source.taskReward))}`;
	}

	return <>{renderSpecialGuest(source.positiveSpellCard)}奖励符卡</>;
}

export default function GeneralItemSourceDetails({ from, openWindow }: IProps) {
	return (
		<p>
			<span className="font-semibold">来源：</span>
			{from.map((source, index) => (
				<Fragment key={index}>
					{index > 0 && '、'}
					<GeneralItemSource
						source={source}
						openWindow={openWindow}
					/>
				</Fragment>
			))}
		</p>
	);
}
