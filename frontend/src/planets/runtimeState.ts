import type { Mesh } from 'three'

export const planetMeshById = new Map<number, Mesh>()
export const selectedPlanetIdRef: { current: number | null } = { current: null }
