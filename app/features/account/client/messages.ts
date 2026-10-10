import type {
	TLocalizedMessageTable,
	TMessageParams,
} from '@/shared/i18n/messages';

const ACCOUNT_MESSAGES_ZH_CN = {
	'account.action.signedOut': '未登录',
	'account.action.unavailable': '账号不可用',
	'account.action.welcome': '欢迎您',
	'account.client.accountStateRefreshFailed': '账号状态刷新失败，请稍后重试',
	'account.client.logoutFailed': '退出失败',
	'account.client.operationBusy':
		'账号数据操作正在其他标签页进行，请稍后重试',
	'account.client.passwordChangeFailed': '改密失败',
	'account.client.passwordMustChangeAccountPaused':
		'密码更新前，账号同步、云端数据操作和冲突处理会暂时暂停。',
	'account.client.passwordMustChangeAuthorizePaused':
		'密码更新前无法完成SSO授权，也不会签发登录票据。',
	'account.client.passwordMustChangeLogoutAccount':
		'如果暂时不处理，可以退出当前账号；本设备未完成的同步队列会留在本地，之后重新登录再继续。',
	'account.client.passwordMustChangeLogoutAuthorize':
		'如果暂时不处理，可以退出当前账号返回首页。',
	'account.conflict.aria.crossTab': '云同步冲突待处理',
	'account.conflict.aria.pendingRemote': '云同步冲突',
	'account.conflict.aria.sync': '云同步冲突',
	'account.conflict.boolean.completedFalse': '未完成',
	'account.conflict.boolean.completedTrue': '已完成',
	'account.conflict.boolean.off': '关闭',
	'account.conflict.boolean.on': '开启',
	'account.conflict.boolean.popularNegative': '流行厌恶',
	'account.conflict.boolean.popularPositive': '流行喜爱',
	'account.conflict.candidate.keep': '保留此候选',
	'account.conflict.candidate.label': '候选 {number}',
	'account.conflict.candidate.rawData': '候选原始数据',
	'account.conflict.candidatesIntro':
		'选择前不会上传任何候选。选择后，系统会先保存选择结果，再继续与云端版本比较。',
	'account.conflict.candidatesSubtitle':
		'多个标签页同时修改了“{namespace}”。所有候选都已保留，请明确选择一个版本。',
	'account.conflict.card.empty': '未检测到可展示的差异',
	'account.conflict.card.more': '还有更多差异，可在技术详情中查看',
	'account.conflict.compare.button': '比较两个版本',
	'account.conflict.compare.note':
		'这里只展示有差异的内容，选择后另一份修改会被替换。',
	'account.conflict.confirm.cancel': '取消',
	'account.conflict.confirm.confirm': '确认保留',
	'account.conflict.confirm.title': '确认覆盖另一份修改？',
	'account.conflict.confirmation.cloud':
		'保留云端版本后，当前设备上的{namespace}修改将被替换。',
	'account.conflict.confirmation.local':
		'保留当前设备版本后，它会上传到云端并替换云端的{namespace}修改。',
	'account.conflict.detail.local': '当前设备原始数据',
	'account.conflict.detail.merged': '合并后的原始数据',
	'account.conflict.detail.remote': '云端原始数据',
	'account.conflict.field.activeId': '当前使用的营业预设',
	'account.conflict.field.columns': '表格显示列',
	'account.conflict.field.completed': '稀客教程进度',
	'account.conflict.field.darkPalette': '深色主题配色',
	'account.conflict.field.dlcs': '已关闭的数据集',
	'account.conflict.field.enabled': '启用状态',
	'account.conflict.field.famousShop': '“明星店”效果',
	'account.conflict.field.guestCardTagsTooltip': '顾客卡片中标签的浮动提示',
	'account.conflict.field.hiddenItems': '启用或禁用的酒水、料理和食材',
	'account.conflict.field.highAppearance': '平滑滚动和磨砂效果',
	'account.conflict.field.items': '保存的营业预设',
	'account.conflict.field.lightPalette': '浅色主题配色',
	'account.conflict.field.maxExtraIngredients': '加料上限',
	'account.conflict.field.maxRating': '评级上限',
	'account.conflict.field.maxResults': '推荐结果上限',
	'account.conflict.field.mode': '颜色模式',
	'account.conflict.field.orderLinkedFilter': '选择点单需求的同时筛选表格',
	'account.conflict.field.other': '设置内容',
	'account.conflict.field.popularTrend': '流行趋势',
	'account.conflict.field.popularTrendIsNegative': '流行趋势方向',
	'account.conflict.field.popularTrendTag': '流行趋势标签',
	'account.conflict.field.row': '表格显示行数',
	'account.conflict.field.showTagDescription': '显示料理标签所对应的关键词',
	'account.conflict.field.sortProfile': '“猜您想要”的默认推荐策略',
	'account.conflict.field.suggestMeals': '“猜您想要”推荐',
	'account.conflict.field.suggestMealsMaxExtraIngredients':
		'“猜您想要”的加料上限',
	'account.conflict.field.suggestMealsMaxRating': '“猜您想要”的评级上限',
	'account.conflict.field.suggestMealsMaxResults': '“猜您想要”的推荐结果上限',
	'account.conflict.field.suggestMealsSortProfile':
		'“猜您想要”的默认推荐策略',
	'account.conflict.field.table': '表格设置',
	'account.conflict.field.tableColumnsBeverage': '酒水表格显示列',
	'account.conflict.field.tableColumnsRecipe': '料理表格显示列',
	'account.conflict.field.tableHiddenItemsBeverages': '表格中隐藏的酒水',
	'account.conflict.field.tableHiddenItemsIngredients': '表格中隐藏的食材',
	'account.conflict.field.tableHiddenItemsRecipes': '表格中隐藏的料理',
	'account.conflict.field.tachie': '顾客页面右下角的立绘',
	'account.conflict.field.theme': '颜色模式',
	'account.conflict.field.vibrate': '震动反馈',
	'account.conflict.invalidEvidence':
		'另有{count}份无法解析的旧证据仍会保留。',
	'account.conflict.listSeparator': '、',
	'account.conflict.merge.apply': '使用此合并结果',
	'account.conflict.merge.button': '合并双方的修改',
	'account.conflict.merge.keepNote': '合并后将保留',
	'account.conflict.merge.more': '还有更多合并内容，可在技术详情中查看',
	'account.conflict.merge.note':
		'系统已经整理出一份合并结果，可同时保留双方能够兼容的修改。',
	'account.conflict.merge.recommended': '推荐',
	'account.conflict.namespace.customerNormalMeals': '已保存套餐（普客）',
	'account.conflict.namespace.customerRareMeals': '已保存套餐（稀客）',
	'account.conflict.namespace.customerRarePlans': '营业预设（稀客）',
	'account.conflict.namespace.customerRareSettings': '偏好设置（稀客）',
	'account.conflict.namespace.globalPreferences': '偏好设置（全局）',
	'account.conflict.namespace.theme': '主题设置',
	'account.conflict.namespace.tutorialCustomerRare': '稀客教程进度',
	'account.conflict.namespaces': '涉及：',
	'account.conflict.pendingRemote.subTitle':
		'冲突内容保存在另一个标签页中。请回到产生冲突的标签页完成处理；解决后此处会自动恢复。',
	'account.conflict.resolution.cloud.button': '保留云端版本',
	'account.conflict.resolution.cloud.description':
		'来自账号云端的数据，将覆盖当前设备上的对应修改。',
	'account.conflict.resolution.cloud.title': '云端版本',
	'account.conflict.resolution.local.button': '保留当前设备版本',
	'account.conflict.resolution.local.description':
		'当前浏览器中尚未同步的数据，将上传并覆盖云端修改。',
	'account.conflict.resolution.local.title': '当前设备版本',
	'account.conflict.syncPausedNote':
		'这部分数据的同步已暂停。完成选择前，两份数据都会保留，不会自动覆盖。',
	'account.conflict.syncSubtitle':
		'当前设备和云端都修改过“{namespace}”，请选择要保留的内容。',
	'account.conflict.technicalDetails': '查看技术详情',
	'account.conflict.title.crossTab': '跨标签页同步冲突',
	'account.conflict.title.pendingRemote': '云同步冲突待处理',
	'account.conflict.title.sync': '云同步冲突',
	'account.conflict.unmergeableNote':
		'这两份修改无法安全地自动合并，请比较下方差异后选择其中一个版本。',
	'account.conflict.unresolvedCount': '{count}项待处理',
	'account.conflict.value.action': '操作',
	'account.conflict.value.beverage': '酒水',
	'account.conflict.value.cooker': '厨具',
	'account.conflict.value.cookerType': '厨具',
	'account.conflict.value.ingredient': '食材',
	'account.conflict.value.none': '无',
	'account.conflict.value.notSet': '未设置',
	'account.conflict.value.previewMore': '{preview}等{count}项',
	'account.conflict.value.price': '售价',
	'account.conflict.value.recipe': '料理',
	'account.conflict.value.recordCount': '包含{count}项设置',
	'account.conflict.value.suitability': '匹配度',
	'account.conflict.value.time': '烹饪时间',
	'account.conflict.value.unavailable': '无法显示',
	'account.legacyImport.clearAction': '清空备份码',
	'account.legacyImport.codeHint':
		'备份码通常来自旧版云端备份功能，请完整复制后粘贴',
	'account.legacyImport.codeLabel': '旧备份码',
	'account.legacyImport.codePlaceholder': '粘贴旧备份码',
	'account.legacyImport.description':
		'输入旧版云端备份码并点击导入，其中保存的套餐数据将被合并到当前账号。导入成功后，该备份码将自动失效。',
	'account.legacyImport.failed': '导入失败，请稍后重试',
	'account.legacyImport.importAction': '导入到账号',
	'account.legacyImport.signInAction': '登录或注册',
	'account.legacyImport.signInRequired':
		'旧备份码只能导入到已登录账号。请先登录或注册。',
	'account.legacyImport.success': '导入成功，可继续导入下一个旧备份码',
	'account.manager.accountDeleteFailed': '删除账号失败',
	'account.manager.auth.loginAction': '登录账号',
	'account.manager.auth.loginTab': '登录',
	'account.manager.auth.nicknamePlaceholder': '设置显示名称',
	'account.manager.auth.passkeyContinue': '使用通行密钥继续',
	'account.manager.auth.passkeyRegister': '使用通行密钥注册新账号',
	'account.manager.auth.passkeyToggle': '使用通行密钥注册/登录',
	'account.manager.auth.passwordEntry': '使用用户名和密码注册/登录',
	'account.manager.auth.passwordPlaceholderLogin': '输入密码',
	'account.manager.auth.passwordPlaceholderRegister': '设置登录密码',
	'account.manager.auth.registerAction': '创建账号',
	'account.manager.auth.registerTab': '注册',
	'account.manager.auth.sideTitleSso': 'SSO授权',
	'account.manager.auth.sideTitleSync': '账号同步',
	'account.manager.auth.ssoDescription1':
		'登录后，您可以授权外部应用获取您的小助手账号身份。',
	'account.manager.auth.ssoDescription2':
		'注册后会自动登录；登录后即可在授权页面完成确认。',
	'account.manager.auth.syncDescription1':
		'账号会同步此浏览器保存的数据，让其他设备继续使用相同配置。',
	'account.manager.auth.syncDescription2':
		'注册后会自动登录；登录后，本设备尚未上传的更改会自动继续同步。',
	'account.manager.auth.termsLink': '法律声明',
	'account.manager.auth.termsPrefix': '我已阅读并同意',
	'account.manager.auth.usernamePlaceholder': '输入账号用户名',
	'account.manager.authenticationCredentialsRequired': '请输入用户名和密码',
	'account.manager.authenticationFailed': '认证失败',
	'account.manager.bootstrapFailed': '账号服务初始化失败，请刷新页面重试',
	'account.manager.bootstrapServerMisconfigured': '服务器配置异常',
	'account.manager.bootstrapUnavailable': '账号功能暂不可用：{message}',
	'account.manager.cloudDataChangedReconfirm':
		'云端数据已发生变化，请重新确认后再清空',
	'account.manager.cloudDataChangedRefreshing':
		'云端数据已发生变化，正在刷新账号状态…',
	'account.manager.cloudDataCleared': '云端数据已清空',
	'account.manager.cloudDataClearFailed': '清空云端数据失败',
	'account.manager.confirm.cancel': '取消',
	'account.manager.danger.clearData': '清空云端数据',
	'account.manager.danger.clearDataCleared': '云端数据已清空',
	'account.manager.danger.clearDataConfirm': '确认清空',
	'account.manager.danger.deleteAccount': '删除账号',
	'account.manager.danger.deleteAccountConfirm': '确认删除',
	'account.manager.danger.warning':
		'危险操作会影响云端数据或账号本身，请先通过数据管理导出需要保留的数据。',
	'account.manager.field.currentPassword': '当前密码',
	'account.manager.field.displayName': '显示名称',
	'account.manager.field.loginPassword': '登录密码',
	'account.manager.field.newPassword': '新密码',
	'account.manager.field.nickname': '昵称',
	'account.manager.field.nicknameOptional': '昵称（可选）',
	'account.manager.field.passkey': '通行密钥',
	'account.manager.field.password': '密码',
	'account.manager.field.username': '用户名',
	'account.manager.loginSuccess': '登录成功',
	'account.manager.loginSupport.invalidCredentials':
		'用户名或密码不正确。如需帮助，请',
	'account.manager.loginSupport.userDeleted': '账号已删除。如需恢复，请',
	'account.manager.loginSupport.userDisabled': '账号已停用。如需启用，请',
	'account.manager.loginSupportLink': '联系管理员',
	'account.manager.logoutSyncFailed': '退出前同步失败',
	'account.manager.mobile.subtitle': '数据同步和账号安全',
	'account.manager.passkeyAdded': '通行密钥已添加',
	'account.manager.passkeyAddFailed': '通行密钥添加失败',
	'account.manager.passkeyDeleted': '通行密钥已删除',
	'account.manager.passkeyDeleteFailed': '通行密钥删除失败',
	'account.manager.passkeyRefreshFailed': '通行密钥刷新失败',
	'account.manager.passkeyRenamed': '通行密钥已重命名',
	'account.manager.passkeyRenameFailed': '通行密钥重命名失败',
	'account.manager.passkeys.add': '添加',
	'account.manager.passkeys.addedAt': '添加于',
	'account.manager.passkeys.cancelRename': '取消重命名',
	'account.manager.passkeys.confirmAdd': '确认添加',
	'account.manager.passkeys.confirmDelete': '确认删除',
	'account.manager.passkeys.delete': '删除通行密钥',
	'account.manager.passkeys.lastUsed': '最近使用：',
	'account.manager.passkeys.nameExample': '例如：我的手机、YubiKey',
	'account.manager.passkeys.nameOptional': '通行密钥名称（可选）',
	'account.manager.passkeys.neverUsed': '从未使用',
	'account.manager.passkeys.rename': '重命名',
	'account.manager.passkeys.renameAria': '重命名通行密钥',
	'account.manager.passkeys.saveName': '保存名称',
	'account.manager.passwordChange.aria': '更新账号密码',
	'account.manager.passwordChange.badge': '需要更新密码后继续使用',
	'account.manager.passwordChange.currentAccount': '当前账号',
	'account.manager.passwordChange.currentPasswordLabel': '当前临时密码',
	'account.manager.passwordChange.currentPasswordPlaceholder':
		'输入管理员提供或刚登录使用的密码',
	'account.manager.passwordChange.newPasswordPlaceholder':
		'输入之后要长期使用的新密码',
	'account.manager.passwordChange.restrictedTitle': '受限状态',
	'account.manager.passwordChange.restrictedTitleSso': 'SSO受限状态',
	'account.manager.passwordChange.setupTitle': '设置新密码',
	'account.manager.passwordChange.subtitleAccount':
		'管理员已重置此账号的登录凭据。完成密码更新后，账号同步和数据操作会恢复可用。',
	'account.manager.passwordChange.subtitleSso':
		'管理员已重置此账号的登录凭据。请更新密码后继续授权给外部应用。',
	'account.manager.passwordChange.switchAccount': '切换账号',
	'account.manager.passwordChange.titleSso': 'SSO授权 - 更新账号密码',
	'account.manager.passwordChange.updateAndContinue': '更新密码后继续',
	'account.manager.passwordChange.usernameAria': '账号用户名',
	'account.manager.passwordSet': '登录密码已设置',
	'account.manager.passwordUpdated': '密码已更新',
	'account.manager.profile.changePassword': '修改密码',
	'account.manager.profile.currentPasswordPlaceholder': '输入当前密码',
	'account.manager.profile.currentPasswordRequired':
		'修改用户名需要确认当前密码',
	'account.manager.profile.initialPasswordHint':
		'设置登录密码后，可在不支持通行密钥的设备上使用用户名密码登录。',
	'account.manager.profile.newPasswordPlaceholder': '输入新密码',
	'account.manager.profile.passwordMustChangeNotice':
		'管理员已要求更新密码，完成后才能继续同步。',
	'account.manager.profile.save': '保存资料',
	'account.manager.profile.titleAccountSettings': '账号设置',
	'account.manager.profile.titleSetupPassword': '设置登录密码',
	'account.manager.profile.titleUpdatePassword': '更新密码',
	'account.manager.profile.updatePasswordAndContinue': '更新密码后继续',
	'account.manager.profile.usernameChangeHint':
		'请先设置登录密码后再修改用户名；昵称可直接修改',
	'account.manager.profile.usernameDisplay': '用户名：',
	'account.manager.profile.usernamePlaceholder': '输入新用户名',
	'account.manager.profileUpdated': '资料已更新',
	'account.manager.profileUpdateFailed': '资料修改失败',
	'account.manager.registrationFailed': '注册失败',
	'account.manager.registrationSuccess': '注册成功',
	'account.manager.sessionRefreshFailed': '登录设备刷新失败',
	'account.manager.sessionRevoked': '已下线登录设备',
	'account.manager.sessionRevokeFailed': '登录设备撤销失败',
	'account.manager.sessions.confirmRevoke': '确认下线',
	'account.manager.sessions.createdAt': '创建于',
	'account.manager.sessions.current': '当前会话',
	'account.manager.sessions.lastActive': '最近活动：',
	'account.manager.sessions.other': '其他会话',
	'account.manager.sessions.refresh': '刷新会话',
	'account.manager.sessions.revoke': '下线设备',
	'account.manager.sessions.source': '来源：',
	'account.manager.sessions.thisDevice': '本设备',
	'account.manager.sessions.title': '登录设备',
	'account.manager.ssoGrantRefreshFailed': '已授权应用刷新失败',
	'account.manager.ssoGrantRevoked': '已撤销授权',
	'account.manager.ssoGrantRevokeFailed': '撤销授权失败',
	'account.manager.ssoGrants.confirmRevoke': '确认撤销',
	'account.manager.ssoGrants.refresh': '刷新授权',
	'account.manager.ssoGrants.revoke': '撤销授权',
	'account.manager.ssoGrants.title': '已授权应用',
	'account.manager.status.awaitingSystemVerification': '正在等待系统验证…',
	'account.manager.status.connected': '账号同步已连接',
	'account.manager.status.noPasskeys': '暂无通行密钥',
	'account.manager.status.noSessions': '暂无可见会话',
	'account.manager.status.noSsoGrants': '暂无已授权应用',
	'account.manager.status.passkeyPrompt': '无需输入密码，按系统提示确认即可',
	'account.manager.status.passkeysUnsupported': '当前环境不支持通行密钥',
	'account.manager.status.paused': '云同步已暂停',
	'account.manager.status.readingPasskeys': '正在读取通行密钥',
	'account.manager.status.readingSessions': '正在读取登录设备',
	'account.manager.status.readingSsoGrants': '正在读取已授权应用',
	'account.manager.syncPendingBeforeLogout':
		'同步尚未完成，请先重试同步后再退出',
	'account.manager.termsRequired': '请先阅读并同意法律声明',
	'account.manager.ui.ariaManage': '账号管理',
	'account.manager.ui.ariaSignIn': '账号登录',
	'account.manager.ui.dataAndSessions': '数据与会话',
	'account.manager.ui.dataManagement': '数据管理',
	'account.manager.ui.descriptionManage': '管理当前账号、同步状态和云端数据',
	'account.manager.ui.descriptionSsoSignIn': '登录小助手账号以授权给外部应用',
	'account.manager.ui.descriptionSyncSignIn':
		'登录后可在不同设备间同步此浏览器保存的数据',
	'account.manager.ui.logout': '退出登录',
	'account.manager.ui.logoutAll': '退出全部设备',
	'account.manager.ui.passwordSignInDescription': '使用账号密码登录',
	'account.manager.ui.ssoSignInAction': 'SSO登录',
	'account.manager.ui.title': '账号',
	'account.nicknameRule': '昵称最多{max}个字符，不能包含换行或控制字符',
	'account.passkeyNameRule':
		'通行密钥名称最多{max}个字符，不能包含换行或控制字符',
	'account.passwordRule': '密码长度{min}-{max}位，且至少包含一个非空白字符',
	'account.sessions.summary.browser': '浏览器',
	'account.sessions.summary.direct': '直接连接',
	'account.sessions.summary.recorded': '已记录来源',
	'account.sessions.summary.unknownDevice': '未知设备',
	'account.sessions.summary.unknownSource': '未知来源',
	'account.sso.accountLabel.user': '用户名：{username}',
	'account.sso.accountLabel.userNickname':
		'用户名：{username}，昵称：{nickname}',
	'account.sso.agreeAction': '同意并继续',
	'account.sso.cancelAction': '取消',
	'account.sso.confirmNotice':
		'{client}将获取您的小助手账号身份、用户名和昵称。',
	'account.sso.confirmSubtitle': '确认后将返回发起登录的外部服务',
	'account.sso.detail.account': '当前账号',
	'account.sso.detail.client': '授权服务',
	'account.sso.errorFlowSubtitle': '无法继续当前授权流程',
	'account.sso.loginRequiredNotice':
		'请先登录小助手账号，登录完成后会回到当前授权流程。',
	'account.sso.loginRequiredSubtitle': '需要确认您的小助手账号身份',
	'account.sso.offlineNotice':
		'离线版本不支持账号授权。请使用在线服务从外部客户端重新发起登录。',
	'account.sso.offlineSubtitle': '离线版本无法完成账号授权',
	'account.sso.openAccountFlow': '打开账号流程',
	'account.sso.panelTitle': 'SSO授权',
	'account.sso.passwordChangeNotice':
		'请先在弹窗中更新账号密码，完成后会继续授权。',
	'account.sso.passwordChangeSubtitle': '账号需要先完成安全更新',
	'account.sso.status.authorizationCancelled': '授权已取消。',
	'account.sso.status.authorizationExpired':
		'授权上下文已过期，请从外部服务重新发起登录。',
	'account.sso.status.invalidRequest':
		'授权请求无效或已失效，请从外部服务重新发起登录。',
	'account.sso.status.networkFailed': '网络连接失败，请稍后重试。',
	'account.sso.status.rateLimited': '操作过于频繁，请稍后再试。',
	'account.sso.status.rateLimitedWithDelay':
		'操作过于频繁，请{seconds}秒后再试。',
	'account.sync.collision.canonicalQueue': '兼容队列版本',
	'account.sync.collision.legacyQueue': '旧标签页版本',
	'account.sync.collision.nextClient': '新客户端保留版本',
	'account.sync.collision.preMigration': '转换前保留版本',
	'account.sync.conflict.busy': '另一个标签页正在处理该冲突',
	'account.sync.conflict.recovering': '正在恢复同步状态，请稍候',
	'account.sync.conflict.stale': '冲突内容已更新，请重新确认',
	'account.sync.conflict.storageUnavailable':
		'浏览器暂时无法保存同步状态，现有数据未被修改',
	'account.sync.conflict.unexpected': '冲突保存失败，请稍后重试',
	'account.sync.conflict.unsupported':
		'当前页面版本无法处理这份同步状态，请更新后重试',
	'account.sync.control.broadcastAvailable': '可用',
	'account.sync.control.broadcastUnavailable': '不可用',
	'account.sync.control.collapseDetails': '收起同步详情',
	'account.sync.control.compatibleLock': '浏览器兼容锁',
	'account.sync.control.expandDetails': '展开同步详情',
	'account.sync.control.mergedUnavailable': '无法自动合并',
	'account.sync.control.nativeLock': '浏览器原生',
	'account.sync.control.restore': '用本设备数据恢复云同步',
	'account.sync.control.restoring': '正在恢复云同步',
	'account.sync.control.sync': '立即同步',
	'account.sync.control.syncing': '正在同步',
	'account.sync.failedAttempts': '（已失败{attempts}次）',
	'account.sync.fallback.rebuildFailed': '恢复云同步失败，请稍后重试',
	'account.sync.fallback.syncFailed': '同步异常，请稍后重试',
	'account.sync.isolated.default.detail':
		'请刷新页面确认已加载最新版本；若仍然出现此提示，请更新应用后重试。',
	'account.sync.isolated.default.title': '需要更新同步客户端',
	'account.sync.isolated.quarantineFailed.detail':
		'原始数据仍保留在当前浏览器中。请释放本地存储空间后刷新页面重试。',
	'account.sync.isolated.quarantineFailed.title': '本地同步数据无法安全隔离',
	'account.sync.isolated.resetMarkerInvalid.detail':
		'原始数据仍保留在当前浏览器中。请先导出需要保留的数据，再通过明确的数据清理操作重置此状态。',
	'account.sync.isolated.resetMarkerInvalid.title': '本地同步状态需要处理',
	'account.sync.isolated.storageUnavailable.detail':
		'现有数据未被修改。请确认浏览器允许本页面保存数据后刷新重试。',
	'account.sync.isolated.storageUnavailable.title': '浏览器存储暂不可用',
	'account.sync.namespace.automaticResolution': '正在协调',
	'account.sync.namespace.automaticResolutionPaused': '自动协调中',
	'account.sync.namespace.conflict': '冲突待处理',
	'account.sync.namespace.dirty': '待上传',
	'account.sync.namespace.synced': '已同步',
	'account.sync.pausedReason.applyingRemote': '应用云端中',
	'account.sync.pausedReason.bootstrap': '初始化中',
	'account.sync.pausedReason.cloudPaused': '云同步已暂停',
	'account.sync.pausedReason.conflict': '冲突待处理',
	'account.sync.pausedReason.deleteData': '清空数据中',
	'account.sync.pausedReason.importingBackup': '导入旧备份中',
	'account.sync.readiness.busy': '其他页面处理中',
	'account.sync.readiness.ready': '冲突待处理',
	'account.sync.readiness.recovering': '正在恢复',
	'account.sync.readiness.stale': '内容已更新',
	'account.sync.readiness.storageUnavailable': '存储不可用',
	'account.sync.readiness.unsupported': '需要更新',
	'account.sync.status.noPendingData': '暂无待同步数据',
	'account.sync.status.noSuccessfulRecord': '暂无成功记录',
	'account.sync.status.paused': '云同步已暂停',
	'account.sync.status.pausedEmptyDescription':
		'云端当前没有数据，本设备的数据仅保存在本地。',
	'account.sync.status.sessionQueueFallback':
		'同步队列当前无法跨标签持久化，将仅在本会话内尽力同步。',
	'account.sync.status.sessionQueueWarning':
		'当前存储无法持久跨标签同步队列，关闭页面前请等待同步完成。',
	'account.sync.storage.local': '本地持久化',
	'account.sync.storage.memory': '内存兜底',
	'account.sync.storage.session': '会话兜底',
	'account.sync.terminal.capacityExceeded': '容量超限',
	'account.sync.terminal.requestTooLarge': '请求过大',
	'account.syncUi.attempts': '尝试：{count}',
	'account.syncUi.baselineVersion': '基线版本：',
	'account.syncUi.changedAt': '变更时间：',
	'account.syncUi.cloudVersion': '云端版本：',
	'account.syncUi.confirmRestore': '确认恢复',
	'account.syncUi.conflicts': '冲突：{count}',
	'account.syncUi.crossTabBroadcast': '跨标签广播',
	'account.syncUi.crossTabLock': '跨标签互斥',
	'account.syncUi.details': '同步详情',
	'account.syncUi.lastSync': '最近同步：',
	'account.syncUi.paused': '暂停：',
	'account.syncUi.pausedTitle': '云同步已暂停',
	'account.syncUi.pending': '待上传：{count}',
	'account.syncUi.storage': '存储',
	'account.syncUi.title': '同步状态',
	'account.usernameRule':
		'用户名{min}-{max}位，可使用中文、英文字母、数字、下划线、点、短横线和邮箱形式',
} as const;

