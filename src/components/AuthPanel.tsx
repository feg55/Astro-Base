import { type FormEvent, useEffect, useState } from 'react'
import styles from './AstroBase.module.css'
import type { UserProfile } from './types'

type AuthMode = 'login' | 'register'

const STORAGE_KEY = 'astro-base-profile'

const GUEST_PROFILE: UserProfile = {
  displayName: 'Гость',
  username: 'guest',
  email: '',
  shotsCount: 0,
  reputation: 0,
  role: 'guest',
}

function createUsername(displayName: string, email: string): string {
  const source = displayName || email.split('@')[0] || 'astro'
  const username = source
    .trim()
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')

  return username || 'astro'
}

function saveProfile(profile: UserProfile): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

function normalizeProfile(value: Partial<UserProfile> | null): UserProfile {
  if (!value) {
    return GUEST_PROFILE
  }

  const displayName = value.displayName?.trim() || GUEST_PROFILE.displayName
  const email = value.email?.trim() ?? ''

  return {
    displayName,
    username: value.username?.trim() || createUsername(displayName, email),
    email,
    shotsCount: Number.isFinite(value.shotsCount) ? value.shotsCount ?? 0 : 0,
    reputation: Number.isFinite(value.reputation) ? value.reputation ?? 0 : 0,
    role: value.role === 'member' ? 'member' : 'guest',
  }
}

function getInitialProfile(): UserProfile {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const profile = normalizeProfile(stored ? JSON.parse(stored) as Partial<UserProfile> : null)
    saveProfile(profile)
    return profile
  } catch {
    saveProfile(GUEST_PROFILE)
    return GUEST_PROFILE
  }
}

export function AuthPanel() {
  const [profile, setProfile] = useState<UserProfile>(() => getInitialProfile())
  const [mode, setMode] = useState<AuthMode>('login')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const isGuest = profile.role === 'guest'
  const isRegister = mode === 'register'

  useEffect(() => {
    if (!isModalOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

  const openModal = (nextMode: AuthMode) => {
    setMode(nextMode)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setPassword('')
  }

  const submitAuth = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextDisplayName = isRegister
      ? displayName.trim() || email.split('@')[0] || 'Пользователь'
      : email.split('@')[0] || 'Пользователь'

    const nextProfile: UserProfile = {
      displayName: nextDisplayName,
      username: createUsername(nextDisplayName, email),
      email: email.trim(),
      shotsCount: isRegister ? 0 : Math.max(profile.shotsCount, 12),
      reputation: isRegister ? 0 : Math.max(profile.reputation, 840),
      role: 'member',
    }

    setProfile(nextProfile)
    saveProfile(nextProfile)
    closeModal()
  }

  const signOut = () => {
    setProfile(GUEST_PROFILE)
    saveProfile(GUEST_PROFILE)
  }

  return (
    <>
      <section className={styles.accountPanel} aria-label="Профиль пользователя">
        <div className={styles.accountIdentity}>
          <strong>{profile.displayName}</strong>
          <span>{profile.email || 'локальная гостевая сессия'}</span>
        </div>

        <div className={styles.accountActions}>
          {isGuest ? (
            <>
              <button type="button" className={styles.textButton} onClick={() => openModal('login')}>
                войти
              </button>
              <span aria-hidden="true">/</span>
              <button type="button" className={styles.textButton} onClick={() => openModal('register')}>
                зарегистрироваться
              </button>
            </>
          ) : (
            <>
              <button type="button" className={styles.textButton} onClick={() => openModal('login')}>
                сменить
              </button>
              <span aria-hidden="true">/</span>
              <button type="button" className={styles.textButton} onClick={signOut}>
                выйти
              </button>
            </>
          )}
        </div>
      </section>

      {isModalOpen && (
        <div className={styles.authModalBackdrop} role="presentation" onClick={closeModal}>
          <div
            className={styles.authModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className={styles.authModalHeader}>
              <div>
                <p className={styles.panelLabel}>Аккаунт</p>
                <h2 id="auth-modal-title">{isRegister ? 'Регистрация' : 'Вход'}</h2>
              </div>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={closeModal}
                aria-label="Закрыть форму"
              >
                X
              </button>
            </header>

            <div className={styles.authTabs} role="tablist" aria-label="Выбор формы">
              <button
                type="button"
                role="tab"
                aria-selected={!isRegister}
                className={`${styles.tabButton} ${!isRegister ? styles.tabButtonActive : ''}`}
                onClick={() => setMode('login')}
              >
                Вход
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isRegister}
                className={`${styles.tabButton} ${isRegister ? styles.tabButtonActive : ''}`}
                onClick={() => setMode('register')}
              >
                Регистрация
              </button>
            </div>

            <form className={styles.authForm} onSubmit={submitAuth}>
              {isRegister && (
                <label className={styles.field}>
                  <span>Имя</span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Анна В."
                    autoComplete="name"
                  />
                </label>
              )}

              <label className={styles.field}>
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="astro@mail.ru"
                  autoComplete="email"
                  required
                />
              </label>

              <label className={styles.field}>
                <span>Пароль</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  required
                />
              </label>

              <footer className={styles.authModalFooter}>
                <button type="button" className={styles.secondaryButton} onClick={closeModal}>
                  Отмена
                </button>
                <button type="submit" className={styles.primaryButton}>
                  {isRegister ? 'Создать профиль' : 'Войти'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
