'use client';

import {
	type Key,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { useRouter } from 'next/navigation';

import { Autocomplete, AutocompleteItem } from '@heroui/autocomplete';
import { Textarea } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faArrowLeft,
	faBullhorn,
	faClockRotateLeft,
	faEye,
	faFileArchive,
	faMagnifyingGlass,
	faRotate,
	faSave,
	faShieldHalved,
	faUsers,
	faXmark,
} from '@fortawesome/free-solid-svg-icons';

import {
	Button,
	Input,
	Link,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Switch,
	cn,
} from '@/design/ui/components';

import {
	AdminEmptyState,
	AdminHeader,
	AdminInputIcon,
	AdminMessage,
	AdminMetric,
	AdminPanel,
	AdminPanelTitle,
	AdminShell,
	AdminTable,
	AdminTableHeader,
	AdminTableRow,
} from '../components';

import { ANNOUNCEMENT_LEVEL_PRESENTATION } from '@/components/announcementPresentation';
import { AnnouncementHtml } from '@/components/announcementHtml';
import {
	type TAdminActionResult,
	checkAdminAction,
	getAdminUsersByIdsAction,
	listAdminUsersAction,
} from '../actions';
import {
	archiveAnnouncementAction,
	createAnnouncementAction,
	getAdminAnnouncementAction,
	listAnnouncementVersionsAction,
	previewAnnouncementAction,
	restoreAnnouncementAction,
	updateAnnouncementAction,
} from './actions';
import { clearAdminSession } from '@/lib/account/client/adminSession';
import type {
	IAccountUserProfile,
	IAdminMeData,
} from '@/lib/account/shared/types';
import { globalStore } from '@/stores';
import { accountStore as store } from '@/stores/account';
import type {
	IAdminAnnouncementBody,
	IAdminAnnouncementPreviewData,
	IAdminAnnouncementProfile,
	IAdminAnnouncementVersionListData,
	TAnnouncementAudience,
	TAnnouncementComputedStatus,
	TAnnouncementLevel,
	TAnnouncementVersionAction,
} from '@/lib/announcements/shared/types';

const textareaClassNames = {
	inputWrapper:
		'bg-default/40 transition-background data-[hover=true]:bg-default-400/40 group-data-[focus=true]:bg-default/70 motion-reduce:transition-none',
};

const tableHeadCellClassName = 'px-4 py-3 font-medium';
const tableCellClassName = 'px-4 py-3 align-top';
const emptyBody = '<p>您好，{{user.username}}</p>';

interface ITargetUserOption {
	id: string;
	username: string | null;
}

const LEVEL_OPTIONS = [
	{ key: 'info', label: '信息' },
	{ key: 'success', label: '成功' },
	{ key: 'warning', label: '警告' },
	{ key: 'danger', label: '危险' },
	{ key: 'critical', label: '重要' },
] as const satisfies Array<{ key: TAnnouncementLevel; label: string }>;

function AdminAnnouncementUserPreview({
	dismissible,
	level,
	preview,
}: {
	dismissible: boolean;
	level: TAnnouncementLevel;
	preview: IAdminAnnouncementPreviewData | null;
}) {
	const isHighAppearance = globalStore.persistence.highAppearance.use();

	if (preview === null) {
		return null;
	}

	const levelMeta = ANNOUNCEMENT_LEVEL_PRESENTATION[level];

	return (
		<div className="space-y-2">
			<div className="text-tiny leading-5 text-foreground-500">
				用户视角预览
			</div>
			<section
				aria-label="站点通知预览"
				role="region"
				className={cn(
					'relative overflow-hidden transition-colors duration-500 motion-reduce:transition-none',
					levelMeta.rootClassName,
					isHighAppearance && 'backdrop-saturate-125 backdrop-blur-sm'
				)}
			>
				<span
					aria-hidden
					className="pointer-events-none absolute inset-0 z-0"
				>
					<span
						className={cn(
							'announcement-flowing-background absolute inset-0',
							levelMeta.backgroundClassName
						)}
					/>
				</span>
				<div
					className={cn(
						'relative z-10 mx-auto flex max-w-7xl items-center gap-2.5 py-1.5 pl-6 pr-4 sm:pr-6 md:pl-10 3xl:max-w-screen-2xl 4xl:max-w-screen-3xl',
						levelMeta.contentClassName
					)}
				>
					<span
						className={cn(
							'inline-flex h-5 w-5 shrink-0 items-center justify-center',
							levelMeta.iconClassName
						)}
					>
						<FontAwesomeIcon
							icon={levelMeta.icon}
							className="w-3"
						/>
					</span>
					<div className="min-w-0 flex-1 overflow-hidden">
						<AnnouncementHtml html={preview.html} />
					</div>
					{dismissible ? (
						<Button
							isIconOnly
							aria-label="关闭站点通知"
							className={cn(
								'h-7 min-h-7 w-7 min-w-7 shrink-0',
								levelMeta.buttonClassName
							)}
							radius="sm"
							size="sm"
							variant="light"
						>
							<FontAwesomeIcon icon={faXmark} className="w-3.5" />
						</Button>
					) : (
						<span aria-hidden className="h-7 w-7 shrink-0" />
					)}
				</div>
			</section>
		</div>
	);
}

