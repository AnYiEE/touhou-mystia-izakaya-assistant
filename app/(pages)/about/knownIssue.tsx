import {Link} from '@/design/ui/components';

import Heading from '@/components/heading';
import Ul from '@/components/ul';

export default function KnownIssue() {
	return (
		<>
			<Heading>已知问题</Heading>
			<Ul>
				<li>
					表格无法排序多个列：见
					<Link
						isExternal
						showAnchorIcon
						href="https://github.com/nextui-org/nextui/issues/2282"
						className="rounded-small font-medium"
					>
						issue#2282
					</Link>
					。
				</li>
			</Ul>
		</>
	);
}
