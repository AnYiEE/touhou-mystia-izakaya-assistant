export function getMotionProps(type: 'popover' | 'select' | 'tooltip', isHighAppearance: boolean) {
	if (!isHighAppearance) {
		return {} as const;
	}

	switch (type) {
		case 'popover':
			return {
				variants: {
					enter: {
						transform: 'scale(1)',
						transition: {
							bounce: 0,
							duration: 0.3,
							type: 'spring',
						},
					},
					exit: {
						opacity: 0,
						transform: 'scale(0.96)',
						transition: {
							bounce: 0,
							duration: 0.15,
							type: 'easeOut',
						},
					},
					initial: {
						transform: 'scale(0.8)',
					},
				},
			} as const;
		case 'select':
			return {
				variants: {
					enter: {
						transform: 'scale(1)',
						transition: {
							duration: 0.15,
							ease: [0.36, 0.66, 0.4, 1],
						},
					},
					exit: {
						opacity: 0,
						transform: 'scale(0.96, 1)',
						transition: {
							duration: 0.3,
							ease: [0.36, 0.66, 0.4, 1],
						},
					},
					initial: {
						opacity: 1,
						transform: 'scale(0.96, 1)',
					},
				},
			} as const;
		case 'tooltip':
			return {
				initial: {},
			} as const;
	}
}
