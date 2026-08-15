import { faPlus, faQuestion } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { memo, useMemo } from 'react';

import Tooltip from '@/design/ui/components/tooltip';

interface IPlusProps extends Pick<HTMLSpanElementAttributes, 'className'> {
	size?: number;
}

export const Plus = memo<IPlusProps>(function Plus({ className, size = 1 }) {
	const remString = `${size}rem`;
	const style = useMemo(
		() => ({ fontSize: remString, width: remString }),
		[remString]
	);

	return (
		<span
			className={cn('mx-1 text-center leading-none', className)}
			style={style}
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
		const containerStyle = useMemo(
			() => ({
				height: remString,
				outlineOffset: '-3px',
				width: remString,
			}),
			[remString]
		);
		const iconStyle = useMemo(
			() => ({
				fontSize: iconRemString,
				height: iconRemString,
				width: iconRemString,
			}),
			[iconRemString]
		);

		return (
			<span
				role="img"
				title={title}
				className={cn(
					'outline-3 flex items-center justify-center rounded-small p-0.5 text-center leading-none outline-double',
					className
				)}
				style={containerStyle}
			>
				<span
					className="inline-flex items-center justify-center leading-none"
					style={iconStyle}
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
