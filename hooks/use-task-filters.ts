import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import {
  type TaskFilters,
  defaultFilters,
  filtersToURLParams,
  filtersFromURLParams,
} from '@/lib/filters'

export function useTaskFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<TaskFilters>(defaultFilters)

  // Initialize filters from URL on mount
  useEffect(() => {
    const urlFilters = filtersFromURLParams(searchParams)
    setFilters({ ...defaultFilters, ...urlFilters })
  }, [searchParams])

  // Update URL when filters change
  const updateFilters = useCallback(
    (newFilters: TaskFilters) => {
      setFilters(newFilters)

      const params = filtersToURLParams(newFilters)
      const newSearchParams = new URLSearchParams(searchParams.toString())

      // Remove all filter params first
      ;['status', 'priority', 'assignee', 'labels', 'from', 'to', 'q'].forEach(
        (key) => newSearchParams.delete(key)
      )

      // Add new filter params
      params.forEach((value, key) => {
        newSearchParams.set(key, value)
      })

      const newUrl = `${pathname}?${newSearchParams.toString()}`
      router.replace(newUrl, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  // Clear all filters
  const clearFilters = useCallback(() => {
    updateFilters(defaultFilters)
  }, [updateFilters])

  // Update a single filter
  const updateFilter = useCallback(
    <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => {
      updateFilters({ ...filters, [key]: value })
    },
    [filters, updateFilters]
  )

  return {
    filters,
    updateFilters,
    updateFilter,
    clearFilters,
  }
}