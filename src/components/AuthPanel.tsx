import { type ChangeEvent, type DragEvent, type FormEvent, useEffect, useState } from 'react'
import {
  ApiError,
  clearAuthToken,
  createShot,
  fetchCurrentUser,
  hasAuthToken,
  loginUser,
  registerUser,
} from '../lib/api'
import styles from './AstroBase.module.css'
import type { AstroShot, CelestialObject, UserProfile } from './types'

type AuthMode = 'login' | 'register'
type ShotDraft = {
  title: string
  objectId: string
  telescope: string
  camera: string
  coordinates: string
  location: string
  description: string
}

type AuthPanelProps = {
  objects: CelestialObject[]
  onShotCreated: (shot: AstroShot) => void
}

const STORAGE_KEY = 'astro-base-profile'
const MIN_REGISTER_PASSWORD_LENGTH = 8
const MAX_IMAGE_BYTES = 8 * 1024 * 1024

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
    role: value.role === 'admin' ? 'admin' : value.role === 'member' ? 'member' : 'guest',
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

function createEmptyShotDraft(defaultObjectId: number | null): ShotDraft {
  return {
    title: '',
    objectId: defaultObjectId === null ? '' : String(defaultObjectId),
    telescope: '',
    camera: '',
    coordinates: '',
    location: '',
    description: '',
  }
}

