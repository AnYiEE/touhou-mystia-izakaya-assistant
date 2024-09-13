import {Link} from '@nextui-org/react';

import H1 from '@/components/h1';
import Ul from '@/components/ul';

export default function KnownIssue() {
	return (
		<>
			<H1>已知问题</H1>
			<Ul>
				<li>
					表格无法排序多个列：见
					<Link
						isExternal
						showAnchorIcon
						href="https://github.com/nextui-org/nextui/issues/2282"
						referrerPolicy="same-origin"
					>
						issue#2282
					</Link>
					。
				</li>
			</Ul>
		</>
	);
}
