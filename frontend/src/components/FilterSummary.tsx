import styles from './AstroBase.module.css'

type FilterSummaryProps = {
  selectedObjectName: string
  selectedPlanetId: number | null
  checkedCount: number
  shotsCount: number
  onResetFilters: () => void
}

export function FilterSummary({
  selectedObjectName,
  selectedPlanetId,
  checkedCount,
  shotsCount,
  onResetFilters,
}: FilterSummaryProps) {
  return (
    <div className={styles.filterBar}>
      <span>
        Система: <strong>{selectedObjectName}</strong>
      </span>
      <span>
        Фильтры: <strong>{checkedCount === 0 ? 'нет' : checkedCount}</strong>
      </span>
      <span>
        Фото: <strong>{shotsCount}</strong>
      </span>
      {selectedPlanetId !== null && (
        <button type="button" className={styles.clearFilterButton} onClick={onResetFilters}>
          Сбросить систему
        </button>
      )}
    </div>
  )
}
