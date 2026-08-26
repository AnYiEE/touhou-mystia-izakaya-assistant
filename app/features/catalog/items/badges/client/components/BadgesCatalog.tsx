import { cn } from '@heroui/theme';
import useBreakpoint from 'use-breakpoint';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';

import type { BadgeCatalog } from '@/domain/catalog/items/BadgeCatalog';

import CollectibleCatalog from '@/features/catalog/items/collectibles/client/components/CollectibleCatalog';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import type { TItemData } from '@/features/catalog/shared/contracts';

export default function BadgesCatalog({
	data,
}: {
	data: TItemData<BadgeCatalog>;
}) {
	const { breakpoint: placement } = useBreakpoint(
		{ 'right-start': 426, top: -1 },
		'top'
	);

	return (
		<CollectibleCatalog
			data={data}
			target="badge"
			trackingLabel="Badge Card"
			descriptionLabel="获取条件"
		>
			{({ id, name }) => (
				<p>
					<span className="font-semibold">大图：</span>
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
								查看大图
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
