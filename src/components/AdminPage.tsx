import { type FormEvent, useEffect, useMemo, useState } from 'react'
import {
  ApiError,
  clearAllAdminShots,
  clearAuthToken,
  createAdminUser,
  deleteAdminUser,
  fetchAdminStats,
  fetchAdminUsers,
  fetchCurrentUser,
  hasAuthToken,
  loginUser,
  updateAdminUserRole,
  type AdminStats,
  type AdminUser,
  type AdminUserList,
  type AdminUserRole,
} from '../lib/api'
import styles from './AdminPage.module.css'
import type { UserProfile } from './types'

const USERS_LIMIT = 20
const CLEAR_CONFIRMATION = 'DELETE_ALL_PHOTOS'

type AuthState = 'checking' | 'guest' | 'forbidden' | 'admin'
type RoleFilter = AdminUserRole | 'all'
type CreateUserForm = {
  displayName: string
  email: string
  password: string
  role: AdminUserRole
}

const EMPTY_CREATE_FORM: CreateUserForm = {
  displayName: '',
  email: '',
  password: '',
  role: 'admin',
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

function roleLabel(role: AdminUserRole): string {
  return role === 'admin' ? 'Админ' : 'Участник'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} Б`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} КБ`
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export default function AdminPage() {
  const [authState, setAuthState] = useState<AuthState>('checking')
  const [viewer, setViewer] = useState<UserProfile | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [usersList, setUsersList] = useState<AdminUserList>({
    items: [],
    total: 0,
    limit: USERS_LIMIT,
    offset: 0,
  })
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [offset, setOffset] = useState(0)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)

  const [createForm, setCreateForm] = useState<CreateUserForm>(EMPTY_CREATE_FORM)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [busyUserId, setBusyUserId] = useState<number | null>(null)
  const [deleteShotsByUser, setDeleteShotsByUser] = useState<Record<number, boolean>>({})
  const [clearPhrase, setClearPhrase] = useState('')
  const [isClearingShots, setIsClearingShots] = useState(false)

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(usersList.total / USERS_LIMIT)),
    [usersList.total],
  )
  const currentPage = Math.floor(offset / USERS_LIMIT) + 1
  const canGoBack = offset > 0
  const canGoForward = offset + USERS_LIMIT < usersList.total
  const canClearShots = clearPhrase === CLEAR_CONFIRMATION && !isClearingShots

  useEffect(() => {
    if (!hasAuthToken()) {
      setAuthState('guest')
      return
    }

    const controller = new AbortController()

    fetchCurrentUser(controller.signal)
      .then((profile) => {
        setViewer(profile)
        setAuthState(profile.role === 'admin' ? 'admin' : 'forbidden')
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          clearAuthToken()
          setAuthState('guest')
        }
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (authState !== 'admin') {
      return
    }

    const controller = new AbortController()
    setIsLoadingStats(true)

    fetchAdminStats(controller.signal)
      .then((nextStats) => {
        setStats(nextStats)
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setActionError(getErrorMessage(error, 'Не удалось загрузить сводку.'))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingStats(false)
        }
      })

    return () => controller.abort()
  }, [authState, revision])

  useEffect(() => {
    if (authState !== 'admin') {
      return
    }

    const controller = new AbortController()
    setIsLoadingUsers(true)

    fetchAdminUsers({
      search,
      role: roleFilter,
      limit: USERS_LIMIT,
      offset,
      signal: controller.signal,
    })
      .then((nextUsers) => {
        setUsersList(nextUsers)
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setActionError(getErrorMessage(error, 'Не удалось загрузить пользователей.'))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingUsers(false)
        }
      })

    return () => controller.abort()
  }, [authState, offset, revision, roleFilter, search])

  const refreshAdminData = () => {
    setRevision((prev) => prev + 1)
  }

  const signOut = () => {
    clearAuthToken()
    setViewer(null)
    setAuthState('guest')
  }

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoginError(null)
    setIsLoggingIn(true)

    try {
      const profile = await loginUser(loginEmail, loginPassword)
      setViewer(profile)
      setAuthState(profile.role === 'admin' ? 'admin' : 'forbidden')
      setLoginPassword('')
    } catch (error) {
      setLoginError(getErrorMessage(error, 'Не удалось войти.'))
    } finally {
      setIsLoggingIn(false)
    }
  }

  const updateCreateForm = <Field extends keyof CreateUserForm>(
    field: Field,
    value: CreateUserForm[Field],
  ) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }))
  }

  const submitCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setActionError(null)
    setNotice(null)
    setIsCreatingUser(true)

    try {
      const createdUser = await createAdminUser({
        displayName: createForm.displayName.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
      })
      setCreateForm(EMPTY_CREATE_FORM)
      setNotice(`Пользователь ${createdUser.displayName} создан.`)
      setOffset(0)
      refreshAdminData()
    } catch (error) {
      setActionError(getErrorMessage(error, 'Не удалось создать пользователя.'))
    } finally {
      setIsCreatingUser(false)
    }
  }

  const toggleUserRole = async (user: AdminUser) => {
    const nextRole: AdminUserRole = user.role === 'admin' ? 'member' : 'admin'
    setBusyUserId(user.id)
    setActionError(null)
    setNotice(null)

    try {
      const updatedUser = await updateAdminUserRole(user.id, nextRole)
      setNotice(`${updatedUser.displayName}: роль ${roleLabel(updatedUser.role).toLowerCase()}.`)
      refreshAdminData()
    } catch (error) {
      setActionError(getErrorMessage(error, 'Не удалось изменить роль.'))
    } finally {
      setBusyUserId(null)
    }
  }

  const toggleDeleteShots = (userId: number, checked: boolean) => {
    setDeleteShotsByUser((prev) => ({ ...prev, [userId]: checked }))
  }

  const removeUser = async (user: AdminUser) => {
    const deleteShots = deleteShotsByUser[user.id] ?? false
    const suffix = deleteShots ? ' Аккаунт и все его фото будут удалены.' : ' Фото останутся без владельца.'

    if (!window.confirm(`Удалить пользователя ${user.displayName}?${suffix}`)) {
      return
    }

    setBusyUserId(user.id)
    setActionError(null)
    setNotice(null)

    try {
      const result = await deleteAdminUser(user.id, deleteShots)
      setNotice(`Пользователь удалён. Удалено фото: ${result.deletedShotsCount}.`)
      refreshAdminData()
    } catch (error) {
      setActionError(getErrorMessage(error, 'Не удалось удалить пользователя.'))
    } finally {
      setBusyUserId(null)
    }
  }

  const clearShots = async () => {
    if (!canClearShots || !window.confirm('Удалить все фото из базы? Это действие нельзя отменить.')) {
      return
    }

    setIsClearingShots(true)
    setActionError(null)
    setNotice(null)

    try {
      const result = await clearAllAdminShots()
      setClearPhrase('')
      setNotice(`База фото очищена. Удалено записей: ${result.deletedCount}.`)
      setOffset(0)
      refreshAdminData()
    } catch (error) {
      setActionError(getErrorMessage(error, 'Не удалось очистить фото.'))
    } finally {
      setIsClearingShots(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setOffset(0)
  }

  const handleRoleFilterChange = (value: RoleFilter) => {
    setRoleFilter(value)
    setOffset(0)
  }

  if (authState === 'checking') {
    return (
      <main className={styles.adminShell}>
        <section className={styles.centerPanel}>
          <p className={styles.panelLabel}>Astro Base</p>
          <h1>Проверяем доступ...</h1>
        </section>
      </main>
    )
  }

  if (authState === 'guest') {
    return (
      <main className={styles.adminShell}>
        <section className={styles.loginPanel}>
          <p className={styles.panelLabel}>Astro Base</p>
          <h1>Админ-панель</h1>
          {loginError && <p className={styles.errorMessage}>{loginError}</p>}
          <form className={styles.loginForm} onSubmit={submitLogin}>
            <label className={styles.field}>
              <span>Email</span>
              <input
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label className={styles.field}>
              <span>Пароль</span>
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <button className={styles.primaryButton} type="submit" disabled={isLoggingIn}>
              {isLoggingIn ? 'Входим...' : 'Войти'}
            </button>
          </form>
          <a className={styles.secondaryLink} href="/">
            Вернуться к ленте
          </a>
        </section>
      </main>
    )
  }

  if (authState === 'forbidden') {
    return (
      <main className={styles.adminShell}>
        <section className={styles.centerPanel}>
          <p className={styles.panelLabel}>Доступ закрыт</p>
          <h1>{viewer?.displayName ?? 'Пользователь'} не администратор</h1>
          <div className={styles.inlineActions}>
            <a className={styles.secondaryLink} href="/">
              Лента
            </a>
            <button className={styles.secondaryButton} type="button" onClick={signOut}>
              Выйти
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={styles.adminShell}>
      <header className={styles.adminTopBar}>
        <div>
          <p className={styles.panelLabel}>Astro Base</p>
          <h1>Админ-панель</h1>
        </div>
        <div className={styles.adminAccount}>
          <span>{viewer?.displayName}</span>
          <a className={styles.secondaryLink} href="/">
            Лента
          </a>
          <button className={styles.secondaryButton} type="button" onClick={signOut}>
            Выйти
          </button>
        </div>
      </header>

      <section className={styles.metricsGrid} aria-label="Сводка">
        <div className={styles.metric}>
          <span>Пользователи</span>
          <strong>{stats?.usersCount ?? (isLoadingStats ? '...' : 0)}</strong>
        </div>
        <div className={styles.metric}>
          <span>Админы</span>
          <strong>{stats?.adminsCount ?? (isLoadingStats ? '...' : 0)}</strong>
        </div>
        <div className={styles.metric}>
          <span>Фото</span>
          <strong>{stats?.shotsCount ?? (isLoadingStats ? '...' : 0)}</strong>
        </div>
        <div className={styles.metric}>
          <span>Бинарные фото</span>
          <strong>{stats ? formatBytes(stats.imageBytes) : isLoadingStats ? '...' : '0 Б'}</strong>
        </div>
      </section>

      {(notice || actionError) && (
        <section className={styles.feedbackStrip}>
          {notice && <p className={styles.noticeMessage}>{notice}</p>}
          {actionError && <p className={styles.errorMessage}>{actionError}</p>}
        </section>
      )}

      <div className={styles.adminLayout}>
        <section className={styles.usersPanel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelLabel}>Пользователи</p>
              <h2>Аккаунты и роли</h2>
            </div>
            <div className={styles.filtersRow}>
              <input
                className={styles.searchInput}
                type="search"
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Имя, username или email"
              />
              <select
                className={styles.selectInput}
                value={roleFilter}
                onChange={(event) => handleRoleFilterChange(event.target.value as RoleFilter)}
              >
                <option value="all">Все роли</option>
                <option value="admin">Админы</option>
                <option value="member">Участники</option>
              </select>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.usersTable}>
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Роль</th>
                  <th>Фото</th>
                  <th>Дата</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {usersList.items.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.displayName}</strong>
                      <span>@{user.username}</span>
                      <span>{user.email}</span>
                    </td>
                    <td>
                      <span className={`${styles.roleBadge} ${user.role === 'admin' ? styles.roleBadgeAdmin : ''}`}>
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td>{user.shotsCount}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          className={styles.secondaryButton}
                          type="button"
                          onClick={() => toggleUserRole(user)}
                          disabled={busyUserId === user.id}
                        >
                          {user.role === 'admin' ? 'Снять админа' : 'Сделать админом'}
                        </button>
                        <label className={styles.inlineCheck}>
                          <input
                            type="checkbox"
                            checked={deleteShotsByUser[user.id] ?? false}
                            onChange={(event) => toggleDeleteShots(user.id, event.target.checked)}
                          />
                          <span>с фото</span>
                        </label>
                        <button
                          className={styles.dangerButton}
                          type="button"
                          onClick={() => removeUser(user)}
                          disabled={busyUserId === user.id}
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {usersList.items.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <p className={styles.emptyState}>
                        {isLoadingUsers ? 'Загружаем пользователей...' : 'Пользователи не найдены.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <footer className={styles.paginationBar}>
            <span>
              Страница {currentPage} из {totalPages}
            </span>
            <div className={styles.inlineActions}>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => setOffset((prev) => Math.max(0, prev - USERS_LIMIT))}
                disabled={!canGoBack || isLoadingUsers}
              >
                Назад
              </button>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => setOffset((prev) => prev + USERS_LIMIT)}
                disabled={!canGoForward || isLoadingUsers}
              >
                Вперёд
              </button>
            </div>
          </footer>
        </section>

        <aside className={styles.sidePanel}>
          <section className={styles.actionPanel}>
            <p className={styles.panelLabel}>Новый пользователь</p>
            <h2>Создать аккаунт</h2>
            <form className={styles.sideForm} onSubmit={submitCreateUser}>
              <label className={styles.field}>
                <span>Имя</span>
                <input
                  type="text"
                  value={createForm.displayName}
                  onChange={(event) => updateCreateForm('displayName', event.target.value)}
                  required
                />
              </label>
              <label className={styles.field}>
                <span>Email</span>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(event) => updateCreateForm('email', event.target.value)}
                  required
                />
              </label>
              <label className={styles.field}>
                <span>Пароль</span>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(event) => updateCreateForm('password', event.target.value)}
                  minLength={8}
                  required
                />
              </label>
              <label className={styles.field}>
                <span>Роль</span>
                <select
                  value={createForm.role}
                  onChange={(event) => updateCreateForm('role', event.target.value as AdminUserRole)}
                >
                  <option value="admin">Админ</option>
                  <option value="member">Участник</option>
                </select>
              </label>
              <button className={styles.primaryButton} type="submit" disabled={isCreatingUser}>
                {isCreatingUser ? 'Создаём...' : 'Создать'}
              </button>
            </form>
          </section>

          <section className={styles.dangerPanel}>
            <p className={styles.panelLabel}>Фото / БД</p>
            <h2>Очистка фото</h2>
            <div className={styles.dangerStats}>
              <span>Записей: {stats?.shotsCount ?? 0}</span>
              <span>Размер: {stats ? formatBytes(stats.imageBytes) : '0 Б'}</span>
            </div>
            <label className={styles.field}>
              <span>Подтверждение</span>
              <input
                type="text"
                value={clearPhrase}
                onChange={(event) => setClearPhrase(event.target.value)}
                placeholder={CLEAR_CONFIRMATION}
              />
            </label>
            <button className={styles.dangerButton} type="button" onClick={clearShots} disabled={!canClearShots}>
              {isClearingShots ? 'Очищаем...' : 'Очистить все фото'}
            </button>
          </section>
        </aside>
      </div>
    </main>
  )
}
