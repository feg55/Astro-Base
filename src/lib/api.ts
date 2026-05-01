import type { AstroShot, CelestialObject, UserProfile, UserRole } from '../components/types'

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:8000'
const TOKEN_KEY = 'astro-base-token'

type ApiUser = {
  id: number
  display_name: string
  username: string
  email: string
  shots_count: number
  reputation: number
  role: string
}

type ApiTokenResponse = {
  access_token: string
  token_type: string
  user: ApiUser
}

type ApiCelestialObject = {
  id: number
  slug: string
  name: string
  type: string
  parent_id: number | null
  sort_order: number
  texture_path: string | null
}

type ApiShot = {
  id: number
  title: string
  author_name: string
  object_id: number
  object_name: string
  image_url: string
  likes_count: number
  telescope: string
  camera: string
  coordinates: string
  location: string
  description: string
}

type ApiShotList = {
  items: ApiShot[]
  total: number
  limit: number
  offset: number
}

type ApiAdminStats = {
  users_count: number
  admins_count: number
  shots_count: number
  image_shots_count: number
  image_bytes: number
}

type ApiAdminUser = {
  id: number
  display_name: string
  username: string
  email: string
  role: 'member' | 'admin'
  reputation: number
  shots_count: number
  created_at: string
}

type ApiAdminUserList = {
  items: ApiAdminUser[]
  total: number
  limit: number
  offset: number
}

type ApiAdminUserDeleteResponse = {
  deleted_user_id: number
  deleted_shots_count: number
}

type ApiAdminClearShotsResponse = {
  deleted_count: number
}

export type CreateShotPayload = {
  title: string
  objectId: number
  image: File
  telescope: string
  camera: string
  coordinates: string
  location: string
  description: string
}

export type AdminUserRole = 'member' | 'admin'

export type AdminStats = {
  usersCount: number
  adminsCount: number
  shotsCount: number
  imageShotsCount: number
  imageBytes: number
}

export type AdminUser = {
  id: number
  displayName: string
  username: string
  email: string
  role: AdminUserRole
  reputation: number
  shotsCount: number
  createdAt: string
}

export type AdminUserList = {
  items: AdminUser[]
  total: number
  limit: number
  offset: number
}

export type CreateAdminUserPayload = {
  displayName: string
  email: string
  password: string
  role: AdminUserRole
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  auth?: boolean
  body?: unknown
}

type ApiValidationError = {
  loc?: unknown[]
  msg?: string
  type?: string
  ctx?: {
    min_length?: number
    max_length?: number
  }
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function getStoredToken(): string | null {
  return window.localStorage.getItem(TOKEN_KEY)
}

export function clearAuthToken(): void {
  window.localStorage.removeItem(TOKEN_KEY)
}

export function hasAuthToken(): boolean {
  return getStoredToken() !== null
}

function saveAuthToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token)
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, body, headers, ...init } = options
  const token = auth ? getStoredToken() : null
  const requestHeaders = new Headers(headers)

  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    const message = await readErrorMessage(response)
    throw new ApiError(response.status, message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json() as { detail?: unknown }

    if (typeof payload.detail === 'string') {
      return translateApiMessage(payload.detail)
    }

    if (Array.isArray(payload.detail)) {
      return formatValidationErrors(payload.detail as ApiValidationError[])
    }
  } catch {
    return 'Не удалось выполнить запрос к API'
  }

  return 'Не удалось выполнить запрос к API'
}

function translateApiMessage(message: string): string {
  const messages: Record<string, string> = {
    'Incorrect email or password': 'Неверный email или пароль.',
    'User with this email already exists': 'Пользователь с таким email уже зарегистрирован.',
    'Invalid authentication token': 'Сессия устарела, войдите снова.',
    'Authentication required': 'Нужно войти в аккаунт.',
    'Admin access required': 'Нужны права администратора.',
    'User not found': 'Пользователь не найден.',
    'Cannot remove the last admin': 'Нельзя удалить или понизить последнего администратора.',
    'Cannot demote yourself': 'Нельзя снять права администратора с самого себя.',
    'Cannot delete yourself': 'Нельзя удалить самого себя.',
    'Invalid confirmation phrase': 'Неверная фраза подтверждения.',
  }

  return messages[message] ?? message
}

