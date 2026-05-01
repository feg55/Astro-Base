import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import styles from './App.module.css'
import { AstroBase } from './components/AstroBase'
import {
  ASTRO_SHOTS,
  EARTH_ID,
  EARTH_SYSTEM_IDS,
  FILTER_OPTIONS,
  OBJECT_NAMES,
  getObjectName,
  matchesShotSearch,
} from './components/astroData'
import type { AstroShot, CelestialObject, ObjectFilterOption } from './components/types'
import { fetchObjects, fetchShots } from './lib/api'
import RenderCvans from './RenderCvans'

const AdminPage = lazy(() => import('./components/AdminPage'))

function filterLocalShots(objectIds: number[], normalizedSearch: string): AstroShot[] {
  const objectIdsSet = new Set(objectIds)

  return ASTRO_SHOTS.filter((shot) => {
    const matchesCheckboxes = objectIdsSet.size === 0 || objectIdsSet.has(shot.objectId)
    return matchesCheckboxes && matchesShotSearch(shot, normalizedSearch)
  })
}

function buildFilterOptions(objects: CelestialObject[]): ObjectFilterOption[] {
  if (objects.length === 0) {
    return FILTER_OPTIONS
  }

  const sortedObjects = [...objects].sort((left, right) => left.sortOrder - right.sortOrder)
  const childrenByParent = new Map<number, CelestialObject[]>()

  sortedObjects.forEach((object) => {
    if (object.parentId === null) {
      return
    }

    const children = childrenByParent.get(object.parentId) ?? []
    children.push(object)
    childrenByParent.set(object.parentId, children)
  })

  return sortedObjects
    .filter((object) => object.parentId === null)
    .map((object) => {
      const children = childrenByParent.get(object.id) ?? []

      if (children.length > 0) {
        return {
          type: 'group',
          id: `${object.slug}-system`,
          label: `Система ${object.name}`,
          children: [object, ...children].map((child) => ({
            id: child.id,
            label: child.name,
          })),
        }
      }

      return {
        type: 'single',
        id: object.id,
        label: object.name,
      }
    })
}