const AUDIENCE_OPTIONS = [
	{ key: 'all', label: '全部用户' },
	{ key: 'anonymous', label: '未登录用户' },
	{ key: 'authenticated', label: '已登录用户' },
	{ key: 'targeted', label: '指定用户' },
] as const satisfies Array<{ key: TAnnouncementAudience; label: string }>;

const STATUS_LABEL_MAP = {
	active: '展示中',
	archived: '已归档',
	disabled: '已停用',
	ended: '已结束',
	scheduled: '待开始',
} as const satisfies Record<TAnnouncementComputedStatus, string>;

const VERSION_ACTION_LABEL_MAP = {
	archive: '归档',
	create: '创建',
	disable: '停用',
	enable: '启用',
	restore: '恢复',
	update: '更新',
} as const satisfies Record<TAnnouncementVersionAction, string>;

const CHANGED_FIELD_LABEL_MAP: Partial<
	Record<keyof IAdminAnnouncementProfile, string>
> = {
	audience: '受众',
	computed_status: '状态',
	deleted_at: '归档时间',
	dismissible: '允许关闭',
	enabled: '启用',
	ends_at: '结束时间',
	html: 'HTML内容',
	id: 'ID',
	level: '等级',
	priority: '优先级',
	revision: '版本',
	starts_at: '开始时间',
	target_user_ids: '指定用户',
	title: '标题',
	updated_at: '更新时间',
};

function createAnnouncementSelectClassNames(
	baseClassName: string,
	isHighAppearance: boolean
) {
	return {
		base: baseClassName,
		listboxWrapper: cn(
			'[&_li]:transition-background motion-reduce:[&_li]:transition-none',
			{
				'focus:[&_li]:!bg-default/40 data-[focus=true]:[&_li]:!bg-default/40 data-[hover=true]:[&_li]:!bg-default/40':
					isHighAppearance,
			}
		),
		popoverContent: cn({
			'bg-content1/70 backdrop-blur-lg': isHighAppearance,
		}),
		trigger: cn('transition-background motion-reduce:transition-none', {
			'backdrop-blur': isHighAppearance,
			'bg-default/40 data-[hover=true]:bg-default-400/40': true,
		}),
	};
}

function checkAdminUnauthorizedActionResult(
	result: Extract<TAdminActionResult, { status: 'error' }>
) {
	return (
		result.httpStatus === 401 &&
		(result.message === 'unauthorized' ||
			result.message === 'admin-session-expired')
	);
}

function createLocalDateTimeValue(timestamp: number | null) {
	if (timestamp === null) {
		return '';
	}

	const date = new Date(timestamp);
	const offsetDate = new Date(
		date.getTime() - date.getTimezoneOffset() * 60000
	);

	return offsetDate.toISOString().slice(0, 16);
}

function parseLocalDateTimeValue(value: string) {
	const trimmed = value.trim();
	if (trimmed.length === 0) {
		return null;
	}

	const timestamp = new Date(trimmed).getTime();

	return Number.isFinite(timestamp) && timestamp >= 0 ? timestamp : undefined;
}

function createDateTimeLabel(timestamp: number | null) {
	return timestamp === null
		? '不限'
		: new Date(timestamp).toLocaleString('zh-CN');
}

function getSingleSelectionKey(keys: 'all' | Set<Key>) {
	if (keys === 'all') {
		return null;
	}

	const { value } = keys.values().next();

	return typeof value === 'string' ? value : null;
}

function getChangedFieldValue(value: unknown) {
	if (
		Array.isArray(value) &&
		value.every((item): item is string => typeof item === 'string')
	) {
		return value.length === 0 ? '无' : value.join('、');
	}
	if (typeof value === 'string') {
		return value;
	}
	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}
	if (value === null) {
		return 'null';
	}

	return JSON.stringify(value);
}

function getChangedFieldLabel(field: string) {
	return (
		CHANGED_FIELD_LABEL_MAP[field as keyof IAdminAnnouncementProfile] ??
		field
	);
}

function createTargetUserFromProfile(
	user: IAccountUserProfile
): ITargetUserOption {
	return { id: user.id, username: user.username };
}

function checkSameTargetUser(
	left: ITargetUserOption,
	right: ITargetUserOption
) {
	return left.id === right.id;
}

function createTargetUserOptionsFromIds(ids: string[]): ITargetUserOption[] {
	return ids.map((id) => ({ id, username: null }));
}

function mergeTargetUserProfiles(
	targetUsers: ITargetUserOption[],
	users: IAccountUserProfile[]
) {
	const userById = new Map(users.map((user) => [user.id, user]));
	const nextTargetUsers = targetUsers.map((targetUser) => {
		const user = userById.get(targetUser.id);
		if (user === undefined || user.username === targetUser.username) {
			return targetUser;
		}

		return createTargetUserFromProfile(user);
	});

	return nextTargetUsers.some(
		(targetUser, index) => targetUser !== targetUsers[index]
	)
		? nextTargetUsers
		: targetUsers;
}

