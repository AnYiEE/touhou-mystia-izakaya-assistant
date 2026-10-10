import { cn } from '@heroui/theme';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import { useBreakpoint } from '@/design/ui/hooks/useBreakpoint';

import type { BadgeCatalog } from '@/domain/catalog/items/BadgeCatalog';

import CollectibleCatalog from '@/features/catalog/items/collectibles/client/components/CollectibleCatalog';
import { catalogItemsMessages } from '@/features/catalog/items/shared/messages';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import type { TItemData } from '@/features/catalog/shared/contracts';

import { useI18n } from '@/shared/i18n/useI18n';

export default function BadgesCatalog({
	data,
}: {
	data: TItemData<BadgeCatalog>;
}) {
	const { t } = useI18n(catalogItemsMessages);
	const { breakpoint: placement } = useBreakpoint(
		{ 'right-start': 426, top: -1 },
		'top'
	);

	return (
		<CollectibleCatalog
			data={data}
			target="badge"
			trackingLabel="Badge Card"
			descriptionLabel={t('items.source.obtainConditions')}
		>
			{({ id, name }) => (
				<p>
					<span className="font-semibold">
						{t('items.source.largeImage')}
					</span>
					<Popover
						placement={placement}
						showArrow={placement === 'top'}
					>
						<PopoverTrigger>
							<span
								role="button"
								tabIndex={0}
								className={cn(
									'underline-dotted-offset2',
									CLASSNAME_FOCUS_VISIBLE_OUTLINE
								)}
							>
								{t('items.source.viewLargeImage')}
							</span>
						</PopoverTrigger>
						<PopoverContent>
							<Sprite
								target="badge"
								recordId={id}
								size={8.25}
								title={name}
							/>
						</PopoverContent>
					</Popover>
				</p>
			)}
		</CollectibleCatalog>
	);
}
