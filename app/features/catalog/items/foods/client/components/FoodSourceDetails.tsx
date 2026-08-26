import isObject from 'lodash/isObject.js';
import { Fragment } from 'react';

import Tooltip from '@/design/ui/components/tooltip';

import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import type { TCurrencyItemId } from '@/domain/data/currencyItems/types';
import type { IFood } from '@/domain/data/foods/schema';
import { COLLABORATION_LABEL_MAP } from '@/domain/data/labels/collaborationFacts';
import { MAP_FACTS } from '@/domain/data/places/placeFacts';

import { formatSourceReference } from '@/features/catalog/items/shared/sourceReferenceFormatting';
import Price from '@/features/catalog/shared/client/components/Price';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import {
	type TItemRoutePath,
	type TShareableItemId,
	type TShareableItemName,
} from '@/features/itemSharing/contracts';

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
	const currencyItemName = currencyItemCatalog.getPropsById(
		currencyItem,
		'name'
	);
	const actionLabel = `点击：在新窗口中查看货币【${currencyItemName}】的详情`;

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
	let details;

	if ('self' in from) {
		details = '初始拥有';
	} else if ('bond' in from) {
		const { level, specialGuest } = from.bond;
		const specialGuestName = specialGuestCatalog.getPropsById(
			specialGuest,
			'name'
		);
		details = (
			<>
				<span className="mr-1 inline-flex items-center">
					【
					<Sprite
						target="special_guest"
						recordId={specialGuest}
						size={1.25}
						className="mx-0.5 rounded-full"
					/>
					{specialGuestName}】羁绊
				</span>
				Lv.{level - 1}
				<span className="mx-0.5">➞</span>
				Lv.{level}
			</>
		);
	} else if ('buy' in from) {
		const { merchant, price } = from.buy;
		const isNoPrice = price === null;
		const merchantName = formatSourceReference(merchant);
		details = (
			<>
				{isNoPrice ? '出售于' : null}
				{merchantName}
				{isNoPrice ? null : '（'}
				{isObject(price) ? (
					<CurrencyItemPrice
						amount={price.amount}
						currencyItem={price.currencyItem}
						openWindow={openWindow}
					/>
				) : isNoPrice ? null : (
					<Price>{price}</Price>
				)}
				{isNoPrice ? null : '）'}
			</>
		);
	} else if ('levelup' in from) {
		const { level, map } = from.levelup;
		details = (
			<>
				<span className="mr-1">游戏等级</span>
				Lv.{level - 1}
				<span className="mx-0.5">➞</span>
				Lv.{level}
				{map !== null && (
					<span className="ml-0.5">
						且已解锁地区【{MAP_FACTS[map].label}】
					</span>
				)}
			</>
		);
	} else if ('areaTask' in from) {
		const { areaTask } = from;
		const specialGuestSuffix =
			'specialGuest' in areaTask
				? `（${specialGuestCatalog.getPropsById(areaTask.specialGuest, 'name')}）`
				: '';
		details = `地区【${MAP_FACTS[areaTask.map].label}】${areaTask.task}${specialGuestSuffix}`;
	} else if ('collaboration' in from) {
		const collaborationLabel =
			COLLABORATION_LABEL_MAP[from.collaboration.collaborationLabel];
		details = from.collaboration.merchants
			.map(({ merchant, platformLabel }, index) => {
				const merchantName =
					index === 0 && 'map' in merchant
						? `【${MAP_FACTS[merchant.map].label}“${collaborationLabel}”联动】${formatSourceReference(merchant).replace(/^【[^】]+】/u, '')}`
						: formatSourceReference(merchant);
				return `${merchantName}（${platformLabel}）`;
			})
			.join('、');
	} else {
		details = [
			...from.failedCooking.causeLabels,
			...from.failedCooking.punishmentSpellCardSpecialGuests.map(
				(specialGuest) =>
					`【${specialGuestCatalog.getPropsById(specialGuest, 'name')}】惩罚符卡`
			),
		].join('、');
	}

	return (
		<Fragment>
			<p className="break-all text-justify">
				<span className="font-semibold">食谱来源：</span>
				{details}
			</p>
		</Fragment>
	);
}
