'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { searchService } from '@/services/searchService'
import { Property } from '@/types/property'
import { PropertySearchFilters, PropertySearchQuery, SearchSuggestion } from '@/types/search'

export type SortOption = 'recent' | 'price_asc' | 'price_desc' | 'area_desc'

const SORT_MAP: Record<SortOption, Pick<PropertySearchQuery, 'sortBy' | 'sortOrder'>> = {
  recent: { sortBy: 'date', sortOrder: 'desc' },
  price_asc: { sortBy: 'price', sortOrder: 'asc' },
  price_desc: { sortBy: 'price', sortOrder: 'desc' },
  area_desc: { sortBy: 'area', sortOrder: 'desc' },
}

export function useSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery)

  // Sync when the URL-provided query changes (e.g. navigating from the landing
  // search to /buscar?q=... while already on the page).
  useEffect(() => {
    if (initialQuery) setQuery(initialQuery)
  }, [initialQuery])
  const [filters, setFilters] = useState<PropertySearchFilters>({})
  const [sort, setSort] = useState<SortOption>('recent')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [results, setResults] = useState<Property[]>([])
  const [isSearching, setIsSearching] = useState(true)
  const [searchError, setSearchError] = useState<string | null>(null)

  // Fetch from Supabase whenever the query/filters/sort change (debounced).
  useEffect(() => {
    let cancelled = false
    setIsSearching(true)
    const t = setTimeout(async () => {
      try {
        const searchQuery = { ...searchService.buildSearchQuery(query, filters), ...SORT_MAP[sort] }
        const data = await searchService.searchProperties(searchQuery)
        if (!cancelled) { setResults(data); setSearchError(null) }
      } catch (err) {
        if (!cancelled) setSearchError(err instanceof Error ? err.message : 'Error al buscar propiedades')
      } finally {
        if (!cancelled) setIsSearching(false)
      }
    }, query ? 300 : 0)
    return () => { cancelled = true; clearTimeout(t) }
  }, [query, filters, sort])

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
    if (value.length >= 2) {
      setSuggestions(searchService.getSearchSuggestions(value))
    } else {
      setSuggestions([])
    }
  }, [])

  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    setSuggestions([])
    if (value.trim()) searchService.saveRecentSearch(value.trim())
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
    sort,
    setSort,
    results,
    suggestions,
    isSearching,
    searchError,
    activeFilterCount,
    handleQueryChange,
    handleSearch,
    updateFilters,
    clearFilters,
    setSuggestions,
  }
}
