import {
	type ReactNode,
	memo,
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
} from 'react';
import { debounce } from 'lodash';

import { Button, ScrollShadow, cn } from '@/design/ui/components';

import PressElement from '@/components/pressElement';

import type { ICustomerTabStyle } from '@/(pages)/customer-shared/types';
import { checkA11yConfirmKey } from '@/utilities';

interface IProps<TItemName extends string> {
	currentCustomerName: TItemName | null;
	customerTabStyle: ICustomerTabStyle;
	isVisible: boolean;
	onSelect: (name: TItemName) => void;
	onToggleVisibility: () => void;
	renderAvatar: (name: TItemName) => ReactNode;
	sortedData: ReadonlyArray<{ name: TItemName }>;
}

export default memo(function CustomerTabShell<TItemName extends string>({
	currentCustomerName,
	customerTabStyle,
	isVisible,
	onSelect,
	onToggleVisibility,
	renderAvatar,
	sortedData,
}: IProps<TItemName>) {
	const [viewportHeight, setViewportHeight] = useState<number | null>(null);

	const contentRef = useRef<HTMLDivElement | null>(null);
	const constraintRef = useRef<HTMLDivElement | null>(null);
	const animationFrameIdRef = useRef<number | null>(null);
	const hasMeasuredRef = useRef(false);
	const previousIsVisibleRef = useRef(isVisible);

	const updateViewportHeight = useCallback(() => {
		const contentElement = contentRef.current;
		const constraintElement = constraintRef.current;

		if (contentElement === null || constraintElement === null) {
			return;
		}

		const { maxHeight, minHeight } =
			globalThis.getComputedStyle(constraintElement);
		const contentHeight = contentElement.getBoundingClientRect().height;
		const maxHeightValue = Number.parseFloat(maxHeight);
		const minHeightValue = Number.parseFloat(minHeight);
		const constrainedHeight = Math.min(
			contentHeight,
			Number.isFinite(maxHeightValue) ? maxHeightValue : contentHeight
		);
		const nextHeight = Math.max(
			Number.isFinite(minHeightValue) ? minHeightValue : 0,
			constrainedHeight
		);

		setViewportHeight((currentHeight) =>
			currentHeight !== null && Math.abs(currentHeight - nextHeight) < 0.5
				? currentHeight
				: nextHeight
		);

		hasMeasuredRef.current = true;
	}, []);

	const cancelViewportHeightUpdate = useCallback(() => {
		if (animationFrameIdRef.current === null) {
			return;
		}

		globalThis.cancelAnimationFrame(animationFrameIdRef.current);
		animationFrameIdRef.current = null;
	}, []);

	const scheduleViewportHeightUpdate = useCallback(() => {
		cancelViewportHeightUpdate();
		animationFrameIdRef.current = globalThis.requestAnimationFrame(() => {
			animationFrameIdRef.current = null;
			updateViewportHeight();
		});
	}, [cancelViewportHeightUpdate, updateViewportHeight]);

	useLayoutEffect(() => {
		if (!isVisible) {
			previousIsVisibleRef.current = false;
			return;
		}

		const isBecomingVisible = !previousIsVisibleRef.current;
		previousIsVisibleRef.current = true;

		if (isBecomingVisible || !hasMeasuredRef.current) {
			updateViewportHeight();
		} else {
			scheduleViewportHeightUpdate();
		}

		const contentElement = contentRef.current;
		globalThis.addEventListener('resize', scheduleViewportHeightUpdate);

		if (contentElement === null || typeof ResizeObserver === 'undefined') {
			return () => {
				cancelViewportHeightUpdate();
				globalThis.removeEventListener(
					'resize',
					scheduleViewportHeightUpdate
				);
			};
		}

		// eslint-disable-next-line compat/compat -- Progressive enhancement; resize still works without ResizeObserver.
		const resizeObserver = new ResizeObserver(scheduleViewportHeightUpdate);
		resizeObserver.observe(contentElement);

		return () => {
			cancelViewportHeightUpdate();
			resizeObserver.disconnect();
			globalThis.removeEventListener(
				'resize',
				scheduleViewportHeightUpdate
			);
		};
	}, [
		cancelViewportHeightUpdate,
		customerTabStyle.classNames.content,
		isVisible,
		scheduleViewportHeightUpdate,
		updateViewportHeight,
	]);

	return (
		<>
			<div className="relative">
				<ScrollShadow
					style={
						viewportHeight === null
							? undefined
							: { height: viewportHeight }
					}
					className="overflow-y-auto transition-[height] duration-300 ease-in-out motion-reduce:transition-none"
				>
					<div ref={contentRef} className="p-2">
						<div className="grid grid-cols-fill-16 justify-around gap-4 lg:grid-cols-fill-20">
							{sortedData.map(({ name }) => (
								<PressElement
									key={name}
									as="div"
									onPress={() => {
										onSelect(name);
									}}
									title={`点击：选择【${name}】`}
									className="group flex cursor-pointer flex-col items-center gap-1"
								>
									{renderAvatar(name)}
									<span
										className={cn(
											'whitespace-nowrap text-tiny text-default-800 transition-colors group-hover:text-default-900 motion-reduce:transition-none',
											{
												'text-default-900':
													name ===
													currentCustomerName,
											}
										)}
									>
										{name}
									</span>
								</PressElement>
							))}
						</div>
					</div>
				</ScrollShadow>
				<div
					ref={constraintRef}
					aria-hidden
					className={cn(
						'pointer-events-none absolute left-0 top-0 h-0 w-0 overflow-hidden opacity-0 xl:max-h-[calc(var(--safe-h-dvh)-10.25rem-env(titlebar-area-height,0rem))]',
						customerTabStyle.classNames.content
					)}
				/>
			</div>
			<div className="flex justify-center xl:hidden">
				<Button
					isIconOnly
					size="sm"
					variant="flat"
					onClick={onToggleVisibility}
					onKeyDown={debounce(
						checkA11yConfirmKey(onToggleVisibility)
					)}
					aria-label={customerTabStyle.ariaLabel}
					className="h-4 w-4/5 text-default-400"
				>
					{customerTabStyle.buttonNode}
				</Button>
			</div>
		</>
	);
}) as <TItemName extends string>(props: IProps<TItemName>) => ReactNode;
