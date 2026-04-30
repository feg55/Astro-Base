export type AstroShot = {
  id: number
  title: string
  author: string
  objectId: number
  image: string
  likes: number
  telescope: string
  camera: string
  coordinates: string
  location: string
  description: string
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

export type UserProfile = {
  displayName: string
  username: string
  email: string
  shotsCount: number
  reputation: number
  role: 'guest' | 'member'
}
