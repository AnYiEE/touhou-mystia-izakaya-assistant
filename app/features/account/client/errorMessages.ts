import type { TLocalizedMessageTable } from '@/shared/i18n/messages';

const ACCOUNT_ERROR_MESSAGES_ZH_CN = {
	'account.error.account-disabled-offline': '离线包不支持账号功能',
	'account.error.account-logout-failed': '退出失败',
	'account.error.account-operation-busy':
		'账号数据操作正在其他标签页进行，请稍后重试',
	'account.error.account-sync-pause-incomplete':
		'云端数据已清空，请刷新页面后再恢复云同步',
	'account.error.account-sync-reset-incomplete':
		'本地同步重置尚未完成，系统会自动重试',
	'account.error.backup-code-already-imported': '这个旧备份码已被导入',
	'account.error.backup-code-lock-lost': '旧备份码正在被处理，请稍后重试',
	'account.error.backup-code-lock-timeout': '旧备份码处理超时，请重试',
	'account.error.backup-code-not-found':
		'没有找到这个旧备份码，可能已过期、已导入或已被删除',
	'account.error.bootstrap-failed': '账号初始化失败，请刷新页面重试',
	'account.error.cannot-revoke-current-session':
		'不能在这里撤销当前会话，请使用退出登录',
	'account.error.challenge-expired': '通行密钥操作已超时，请重试',
	'account.error.challenge-not-found': '通行密钥操作已失效，请重试',
	'account.error.conflict': '数据冲突，请在冲突解决面板中处理',
	'account.error.conflict-storage-unavailable':
		'浏览器暂时无法保存同步状态，现有数据未被修改',
	'account.error.credential-changed':
		'账号凭据已在其他页面更新，请重新确认账号状态',
	'account.error.credential-state-stale': '登录状态刚刚变化，请刷新后重试',
	'account.error.fallback': '操作失败，请稍后重试',
	'account.error.forbidden': '登录状态已变化，请刷新后重试',
	'account.error.invalid-api-response': '服务器响应异常，请重试',
	'account.error.invalid-backup-code':
		'旧备份码格式不正确，请检查是否完整复制',
	'account.error.invalid-backup-file':
		'这个旧备份码中的数据无法读取，可能已经损坏',
	'account.error.invalid-credentials': '用户名或密码不正确',
	'account.error.invalid-nickname': '昵称格式不符合要求',
	'account.error.invalid-object-structure': '提交内容格式异常',
	'account.error.invalid-passkey-name': '通行密钥名称格式不符合要求',
	'account.error.invalid-password': '当前密码不正确',
	'account.error.invalid-user-status': '账号状态不允许执行此操作',
	'account.error.invalid-username': '用户名格式不符合要求',
	'account.error.legacy-backup-disabled-offline': '离线包不支持旧云备份功能',
	'account.error.legacy-import-failed': '旧备份码导入失败，请重试',
	'account.error.legacy-import-local-takeover-failed':
		'本地数据接管失败，请刷新页面后重试',
	'account.error.legacy-import-sync-pending':
		'当前账号同步尚未完成，请稍后重试',
	'account.error.local-takeover-failed': '本地数据接管失败，请刷新页面后重试',
	'account.error.passkey-not-found': '通行密钥不存在',
	'account.error.password-already-set': '已设置登录密码，请使用修改密码',
	'account.error.password-change-failed': '改密失败',
	'account.error.password-must-change': '需要先更新密码后才能继续同步',
	'account.error.password-not-set': '请先设置登录密码',
	'account.error.payload-too-large': '提交内容过大，请检查输入',
	'account.error.quarantine-storage-failed':
		'本地存储空间不足，无法安全隔离同步数据；原始数据已保留，请先释放空间后重试',
	'account.error.remote-conflict-source-unavailable':
		'产生冲突的标签页暂时不可用，请回到该标签页或刷新后重试',
	'account.error.server-misconfigured': '服务器账号配置异常',
	'account.error.session-not-found': '登录设备已失效，请刷新后重试',
	'account.error.session-revoked': '已下线登录设备',
	'account.error.state-epoch-mismatch': '账号数据刚刚变化，请刷新后重试',
	'account.error.sync-account-capacity-exceeded':
		'账号同步数据已超过服务端总容量，请先缩减套餐或其他同步数据',
	'account.error.sync-account-restore-incomplete':
		'账号已恢复，但本地同步状态尚未安全重置，请刷新页面后重试',
	'account.error.sync-client-update-required':
		'当前版本无法处理部分云同步状态，请刷新页面或更新应用',
	'account.error.sync-conflict': '账号数据存在冲突，请先处理冲突后重试',
	'account.error.sync-failed': '同步失败，请刷新页面重试',
	'account.error.sync-generation-mismatch':
		'云同步状态刚刚变化，请刷新后重试',
	'account.error.sync-paused': '云同步已暂停，请先用本设备数据恢复云同步',
	'account.error.sync-rebuild-conflict':
		'其他设备已更新云端，正在重新协调本地数据',
	'account.error.sync-rebuild-failed': '恢复云同步失败，请稍后重试',
	'account.error.sync-refresh-failed': '刷新同步状态失败，请刷新页面重试',
	'account.error.sync-request-too-large':
		'单次同步请求过大，请缩减对应类别的同步数据后重试',
	'account.error.sync-reset-marker-future':
		'本地存在更高版本的同步重置状态，请更新客户端后再继续',
	'account.error.sync-reset-marker-invalid':
		'本地同步重置状态已损坏，请先导出本地数据并明确清理后再继续',
	'account.error.sync-schema-update-required':
		'云端数据由更新版本创建，请刷新页面或更新应用后再同步',
	'account.error.too-many-passkeys':
		'通行密钥数量已达上限，请先删除部分通行密钥',
	'account.error.too-many-requests': '尝试次数过多，请稍后再试',
	'account.error.unauthorized': '登录已过期，请重新登录',
	'account.error.user-deleted': '账号已删除。如需恢复，请联系管理员',
	'account.error.user-disabled': '账号已停用。如需启用，请联系管理员',
	'account.error.username-conflict': '用户名已被使用',
	'account.error.webauthn-canceled': '通行密钥操作已取消',
	'account.error.webauthn-failed': '通行密钥操作失败，请重试',
	'account.error.webauthn-timeout':
		'验证尚未完成，若未收到系统提示，请使用用户名和密码注册/登录',
	'account.error.webauthn-verification-failed': '通行密钥验证失败，请重试',
} as const;

