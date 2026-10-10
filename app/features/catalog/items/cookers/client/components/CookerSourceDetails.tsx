import { Fragment } from 'react';

import Tooltip from '@/design/ui/components/tooltip';

import { formatMerchantReference } from '@/domain/availability/sourceResolvers';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import type { ICooker, TCookerSource } from '@/domain/data/cookers/schema';
import type { TCookerId } from '@/domain/data/cookers/types';
import { formatSchedulerLabels } from '@/domain/data/labels/schedulerFacts';

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
	from: ICooker['from'];
	openWindow: (
		path: TItemRoutePath,
		recordId: TShareableItemId,
		name: TShareableItemName
	) => void;
}

type TCookerPricePart = Extract<
	TCookerSource,
	{ buy: unknown }
>['buy']['price'][number];

type TCookerItemPrice = Extract<
	TCookerPricePart,
	{ cooker: unknown }
>['cooker'];
type TCurrencyItemPrice = Extract<
	TCookerPricePart,
	{ currencyItem: unknown }
>['currencyItem'];

function renderCurrencyItemPrice(
	price: TCurrencyItemPrice,
	openWindow: IProps['openWindow'],
	t: TCatalogItemsTranslate
) {
	const { amount, currencyItem } = price;
	const currencyItemName =
		CurrencyItemCatalog.getInstance().getDisplayPropsById(
			currencyItem,
			'name'
		);
	return (
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
	);
}

function renderCookerItemPrice(
	price: TCookerItemPrice,
	openWindow: IProps['openWindow'],
	t: TCatalogItemsTranslate
) {
	const { amount, cooker } = price;
	const cookerId = cooker as TCookerId;
	const cookerName = CookerCatalog.getInstance().getDisplayPropsById(
		cookerId,
		'name'
	);
	return (
		<span className="inline-flex items-center">
			<Price showSymbol={false}>{amount}×</Price>
			<Tooltip
				showArrow
				content={t('items.source.actionCooker', { label: cookerName })}
				offset={1}
				size="sm"
			>
				<Sprite
					target="cooker"
					recordId={cookerId}
					size={1.25}
					onPress={() => {
						openWindow('cookers', cookerId, cookerName);
					}}
					aria-label={t('items.source.actionCooker', {
						label: cookerName,
					})}
					role="button"
				/>
			</Tooltip>
		</span>
	);
}

function renderCookerSource(
	item: TCookerSource,
	fromIndex: number,
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
		return (
			<>
				{formatMerchantReference(item.buy.merchant)}
				{t('items.source.parenthesisOpen')}
				{item.buy.price.map((priceItem, priceIndex) => (
					<Fragment key={`${fromIndex}-0-${priceIndex}`}>
						{priceIndex > 0 && <span className="mx-1">+</span>}
						{'money' in priceItem ? (
							<Price>{priceItem.money.amount}</Price>
						) : 'cooker' in priceItem ? (
							renderCookerItemPrice(
								priceItem.cooker,
								openWindow,
								t
							)
						) : (
							renderCurrencyItemPrice(
								priceItem.currencyItem,
								openWindow,
								t
							)
						)}
					</Fragment>
				))}
				{t('items.source.parenthesisClose')}
			</>
		);
	}

	if ('dlcSideTask' in item) {
		return t('items.source.dlcSideTask', {
			dlc: item.dlcSideTask.dlc,
			task: item.dlcSideTask.task,
		});
	}

	return t('items.source.afterCompetition', {
		label: formatSchedulerLabels(item.competitionReward.competitionLabel),
	});
}

export default function CookerSourceDetails({ from, openWindow }: IProps) {
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
					{renderCookerSource(item, fromIndex, openWindow, t)}
				</Fragment>
			))}
		</p>
	);
}
