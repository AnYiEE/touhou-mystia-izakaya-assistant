import {
	type ReactElement,
	type RefObject,
	useCallback,
	useRef,
	useState,
} from 'react';
import { isNil } from 'lodash';

import { useVibrate } from '@/hooks';

import { faUpRightAndDownLeftFromCenter } from '@fortawesome/free-solid-svg-icons';

import { Tooltip, cn } from '@/design/ui/components';

import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';

import { checkLengthEmpty, toArray } from '@/utilities';

interface IUsePictureInPictureOptions {
	height?: number;
	offset?: { height?: number; width?: number };
	width?: number;
}

interface IUsePictureInPictureReturn {
	CLASSNAME_EXCLUDE_FROM_PIP: string;
	containerRef: RefObject<HTMLDivElement | null>;
	isOpen: boolean;
	isSupported: boolean;
	PipButton: (props: { onOpen?: () => void }) => ReactElement | null;
}

export function usePictureInPicture(
	options: IUsePictureInPictureOptions = {}
): IUsePictureInPictureReturn {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [pipWindow, setPipWindow] = useState<Window | null>(null);

	const isOpen = pipWindow !== null;
	const isSupported = 'documentPictureInPicture' in globalThis;
	const CLASSNAME_EXCLUDE_FROM_PIP = 'pip-exclude';

	const vibrate = useVibrate();

	const togglePictureInPicture = useCallback(async () => {
		if (!isSupported) {
			return;
		}

		const docPip = globalThis.documentPictureInPicture;
		if (!docPip) {
			return;
		}

		if (!isNil(docPip.window)) {
			docPip.window.close();
			return;
		}

		try {
			const element = containerRef.current;

			let width = options.width ?? element?.offsetWidth;
			if (width !== undefined) {
				width += options.offset?.width ?? 0;
			}
			let height =
				options.height ??
				element?.offsetHeight ??
				globalThis.screen.height / 2;
			height += options.offset?.height ?? 0;
			height = Math.min(height, globalThis.screen.height / 2);
			height = Math.max(height, 96);

			const newPipWindow = await docPip.requestWindow({
				height,
				preferInitialWindowPlacement: true,
				width,
			});

			setPipWindow(newPipWindow);

			newPipWindow.addEventListener('pagehide', () => {
				setPipWindow(null);
			});

			toArray(document.styleSheets).forEach((styleSheet) => {
				try {
					const cssRules = toArray(styleSheet.cssRules)
						.map((rule) =>
							rule.cssText.replaceAll(
								/url\((['"]?)(?!data:|https?:\/\/|\/\/)(.*?)\1\)/gu,
								(_match, quote, url: string) => {
									const absoluteUrl = new URL(
										url,
										styleSheet.href ?? document.baseURI
									).href;
									return `url(${quote}${absoluteUrl}${quote})`;
								}
							)
						)
						.join('');
					const style = document.createElement('style');
					style.textContent = cssRules;
					newPipWindow.document.head.append(style);
				} catch {
					const link = document.createElement('link');
					link.media = styleSheet.media.mediaText;
					link.rel = 'stylesheet';
					link.type = styleSheet.type;
					if (styleSheet.href) {
						link.href = styleSheet.href;
					}
					newPipWindow.document.head.append(link);
				}
			});

			newPipWindow.document.documentElement.className =
				document.documentElement.className;
			newPipWindow.document.body.className = document.body.className;

			const style = newPipWindow.document.createElement('style');
			style.textContent = `* { pointer-events: none !important; } .${CLASSNAME_EXCLUDE_FROM_PIP} { display: none !important; }`;
			newPipWindow.document.head.append(style);

			if (containerRef.current !== null) {
				const contentContainer =
					newPipWindow.document.createElement('div');
				contentContainer.classList.add(
					'box-border',
					'h-full',
					'overflow-auto',
					'p-4',
					'w-full'
				);
				contentContainer.innerHTML = containerRef.current.innerHTML;

				const applyResponsiveClasses = (el: Element) => {
					const classList = toArray(el.classList);
					const mdClasses: string[] = [];

					classList.forEach((className) => {
						if (className.startsWith('md:')) {
							mdClasses.push(className.slice(3));
						}
					});

					if (!checkLengthEmpty(mdClasses)) {
						const mergedClasses = cn(
							classList.filter((c) => !c.startsWith('md:')),
							mdClasses
						);
						el.className = mergedClasses;
					}

					toArray(el.children).forEach(applyResponsiveClasses);
				};

				applyResponsiveClasses(contentContainer);
				newPipWindow.document.body.append(contentContainer);
			}
		} catch (error) {
			console.error('Failed to open Picture-in-Picture window:', error);
		}
	}, [isSupported, options]);

	const PipButton = useCallback<IUsePictureInPictureReturn['PipButton']>(
		({ onOpen }) => {
			if (isOpen || !isSupported) {
				return null;
			}

			const label = '在画中画中打开';

			return (
				<div className="flex justify-end pt-2 opacity-0 transition-opacity group-hover:opacity-100">
					<Tooltip
						showArrow
						closeDelay={0}
						content={label}
						placement="top"
					>
						<FontAwesomeIconButton
							icon={faUpRightAndDownLeftFromCenter}
							variant="light"
							onPress={() => {
								vibrate();
								void togglePictureInPicture();
								onOpen?.();
							}}
							aria-label={label}
							className="rounded-large opacity-70 !shadow-none transition-opacity hover:opacity-100 hover:!shadow-small hover:backdrop-blur"
						/>
					</Tooltip>
				</div>
			);
		},
		[isOpen, isSupported, togglePictureInPicture, vibrate]
	);

	return {
		CLASSNAME_EXCLUDE_FROM_PIP,
		containerRef,
		isOpen,
		isSupported,
		PipButton,
	};
}
