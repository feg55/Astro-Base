import { useEffect, useMemo, useState } from 'react'
import styles from './App.module.css'
import { AstroBase } from './components/AstroBase'
import {
  ASTRO_SHOTS,
  EARTH_ID,
  EARTH_SYSTEM_IDS,
  getObjectName,
  matchesShotSearch,
} from './components/astroData'
import RenderCvans from './RenderCvans'

function App() {
  const [selectedPlanetId, setSelectedPlanetId] = useState<number | null>(null)
  const [checkedObjectIds, setCheckedObjectIds] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [openedShotId, setOpenedShotId] = useState<number | null>(null)

  const checkedObjectsSet = useMemo(() => new Set(checkedObjectIds), [checkedObjectIds])
  const normalizedSearch = searchQuery.trim().toLowerCase()
  const openedShot = useMemo(
    () => ASTRO_SHOTS.find((shot) => shot.id === openedShotId) ?? null,
    [openedShotId]
  )

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

  const filteredShots = useMemo(() => {
    return ASTRO_SHOTS.filter((shot) => {
      const matchesCheckboxes = checkedObjectsSet.size === 0 || checkedObjectsSet.has(shot.objectId)
      return matchesCheckboxes && matchesShotSearch(shot, normalizedSearch)
    })
  }, [checkedObjectsSet, normalizedSearch])

  const selectedObjectName = selectedPlanetId === null
    ? 'Все объекты'
    : getObjectName(selectedPlanetId)

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
        checkedObjectIds={checkedObjectIds}
        checkedObjectsSet={checkedObjectsSet}
        filteredShots={filteredShots}
        hasActiveFilters={hasActiveFilters}
        openedShot={openedShot}
        searchQuery={searchQuery}
        selectedObjectName={selectedObjectName}
        selectedPlanetId={selectedPlanetId}
        onCloseShot={() => setOpenedShotId(null)}
        onOpenShot={setOpenedShotId}
        onResetFilters={resetAllFilters}
        onSearchQueryChange={setSearchQuery}
        onToggleGroupFilter={toggleGroupFilter}
        onToggleObjectFilter={toggleObjectFilter}
      />
    </main>
  )
}

export default App
