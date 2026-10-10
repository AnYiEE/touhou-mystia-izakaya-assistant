import { execSync } from 'node:child_process';

import FooterContent from '@/features/appShell/client/components/FooterContent';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

const { isProduction, vercelSha } = PUBLIC_RUNTIME_CONFIG;

const sha = (() => {
	if (vercelSha) {
		return vercelSha.slice(0, 7);
	}

	if (isProduction) {
		try {
			return execSync('git rev-parse --short HEAD')
				.toString('utf8')
				.trim()
				.slice(0, 7);
		} catch {
			return null;
		}
	}

	return null;
})();

export default function Footer() {
	return <FooterContent sha={sha} />;
}
