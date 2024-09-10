import {type Dispatch, type SetStateAction, forwardRef, memo, useCallback} from 'react';
import {twJoin, twMerge} from 'tailwind-merge';

import {useVibrate} from '@/hooks';

import {
	Autocomplete,
	AutocompleteItem,
	type AutocompleteProps,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
} from '@nextui-org/react';
import {faMagnifyingGlass} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconButton, {type IFontAwesomeIconButtonProps} from '@/components/fontAwesomeIconButton';
import Sprite from '@/components/sprite';

import {customerRareStore as customerStore /* , globalStore */} from '@/stores';
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

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function SideSearchIconButton(
		{searchConfig: {label, searchItems, searchValue, setSearchValue, spriteTarget}, className, ...props},
		ref
	) {
		const vibrate = useVibrate();

		const instance_special = customerStore.instances.customer_special.get();

		// const isShowBackgroundImage = globalStore.persistence.backgroundImage.use();

		const handleInputChange = useCallback(
			(value: string) => {
				if (!value) {
					vibrate();
				}
				setSearchValue(value);
			},
			[setSearchValue, vibrate]
		);

		const content = `搜索（${searchValue ? '已' : '未'}激活）`;

		return (
			<Popover
				showArrow
				// backdrop={isShowBackgroundImage ? 'blur' : 'opaque'}
				placement="left"
				shouldCloseOnInteractOutside={() => true}
				ref={ref}
			>
				<Tooltip showArrow content={content} placement="left">
					<span className="flex">
						<PopoverTrigger>
							<FontAwesomeIconButton
								color={searchValue ? 'warning' : 'primary'}
								icon={faMagnifyingGlass}
								variant="shadow"
								aria-label={content}
								className={twMerge('text-white', className)}
								{...props}
							/>
						</PopoverTrigger>
					</span>
				</Tooltip>
				<PopoverContent className="w-64">
					<Autocomplete
						allowsCustomValue
						variant="flat"
						defaultInputValue={searchValue}
						defaultItems={searchItems}
						label={label}
						onInputChange={handleInputChange}
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
												target={
													spriteTarget === 'customer_rare' &&
													instance_special.findIndexByName(value, true) !== -1
														? 'customer_special'
														: spriteTarget
												}
												name={value as never}
												size={1.5}
												className={twJoin(spriteTarget !== 'customer_normal' && 'rounded-full')}
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
	})
);
