import { Fragment } from 'react';

import Tooltip from '@/design/ui/components/tooltip';

import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import type { RecordItemCatalog } from '@/domain/catalog/items/RecordItemCatalog';
import { MERCHANT_LABEL_MAP } from '@/domain/data/places/merchantFacts';

import CollectibleCatalog from '@/features/catalog/items/collectibles/client/components/CollectibleCatalog';
import Price from '@/features/catalog/shared/client/components/Price';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import type { TItemData } from '@/features/catalog/shared/contracts';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';

const currencyItemCatalog = CurrencyItemCatalog.getInstance();

export default function RecordsCatalog({
	data,
}: {
	data: TItemData<RecordItemCatalog>;
}) {
	const openWindow = useViewInNewWindow();

	return (
		<CollectibleCatalog
			data={data}
			target="record"
			trackingLabel="Record Card"
		>
			{({ buy, composer, original, trackName }) => (
				<>
					<p>
						<span className="font-semibold">曲名：</span>
						{trackName}
					</p>
					<p>
						<span className="font-semibold">原曲：</span>
						{original}
					</p>
					<p>
						<span className="font-semibold">编曲：</span>
						{composer}
					</p>
					<p>
						<span className="font-semibold">来源：</span>
						{MERCHANT_LABEL_MAP[buy.merchant]}（
						{buy.prices.map(({ amount, currencyItem }, index) => (
							<Fragment key={currencyItem}>
								{index > 0 && '、'}
								<span className="inline-flex items-center">
									<Price showSymbol={false}>{amount}×</Price>
									<Tooltip
										showArrow
										content={`点击：在新窗口中查看货币【${currencyItemCatalog.getPropsById(currencyItem, 'name')}】的详情`}
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
													currencyItemCatalog.getPropsById(
														currencyItem,
														'name'
													)
												);
											}}
											aria-label={`点击：在新窗口中查看货币【${currencyItemCatalog.getPropsById(currencyItem, 'name')}】的详情`}
											role="button"
										/>
									</Tooltip>
								</span>
							</Fragment>
						))}
						）
					</p>
				</>
			)}
		</CollectibleCatalog>
	);
}