function formatValidationErrors(errors: ApiValidationError[]): string {
  const firstError = errors[0]

  if (!firstError) {
    return 'Проверьте данные формы.'
  }

  const lastLocation = firstError.loc?.at(-1)
  const field = typeof lastLocation === 'string' ? lastLocation : null

  if (field === 'password' && firstError.type?.includes('string_too_short')) {
    const minLength = firstError.ctx?.min_length ?? 8
    return `Пароль должен быть не короче ${minLength} символов.`
  }

  if (field === 'password' && firstError.type?.includes('string_too_long')) {
    const maxLength = firstError.ctx?.max_length ?? 128
    return `Пароль должен быть не длиннее ${maxLength} символов.`
  }

  if (field === 'email') {
    return 'Введите корректный email.'
  }

  if (field === 'display_name') {
    return 'Укажите имя профиля.'
  }

  return firstError.msg ?? 'Проверьте данные формы.'
}

function mapProfileRole(role: string): UserRole {
  if (role === 'admin') {
    return 'admin'
  }

  if (role === 'member') {
    return 'member'
  }

  return 'guest'
}

function mapUser(user: ApiUser): UserProfile {
  return {
    displayName: user.display_name,
    username: user.username,
    email: user.email,
    shotsCount: user.shots_count,
    reputation: user.reputation,
    role: mapProfileRole(user.role),
  }
}

function mapObject(object: ApiCelestialObject): CelestialObject {
  return {
    id: object.id,
    slug: object.slug,
    name: object.name,
    type: object.type,
    parentId: object.parent_id,
    sortOrder: object.sort_order,
    texturePath: object.texture_path,
  }
}

function mapShot(shot: ApiShot): AstroShot {
  return {
    id: shot.id,
    title: shot.title,
    author: shot.author_name,
    objectId: shot.object_id,
    objectName: shot.object_name,
    image: mapImageUrl(shot.image_url),
    likes: shot.likes_count,
    telescope: shot.telescope,
    camera: shot.camera,
    coordinates: shot.coordinates,
    location: shot.location,
    description: shot.description,
  }
}

function mapImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith('/shots/')) {
    return `${API_BASE_URL}${imageUrl}`
  }

  return imageUrl
}

function mapAdminStats(stats: ApiAdminStats): AdminStats {
  return {
    usersCount: stats.users_count,
    adminsCount: stats.admins_count,
    shotsCount: stats.shots_count,
    imageShotsCount: stats.image_shots_count,
    imageBytes: stats.image_bytes,
  }
}

function mapAdminUser(user: ApiAdminUser): AdminUser {
  return {
    id: user.id,
    displayName: user.display_name,
    username: user.username,
    email: user.email,
    role: user.role,
    reputation: user.reputation,
    shotsCount: user.shots_count,
    createdAt: user.created_at,
  }
}

export async function fetchObjects(signal?: AbortSignal): Promise<CelestialObject[]> {
  const objects = await request<ApiCelestialObject[]>('/objects', { signal, auth: false })
  return objects.map(mapObject)
}

export async function fetchShots({
  search,
  objectIds,
  signal,
}: {
  search: string
  objectIds: number[]
  signal?: AbortSignal
}): Promise<{ items: AstroShot[]; total: number }> {
  const params = new URLSearchParams()

  if (search) {
    params.set('q', search)
  }

  objectIds.forEach((objectId) => params.append('object_ids', String(objectId)))
  params.set('limit', '100')

  const query = params.toString()
  const shots = await request<ApiShotList>(`/shots${query ? `?${query}` : ''}`, {
    signal,
    auth: true,
  })

  return {
    items: shots.items.map(mapShot),
    total: shots.total,
  }
}

