export type AstroShot = {
  id: number
  title: string
  author: string
  objectId: number
  objectName?: string
  image: string
  likes: number
  telescope: string
  camera: string
  coordinates: string
  location: string
  description: string
}

export type CelestialObject = {
  id: number
  slug: string
  name: string
  type: string
  parentId: number | null
  sortOrder: number
  texturePath: string | null
}

export type ObjectFilterSingle = {
  type: 'single'
  id: number
  label: string
}

export type ObjectFilterGroup = {
  type: 'group'
  id: string
  label: string
  children: Array<{
    id: number
    label: string
  }>
}

export type ObjectFilterOption = ObjectFilterSingle | ObjectFilterGroup

export type UserRole = 'guest' | 'member' | 'admin'

export type UserProfile = {
  displayName: string
  username: string
  email: string
  shotsCount: number
  reputation: number
  role: UserRole
}
