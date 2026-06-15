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

interface IUnknownItemIconProps extends Pick<
	HTMLSpanElementAttributes,
	'className'
> {
	iconSize?: number;
	size?: number;
	title?: string;
}

export const UnknownItemIcon = memo<IUnknownItemIconProps>(
	function UnknownItemIcon({ className, iconSize, size = 2, title }) {
		const remString = `${size}rem`;
		const iconRemString = `${iconSize ?? size}rem`;

		return (
			<span
				role="img"
				title={title}
				className={cn(
					'outline-3 flex items-center justify-center rounded-small p-0.5 text-center leading-none outline-double',
					className
				)}
				style={{
					height: remString,
					outlineOffset: '-3px',
					width: remString,
				}}
			>
				<span
					className="inline-flex items-center justify-center leading-none"
					style={{
						fontSize: iconRemString,
						height: iconRemString,
						width: iconRemString,
					}}
				>
					<FontAwesomeIcon icon={faQuestion} className="rotate-12" />
				</span>
			</span>
		);
	}
);

interface IUnknownItemProps extends IUnknownItemIconProps {
	title: string;
}

export const UnknownItem = memo<IUnknownItemProps>(function UnknownItem({
	size = 2,
	title,
	...props
}) {
	return (
		<Tooltip showArrow content={title} offset={7 + -8 * (size - 2)}>
			<UnknownItemIcon title={title} size={size} {...props} />
		</Tooltip>
	);
});