export type TAccountErrorMessageKey = keyof typeof ACCOUNT_ERROR_MESSAGES_ZH_CN;

export const ACCOUNT_ERROR_MESSAGE_KEY_SET: ReadonlySet<string> = new Set(
	Object.keys(ACCOUNT_ERROR_MESSAGES_ZH_CN)
);

export const accountErrorMessages = {
	en: {
		'account.error.account-disabled-offline':
			'Accounts are not available in the offline package',
		'account.error.account-logout-failed': 'Sign-out failed',
		'account.error.account-operation-busy':
			'Account data is being modified in another tab; try again later',
		'account.error.account-sync-pause-incomplete':
			'Cloud data has been cleared; refresh the page before resuming cloud sync',
		'account.error.account-sync-reset-incomplete':
			'Local sync reset has not finished; the system will retry automatically',
		'account.error.backup-code-already-imported':
			'This legacy backup code has already been imported',
		'account.error.backup-code-lock-lost':
			'This legacy backup code is being processed; try again later',
		'account.error.backup-code-lock-timeout':
			'Processing the legacy backup code timed out; try again',
		'account.error.backup-code-not-found':
			'This legacy backup code was not found; it may have expired, been imported, or been deleted',
		'account.error.bootstrap-failed':
			'Account initialization failed; refresh the page and try again',
		'account.error.cannot-revoke-current-session':
			'You cannot revoke the current session here; use sign-out instead',
		'account.error.challenge-expired':
			'The passkey operation timed out; try again',
		'account.error.challenge-not-found':
			'The passkey operation is no longer valid; try again',
		'account.error.conflict':
			'Data conflict; resolve it in the conflict panel',
		'account.error.conflict-storage-unavailable':
			'The browser cannot save sync state right now; existing data was not modified',
		'account.error.credential-changed':
			'Account credentials were updated in another page; re-confirm the account state',
		'account.error.credential-state-stale':
			'The sign-in state just changed; refresh and try again',
		'account.error.fallback': 'Operation failed; try again later',
		'account.error.forbidden':
			'The sign-in state has changed; refresh and try again',
		'account.error.invalid-api-response':
			'Unexpected server response; try again',
		'account.error.invalid-backup-code':
			'The legacy backup code is malformed; check that it was copied in full',
		'account.error.invalid-backup-file':
			'The data in this legacy backup code cannot be read; it may be corrupted',
		'account.error.invalid-credentials': 'Incorrect username or password',
		'account.error.invalid-nickname':
			'The nickname format does not meet the requirements',
		'account.error.invalid-object-structure':
			'The submitted content is malformed',
		'account.error.invalid-passkey-name':
			'The passkey name format does not meet the requirements',
		'account.error.invalid-password': 'The current password is incorrect',
		'account.error.invalid-user-status':
			'The account status does not allow this operation',
		'account.error.invalid-username':
			'The username format does not meet the requirements',
		'account.error.legacy-backup-disabled-offline':
			'The offline package does not support legacy cloud backup',
		'account.error.legacy-import-failed':
			'Legacy backup code import failed; try again',
		'account.error.legacy-import-local-takeover-failed':
			'Local data takeover failed; refresh the page and try again',
		'account.error.legacy-import-sync-pending':
			'Account sync has not finished yet; try again later',
		'account.error.local-takeover-failed':
			'Local data takeover failed; refresh the page and try again',
		'account.error.passkey-not-found': 'The passkey does not exist',
		'account.error.password-already-set':
			'A sign-in password is already set; use change password instead',
		'account.error.password-change-failed': 'Password change failed',
		'account.error.password-must-change':
			'Update your password before sync can continue',
		'account.error.password-not-set': 'Set a sign-in password first',
		'account.error.payload-too-large':
			'The submitted content is too large; check your input',
		'account.error.quarantine-storage-failed':
			'Not enough local storage to safely quarantine sync data; the original data is preserved—free up space and try again',
		'account.error.remote-conflict-source-unavailable':
			'The tab that produced the conflict is temporarily unavailable; return to that tab or refresh and try again',
		'account.error.server-misconfigured':
			'Server account configuration error',
		'account.error.session-not-found':
			'The signed-in device is no longer valid; refresh and try again',
		'account.error.session-revoked': 'Signed-in device removed',
		'account.error.state-epoch-mismatch':
			'Account data just changed; refresh and try again',
		'account.error.sync-account-capacity-exceeded':
			'Account sync data exceeds the server capacity; reduce plans or other synced data first',
		'account.error.sync-account-restore-incomplete':
			'The account was restored, but local sync state has not been safely reset; refresh the page and try again',
		'account.error.sync-client-update-required':
			'This version cannot handle some cloud sync states; refresh the page or update the app',
		'account.error.sync-conflict':
			'Account data has conflicts; resolve them before retrying',
		'account.error.sync-failed':
			'Sync failed; refresh the page and try again',
		'account.error.sync-generation-mismatch':
			'Cloud sync state just changed; refresh and try again',
		'account.error.sync-paused':
			'Cloud sync is paused; restore cloud sync with this device’s data first',
		'account.error.sync-rebuild-conflict':
			'Another device updated the cloud; reconciling local data',
		'account.error.sync-rebuild-failed':
			'Failed to restore cloud sync; try again later',
		'account.error.sync-refresh-failed':
			'Failed to refresh the sync status; refresh the page and try again',
		'account.error.sync-request-too-large':
			'A single sync request is too large; reduce the corresponding sync data and try again',
		'account.error.sync-reset-marker-future':
			'A newer sync reset state exists locally; update the client before continuing',
		'account.error.sync-reset-marker-invalid':
			'The local sync reset state is corrupted; export local data and clear it explicitly before continuing',
		'account.error.sync-schema-update-required':
			'Cloud data was created by a newer version; refresh the page or update the app before syncing',
		'account.error.too-many-passkeys':
			'Passkey limit reached; delete some passkeys first',
		'account.error.too-many-requests': 'Too many attempts; try again later',
		'account.error.unauthorized': 'Sign-in expired; sign in again',
		'account.error.user-deleted':
			'The account was deleted. Contact the administrator to restore it',
		'account.error.user-disabled':
			'The account is disabled. Contact the administrator to enable it',
		'account.error.username-conflict': 'The username is already taken',
		'account.error.webauthn-canceled': 'The passkey operation was canceled',
		'account.error.webauthn-failed':
			'The passkey operation failed; try again',
		'account.error.webauthn-timeout':
			'Verification is not complete; if no system prompt appeared, sign in or register with your username and password',
		'account.error.webauthn-verification-failed':
			'Passkey verification failed; try again',
	},
	ja: {
		'account.error.account-disabled-offline':
			'オフラインパッケージではアカウント機能を利用できません',
		'account.error.account-logout-failed': 'ログアウトに失敗しました',
		'account.error.account-operation-busy':
			'別のタブでアカウントデータを操作中です。しばらくしてから再試行してください',
		'account.error.account-sync-pause-incomplete':
			'クラウドデータを消去しました。ページを更新してからクラウド同期を再開してください',
		'account.error.account-sync-reset-incomplete':
			'ローカル同期のリセットが未完了です。システムが自動的に再試行します',
		'account.error.backup-code-already-imported':
			'この旧バックアップコードはすでにインポート済みです',
		'account.error.backup-code-lock-lost':
			'旧バックアップコードを処理中です。しばらくしてから再試行してください',
		'account.error.backup-code-lock-timeout':
			'旧バックアップコードの処理がタイムアウトしました。再試行してください',
		'account.error.backup-code-not-found':
			'この旧バックアップコードは見つかりません。期限切れ・インポート済み・削除済みの可能性があります',
		'account.error.bootstrap-failed':
			'アカウントの初期化に失敗しました。ページを更新して再試行してください',
		'account.error.cannot-revoke-current-session':
			'現在のセッションはここでは解除できません。ログアウトを使用してください',
		'account.error.challenge-expired':
			'パスキー操作がタイムアウトしました。再試行してください',
		'account.error.challenge-not-found':
			'パスキー操作は無効になりました。再試行してください',
		'account.error.conflict':
			'データ競合が発生しました。競合解決パネルで処理してください',
		'account.error.conflict-storage-unavailable':
			'ブラウザが現在同期状態を保存できません。既存データは変更されていません',
		'account.error.credential-changed':
			'アカウント資格情報が別のページで更新されました。状態を再確認してください',
		'account.error.credential-state-stale':
			'ログイン状態が直前に変化しました。更新して再試行してください',
		'account.error.fallback':
			'操作に失敗しました。しばらくしてから再試行してください',
		'account.error.forbidden':
			'ログイン状態が変化しました。更新して再試行してください',
		'account.error.invalid-api-response':
			'サーバー応答が異常です。再試行してください',
		'account.error.invalid-backup-code':
			'旧バックアップコードの形式が正しくありません。全体をコピーしたか確認してください',
		'account.error.invalid-backup-file':
			'この旧バックアップコードのデータを読み取れません。破損している可能性があります',
		'account.error.invalid-credentials':
			'ユーザー名またはパスワードが正しくありません',
		'account.error.invalid-nickname':
			'ニックネームの形式が要件を満たしていません',
		'account.error.invalid-object-structure': '送信内容の形式が異常です',
		'account.error.invalid-passkey-name':
			'パスキー名の形式が要件を満たしていません',
		'account.error.invalid-password': '現在のパスワードが正しくありません',
		'account.error.invalid-user-status':
			'アカウント状態ではこの操作を実行できません',
		'account.error.invalid-username':
			'ユーザー名の形式が要件を満たしていません',
		'account.error.legacy-backup-disabled-offline':
			'オフラインパッケージでは旧クラウドバックアップを利用できません',
		'account.error.legacy-import-failed':
			'旧バックアップコードのインポートに失敗しました。再試行してください',
		'account.error.legacy-import-local-takeover-failed':
			'ローカルデータの引き継ぎに失敗しました。ページを更新して再試行してください',
		'account.error.legacy-import-sync-pending':
			'アカウント同期がまだ完了していません。しばらくしてから再試行してください',
		'account.error.local-takeover-failed':
			'ローカルデータの引き継ぎに失敗しました。ページを更新して再試行してください',
		'account.error.passkey-not-found': 'パスキーが存在しません',
		'account.error.password-already-set':
			'ログインパスワードは設定済みです。「パスワード変更」を使用してください',
		'account.error.password-change-failed': 'パスワード変更に失敗しました',
		'account.error.password-must-change':
			'同期を続けるには先にパスワードを更新してください',
		'account.error.password-not-set':
			'先にログインパスワードを設定してください',
		'account.error.payload-too-large':
			'送信内容が大きすぎます。入力を確認してください',
		'account.error.quarantine-storage-failed':
			'ローカルストレージが不足し、同期データを安全に隔離できません。元データは保持されています。容量を空けて再試行してください',
		'account.error.remote-conflict-source-unavailable':
			'競合を発生させたタブが一時的に利用できません。そのタブに戻るか、更新して再試行してください',
		'account.error.server-misconfigured':
			'サーバーのアカウント設定が異常です',
		'account.error.session-not-found':
			'ログイン端末が無効です。更新して再試行してください',
		'account.error.session-revoked': 'ログイン端末を解除しました',
		'account.error.state-epoch-mismatch':
			'アカウントデータが直前に変化しました。更新して再試行してください',
		'account.error.sync-account-capacity-exceeded':
			'アカウント同期データがサーバー容量を超えました。セットメニューなど同期データを減らしてください',
		'account.error.sync-account-restore-incomplete':
			'アカウントは復元されましたが、ローカル同期状態の安全なリセットが未完了です。ページを更新して再試行してください',
		'account.error.sync-client-update-required':
			'現在のバージョンでは一部のクラウド同期状態を処理できません。ページを更新するかアプリを更新してください',
		'account.error.sync-conflict':
			'アカウントデータに競合があります。先に競合を処理してから再試行してください',
		'account.error.sync-failed':
			'同期に失敗しました。ページを更新して再試行してください',
		'account.error.sync-generation-mismatch':
			'クラウド同期状態が直前に変化しました。更新して再試行してください',
		'account.error.sync-paused':
			'クラウド同期は一時停止中です。この端末のデータでクラウド同期を復元してください',
		'account.error.sync-rebuild-conflict':
			'別の端末がクラウドを更新しました。ローカルデータを再調整しています',
		'account.error.sync-rebuild-failed':
			'クラウド同期の復元に失敗しました。しばらくしてから再試行してください',
		'account.error.sync-refresh-failed':
			'同期状態の更新に失敗しました。ページを更新して再試行してください',
		'account.error.sync-request-too-large':
			'一度の同期リクエストが大きすぎます。該当カテゴリの同期データを減らして再試行してください',
		'account.error.sync-reset-marker-future':
			'ローカルに新しいバージョンの同期リセット状態があります。クライアントを更新してから続行してください',
		'account.error.sync-reset-marker-invalid':
			'ローカル同期リセット状態が破損しています。ローカルデータをエクスポートし、明示的にクリアしてから続行してください',
		'account.error.sync-schema-update-required':
			'クラウドデータは新しいバージョンで作成されました。ページを更新するかアプリを更新してから同期してください',
		'account.error.too-many-passkeys':
			'パスキーが上限に達しました。先に一部のパスキーを削除してください',
		'account.error.too-many-requests':
			'試行回数が多すぎます。しばらくしてからお試しください',
		'account.error.unauthorized':
			'ログインの有効期限が切れました。再ログインしてください',
		'account.error.user-deleted':
			'アカウントは削除されました。復元する場合は管理者にお問い合わせください',
		'account.error.user-disabled':
			'アカウントは無効化されています。有効化する場合は管理者にお問い合わせください',
		'account.error.username-conflict':
			'このユーザー名はすでに使用されています',
		'account.error.webauthn-canceled': 'パスキー操作はキャンセルされました',
		'account.error.webauthn-failed':
			'パスキー操作に失敗しました。再試行してください',
		'account.error.webauthn-timeout':
			'検証が未完了です。システムのプロンプトが表示されない場合は、ユーザー名とパスワードで登録/ログインしてください',
		'account.error.webauthn-verification-failed':
			'パスキー検証に失敗しました。再試行してください',
	},
	ko: {
		'account.error.account-disabled-offline':
			'오프라인 패키지에서는 계정 기능을 사용할 수 없습니다',
		'account.error.account-logout-failed': '로그아웃 실패',
		'account.error.account-operation-busy':
			'다른 탭에서 계정 데이터를 처리 중입니다. 잠시 후 다시 시도하세요',
		'account.error.account-sync-pause-incomplete':
			'클라우드 데이터가 비워졌습니다. 페이지를 새로고침한 뒤 클라우드 동기화를 재개하세요',
		'account.error.account-sync-reset-incomplete':
			'로컬 동기화 초기화가 아직 완료되지 않았습니다. 시스템이 자동으로 재시도합니다',
		'account.error.backup-code-already-imported':
			'이 구 백업 코드는 이미 가져왔습니다',
		'account.error.backup-code-lock-lost':
			'구 백업 코드를 처리 중입니다. 잠시 후 다시 시도하세요',
		'account.error.backup-code-lock-timeout':
			'구 백업 코드 처리 시간이 초과되었습니다. 다시 시도하세요',
		'account.error.backup-code-not-found':
			'이 구 백업 코드를 찾을 수 없습니다. 만료되었거나 이미 가져왔거나 삭제되었을 수 있습니다',
		'account.error.bootstrap-failed':
			'계정 초기화에 실패했습니다. 페이지를 새로고침한 뒤 다시 시도하세요',
		'account.error.cannot-revoke-current-session':
			'현재 세션은 여기서 해제할 수 없습니다. 로그아웃을 사용하세요',
		'account.error.challenge-expired':
			'패스키 작업 시간이 초과되었습니다. 다시 시도하세요',
		'account.error.challenge-not-found':
			'패스키 작업이 더 이상 유효하지 않습니다. 다시 시도하세요',
		'account.error.conflict':
			'데이터 충돌이 발생했습니다. 충돌 해결 패널에서 처리하세요',
		'account.error.conflict-storage-unavailable':
			'브라우저가 지금 동기화 상태를 저장할 수 없습니다. 기존 데이터는 변경되지 않았습니다',
		'account.error.credential-changed':
			'다른 페이지에서 계정 자격 증명이 갱신되었습니다. 계정 상태를 다시 확인하세요',
		'account.error.credential-state-stale':
			'로그인 상태가 방금 변경되었습니다. 새로고침한 뒤 다시 시도하세요',
		'account.error.fallback':
			'작업에 실패했습니다. 잠시 후 다시 시도하세요',
		'account.error.forbidden':
			'로그인 상태가 변경되었습니다. 새로고침한 뒤 다시 시도하세요',
		'account.error.invalid-api-response':
			'서버 응답이 비정상입니다. 다시 시도하세요',
		'account.error.invalid-backup-code':
			'구 백업 코드 형식이 올바르지 않습니다. 전체를 복사했는지 확인하세요',
		'account.error.invalid-backup-file':
			'이 구 백업 코드의 데이터를 읽을 수 없습니다. 손상되었을 수 있습니다',
		'account.error.invalid-credentials':
			'사용자 이름 또는 비밀번호가 틀립니다',
		'account.error.invalid-nickname':
			'닉네임 형식이 요구 사항을 충족하지 않습니다',
		'account.error.invalid-object-structure':
			'제출 내용 형식이 비정상입니다',
		'account.error.invalid-passkey-name':
			'패스키 이름 형식이 요구 사항을 충족하지 않습니다',
		'account.error.invalid-password': '현재 비밀번호가 틀립니다',
		'account.error.invalid-user-status':
			'계정 상태에서는 이 작업을 실행할 수 없습니다',
		'account.error.invalid-username':
			'사용자 이름 형식이 요구 사항을 충족하지 않습니다',
		'account.error.legacy-backup-disabled-offline':
			'오프라인 패키지에서는 구 클라우드 백업을 사용할 수 없습니다',
		'account.error.legacy-import-failed':
			'구 백업 코드 가져오기에 실패했습니다. 다시 시도하세요',
		'account.error.legacy-import-local-takeover-failed':
			'로컬 데이터 인수에 실패했습니다. 페이지를 새로고침한 뒤 다시 시도하세요',
		'account.error.legacy-import-sync-pending':
			'계정 동기화가 아직 완료되지 않았습니다. 잠시 후 다시 시도하세요',
		'account.error.local-takeover-failed':
			'로컬 데이터 인수에 실패했습니다. 페이지를 새로고침한 뒤 다시 시도하세요',
		'account.error.passkey-not-found': '패스키가 존재하지 않습니다',
		'account.error.password-already-set':
			'로그인 비밀번호가 이미 설정되어 있습니다. 비밀번호 변경을 사용하세요',
		'account.error.password-change-failed': '비밀번호 변경 실패',
		'account.error.password-must-change':
			'동기화를 계속하려면 먼저 비밀번호를 갱신하세요',
		'account.error.password-not-set': '먼저 로그인 비밀번호를 설정하세요',
		'account.error.payload-too-large':
			'제출 내용이 너무 큽니다. 입력을 확인하세요',
		'account.error.quarantine-storage-failed':
			'로컬 저장 공간이 부족해 동기화 데이터를 안전하게 격리할 수 없습니다. 원본 데이터는 보존되었으니 공간을 확보한 뒤 다시 시도하세요',
		'account.error.remote-conflict-source-unavailable':
			'충돌을 만든 탭을 일시적으로 사용할 수 없습니다. 해당 탭으로 돌아가거나 새로고침한 뒤 다시 시도하세요',
		'account.error.server-misconfigured': '서버 계정 설정이 비정상입니다',
		'account.error.session-not-found':
			'로그인 기기가 더 이상 유효하지 않습니다. 새로고침한 뒤 다시 시도하세요',
		'account.error.session-revoked': '로그인 기기를 해제했습니다',
		'account.error.state-epoch-mismatch':
			'계정 데이터가 방금 변경되었습니다. 새로고침한 뒤 다시 시도하세요',
		'account.error.sync-account-capacity-exceeded':
			'계정 동기화 데이터가 서버 용량을 초과했습니다. 세트 메뉴 등 동기화 데이터를 줄이세요',
		'account.error.sync-account-restore-incomplete':
			'계정은 복원되었지만 로컬 동기화 상태가 안전하게 초기화되지 않았습니다. 페이지를 새로고침한 뒤 다시 시도하세요',
		'account.error.sync-client-update-required':
			'현재 버전에서는 일부 클라우드 동기화 상태를 처리할 수 없습니다. 페이지를 새로고침하거나 앱을 업데이트하세요',
		'account.error.sync-conflict':
			'계정 데이터에 충돌이 있습니다. 먼저 충돌을 처리한 뒤 다시 시도하세요',
		'account.error.sync-failed':
			'동기화에 실패했습니다. 페이지를 새로고침한 뒤 다시 시도하세요',
		'account.error.sync-generation-mismatch':
			'클라우드 동기화 상태가 방금 변경되었습니다. 새로고침한 뒤 다시 시도하세요',
		'account.error.sync-paused':
			'클라우드 동기화가 일시 중지되었습니다. 이 기기의 데이터로 클라우드 동기화를 복원하세요',
		'account.error.sync-rebuild-conflict':
			'다른 기기가 클라우드를 갱신했습니다. 로컬 데이터를 다시 조정하는 중입니다',
		'account.error.sync-rebuild-failed':
			'클라우드 동기화 복원에 실패했습니다. 잠시 후 다시 시도하세요',
		'account.error.sync-refresh-failed':
			'동기화 상태 새로고침에 실패했습니다. 페이지를 새로고침한 뒤 다시 시도하세요',
		'account.error.sync-request-too-large':
			'한 번의 동기화 요청이 너무 큽니다. 해당 범주의 동기화 데이터를 줄인 뒤 다시 시도하세요',
		'account.error.sync-reset-marker-future':
			'로컬에 더 새로운 버전의 동기화 초기화 상태가 있습니다. 클라이언트를 업데이트한 뒤 계속하세요',
		'account.error.sync-reset-marker-invalid':
			'로컬 동기화 초기화 상태가 손상되었습니다. 로컬 데이터를 내보내고 명시적으로 정리한 뒤 계속하세요',
		'account.error.sync-schema-update-required':
			'클라우드 데이터가 더 새로운 버전에서 생성되었습니다. 페이지를 새로고침하거나 앱을 업데이트한 뒤 동기화하세요',
		'account.error.too-many-passkeys':
			'패스키가 한도에 도달했습니다. 먼저 일부 패스키를 삭제하세요',
		'account.error.too-many-requests':
			'시도 횟수가 너무 많습니다. 잠시 후 다시 시도하세요',
		'account.error.unauthorized':
			'로그인이 만료되었습니다. 다시 로그인하세요',
		'account.error.user-deleted':
			'계정이 삭제되었습니다. 복원하려면 관리자에게 문의하세요',
		'account.error.user-disabled':
			'계정이 비활성화되었습니다. 활성화하려면 관리자에게 문의하세요',
		'account.error.username-conflict': '이미 사용 중인 사용자 이름입니다',
		'account.error.webauthn-canceled': '패스키 작업이 취소되었습니다',
		'account.error.webauthn-failed':
			'패스키 작업에 실패했습니다. 다시 시도하세요',
		'account.error.webauthn-timeout':
			'인증이 아직 완료되지 않았습니다. 시스템 프롬프트가 나타나지 않으면 사용자 이름과 비밀번호로 등록/로그인하세요',
		'account.error.webauthn-verification-failed':
			'패스키 인증에 실패했습니다. 다시 시도하세요',
	},
	'zh-CN': ACCOUNT_ERROR_MESSAGES_ZH_CN,
	'zh-TW': {
		'account.error.account-disabled-offline': '離線包不支援帳號功能',
		'account.error.account-logout-failed': '登出失敗',
		'account.error.account-operation-busy':
			'帳號資料操作正在其他分頁進行，請稍後重試',
		'account.error.account-sync-pause-incomplete':
			'雲端資料已清空，請重新整理頁面後再恢復雲端同步',
		'account.error.account-sync-reset-incomplete':
			'本地同步重設尚未完成，系統會自動重試',
		'account.error.backup-code-already-imported': '這個舊備份碼已被匯入',
		'account.error.backup-code-lock-lost': '舊備份碼正在被處理，請稍後重試',
		'account.error.backup-code-lock-timeout': '舊備份碼處理逾時，請重試',
		'account.error.backup-code-not-found':
			'沒有找到這個舊備份碼，可能已過期、已匯入或已被刪除',
		'account.error.bootstrap-failed': '帳號初始化失敗，請重新整理頁面重試',
		'account.error.cannot-revoke-current-session':
			'不能在這裡撤銷目前工作階段，請使用登出',
		'account.error.challenge-expired': '通行密鑰操作已逾時，請重試',
		'account.error.challenge-not-found': '通行密鑰操作已失效，請重試',
		'account.error.conflict': '資料衝突，請在衝突解決面板中處理',
		'account.error.conflict-storage-unavailable':
			'瀏覽器暫時無法儲存同步狀態，現有資料未被修改',
		'account.error.credential-changed':
			'帳號憑據已在其他頁面更新，請重新確認帳號狀態',
		'account.error.credential-state-stale':
			'登入狀態剛剛變化，請重新整理後重試',
		'account.error.fallback': '操作失敗，請稍後重試',
		'account.error.forbidden': '登入狀態已變化，請重新整理後重試',
		'account.error.invalid-api-response': '伺服器回應異常，請重試',
		'account.error.invalid-backup-code':
			'舊備份碼格式不正確，請檢查是否完整複製',
		'account.error.invalid-backup-file':
			'這個舊備份碼中的資料無法讀取，可能已經損壞',
		'account.error.invalid-credentials': '使用者名稱或密碼不正確',
		'account.error.invalid-nickname': '暱稱格式不符合要求',
		'account.error.invalid-object-structure': '提交內容格式異常',
		'account.error.invalid-passkey-name': '通行密鑰名稱格式不符合要求',
		'account.error.invalid-password': '目前密碼不正確',
		'account.error.invalid-user-status': '帳號狀態不允許執行此操作',
		'account.error.invalid-username': '使用者名稱格式不符合要求',
		'account.error.legacy-backup-disabled-offline':
			'離線包不支援舊雲端備份功能',
		'account.error.legacy-import-failed': '舊備份碼匯入失敗，請重試',
		'account.error.legacy-import-local-takeover-failed':
			'本地資料接管失敗，請重新整理頁面後重試',
		'account.error.legacy-import-sync-pending':
			'目前帳號同步尚未完成，請稍後重試',
		'account.error.local-takeover-failed':
			'本地資料接管失敗，請重新整理頁面後重試',
		'account.error.passkey-not-found': '通行密鑰不存在',
		'account.error.password-already-set': '已設定登入密碼，請使用修改密碼',
		'account.error.password-change-failed': '改密失敗',
		'account.error.password-must-change': '需要先更新密碼後才能繼續同步',
		'account.error.password-not-set': '請先設定登入密碼',
		'account.error.payload-too-large': '提交內容過大，請檢查輸入',
		'account.error.quarantine-storage-failed':
			'本地儲存空間不足，無法安全隔離同步資料；原始資料已保留，請先釋放空間後重試',
		'account.error.remote-conflict-source-unavailable':
			'產生衝突的分頁暫時不可用，請回到該分頁或重新整理後重試',
		'account.error.server-misconfigured': '伺服器帳號設定異常',
		'account.error.session-not-found': '登入裝置已失效，請重新整理後重試',
		'account.error.session-revoked': '已登出登入裝置',
		'account.error.state-epoch-mismatch':
			'帳號資料剛剛變化，請重新整理後重試',
		'account.error.sync-account-capacity-exceeded':
			'帳號同步資料已超過伺服器總容量，請先縮減套餐或其他同步資料',
		'account.error.sync-account-restore-incomplete':
			'帳號已恢復，但本地同步狀態尚未安全重設，請重新整理頁面後重試',
		'account.error.sync-client-update-required':
			'目前版本無法處理部分雲端同步狀態，請重新整理頁面或更新應用程式',
		'account.error.sync-conflict': '帳號資料存在衝突，請先處理衝突後重試',
		'account.error.sync-failed': '同步失敗，請重新整理頁面重試',
		'account.error.sync-generation-mismatch':
			'雲端同步狀態剛剛變化，請重新整理後重試',
		'account.error.sync-paused':
			'雲端同步已暫停，請先用本裝置資料恢復雲端同步',
		'account.error.sync-rebuild-conflict':
			'其他裝置已更新雲端，正在重新協調本地資料',
		'account.error.sync-rebuild-failed': '恢復雲端同步失敗，請稍後重試',
		'account.error.sync-refresh-failed':
			'重新整理同步狀態失敗，請重新整理頁面重試',
		'account.error.sync-request-too-large':
			'單次同步請求過大，請縮減對應類別的同步資料後重試',
		'account.error.sync-reset-marker-future':
			'本地存在更高版本的同步重設狀態，請更新客戶端後再繼續',
		'account.error.sync-reset-marker-invalid':
			'本地同步重設狀態已損壞，請先匯出本地資料並明確清理後再繼續',
		'account.error.sync-schema-update-required':
			'雲端資料由更新版本建立，請重新整理頁面或更新應用程式後再同步',
		'account.error.too-many-passkeys':
			'通行密鑰數量已達上限，請先刪除部分通行密鑰',
		'account.error.too-many-requests': '嘗試次數過多，請稍後再試',
		'account.error.unauthorized': '登入已過期，請重新登入',
		'account.error.user-deleted': '帳號已刪除。如需恢復，請聯絡管理員',
		'account.error.user-disabled': '帳號已停用。如需啟用，請聯絡管理員',
		'account.error.username-conflict': '使用者名稱已被使用',
		'account.error.webauthn-canceled': '通行密鑰操作已取消',
		'account.error.webauthn-failed': '通行密鑰操作失敗，請重試',
		'account.error.webauthn-timeout':
			'驗證尚未完成，若未收到系統提示，請使用使用者名稱和密碼註冊/登入',
		'account.error.webauthn-verification-failed':
			'通行密鑰驗證失敗，請重試',
	},
} as const satisfies TLocalizedMessageTable<TAccountErrorMessageKey>;
