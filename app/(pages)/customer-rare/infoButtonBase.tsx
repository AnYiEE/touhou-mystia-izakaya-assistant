import {memo} from 'react';

import {Accordion, type AccordionProps, Popover, PopoverContent, PopoverTrigger, Tooltip} from '@nextui-org/react';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';

interface IProps extends Pick<AccordionProps, 'children' | 'defaultExpandedKeys'> {}

export default memo<IProps>(function InfoButtonBase({defaultExpandedKeys, children}) {
	return (
		<Popover showArrow offset={0} placement="left">
			<Tooltip showArrow content="更多信息" offset={-4} placement="left">
				<span className="absolute -right-1 bottom-0">
					<PopoverTrigger>
						<FontAwesomeIconButton
							icon={faInfoCircle}
							variant="light"
							aria-label="更多信息"
							className="-bottom-0.5 h-4 w-4 text-default-400 hover:opacity-80 data-[hover]:bg-transparent"
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
