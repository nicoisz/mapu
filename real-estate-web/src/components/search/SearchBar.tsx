'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { SearchSuggestion } from '@/types/search'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSearch: (value: string) => void
  suggestions?: SearchSuggestion[]
  activeFilterCount?: number
  onFilterClick?: () => void
  placeholder?: string
  className?: string
}

const SUGGESTION_ICONS: Record<SearchSuggestion['type'], string> = {
  location: '📍',
  property_type: '🏠',
  recent: '🕐',
  popular: '🔥',
}

export function SearchBar({ value, onChange, onSearch, suggestions = [], activeFilterCount = 0, onFilterClick, placeholder, className }: SearchBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      onSearch(value)
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  function handleSuggestionClick(suggestion: SearchSuggestion) {
    onChange(suggestion.text)
    onSearch(suggestion.text)
    setShowSuggestions(false)
  }

  function handleClear() {
    onChange('')
    onSearch('')
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="flex items-center bg-surface-container-lowest rounded-xl shadow-soft border border-outline-variant/60 overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
        <Search size={16} className="ml-3 text-on-surface-variant shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => { onChange(e.target.value); setShowSuggestions(true) }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? 'Buscar casa, departamento, sector...'}
          className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none text-on-surface placeholder:text-on-surface-variant/60"
        />
        {value && (
          <button onClick={handleClear} className="p-2 text-on-surface-variant hover:text-on-surface">
            <X size={14} />
          </button>
        )}
        {onFilterClick && (
          <button
            onClick={onFilterClick}
            className={cn('flex items-center gap-1.5 px-3 py-2.5 border-l border-outline-variant/60 text-sm font-medium transition-colors', activeFilterCount > 0 ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary')}
          >
            <SlidersHorizontal size={14} />
            {activeFilterCount > 0 && (
              <span className="bg-accent text-on-tertiary text-xs rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-lowest rounded-xl shadow-elevated border border-outline-variant/60 overflow-hidden z-50">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSuggestionClick(s)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-surface-container transition-colors"
            >
              <span>{SUGGESTION_ICONS[s.type]}</span>
              <span className="text-on-surface">{s.text}</span>
              <span className="ml-auto text-xs text-on-surface-variant capitalize">{s.type === 'property_type' ? 'tipo' : s.type === 'location' ? 'lugar' : s.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
