'use client';

import {type Dispatch, type SetStateAction, memo, useCallback} from 'react';

import {useMotionProps, useVibrate} from '@/hooks';

import {
	Autocomplete,
	AutocompleteItem,
	type AutocompleteProps,
	PopoverContent,
	PopoverTrigger,
	cn,
} from '@nextui-org/react';
import {faMagnifyingGlass} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconButton, {type IFontAwesomeIconButtonProps} from '@/components/fontAwesomeIconButton';
import Popover from '@/components/popover';
import Sprite from '@/components/sprite';
import Tooltip from '@/components/tooltip';

import {globalStore as store} from '@/stores';
import type {TSpriteTarget} from '@/utils/sprite/types';

export interface ISearchConfig {
	label: AutocompleteProps['label'];
	searchItems: {
		value: string;
	}[];
	searchValue: string;
	setSearchValue: Dispatch<SetStateAction<ISearchConfig['searchValue']>>;
	spriteTarget?: TSpriteTarget;
}

interface IProps extends Omit<IFontAwesomeIconButtonProps, 'aria-label' | 'color' | 'icon' | 'variant' | 'onPress'> {
	searchConfig: ISearchConfig;
}

export default memo<IProps>(function SideSearchIconButton({
	className,
	searchConfig: {label, searchItems, searchValue, setSearchValue, spriteTarget},
	...props
}) {
	const selectMotionProps = useMotionProps('select');
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
			/** @todo Add it back after {@link https://github.com/nextui-org/nextui/issues/3736} is fixed. */
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
							className={cn('text-white', className)}
							{...props}
						/>
					</PopoverTrigger>
				</span>
			</Tooltip>
			<PopoverContent className="w-64">
				<Autocomplete
					allowsCustomValue
					defaultItems={searchItems}
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
							? 'data-[slot="input-wrapper"]:[&_div]:!bg-default-100/70 data-[slot="input-wrapper"]:data-[hover=true]:[&_div]:!bg-default-200/70'
							: 'data-[slot="input-wrapper"]:data-[hover=true]:[&_div]:bg-default-200',
						listboxWrapper: cn('[&_li]:transition-background', {
							'data-[hover=true]:[&_li]:!bg-default-200/40': isHighAppearance,
						}),
						popoverContent: cn({
							'bg-content1/70 backdrop-blur-lg': isHighAppearance,
						}),
					}}
				>
					{({value}) =>
						spriteTarget ? (
							<AutocompleteItem
								key={value}
								textValue={value}
								classNames={{
									base: '[&>span]:inline-flex',
								}}
							>
								<span className="inline-flex items-center">
									{spriteTarget.startsWith('customer') ? (
										<Sprite
											target={spriteTarget}
											name={value as never}
											size={1.5}
											className={cn({
												'rounded-full': spriteTarget !== 'customer_normal',
											})}
										/>
									) : (
										<Sprite target={spriteTarget} name={value as never} size={1} />
									)}
									<span className="ml-1">{value}</span>
								</span>
							</AutocompleteItem>
						) : (
							<AutocompleteItem key={value}>{value}</AutocompleteItem>
						)
					}
				</Autocomplete>
			</PopoverContent>
		</Popover>
	);
});
