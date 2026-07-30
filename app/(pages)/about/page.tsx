import ChangeLog from '@/features/about/client/components/ChangeLog';
import Introduction from '@/features/about/client/components/Introduction';
import LegalStatement from '@/features/about/client/components/LegalStatement';

export default function About() {
	return (
		<div className="min-h-main-content">
			<Introduction />
			<LegalStatement />
			<ChangeLog />
		</div>
	);
}
