'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface TaskSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const SEARCH_HISTORY_KEY = 'task-search-history'
const MAX_HISTORY_ITEMS = 5

export function TaskSearch({
  value,
  onChange,
  placeholder = 'Search tasks...',
  className,
}: TaskSearchProps) {
  const [open, setOpen] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Load search history from localStorage
    const history = localStorage.getItem(SEARCH_HISTORY_KEY)
    if (history) {
      setSearchHistory(JSON.parse(history))
    }
  }, [])

  const handleSearch = (searchValue: string) => {
    onChange(searchValue)
    
    if (searchValue.trim()) {
      // Add to search history
      const newHistory = [
        searchValue,
        ...searchHistory.filter((item) => item !== searchValue),
      ].slice(0, MAX_HISTORY_ITEMS)
      
      setSearchHistory(newHistory)
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
    }
    
    setOpen(false)
  }

  const clearSearch = () => {
    onChange('')
    inputRef.current?.focus()
  }

  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem(SEARCH_HISTORY_KEY)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn('relative', className)}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(value)
              }
            }}
            className="pl-9 pr-9"
          />
          {value && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
              onClick={clearSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            {searchHistory.length > 0 && (
              <CommandGroup>
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Recent Searches
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                    onClick={clearHistory}
                  >
                    Clear
                  </Button>
                </div>
                {searchHistory.map((item, index) => (
                  <CommandItem
                    key={index}
                    value={item}
                    onSelect={() => handleSearch(item)}
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="flex-1 truncate">{item}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandGroup heading="Search Tips">
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                <p>• Search by task title or description</p>
                <p>• Use task ID for exact match</p>
                <p>• Press Enter to search</p>
              </div>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}