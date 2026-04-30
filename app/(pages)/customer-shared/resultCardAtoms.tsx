import { memo } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faQuestion } from '@fortawesome/free-solid-svg-icons';

import { Tooltip, cn } from '@/design/ui/components';

interface IPlusProps extends Pick<HTMLSpanElementAttributes, 'className'> {
	size?: number;
}

export const Plus = memo<IPlusProps>(function Plus({ className, size = 1 }) {
	const remString = `${size}rem`;

	return (
		<span
			className={cn('mx-1 text-center leading-none', className)}
			style={{ fontSize: remString, width: remString }}
		>
			<FontAwesomeIcon icon={faPlus} />
		</span>
	);
});

interface IUnknownItemProps extends Pick<
	HTMLSpanElementAttributes,
	'className'
> {
	size?: number;
	title: string;
}

export const UnknownItem = memo<IUnknownItemProps>(function UnknownItem({
	className,
	size = 2,
	title,
}) {
	const remString = `${size}rem`;

	return (
		<Tooltip showArrow content={title} offset={7 + -8 * (size - 2)}>
			<span
				role="img"
				title={title}
				className={cn(
					'outline-3 flex items-center justify-center rounded-small p-0.5 text-center leading-none outline-double',
					className
				)}
				style={{
					fontSize: remString,
					height: remString,
					width: remString,
				}}
			>
				<FontAwesomeIcon
					icon={faQuestion}
					className="!h-full rotate-12"
				/>
			</span>
		</Tooltip>
	);
});