export interface IAdminAnnouncementFormInitialData {
	admin: IAdminMeData | null;
	announcement: IAdminAnnouncementProfile | null;
	isAnnouncementServerLoaded: boolean;
	isAuthLoading: boolean;
	loadError: string | null;
	message: string | null;
	versions: IAdminAnnouncementVersionListData | null;
}

interface IAdminAnnouncementFormProps {
	announcementId?: string;
	initialData: IAdminAnnouncementFormInitialData;
	mode: 'create' | 'edit';
}

export default function AdminAnnouncementForm({
	announcementId,
	initialData,
	mode,
}: IAdminAnnouncementFormProps) {
	const router = useRouter();
	const requestIdRef = useRef(0);
	const targetUserRequestIdRef = useRef(0);
	const isHighAppearance = globalStore.persistence.highAppearance.use();
	const isEditMode = mode === 'edit';
	const initialAnnouncement = initialData.announcement;
	const [admin, setAdmin] = useState<IAdminMeData | null>(initialData.admin);
	const [announcement, setAnnouncement] =
		useState<IAdminAnnouncementProfile | null>(initialAnnouncement);
	const [audience, setAudience] = useState<TAnnouncementAudience>(
		initialAnnouncement?.audience ?? 'all'
	);
	const [dismissible, setDismissible] = useState(
		initialAnnouncement?.dismissible ?? true
	);
	const [enabled, setEnabled] = useState(
		initialAnnouncement?.enabled ?? true
	);
	const [endsAtInput, setEndsAtInput] = useState(
		createLocalDateTimeValue(initialAnnouncement?.ends_at ?? null)
	);
	const [html, setHtml] = useState(initialAnnouncement?.html ?? emptyBody);
	const [id, setId] = useState(initialAnnouncement?.id ?? '');
	const [isArchivePopoverOpen, setIsArchivePopoverOpen] = useState(false);
	const [isAuthLoading, setIsAuthLoading] = useState(
		initialData.isAuthLoading
	);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [level, setLevel] = useState<TAnnouncementLevel>(
		initialAnnouncement?.level ?? 'info'
	);
	const [loadError, setLoadError] = useState<string | null>(
		initialData.loadError
	);
	const [message, setMessage] = useState<string | null>(initialData.message);
	const [preview, setPreview] =
		useState<IAdminAnnouncementPreviewData | null>(null);
	const [priority, setPriority] = useState(
		String(initialAnnouncement?.priority ?? 0)
	);
	const [startsAtInput, setStartsAtInput] = useState(
		createLocalDateTimeValue(initialAnnouncement?.starts_at ?? null)
	);
	const [isTargetUsersLoading, setIsTargetUsersLoading] = useState(false);
	const [targetUserOptions, setTargetUserOptions] = useState<
		IAccountUserProfile[]
	>([]);
	const [targetUserQuery, setTargetUserQuery] = useState('');
	const [targetUsers, setTargetUsers] = useState<ITargetUserOption[]>(
		createTargetUserOptionsFromIds(
			initialAnnouncement?.target_user_ids ?? []
		)
	);
	const [title, setTitle] = useState(initialAnnouncement?.title ?? '');
	const [versions, setVersions] =
		useState<IAdminAnnouncementVersionListData | null>(
			initialData.versions
		);
	const compactSelectClassNames = useMemo(
		() => createAnnouncementSelectClassNames('w-32', isHighAppearance),
		[isHighAppearance]
	);
	const audienceSelectClassNames = useMemo(
		() => createAnnouncementSelectClassNames('w-40', isHighAppearance),
		[isHighAppearance]
	);
	const targetUserAutocompleteClassNames = useMemo(
		() => ({
			base: 'w-full',
			clearButton: cn({
				'data-[hover=true]:bg-default/40': isHighAppearance,
			}),
			listboxWrapper: cn(
				'[&_li]:transition-background motion-reduce:[&_li]:transition-none',
				{ 'data-[hover=true]:[&_li]:!bg-default/40': isHighAppearance }
			),
			popoverContent: cn({
				'bg-content1/70 backdrop-blur-lg': isHighAppearance,
			}),
		}),
		[isHighAppearance]
	);

	const csrfToken = admin?.csrf_token ?? store.shared.adminCsrfToken.get();
	const missingTargetUserIds = useMemo(
		() =>
			targetUsers
				.filter((user) => user.username === null)
				.map((user) => user.id),
		[targetUsers]
	);
	const numericPriority = Number.parseInt(priority, 10);
	const startsAt = parseLocalDateTimeValue(startsAtInput);
	const endsAt = parseLocalDateTimeValue(endsAtInput);
	const canSave =
		admin !== null &&
		title.trim().length > 0 &&
		html.trim().length > 0 &&
		Number.isSafeInteger(numericPriority) &&
		startsAt !== undefined &&
		endsAt !== undefined &&
		(startsAt === null || endsAt === null || endsAt > startsAt) &&
		(audience !== 'targeted' || targetUsers.length > 0) &&
		(!isEditMode || announcement !== null || announcementId !== undefined);

	const formBody = useMemo<IAdminAnnouncementBody | null>(() => {
		if (!canSave) {
			return null;
		}

		return {
			...(isEditMode
				? { id: announcement?.id ?? announcementId ?? id.trim() }
				: id.trim().length > 0
					? { id: id.trim() }
					: {}),
			audience,
			dismissible,
			enabled,
			ends_at: endsAt ?? null,
			html,
			level,
			priority: numericPriority,
			starts_at: startsAt ?? null,
			target_user_ids:
				audience === 'targeted'
					? targetUsers.map((user) => user.id)
					: [],
			title: title.trim(),
		};
	}, [
		announcement?.id,
		audience,
		announcementId,
		canSave,
		dismissible,
		enabled,
		endsAt,
		html,
		id,
		isEditMode,
		level,
		numericPriority,
		startsAt,
		targetUsers,
		title,
	]);

	const applyAnnouncement = useCallback(
		(nextAnnouncement: IAdminAnnouncementProfile) => {
			setAnnouncement(nextAnnouncement);
			setAudience(nextAnnouncement.audience);
			setDismissible(nextAnnouncement.dismissible);
			setEnabled(nextAnnouncement.enabled);
			setEndsAtInput(createLocalDateTimeValue(nextAnnouncement.ends_at));
			setHtml(nextAnnouncement.html);
			setId(nextAnnouncement.id);
			setLevel(nextAnnouncement.level);
			setPriority(String(nextAnnouncement.priority));
			setStartsAtInput(
				createLocalDateTimeValue(nextAnnouncement.starts_at)
			);
			setTargetUsers(
				createTargetUserOptionsFromIds(nextAnnouncement.target_user_ids)
			);
			setTitle(nextAnnouncement.title);
		},
		[]
	);

	const handleActionError = useCallback(
		(result: Extract<TAdminActionResult, { status: 'error' }>) => {
			if (checkAdminUnauthorizedActionResult(result)) {
				clearAdminSession();
				setAdmin(null);
				return;
			}

			setMessage(result.message);
		},
		[]
	);

	const refreshVersions = useCallback((nextAnnouncementId: string) => {
		void listAnnouncementVersionsAction(nextAnnouncementId).then(
			(result) => {
				if (result.status === 'error') {
					return;
				}

				setVersions(result.data);
			}
		);
	}, []);

	const refreshAnnouncement = useCallback(() => {
		if (!isEditMode || announcementId === undefined) {
			return;
		}

		requestIdRef.current += 1;
		const requestId = requestIdRef.current;
		setIsLoading(true);
		setLoadError(null);
		setMessage(null);

		void Promise.all([
			getAdminAnnouncementAction(announcementId),
			listAnnouncementVersionsAction(announcementId),
		])
			.then(([announcementResult, versionsResult]) => {
				if (requestIdRef.current !== requestId) {
					return;
				}
				if (announcementResult.status === 'error') {
					if (
						checkAdminUnauthorizedActionResult(announcementResult)
					) {
						clearAdminSession();
						setAdmin(null);
						return;
					}

					setLoadError(announcementResult.message);
					return;
				}

				setLoadError(null);
				applyAnnouncement(announcementResult.data.announcement);
				if (versionsResult.status === 'ok') {
					setVersions(versionsResult.data);
				}
			})
			.catch((error: unknown) => {
				if (requestIdRef.current !== requestId) {
					return;
				}
				setLoadError(
					error instanceof Error ? error.message : '读取站点通知失败'
				);
			})
			.finally(() => {
				if (requestIdRef.current === requestId) {
					setIsLoading(false);
				}
			});
	}, [announcementId, applyAnnouncement, isEditMode]);

	const checkAdmin = useCallback(() => {
		requestIdRef.current += 1;
		const requestId = requestIdRef.current;
		setIsAuthLoading(true);
		setMessage(null);

		void checkAdminAction()
			.then((result) => {
				if (requestIdRef.current !== requestId) {
					return;
				}
				if (result.status === 'error') {
					if (checkAdminUnauthorizedActionResult(result)) {
						clearAdminSession();
						setAdmin(null);
						return;
					}

					setMessage(result.message);
					return;
				}

				store.shared.adminCsrfToken.set(result.data.csrf_token);
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
	}, []);

	const handlePreview = useCallback(() => {
		if (formBody === null || csrfToken === null) {
			return;
		}

		setIsSaving(true);
		setPreview(null);
		setMessage(null);

		void previewAnnouncementAction(formBody, csrfToken)
			.then((result) => {
				if (result.status === 'error') {
					handleActionError(result);
					return;
				}

				setPreview(result.data);
			})
			.catch((error: unknown) => {
				setMessage(error instanceof Error ? error.message : '预览失败');
			})
			.finally(() => {
				setIsSaving(false);
			});
	}, [csrfToken, formBody, handleActionError]);

	const handleSave = useCallback(() => {
		if (formBody === null || csrfToken === null) {
			return;
		}

		setIsSaving(true);
		setMessage(null);
		setPreview(null);

		const request = isEditMode
			? updateAnnouncementAction(formBody.id, formBody, csrfToken)
			: createAnnouncementAction(formBody, csrfToken);

		void request
			.then((result) => {
				if (result.status === 'error') {
					handleActionError(result);
					return;
				}

				applyAnnouncement(result.data.announcement);
				setMessage(isEditMode ? '站点通知已保存' : '站点通知已创建');
				refreshVersions(result.data.announcement.id);
				if (!isEditMode) {
					router.replace(
						`/admin/announcements/${encodeURIComponent(
							result.data.announcement.id
						)}`
					);
				}
			})
			.catch((error: unknown) => {
				setMessage(error instanceof Error ? error.message : '保存失败');
			})
			.finally(() => {
				setIsSaving(false);
			});
	}, [
		applyAnnouncement,
		csrfToken,
		formBody,
		handleActionError,
		isEditMode,
		refreshVersions,
		router,
	]);

	const handleArchive = useCallback(() => {
		const targetId = announcement?.id ?? announcementId;
		if (targetId === undefined || csrfToken === null) {
			return;
		}

		setIsSaving(true);
		setMessage(null);
		setIsArchivePopoverOpen(false);

		void archiveAnnouncementAction(targetId, csrfToken)
			.then((result) => {
				if (result.status === 'error') {
					handleActionError(result);
					return;
				}

				applyAnnouncement(result.data.announcement);
				setMessage('站点通知已归档');
				refreshVersions(result.data.announcement.id);
			})
			.catch((error: unknown) => {
				setMessage(error instanceof Error ? error.message : '归档失败');
			})
			.finally(() => {
				setIsSaving(false);
			});
	}, [
		announcement?.id,
		announcementId,
		applyAnnouncement,
		csrfToken,
		handleActionError,
		refreshVersions,
	]);

	const handleRestore = useCallback(() => {
		const targetId = announcement?.id ?? announcementId;
		if (targetId === undefined || csrfToken === null) {
			return;
		}

		setIsSaving(true);
		setMessage(null);

		void restoreAnnouncementAction(targetId, csrfToken)
			.then((result) => {
				if (result.status === 'error') {
					handleActionError(result);
					return;
				}

				applyAnnouncement(result.data.announcement);
				setMessage('站点通知已恢复');
				refreshVersions(result.data.announcement.id);
			})
			.catch((error: unknown) => {
				setMessage(error instanceof Error ? error.message : '恢复失败');
			})
			.finally(() => {
				setIsSaving(false);
			});
	}, [
		announcement?.id,
		announcementId,
		applyAnnouncement,
		csrfToken,
		handleActionError,
		refreshVersions,
	]);

	const handleTargetUserSelect = useCallback(
		(key: Key | null) => {
			if (key === null) {
				return;
			}

			const selectedUser = targetUserOptions.find(
				(user) => user.id === String(key)
			);
			if (selectedUser === undefined) {
				return;
			}

			const targetUser = createTargetUserFromProfile(selectedUser);
			setTargetUsers((current) =>
				current.some((user) => checkSameTargetUser(user, targetUser))
					? current
					: [...current, targetUser]
			);
			setTargetUserQuery('');
			setTargetUserOptions([]);
		},
		[targetUserOptions]
	);

	const handleRemoveTargetUser = useCallback((id: string) => {
		setTargetUsers((current) => current.filter((user) => user.id !== id));
	}, []);

	useEffect(() => {
		if (admin === null || missingTargetUserIds.length === 0) {
			return;
		}

		const requestId = targetUserRequestIdRef.current + 1;
		targetUserRequestIdRef.current = requestId;

		void getAdminUsersByIdsAction(missingTargetUserIds)
			.then((result) => {
				if (targetUserRequestIdRef.current !== requestId) {
					return;
				}
				if (result.status === 'error') {
					if (checkAdminUnauthorizedActionResult(result)) {
						clearAdminSession();
						setAdmin(null);
						return;
					}

					setMessage(result.message);
					return;
				}

				setTargetUsers((current) =>
					mergeTargetUserProfiles(current, result.data.users)
				);
			})
			.catch((error: unknown) => {
				if (targetUserRequestIdRef.current !== requestId) {
					return;
				}

				setMessage(
					error instanceof Error ? error.message : '读取指定用户失败'
				);
			});
	}, [admin, missingTargetUserIds]);

	useEffect(
		() => () => {
			requestIdRef.current += 1;
			targetUserRequestIdRef.current += 1;
		},
		[]
	);

	useEffect(() => {
		if (audience !== 'targeted') {
			targetUserRequestIdRef.current += 1;
			setIsTargetUsersLoading(false);
			setTargetUserOptions([]);
			setTargetUserQuery('');
			return;
		}

		const query = targetUserQuery.trim();
		if (query.length === 0) {
			targetUserRequestIdRef.current += 1;
			setIsTargetUsersLoading(false);
			setTargetUserOptions([]);
			return;
		}

		const requestId = targetUserRequestIdRef.current + 1;
		targetUserRequestIdRef.current = requestId;
		setIsTargetUsersLoading(true);

		const timeoutId = globalThis.setTimeout(() => {
			void listAdminUsersAction({ page: 1, query })
				.then((result) => {
					if (targetUserRequestIdRef.current !== requestId) {
						return;
					}
					if (result.status === 'error') {
						if (checkAdminUnauthorizedActionResult(result)) {
							clearAdminSession();
							setAdmin(null);
							return;
						}

						setMessage(result.message);
						setTargetUserOptions([]);
						return;
					}

					setTargetUserOptions(
						result.data.users.filter((user) => {
							const targetUser =
								createTargetUserFromProfile(user);

							return !targetUsers.some((current) =>
								checkSameTargetUser(current, targetUser)
							);
						})
					);
				})
				.catch((error: unknown) => {
					if (targetUserRequestIdRef.current !== requestId) {
						return;
					}

					setMessage(
						error instanceof Error ? error.message : '搜索用户失败'
					);
				})
				.finally(() => {
					if (targetUserRequestIdRef.current === requestId) {
						setIsTargetUsersLoading(false);
					}
				});
		}, 300);

		return () => {
			globalThis.clearTimeout(timeoutId);
		};
	}, [audience, targetUserQuery, targetUsers]);

	useEffect(() => {
		if (initialData.admin !== null) {
			store.shared.adminCsrfToken.set(initialData.admin.csrf_token);
			setIsAuthLoading(false);
			return;
		}

		checkAdmin();
	}, [checkAdmin, initialData.admin]);

	useEffect(() => {
		if (
			admin !== null &&
			isEditMode &&
			!initialData.isAnnouncementServerLoaded
		) {
			refreshAnnouncement();
		}
	}, [
		admin,
		initialData.isAnnouncementServerLoaded,
		isEditMode,
		refreshAnnouncement,
	]);

	if (isAuthLoading) {
		return (
			<AdminShell>
				<AdminHeader
					icon={faShieldHalved}
					subtitle="正在校验管理员会话"
					title="站点通知"
				/>
				<AdminPanel className="flex items-center gap-3 text-small text-foreground-500">
					<Button isLoading variant="flat">
						加载中
					</Button>
					<span>读取会话状态</span>
				</AdminPanel>
			</AdminShell>
		);
	}

	if (admin === null) {
		return (
			<AdminShell>
				<AdminHeader
					actions={
						<Button
							as={Link}
							animationUnderline={false}
							href="/admin"
							variant="flat"
						>
							返回管理员页
						</Button>
					}
					icon={faShieldHalved}
					subtitle={message ?? '请先返回管理员页登录'}
					title="站点通知"
				/>
			</AdminShell>
		);
	}

	if (loadError !== null && isEditMode && announcement === null) {
		return (
			<AdminShell>
				<AdminHeader
					actions={
						<>
							<Button
								as={Link}
								animationUnderline={false}
								href="/admin/announcements"
								startContent={
									<FontAwesomeIcon
										icon={faArrowLeft}
										className="w-3.5"
									/>
								}
								variant="flat"
							>
								返回列表
							</Button>
							<Button
								isLoading={isLoading}
								startContent={
									isLoading ? null : (
										<FontAwesomeIcon
											icon={faRotate}
											className="w-3.5"
										/>
									)
								}
								variant="flat"
								onPress={refreshAnnouncement}
							>
								重试
							</Button>
						</>
					}
					icon={faBullhorn}
					subtitle={loadError}
					title="编辑站点通知"
				/>
			</AdminShell>
		);
	}

	const pageTitle = isEditMode ? '编辑站点通知' : '新建站点通知';
	const statusLabel =
		preview?.computed_status ?? announcement?.computed_status ?? null;
	const isArchived = announcement?.computed_status === 'archived';
	const hasVersionRows = versions !== null && versions.versions.length > 0;

	return (
		<AdminShell>
			<AdminHeader
				actions={
					<>
						<Button
							as={Link}
							animationUnderline={false}
							href="/admin/announcements"
							startContent={
								<FontAwesomeIcon
									icon={faArrowLeft}
									className="w-3.5"
								/>
							}
							variant="flat"
						>
							返回列表
						</Button>
						<Button
							isDisabled={formBody === null || csrfToken === null}
							isLoading={isSaving}
							startContent={
								isSaving ? null : (
									<FontAwesomeIcon
										icon={faEye}
										className="w-3.5"
									/>
								)
							}
							variant="flat"
							onPress={handlePreview}
						>
							预览
						</Button>
						<Button
							color="primary"
							isDisabled={formBody === null || csrfToken === null}
							isLoading={isSaving}
							startContent={
								isSaving ? null : (
									<FontAwesomeIcon
										icon={faSave}
										className="w-3.5"
									/>
								)
							}
							variant="flat"
							onPress={handleSave}
						>
							保存
						</Button>
						{isEditMode && isArchived && (
							<Button
								color="primary"
								isDisabled={csrfToken === null || isSaving}
								isLoading={isSaving}
								startContent={
									isSaving ? null : (
										<FontAwesomeIcon
											icon={faRotate}
											className="w-3.5"
										/>
									)
								}
								variant="flat"
								onPress={handleRestore}
							>
								恢复归档
							</Button>
						)}
						{isEditMode && !isArchived && (
							<Popover
								showArrow
								isOpen={isArchivePopoverOpen}
								onOpenChange={setIsArchivePopoverOpen}
							>
								<PopoverTrigger>
									<Button
										color="warning"
										isDisabled={
											csrfToken === null || isSaving
										}
										startContent={
											<FontAwesomeIcon
												icon={faFileArchive}
												className="w-3.5"
											/>
										}
										variant="flat"
									>
										归档
									</Button>
								</PopoverTrigger>
								<PopoverContent className="space-y-1 p-1">
									<Button
										fullWidth
										color="warning"
										isDisabled={isSaving}
										size="sm"
										variant="ghost"
										onPress={handleArchive}
									>
										确认归档
									</Button>
									<Button
										fullWidth
										color="primary"
										size="sm"
										variant="ghost"
										onPress={() => {
											setIsArchivePopoverOpen(false);
										}}
									>
										取消
									</Button>
								</PopoverContent>
							</Popover>
						)}
					</>
				}
				icon={faBullhorn}
				subtitle={announcement?.id ?? undefined}
				title={pageTitle}
			/>

			{message !== null && <AdminMessage message={message} />}

			<AdminPanel className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<AdminMetric
					label="状态"
					value={
						statusLabel === null
							? '未保存'
							: STATUS_LABEL_MAP[statusLabel]
					}
				/>
				<AdminMetric
					label="版本"
					value={
						announcement === null ? '未保存' : announcement.revision
					}
				/>
				<AdminMetric
					label="开始时间"
					value={
						startsAt === undefined
							? '无效'
							: createDateTimeLabel(startsAt)
					}
				/>
				<AdminMetric
					label="结束时间"
					value={
						endsAt === undefined
							? '无效'
							: createDateTimeLabel(endsAt)
					}
				/>
			</AdminPanel>

			<AdminAnnouncementUserPreview
				dismissible={dismissible}
				level={level}
				preview={preview}
			/>

			<div className="grid gap-4">
				<AdminPanel className="space-y-4">
					<AdminPanelTitle icon={faBullhorn}>
						通知内容
					</AdminPanelTitle>
					<Input
						isDisabled={isEditMode || isSaving}
						label="ID"
						placeholder="留空自动生成"
						startContent={<AdminInputIcon icon={faBullhorn} />}
						value={id}
						onValueChange={setId}
					/>
					<Input
						isDisabled={isSaving}
						label="标题"
						value={title}
						onValueChange={setTitle}
					/>
					<Textarea
						description="支持常见文字style；用户变量：{{user.username}}、{{user.id}}"
						isDisabled={isSaving}
						label="HTML内容"
						minRows={8}
						value={html}
						classNames={textareaClassNames}
						onValueChange={setHtml}
					/>
					<div className="grid gap-3 md:grid-cols-2">
						<div className="flex items-center gap-2">
							<span className="whitespace-nowrap font-medium">
								等级：
							</span>
							<Select
								disallowEmptySelection
								aria-label="选择通知等级"
								classNames={compactSelectClassNames}
								isDisabled={isSaving}
								selectedKeys={new Set([level])}
								selectionMode="single"
								size="sm"
								variant="flat"
								onSelectionChange={(keys) => {
									const key = getSingleSelectionKey(keys);
									if (
										key !== null &&
										LEVEL_OPTIONS.some(
											(option) => option.key === key
										)
									) {
										setLevel(key as TAnnouncementLevel);
									}
								}}
							>
								{LEVEL_OPTIONS.map((option) => (
									<SelectItem
										key={option.key}
										textValue={option.label}
									>
										{option.label}
									</SelectItem>
								))}
							</Select>
						</div>
						<div className="flex items-center gap-2">
							<span className="whitespace-nowrap font-medium">
								受众：
							</span>
							<Select
								disallowEmptySelection
								aria-label="选择通知受众"
								classNames={audienceSelectClassNames}
								isDisabled={isSaving}
								selectedKeys={new Set([audience])}
								selectionMode="single"
								size="sm"
								variant="flat"
								onSelectionChange={(keys) => {
									const key = getSingleSelectionKey(keys);
									if (
										key !== null &&
										AUDIENCE_OPTIONS.some(
											(option) => option.key === key
										)
									) {
										setAudience(
											key as TAnnouncementAudience
										);
									}
								}}
							>
								{AUDIENCE_OPTIONS.map((option) => (
									<SelectItem
										key={option.key}
										textValue={option.label}
									>
										{option.label}
									</SelectItem>
								))}
							</Select>
						</div>
					</div>
					{audience === 'targeted' && (
						<div className="space-y-3 rounded-small border border-default-200/80 px-3 py-3">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<span className="inline-flex items-center gap-2 text-small font-medium text-foreground-700">
									<FontAwesomeIcon
										icon={faUsers}
										className="w-3.5 text-foreground-400"
									/>
									指定用户
								</span>
								<span className="text-tiny text-foreground-500">
									已选择 {targetUsers.length} 个用户
								</span>
							</div>
							<Autocomplete
								allowsCustomValue
								defaultItems={targetUserOptions}
								inputValue={targetUserQuery}
								isDisabled={isSaving}
								isLoading={isTargetUsersLoading}
								isVirtualized={false}
								label="搜索用户名或用户ID"
								placeholder="输入用户名或用户ID"
								selectedKey={null}
								startContent={
									<AdminInputIcon icon={faMagnifyingGlass} />
								}
								variant="flat"
								classNames={targetUserAutocompleteClassNames}
								onInputChange={setTargetUserQuery}
								onSelectionChange={handleTargetUserSelect}
							>
								{(user) => (
									<AutocompleteItem
										key={user.id}
										textValue={`${user.username} ${user.id}`}
									>
										<div className="flex min-w-0 flex-col">
											<span className="truncate text-small font-medium">
												{user.username}
											</span>
											<span className="truncate font-mono text-tiny text-foreground-400">
												{user.id}
											</span>
										</div>
									</AutocompleteItem>
								)}
							</Autocomplete>
							{targetUsers.length === 0 ? (
								<p className="text-tiny text-danger-500">
									至少选择一个用户后才能保存指定用户通知
								</p>
							) : (
								<div className="flex flex-wrap gap-2">
									{targetUsers.map((user) => (
										<span
											key={user.id}
											className="inline-flex max-w-full items-center gap-2 rounded-small border border-primary/20 bg-primary/10 px-2 py-1 text-small text-primary-700 dark:text-primary"
										>
											<span className="min-w-0">
												<span className="block truncate font-medium">
													{user.username ??
														'未知用户'}
												</span>
												<span className="block truncate font-mono text-[0.65rem] opacity-70">
													{user.id}
												</span>
											</span>
											<Button
												isIconOnly
												aria-label={`移除 ${user.username ?? user.id}`}
												className="h-6 min-h-6 w-6 min-w-6 shrink-0"
												isDisabled={isSaving}
												radius="sm"
												size="sm"
												variant="light"
												onPress={() => {
													handleRemoveTargetUser(
														user.id
													);
												}}
											>
												<FontAwesomeIcon
													icon={faXmark}
													className="w-3"
												/>
											</Button>
										</span>
									))}
								</div>
							)}
						</div>
					)}
					<div className="grid gap-3 md:grid-cols-3">
						<div className="space-y-1.5">
							<span className="text-small font-medium text-foreground-600">
								优先级
							</span>
							<Input
								aria-label="优先级"
								isDisabled={isSaving}
								type="number"
								value={priority}
								onValueChange={setPriority}
							/>
						</div>
						<div className="space-y-1.5">
							<span className="text-small font-medium text-foreground-600">
								开始时间
							</span>
							<Input
								aria-label="开始时间"
								isDisabled={isSaving}
								type="datetime-local"
								value={startsAtInput}
								onValueChange={setStartsAtInput}
							/>
						</div>
						<div className="space-y-1.5">
							<span className="text-small font-medium text-foreground-600">
								结束时间
							</span>
							<Input
								aria-label="结束时间"
								isDisabled={isSaving}
								type="datetime-local"
								value={endsAtInput}
								onValueChange={setEndsAtInput}
							/>
						</div>
					</div>
					<div className="flex flex-wrap gap-4 rounded-small border border-default-200/80 px-3 py-2">
						<Switch
							isDisabled={isSaving}
							isSelected={enabled}
							onValueChange={setEnabled}
						>
							启用
						</Switch>
						<Switch
							isDisabled={isSaving}
							isSelected={dismissible}
							onValueChange={setDismissible}
						>
							允许单条关闭
						</Switch>
					</div>
				</AdminPanel>

				<div className="space-y-4">
					<AdminPanel className="space-y-3">
						<AdminPanelTitle icon={faClockRotateLeft}>
							版本历史
						</AdminPanelTitle>
						{hasVersionRows ? (
							<AdminTable>
								<AdminTableHeader>
									<tr>
										<th className={tableHeadCellClassName}>
											版本
										</th>
										<th className={tableHeadCellClassName}>
											动作
										</th>
										<th className={tableHeadCellClassName}>
											变更
										</th>
									</tr>
								</AdminTableHeader>
								<tbody>
									{versions.versions.map((version) => (
										<AdminTableRow key={version.id}>
											<td className={tableCellClassName}>
												<div className="whitespace-nowrap font-medium">
													#{version.revision}
												</div>
												<div className="whitespace-nowrap text-tiny text-foreground-500">
													{new Date(
														version.changed_at
													).toLocaleString('zh-CN')}
												</div>
											</td>
											<td className={tableCellClassName}>
												{
													VERSION_ACTION_LABEL_MAP[
														version.action
													]
												}
												<div className="text-tiny text-foreground-500">
													{version.changed_by ??
														'系统'}
												</div>
											</td>
											<td className={tableCellClassName}>
												{version.changed_fields
													.length === 0 ? (
													<span className="text-foreground-400">
														无字段变化
													</span>
												) : (
													<div className="space-y-1">
														{version.changed_fields.map(
															(field) => (
																<div
																	key={
																		field.field
																	}
																	className="break-words text-tiny leading-5"
																>
																	<span className="font-medium">
																		{getChangedFieldLabel(
																			field.field
																		)}
																	</span>
																	<span className="text-foreground-400">
																		：
																	</span>
																	{getChangedFieldValue(
																		field.previous
																	)}
																	<span className="mx-1 text-foreground-400">
																		→
																	</span>
																	{getChangedFieldValue(
																		field.next
																	)}
																</div>
															)
														)}
													</div>
												)}
											</td>
										</AdminTableRow>
									))}
								</tbody>
							</AdminTable>
						) : (
							<AdminEmptyState icon={faClockRotateLeft}>
								暂无版本记录
							</AdminEmptyState>
						)}
					</AdminPanel>
				</div>
			</div>
		</AdminShell>
	);
}
