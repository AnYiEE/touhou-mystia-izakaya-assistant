import { Fragment } from 'react';

import Tooltip from '@/design/ui/components/tooltip';

import { formatMerchantReference } from '@/domain/availability/sourceResolvers';
import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import type { IClothes, TClothesSource } from '@/domain/data/clothes/schema';
import {
	formatSchedulerLabels,
	formatTaskLabel,
} from '@/domain/data/labels/schedulerFacts';
import { getCollaborationLabel } from '@/domain/labels/localizedCollaborationLabels';

import {
	type TCatalogItemsTranslate,
	catalogItemsMessages,
} from '@/features/catalog/items/shared/messages';
import Price from '@/features/catalog/shared/client/components/Price';
import SpecialGuestBondReference from '@/features/catalog/shared/client/components/SpecialGuestBondReference';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import {
	type TItemRoutePath,
	type TShareableItemId,
	type TShareableItemName,
} from '@/features/itemSharing/contracts';

import { useI18n } from '@/shared/i18n/useI18n';
import { checkObjectOrStringEmpty } from '@/shared/utilities/collections/check';

interface IProps {
	from: IClothes['from'];
	openWindow: (
		path: TItemRoutePath,
		recordId: TShareableItemId,
		name: TShareableItemName
	) => void;
}

function renderClothesSource(
	item: TClothesSource,
	openWindow: IProps['openWindow'],
	t: TCatalogItemsTranslate
) {
	if ('self' in item) {
		return t('items.source.initialOwned');
	}

	if ('bond' in item) {
		const { level, specialGuest } = item.bond;
		return (
			<SpecialGuestBondReference
				level={level}
				specialGuest={specialGuest}
			/>
		);
	}

	if ('buy' in item) {
		const { amount, currencyItem } = item.buy.price.currencyItem;
		const currencyItemName =
			CurrencyItemCatalog.getInstance().getDisplayPropsById(
				currencyItem,
				'name'
			);
		return (
			<>
				{formatMerchantReference(item.buy.merchant)}
				{t('items.source.parenthesisOpen')}
				<span className="inline-flex items-center">
					<Price showSymbol={false}>{amount}×</Price>
					<Tooltip
						showArrow
						content={t('items.source.actionCurrency', {
							label: currencyItemName,
						})}
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
							aria-label={t('items.source.actionCurrency', {
								label: currencyItemName,
							})}
							role="button"
						/>
					</Tooltip>
				</span>
				{t('items.source.parenthesisClose')}
			</>
		);
	}

	if ('holdingRequirement' in item) {
		const { amount, currencyItem } = item.holdingRequirement;
		const currencyItemName =
			CurrencyItemCatalog.getInstance().getDisplayPropsById(
				currencyItem,
				'name'
			);
		return t('items.source.autoObtainedHolding', {
			amount,
			currency: currencyItemName,
		});
	}

	if ('eventReward' in item) {
		return t('items.source.autoObtainedOnEvent', {
			event: formatSchedulerLabels(item.eventReward.eventLabel),
		});
	}

	if ('collaborationUnlock' in item) {
		return t('items.source.collaborationTerminal', {
			label: getCollaborationLabel(
				item.collaborationUnlock.collaborationLabel
			),
		});
	}

	return t('items.source.task', {
		label: formatTaskLabel(formatSchedulerLabels(item.taskReward.task)),
	});
}

export default function ClothesSourceDetails({ from, openWindow }: IProps) {
	const { t } = useI18n(catalogItemsMessages);

	if (checkObjectOrStringEmpty(from)) {
		return null;
	}

	return (
		<p className="break-all text-justify">
			<span className="font-semibold">{t('items.source.from')}</span>
			{from.map((item, fromIndex) => (
				<Fragment key={fromIndex}>
					{fromIndex > 0 && t('items.source.listSeparator')}
					{renderClothesSource(item, openWindow, t)}
				</Fragment>
			))}
		</p>
	);
}
