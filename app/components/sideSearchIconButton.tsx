'use client';

import { type Dispatch, type SetStateAction, memo, useCallback } from 'react';

import { useVibrate } from '@/hooks';

import {
	Autocomplete,
	AutocompleteItem,
	type AutocompleteProps,
} from '@heroui/autocomplete';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	cn,
	useMotionProps,
	useReducedMotion,
} from '@/design/ui/components';

import FontAwesomeIconButton, {
	type IFontAwesomeIconButtonProps,
} from '@/components/fontAwesomeIconButton';
import Sprite from '@/components/sprite';

import { type TItemName } from '@/data';
import { globalStore as store } from '@/stores';
import type { TSpriteTarget } from '@/utils/sprite/types';

export interface ISearchConfig {
	label: AutocompleteProps['label'];
	searchItems: ValueCollection[];
	searchValue: string;
	setSearchValue: Dispatch<SetStateAction<ISearchConfig['searchValue']>>;
	spriteTarget?: TSpriteTarget;
}

interface IProps extends Omit<
	IFontAwesomeIconButtonProps,
	'aria-label' | 'color' | 'icon' | 'variant' | 'onPress'
> {
	searchConfig: ISearchConfig;
}

export default memo<IProps>(function SideSearchIconButton({
	className,
	searchConfig: {
		label,
		searchItems,
		searchValue,
		setSearchValue,
		spriteTarget,
	},
	...props
}) {
	const selectMotionProps = useMotionProps('select');
	const isReducedMotion = useReducedMotion();
	const vibrate = useVibrate();

	const isHighAppearance = store.persistence.highAppearance.use();

	const handleInputChange = useCallback(
		(value: string) => {
			vibrate(!value);
			setSearchValue(value);
		},
		[setSearchValue, vibrate]
	);

	const content = `搜索（${searchValue ? '已' : '未'}激活）`;

	return (
		<Popover
			shouldBlockScroll
			/** @todo Add it back after {@link https://github.com/heroui-inc/heroui/issues/3736} is fixed. */
			// backdrop="opaque"
			placement="left"
			onOpenChange={vibrate}
		>
			<Tooltip showArrow content={content} placement="left">
				<span className="flex">
					<PopoverTrigger>
						<FontAwesomeIconButton
							color={searchValue ? 'warning' : 'primary'}
							icon={faMagnifyingGlass}
							variant="shadow"
							aria-label={content}
							className={cn(
								searchValue
									? 'bg-warning-600'
									: 'bg-primary-600',
								className
							)}
							{...props}
						/>
					</PopoverTrigger>
				</span>
			</Tooltip>
			<PopoverContent className="w-64">
				<Autocomplete
					allowsCustomValue
					defaultItems={searchItems}
					disableAnimation={isReducedMotion}
					inputValue={searchValue}
					isVirtualized={false}
					label={label}
					variant="flat"
					onInputChange={handleInputChange}
					popoverProps={{
						motionProps: selectMotionProps,
						shouldCloseOnScroll: false,
					}}
					classNames={{
						base: isHighAppearance
							? 'data-[slot="input-wrapper"]:[&_div]:!bg-default/40 data-[slot="input-wrapper"]:data-[hover=true]:[&_div]:!bg-default-400/40'
							: 'data-[slot="input-wrapper"]:[&_div]:!bg-default-200 data-[slot="input-wrapper"]:data-[hover=true]:[&_div]:!bg-default',
						clearButton: isHighAppearance
							? 'data-[hover=true]:bg-default/40'
							: 'data-[hover=true]:bg-default-400 [&+button[data-hover=true]]:bg-default-400',
						listboxWrapper: cn(
							'[&_li]:transition-background motion-reduce:[&_li]:transition-none',
							{
								'data-[hover=true]:[&_li]:!bg-default/40':
									isHighAppearance,
							}
						),
						popoverContent: cn({
							'bg-content1/70 backdrop-blur-lg': isHighAppearance,
						}),
					}}
				>
					{({ value }) =>
						spriteTarget ? (
							<AutocompleteItem
								key={value}
								textValue={value}
								classNames={{ base: '[&>span]:inline-flex' }}
							>
								<span className="inline-flex items-center">
									{spriteTarget === 'customer_normal' ? (
										<div className="h-6 w-6 overflow-hidden rounded-full">
											<Sprite
												target={spriteTarget}
												name={value as TItemName}
												size={2.15}
												className="-translate-x-[0.315rem] -translate-y-px"
											/>
										</div>
									) : spriteTarget === 'customer_rare' ||
									  spriteTarget === 'partner' ? (
										<Sprite
											target={spriteTarget}
											name={value as TItemName}
											size={1.5}
											className="rounded-full"
										/>
									) : (
										<Sprite
											target={spriteTarget}
											name={value as TItemName}
											size={1}
										/>
									)}
									<span className="ml-1">{value}</span>
								</span>
							</AutocompleteItem>
						) : (
							<AutocompleteItem key={value}>
								{value}
							</AutocompleteItem>
						)
					}
				</Autocomplete>
			</PopoverContent>
		</Popover>
	);
});
