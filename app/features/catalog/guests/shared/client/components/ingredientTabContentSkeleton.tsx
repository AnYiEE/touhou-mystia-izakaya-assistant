import { cn } from '@heroui/theme';
import { type PropsWithChildren, type ReactNode, memo } from 'react';

import Button from '@/design/ui/components/button';
import ScrollShadow from '@/design/ui/components/scrollShadow';

import type { IIngredientsTabStyle } from '@/features/catalog/guests/shared/contracts';
import { catalogGuestsMessages } from '@/features/catalog/guests/shared/messages';

import { useI18n } from '@/shared/i18n/useI18n';

interface IProps {
	afterMainGrid?: ReactNode;
	ingredientTabStyle: IIngredientsTabStyle;
	onToggle: () => void;
}

export default memo<PropsWithChildren<IProps>>(
	function IngredientTabContentSkeleton({
		afterMainGrid,
		children,
		ingredientTabStyle,
		onToggle,
	}) {
		const { t } = useI18n(catalogGuestsMessages);

		return (
			<>
				<ScrollShadow
					className={cn(
						'px-2 transition-all motion-reduce:transition-none xl:max-h-[calc(var(--safe-h-dvh)-10.25rem-env(titlebar-area-height,0rem))]',
						ingredientTabStyle.classNames.content
					)}
				>
					<div className="m-2 grid grid-cols-fill-12 justify-around gap-4">
						{children}
					</div>
					{afterMainGrid}
				</ScrollShadow>
				<div className="flex justify-center xl:hidden">
					<Button
						isIconOnly
						size="sm"
						variant="flat"
						onClick={onToggle}
						aria-label={t(ingredientTabStyle.ariaLabelKey)}
						className="h-4 w-4/5 text-default-400"
					>
						{ingredientTabStyle.buttonNode}
					</Button>
				</div>
			</>
		);
	}
);
