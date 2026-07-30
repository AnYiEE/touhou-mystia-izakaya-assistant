'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
	type Key,
	type SyntheticEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

import type {
	IAdminAuditLogListData,
	IAdminMeData,
} from '@/features/account/contracts';
import { fetchAdminMe, listAdminAuditLogs } from '@/features/admin/client/api';
import { ADMIN_LIST_DEBOUNCE_MS } from '@/features/admin/client/components/filters';
import {
	createAdminPageInputValue,
	createAdminTimeInputValue,
	parseAdminPageInput,
	parseAdminTimeInputValue,
} from '@/features/admin/client/inputValues';
import {
	clearAdminSession,
	isAdminSessionInvalidResult,
} from '@/features/admin/client/session';
import type {
	IAdminAuditInitialData,
	TAdminApiResult,
} from '@/features/admin/contracts';
import { createAdminHref } from '@/features/admin/navigation';
import { trackEvent } from '@/features/analytics/client/trackEvent';

const pageInputRegexp = /^\d*$/u;
const ADMIN_AUDIT_MIN_QUERY_LENGTH = 2;

export function useAdminAuditController(initialData: IAdminAuditInitialData) {
	const pathname = usePathname();
	const router = useRouter();
	const requestIdRef = useRef(0);
	const isServerInitialRef = useRef(initialData.logs !== null);
	const [admin, setAdmin] = useState<IAdminMeData | null>(initialData.admin);
	const [logs, setLogs] = useState<IAdminAuditLogListData | null>(
		initialData.logs
	);
	const [isAuthLoading, setIsAuthLoading] = useState(
		initialData.isAuthLoading
	);
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(initialData.message);
	const [page, setPage] = useState(initialData.logs?.page ?? 1);
	const [pageInput, setPageInput] = useState(
		createAdminPageInputValue(initialData.logs?.page ?? 1)
	);
	const [queryInput, setQueryInput] = useState(initialData.query);
	const [scope, setScope] = useState<IAdminAuditInitialData['scope']>(
		initialData.scope
	);
	const [actionInput, setActionInput] = useState(initialData.action);
	const [actorIdInput, setActorIdInput] = useState(initialData.actorId);
	const [actorType, setActorType] = useState<
		IAdminAuditInitialData['actorType']
	>(initialData.actorType);
	const [targetIdInput, setTargetIdInput] = useState(initialData.targetId);
	const [targetTypeInput, setTargetTypeInput] = useState(
		initialData.targetType
	);
	const [startTimeInput, setStartTimeInput] = useState(
		createAdminTimeInputValue(initialData.startTime)
	);
	const [endTimeInput, setEndTimeInput] = useState(
		createAdminTimeInputValue(initialData.endTime)
	);

	const createListOptions = useCallback(
		(nextPage = page) => {
			const startTime = parseAdminTimeInputValue(startTimeInput);
			const endTime = parseAdminTimeInputValue(endTimeInput);
			const query = queryInput.trim();

			return {
				page: nextPage,
				pageSize: logs?.page_size ?? 20,
				...(scope === '' ? {} : { scope }),
				...(actionInput.trim() === ''
					? {}
					: { action: actionInput.trim() }),
				...(actorIdInput.trim() === ''
					? {}
					: { actorId: actorIdInput.trim() }),
				...(actorType === '' ? {} : { actorType }),
				...(endTime === undefined ? {} : { endTime }),
				...(query.length < ADMIN_AUDIT_MIN_QUERY_LENGTH
					? {}
					: { query }),
				...(startTime === undefined ? {} : { startTime }),
				...(targetIdInput.trim() === ''
					? {}
					: { targetId: targetIdInput.trim() }),
				...(targetTypeInput.trim() === ''
					? {}
					: { targetType: targetTypeInput.trim() }),
			};
		},
		[
			actionInput,
			actorIdInput,
			actorType,
			endTimeInput,
			logs?.page_size,
			page,
			queryInput,
			scope,
			startTimeInput,
			targetIdInput,
			targetTypeInput,
		]
	);

	const handleErrorResult = useCallback(
		(result: Extract<TAdminApiResult, { status: 'error' }>) => {
			if (isAdminSessionInvalidResult(result)) {
				clearAdminSession();
				setAdmin(null);
				setLogs(null);
			}

			setMessage(result.displayMessage);
		},
		[]
	);

	const refreshLogs = useCallback(
		(nextPage = page) => {
			const query = queryInput.trim();
			if (query !== '' && query.length < ADMIN_AUDIT_MIN_QUERY_LENGTH) {
				setMessage('搜索关键字至少需要 2 个字符');
				return;
			}

			requestIdRef.current += 1;
			const requestId = requestIdRef.current;
			setIsLoading(true);
			setMessage(null);

			void listAdminAuditLogs(createListOptions(nextPage))
				.then((result) => {
					if (requestIdRef.current !== requestId) {
						return;
					}
					if (result.status === 'error') {
						handleErrorResult(result);
						return;
					}

					setLogs(result.data);
					setPage(result.data.page);
				})
				.catch((error: unknown) => {
					if (requestIdRef.current !== requestId) {
						return;
					}
					setMessage(
						error instanceof Error
							? error.message
							: '读取审计日志失败'
					);
				})
				.finally(() => {
					if (requestIdRef.current === requestId) {
						setIsLoading(false);
					}
				});
		},
		[createListOptions, handleErrorResult, page, queryInput]
	);

	const checkAdmin = useCallback(() => {
		requestIdRef.current += 1;
		const requestId = requestIdRef.current;
		setIsAuthLoading(true);
		setMessage(null);

		void fetchAdminMe()
			.then((result) => {
				if (requestIdRef.current !== requestId) {
					return;
				}
				if (result.status === 'error') {
					handleErrorResult(result);
					return;
				}

				setAdmin(result.data);
			})
			.catch((error: unknown) => {
				if (requestIdRef.current !== requestId) {
					return;
				}
				setMessage(
					error instanceof Error
						? error.message
						: '读取管理员状态失败'
				);
			})
			.finally(() => {
				if (requestIdRef.current === requestId) {
					setIsAuthLoading(false);
				}
			});
	}, [handleErrorResult]);

	useEffect(
		() => () => {
			requestIdRef.current += 1;
		},
		[]
	);

	useEffect(() => {
		if (initialData.admin !== null) {
			setIsAuthLoading(false);
			return;
		}

		checkAdmin();
	}, [checkAdmin, initialData.admin]);

	useEffect(() => {
		let timeoutId: ReturnType<typeof globalThis.setTimeout> | null = null;

		if (admin !== null) {
			if (isServerInitialRef.current) {
				isServerInitialRef.current = false;
			} else {
				timeoutId = globalThis.setTimeout(() => {
					refreshLogs(page);
				}, ADMIN_LIST_DEBOUNCE_MS);
			}
		}

		return () => {
			if (timeoutId !== null) {
				globalThis.clearTimeout(timeoutId);
			}
		};
	}, [admin, page, refreshLogs]);

	useEffect(() => {
		setPageInput(createAdminPageInputValue(page));
	}, [page]);

	useEffect(() => {
		if (pathname !== '/admin/audit') {
			return;
		}

		const startTime = parseAdminTimeInputValue(startTimeInput);
		const endTime = parseAdminTimeInputValue(endTimeInput);
		const nextHref = createAdminHref('/admin/audit', {
			action: actionInput,
			actorId: actorIdInput,
			actorType,
			page,
			query: queryInput,
			scope,
			targetId: targetIdInput,
			targetType: targetTypeInput,
			...(endTime === undefined ? {} : { endTime }),
			...(startTime === undefined ? {} : { startTime }),
		});
		const currentHref = `${globalThis.location.pathname}${globalThis.location.search}`;

		if (currentHref === nextHref) {
			return;
		}

		const timeoutId = globalThis.setTimeout(() => {
			router.replace(nextHref, { scroll: false });
		}, ADMIN_LIST_DEBOUNCE_MS);

		return () => {
			globalThis.clearTimeout(timeoutId);
		};
	}, [
		actionInput,
		actorIdInput,
		actorType,
		endTimeInput,
		page,
		pathname,
		queryInput,
		router,
		scope,
		startTimeInput,
		targetIdInput,
		targetTypeInput,
	]);

	const handleRefresh = useCallback(() => {
		trackEvent(trackEvent.category.click, 'Admin Audit Button', 'Refresh');
		refreshLogs(page);
	}, [page, refreshLogs]);

	const handleTextFilterChange = useCallback(
		(setter: (value: string) => void) => (value: string) => {
			setPage(1);
			setter(value);
		},
		[]
	);

	const handleScopeAction = useCallback((key: Key) => {
		setPage(1);
		setScope(String(key) as IAdminAuditInitialData['scope']);
	}, []);

	const handleActorTypeAction = useCallback((key: Key) => {
		setPage(1);
		setActorType(String(key) as IAdminAuditInitialData['actorType']);
	}, []);

	const handlePreviousPage = useCallback(() => {
		setPage((currentPage) => Math.max(1, currentPage - 1));
	}, []);

	const handleNextPage = useCallback(() => {
		setPage((currentPage) =>
			Math.min(
				Math.max(1, logs?.total_pages ?? currentPage + 1),
				currentPage + 1
			)
		);
	}, [logs?.total_pages]);

	const handlePageInputChange = useCallback((value: string) => {
		if (pageInputRegexp.test(value)) {
			setPageInput(value);
		}
	}, []);

	const handlePageJumpSubmit = useCallback(
		(event: SyntheticEvent<HTMLFormElement>) => {
			event.preventDefault();
			setPage(parseAdminPageInput(pageInput, logs?.total_pages ?? 1));
		},
		[logs?.total_pages, pageInput]
	);

	return {
		actionInput,
		actorIdInput,
		actorType,
		admin,
		endTimeInput,
		handleActorTypeAction,
		handleNextPage,
		handlePageInputChange,
		handlePageJumpSubmit,
		handlePreviousPage,
		handleRefresh,
		handleScopeAction,
		handleTextFilterChange,
		isAuthLoading,
		isLoading,
		logs,
		message,
		page,
		pageInput,
		queryInput,
		scope,
		setActionInput,
		setActorIdInput,
		setEndTimeInput,
		setQueryInput,
		setStartTimeInput,
		setTargetIdInput,
		setTargetTypeInput,
		startTimeInput,
		targetIdInput,
		targetTypeInput,
	};
}