export function AuthPanel({ objects, onShotCreated }: AuthPanelProps) {
  const [profile, setProfile] = useState<UserProfile>(() => getInitialProfile())
  const [mode, setMode] = useState<AuthMode>('login')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isShotModalOpen, setIsShotModalOpen] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shotDraft, setShotDraft] = useState<ShotDraft>(() => createEmptyShotDraft(null))
  const [shotError, setShotError] = useState<string | null>(null)
  const [shotImageFile, setShotImageFile] = useState<File | null>(null)
  const [isDraggingImage, setIsDraggingImage] = useState(false)
  const [isCreatingShot, setIsCreatingShot] = useState(false)

  const isGuest = profile.role === 'guest'
  const isRegister = mode === 'register'
  const objectOptions = [...objects].sort((left, right) => left.sortOrder - right.sortOrder)
  const defaultObjectId = objectOptions[0]?.id ?? null

  useEffect(() => {
    if (!hasAuthToken()) {
      return
    }

    const controller = new AbortController()

    fetchCurrentUser(controller.signal)
      .then((currentProfile) => {
        setProfile(currentProfile)
        saveProfile(currentProfile)
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          clearAuthToken()
        }
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!isModalOpen && !isShotModalOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false)
        setIsShotModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen, isShotModalOpen])

  const openModal = (nextMode: AuthMode) => {
    setMode(nextMode)
    setAuthError(null)
    setIsModalOpen(true)
  }

  const selectMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setAuthError(null)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setPassword('')
    setAuthError(null)
  }

  const openShotModal = () => {
    setShotDraft(createEmptyShotDraft(defaultObjectId))
    setShotImageFile(null)
    setShotError(null)
    setIsShotModalOpen(true)
  }

  const closeShotModal = () => {
    setIsShotModalOpen(false)
    setShotDraft(createEmptyShotDraft(defaultObjectId))
    setShotImageFile(null)
    setIsDraggingImage(false)
    setShotError(null)
  }

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthError(null)

    if (isRegister && password.length < MIN_REGISTER_PASSWORD_LENGTH) {
      setAuthError(`Пароль должен быть не короче ${MIN_REGISTER_PASSWORD_LENGTH} символов.`)
      return
    }

    setIsSubmitting(true)

    try {
      const nextProfile = isRegister
        ? await registerUser(displayName.trim() || email.split('@')[0] || 'Пользователь', email, password)
        : await loginUser(email, password)

      setProfile(nextProfile)
      saveProfile(nextProfile)
      setEmail('')
      setDisplayName('')
      closeModal()
    } catch (error) {
      setAuthError(error instanceof ApiError ? error.message : 'Не удалось выполнить вход')
    } finally {
      setIsSubmitting(false)
    }
  }

  const signOut = () => {
    clearAuthToken()
    setIsShotModalOpen(false)
    setProfile(GUEST_PROFILE)
    saveProfile(GUEST_PROFILE)
  }

  const updateShotDraft = (field: keyof ShotDraft, value: string) => {
    setShotDraft((prev) => ({ ...prev, [field]: value }))
  }

  const setShotImage = (file: File | undefined) => {
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setShotError('Загрузите файл изображения.')
      return
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setShotError('Фото должно быть не больше 8 МБ.')
      return
    }

    setShotImageFile(file)
    setShotError(null)
  }

  const handleShotImageInput = (event: ChangeEvent<HTMLInputElement>) => {
    setShotImage(event.target.files?.[0])
    event.target.value = ''
  }

  const handleImageDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDraggingImage(true)
  }

  const handleImageDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDraggingImage(false)
  }

  const handleImageDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDraggingImage(false)
    setShotImage(event.dataTransfer.files[0])
  }

  const submitShot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShotError(null)

    const objectId = Number(shotDraft.objectId)
    const selectedObject = objectOptions.find((object) => object.id === objectId)

    if (!selectedObject) {
      setShotError('Выберите объект для снимка.')
      return
    }

    if (!shotImageFile) {
      setShotError('Добавьте фото снимка.')
      return
    }

    setIsCreatingShot(true)

    try {
      const createdShot = await createShot({
        title: shotDraft.title.trim(),
        objectId,
        image: shotImageFile,
        telescope: shotDraft.telescope.trim(),
        camera: shotDraft.camera.trim(),
        coordinates: shotDraft.coordinates.trim(),
        location: shotDraft.location.trim(),
        description: shotDraft.description.trim(),
      })
      const nextProfile = { ...profile, shotsCount: profile.shotsCount + 1 }

      setProfile(nextProfile)
      saveProfile(nextProfile)
      onShotCreated(createdShot)
      closeShotModal()
    } catch (error) {
      setShotError(error instanceof ApiError ? error.message : 'Не удалось добавить снимок.')
    } finally {
      setIsCreatingShot(false)
    }
  }

  return (
    <>
      <section className={styles.accountPanel} aria-label="Профиль пользователя">
        <div className={styles.accountHeader}>
          <div className={styles.accountIdentity}>
            <strong>{profile.displayName}</strong>
            <span>{profile.email || 'локальная гостевая сессия'}</span>
          </div>

          {!isGuest && (
            <button
              type="button"
              className={styles.addShotButton}
              onClick={openShotModal}
              disabled={objectOptions.length === 0}
              aria-label="Добавить снимок"
              title="Добавить снимок"
            >
              +
            </button>
          )}
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
              {profile.role === 'admin' && (
                <>
                  <a className={styles.textButton} href="/admin">
                    админ
                  </a>
                  <span aria-hidden="true">/</span>
                </>
              )}
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
                onClick={() => selectMode('login')}
              >
                Вход
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isRegister}
                className={`${styles.tabButton} ${isRegister ? styles.tabButtonActive : ''}`}
                onClick={() => selectMode('register')}
              >
                Регистрация
              </button>
            </div>

            <form className={styles.authForm} onSubmit={submitAuth}>
              {authError && <p className={styles.formError}>{authError}</p>}

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
                  minLength={isRegister ? MIN_REGISTER_PASSWORD_LENGTH : 1}
                  required
                />
                {isRegister && (
                  <small className={styles.fieldHint}>
                    Минимум {MIN_REGISTER_PASSWORD_LENGTH} символов
                  </small>
                )}
              </label>

              <footer className={styles.authModalFooter}>
                <button type="button" className={styles.secondaryButton} onClick={closeModal}>
                  Отмена
                </button>
                <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
                  {isSubmitting ? 'Отправляем...' : isRegister ? 'Создать профиль' : 'Войти'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {isShotModalOpen && (
        <div className={styles.authModalBackdrop} role="presentation" onClick={closeShotModal}>
          <div
            className={styles.authModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shot-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className={styles.authModalHeader}>
              <div>
                <p className={styles.panelLabel}>Снимок</p>
                <h2 id="shot-modal-title">Добавить снимок</h2>
              </div>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={closeShotModal}
                aria-label="Закрыть форму"
              >
                X
              </button>
            </header>

            <form className={styles.authForm} onSubmit={submitShot}>
              {shotError && <p className={styles.formError}>{shotError}</p>}

              <label
                className={`${styles.dropZone} ${isDraggingImage ? styles.dropZoneActive : ''}`}
                onDragOver={handleImageDragOver}
                onDragLeave={handleImageDragLeave}
                onDrop={handleImageDrop}
              >
                <input
                  className={styles.fileInput}
                  type="file"
                  accept="image/*"
                  onChange={handleShotImageInput}
                />
                <span>Фото</span>
                <strong>{shotImageFile ? shotImageFile.name : 'Перетащите изображение сюда'}</strong>
                <small>JPG, PNG или WebP до 8 МБ</small>
              </label>

              <label className={styles.field}>
                <span>Название</span>
                <input
                  type="text"
                  value={shotDraft.title}
                  onChange={(event) => updateShotDraft('title', event.target.value)}
                  placeholder="Лунные кратеры на терминаторе"
                  required
                />
              </label>

              <label className={styles.field}>
                <span>Объект</span>
                <select
                  value={shotDraft.objectId}
                  onChange={(event) => updateShotDraft('objectId', event.target.value)}
                  required
                >
                  {objectOptions.map((object) => (
                    <option key={object.id} value={object.id}>
                      {object.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span>Телескоп</span>
                <input
                  type="text"
                  value={shotDraft.telescope}
                  onChange={(event) => updateShotDraft('telescope', event.target.value)}
                  placeholder="Sky-Watcher 200PDS"
                  required
                />
              </label>

              <label className={styles.field}>
                <span>Камера</span>
                <input
                  type="text"
                  value={shotDraft.camera}
                  onChange={(event) => updateShotDraft('camera', event.target.value)}
                  placeholder="ZWO ASI585MC"
                  required
                />
              </label>

              <label className={styles.field}>
                <span>Координаты</span>
                <input
                  type="text"
                  value={shotDraft.coordinates}
                  onChange={(event) => updateShotDraft('coordinates', event.target.value)}
                  placeholder="RA 08h 52m, Dec +19d 14m"
                  required
                />
              </label>

              <label className={styles.field}>
                <span>Локация</span>
                <input
                  type="text"
                  value={shotDraft.location}
                  onChange={(event) => updateShotDraft('location', event.target.value)}
                  placeholder="Минск, Беларусь"
                  required
                />
              </label>

              <label className={styles.field}>
                <span>Описание</span>
                <textarea
                  value={shotDraft.description}
                  onChange={(event) => updateShotDraft('description', event.target.value)}
                  placeholder="Кратко опишите условия съемки и обработку."
                  required
                />
              </label>

              <footer className={styles.authModalFooter}>
                <button type="button" className={styles.secondaryButton} onClick={closeShotModal}>
                  Отмена
                </button>
                <button type="submit" className={styles.primaryButton} disabled={isCreatingShot}>
                  {isCreatingShot ? 'Сохраняем...' : 'Добавить'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