function MainApp() {
  const [selectedPlanetId, setSelectedPlanetId] = useState<number | null>(null)
  const [checkedObjectIds, setCheckedObjectIds] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [openedShotId, setOpenedShotId] = useState<number | null>(null)
  const [objects, setObjects] = useState<CelestialObject[]>([])
  const [filteredShots, setFilteredShots] = useState<AstroShot[]>([])
  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoadingShots, setIsLoadingShots] = useState(true)
  const [shotsRevision, setShotsRevision] = useState(0)

  const checkedObjectsSet = useMemo(() => new Set(checkedObjectIds), [checkedObjectIds])
  const normalizedSearch = searchQuery.trim().toLowerCase()
  const filterOptions = useMemo(() => buildFilterOptions(objects), [objects])
  const objectNames = useMemo(() => {
    const names = new Map<number, string>(
      Object.entries(OBJECT_NAMES).map(([id, name]) => [Number(id), name])
    )

    objects.forEach((object) => names.set(object.id, object.name))
    return names
  }, [objects])
  const openedShot = useMemo(
    () => filteredShots.find((shot) => shot.id === openedShotId) ?? null,
    [filteredShots, openedShotId]
  )

  useEffect(() => {
    const controller = new AbortController()

    fetchObjects(controller.signal)
      .then(setObjects)
      .catch(() => {
        if (!controller.signal.aborted) {
          setObjects([])
        }
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const loadingTimer = window.setTimeout(() => {
      if (!controller.signal.aborted) {
        setIsLoadingShots(true)
      }
    }, 120)

    fetchShots({
      search: normalizedSearch,
      objectIds: checkedObjectIds,
      signal: controller.signal,
    })
      .then(({ items }) => {
        setFilteredShots(items)
        setApiError(null)
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setFilteredShots(filterLocalShots(checkedObjectIds, normalizedSearch))
          setApiError('API недоступен, показаны локальные демо-данные.')
        }
      })
      .finally(() => {
        window.clearTimeout(loadingTimer)

        if (!controller.signal.aborted) {
          setIsLoadingShots(false)
        }
      })

    return () => {
      window.clearTimeout(loadingTimer)
      controller.abort()
    }
  }, [checkedObjectIds, normalizedSearch, shotsRevision])

  useEffect(() => {
    if (openedShotId === null) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenedShotId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openedShotId])

  const handlePlanetSelect = (planetId: number) => {
    setSelectedPlanetId((prev) => (prev === planetId ? null : planetId))
    setCheckedObjectIds((prev) => {
      const next = new Set(prev)

      if (planetId === EARTH_ID) {
        const isEarthSystemSelected = EARTH_SYSTEM_IDS.every((id) => next.has(id))

        if (isEarthSystemSelected) {
          EARTH_SYSTEM_IDS.forEach((id) => next.delete(id))
        } else {
          EARTH_SYSTEM_IDS.forEach((id) => next.add(id))
        }

        return Array.from(next)
      }

      if (next.has(planetId)) {
        next.delete(planetId)
      } else {
        next.add(planetId)
      }

      return Array.from(next)
    })
  }

  const toggleObjectFilter = (objectId: number) => {
    setCheckedObjectIds((prev) => (
      prev.includes(objectId)
        ? prev.filter((id) => id !== objectId)
        : [...prev, objectId]
    ))
  }

  const toggleGroupFilter = (childrenIds: number[]) => {
    setCheckedObjectIds((prev) => {
      const next = new Set(prev)
      const isGroupFullySelected = childrenIds.every((id) => next.has(id))

      if (isGroupFullySelected) {
        childrenIds.forEach((id) => next.delete(id))
      } else {
        childrenIds.forEach((id) => next.add(id))
      }

      return Array.from(next)
    })
  }

  const resetAllFilters = () => {
    setSelectedPlanetId(null)
    setCheckedObjectIds([])
    setSearchQuery('')
  }

  const handleShotCreated = (shot: AstroShot) => {
    setShotsRevision((prev) => prev + 1)
    setOpenedShotId(shot.id)
  }

  const selectedObjectName = selectedPlanetId === null
    ? 'Все объекты'
    : objectNames.get(selectedPlanetId) ?? getObjectName(selectedPlanetId)

  const hasActiveFilters = (
    selectedPlanetId !== null ||
    checkedObjectIds.length > 0 ||
    searchQuery.trim().length > 0
  )

  return (
    <main className={styles.appShell}>
      <section className={styles.canvasStage}>
        <RenderCvans selectedPlanetId={selectedPlanetId} onSelectPlanet={handlePlanetSelect} />
      </section>

      <AstroBase
        apiError={apiError}
        checkedObjectIds={checkedObjectIds}
        checkedObjectsSet={checkedObjectsSet}
        filterOptions={filterOptions}
        filteredShots={filteredShots}
        hasActiveFilters={hasActiveFilters}
        isLoadingShots={isLoadingShots}
        objects={objects}
        openedShot={openedShot}
        searchQuery={searchQuery}
        selectedObjectName={selectedObjectName}
        selectedPlanetId={selectedPlanetId}
        onCloseShot={() => setOpenedShotId(null)}
        onShotCreated={handleShotCreated}
        onOpenShot={setOpenedShotId}
        onResetFilters={resetAllFilters}
        onSearchQueryChange={setSearchQuery}
        onToggleGroupFilter={toggleGroupFilter}
        onToggleObjectFilter={toggleObjectFilter}
      />
    </main>
  )
}

function App() {
  if (window.location.pathname === '/admin') {
    return (
      <Suspense fallback={<main className={styles.adminFallback}>Загружаем админ-панель...</main>}>
        <AdminPage />
      </Suspense>
    )
  }

  return <MainApp />
}

export default App
