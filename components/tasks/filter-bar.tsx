'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Filter, X, Sparkles, User, Calendar, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TaskSearch } from './task-search'
import { TaskFilters } from './task-filters'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  type TaskFilters as TaskFiltersType,
  defaultFilters,
  filterPresets,
  getActiveFilterCount,
  filtersToURLParams,
  filtersFromURLParams,
} from '@/lib/filters'
import { cn } from '@/lib/utils'
import type { UserResponse as User } from '@/types/api/responses'

// Type definition for Label if @prisma/client is not available
interface Label {
  id: string
  name: string
  color: string
  projectId: string
  createdAt: Date
  updatedAt: Date
}

interface FilterBarProps {
  filters: TaskFiltersType
  onFiltersChange: (filters: TaskFiltersType) => void
  users?: User[]
  labels?: Label[]
  currentUserId?: string
  className?: string
}

const presetIcons: Record<string, React.ElementType> = {
  User,
  Calendar,
  AlertCircle,
  Clock,
}

export function FilterBar({
  filters,
  onFiltersChange,
  users = [],
  labels = [],
  currentUserId,
  className,
}: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)

  // Sync filters with URL
  useEffect(() => {
    const params = filtersToURLParams(filters)
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
  }, [filters, pathname, router, searchParams])

  // Load filters from URL on mount
  useEffect(() => {
    const urlFilters = filtersFromURLParams(searchParams)
    const newFilters = { ...defaultFilters, ...urlFilters }
    onFiltersChange(newFilters)
  }, []) // Only run on mount

  const handlePresetClick = (presetId: string) => {
    const preset = filterPresets.find((p) => p.id === presetId)
    if (!preset) return

    let presetFilters = { ...defaultFilters, ...preset.filters }
    
    // Handle dynamic presets
    if (presetId === 'my-tasks' && currentUserId) {
      presetFilters = {
        ...presetFilters,
        assigneeIds: [currentUserId],
      }
    }
    
    onFiltersChange(presetFilters)
  }

  const clearAllFilters = () => {
    onFiltersChange(defaultFilters)
  }

  const activeFilterCount = getActiveFilterCount(filters)

  return (
    <div className={cn('space-y-3', className)}>
      {/* Search and Filter Toggle */}
      <div className="flex items-center gap-2">
        <TaskSearch
          value={filters.search}
          onChange={(search) => onFiltersChange({ ...filters, search })}
          className="flex-1"
        />
        
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <Filter className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 p-0"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* Quick Presets */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Sparkles className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Quick Filters</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {filterPresets.map((preset) => {
              const Icon = preset.icon ? presetIcons[preset.icon] : null
              return (
                <DropdownMenuItem
                  key={preset.id}
                  onClick={() => handlePresetClick(preset.id)}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  {preset.name}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="rounded-lg border bg-muted/50 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Filters</h4>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-7 px-2 text-xs"
              >
                <X className="mr-1 h-3 w-3" />
                Clear all
              </Button>
            )}
          </div>
          
          <TaskFilters
            filters={filters}
            onChange={onFiltersChange}
            users={users}
            labels={labels}
          />
        </div>
      )}

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {filters.status.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              Status ({filters.status.length})
              <button
                onClick={() => onFiltersChange({ ...filters, status: [] })}
                className="ml-1 hover:bg-muted rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.priority.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              Priority ({filters.priority.length})
              <button
                onClick={() => onFiltersChange({ ...filters, priority: [] })}
                className="ml-1 hover:bg-muted rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.assigneeIds.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              Assignee ({filters.assigneeIds.length})
              <button
                onClick={() => onFiltersChange({ ...filters, assigneeIds: [] })}
                className="ml-1 hover:bg-muted rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.labelIds.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              Labels ({filters.labelIds.length})
              <button
                onClick={() => onFiltersChange({ ...filters, labelIds: [] })}
                className="ml-1 hover:bg-muted rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {(filters.dateRange.from || filters.dateRange.to) && (
            <Badge variant="secondary" className="gap-1">
              Date range
              <button
                onClick={() => onFiltersChange({ ...filters, dateRange: {} })}
                className="ml-1 hover:bg-muted rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-7 px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}