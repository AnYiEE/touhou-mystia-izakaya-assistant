import {memo} from 'react';
import {twMerge} from 'tailwind-merge';

import {type DropdownProps, Dropdown as NextUIDropdown} from '@nextui-org/react';

import {globalStore as store} from '@/stores';

interface IProps extends DropdownProps {}

export default memo<IProps>(function Dropdown({classNames, showArrow, ...props}) {
	const isShowBackgroundImage = store.persistence.backgroundImage.use();

	return (
		<NextUIDropdown
			showArrow={isShowBackgroundImage ? false : Boolean(showArrow)}
			motionProps={
				isShowBackgroundImage
					? {
							initial: {},
						}
					: {}
			}
			classNames={{
				...classNames,
				content: twMerge(
					isShowBackgroundImage && 'bg-content1/40 backdrop-blur-lg dark:bg-content1/70',
					classNames?.content
				),
			}}
			{...props}
		/>
	);
});
