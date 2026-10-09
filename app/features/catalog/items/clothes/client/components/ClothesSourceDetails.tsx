import { Fragment } from 'react';

import Tooltip from '@/design/ui/components/tooltip';

import { formatMerchantReference } from '@/domain/availability/sourceResolvers';
import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import type { IClothes, TClothesSource } from '@/domain/data/clothes/schema';
import { COLLABORATION_LABEL_MAP } from '@/domain/data/labels/collaborationFacts';
import {
	formatSchedulerLabels,
	formatTaskLabel,
} from '@/domain/data/labels/schedulerFacts';

import Price from '@/features/catalog/shared/client/components/Price';
import SpecialGuestBondReference from '@/features/catalog/shared/client/components/SpecialGuestBondReference';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import {
	type TItemRoutePath,
	type TShareableItemId,
	type TShareableItemName,
} from '@/features/itemSharing/contracts';

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
	openWindow: IProps['openWindow']
) {
	if ('self' in item) {
		return '初始拥有';
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
		const currencyItemName = CurrencyItemCatalog.getInstance().getPropsById(
			currencyItem,
			'name'
		);
		return (
			<>
				{formatMerchantReference(item.buy.merchant)}（
				<span className="inline-flex items-center">
					<Price showSymbol={false}>{amount}×</Price>
					<Tooltip
						showArrow
						content={`点击：在新窗口中查看货币【${currencyItemName}】的详情`}
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
							aria-label={`点击：在新窗口中查看货币【${currencyItemName}】的详情`}
							role="button"
						/>
					</Tooltip>
				</span>
				）
			</>
		);
	}

	if ('holdingRequirement' in item) {
		const { amount, currencyItem } = item.holdingRequirement;
		const currencyItemName = CurrencyItemCatalog.getInstance().getPropsById(
			currencyItem,
			'name'
		);
		return `持有${amount}枚“${currencyItemName}”时自动获得`;
	}

	if ('eventReward' in item) {
		return `${formatSchedulerLabels(item.eventReward.eventLabel)}时自动获得`;
	}

	if ('collaborationUnlock' in item) {
		return `通过联动终端【${COLLABORATION_LABEL_MAP[item.collaborationUnlock.collaborationLabel]}】选项领取`;
	}

	return `任务${formatTaskLabel(formatSchedulerLabels(item.taskReward.task))}`;
}

export default function ClothesSourceDetails({ from, openWindow }: IProps) {
	if (checkObjectOrStringEmpty(from)) {
		return null;
	}

	return (
		<p className="break-all text-justify">
			<span className="font-semibold">来源：</span>
			{from.map((item, fromIndex) => (
				<Fragment key={fromIndex}>
					{fromIndex > 0 && '、'}
					{renderClothesSource(item, openWindow)}
				</Fragment>
			))}
		</p>
	);
}
