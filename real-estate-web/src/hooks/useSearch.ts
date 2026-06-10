'use client'

import { useState, useCallback, useMemo } from 'react'
import { searchService } from '@/services/searchService'
import { Property } from '@/types/property'
import { PropertySearchFilters, SearchSuggestion } from '@/types/search'
import { mockProperties } from '@/data'

export function useSearch() {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<PropertySearchFilters>({})
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const results: Property[] = useMemo(() => {
    if (!query && Object.keys(filters).length === 0) return mockProperties
    const searchQuery = searchService.buildSearchQuery(query, filters)
    return searchService.searchProperties(searchQuery)
  }, [query, filters])

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
    if (value.length >= 2) {
      setSuggestions(searchService.getSearchSuggestions(value))
    } else {
      setSuggestions([])
    }
  }, [])

  const handleSearch = useCallback((value: string) => {
    setIsSearching(true)
    setQuery(value)
    setSuggestions([])
    if (value.trim()) searchService.saveRecentSearch(value.trim())
    setIsSearching(false)
  }, [])

  const updateFilters = useCallback((newFilters: Partial<PropertySearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const clearFilters = useCallback(() => setFilters({}), [])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.operation) count++
    if (filters.type?.length) count++
    if (filters.priceRange) count++
    if (filters.areaRange) count++
    if (filters.bedrooms) count++
    return count
  }, [filters])

  return {
    query,
    filters,
    results,
    suggestions,
    isSearching,
    activeFilterCount,
    handleQueryChange,
    handleSearch,
    updateFilters,
    clearFilters,
    setSuggestions,
  }
}
