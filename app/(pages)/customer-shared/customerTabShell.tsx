import { type ReactNode, memo } from 'react';
import { debounce } from 'lodash';

import { Button, ScrollShadow, cn } from '@/design/ui/components';

import PressElement from '@/components/pressElement';

import type { ICustomerTabStyle } from '@/(pages)/customer-shared/types';
import { checkA11yConfirmKey } from '@/utilities';

interface IProps<TItemName extends string> {
	currentCustomerName: TItemName | null;
	customerTabStyle: ICustomerTabStyle;
	onSelect: (name: TItemName) => void;
	onToggleVisibility: () => void;
	renderAvatar: (name: TItemName) => ReactNode;
	sortedData: ReadonlyArray<{ name: TItemName }>;
}

export default memo(function CustomerTabShell<TItemName extends string>({
	currentCustomerName,
	customerTabStyle,
	onSelect,
	onToggleVisibility,
	renderAvatar,
	sortedData,
}: IProps<TItemName>) {
	return (
		<>
			<ScrollShadow
				className={cn(
					'transition-all motion-reduce:transition-none xl:max-h-[calc(var(--safe-h-dvh)-10.25rem-env(titlebar-area-height,0rem))]',
					customerTabStyle.classNames.content
				)}
			>
				<div className="m-2 grid grid-cols-fill-16 justify-around gap-4 lg:grid-cols-fill-20">
					{sortedData.map(({ name }) => (
						<PressElement
							key={name}
							as="div"
							onPress={() => {
								onSelect(name);
							}}
							title={`点击：选择【${name}】`}
							className="group flex cursor-pointer flex-col items-center gap-1"
						>
							{renderAvatar(name)}
							<span
								className={cn(
									'whitespace-nowrap text-tiny text-default-800 transition-colors group-hover:text-default-900 motion-reduce:transition-none',
									{
										'text-default-900':
											name === currentCustomerName,
									}
								)}
							>
								{name}
							</span>
						</PressElement>
					))}
				</div>
			</ScrollShadow>
			<div className="flex justify-center xl:hidden">
				<Button
					isIconOnly
					size="sm"
					variant="flat"
					onClick={onToggleVisibility}
					onKeyDown={debounce(
						checkA11yConfirmKey(onToggleVisibility)
					)}
					aria-label={customerTabStyle.ariaLabel}
					className="h-4 w-4/5 text-default-400"
				>
					{customerTabStyle.buttonNode}
				</Button>
			</div>
		</>
	);
}) as <TItemName extends string>(props: IProps<TItemName>) => ReactNode;
