import Heading from '@/components/heading';
import Link from '@/components/link';
import Ul from '@/components/ul';

export default function KnownIssue() {
	return (
		<>
			<Heading>已知问题</Heading>
			<Ul>
				<li>
					表格无法排序多个列：见
					<Link isExternal showAnchorIcon href="https://github.com/nextui-org/nextui/issues/2282">
						issue#2282
					</Link>
					。
				</li>
			</Ul>
		</>
	);
}
