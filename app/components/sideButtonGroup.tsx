import {type HTMLAttributes, type PropsWithChildren} from 'react';

interface IProps extends HTMLAttributes<HTMLDivElement> {}

export default function SideButtonGroup({children, ...props}: PropsWithChildren<IProps>) {
	return (
		<div className="absolute">
			<div className="fixed bottom-6 right-6 z-20 md:bottom-[calc(50%-4rem)]">
				<div className="flex flex-col gap-3" {...props}>
					{children}
				</div>
			</div>
		</div>
	);
}
