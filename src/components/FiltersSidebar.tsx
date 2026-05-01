import styles from './AstroBase.module.css'
import type { ObjectFilterOption } from './types'

type FiltersSidebarProps = {
  checkedObjectsSet: ReadonlySet<number>
  filterOptions: ObjectFilterOption[]
  hasActiveFilters: boolean
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  onToggleObjectFilter: (objectId: number) => void
  onToggleGroupFilter: (childrenIds: number[]) => void
  onResetFilters: () => void
}

export function FiltersSidebar({
  checkedObjectsSet,
  filterOptions,
  hasActiveFilters,
  searchQuery,
  onSearchQueryChange,
  onToggleObjectFilter,
  onToggleGroupFilter,
  onResetFilters,
}: FiltersSidebarProps) {
  return (
    <aside className={styles.filtersSidebar} aria-label="Меню фильтров">
      <h2>Фильтры</h2>

      <label className={styles.searchField}>
        <span>Поиск по фото</span>
        <input
          className={styles.searchInput}
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Название, автор или объект"
        />
      </label>

      <div className={styles.objectMenu}>
        {filterOptions.map((option) => {
          if (option.type === 'single') {
            return (
              <label className={styles.filterCheck} key={option.id}>
                <input
                  type="checkbox"
                  checked={checkedObjectsSet.has(option.id)}
                  onChange={() => onToggleObjectFilter(option.id)}
                />
                <span>{option.label}</span>
              </label>
            )
          }

          const childIds = option.children.map((child) => child.id)
          const selectedChildrenCount = childIds.filter((id) => checkedObjectsSet.has(id)).length
          const allChildrenSelected = selectedChildrenCount === childIds.length
          const partlySelected = selectedChildrenCount > 0 && !allChildrenSelected

          return (
            <div className={styles.filterFolder} key={option.id}>
              <label className={`${styles.filterCheck} ${styles.folderHeader}`}>
                <input
                  type="checkbox"
                  checked={allChildrenSelected}
                  ref={(element) => {
                    if (element) {
                      element.indeterminate = partlySelected
                    }
                  }}
                  onChange={() => onToggleGroupFilter(childIds)}
                />
                <span>{option.label}</span>
              </label>

              <div className={styles.folderChildren}>
                {option.children.map((child) => (
                  <label className={styles.filterCheck} key={child.id}>
                    <input
                      type="checkbox"
                      checked={checkedObjectsSet.has(child.id)}
                      onChange={() => onToggleObjectFilter(child.id)}
                    />
                    <span>{child.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        className={styles.resetSidebarButton}
        onClick={onResetFilters}
        disabled={!hasActiveFilters}
      >
        Очистить фильтры
      </button>
    </aside>
  )
}
