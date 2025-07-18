'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  CalendarIcon,
  Check,
  ChevronDown,
  Filter,
  Tag,
  User,
  Flag,
  ListTodo,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { TaskFilters, TaskStatus, TaskPriority } from '@/lib/filters'
import type { UserResponse as UserType } from '@/types/api/responses'

// Type definition for Label if @prisma/client is not available
interface Label {
  id: string
  name: string
  color: string
  projectId: string
  createdAt: Date
  updatedAt: Date
}

interface TaskFiltersProps {
  filters: TaskFilters
  onChange: (filters: TaskFilters) => void
  users?: UserType[]
  labels?: Label[]
  className?: string
}

const statusOptions: { value: TaskStatus; label: string; icon: string }[] = [
  { value: 'TODO', label: 'To Do', icon: '⭕' },
  { value: 'IN_PROGRESS', label: 'In Progress', icon: '🔄' },
  { value: 'IN_REVIEW', label: 'In Review', icon: '👀' },
  { value: 'DONE', label: 'Done', icon: '✅' },
]

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'text-green-600' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-600' },
  { value: 'HIGH', label: 'High', color: 'text-orange-600' },
  { value: 'URGENT', label: 'Urgent', color: 'text-red-600' },
]

export function TaskFilters({
  filters,
  onChange,
  users = [],
  labels = [],
  className,
}: TaskFiltersProps) {
  const [statusOpen, setStatusOpen] = useState(false)
  const [priorityOpen, setPriorityOpen] = useState(false)
  const [assigneeOpen, setAssigneeOpen] = useState(false)
  const [labelOpen, setLabelOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)

  const updateFilter = <K extends keyof TaskFilters>(
    key: K,
    value: TaskFilters[K]
  ) => {
    onChange({ ...filters, [key]: value })
  }

  const toggleArrayFilter = <T extends string>(
    key: 'status' | 'priority' | 'assigneeIds' | 'labelIds',
    value: T
  ) => {
    const currentValues = filters[key] as T[]
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value]
    updateFilter(key, newValues as any)
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {/* Status Filter */}
      <Popover open={statusOpen} onOpenChange={setStatusOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-between',
              filters.status.length > 0 && 'border-primary'
            )}
          >
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              <span>Status</span>
              {filters.status.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1 py-0">
                  {filters.status.length}
                </Badge>
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0" align="start">
          <Command>
            <CommandList>
              <CommandGroup>
                {statusOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => toggleArrayFilter('status', option.value)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Checkbox
                        checked={filters.status.includes(option.value)}
                        className="h-4 w-4"
                      />
                      <span className="text-lg">{option.icon}</span>
                      <span>{option.label}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Priority Filter */}
      <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-between',
              filters.priority.length > 0 && 'border-primary'
            )}
          >
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              <span>Priority</span>
              {filters.priority.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1 py-0">
                  {filters.priority.length}
                </Badge>
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0" align="start">
          <Command>
            <CommandList>
              <CommandGroup>
                {priorityOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => toggleArrayFilter('priority', option.value)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Checkbox
                        checked={filters.priority.includes(option.value)}
                        className="h-4 w-4"
                      />
                      <Flag className={cn('h-4 w-4', option.color)} />
                      <span>{option.label}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Assignee Filter */}
      <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-between',
              filters.assigneeIds.length > 0 && 'border-primary'
            )}
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Assignee</span>
              {filters.assigneeIds.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1 py-0">
                  {filters.assigneeIds.length}
                </Badge>
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search users..." />
            <CommandList>
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={() => updateFilter('assigneeIds', [])}
                  className="mb-1"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4" />
                    <span className="font-medium">Unassigned</span>
                  </div>
                </CommandItem>
                <CommandSeparator />
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    onSelect={() => toggleArrayFilter('assigneeIds', user.id)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Checkbox
                        checked={filters.assigneeIds.includes(user.id)}
                        className="h-4 w-4"
                      />
                      <span>{user.name || user.username}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Label Filter */}
      <Popover open={labelOpen} onOpenChange={setLabelOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-between',
              filters.labelIds.length > 0 && 'border-primary'
            )}
          >
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span>Labels</span>
              {filters.labelIds.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1 py-0">
                  {filters.labelIds.length}
                </Badge>
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search labels..." />
            <CommandList>
              <CommandEmpty>No labels found.</CommandEmpty>
              <CommandGroup>
                {labels.map((label) => (
                  <CommandItem
                    key={label.id}
                    onSelect={() => toggleArrayFilter('labelIds', label.id)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Checkbox
                        checked={filters.labelIds.includes(label.id)}
                        className="h-4 w-4"
                      />
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      <span>{label.name}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Date Range Filter */}
      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-start text-left font-normal',
              (filters.dateRange.from || filters.dateRange.to) && 'border-primary'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.dateRange.from || filters.dateRange.to ? (
              <span>
                {filters.dateRange.from && format(filters.dateRange.from, 'PP')}
                {filters.dateRange.from && filters.dateRange.to && ' - '}
                {filters.dateRange.to && format(filters.dateRange.to, 'PP')}
              </span>
            ) : (
              <span>Due Date</span>
            )}
            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">From</label>
                <Calendar
                  mode="single"
                  selected={filters.dateRange.from}
                  onSelect={(date) =>
                    updateFilter('dateRange', { ...filters.dateRange, from: date })
                  }
                  initialFocus
                />
              </div>
              <Separator />
              <div className="space-y-1">
                <label className="text-sm font-medium">To</label>
                <Calendar
                  mode="single"
                  selected={filters.dateRange.to}
                  onSelect={(date) =>
                    updateFilter('dateRange', { ...filters.dateRange, to: date })
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateFilter('dateRange', {})}
                >
                  Clear
                </Button>
                <Button size="sm" onClick={() => setDateOpen(false)}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}