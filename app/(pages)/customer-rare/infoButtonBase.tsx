import {memo, useCallback} from 'react';

import {useVibrate} from '@/hooks';

import {Accordion, type AccordionProps, PopoverContent, PopoverTrigger} from '@nextui-org/react';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';

import {TrackCategory, trackEvent} from '@/components/analytics';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Popover from '@/components/popover';
import Tooltip from '@/components/tooltip';

interface IProps extends Pick<AccordionProps, 'children' | 'defaultExpandedKeys'> {}

export default memo<IProps>(function InfoButtonBase({defaultExpandedKeys, children}) {
	const vibrate = useVibrate();

	const handleOpenChange = useCallback(
		(isOpen: boolean) => {
			if (isOpen) {
				vibrate();
			}
		},
		[vibrate]
	);

	return (
		<Popover offset={0} placement="left-end" onOpenChange={handleOpenChange}>
			<Tooltip showArrow content="更多信息" offset={4}>
				<span className="absolute -right-0.5 bottom-1.5 flex">
					<PopoverTrigger>
						<FontAwesomeIconButton
							icon={faInfoCircle}
							variant="light"
							onPress={() => {
								trackEvent(TrackCategory.Click, 'Info Button');
							}}
							aria-label="更多信息"
							className="-bottom-0.5 h-4 w-4 text-default-200 transition-opacity hover:opacity-hover data-[hover=true]:bg-transparent dark:text-default-300"
						/>
					</PopoverTrigger>
				</span>
			</Tooltip>
			<PopoverContent>
				<div className="max-w-44">
					<Accordion
						isCompact
						keepContentMounted
						defaultExpandedKeys={defaultExpandedKeys ?? []}
						className="m-0 p-0"
						itemClasses={{
							base: 'mb-1 mt-3 text-base font-bold',
							content: 'mt-2 py-0 font-normal',
							trigger: 'm-0 p-0',
						}}
					>
						{children}
					</Accordion>
				</div>
			</PopoverContent>
		</Popover>
	);
});