export type TAccountMessageKey = keyof typeof ACCOUNT_MESSAGES_ZH_CN;

export type TAccountTranslate = (
	key: TAccountMessageKey,
	params?: TMessageParams
) => string;

export const ACCOUNT_MESSAGE_KEY_SET: ReadonlySet<string> = new Set(
	Object.keys(ACCOUNT_MESSAGES_ZH_CN)
);

export const accountMessages = {
	en: {
		'account.action.signedOut': 'Not signed in',
		'account.action.unavailable': 'Account unavailable',
		'account.action.welcome': 'Welcome',
		'account.client.accountStateRefreshFailed':
			'Failed to refresh the account status; try again later',
		'account.client.logoutFailed': 'Sign-out failed',
		'account.client.operationBusy':
			'Account data is being modified in another tab; try again later',
		'account.client.passwordChangeFailed': 'Password change failed',
		'account.client.passwordMustChangeAccountPaused':
			'Until the password is updated, account sync, cloud data operations, and conflict handling are temporarily paused.',
		'account.client.passwordMustChangeAuthorizePaused':
			'Until the password is updated, SSO authorization cannot be completed and no sign-in ticket will be issued.',
		'account.client.passwordMustChangeLogoutAccount':
			'If you prefer not to handle this now, you can sign out; unfinished sync queues on this device stay local and resume after you sign in again.',
		'account.client.passwordMustChangeLogoutAuthorize':
			'If you prefer not to handle this now, you can sign out and return to the home page.',
		'account.conflict.aria.crossTab': 'Cloud sync conflict pending',
		'account.conflict.aria.pendingRemote': 'Cloud sync conflict',
		'account.conflict.aria.sync': 'Cloud sync conflict',
		'account.conflict.boolean.completedFalse': 'Incomplete',
		'account.conflict.boolean.completedTrue': 'Completed',
		'account.conflict.boolean.off': 'Off',
		'account.conflict.boolean.on': 'On',
		'account.conflict.boolean.popularNegative': 'Trend - Unpopular',
		'account.conflict.boolean.popularPositive': 'Trend - Popular',
		'account.conflict.candidate.keep': 'Keep this candidate',
		'account.conflict.candidate.label': 'Candidate {number}',
		'account.conflict.candidate.rawData': 'Candidate raw data',
		'account.conflict.candidatesIntro':
			'No candidate is uploaded before you choose. After choosing, the system saves your choice first, then compares it with the cloud version.',
		'account.conflict.candidatesSubtitle':
			'Multiple tabs modified “{namespace}” at the same time. All candidates are kept; choose one explicitly.',
		'account.conflict.card.empty': 'No differences to display',
		'account.conflict.card.more':
			'More differences are available in the technical details',
		'account.conflict.compare.button': 'Compare both versions',
		'account.conflict.compare.note':
			'Only differences are shown here; after choosing, the other version will be replaced.',
		'account.conflict.confirm.cancel': 'Cancel',
		'account.conflict.confirm.confirm': 'Confirm keep',
		'account.conflict.confirm.title': 'Overwrite the other version?',
		'account.conflict.confirmation.cloud':
			'After keeping the cloud version, changes to {namespace} on this device will be replaced.',
		'account.conflict.confirmation.local':
			'After keeping the current device version, it will be uploaded and replace the cloud’s {namespace} changes.',
		'account.conflict.detail.local': 'Current device raw data',
		'account.conflict.detail.merged': 'Merged raw data',
		'account.conflict.detail.remote': 'Cloud raw data',
		'account.conflict.field.activeId': 'Active business plan',
		'account.conflict.field.columns': 'Visible table columns',
		'account.conflict.field.completed': 'Special guest tutorial progress',
		'account.conflict.field.darkPalette': 'Dark theme palette',
		'account.conflict.field.dlcs': 'Disabled datasets',
		'account.conflict.field.enabled': 'Enabled state',
		'account.conflict.field.famousShop': '“Famous Shop” effect',
		'account.conflict.field.guestCardTagsTooltip':
			'Tag tooltips on guest cards',
		'account.conflict.field.hiddenItems':
			'Enabled or disabled beverages, foods and ingredients',
		'account.conflict.field.highAppearance':
			'Smooth scrolling and frosted glass',
		'account.conflict.field.items': 'Saved business plans',
		'account.conflict.field.lightPalette': 'Light theme palette',
		'account.conflict.field.maxExtraIngredients': 'Extra ingredients cap',
		'account.conflict.field.maxRating': 'Rating cap',
		'account.conflict.field.maxResults': 'Recommendation limit',
		'account.conflict.field.mode': 'Color mode',
		'account.conflict.field.orderLinkedFilter':
			'Filter the table when selecting order requirements',
		'account.conflict.field.other': 'Setting content',
		'account.conflict.field.popularTrend': 'Popular trends',
		'account.conflict.field.popularTrendIsNegative': 'Trend direction',
		'account.conflict.field.popularTrendTag': 'Trend tag',
		'account.conflict.field.row': 'Visible table rows',
		'account.conflict.field.showTagDescription':
			'Show keywords for food tags',
		'account.conflict.field.sortProfile':
			'Default “Guess What You Want” strategy',
		'account.conflict.field.suggestMeals':
			'“Guess What You Want” recommendations',
		'account.conflict.field.suggestMealsMaxExtraIngredients':
			'“Guess What You Want” extra ingredients cap',
		'account.conflict.field.suggestMealsMaxRating':
			'“Guess What You Want” rating cap',
		'account.conflict.field.suggestMealsMaxResults':
			'“Guess What You Want” recommendation limit',
		'account.conflict.field.suggestMealsSortProfile':
			'Default “Guess What You Want” strategy',
		'account.conflict.field.table': 'Table settings',
		'account.conflict.field.tableColumnsBeverage':
			'Visible columns of the beverage table',
		'account.conflict.field.tableColumnsRecipe':
			'Visible columns of the food table',
		'account.conflict.field.tableHiddenItemsBeverages':
			'Beverages hidden in tables',
		'account.conflict.field.tableHiddenItemsIngredients':
			'Ingredients hidden in tables',
		'account.conflict.field.tableHiddenItemsRecipes':
			'Foods hidden in tables',
		'account.conflict.field.tachie':
			'Tachie at the bottom right of guest pages',
		'account.conflict.field.theme': 'Color mode',
		'account.conflict.field.vibrate': 'Vibration feedback',
		'account.conflict.invalidEvidence':
			'{count} unparsable old evidence entries will also be kept.',
		'account.conflict.listSeparator': ', ',
		'account.conflict.merge.apply': 'Use this merged result',
		'account.conflict.merge.button': 'Merge both changes',
		'account.conflict.merge.keepNote':
			'After merging, the following will be kept',
		'account.conflict.merge.more':
			'More merged content is available in the technical details',
		'account.conflict.merge.note':
			'A merged result is ready that keeps compatible changes from both sides.',
		'account.conflict.merge.recommended': 'Recommended',
		'account.conflict.namespace.customerNormalMeals':
			'Saved meals (normal guests)',
		'account.conflict.namespace.customerRareMeals':
			'Saved meals (special guests)',
		'account.conflict.namespace.customerRarePlans':
			'Business plans (special guests)',
		'account.conflict.namespace.customerRareSettings':
			'Preferences (special guests)',
		'account.conflict.namespace.globalPreferences': 'Preferences (global)',
		'account.conflict.namespace.theme': 'Theme settings',
		'account.conflict.namespace.tutorialCustomerRare':
			'Special guest tutorial progress',
		'account.conflict.namespaces': 'Involved:',
		'account.conflict.pendingRemote.subTitle':
			'The conflict content is saved in another tab. Return to that tab to resolve it; this panel recovers automatically afterwards.',
		'account.conflict.resolution.cloud.button': 'Keep cloud version',
		'account.conflict.resolution.cloud.description':
			'Data from the account cloud; it will overwrite the corresponding changes on this device.',
		'account.conflict.resolution.cloud.title': 'Cloud version',
		'account.conflict.resolution.local.button':
			'Keep current device version',
		'account.conflict.resolution.local.description':
			'Data in this browser that has not been synced yet; it will be uploaded and overwrite the cloud changes.',
		'account.conflict.resolution.local.title': 'Current device version',
		'account.conflict.syncPausedNote':
			'Sync for this data is paused. Until you choose, both versions are kept and nothing is overwritten automatically.',
		'account.conflict.syncSubtitle':
			'Both the current device and the cloud modified “{namespace}”; choose what to keep.',
		'account.conflict.technicalDetails': 'View technical details',
		'account.conflict.title.crossTab': 'Cross-tab sync conflict',
		'account.conflict.title.pendingRemote': 'Cloud sync conflict pending',
		'account.conflict.title.sync': 'Cloud sync conflict',
		'account.conflict.unmergeableNote':
			'These two changes cannot be merged safely; compare the differences below and choose one version.',
		'account.conflict.unresolvedCount': '{count} pending',
		'account.conflict.value.action': 'Actions',
		'account.conflict.value.beverage': 'Beverages',
		'account.conflict.value.cooker': 'Cookware',
		'account.conflict.value.cookerType': 'Cookware',
		'account.conflict.value.ingredient': 'Ingredients',
		'account.conflict.value.none': 'None',
		'account.conflict.value.notSet': 'Not set',
		'account.conflict.value.previewMore': '{preview} and {count} more',
		'account.conflict.value.price': 'Price',
		'account.conflict.value.recipe': 'Foods',
		'account.conflict.value.recordCount': 'Contains {count} settings',
		'account.conflict.value.suitability': 'Match',
		'account.conflict.value.time': 'Cook time',
		'account.conflict.value.unavailable': 'Unable to display',
		'account.legacyImport.clearAction': 'Clear backup code',
		'account.legacyImport.codeHint':
			'Backup codes usually come from the legacy cloud backup feature; copy the full code and paste it here',
		'account.legacyImport.codeLabel': 'Legacy backup code',
		'account.legacyImport.codePlaceholder': 'Paste the legacy backup code',
		'account.legacyImport.description':
			'Enter a legacy cloud backup code and click import; the saved meal data will be merged into the current account. After a successful import, the code expires automatically.',
		'account.legacyImport.failed': 'Import failed; try again later',
		'account.legacyImport.importAction': 'Import into account',
		'account.legacyImport.signInAction': 'Sign in or register',
		'account.legacyImport.signInRequired':
			'Legacy backup codes can only be imported into a signed-in account. Please sign in or register first.',
		'account.legacyImport.success':
			'Imported; you can continue with the next legacy backup code',
		'account.manager.accountDeleteFailed': 'Failed to delete the account',
		'account.manager.auth.loginAction': 'Sign in',
		'account.manager.auth.loginTab': 'Sign in',
		'account.manager.auth.nicknamePlaceholder': 'Set a display name',
		'account.manager.auth.passkeyContinue': 'Continue with a passkey',
		'account.manager.auth.passkeyRegister':
			'Create a new account with a passkey',
		'account.manager.auth.passkeyToggle':
			'Sign up / sign in with a passkey',
		'account.manager.auth.passwordEntry':
			'Sign up / sign in with username and password',
		'account.manager.auth.passwordPlaceholderLogin': 'Enter your password',
		'account.manager.auth.passwordPlaceholderRegister':
			'Set a login password',
		'account.manager.auth.registerAction': 'Create account',
		'account.manager.auth.registerTab': 'Sign up',
		'account.manager.auth.sideTitleSso': 'SSO authorization',
		'account.manager.auth.sideTitleSync': 'Account sync',
		'account.manager.auth.ssoDescription1':
			'After signing in, you can authorize external apps to receive your Assistant account identity.',
		'account.manager.auth.ssoDescription2':
			'Registration signs you in automatically; after signing in, confirm on the authorization page.',
		'account.manager.auth.syncDescription1':
			'Your account syncs the data saved in this browser so other devices can keep using the same configuration.',
		'account.manager.auth.syncDescription2':
			'Registration signs you in automatically; changes not yet uploaded from this device will continue syncing.',
		'account.manager.auth.termsLink': 'Legal statement',
		'account.manager.auth.termsPrefix': 'I have read and agree to the ',
		'account.manager.auth.usernamePlaceholder':
			'Enter your account username',
		'account.manager.authenticationCredentialsRequired':
			'Enter a username and password',
		'account.manager.authenticationFailed': 'Authentication failed',
		'account.manager.bootstrapFailed':
			'Account service initialization failed; refresh the page and try again',
		'account.manager.bootstrapServerMisconfigured':
			'Server configuration error',
		'account.manager.bootstrapUnavailable':
			'Accounts are temporarily unavailable: {message}',
		'account.manager.cloudDataChangedReconfirm':
			'Cloud data has changed; review it again before clearing',
		'account.manager.cloudDataChangedRefreshing':
			'Cloud data has changed; refreshing account state…',
		'account.manager.cloudDataCleared': 'Cloud data cleared',
		'account.manager.cloudDataClearFailed': 'Failed to clear cloud data',
		'account.manager.confirm.cancel': 'Cancel',
		'account.manager.danger.clearData': 'Clear cloud data',
		'account.manager.danger.clearDataCleared': 'Cloud data cleared',
		'account.manager.danger.clearDataConfirm': 'Clear',
		'account.manager.danger.deleteAccount': 'Delete account',
		'account.manager.danger.deleteAccountConfirm': 'Delete',
		'account.manager.danger.warning':
			'Dangerous operations affect cloud data or the account itself. Export anything you want to keep from Data management first.',
		'account.manager.field.currentPassword': 'Current password',
		'account.manager.field.displayName': 'Display name',
		'account.manager.field.loginPassword': 'Login password',
		'account.manager.field.newPassword': 'New password',
		'account.manager.field.nickname': 'Nickname',
		'account.manager.field.nicknameOptional': 'Nickname (optional)',
		'account.manager.field.passkey': 'Passkey',
		'account.manager.field.password': 'Password',
		'account.manager.field.username': 'Username',
		'account.manager.loginSuccess': 'Signed in successfully',
		'account.manager.loginSupport.invalidCredentials':
			'Incorrect username or password. For help, please',
		'account.manager.loginSupport.userDeleted':
			'The account was deleted. To restore it, please',
		'account.manager.loginSupport.userDisabled':
			'The account is disabled. To enable it, please',
		'account.manager.loginSupportLink': 'contact the administrator',
		'account.manager.logoutSyncFailed': 'Sync failed before signing out',
		'account.manager.mobile.subtitle': 'Data sync and account security',
		'account.manager.passkeyAdded': 'Passkey added',
		'account.manager.passkeyAddFailed': 'Failed to add the passkey',
		'account.manager.passkeyDeleted': 'Passkey deleted',
		'account.manager.passkeyDeleteFailed': 'Failed to delete the passkey',
		'account.manager.passkeyRefreshFailed': 'Failed to refresh passkeys',
		'account.manager.passkeyRenamed': 'Passkey renamed',
		'account.manager.passkeyRenameFailed': 'Failed to rename the passkey',
		'account.manager.passkeys.add': 'Add',
		'account.manager.passkeys.addedAt': 'Added: ',
		'account.manager.passkeys.cancelRename': 'Cancel rename',
		'account.manager.passkeys.confirmAdd': 'Add passkey',
		'account.manager.passkeys.confirmDelete': 'Delete',
		'account.manager.passkeys.delete': 'Delete passkey',
		'account.manager.passkeys.lastUsed': 'Last used: ',
		'account.manager.passkeys.nameExample':
			'For example: My phone, YubiKey',
		'account.manager.passkeys.nameOptional': 'Passkey name (optional)',
		'account.manager.passkeys.neverUsed': 'Never used',
		'account.manager.passkeys.rename': 'Rename',
		'account.manager.passkeys.renameAria': 'Rename passkey',
		'account.manager.passkeys.saveName': 'Save name',
		'account.manager.passwordChange.aria': 'Update account password',
		'account.manager.passwordChange.badge':
			'Password update required to continue',
		'account.manager.passwordChange.currentAccount': 'Current account',
		'account.manager.passwordChange.currentPasswordLabel':
			'Current temporary password',
		'account.manager.passwordChange.currentPasswordPlaceholder':
			'Enter the password provided by the administrator or just used to sign in',
		'account.manager.passwordChange.newPasswordPlaceholder':
			'Enter the new password you will use from now on',
		'account.manager.passwordChange.restrictedTitle': 'Restricted state',
		'account.manager.passwordChange.restrictedTitleSso':
			'SSO restricted state',
		'account.manager.passwordChange.setupTitle': 'Set a new password',
		'account.manager.passwordChange.subtitleAccount':
			"An administrator has reset this account's login credentials. Account sync and data operations will resume after the password is updated.",
		'account.manager.passwordChange.subtitleSso':
			"An administrator has reset this account's login credentials. Update the password to continue authorizing the external app.",
		'account.manager.passwordChange.switchAccount': 'Switch account',
		'account.manager.passwordChange.titleSso':
			'SSO authorization - Update account password',
		'account.manager.passwordChange.updateAndContinue':
			'Update password and continue',
		'account.manager.passwordChange.usernameAria': 'Account username',
		'account.manager.passwordSet': 'Sign-in password set',
		'account.manager.passwordUpdated': 'Password updated',
		'account.manager.profile.changePassword': 'Change password',
		'account.manager.profile.currentPasswordPlaceholder':
			'Enter your current password',
		'account.manager.profile.currentPasswordRequired':
			'Changing your username requires confirming your current password',
		'account.manager.profile.initialPasswordHint':
			'After setting a login password, you can sign in with a username and password on devices without passkey support.',
		'account.manager.profile.newPasswordPlaceholder':
			'Enter a new password',
		'account.manager.profile.passwordMustChangeNotice':
			'An administrator requires a password update; syncing continues after it is complete.',
		'account.manager.profile.save': 'Save profile',
		'account.manager.profile.titleAccountSettings': 'Account settings',
		'account.manager.profile.titleSetupPassword': 'Set login password',
		'account.manager.profile.titleUpdatePassword': 'Update password',
		'account.manager.profile.updatePasswordAndContinue':
			'Update password and continue',
		'account.manager.profile.usernameChangeHint':
			'Set a login password before changing your username; the nickname can be changed directly',
		'account.manager.profile.usernameDisplay': 'Username: ',
		'account.manager.profile.usernamePlaceholder': 'Enter a new username',
		'account.manager.profileUpdated': 'Profile updated',
		'account.manager.profileUpdateFailed': 'Failed to update the profile',
		'account.manager.registrationFailed': 'Registration failed',
		'account.manager.registrationSuccess': 'Registration successful',
		'account.manager.sessionRefreshFailed':
			'Failed to refresh signed-in devices',
		'account.manager.sessionRevoked': 'Signed-in device removed',
		'account.manager.sessionRevokeFailed':
			'Failed to revoke the signed-in device',
		'account.manager.sessions.confirmRevoke': 'Sign out',
		'account.manager.sessions.createdAt': 'Created: ',
		'account.manager.sessions.current': 'Current session',
		'account.manager.sessions.lastActive': 'Last active: ',
		'account.manager.sessions.other': 'Other sessions',
		'account.manager.sessions.refresh': 'Refresh sessions',
		'account.manager.sessions.revoke': 'Sign out device',
		'account.manager.sessions.source': 'Source: ',
		'account.manager.sessions.thisDevice': 'This device',
		'account.manager.sessions.title': 'Signed-in devices',
		'account.manager.ssoGrantRefreshFailed':
			'Failed to refresh authorized apps',
		'account.manager.ssoGrantRevoked': 'Authorization revoked',
		'account.manager.ssoGrantRevokeFailed':
			'Failed to revoke the authorization',
		'account.manager.ssoGrants.confirmRevoke': 'Revoke',
		'account.manager.ssoGrants.refresh': 'Refresh grants',
		'account.manager.ssoGrants.revoke': 'Revoke authorization',
		'account.manager.ssoGrants.title': 'Authorized apps',
		'account.manager.status.awaitingSystemVerification':
			'Waiting for system verification…',
		'account.manager.status.connected': 'Account sync connected',
		'account.manager.status.noPasskeys': 'No passkeys yet',
		'account.manager.status.noSessions': 'No visible sessions',
		'account.manager.status.noSsoGrants': 'No authorized apps',
		'account.manager.status.passkeyPrompt':
			'No password needed; confirm via the system prompt',
		'account.manager.status.passkeysUnsupported':
			'Passkeys are not supported in this environment',
		'account.manager.status.paused': 'Cloud sync is paused',
		'account.manager.status.readingPasskeys': 'Reading passkeys',
		'account.manager.status.readingSessions': 'Reading signed-in devices',
		'account.manager.status.readingSsoGrants': 'Reading authorized apps',
		'account.manager.syncPendingBeforeLogout':
			'Sync has not finished yet; retry sync before signing out',
		'account.manager.termsRequired':
			'Please read and agree to the legal statement first',
		'account.manager.ui.ariaManage': 'Account management',
		'account.manager.ui.ariaSignIn': 'Account sign-in',
		'account.manager.ui.dataAndSessions': 'Data and sessions',
		'account.manager.ui.dataManagement': 'Data management',
		'account.manager.ui.descriptionManage':
			'Manage the current account, sync status, and cloud data',
		'account.manager.ui.descriptionSsoSignIn':
			'Sign in to your assistant account to authorize an external app',
		'account.manager.ui.descriptionSyncSignIn':
			'Sign in to sync this browser’s saved data across devices',
		'account.manager.ui.logout': 'Sign out',
		'account.manager.ui.logoutAll': 'Sign out all devices',
		'account.manager.ui.passwordSignInDescription':
			'Sign in with username and password',
		'account.manager.ui.ssoSignInAction': 'SSO sign-in',
		'account.manager.ui.title': 'Account',
		'account.nicknameRule':
			'The nickname must be at most {max} characters and cannot contain line breaks or control characters',
		'account.passkeyNameRule':
			'Passkey name can be up to {max} characters and cannot contain line breaks or control characters',
		'account.passwordRule':
			'The password must be {min}-{max} characters long and contain at least one non-whitespace character',
		'account.sessions.summary.browser': 'Browser',
		'account.sessions.summary.direct': 'Direct connection',
		'account.sessions.summary.recorded': 'Recorded source',
		'account.sessions.summary.unknownDevice': 'Unknown device',
		'account.sessions.summary.unknownSource': 'Unknown source',
		'account.sso.accountLabel.user': 'Username: {username}',
		'account.sso.accountLabel.userNickname':
			'Username: {username}, nickname: {nickname}',
		'account.sso.agreeAction': 'Agree and continue',
		'account.sso.cancelAction': 'Cancel',
		'account.sso.confirmNotice':
			'{client} will obtain your assistant account identity, username, and nickname.',
		'account.sso.confirmSubtitle':
			'You will return to the external service after confirming',
		'account.sso.detail.account': 'Current account',
		'account.sso.detail.client': 'Authorizing service',
		'account.sso.errorFlowSubtitle':
			'Unable to continue this authorization flow',
		'account.sso.loginRequiredNotice':
			'Sign in to your assistant account first; you will return to this authorization flow afterwards.',
		'account.sso.loginRequiredSubtitle':
			'Confirm your assistant account identity',
		'account.sso.offlineNotice':
			'The offline build does not support account authorization. Use the online service to start the sign-in again from the external client.',
		'account.sso.offlineSubtitle':
			'Authorization is unavailable in the offline build',
		'account.sso.openAccountFlow': 'Open the account flow',
		'account.sso.panelTitle': 'SSO authorization',
		'account.sso.passwordChangeNotice':
			'Update the account password in the dialog first; authorization continues afterwards.',
		'account.sso.passwordChangeSubtitle':
			'The account needs a security update first',
		'account.sso.status.authorizationCancelled': 'Authorization cancelled.',
		'account.sso.status.authorizationExpired':
			'The authorization context has expired; start the sign-in again from the external service.',
		'account.sso.status.invalidRequest':
			'The authorization request is invalid or no longer valid; start the sign-in again from the external service.',
		'account.sso.status.networkFailed':
			'Network connection failed; try again later.',
		'account.sso.status.rateLimited': 'Too many attempts; try again later.',
		'account.sso.status.rateLimitedWithDelay':
			'Too many attempts; try again in {seconds} seconds.',
		'account.sync.collision.canonicalQueue': 'Compatible queue version',
		'account.sync.collision.legacyQueue': 'Legacy tab version',
		'account.sync.collision.nextClient': 'Version kept by the newer client',
		'account.sync.collision.preMigration': 'Version from before conversion',
		'account.sync.conflict.busy': 'Another tab is handling this conflict',
		'account.sync.conflict.recovering':
			'Recovering sync state; please wait',
		'account.sync.conflict.stale':
			'The conflict content has been updated; please review it again',
		'account.sync.conflict.storageUnavailable':
			'The browser cannot save sync state right now; existing data was not modified',
		'account.sync.conflict.unexpected':
			'Failed to save the conflict; try again later',
		'account.sync.conflict.unsupported':
			'This page version cannot handle this sync state; update and try again',
		'account.sync.control.broadcastAvailable': 'Available',
		'account.sync.control.broadcastUnavailable': 'Unavailable',
		'account.sync.control.collapseDetails': 'Collapse sync details',
		'account.sync.control.compatibleLock': 'Browser compatibility lock',
		'account.sync.control.expandDetails': 'Expand sync details',
		'account.sync.control.mergedUnavailable': 'Cannot merge automatically',
		'account.sync.control.nativeLock': 'Browser native',
		'account.sync.control.restore':
			'Restore cloud sync with this device’s data',
		'account.sync.control.restoring': 'Restoring cloud sync',
		'account.sync.control.sync': 'Sync now',
		'account.sync.control.syncing': 'Syncing',
		'account.sync.failedAttempts': ' ({attempts} failed attempts)',
		'account.sync.fallback.rebuildFailed':
			'Failed to restore cloud sync; try again later',
		'account.sync.fallback.syncFailed': 'Sync error; try again later',
		'account.sync.isolated.default.detail':
			'Refresh the page to make sure the latest version is loaded; if this message persists, update the app and try again.',
		'account.sync.isolated.default.title': 'Sync client update required',
		'account.sync.isolated.quarantineFailed.detail':
			'The original data remains in this browser. Free up local storage and refresh the page to retry.',
		'account.sync.isolated.quarantineFailed.title':
			'Local sync data cannot be safely quarantined',
		'account.sync.isolated.resetMarkerInvalid.detail':
			'The original data remains in this browser. Export the data you want to keep, then reset this state through an explicit data-clearing action.',
		'account.sync.isolated.resetMarkerInvalid.title':
			'Local sync state needs attention',
		'account.sync.isolated.storageUnavailable.detail':
			'Existing data was not modified. Confirm the browser allows this page to store data, then refresh and retry.',
		'account.sync.isolated.storageUnavailable.title':
			'Browser storage is temporarily unavailable',
		'account.sync.namespace.automaticResolution': 'Reconciling',
		'account.sync.namespace.automaticResolutionPaused': 'Auto-reconciling',
		'account.sync.namespace.conflict': 'Conflict pending',
		'account.sync.namespace.dirty': 'Pending upload',
		'account.sync.namespace.synced': 'Synced',
		'account.sync.pausedReason.applyingRemote': 'Applying cloud',
		'account.sync.pausedReason.bootstrap': 'Initializing',
		'account.sync.pausedReason.cloudPaused': 'Cloud sync paused',
		'account.sync.pausedReason.conflict': 'Conflict pending',
		'account.sync.pausedReason.deleteData': 'Clearing data',
		'account.sync.pausedReason.importingBackup': 'Importing legacy backup',
		'account.sync.readiness.busy': 'Another page is handling it',
		'account.sync.readiness.ready': 'Conflict pending',
		'account.sync.readiness.recovering': 'Recovering',
		'account.sync.readiness.stale': 'Content updated',
		'account.sync.readiness.storageUnavailable': 'Storage unavailable',
		'account.sync.readiness.unsupported': 'Update required',
		'account.sync.status.noPendingData': 'No data pending sync',
		'account.sync.status.noSuccessfulRecord': 'No successful record yet',
		'account.sync.status.paused': 'Cloud sync is paused',
		'account.sync.status.pausedEmptyDescription':
			'The cloud currently has no data; this device’s data is stored locally only.',
		'account.sync.status.sessionQueueFallback':
			'The sync queue cannot persist across tabs right now; it will sync on a best-effort basis in this session.',
		'account.sync.status.sessionQueueWarning':
			'The current storage cannot persist the cross-tab sync queue; wait for sync to finish before closing the page.',
		'account.sync.storage.local': 'Local persistence',
		'account.sync.storage.memory': 'Memory fallback',
		'account.sync.storage.session': 'Session fallback',
		'account.sync.terminal.capacityExceeded': 'Capacity exceeded',
		'account.sync.terminal.requestTooLarge': 'Request too large',
		'account.syncUi.attempts': 'Attempts: {count}',
		'account.syncUi.baselineVersion': 'Baseline version: ',
		'account.syncUi.changedAt': 'Changed at: ',
		'account.syncUi.cloudVersion': 'Cloud version: ',
		'account.syncUi.confirmRestore': 'Confirm restore',
		'account.syncUi.conflicts': 'Conflicts: {count}',
		'account.syncUi.crossTabBroadcast': 'Cross-tab broadcast',
		'account.syncUi.crossTabLock': 'Cross-tab lock',
		'account.syncUi.details': 'Sync details',
		'account.syncUi.lastSync': 'Last sync: ',
		'account.syncUi.paused': 'Paused: ',
		'account.syncUi.pausedTitle': 'Cloud sync is paused',
		'account.syncUi.pending': 'Pending upload: {count}',
		'account.syncUi.storage': 'Storage',
		'account.syncUi.title': 'Sync status',
		'account.usernameRule':
			'Username must be {min}-{max} characters; Chinese characters, letters, digits, underscores, periods, hyphens and email-style names are allowed',
	},
	ja: {
		'account.action.signedOut': '未ログイン',
		'account.action.unavailable': 'アカウント利用不可',
		'account.action.welcome': 'ようこそ',
		'account.client.accountStateRefreshFailed':
			'アカウント状態の更新に失敗しました。しばらくしてから再試行してください',
		'account.client.logoutFailed': 'ログアウトに失敗しました',
		'account.client.operationBusy':
			'別のタブでアカウントデータを操作中です。しばらくしてから再試行してください',
		'account.client.passwordChangeFailed': 'パスワード変更に失敗しました',
		'account.client.passwordMustChangeAccountPaused':
			'パスワード更新まで、アカウント同期・クラウドデータ操作・競合処理は一時停止します。',
		'account.client.passwordMustChangeAuthorizePaused':
			'パスワード更新まで、SSO認可を完了できず、ログインチケットも発行されません。',
		'account.client.passwordMustChangeLogoutAccount':
			'今は対応しない場合、現在のアカウントからログアウトできます。この端末の未完了の同期キューはローカルに残り、再ログイン後に再開します。',
		'account.client.passwordMustChangeLogoutAuthorize':
			'今は対応しない場合、現在のアカウントからログアウトしてホームに戻れます。',
		'account.conflict.aria.crossTab': 'クラウド同期の競合待ち',
		'account.conflict.aria.pendingRemote': 'クラウド同期の競合',
		'account.conflict.aria.sync': 'クラウド同期の競合',
		'account.conflict.boolean.completedFalse': '未完了',
		'account.conflict.boolean.completedTrue': '完了',
		'account.conflict.boolean.off': 'オフ',
		'account.conflict.boolean.on': 'オン',
		'account.conflict.boolean.popularNegative': '「不人気」',
		'account.conflict.boolean.popularPositive': '「人気」',
		'account.conflict.candidate.keep': 'この候補を保持',
		'account.conflict.candidate.label': '候補 {number}',
		'account.conflict.candidate.rawData': '候補の元データ',
		'account.conflict.candidatesIntro':
			'選択するまで候補はアップロードされません。選択後、システムはまず選択結果を保存し、その後クラウド版と比較します。',
		'account.conflict.candidatesSubtitle':
			'複数のタブが同時に「{namespace}」を変更しました。すべての候補は保持されています。どれか一つを明確に選択してください。',
		'account.conflict.card.empty': '表示できる差分はありません',
		'account.conflict.card.more':
			'さらに差分があります。技術詳細で確認できます',
		'account.conflict.compare.button': '2つのバージョンを比較',
		'account.conflict.compare.note':
			'ここには差分のみ表示されます。選択すると、もう一方の変更は置き換えられます。',
		'account.conflict.confirm.cancel': 'キャンセル',
		'account.conflict.confirm.confirm': '保持を確定',
		'account.conflict.confirm.title': 'もう一方の変更を上書きしますか？',
		'account.conflict.confirmation.cloud':
			'クラウド版を保持すると、この端末の{namespace}の変更は置き換えられます。',
		'account.conflict.confirmation.local':
			'現在の端末版を保持すると、クラウドにアップロードされ、クラウドの{namespace}の変更を置き換えます。',
		'account.conflict.detail.local': '現在の端末の元データ',
		'account.conflict.detail.merged': 'マージ後の元データ',
		'account.conflict.detail.remote': 'クラウドの元データ',
		'account.conflict.field.activeId': '現在使用中の営業プリセット',
		'account.conflict.field.columns': '表示する列',
		'account.conflict.field.completed': 'レア客チュートリアルの進行状況',
		'account.conflict.field.darkPalette': 'ダークテーマの配色',
		'account.conflict.field.dlcs': '無効化されたデータセット',
		'account.conflict.field.enabled': '有効状態',
		'account.conflict.field.famousShop': '「人気店」効果',
		'account.conflict.field.guestCardTagsTooltip':
			'お客様カードのタグのツールチップ',
		'account.conflict.field.hiddenItems':
			'有効/無効にする飲み物・料理・食材',
		'account.conflict.field.highAppearance':
			'スムーズスクロールとすりガラス効果',
		'account.conflict.field.items': '保存済みの営業プリセット',
		'account.conflict.field.lightPalette': 'ライトテーマの配色',
		'account.conflict.field.maxExtraIngredients': '追加食材の上限',
		'account.conflict.field.maxRating': '評価の上限',
		'account.conflict.field.maxResults': '推薦結果の上限',
		'account.conflict.field.mode': 'カラーモード',
		'account.conflict.field.orderLinkedFilter':
			'注文条件の選択と同時に表を絞り込む',
		'account.conflict.field.other': '設定内容',
		'account.conflict.field.popularTrend': '流行',
		'account.conflict.field.popularTrendIsNegative': '流行の方向',
		'account.conflict.field.popularTrendTag': '流行タグ',
		'account.conflict.field.row': '表示する行数',
		'account.conflict.field.showTagDescription':
			'料理タグに対応するキーワードを表示',
		'account.conflict.field.sortProfile':
			'「おすすめ」のデフォルト推薦方針',
		'account.conflict.field.suggestMeals': '「おすすめ」推薦',
		'account.conflict.field.suggestMealsMaxExtraIngredients':
			'「おすすめ」の追加食材の上限',
		'account.conflict.field.suggestMealsMaxRating':
			'「おすすめ」の評価の上限',
		'account.conflict.field.suggestMealsMaxResults':
			'「おすすめ」の推薦結果の上限',
		'account.conflict.field.suggestMealsSortProfile':
			'「おすすめ」のデフォルト推薦方針',
		'account.conflict.field.table': '表の設定',
		'account.conflict.field.tableColumnsBeverage': '飲み物テーブルの表示列',
		'account.conflict.field.tableColumnsRecipe': '料理テーブルの表示列',
		'account.conflict.field.tableHiddenItemsBeverages':
			'テーブルで非表示の飲み物',
		'account.conflict.field.tableHiddenItemsIngredients':
			'テーブルで非表示の食材',
		'account.conflict.field.tableHiddenItemsRecipes':
			'テーブルで非表示の料理',
		'account.conflict.field.tachie': 'お客様ページ右下の立ち絵',
		'account.conflict.field.theme': 'カラーモード',
		'account.conflict.field.vibrate': '振動フィードバック',
		'account.conflict.invalidEvidence':
			'解析できない旧証拠が{count}件ありますが、それらも保持されます。',
		'account.conflict.listSeparator': '、',
		'account.conflict.merge.apply': 'このマージ結果を使用',
		'account.conflict.merge.button': '双方の変更をマージ',
		'account.conflict.merge.keepNote': 'マージ後に保持される内容',
		'account.conflict.merge.more':
			'さらに多くのマージ内容は技術詳細で確認できます',
		'account.conflict.merge.note':
			'互換性のある変更を双方から保持するマージ結果が用意されています。',
		'account.conflict.merge.recommended': 'おすすめ',
		'account.conflict.namespace.customerNormalMeals':
			'保存済みセットメニュー（一般客）',
		'account.conflict.namespace.customerRareMeals':
			'保存済みセットメニュー（レア客）',
		'account.conflict.namespace.customerRarePlans':
			'営業プリセット（レア客）',
		'account.conflict.namespace.customerRareSettings': '設定（レア客）',
		'account.conflict.namespace.globalPreferences': '設定（全体）',
		'account.conflict.namespace.theme': 'テーマ設定',
		'account.conflict.namespace.tutorialCustomerRare':
			'レア客チュートリアルの進行状況',
		'account.conflict.namespaces': '対象：',
		'account.conflict.pendingRemote.subTitle':
			'競合内容は別のタブに保存されています。競合が発生したタブに戻って処理してください。解決後、ここは自動的に復旧します。',
		'account.conflict.resolution.cloud.button': 'クラウド版を保持',
		'account.conflict.resolution.cloud.description':
			'アカウントクラウドのデータです。この端末の対応する変更を上書きします。',
		'account.conflict.resolution.cloud.title': 'クラウド版',
		'account.conflict.resolution.local.button': '現在の端末版を保持',
		'account.conflict.resolution.local.description':
			'このブラウザにまだ同期されていないデータです。アップロードしてクラウドの変更を上書きします。',
		'account.conflict.resolution.local.title': '現在の端末版',
		'account.conflict.syncPausedNote':
			'このデータの同期は一時停止中です。選択が完了するまで両方のデータは保持され、自動的に上書きされません。',
		'account.conflict.syncSubtitle':
			'現在の端末とクラウドの両方が「{namespace}」を変更しました。保持する内容を選択してください。',
		'account.conflict.technicalDetails': '技術詳細を表示',
		'account.conflict.title.crossTab': 'タブ間の同期競合',
		'account.conflict.title.pendingRemote': 'クラウド同期の競合待ち',
		'account.conflict.title.sync': 'クラウド同期の競合',
		'account.conflict.unmergeableNote':
			'この2つの変更は安全に自動マージできません。下の差分を比較してどちらかを選択してください。',
		'account.conflict.unresolvedCount': '{count}件待ち',
		'account.conflict.value.action': '操作',
		'account.conflict.value.beverage': '飲み物',
		'account.conflict.value.cooker': '調理器具',
		'account.conflict.value.cookerType': '調理器具',
		'account.conflict.value.ingredient': '食材',
		'account.conflict.value.none': 'なし',
		'account.conflict.value.notSet': '未設定',
		'account.conflict.value.previewMore': '{preview}ほか{count}件',
		'account.conflict.value.price': '価格',
		'account.conflict.value.recipe': '料理',
		'account.conflict.value.recordCount': '{count}件の設定を含む',
		'account.conflict.value.suitability': '相性',
		'account.conflict.value.time': '調理時間',
		'account.conflict.value.unavailable': '表示できません',
		'account.legacyImport.clearAction': 'バックアップコードをクリア',
		'account.legacyImport.codeHint':
			'バックアップコードは通常、旧バージョンのクラウドバックアップ機能で発行されます。全体をコピーして貼り付けてください',
		'account.legacyImport.codeLabel': '旧バックアップコード',
		'account.legacyImport.codePlaceholder':
			'旧バックアップコードを貼り付け',
		'account.legacyImport.description':
			'旧バージョンのクラウドバックアップコードを入力してインポートすると、保存されたセットメニューデータが現在のアカウントに統合されます。インポート成功後、そのコードは自動的に失効します。',
		'account.legacyImport.failed':
			'インポートに失敗しました。しばらくしてから再試行してください',
		'account.legacyImport.importAction': 'アカウントにインポート',
		'account.legacyImport.signInAction': 'ログイン/登録',
		'account.legacyImport.signInRequired':
			'旧バックアップコードはログイン済みアカウントにのみインポートできます。先にログインまたは登録してください。',
		'account.legacyImport.success':
			'インポートに成功しました。続けて次の旧バックアップコードをインポートできます',
		'account.manager.accountDeleteFailed': 'アカウントの削除に失敗しました',
		'account.manager.auth.loginAction': 'ログイン',
		'account.manager.auth.loginTab': 'ログイン',
		'account.manager.auth.nicknamePlaceholder': '表示名を設定',
		'account.manager.auth.passkeyContinue': 'パスキーで続行',
		'account.manager.auth.passkeyRegister':
			'パスキーで新しいアカウントを作成',
		'account.manager.auth.passkeyToggle': 'パスキーで登録/ログイン',
		'account.manager.auth.passwordEntry':
			'ユーザー名とパスワードで登録/ログイン',
		'account.manager.auth.passwordPlaceholderLogin': 'パスワードを入力',
		'account.manager.auth.passwordPlaceholderRegister':
			'ログインパスワードを設定',
		'account.manager.auth.registerAction': 'アカウントを作成',
		'account.manager.auth.registerTab': '新規登録',
		'account.manager.auth.sideTitleSso': 'SSO認証',
		'account.manager.auth.sideTitleSync': 'アカウント同期',
		'account.manager.auth.ssoDescription1':
			'ログインすると、外部アプリに小助手アカウントの身元情報を許可できます。',
		'account.manager.auth.ssoDescription2':
			'登録すると自動的にログインし、ログイン後は認証ページで確認できます。',
		'account.manager.auth.syncDescription1':
			'アカウントはこのブラウザに保存されたデータを同期し、他の端末でも同じ設定を使い続けられます。',
		'account.manager.auth.syncDescription2':
			'登録すると自動的にログインし、ログイン後、この端末の未アップロードの変更は自動的に同期を再開します。',
		'account.manager.auth.termsLink': '法律声明',
		'account.manager.auth.termsPrefix': '以下に同意します：',
		'account.manager.auth.usernamePlaceholder':
			'アカウントのユーザー名を入力',
		'account.manager.authenticationCredentialsRequired':
			'ユーザー名とパスワードを入力してください',
		'account.manager.authenticationFailed': '認証に失敗しました',
		'account.manager.bootstrapFailed':
			'アカウントサービスの初期化に失敗しました。ページを更新して再試行してください',
		'account.manager.bootstrapServerMisconfigured':
			'サーバー設定が異常です',
		'account.manager.bootstrapUnavailable':
			'アカウント機能は一時利用できません：{message}',
		'account.manager.cloudDataChangedReconfirm':
			'クラウドデータが変更されました。再確認してから消去してください',
		'account.manager.cloudDataChangedRefreshing':
			'クラウドデータが変更されました。アカウント状態を更新しています…',
		'account.manager.cloudDataCleared': 'クラウドデータを消去しました',
		'account.manager.cloudDataClearFailed':
			'クラウドデータの消去に失敗しました',
		'account.manager.confirm.cancel': 'キャンセル',
		'account.manager.danger.clearData': 'クラウドデータを消去',
		'account.manager.danger.clearDataCleared': 'クラウドデータは消去済み',
		'account.manager.danger.clearDataConfirm': '消去する',
		'account.manager.danger.deleteAccount': 'アカウントを削除',
		'account.manager.danger.deleteAccountConfirm': '削除する',
		'account.manager.danger.warning':
			'危険な操作はクラウドデータやアカウント自体に影響します。残したいデータは先にデータ管理からエクスポートしてください。',
		'account.manager.field.currentPassword': '現在のパスワード',
		'account.manager.field.displayName': '表示名',
		'account.manager.field.loginPassword': 'ログインパスワード',
		'account.manager.field.newPassword': '新しいパスワード',
		'account.manager.field.nickname': 'ニックネーム',
		'account.manager.field.nicknameOptional': 'ニックネーム（任意）',
		'account.manager.field.passkey': 'パスキー',
		'account.manager.field.password': 'パスワード',
		'account.manager.field.username': 'ユーザー名',
		'account.manager.loginSuccess': 'ログインしました',
		'account.manager.loginSupport.invalidCredentials':
			'ユーザー名またはパスワードが正しくありません。サポートが必要な場合は',
		'account.manager.loginSupport.userDeleted':
			'アカウントは削除されました。復元する場合は',
		'account.manager.loginSupport.userDisabled':
			'アカウントは無効化されています。有効化する場合は',
		'account.manager.loginSupportLink': '管理者にお問い合わせください',
		'account.manager.logoutSyncFailed': 'ログアウト前の同期に失敗しました',
		'account.manager.mobile.subtitle': 'データ同期とアカウント保護',
		'account.manager.passkeyAdded': 'パスキーを追加しました',
		'account.manager.passkeyAddFailed': 'パスキーの追加に失敗しました',
		'account.manager.passkeyDeleted': 'パスキーを削除しました',
		'account.manager.passkeyDeleteFailed': 'パスキーの削除に失敗しました',
		'account.manager.passkeyRefreshFailed': 'パスキーの更新に失敗しました',
		'account.manager.passkeyRenamed': 'パスキーの名前を変更しました',
		'account.manager.passkeyRenameFailed':
			'パスキーの名前変更に失敗しました',
		'account.manager.passkeys.add': '追加',
		'account.manager.passkeys.addedAt': '追加日時：',
		'account.manager.passkeys.cancelRename': '名前の変更をキャンセル',
		'account.manager.passkeys.confirmAdd': '追加する',
		'account.manager.passkeys.confirmDelete': '削除する',
		'account.manager.passkeys.delete': 'パスキーを削除',
		'account.manager.passkeys.lastUsed': '最終使用：',
		'account.manager.passkeys.nameExample': '例：自分のスマホ、YubiKey',
		'account.manager.passkeys.nameOptional': 'パスキー名（任意）',
		'account.manager.passkeys.neverUsed': '未使用',
		'account.manager.passkeys.rename': '名前を変更',
		'account.manager.passkeys.renameAria': 'パスキーの名前を変更',
		'account.manager.passkeys.saveName': '名前を保存',
		'account.manager.passwordChange.aria': 'アカウントのパスワードを更新',
		'account.manager.passwordChange.badge':
			'続行するにはパスワードの更新が必要です',
		'account.manager.passwordChange.currentAccount': '現在のアカウント',
		'account.manager.passwordChange.currentPasswordLabel':
			'現在の一時パスワード',
		'account.manager.passwordChange.currentPasswordPlaceholder':
			'管理者から提供された、またはログインに使用したパスワードを入力',
		'account.manager.passwordChange.newPasswordPlaceholder':
			'今後継続して使用する新しいパスワードを入力',
		'account.manager.passwordChange.restrictedTitle': '制限状態',
		'account.manager.passwordChange.restrictedTitleSso': 'SSO制限状態',
		'account.manager.passwordChange.setupTitle': '新しいパスワードを設定',
		'account.manager.passwordChange.subtitleAccount':
			'管理者がこのアカウントのログイン情報をリセットしました。パスワード更新後、アカウント同期とデータ操作が再開します。',
		'account.manager.passwordChange.subtitleSso':
			'管理者がこのアカウントのログイン情報をリセットしました。パスワードを更新して外部アプリへの認証を続けてください。',
		'account.manager.passwordChange.switchAccount': 'アカウントを切り替え',
		'account.manager.passwordChange.titleSso':
			'SSO認証 - アカウントのパスワードを更新',
		'account.manager.passwordChange.updateAndContinue':
			'パスワードを更新して続行',
		'account.manager.passwordChange.usernameAria': 'アカウントのユーザー名',
		'account.manager.passwordSet': 'ログインパスワードを設定しました',
		'account.manager.passwordUpdated': 'パスワードを更新しました',
		'account.manager.profile.changePassword': 'パスワードを変更',
		'account.manager.profile.currentPasswordPlaceholder':
			'現在のパスワードを入力',
		'account.manager.profile.currentPasswordRequired':
			'ユーザー名の変更には現在のパスワードの確認が必要です',
		'account.manager.profile.initialPasswordHint':
			'ログインパスワードを設定すると、パスキー非対応の端末でもユーザー名とパスワードでログインできます。',
		'account.manager.profile.newPasswordPlaceholder':
			'新しいパスワードを入力',
		'account.manager.profile.passwordMustChangeNotice':
			'管理者がパスワードの更新を要求しています。完了すると同期を続行できます。',
		'account.manager.profile.save': 'プロフィールを保存',
		'account.manager.profile.titleAccountSettings': 'アカウント設定',
		'account.manager.profile.titleSetupPassword':
			'ログインパスワードを設定',
		'account.manager.profile.titleUpdatePassword': 'パスワードを更新',
		'account.manager.profile.updatePasswordAndContinue':
			'パスワードを更新して続行',
		'account.manager.profile.usernameChangeHint':
			'ユーザー名を変更する前にログインパスワードを設定してください。ニックネームは直接変更できます',
		'account.manager.profile.usernameDisplay': 'ユーザー名：',
		'account.manager.profile.usernamePlaceholder': '新しいユーザー名を入力',
		'account.manager.profileUpdated': 'プロフィールを更新しました',
		'account.manager.profileUpdateFailed':
			'プロフィールの更新に失敗しました',
		'account.manager.registrationFailed': '登録に失敗しました',
		'account.manager.registrationSuccess': '登録しました',
		'account.manager.sessionRefreshFailed':
			'ログイン端末の更新に失敗しました',
		'account.manager.sessionRevoked': 'ログイン端末を解除しました',
		'account.manager.sessionRevokeFailed':
			'ログイン端末の解除に失敗しました',
		'account.manager.sessions.confirmRevoke': 'ログアウト',
		'account.manager.sessions.createdAt': '作成日時：',
		'account.manager.sessions.current': '現在のセッション',
		'account.manager.sessions.lastActive': '最終アクティブ：',
		'account.manager.sessions.other': '他のセッション',
		'account.manager.sessions.refresh': 'セッションを更新',
		'account.manager.sessions.revoke': '端末をログアウト',
		'account.manager.sessions.source': '接続元：',
		'account.manager.sessions.thisDevice': 'この端末',
		'account.manager.sessions.title': 'ログイン端末',
		'account.manager.ssoGrantRefreshFailed':
			'認可済みアプリの更新に失敗しました',
		'account.manager.ssoGrantRevoked': '認可を解除しました',
		'account.manager.ssoGrantRevokeFailed': '認可の解除に失敗しました',
		'account.manager.ssoGrants.confirmRevoke': '取り消す',
		'account.manager.ssoGrants.refresh': '認証を更新',
		'account.manager.ssoGrants.revoke': '認証を取り消す',
		'account.manager.ssoGrants.title': '連携済みアプリ',
		'account.manager.status.awaitingSystemVerification':
			'システムの検証を待っています…',
		'account.manager.status.connected': 'アカウント同期は接続済みです',
		'account.manager.status.noPasskeys': 'パスキーはまだありません',
		'account.manager.status.noSessions': '表示できるセッションはありません',
		'account.manager.status.noSsoGrants': '認可済みアプリはありません',
		'account.manager.status.passkeyPrompt':
			'パスワードは不要です。システムの案内に従って確認してください',
		'account.manager.status.passkeysUnsupported':
			'この環境ではパスキーを利用できません',
		'account.manager.status.paused': 'クラウド同期は一時停止中です',
		'account.manager.status.readingPasskeys': 'パスキーを読み込んでいます',
		'account.manager.status.readingSessions':
			'ログイン端末を読み込んでいます',
		'account.manager.status.readingSsoGrants':
			'認可済みアプリを読み込んでいます',
		'account.manager.syncPendingBeforeLogout':
			'同期がまだ完了していません。同期を再試行してからログアウトしてください',
		'account.manager.termsRequired':
			'先に法律声明をお読みいただき、同意してください',
		'account.manager.ui.ariaManage': 'アカウント管理',
		'account.manager.ui.ariaSignIn': 'アカウントログイン',
		'account.manager.ui.dataAndSessions': 'データとセッション',
		'account.manager.ui.dataManagement': 'データ管理',
		'account.manager.ui.descriptionManage':
			'現在のアカウント、同期状態、クラウドデータを管理',
		'account.manager.ui.descriptionSsoSignIn':
			'外部アプリへ認可するため小助手アカウントにログイン',
		'account.manager.ui.descriptionSyncSignIn':
			'ログインすると、このブラウザに保存されたデータを複数端末で同期できます',
		'account.manager.ui.logout': 'ログアウト',
		'account.manager.ui.logoutAll': 'すべての端末からログアウト',
		'account.manager.ui.passwordSignInDescription':
			'ユーザー名とパスワードでログイン',
		'account.manager.ui.ssoSignInAction': 'SSOログイン',
		'account.manager.ui.title': 'アカウント',
		'account.nicknameRule':
			'ニックネームは最大{max}文字で、改行や制御文字は使用できません',
		'account.passkeyNameRule':
			'パスキー名は最大{max}文字で、改行や制御文字は使用できません',
		'account.passwordRule':
			'パスワードは{min}～{max}文字で、少なくとも1つの空白以外の文字を含める必要があります',
		'account.sessions.summary.browser': 'ブラウザー',
		'account.sessions.summary.direct': '直接接続',
		'account.sessions.summary.recorded': '記録済みソース',
		'account.sessions.summary.unknownDevice': '不明なデバイス',
		'account.sessions.summary.unknownSource': '不明なソース',
		'account.sso.accountLabel.user': 'ユーザー名：{username}',
		'account.sso.accountLabel.userNickname':
			'ユーザー名：{username}、ニックネーム：{nickname}',
		'account.sso.agreeAction': '同意して続行',
		'account.sso.cancelAction': 'キャンセル',
		'account.sso.confirmNotice':
			'{client}はあなたの小助手アカウント身分、ユーザー名、ニックネームを取得します。',
		'account.sso.confirmSubtitle':
			'確認後、ログインを開始した外部サービスに戻ります',
		'account.sso.detail.account': '現在のアカウント',
		'account.sso.detail.client': '認可サービス',
		'account.sso.errorFlowSubtitle': '現在の認可フローを続行できません',
		'account.sso.loginRequiredNotice':
			'先に小助手アカウントにログインしてください。完了後、この認可フローに戻ります。',
		'account.sso.loginRequiredSubtitle':
			'小助手アカウントの身分確認が必要です',
		'account.sso.offlineNotice':
			'オフライン版はアカウント認可に対応していません。オンラインサービスから外部クライアントで再度ログインを開始してください。',
		'account.sso.offlineSubtitle':
			'オフライン版ではアカウント認可を完了できません',
		'account.sso.openAccountFlow': 'アカウントフローを開く',
		'account.sso.panelTitle': 'SSO認可',
		'account.sso.passwordChangeNotice':
			'先にダイアログでアカウントパスワードを更新してください。完了後、認可を続行します。',
		'account.sso.passwordChangeSubtitle': 'アカウントの安全更新が必要です',
		'account.sso.status.authorizationCancelled':
			'認可はキャンセルされました。',
		'account.sso.status.authorizationExpired':
			'認可コンテキストの有効期限が切れました。外部サービスから再度ログインを開始してください。',
		'account.sso.status.invalidRequest':
			'認可リクエストが無効か失効しています。外部サービスから再度ログインを開始してください。',
		'account.sso.status.networkFailed':
			'ネットワーク接続に失敗しました。しばらくしてから再試行してください。',
		'account.sso.status.rateLimited':
			'操作が多すぎます。しばらくしてからお試しください。',
		'account.sso.status.rateLimitedWithDelay':
			'操作が多すぎます。{seconds}秒後に再試行してください。',
		'account.sync.collision.canonicalQueue': '互換キューのバージョン',
		'account.sync.collision.legacyQueue': '旧タブのバージョン',
		'account.sync.collision.nextClient':
			'新しいクライアントで保持されたバージョン',
		'account.sync.collision.preMigration': '変換前のバージョン',
		'account.sync.conflict.busy': '別のタブがこの競合を処理中です',
		'account.sync.conflict.recovering':
			'同期状態を復元しています。しばらくお待ちください',
		'account.sync.conflict.stale':
			'競合内容が更新されました。再確認してください',
		'account.sync.conflict.storageUnavailable':
			'ブラウザが現在同期状態を保存できません。既存データは変更されていません',
		'account.sync.conflict.unexpected':
			'競合の保存に失敗しました。しばらくしてから再試行してください',
		'account.sync.conflict.unsupported':
			'現在のページバージョンではこの同期状態を処理できません。更新して再試行してください',
		'account.sync.control.broadcastAvailable': '利用可能',
		'account.sync.control.broadcastUnavailable': '利用不可',
		'account.sync.control.collapseDetails': '同期詳細を折りたたむ',
		'account.sync.control.compatibleLock': 'ブラウザ互換ロック',
		'account.sync.control.expandDetails': '同期詳細を展開',
		'account.sync.control.mergedUnavailable': '自動マージ不可',
		'account.sync.control.nativeLock': 'ブラウザネイティブ',
		'account.sync.control.restore': 'この端末のデータでクラウド同期を復元',
		'account.sync.control.restoring': 'クラウド同期を復元中',
		'account.sync.control.sync': '今すぐ同期',
		'account.sync.control.syncing': '同期中',
		'account.sync.failedAttempts': '（{attempts}回失敗）',
		'account.sync.fallback.rebuildFailed':
			'クラウド同期の復元に失敗しました。しばらくしてから再試行してください',
		'account.sync.fallback.syncFailed':
			'同期エラーです。しばらくしてから再試行してください',
		'account.sync.isolated.default.detail':
			'ページを更新して最新バージョンが読み込まれているか確認してください。この表示が続く場合はアプリを更新して再試行してください。',
		'account.sync.isolated.default.title': '同期クライアントの更新が必要',
		'account.sync.isolated.quarantineFailed.detail':
			'元のデータはこのブラウザに残っています。ローカルストレージの空きを確保してページを更新してください。',
		'account.sync.isolated.quarantineFailed.title':
			'ローカル同期データを安全に隔離できません',
		'account.sync.isolated.resetMarkerInvalid.detail':
			'元のデータはこのブラウザに残っています。保持したいデータをエクスポートし、明示的なデータ削除操作でこの状態をリセットしてください。',
		'account.sync.isolated.resetMarkerInvalid.title':
			'ローカル同期状態の対応が必要',
		'account.sync.isolated.storageUnavailable.detail':
			'既存データは変更されていません。ブラウザがこのページのデータ保存を許可しているか確認し、更新して再試行してください。',
		'account.sync.isolated.storageUnavailable.title':
			'ブラウザストレージが一時的に利用できません',
		'account.sync.namespace.automaticResolution': '調整中',
		'account.sync.namespace.automaticResolutionPaused': '自動調整中',
		'account.sync.namespace.conflict': '競合待ち',
		'account.sync.namespace.dirty': 'アップロード待ち',
		'account.sync.namespace.synced': '同期済み',
		'account.sync.pausedReason.applyingRemote': 'クラウド適用中',
		'account.sync.pausedReason.bootstrap': '初期化中',
		'account.sync.pausedReason.cloudPaused': 'クラウド同期は一時停止中',
		'account.sync.pausedReason.conflict': '競合待ち',
		'account.sync.pausedReason.deleteData': 'データ消去中',
		'account.sync.pausedReason.importingBackup':
			'旧バックアップをインポート中',
		'account.sync.readiness.busy': '他ページが処理中',
		'account.sync.readiness.ready': '競合待ち',
		'account.sync.readiness.recovering': '復元中',
		'account.sync.readiness.stale': '内容が更新されました',
		'account.sync.readiness.storageUnavailable': 'ストレージ利用不可',
		'account.sync.readiness.unsupported': '更新が必要',
		'account.sync.status.noPendingData': '同期待ちデータはありません',
		'account.sync.status.noSuccessfulRecord': '成功記録はまだありません',
		'account.sync.status.paused': 'クラウド同期は一時停止中です',
		'account.sync.status.pausedEmptyDescription':
			'クラウドには現在データがありません。この端末のデータはローカルのみに保存されています。',
		'account.sync.status.sessionQueueFallback':
			'同期キューは現在タブ間で永続化できません。このセッション内でできる限り同期します。',
		'account.sync.status.sessionQueueWarning':
			'現在のストレージはタブ間の同期キューを永続化できません。ページを閉じる前に同期の完了を待ってください。',
		'account.sync.storage.local': 'ローカル永続化',
		'account.sync.storage.memory': 'メモリフォールバック',
		'account.sync.storage.session': 'セッションフォールバック',
		'account.sync.terminal.capacityExceeded': '容量超過',
		'account.sync.terminal.requestTooLarge': 'リクエスト過大',
		'account.syncUi.attempts': '試行：{count}',
		'account.syncUi.baselineVersion': 'ベースライン版：',
		'account.syncUi.changedAt': '変更日時：',
		'account.syncUi.cloudVersion': 'クラウド版：',
		'account.syncUi.confirmRestore': '復元を確認',
		'account.syncUi.conflicts': '競合：{count}',
		'account.syncUi.crossTabBroadcast': 'タブ間ブロードキャスト',
		'account.syncUi.crossTabLock': 'タブ間ロック',
		'account.syncUi.details': '同期詳細',
		'account.syncUi.lastSync': '最終同期：',
		'account.syncUi.paused': '一時停止：',
		'account.syncUi.pausedTitle': 'クラウド同期は一時停止中',
		'account.syncUi.pending': 'アップロード待ち：{count}',
		'account.syncUi.storage': 'ストレージ',
		'account.syncUi.title': '同期状態',
		'account.usernameRule':
			'ユーザー名は{min}～{max}文字で、中国語、英字、数字、アンダースコア、ピリオド、ハイフン、メールアドレス形式が使用できます',
	},
	ko: {
		'account.action.signedOut': '로그인 안 됨',
		'account.action.unavailable': '계정 사용 불가',
		'account.action.welcome': '환영합니다',
		'account.client.accountStateRefreshFailed':
			'계정 상태 새로고침에 실패했습니다. 잠시 후 다시 시도하세요',
		'account.client.logoutFailed': '로그아웃 실패',
		'account.client.operationBusy':
			'다른 탭에서 계정 데이터를 처리 중입니다. 잠시 후 다시 시도하세요',
		'account.client.passwordChangeFailed': '비밀번호 변경 실패',
		'account.client.passwordMustChangeAccountPaused':
			'비밀번호를 갱신할 때까지 계정 동기화, 클라우드 데이터 작업, 충돌 처리가 일시 중지됩니다.',
		'account.client.passwordMustChangeAuthorizePaused':
			'비밀번호를 갱신할 때까지 SSO 권한 부여를 완료할 수 없으며 로그인 티켓도 발급되지 않습니다.',
		'account.client.passwordMustChangeLogoutAccount':
			'지금 처리하지 않으려면 현재 계정에서 로그아웃할 수 있습니다. 이 기기의 미완료 동기화 큐는 로컬에 남고 다시 로그인하면 이어집니다.',
		'account.client.passwordMustChangeLogoutAuthorize':
			'지금 처리하지 않으려면 로그아웃하고 홈으로 돌아갈 수 있습니다.',
		'account.conflict.aria.crossTab': '클라우드 동기화 충돌 대기',
		'account.conflict.aria.pendingRemote': '클라우드 동기화 충돌',
		'account.conflict.aria.sync': '클라우드 동기화 충돌',
		'account.conflict.boolean.completedFalse': '미완료',
		'account.conflict.boolean.completedTrue': '완료',
		'account.conflict.boolean.off': '끔',
		'account.conflict.boolean.on': '켬',
		'account.conflict.boolean.popularNegative': '“인기 없음”',
		'account.conflict.boolean.popularPositive': '“인기 있음”',
		'account.conflict.candidate.keep': '이 후보 유지',
		'account.conflict.candidate.label': '후보 {number}',
		'account.conflict.candidate.rawData': '후보 원본 데이터',
		'account.conflict.candidatesIntro':
			'선택하기 전에는 어떤 후보도 업로드되지 않습니다. 선택 후 시스템이 먼저 선택 결과를 저장한 다음 클라우드 버전과 비교합니다.',
		'account.conflict.candidatesSubtitle':
			'여러 탭이 동시에 “{namespace}”을(를) 수정했습니다. 모든 후보가 보존되어 있으니 하나를 명확히 선택하세요.',
		'account.conflict.card.empty': '표시할 차이가 없습니다',
		'account.conflict.card.more':
			'더 많은 차이가 있습니다. 기술 세부 정보에서 확인할 수 있습니다',
		'account.conflict.compare.button': '두 버전 비교',
		'account.conflict.compare.note':
			'여기에는 차이만 표시됩니다. 선택하면 다른 쪽 변경이 대체됩니다.',
		'account.conflict.confirm.cancel': '취소',
		'account.conflict.confirm.confirm': '유지 확인',
		'account.conflict.confirm.title': '다른 변경을 덮어쓸까요?',
		'account.conflict.confirmation.cloud':
			'클라우드 버전을 유지하면 이 기기의 {namespace} 변경이 대체됩니다.',
		'account.conflict.confirmation.local':
			'현재 기기 버전을 유지하면 클라우드에 업로드되어 클라우드의 {namespace} 변경을 대체합니다.',
		'account.conflict.detail.local': '현재 기기 원본 데이터',
		'account.conflict.detail.merged': '병합 후 원본 데이터',
		'account.conflict.detail.remote': '클라우드 원본 데이터',
		'account.conflict.field.activeId': '현재 사용 중인 영업 프리셋',
		'account.conflict.field.columns': '표시할 열',
		'account.conflict.field.completed': '레어 손님 튜토리얼 진행 상황',
		'account.conflict.field.darkPalette': '다크 테마 색상',
		'account.conflict.field.dlcs': '비활성화된 데이터셋',
		'account.conflict.field.enabled': '사용 상태',
		'account.conflict.field.famousShop': '"인기 가게" 효과',
		'account.conflict.field.guestCardTagsTooltip': '손님 카드 태그 툴팁',
		'account.conflict.field.hiddenItems':
			'활성화 또는 비활성화한 음료, 요리, 재료',
		'account.conflict.field.highAppearance':
			'부드러운 스크롤과 프로스트 글라스 효과',
		'account.conflict.field.items': '저장된 영업 프리셋',
		'account.conflict.field.lightPalette': '라이트 테마 색상',
		'account.conflict.field.maxExtraIngredients': '추가 재료 상한',
		'account.conflict.field.maxRating': '평가 상한',
		'account.conflict.field.maxResults': '추천 결과 상한',
		'account.conflict.field.mode': '색상 모드',
		'account.conflict.field.orderLinkedFilter':
			'주문 조건 선택과 동시에 표 필터링',
		'account.conflict.field.other': '설정 내용',
		'account.conflict.field.popularTrend': '인기 트렌드',
		'account.conflict.field.popularTrendIsNegative': '트렌드 방향',
		'account.conflict.field.popularTrendTag': '트렌드 태그',
		'account.conflict.field.row': '표시할 행 수',
		'account.conflict.field.showTagDescription': '요리 태그의 키워드 표시',
		'account.conflict.field.sortProfile':
			'"원하실 것 같아요" 기본 추천 전략',
		'account.conflict.field.suggestMeals': '"원하실 것 같아요" 추천',
		'account.conflict.field.suggestMealsMaxExtraIngredients':
			'"원하실 것 같아요" 추가 재료 상한',
		'account.conflict.field.suggestMealsMaxRating':
			'"원하실 것 같아요" 평가 상한',
		'account.conflict.field.suggestMealsMaxResults':
			'"원하실 것 같아요" 추천 결과 상한',
		'account.conflict.field.suggestMealsSortProfile':
			'"원하실 것 같아요" 기본 추천 전략',
		'account.conflict.field.table': '표 설정',
		'account.conflict.field.tableColumnsBeverage': '음료 표의 표시 열',
		'account.conflict.field.tableColumnsRecipe': '요리 표의 표시 열',
		'account.conflict.field.tableHiddenItemsBeverages': '표에서 숨긴 음료',
		'account.conflict.field.tableHiddenItemsIngredients':
			'표에서 숨긴 재료',
		'account.conflict.field.tableHiddenItemsRecipes': '표에서 숨긴 요리',
		'account.conflict.field.tachie': '손님 페이지 오른쪽 아래의 일러스트',
		'account.conflict.field.theme': '색상 모드',
		'account.conflict.field.vibrate': '진동 피드백',
		'account.conflict.invalidEvidence':
			'해석할 수 없는 이전 증거 {count}건도 함께 보존됩니다.',
		'account.conflict.listSeparator': ', ',
		'account.conflict.merge.apply': '이 병합 결과 사용',
		'account.conflict.merge.button': '양쪽 변경 병합',
		'account.conflict.merge.keepNote': '병합 후 유지되는 내용',
		'account.conflict.merge.more':
			'더 많은 병합 내용은 기술 상세에서 확인할 수 있습니다',
		'account.conflict.merge.note':
			'양쪽의 호환되는 변경을 함께 보존하는 병합 결과가 준비되었습니다.',
		'account.conflict.merge.recommended': '추천',
		'account.conflict.namespace.customerNormalMeals':
			'저장된 세트 메뉴(일반 손님)',
		'account.conflict.namespace.customerRareMeals':
			'저장된 세트 메뉴(레어 손님)',
		'account.conflict.namespace.customerRarePlans':
			'영업 프리셋(레어 손님)',
		'account.conflict.namespace.customerRareSettings':
			'환경 설정(레어 손님)',
		'account.conflict.namespace.globalPreferences': '환경 설정(전체)',
		'account.conflict.namespace.theme': '테마 설정',
		'account.conflict.namespace.tutorialCustomerRare':
			'레어 손님 튜토리얼 진행 상황',
		'account.conflict.namespaces': '대상:',
		'account.conflict.pendingRemote.subTitle':
			'충돌 내용이 다른 탭에 저장되어 있습니다. 충돌이 발생한 탭으로 돌아가 처리하세요. 해결되면 이 곳은 자동으로 복구됩니다.',
		'account.conflict.resolution.cloud.button': '클라우드 버전 유지',
		'account.conflict.resolution.cloud.description':
			'계정 클라우드의 데이터이며 이 기기의 해당 변경을 덮어씁니다.',
		'account.conflict.resolution.cloud.title': '클라우드 버전',
		'account.conflict.resolution.local.button': '현재 기기 버전 유지',
		'account.conflict.resolution.local.description':
			'이 브라우저에 아직 동기화되지 않은 데이터이며 업로드되어 클라우드 변경을 덮어씁니다.',
		'account.conflict.resolution.local.title': '현재 기기 버전',
		'account.conflict.syncPausedNote':
			'이 데이터의 동기화가 일시 중지되었습니다. 선택을 완료할 때까지 양쪽 데이터가 보존되며 자동으로 덮어쓰지 않습니다.',
		'account.conflict.syncSubtitle':
			'현재 기기와 클라우드 모두 “{namespace}”을(를) 수정했습니다. 유지할 내용을 선택하세요.',
		'account.conflict.technicalDetails': '기술 상세 보기',
		'account.conflict.title.crossTab': '탭 간 동기화 충돌',
		'account.conflict.title.pendingRemote': '클라우드 동기화 충돌 대기',
		'account.conflict.title.sync': '클라우드 동기화 충돌',
		'account.conflict.unmergeableNote':
			'이 두 변경은 안전하게 자동 병합할 수 없습니다. 아래 차이를 비교해 하나를 선택하세요.',
		'account.conflict.unresolvedCount': '{count}건 대기',
		'account.conflict.value.action': '작업',
		'account.conflict.value.beverage': '음료',
		'account.conflict.value.cooker': '조리도구',
		'account.conflict.value.cookerType': '조리도구',
		'account.conflict.value.ingredient': '재료',
		'account.conflict.value.none': '없음',
		'account.conflict.value.notSet': '설정 안 됨',
		'account.conflict.value.previewMore': '{preview} 외 {count}개',
		'account.conflict.value.price': '가격',
		'account.conflict.value.recipe': '요리',
		'account.conflict.value.recordCount': '설정 {count}개 포함',
		'account.conflict.value.suitability': '궁합',
		'account.conflict.value.time': '조리 시간',
		'account.conflict.value.unavailable': '표시할 수 없음',
		'account.legacyImport.clearAction': '백업 코드 지우기',
		'account.legacyImport.codeHint':
			'백업 코드는 보통 구 버전 클라우드 백업 기능에서 발급됩니다. 전체를 복사해 붙여 넣으세요',
		'account.legacyImport.codeLabel': '구 백업 코드',
		'account.legacyImport.codePlaceholder': '구 백업 코드 붙여넣기',
		'account.legacyImport.description':
			'구 버전 클라우드 백업 코드를 입력해 가져오면 저장된 세트 메뉴 데이터가 현재 계정에 병합됩니다. 가져오기가 완료되면 코드는 자동으로 만료됩니다.',
		'account.legacyImport.failed':
			'가져오기에 실패했습니다. 잠시 후 다시 시도하세요',
		'account.legacyImport.importAction': '계정으로 가져오기',
		'account.legacyImport.signInAction': '로그인 또는 가입',
		'account.legacyImport.signInRequired':
			'구 백업 코드는 로그인한 계정으로만 가져올 수 있습니다. 먼저 로그인하거나 가입하세요.',
		'account.legacyImport.success':
			'가져오기 완료. 다음 구 백업 코드를 계속 가져올 수 있습니다',
		'account.manager.accountDeleteFailed': '계정 삭제 실패',
		'account.manager.auth.loginAction': '로그인',
		'account.manager.auth.loginTab': '로그인',
		'account.manager.auth.nicknamePlaceholder': '표시 이름 설정',
		'account.manager.auth.passkeyContinue': '패스키로 계속',
		'account.manager.auth.passkeyRegister': '패스키로 새 계정 만들기',
		'account.manager.auth.passkeyToggle': '패스키로 가입/로그인',
		'account.manager.auth.passwordEntry':
			'사용자 이름과 비밀번호로 가입/로그인',
		'account.manager.auth.passwordPlaceholderLogin': '비밀번호 입력',
		'account.manager.auth.passwordPlaceholderRegister':
			'로그인 비밀번호 설정',
		'account.manager.auth.registerAction': '계정 만들기',
		'account.manager.auth.registerTab': '가입',
		'account.manager.auth.sideTitleSso': 'SSO 인증',
		'account.manager.auth.sideTitleSync': '계정 동기화',
		'account.manager.auth.ssoDescription1':
			'로그인하면 외부 앱이 도우미 계정 신원 정보를 받도록 승인할 수 있습니다.',
		'account.manager.auth.ssoDescription2':
			'가입하면 자동으로 로그인되며, 로그인 후 인증 페이지에서 확인할 수 있습니다.',
		'account.manager.auth.syncDescription1':
			'계정은 이 브라우저에 저장된 데이터를 동기화하여 다른 기기에서도 같은 설정을 계속 사용할 수 있습니다.',
		'account.manager.auth.syncDescription2':
			'가입하면 자동으로 로그인되며, 로그인 후 이 기기에서 아직 업로드되지 않은 변경 사항은 자동으로 동기화를 계속합니다.',
		'account.manager.auth.termsLink': '법적 고지',
		'account.manager.auth.termsPrefix': '다음을 읽고 동의합니다: ',
		'account.manager.auth.usernamePlaceholder': '계정 사용자 이름 입력',
		'account.manager.authenticationCredentialsRequired':
			'사용자 이름과 비밀번호를 입력하세요',
		'account.manager.authenticationFailed': '인증 실패',
		'account.manager.bootstrapFailed':
			'계정 서비스 초기화에 실패했습니다. 페이지를 새로고침한 뒤 다시 시도하세요',
		'account.manager.bootstrapServerMisconfigured':
			'서버 설정이 비정상입니다',
		'account.manager.bootstrapUnavailable':
			'계정 기능을 일시적으로 사용할 수 없습니다: {message}',
		'account.manager.cloudDataChangedReconfirm':
			'클라우드 데이터가 변경되었습니다. 다시 확인한 뒤 비우세요',
		'account.manager.cloudDataChangedRefreshing':
			'클라우드 데이터가 변경되었습니다. 계정 상태를 새로고침하는 중…',
		'account.manager.cloudDataCleared': '클라우드 데이터를 비웠습니다',
		'account.manager.cloudDataClearFailed': '클라우드 데이터 비우기 실패',
		'account.manager.confirm.cancel': '취소',
		'account.manager.danger.clearData': '클라우드 데이터 비우기',
		'account.manager.danger.clearDataCleared': '클라우드 데이터가 비워짐',
		'account.manager.danger.clearDataConfirm': '비우기',
		'account.manager.danger.deleteAccount': '계정 삭제',
		'account.manager.danger.deleteAccountConfirm': '삭제',
		'account.manager.danger.warning':
			'위험한 작업은 클라우드 데이터나 계정 자체에 영향을 줍니다. 보관할 데이터는 먼저 데이터 관리에서 내보내세요.',
		'account.manager.field.currentPassword': '현재 비밀번호',
		'account.manager.field.displayName': '표시 이름',
		'account.manager.field.loginPassword': '로그인 비밀번호',
		'account.manager.field.newPassword': '새 비밀번호',
		'account.manager.field.nickname': '닉네임',
		'account.manager.field.nicknameOptional': '닉네임(선택)',
		'account.manager.field.passkey': '패스키',
		'account.manager.field.password': '비밀번호',
		'account.manager.field.username': '사용자 이름',
		'account.manager.loginSuccess': '로그인했습니다',
		'account.manager.loginSupport.invalidCredentials':
			'사용자 이름 또는 비밀번호가 틀립니다. 도움이 필요하면',
		'account.manager.loginSupport.userDeleted':
			'계정이 삭제되었습니다. 복원하려면',
		'account.manager.loginSupport.userDisabled':
			'계정이 비활성화되었습니다. 활성화하려면',
		'account.manager.loginSupportLink': '관리자에게 문의하세요',
		'account.manager.logoutSyncFailed': '로그아웃 전 동기화 실패',
		'account.manager.mobile.subtitle': '데이터 동기화 및 계정 보안',
		'account.manager.passkeyAdded': '패스키를 추가했습니다',
		'account.manager.passkeyAddFailed': '패스키 추가 실패',
		'account.manager.passkeyDeleted': '패스키를 삭제했습니다',
		'account.manager.passkeyDeleteFailed': '패스키 삭제 실패',
		'account.manager.passkeyRefreshFailed': '패스키 새로고침 실패',
		'account.manager.passkeyRenamed': '패스키 이름을 변경했습니다',
		'account.manager.passkeyRenameFailed': '패스키 이름 변경 실패',
		'account.manager.passkeys.add': '추가',
		'account.manager.passkeys.addedAt': '추가일: ',
		'account.manager.passkeys.cancelRename': '이름 변경 취소',
		'account.manager.passkeys.confirmAdd': '추가하기',
		'account.manager.passkeys.confirmDelete': '삭제',
		'account.manager.passkeys.delete': '패스키 삭제',
		'account.manager.passkeys.lastUsed': '최근 사용: ',
		'account.manager.passkeys.nameExample': '예: 내 휴대폰, YubiKey',
		'account.manager.passkeys.nameOptional': '패스키 이름(선택)',
		'account.manager.passkeys.neverUsed': '사용한 적 없음',
		'account.manager.passkeys.rename': '이름 변경',
		'account.manager.passkeys.renameAria': '패스키 이름 변경',
		'account.manager.passkeys.saveName': '이름 저장',
		'account.manager.passwordChange.aria': '계정 비밀번호 업데이트',
		'account.manager.passwordChange.badge':
			'계속하려면 비밀번호를 업데이트해야 합니다',
		'account.manager.passwordChange.currentAccount': '현재 계정',
		'account.manager.passwordChange.currentPasswordLabel':
			'현재 임시 비밀번호',
		'account.manager.passwordChange.currentPasswordPlaceholder':
			'관리자가 제공했거나 방금 로그인에 사용한 비밀번호 입력',
		'account.manager.passwordChange.newPasswordPlaceholder':
			'앞으로 사용할 새 비밀번호 입력',
		'account.manager.passwordChange.restrictedTitle': '제한 상태',
		'account.manager.passwordChange.restrictedTitleSso': 'SSO 제한 상태',
		'account.manager.passwordChange.setupTitle': '새 비밀번호 설정',
		'account.manager.passwordChange.subtitleAccount':
			'관리자가 이 계정의 로그인 자격 증명을 재설정했습니다. 비밀번호를 업데이트하면 계정 동기화와 데이터 작업이 다시 활성화됩니다.',
		'account.manager.passwordChange.subtitleSso':
			'관리자가 이 계정의 로그인 자격 증명을 재설정했습니다. 비밀번호를 업데이트한 후 외부 앱 승인을 계속하세요.',
		'account.manager.passwordChange.switchAccount': '계정 전환',
		'account.manager.passwordChange.titleSso':
			'SSO 인증 - 계정 비밀번호 업데이트',
		'account.manager.passwordChange.updateAndContinue':
			'비밀번호 업데이트 후 계속',
		'account.manager.passwordChange.usernameAria': '계정 사용자 이름',
		'account.manager.passwordSet': '로그인 비밀번호를 설정했습니다',
		'account.manager.passwordUpdated': '비밀번호를 변경했습니다',
		'account.manager.profile.changePassword': '비밀번호 변경',
		'account.manager.profile.currentPasswordPlaceholder':
			'현재 비밀번호 입력',
		'account.manager.profile.currentPasswordRequired':
			'사용자 이름을 변경하려면 현재 비밀번호를 확인해야 합니다',
		'account.manager.profile.initialPasswordHint':
			'로그인 비밀번호를 설정하면 패스키를 지원하지 않는 기기에서도 사용자 이름과 비밀번호로 로그인할 수 있습니다.',
		'account.manager.profile.newPasswordPlaceholder': '새 비밀번호 입력',
		'account.manager.profile.passwordMustChangeNotice':
			'관리자가 비밀번호 업데이트를 요구했습니다. 완료하면 동기화가 계속됩니다.',
		'account.manager.profile.save': '프로필 저장',
		'account.manager.profile.titleAccountSettings': '계정 설정',
		'account.manager.profile.titleSetupPassword': '로그인 비밀번호 설정',
		'account.manager.profile.titleUpdatePassword': '비밀번호 업데이트',
		'account.manager.profile.updatePasswordAndContinue':
			'비밀번호 업데이트 후 계속',
		'account.manager.profile.usernameChangeHint':
			'사용자 이름을 변경하기 전에 로그인 비밀번호를 설정하세요. 닉네임은 바로 변경할 수 있습니다',
		'account.manager.profile.usernameDisplay': '사용자 이름: ',
		'account.manager.profile.usernamePlaceholder': '새 사용자 이름 입력',
		'account.manager.profileUpdated': '프로필을 변경했습니다',
		'account.manager.profileUpdateFailed': '프로필 변경 실패',
		'account.manager.registrationFailed': '가입 실패',
		'account.manager.registrationSuccess': '가입 완료',
		'account.manager.sessionRefreshFailed': '로그인 기기 새로고침 실패',
		'account.manager.sessionRevoked': '로그인 기기를 해제했습니다',
		'account.manager.sessionRevokeFailed': '로그인 기기 해제 실패',
		'account.manager.sessions.confirmRevoke': '로그아웃',
		'account.manager.sessions.createdAt': '생성일: ',
		'account.manager.sessions.current': '현재 세션',
		'account.manager.sessions.lastActive': '최근 활동: ',
		'account.manager.sessions.other': '다른 세션',
		'account.manager.sessions.refresh': '세션 새로 고침',
		'account.manager.sessions.revoke': '기기 로그아웃',
		'account.manager.sessions.source': '출처: ',
		'account.manager.sessions.thisDevice': '이 기기',
		'account.manager.sessions.title': '로그인 기기',
		'account.manager.ssoGrantRefreshFailed':
			'권한을 부여한 앱 새로고침 실패',
		'account.manager.ssoGrantRevoked': '권한을 철회했습니다',
		'account.manager.ssoGrantRevokeFailed': '권한 철회 실패',
		'account.manager.ssoGrants.confirmRevoke': '취소',
		'account.manager.ssoGrants.refresh': '승인 새로 고침',
		'account.manager.ssoGrants.revoke': '승인 취소',
		'account.manager.ssoGrants.title': '승인된 앱',
		'account.manager.status.awaitingSystemVerification':
			'시스템 확인을 기다리는 중…',
		'account.manager.status.connected': '계정 동기화 연결됨',
		'account.manager.status.noPasskeys': '패스키 없음',
		'account.manager.status.noSessions': '표시할 세션이 없습니다',
		'account.manager.status.noSsoGrants': '권한을 부여한 앱이 없습니다',
		'account.manager.status.passkeyPrompt':
			'비밀번호가 필요 없습니다. 시스템 안내에 따라 확인하세요',
		'account.manager.status.passkeysUnsupported':
			'현재 환경에서는 패스키를 사용할 수 없습니다',
		'account.manager.status.paused':
			'클라우드 동기화가 일시 중지되었습니다',
		'account.manager.status.readingPasskeys': '패스키 불러오는 중',
		'account.manager.status.readingSessions': '로그인 기기 불러오는 중',
		'account.manager.status.readingSsoGrants':
			'권한을 부여한 앱 불러오는 중',
		'account.manager.syncPendingBeforeLogout':
			'동기화가 아직 완료되지 않았습니다. 동기화를 다시 시도한 뒤 로그아웃하세요',
		'account.manager.termsRequired': '먼저 법적 고지를 읽고 동의해 주세요',
		'account.manager.ui.ariaManage': '계정 관리',
		'account.manager.ui.ariaSignIn': '계정 로그인',
		'account.manager.ui.dataAndSessions': '데이터와 세션',
		'account.manager.ui.dataManagement': '데이터 관리',
		'account.manager.ui.descriptionManage':
			'현재 계정, 동기화 상태, 클라우드 데이터를 관리하세요',
		'account.manager.ui.descriptionSsoSignIn':
			'외부 앱에 권한을 부여하려면 도우미 계정으로 로그인하세요',
		'account.manager.ui.descriptionSyncSignIn':
			'로그인하면 이 브라우저에 저장된 데이터를 여러 기기에서 동기화할 수 있습니다',
		'account.manager.ui.logout': '로그아웃',
		'account.manager.ui.logoutAll': '모든 기기에서 로그아웃',
		'account.manager.ui.passwordSignInDescription':
			'사용자 이름과 비밀번호로 로그인',
		'account.manager.ui.ssoSignInAction': 'SSO 로그인',
		'account.manager.ui.title': '계정',
		'account.nicknameRule':
			'닉네임은 최대 {max}자이며 줄바꿈이나 제어 문자를 포함할 수 없습니다',
		'account.passkeyNameRule':
			'패스키 이름은 최대 {max}자이며 줄바꿈이나 제어 문자를 포함할 수 없습니다',
		'account.passwordRule':
			'비밀번호는 {min}~{max}자이며 공백이 아닌 문자를 최소 1개 포함해야 합니다',
		'account.sessions.summary.browser': '브라우저',
		'account.sessions.summary.direct': '직접 연결',
		'account.sessions.summary.recorded': '기록된 소스',
		'account.sessions.summary.unknownDevice': '알 수 없는 기기',
		'account.sessions.summary.unknownSource': '알 수 없는 소스',
		'account.sso.accountLabel.user': '사용자 이름: {username}',
		'account.sso.accountLabel.userNickname':
			'사용자 이름: {username}, 닉네임: {nickname}',
		'account.sso.agreeAction': '동의하고 계속',
		'account.sso.cancelAction': '취소',
		'account.sso.confirmNotice':
			'{client}가 귀하의 도우미 계정 신원, 사용자 이름, 닉네임을 가져갑니다.',
		'account.sso.confirmSubtitle':
			'확인 후 로그인을 시작한 외부 서비스로 돌아갑니다',
		'account.sso.detail.account': '현재 계정',
		'account.sso.detail.client': '권한 부여 서비스',
		'account.sso.errorFlowSubtitle':
			'현재 권한 부여 흐름을 계속할 수 없습니다',
		'account.sso.loginRequiredNotice':
			'먼저 도우미 계정으로 로그인하세요. 완료되면 이 권한 부여 흐름으로 돌아옵니다.',
		'account.sso.loginRequiredSubtitle':
			'도우미 계정 신원 확인이 필요합니다',
		'account.sso.offlineNotice':
			'오프라인 버전은 계정 권한 부여를 지원하지 않습니다. 온라인 서비스에서 외부 클라이언트로 로그인을 다시 시작하세요.',
		'account.sso.offlineSubtitle':
			'오프라인 버전에서는 계정 권한 부여를 완료할 수 없습니다',
		'account.sso.openAccountFlow': '계정 흐름 열기',
		'account.sso.panelTitle': 'SSO 권한 부여',
		'account.sso.passwordChangeNotice':
			'먼저 대화상자에서 계정 비밀번호를 갱신하세요. 완료되면 권한 부여가 계속됩니다.',
		'account.sso.passwordChangeSubtitle':
			'계정의 보안 업데이트가 필요합니다',
		'account.sso.status.authorizationCancelled':
			'권한 부여가 취소되었습니다.',
		'account.sso.status.authorizationExpired':
			'권한 부여 컨텍스트가 만료되었습니다. 외부 서비스에서 로그인을 다시 시작하세요.',
		'account.sso.status.invalidRequest':
			'권한 요청이 유효하지 않거나 만료되었습니다. 외부 서비스에서 로그인을 다시 시작하세요.',
		'account.sso.status.networkFailed':
			'네트워크 연결에 실패했습니다. 잠시 후 다시 시도하세요.',
		'account.sso.status.rateLimited':
			'시도가 너무 많습니다. 잠시 후 다시 시도하세요.',
		'account.sso.status.rateLimitedWithDelay':
			'시도가 너무 많습니다. {seconds}초 후 다시 시도하세요.',
		'account.sync.collision.canonicalQueue': '호환 대기열 버전',
		'account.sync.collision.legacyQueue': '이전 탭 버전',
		'account.sync.collision.nextClient': '새 클라이언트에서 보관한 버전',
		'account.sync.collision.preMigration': '변환 전 버전',
		'account.sync.conflict.busy': '다른 탭에서 이 충돌을 처리 중입니다',
		'account.sync.conflict.recovering':
			'동기화 상태를 복구하는 중입니다. 잠시 기다려 주세요',
		'account.sync.conflict.stale':
			'충돌 내용이 변경되었습니다. 다시 확인하세요',
		'account.sync.conflict.storageUnavailable':
			'브라우저가 지금 동기화 상태를 저장할 수 없습니다. 기존 데이터는 변경되지 않았습니다',
		'account.sync.conflict.unexpected':
			'충돌 저장에 실패했습니다. 잠시 후 다시 시도하세요',
		'account.sync.conflict.unsupported':
			'현재 페이지 버전에서는 이 동기화 상태를 처리할 수 없습니다. 업데이트 후 다시 시도하세요',
		'account.sync.control.broadcastAvailable': '사용 가능',
		'account.sync.control.broadcastUnavailable': '사용 불가',
		'account.sync.control.collapseDetails': '동기화 상세 접기',
		'account.sync.control.compatibleLock': '브라우저 호환 잠금',
		'account.sync.control.expandDetails': '동기화 상세 펼치기',
		'account.sync.control.mergedUnavailable': '자동 병합 불가',
		'account.sync.control.nativeLock': '브라우저 네이티브',
		'account.sync.control.restore': '이 기기 데이터로 클라우드 동기화 복원',
		'account.sync.control.restoring': '클라우드 동기화 복원 중',
		'account.sync.control.sync': '지금 동기화',
		'account.sync.control.syncing': '동기화 중',
		'account.sync.failedAttempts': '({attempts}회 실패)',
		'account.sync.fallback.rebuildFailed':
			'클라우드 동기화 복원에 실패했습니다. 잠시 후 다시 시도하세요',
		'account.sync.fallback.syncFailed':
			'동기화 오류입니다. 잠시 후 다시 시도하세요',
		'account.sync.isolated.default.detail':
			'페이지를 새로고침해 최신 버전이 로드되었는지 확인하세요. 이 메시지가 계속되면 앱을 업데이트한 뒤 다시 시도하세요.',
		'account.sync.isolated.default.title':
			'동기화 클라이언트 업데이트 필요',
		'account.sync.isolated.quarantineFailed.detail':
			'원본 데이터는 이 브라우저에 남아 있습니다. 로컬 저장 공간을 확보한 뒤 페이지를 새로고침하세요.',
		'account.sync.isolated.quarantineFailed.title':
			'로컬 동기화 데이터를 안전하게 격리할 수 없습니다',
		'account.sync.isolated.resetMarkerInvalid.detail':
			'원본 데이터는 이 브라우저에 남아 있습니다. 보관할 데이터를 내보낸 뒤 명시적인 데이터 정리 작업으로 이 상태를 초기화하세요.',
		'account.sync.isolated.resetMarkerInvalid.title':
			'로컬 동기화 상태 확인 필요',
		'account.sync.isolated.storageUnavailable.detail':
			'기존 데이터는 변경되지 않았습니다. 브라우저가 이 페이지의 데이터 저장을 허용하는지 확인하고 새로고침한 뒤 다시 시도하세요.',
		'account.sync.isolated.storageUnavailable.title':
			'브라우저 저장소를 일시적으로 사용할 수 없습니다',
		'account.sync.namespace.automaticResolution': '조정 중',
		'account.sync.namespace.automaticResolutionPaused': '자동 조정 중',
		'account.sync.namespace.conflict': '충돌 대기',
		'account.sync.namespace.dirty': '업로드 대기',
		'account.sync.namespace.synced': '동기화됨',
		'account.sync.pausedReason.applyingRemote': '클라우드 적용 중',
		'account.sync.pausedReason.bootstrap': '초기화 중',
		'account.sync.pausedReason.cloudPaused': '클라우드 동기화 일시 중지',
		'account.sync.pausedReason.conflict': '충돌 대기',
		'account.sync.pausedReason.deleteData': '데이터 비우는 중',
		'account.sync.pausedReason.importingBackup': '구 백업 가져오는 중',
		'account.sync.readiness.busy': '다른 페이지에서 처리 중',
		'account.sync.readiness.ready': '충돌 대기',
		'account.sync.readiness.recovering': '복구 중',
		'account.sync.readiness.stale': '내용 변경됨',
		'account.sync.readiness.storageUnavailable': '저장소 사용 불가',
		'account.sync.readiness.unsupported': '업데이트 필요',
		'account.sync.status.noPendingData': '동기화 대기 데이터 없음',
		'account.sync.status.noSuccessfulRecord': '성공 기록 없음',
		'account.sync.status.paused': '클라우드 동기화가 일시 중지되었습니다',
		'account.sync.status.pausedEmptyDescription':
			'클라우드에 현재 데이터가 없습니다. 이 기기의 데이터는 로컬에만 저장됩니다.',
		'account.sync.status.sessionQueueFallback':
			'동기화 큐를 현재 탭 간에 영구 저장할 수 없습니다. 이 세션에서 최선을 다해 동기화합니다.',
		'account.sync.status.sessionQueueWarning':
			'현재 저장소는 탭 간 동기화 큐를 영구 저장할 수 없습니다. 페이지를 닫기 전에 동기화 완료를 기다려 주세요.',
		'account.sync.storage.local': '로컬 영구 저장',
		'account.sync.storage.memory': '메모리 대체',
		'account.sync.storage.session': '세션 대체',
		'account.sync.terminal.capacityExceeded': '용량 초과',
		'account.sync.terminal.requestTooLarge': '요청 과대',
		'account.syncUi.attempts': '시도: {count}',
		'account.syncUi.baselineVersion': '기준 버전: ',
		'account.syncUi.changedAt': '변경 시각: ',
		'account.syncUi.cloudVersion': '클라우드 버전: ',
		'account.syncUi.confirmRestore': '복원 확인',
		'account.syncUi.conflicts': '충돌: {count}',
		'account.syncUi.crossTabBroadcast': '탭 간 브로드캐스트',
		'account.syncUi.crossTabLock': '탭 간 잠금',
		'account.syncUi.details': '동기화 상세',
		'account.syncUi.lastSync': '최근 동기화: ',
		'account.syncUi.paused': '일시 중지: ',
		'account.syncUi.pausedTitle': '클라우드 동기화 일시 중지',
		'account.syncUi.pending': '업로드 대기: {count}',
		'account.syncUi.storage': '저장소',
		'account.syncUi.title': '동기화 상태',
		'account.usernameRule':
			'사용자 이름은 {min}~{max}자이며 중국어, 영문, 숫자, 밑줄, 마침표, 하이픈, 이메일 형식을 사용할 수 있습니다',
	},
	'zh-CN': ACCOUNT_MESSAGES_ZH_CN,
	'zh-TW': {
		'account.action.signedOut': '未登入',
		'account.action.unavailable': '帳號不可用',
		'account.action.welcome': '歡迎您',
		'account.client.accountStateRefreshFailed':
			'帳號狀態重新整理失敗，請稍後重試',
		'account.client.logoutFailed': '登出失敗',
		'account.client.operationBusy':
			'帳號資料操作正在其他分頁進行，請稍後重試',
		'account.client.passwordChangeFailed': '改密失敗',
		'account.client.passwordMustChangeAccountPaused':
			'密碼更新前，帳號同步、雲端資料操作和衝突處理會暫時暫停。',
		'account.client.passwordMustChangeAuthorizePaused':
			'密碼更新前無法完成SSO授權，也不會簽發登入票據。',
		'account.client.passwordMustChangeLogoutAccount':
			'如果暫時不處理，可以登出目前帳號；本裝置未完成的同步佇列會留在本地，之後重新登入再繼續。',
		'account.client.passwordMustChangeLogoutAuthorize':
			'如果暫時不處理，可以登出目前帳號返回首頁。',
		'account.conflict.aria.crossTab': '雲端同步衝突待處理',
		'account.conflict.aria.pendingRemote': '雲端同步衝突',
		'account.conflict.aria.sync': '雲端同步衝突',
		'account.conflict.boolean.completedFalse': '未完成',
		'account.conflict.boolean.completedTrue': '已完成',
		'account.conflict.boolean.off': '關閉',
		'account.conflict.boolean.on': '開啟',
		'account.conflict.boolean.popularNegative': '「流行·厭惡」',
		'account.conflict.boolean.popularPositive': '「流行·喜愛」',
		'account.conflict.candidate.keep': '保留此候選',
		'account.conflict.candidate.label': '候選 {number}',
		'account.conflict.candidate.rawData': '候選原始資料',
		'account.conflict.candidatesIntro':
			'選擇前不會上傳任何候選。選擇後，系統會先保存選擇結果，再繼續與雲端版本比較。',
		'account.conflict.candidatesSubtitle':
			'多個分頁同時修改了「{namespace}」。所有候選都已保留，請明確選擇一個版本。',
		'account.conflict.card.empty': '未偵測到可顯示的差異',
		'account.conflict.card.more': '還有更多差異，可在技術詳情中查看',
		'account.conflict.compare.button': '比較兩個版本',
		'account.conflict.compare.note':
			'這裡只展示有差異的內容，選擇後另一份修改會被替換。',
		'account.conflict.confirm.cancel': '取消',
		'account.conflict.confirm.confirm': '確認保留',
		'account.conflict.confirm.title': '確認覆蓋另一份修改？',
		'account.conflict.confirmation.cloud':
			'保留雲端版本後，目前裝置上的{namespace}修改將被替換。',
		'account.conflict.confirmation.local':
			'保留目前裝置版本後，它會上傳到雲端並替換雲端的{namespace}修改。',
		'account.conflict.detail.local': '目前裝置原始資料',
		'account.conflict.detail.merged': '合併後的原始資料',
		'account.conflict.detail.remote': '雲端原始資料',
		'account.conflict.field.activeId': '目前使用的營業預設',
		'account.conflict.field.columns': '表格顯示欄',
		'account.conflict.field.completed': '稀客教學進度',
		'account.conflict.field.darkPalette': '深色主題配色',
		'account.conflict.field.dlcs': '已關閉的資料集',
		'account.conflict.field.enabled': '啟用狀態',
		'account.conflict.field.famousShop': '「明星店」效果',
		'account.conflict.field.guestCardTagsTooltip':
			'顧客卡片中標籤的浮動提示',
		'account.conflict.field.hiddenItems': '啟用或停用的酒水、料理和食材',
		'account.conflict.field.highAppearance': '平滑捲動和磨砂效果',
		'account.conflict.field.items': '已儲存的營業預設',
		'account.conflict.field.lightPalette': '淺色主題配色',
		'account.conflict.field.maxExtraIngredients': '加料上限',
		'account.conflict.field.maxRating': '評級上限',
		'account.conflict.field.maxResults': '推薦結果上限',
		'account.conflict.field.mode': '顏色模式',
		'account.conflict.field.orderLinkedFilter':
			'選擇點單需求的同時篩選表格',
		'account.conflict.field.other': '設定內容',
		'account.conflict.field.popularTrend': '流行趨勢',
		'account.conflict.field.popularTrendIsNegative': '流行趨勢方向',
		'account.conflict.field.popularTrendTag': '流行趨勢標籤',
		'account.conflict.field.row': '表格顯示行數',
		'account.conflict.field.showTagDescription': '顯示料理標籤對應的關鍵詞',
		'account.conflict.field.sortProfile': '「猜您想要」的預設推薦策略',
		'account.conflict.field.suggestMeals': '「猜您想要」推薦',
		'account.conflict.field.suggestMealsMaxExtraIngredients':
			'「猜您想要」的加料上限',
		'account.conflict.field.suggestMealsMaxRating':
			'「猜您想要」的評級上限',
		'account.conflict.field.suggestMealsMaxResults':
			'「猜您想要」的推薦結果上限',
		'account.conflict.field.suggestMealsSortProfile':
			'「猜您想要」的預設推薦策略',
		'account.conflict.field.table': '表格設定',
		'account.conflict.field.tableColumnsBeverage': '酒水表格顯示欄',
		'account.conflict.field.tableColumnsRecipe': '料理表格顯示欄',
		'account.conflict.field.tableHiddenItemsBeverages': '表格中隱藏的酒水',
		'account.conflict.field.tableHiddenItemsIngredients':
			'表格中隱藏的食材',
		'account.conflict.field.tableHiddenItemsRecipes': '表格中隱藏的料理',
		'account.conflict.field.tachie': '顧客頁面右下角的立繪',
		'account.conflict.field.theme': '顏色模式',
		'account.conflict.field.vibrate': '震動回饋',
		'account.conflict.invalidEvidence':
			'另有{count}份無法解析的舊證據仍會保留。',
		'account.conflict.listSeparator': '、',
		'account.conflict.merge.apply': '使用此合併結果',
		'account.conflict.merge.button': '合併雙方的修改',
		'account.conflict.merge.keepNote': '合併後將保留',
		'account.conflict.merge.more': '還有更多合併內容，可在技術詳情中查看',
		'account.conflict.merge.note':
			'系統已經整理出一份合併結果，可同時保留雙方能夠相容的修改。',
		'account.conflict.merge.recommended': '推薦',
		'account.conflict.namespace.customerNormalMeals': '已儲存套餐（普客）',
		'account.conflict.namespace.customerRareMeals': '已儲存套餐（稀客）',
		'account.conflict.namespace.customerRarePlans': '營業預設（稀客）',
		'account.conflict.namespace.customerRareSettings': '偏好設定（稀客）',
		'account.conflict.namespace.globalPreferences': '偏好設定（全域）',
		'account.conflict.namespace.theme': '主題設定',
		'account.conflict.namespace.tutorialCustomerRare': '稀客教學進度',
		'account.conflict.namespaces': '涉及：',
		'account.conflict.pendingRemote.subTitle':
			'衝突內容保存在另一個分頁中。請回到產生衝突的分頁完成處理；解決後此處會自動恢復。',
		'account.conflict.resolution.cloud.button': '保留雲端版本',
		'account.conflict.resolution.cloud.description':
			'來自帳號雲端的資料，將覆蓋目前裝置上的對應修改。',
		'account.conflict.resolution.cloud.title': '雲端版本',
		'account.conflict.resolution.local.button': '保留目前裝置版本',
		'account.conflict.resolution.local.description':
			'目前瀏覽器中尚未同步的資料，將上傳並覆蓋雲端修改。',
		'account.conflict.resolution.local.title': '目前裝置版本',
		'account.conflict.syncPausedNote':
			'這部分資料的同步已暫停。完成選擇前，兩份資料都會保留，不會自動覆蓋。',
		'account.conflict.syncSubtitle':
			'目前裝置和雲端都修改過「{namespace}」，請選擇要保留的內容。',
		'account.conflict.technicalDetails': '查看技術細節',
		'account.conflict.title.crossTab': '跨分頁同步衝突',
		'account.conflict.title.pendingRemote': '雲端同步衝突待處理',
		'account.conflict.title.sync': '雲端同步衝突',
		'account.conflict.unmergeableNote':
			'這兩份修改無法安全地自動合併，請比較下方差異後選擇其中一個版本。',
		'account.conflict.unresolvedCount': '{count}項待處理',
		'account.conflict.value.action': '操作',
		'account.conflict.value.beverage': '酒水',
		'account.conflict.value.cooker': '廚具',
		'account.conflict.value.cookerType': '廚具',
		'account.conflict.value.ingredient': '食材',
		'account.conflict.value.none': '無',
		'account.conflict.value.notSet': '未設定',
		'account.conflict.value.previewMore': '{preview}等{count}項',
		'account.conflict.value.price': '售價',
		'account.conflict.value.recipe': '料理',
		'account.conflict.value.recordCount': '包含{count}項設定',
		'account.conflict.value.suitability': '匹配度',
		'account.conflict.value.time': '烹飪時間',
		'account.conflict.value.unavailable': '無法顯示',
		'account.legacyImport.clearAction': '清空備份碼',
		'account.legacyImport.codeHint':
			'備份碼通常來自舊版雲端備份功能，請完整複製後貼上',
		'account.legacyImport.codeLabel': '舊備份碼',
		'account.legacyImport.codePlaceholder': '貼上舊備份碼',
		'account.legacyImport.description':
			'輸入舊版雲端備份碼並點擊匯入，其中保存的套餐資料將被合併到目前帳號。匯入成功後，該備份碼將自動失效。',
		'account.legacyImport.failed': '匯入失敗，請稍後重試',
		'account.legacyImport.importAction': '匯入到帳號',
		'account.legacyImport.signInAction': '登入或註冊',
		'account.legacyImport.signInRequired':
			'舊備份碼只能匯入到已登入帳號。請先登入或註冊。',
		'account.legacyImport.success': '匯入成功，可繼續匯入下一個舊備份碼',
		'account.manager.accountDeleteFailed': '刪除帳號失敗',
		'account.manager.auth.loginAction': '登入帳號',
		'account.manager.auth.loginTab': '登入',
		'account.manager.auth.nicknamePlaceholder': '設定顯示名稱',
		'account.manager.auth.passkeyContinue': '使用通行密鑰繼續',
		'account.manager.auth.passkeyRegister': '使用通行密鑰註冊新帳號',
		'account.manager.auth.passkeyToggle': '使用通行密鑰註冊/登入',
		'account.manager.auth.passwordEntry': '使用使用者名稱和密碼註冊/登入',
		'account.manager.auth.passwordPlaceholderLogin': '輸入密碼',
		'account.manager.auth.passwordPlaceholderRegister': '設定登入密碼',
		'account.manager.auth.registerAction': '建立帳號',
		'account.manager.auth.registerTab': '註冊',
		'account.manager.auth.sideTitleSso': 'SSO 授權',
		'account.manager.auth.sideTitleSync': '帳號同步',
		'account.manager.auth.ssoDescription1':
			'登入後，您可以授權外部應用程式取得您的小助手帳號身分。',
		'account.manager.auth.ssoDescription2':
			'註冊後會自動登入；登入後即可在授權頁面完成確認。',
		'account.manager.auth.syncDescription1':
			'帳號會同步此瀏覽器儲存的資料，讓其他裝置繼續使用相同設定。',
		'account.manager.auth.syncDescription2':
			'註冊後會自動登入；登入後，本裝置尚未上傳的變更會自動繼續同步。',
		'account.manager.auth.termsLink': '法律聲明',
		'account.manager.auth.termsPrefix': '我已閱讀並同意',
		'account.manager.auth.usernamePlaceholder': '輸入帳號使用者名稱',
		'account.manager.authenticationCredentialsRequired':
			'請輸入使用者名稱和密碼',
		'account.manager.authenticationFailed': '認證失敗',
		'account.manager.bootstrapFailed':
			'帳號服務初始化失敗，請重新整理頁面重試',
		'account.manager.bootstrapServerMisconfigured': '伺服器設定異常',
		'account.manager.bootstrapUnavailable': '帳號功能暫不可用：{message}',
		'account.manager.cloudDataChangedReconfirm':
			'雲端資料已發生變化，請重新確認後再清空',
		'account.manager.cloudDataChangedRefreshing':
			'雲端資料已發生變化，正在重新整理帳號狀態…',
		'account.manager.cloudDataCleared': '雲端資料已清空',
		'account.manager.cloudDataClearFailed': '清空雲端資料失敗',
		'account.manager.confirm.cancel': '取消',
		'account.manager.danger.clearData': '清空雲端資料',
		'account.manager.danger.clearDataCleared': '雲端資料已清空',
		'account.manager.danger.clearDataConfirm': '確認清空',
		'account.manager.danger.deleteAccount': '刪除帳號',
		'account.manager.danger.deleteAccountConfirm': '確認刪除',
		'account.manager.danger.warning':
			'危險操作會影響雲端資料或帳號本身，請先透過資料管理匯出需要保留的資料。',
		'account.manager.field.currentPassword': '目前密碼',
		'account.manager.field.displayName': '顯示名稱',
		'account.manager.field.loginPassword': '登入密碼',
		'account.manager.field.newPassword': '新密碼',
		'account.manager.field.nickname': '暱稱',
		'account.manager.field.nicknameOptional': '暱稱（選填）',
		'account.manager.field.passkey': '通行密鑰',
		'account.manager.field.password': '密碼',
		'account.manager.field.username': '使用者名稱',
		'account.manager.loginSuccess': '登入成功',
		'account.manager.loginSupport.invalidCredentials':
			'使用者名稱或密碼不正確。如需協助，請',
		'account.manager.loginSupport.userDeleted': '帳號已刪除。如需恢復，請',
		'account.manager.loginSupport.userDisabled': '帳號已停用。如需啟用，請',
		'account.manager.loginSupportLink': '聯絡管理員',
		'account.manager.logoutSyncFailed': '登出前同步失敗',
		'account.manager.mobile.subtitle': '資料同步和帳號安全',
		'account.manager.passkeyAdded': '通行密鑰已新增',
		'account.manager.passkeyAddFailed': '新增通行密鑰失敗',
		'account.manager.passkeyDeleted': '通行密鑰已刪除',
		'account.manager.passkeyDeleteFailed': '刪除通行密鑰失敗',
		'account.manager.passkeyRefreshFailed': '重新整理通行密鑰失敗',
		'account.manager.passkeyRenamed': '通行密鑰已重新命名',
		'account.manager.passkeyRenameFailed': '重新命名通行密鑰失敗',
		'account.manager.passkeys.add': '新增',
		'account.manager.passkeys.addedAt': '新增於',
		'account.manager.passkeys.cancelRename': '取消重新命名',
		'account.manager.passkeys.confirmAdd': '確認新增',
		'account.manager.passkeys.confirmDelete': '確認刪除',
		'account.manager.passkeys.delete': '刪除通行密鑰',
		'account.manager.passkeys.lastUsed': '最近使用：',
		'account.manager.passkeys.nameExample': '例如：我的手機、YubiKey',
		'account.manager.passkeys.nameOptional': '通行密鑰名稱（選填）',
		'account.manager.passkeys.neverUsed': '從未使用',
		'account.manager.passkeys.rename': '重新命名',
		'account.manager.passkeys.renameAria': '重新命名通行密鑰',
		'account.manager.passkeys.saveName': '儲存名稱',
		'account.manager.passwordChange.aria': '更新帳號密碼',
		'account.manager.passwordChange.badge': '需要更新密碼後繼續使用',
		'account.manager.passwordChange.currentAccount': '目前帳號',
		'account.manager.passwordChange.currentPasswordLabel': '目前臨時密碼',
		'account.manager.passwordChange.currentPasswordPlaceholder':
			'輸入管理員提供或剛登入使用的密碼',
		'account.manager.passwordChange.newPasswordPlaceholder':
			'輸入之後要長期使用的新密碼',
		'account.manager.passwordChange.restrictedTitle': '受限狀態',
		'account.manager.passwordChange.restrictedTitleSso': 'SSO 受限狀態',
		'account.manager.passwordChange.setupTitle': '設定新密碼',
		'account.manager.passwordChange.subtitleAccount':
			'管理員已重設此帳號的登入憑證。完成密碼更新後，帳號同步和資料操作會恢復可用。',
		'account.manager.passwordChange.subtitleSso':
			'管理員已重設此帳號的登入憑證。請更新密碼後繼續授權給外部應用程式。',
		'account.manager.passwordChange.switchAccount': '切換帳號',
		'account.manager.passwordChange.titleSso': 'SSO 授權 - 更新帳號密碼',
		'account.manager.passwordChange.updateAndContinue': '更新密碼後繼續',
		'account.manager.passwordChange.usernameAria': '帳號使用者名稱',
		'account.manager.passwordSet': '登入密碼已設定',
		'account.manager.passwordUpdated': '密碼已更新',
		'account.manager.profile.changePassword': '修改密碼',
		'account.manager.profile.currentPasswordPlaceholder': '輸入目前密碼',
		'account.manager.profile.currentPasswordRequired':
			'修改使用者名稱需要確認目前密碼',
		'account.manager.profile.initialPasswordHint':
			'設定登入密碼後，可在不支援通行密鑰的裝置上使用使用者名稱密碼登入。',
		'account.manager.profile.newPasswordPlaceholder': '輸入新密碼',
		'account.manager.profile.passwordMustChangeNotice':
			'管理員已要求更新密碼，完成後才能繼續同步。',
		'account.manager.profile.save': '儲存資料',
		'account.manager.profile.titleAccountSettings': '帳號設定',
		'account.manager.profile.titleSetupPassword': '設定登入密碼',
		'account.manager.profile.titleUpdatePassword': '更新密碼',
		'account.manager.profile.updatePasswordAndContinue': '更新密碼後繼續',
		'account.manager.profile.usernameChangeHint':
			'請先設定登入密碼後再修改使用者名稱；暱稱可直接修改',
		'account.manager.profile.usernameDisplay': '使用者名稱：',
		'account.manager.profile.usernamePlaceholder': '輸入新使用者名稱',
		'account.manager.profileUpdated': '資料已更新',
		'account.manager.profileUpdateFailed': '資料修改失敗',
		'account.manager.registrationFailed': '註冊失敗',
		'account.manager.registrationSuccess': '註冊成功',
		'account.manager.sessionRefreshFailed': '登入裝置重新整理失敗',
		'account.manager.sessionRevoked': '已登出登入裝置',
		'account.manager.sessionRevokeFailed': '登入裝置撤銷失敗',
		'account.manager.sessions.confirmRevoke': '確認登出',
		'account.manager.sessions.createdAt': '建立於',
		'account.manager.sessions.current': '目前工作階段',
		'account.manager.sessions.lastActive': '最近活動：',
		'account.manager.sessions.other': '其他工作階段',
		'account.manager.sessions.refresh': '重新整理工作階段',
		'account.manager.sessions.revoke': '登出裝置',
		'account.manager.sessions.source': '來源：',
		'account.manager.sessions.thisDevice': '本裝置',
		'account.manager.sessions.title': '登入裝置',
		'account.manager.ssoGrantRefreshFailed': '已授權應用程式重新整理失敗',
		'account.manager.ssoGrantRevoked': '已撤銷授權',
		'account.manager.ssoGrantRevokeFailed': '撤銷授權失敗',
		'account.manager.ssoGrants.confirmRevoke': '確認撤銷',
		'account.manager.ssoGrants.refresh': '重新整理授權',
		'account.manager.ssoGrants.revoke': '撤銷授權',
		'account.manager.ssoGrants.title': '已授權應用程式',
		'account.manager.status.awaitingSystemVerification':
			'正在等待系統驗證…',
		'account.manager.status.connected': '帳號同步已連線',
		'account.manager.status.noPasskeys': '暫無通行密鑰',
		'account.manager.status.noSessions': '暫無可見工作階段',
		'account.manager.status.noSsoGrants': '暫無已授權應用程式',
		'account.manager.status.passkeyPrompt':
			'無需輸入密碼，依系統提示確認即可',
		'account.manager.status.passkeysUnsupported': '目前環境不支援通行密鑰',
		'account.manager.status.paused': '雲端同步已暫停',
		'account.manager.status.readingPasskeys': '正在讀取通行密鑰',
		'account.manager.status.readingSessions': '正在讀取登入裝置',
		'account.manager.status.readingSsoGrants': '正在讀取已授權應用程式',
		'account.manager.syncPendingBeforeLogout':
			'同步尚未完成，請先重試同步後再登出',
		'account.manager.termsRequired': '請先閱讀並同意法律聲明',
		'account.manager.ui.ariaManage': '帳號管理',
		'account.manager.ui.ariaSignIn': '帳號登入',
		'account.manager.ui.dataAndSessions': '資料與工作階段',
		'account.manager.ui.dataManagement': '資料管理',
		'account.manager.ui.descriptionManage':
			'管理目前帳號、同步狀態和雲端資料',
		'account.manager.ui.descriptionSsoSignIn':
			'登入小助手帳號以授權給外部應用程式',
		'account.manager.ui.descriptionSyncSignIn':
			'登入後可在不同裝置間同步此瀏覽器保存的資料',
		'account.manager.ui.logout': '登出',
		'account.manager.ui.logoutAll': '登出全部裝置',
		'account.manager.ui.passwordSignInDescription': '使用帳號密碼登入',
		'account.manager.ui.ssoSignInAction': 'SSO登入',
		'account.manager.ui.title': '帳號',
		'account.nicknameRule': '暱稱最多{max}個字元，不能包含換行或控制字元',
		'account.passkeyNameRule':
			'通行密鑰名稱最多{max}個字元，不能包含換行或控制字元',
		'account.passwordRule':
			'密碼長度{min}-{max}位，且至少包含一個非空白字元',
		'account.sessions.summary.browser': '瀏覽器',
		'account.sessions.summary.direct': '直接連線',
		'account.sessions.summary.recorded': '已記錄來源',
		'account.sessions.summary.unknownDevice': '未知裝置',
		'account.sessions.summary.unknownSource': '未知來源',
		'account.sso.accountLabel.user': '使用者名稱：{username}',
		'account.sso.accountLabel.userNickname':
			'使用者名稱：{username}，暱稱：{nickname}',
		'account.sso.agreeAction': '同意並繼續',
		'account.sso.cancelAction': '取消',
		'account.sso.confirmNotice':
			'{client}將取得您的小助手帳號身分、使用者名稱和暱稱。',
		'account.sso.confirmSubtitle': '確認後將返回發起登入的外部服務',
		'account.sso.detail.account': '目前帳號',
		'account.sso.detail.client': '授權服務',
		'account.sso.errorFlowSubtitle': '無法繼續目前授權流程',
		'account.sso.loginRequiredNotice':
			'請先登入小助手帳號，登入完成後會回到目前授權流程。',
		'account.sso.loginRequiredSubtitle': '需要確認您的小助手帳號身分',
		'account.sso.offlineNotice':
			'離線版本不支援帳號授權。請使用線上服務從外部客戶端重新發起登入。',
		'account.sso.offlineSubtitle': '離線版本無法完成帳號授權',
		'account.sso.openAccountFlow': '開啟帳號流程',
		'account.sso.panelTitle': 'SSO授權',
		'account.sso.passwordChangeNotice':
			'請先在彈窗中更新帳號密碼，完成後會繼續授權。',
		'account.sso.passwordChangeSubtitle': '帳號需要先完成安全更新',
		'account.sso.status.authorizationCancelled': '授權已取消。',
		'account.sso.status.authorizationExpired':
			'授權情境已過期，請從外部服務重新發起登入。',
		'account.sso.status.invalidRequest':
			'授權請求無效或已失效，請從外部服務重新發起登入。',
		'account.sso.status.networkFailed': '網路連線失敗，請稍後重試。',
		'account.sso.status.rateLimited': '操作過於頻繁，請稍後再試。',
		'account.sso.status.rateLimitedWithDelay':
			'操作過於頻繁，請{seconds}秒後再試。',
		'account.sync.collision.canonicalQueue': '相容佇列版本',
		'account.sync.collision.legacyQueue': '舊分頁版本',
		'account.sync.collision.nextClient': '新用戶端保留版本',
		'account.sync.collision.preMigration': '轉換前版本',
		'account.sync.conflict.busy': '另一個分頁正在處理該衝突',
		'account.sync.conflict.recovering': '正在恢復同步狀態，請稍候',
		'account.sync.conflict.stale': '衝突內容已更新，請重新確認',
		'account.sync.conflict.storageUnavailable':
			'瀏覽器暫時無法儲存同步狀態，現有資料未被修改',
		'account.sync.conflict.unexpected': '衝突儲存失敗，請稍後重試',
		'account.sync.conflict.unsupported':
			'目前頁面版本無法處理這份同步狀態，請更新後重試',
		'account.sync.control.broadcastAvailable': '可用',
		'account.sync.control.broadcastUnavailable': '不可用',
		'account.sync.control.collapseDetails': '收合同步詳情',
		'account.sync.control.compatibleLock': '瀏覽器相容鎖',
		'account.sync.control.expandDetails': '展開同步詳情',
		'account.sync.control.mergedUnavailable': '無法自動合併',
		'account.sync.control.nativeLock': '瀏覽器原生',
		'account.sync.control.restore': '用本裝置資料恢復雲端同步',
		'account.sync.control.restoring': '正在恢復雲端同步',
		'account.sync.control.sync': '立即同步',
		'account.sync.control.syncing': '正在同步',
		'account.sync.failedAttempts': '（已失敗{attempts}次）',
		'account.sync.fallback.rebuildFailed': '恢復雲端同步失敗，請稍後重試',
		'account.sync.fallback.syncFailed': '同步異常，請稍後重試',
		'account.sync.isolated.default.detail':
			'請重新整理頁面確認已載入最新版本；若仍然出現此提示，請更新應用程式後重試。',
		'account.sync.isolated.default.title': '需要更新同步客戶端',
		'account.sync.isolated.quarantineFailed.detail':
			'原始資料仍保留在目前瀏覽器中。請釋放本地儲存空間後重新整理頁面重試。',
		'account.sync.isolated.quarantineFailed.title':
			'本地同步資料無法安全隔離',
		'account.sync.isolated.resetMarkerInvalid.detail':
			'原始資料仍保留在目前瀏覽器中。請先匯出需要保留的資料，再透過明確的資料清理操作重設此狀態。',
		'account.sync.isolated.resetMarkerInvalid.title':
			'本地同步狀態需要處理',
		'account.sync.isolated.storageUnavailable.detail':
			'現有資料未被修改。請確認瀏覽器允許本頁面儲存資料後重新整理重試。',
		'account.sync.isolated.storageUnavailable.title':
			'瀏覽器儲存空間暫不可用',
		'account.sync.namespace.automaticResolution': '正在協調',
		'account.sync.namespace.automaticResolutionPaused': '自動協調中',
		'account.sync.namespace.conflict': '衝突待處理',
		'account.sync.namespace.dirty': '待上傳',
		'account.sync.namespace.synced': '已同步',
		'account.sync.pausedReason.applyingRemote': '套用雲端中',
		'account.sync.pausedReason.bootstrap': '初始化中',
		'account.sync.pausedReason.cloudPaused': '雲端同步已暫停',
		'account.sync.pausedReason.conflict': '衝突待處理',
		'account.sync.pausedReason.deleteData': '清空資料中',
		'account.sync.pausedReason.importingBackup': '匯入舊備份中',
		'account.sync.readiness.busy': '其他頁面處理中',
		'account.sync.readiness.ready': '衝突待處理',
		'account.sync.readiness.recovering': '正在恢復',
		'account.sync.readiness.stale': '內容已更新',
		'account.sync.readiness.storageUnavailable': '儲存不可用',
		'account.sync.readiness.unsupported': '需要更新',
		'account.sync.status.noPendingData': '暫無待同步資料',
		'account.sync.status.noSuccessfulRecord': '暫無成功記錄',
		'account.sync.status.paused': '雲端同步已暫停',
		'account.sync.status.pausedEmptyDescription':
			'雲端目前沒有資料，本裝置的資料僅保存在本地。',
		'account.sync.status.sessionQueueFallback':
			'同步佇列目前無法跨分頁持久化，將僅在本工作階段內盡力同步。',
		'account.sync.status.sessionQueueWarning':
			'目前儲存無法持久跨分頁同步佇列，關閉頁面前請等待同步完成。',
		'account.sync.storage.local': '本地持久化',
		'account.sync.storage.memory': '記憶體備援',
		'account.sync.storage.session': '工作階段備援',
		'account.sync.terminal.capacityExceeded': '容量超限',
		'account.sync.terminal.requestTooLarge': '請求過大',
		'account.syncUi.attempts': '嘗試：{count}',
		'account.syncUi.baselineVersion': '基線版本：',
		'account.syncUi.changedAt': '變更時間：',
		'account.syncUi.cloudVersion': '雲端版本：',
		'account.syncUi.confirmRestore': '確認恢復',
		'account.syncUi.conflicts': '衝突：{count}',
		'account.syncUi.crossTabBroadcast': '跨分頁廣播',
		'account.syncUi.crossTabLock': '跨分頁互斥',
		'account.syncUi.details': '同步詳情',
		'account.syncUi.lastSync': '最近同步：',
		'account.syncUi.paused': '暫停：',
		'account.syncUi.pausedTitle': '雲端同步已暫停',
		'account.syncUi.pending': '待上傳：{count}',
		'account.syncUi.storage': '儲存',
		'account.syncUi.title': '同步狀態',
		'account.usernameRule':
			'使用者名稱{min}-{max}位，可使用中文、英文字母、數字、底線、點、連字號和電子郵件形式',
	},
} as const satisfies TLocalizedMessageTable<TAccountMessageKey>;
