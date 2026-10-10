import isObject from 'lodash/isObject.js';
import { Fragment } from 'react';

import Tooltip from '@/design/ui/components/tooltip';

import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import type { TCurrencyItemId } from '@/domain/data/currencyItems/types';
import type { IFood } from '@/domain/data/foods/schema';
import {
	formatSchedulerLabels,
	formatTaskLabel,
} from '@/domain/data/labels/schedulerFacts';
import { getCollaborationLabel } from '@/domain/labels/localizedCollaborationLabels';
import { getMapLabel } from '@/domain/places/localizedLabels';

import {
	CATALOG_ITEMS_CAUSE_LABEL_MESSAGE_KEYS,
	catalogItemsMessages,
} from '@/features/catalog/items/shared/messages';
import { formatSourceReference } from '@/features/catalog/items/shared/sourceReferenceFormatting';
import Price from '@/features/catalog/shared/client/components/Price';
import SpecialGuestBondReference from '@/features/catalog/shared/client/components/SpecialGuestBondReference';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import {
	type TItemRoutePath,
	type TShareableItemId,
	type TShareableItemName,
} from '@/features/itemSharing/contracts';

import { useI18n } from '@/shared/i18n/useI18n';

interface IProps {
	from: IFood['from'];
	openWindow: (
		path: TItemRoutePath,
		recordId: TShareableItemId,
		name: TShareableItemName
	) => void;
}

const currencyItemCatalog = CurrencyItemCatalog.getInstance();
const specialGuestCatalog = SpecialGuestCatalog.getInstance();

function CurrencyItemPrice({
	amount,
	currencyItem,
	openWindow,
}: {
	amount: number;
	currencyItem: TCurrencyItemId;
	openWindow: IProps['openWindow'];
}) {
	const currencyItemName = currencyItemCatalog.getDisplayPropsById(
		currencyItem,
		'name'
	);
	const { t } = useI18n(catalogItemsMessages);
	const actionLabel = t('items.source.actionCurrency', {
		label: currencyItemName,
	});

	return (
		<span className="inline-flex items-center">
			<Price showSymbol={false}>{amount}×</Price>
			<Tooltip showArrow content={actionLabel} offset={1} size="sm">
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
	);
}

export default function FoodSourceDetails({ from, openWindow }: IProps) {
	const { locale, t } = useI18n(catalogItemsMessages);
	let details;

	if ('self' in from) {
		details = t('items.source.initialOwned');
	} else if ('areaTask' in from) {
		const { areaTask } = from;
		const specialGuestSuffix =
			'specialGuest' in areaTask
				? t('items.source.guestSuffix', {
						name: specialGuestCatalog.getDisplayPropsById(
							areaTask.specialGuest,
							'name'
						),
					})
				: '';
		details = `${t('items.source.areaTask', {
			map: getMapLabel(areaTask.map),
			task: areaTask.task,
		})}${specialGuestSuffix}`;
	} else if ('bond' in from) {
		const { level, specialGuest } = from.bond;
		details = (
			<SpecialGuestBondReference
				level={level}
				specialGuest={specialGuest}
			/>
		);
	} else if ('buy' in from) {
		const { merchant, price } = from.buy;
		const isNoPrice = price === null;
		const merchantName = formatSourceReference(merchant, locale);
		details = (
			<>
				{isNoPrice ? t('items.source.soldAt') : null}
				{merchantName}
				{isNoPrice ? null : t('items.source.parenthesisOpen')}
				{isObject(price) ? (
					<CurrencyItemPrice
						amount={price.amount}
						currencyItem={price.currencyItem}
						openWindow={openWindow}
					/>
				) : isNoPrice ? null : (
					<Price>{price}</Price>
				)}
				{isNoPrice ? null : t('items.source.parenthesisClose')}
			</>
		);
	} else if ('collaboration' in from) {
		const collaborationLabel = getCollaborationLabel(
			from.collaboration.collaborationLabel
		);
		details = from.collaboration.merchants
			.map(({ merchant, platformLabel }, index) => {
				const merchantName =
					index === 0 && 'map' in merchant
						? t('items.source.collaborationSource', {
								collaboration: collaborationLabel,
								label: formatSourceReference(merchant, locale, {
									omitMap: true,
								}),
								map: getMapLabel(merchant.map),
							})
						: formatSourceReference(merchant, locale);
				return `${merchantName}${t('items.source.parenthesisOpen')}${platformLabel}${t('items.source.parenthesisClose')}`;
			})
			.join(t('items.source.listSeparator'));
	} else if ('levelup' in from) {
		const { level, map } = from.levelup;
		details = (
			<>
				<span className="mr-1">{t('items.source.gameLevel')}</span>
				Lv.{level - 1}
				<span className="mx-0.5">➞</span>
				Lv.{level}
				{map !== null && (
					<span className="ml-0.5">
						{t('items.source.andUnlockedMap', {
							map: getMapLabel(map),
						})}
					</span>
				)}
			</>
		);
	} else if ('taskReward' in from) {
		details = t('items.source.task', {
			label: formatTaskLabel(formatSchedulerLabels(from.taskReward.task)),
		});
	} else {
		details = [
			...from.failedCooking.causeLabels.map((label) => {
				const key = CATALOG_ITEMS_CAUSE_LABEL_MESSAGE_KEYS[label];
				return key === undefined ? label : t(key);
			}),
			...from.failedCooking.punishmentSpellCardSpecialGuests.map(
				(specialGuest) =>
					t('items.source.punishmentSpellCard', {
						name: specialGuestCatalog.getDisplayPropsById(
							specialGuest,
							'name'
						),
					})
			),
		].join(t('items.source.listSeparator'));
	}

	return (
		<Fragment>
			<p className="break-all text-justify">
				<span className="font-semibold">
					{t('items.source.recipeFrom')}
				</span>
				{details}
			</p>
		</Fragment>
	);
}
