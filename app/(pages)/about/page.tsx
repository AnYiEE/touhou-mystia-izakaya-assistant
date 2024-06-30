import {type PropsWithChildren, forwardRef, memo} from 'react';
import {Link} from '@nextui-org/react';

const H1 = memo(
	forwardRef<HTMLHeadingElement | null, PropsWithChildren<object>>(function H1({children}, ref) {
		return (
			<h1 className="mb-4 mt-2 text-2xl font-bold" ref={ref}>
				{children}
			</h1>
		);
	})
);

export default function About() {
	return (
		<div>
			<H1>已知问题</H1>
			<ul className="list-inside list-decimal">
				<li>
					表格无法排序多个列（
					<Link isExternal showAnchorIcon href="https://github.com/nextui-org/nextui/issues/2282">
						#2282
					</Link>
					）
				</li>
			</ul>
		</div>
	);
}
