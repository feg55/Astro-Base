import { memo, useCallback, useMemo, type ChangeEvent } from 'react'
import styles from './AstroBase.module.css'
import type { ObjectFilterGroup, ObjectFilterOption } from './types'

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

type SingleFilterProps = {
  checked: boolean
  id: number
  label: string
  onToggle: (objectId: number) => void
}

const SingleFilter = memo(function SingleFilter({
  checked,
  id,
  label,
  onToggle,
}: SingleFilterProps) {
  const handleChange = useCallback(() => onToggle(id), [id, onToggle])

  return (
    <label className={styles.filterCheck}>
      <input type="checkbox" checked={checked} onChange={handleChange} />
      <span>{label}</span>
    </label>
  )
})

type GroupFilterProps = {
  option: ObjectFilterGroup
  selectionKey: string
  onToggleGroup: (childrenIds: number[]) => void
  onToggleObject: (objectId: number) => void
}

const GroupFilter = memo(function GroupFilter({
  option,
  selectionKey,
  onToggleGroup,
  onToggleObject,
}: GroupFilterProps) {
  const childIds = useMemo(
    () => option.children.map((child) => child.id),
    [option.children],
  )
  const selectedIds = useMemo(
    () => new Set(selectionKey ? selectionKey.split(',').map(Number) : []),
    [selectionKey],
  )
  const allChildrenSelected = selectedIds.size === childIds.length
  const partlySelected = selectedIds.size > 0 && !allChildrenSelected
  const handleGroupChange = useCallback(
    () => onToggleGroup(childIds),
    [childIds, onToggleGroup],
  )
  const setIndeterminate = useCallback((element: HTMLInputElement | null) => {
    if (element) {
      element.indeterminate = partlySelected
    }
  }, [partlySelected])

  return (
    <div className={styles.filterFolder}>
      <label className={`${styles.filterCheck} ${styles.folderHeader}`}>
        <input
          type="checkbox"
          checked={allChildrenSelected}
          ref={setIndeterminate}
          onChange={handleGroupChange}
        />
        <span>{option.label}</span>
      </label>

      <div className={styles.folderChildren}>
        {option.children.map((child) => (
          <SingleFilter
            key={child.id}
            checked={selectedIds.has(child.id)}
            id={child.id}
            label={child.label}
            onToggle={onToggleObject}
          />
        ))}
      </div>
    </div>
  )
})

export const FiltersSidebar = memo(function FiltersSidebar({
  checkedObjectsSet,
  filterOptions,
  hasActiveFilters,
  searchQuery,
  onSearchQueryChange,
  onToggleObjectFilter,
  onToggleGroupFilter,
  onResetFilters,
}: FiltersSidebarProps) {
  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onSearchQueryChange(event.target.value),
    [onSearchQueryChange],
  )

  return (
    <aside className={styles.filtersSidebar} aria-label="Меню фильтров">
      <h2>Фильтры</h2>

      <label className={styles.searchField}>
        <span>Поиск по фото</span>
        <input
          className={styles.searchInput}
          type="search"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Название, автор или объект"
        />
      </label>

      <div className={styles.objectMenu}>
        {filterOptions.map((option) => {
          if (option.type === 'single') {
            return (
              <SingleFilter
                key={option.id}
                checked={checkedObjectsSet.has(option.id)}
                id={option.id}
                label={option.label}
                onToggle={onToggleObjectFilter}
              />
            )
          }

          return (
            <GroupFilter
              key={option.id}
              option={option}
              selectionKey={option.children
                .filter((child) => checkedObjectsSet.has(child.id))
                .map((child) => child.id)
                .join(',')}
              onToggleGroup={onToggleGroupFilter}
              onToggleObject={onToggleObjectFilter}
            />
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
})