export async function loginUser(email: string, password: string): Promise<UserProfile> {
  const response = await request<ApiTokenResponse>('/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  })

  saveAuthToken(response.access_token)
  return mapUser(response.user)
}

export async function registerUser(
  displayName: string,
  email: string,
  password: string,
): Promise<UserProfile> {
  const response = await request<ApiTokenResponse>('/auth/register', {
    method: 'POST',
    auth: false,
    body: { display_name: displayName, email, password },
  })

  saveAuthToken(response.access_token)
  return mapUser(response.user)
}

export async function fetchCurrentUser(signal?: AbortSignal): Promise<UserProfile> {
  const user = await request<ApiUser>('/auth/me', { signal, auth: true })
  return mapUser(user)
}

export async function createShot(payload: CreateShotPayload): Promise<AstroShot> {
  const formData = new FormData()
  formData.set('title', payload.title)
  formData.set('object_id', String(payload.objectId))
  formData.set('telescope', payload.telescope)
  formData.set('camera', payload.camera)
  formData.set('coordinates', payload.coordinates)
  formData.set('location', payload.location)
  formData.set('description', payload.description)
  formData.set('image', payload.image)

  const token = getStoredToken()
  const headers = new Headers()

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}/shots`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const message = await readErrorMessage(response)
    throw new ApiError(response.status, message)
  }

  const shot = await response.json() as ApiShot
  return mapShot(shot)
}

export async function fetchAdminStats(signal?: AbortSignal): Promise<AdminStats> {
  const stats = await request<ApiAdminStats>('/admin/stats', { signal, auth: true })
  return mapAdminStats(stats)
}

export async function fetchAdminUsers({
  search,
  role,
  limit,
  offset,
  signal,
}: {
  search: string
  role: AdminUserRole | 'all'
  limit: number
  offset: number
  signal?: AbortSignal
}): Promise<AdminUserList> {
  const params = new URLSearchParams()

  if (search.trim()) {
    params.set('q', search.trim())
  }

  if (role !== 'all') {
    params.set('role', role)
  }

  params.set('limit', String(limit))
  params.set('offset', String(offset))

  const response = await request<ApiAdminUserList>(`/admin/users?${params.toString()}`, {
    signal,
    auth: true,
  })

  return {
    items: response.items.map(mapAdminUser),
    total: response.total,
    limit: response.limit,
    offset: response.offset,
  }
}

export async function createAdminUser(payload: CreateAdminUserPayload): Promise<AdminUser> {
  const response = await request<ApiAdminUser>('/admin/users', {
    method: 'POST',
    auth: true,
    body: {
      display_name: payload.displayName,
      email: payload.email,
      password: payload.password,
      role: payload.role,
    },
  })

  return mapAdminUser(response)
}

export async function updateAdminUserRole(userId: number, role: AdminUserRole): Promise<AdminUser> {
  const response = await request<ApiAdminUser>(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    auth: true,
    body: { role },
  })

  return mapAdminUser(response)
}

export async function deleteAdminUser(
  userId: number,
  deleteShots: boolean,
): Promise<{ deletedUserId: number; deletedShotsCount: number }> {
  const params = new URLSearchParams()
  params.set('delete_shots', String(deleteShots))

  const response = await request<ApiAdminUserDeleteResponse>(`/admin/users/${userId}?${params.toString()}`, {
    method: 'DELETE',
    auth: true,
  })

  return {
    deletedUserId: response.deleted_user_id,
    deletedShotsCount: response.deleted_shots_count,
  }
}

export async function clearAllAdminShots(): Promise<{ deletedCount: number }> {
  const params = new URLSearchParams()
  params.set('confirm', 'DELETE_ALL_PHOTOS')

  const response = await request<ApiAdminClearShotsResponse>(`/admin/shots?${params.toString()}`, {
    method: 'DELETE',
    auth: true,
  })

  return { deletedCount: response.deleted_count }
}
