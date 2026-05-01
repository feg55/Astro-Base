import { AuthPanel } from './AuthPanel'
import { FilterSummary } from './FilterSummary'
import { FiltersSidebar } from './FiltersSidebar'
import { ShotCard } from './ShotCard'
import { ShotModal } from './ShotModal'
import styles from './AstroBase.module.css'
import type { AstroShot, CelestialObject, ObjectFilterOption } from './types'

type AstroBaseProps = {
  apiError: string | null
  checkedObjectIds: number[]
  checkedObjectsSet: ReadonlySet<number>
  filterOptions: ObjectFilterOption[]
  filteredShots: AstroShot[]
  hasActiveFilters: boolean
  isLoadingShots: boolean
  objects: CelestialObject[]
  openedShot: AstroShot | null
  searchQuery: string
  selectedObjectName: string
  selectedPlanetId: number | null
  onCloseShot: () => void
  onShotCreated: (shot: AstroShot) => void
  onOpenShot: (shotId: number) => void
  onResetFilters: () => void
  onSearchQueryChange: (query: string) => void
  onToggleGroupFilter: (childrenIds: number[]) => void
  onToggleObjectFilter: (objectId: number) => void
}

export function AstroBase({
  apiError,
  checkedObjectIds,
  checkedObjectsSet,
  filterOptions,
  filteredShots,
  hasActiveFilters,
  isLoadingShots,
  objects,
  openedShot,
  searchQuery,
  selectedObjectName,
  selectedPlanetId,
  onCloseShot,
  onShotCreated,
  onOpenShot,
  onResetFilters,
  onSearchQueryChange,
  onToggleGroupFilter,
  onToggleObjectFilter,
}: AstroBaseProps) {
  return (
    <section className={styles.astroBaseSection}>
      <div className={styles.astroBaseTop}>
        <div className={styles.topCopy}>
          <p className={styles.astroBaseLabel}>Astro Base</p>
          <h1>Лента астрофото</h1>
          <p className={styles.astroBaseDescription}>
            Снимки сообщества, быстрый поиск и фильтры по объектам Солнечной системы.
          </p>
        </div>

        <AuthPanel objects={objects} onShotCreated={onShotCreated} />
      </div>

      <div className={styles.astroBaseLayout}>
        <div className={styles.astroFeedColumn}>
          <FilterSummary
            selectedObjectName={selectedObjectName}
            selectedPlanetId={selectedPlanetId}
            checkedCount={checkedObjectIds.length}
            shotsCount={filteredShots.length}
            onResetFilters={onResetFilters}
          />

          {apiError && <p className={styles.statusMessage}>{apiError}</p>}
          {isLoadingShots && <p className={styles.statusMessage}>Загружаем снимки...</p>}

          <div className={styles.shotsGrid}>
            {filteredShots.map((shot) => (
              <ShotCard key={shot.id} shot={shot} onOpen={onOpenShot} />
            ))}
          </div>

          {filteredShots.length === 0 && (
            <p className={styles.emptyState}>
              По текущим фильтрам ничего не найдено. Попробуйте ослабить ограничения.
            </p>
          )}
        </div>

        <FiltersSidebar
          checkedObjectsSet={checkedObjectsSet}
          filterOptions={filterOptions}
          hasActiveFilters={hasActiveFilters}
          searchQuery={searchQuery}
          onSearchQueryChange={onSearchQueryChange}
          onToggleObjectFilter={onToggleObjectFilter}
          onToggleGroupFilter={onToggleGroupFilter}
          onResetFilters={onResetFilters}
        />
      </div>

      {openedShot && <ShotModal shot={openedShot} onClose={onCloseShot} />}
    </section>
  )
}
