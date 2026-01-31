import { useState, useCallback, useEffect } from 'react';
import { 
  Property, 
  PropertySearchQuery, 
  PropertySearchFilters 
} from '../data/models/property';
import { searchService } from '../services/searchService';

interface UseSearchResult {
  // Search state
  searchQuery: PropertySearchQuery;
  searchResults: Property[];
  isLoading: boolean;
  error: string | null;
  
  // Search actions
  search: (query: PropertySearchQuery) => Promise<void>;
  clearSearch: () => void;
  
  // Filter state
  filters: PropertySearchFilters;
  setFilters: (filters: PropertySearchFilters) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  
  // Search suggestions
  suggestions: string[];
  getSuggestions: (input: string) => void;
  
  // Search history
  recentSearches: PropertySearchQuery[];
  popularSearches: string[];
  clearHistory: () => void;
}

export const useSearch = (): UseSearchResult => {
  const [searchQuery, setSearchQuery] = useState<PropertySearchQuery>({});
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<PropertySearchFilters>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<PropertySearchQuery[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);

  // Load initial data
  useEffect(() => {
    setRecentSearches(searchService.getRecentSearches());
    setPopularSearches(searchService.getPopularSearches());
  }, []);

  // Search function
  const search = useCallback(async (query: PropertySearchQuery) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Parse search text for implicit filters
      let finalQuery = query;
      if (query.query) {
        const { cleanText, implicitFilters } = searchService.parseSearchText(query.query);
        finalQuery = {
          ...query,
          query: cleanText || undefined,
          filters: {
            ...implicitFilters,
            ...query.filters,
          },
        };
      }

      // Merge with current filters
      if (Object.keys(filters).length > 0) {
        finalQuery = {
          ...finalQuery,
          filters: {
            ...filters,
            ...finalQuery.filters,
          },
        };
      }

      const results = await searchService.searchProperties(finalQuery);
      
      setSearchQuery(finalQuery);
      setSearchResults(results);
      setRecentSearches(searchService.getRecentSearches());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery({});
    setSearchResults([]);
    setError(null);
  }, []);

  // Set filters
  const setFilters = useCallback((newFilters: PropertySearchFilters) => {
    setFiltersState(newFilters);
    
    // If there's an active search, re-run it with new filters
    if (searchQuery.query || Object.keys(searchQuery).length > 0) {
      const updatedQuery = {
        ...searchQuery,
        filters: newFilters,
      };
      search(updatedQuery);
    }
  }, [searchQuery, search]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFiltersState({});
    
    // If there's an active search, re-run it without filters
    if (searchQuery.query || Object.keys(searchQuery).length > 0) {
      const updatedQuery = {
        ...searchQuery,
        filters: undefined,
      };
      search(updatedQuery);
    }
  }, [searchQuery, search]);

  // Check if there are active filters
  const hasActiveFilters = Object.keys(filters).length > 0;

  // Get search suggestions
  const getSuggestions = useCallback((input: string) => {
    const newSuggestions = searchService.getSearchSuggestions(input);
    setSuggestions(newSuggestions);
  }, []);

  // Clear search history
  const clearHistory = useCallback(() => {
    searchService.clearSearchHistory();
    setRecentSearches([]);
  }, []);

  return {
    // Search state
    searchQuery,
    searchResults,
    isLoading,
    error,
    
    // Search actions
    search,
    clearSearch,
    
    // Filter state
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    
    // Search suggestions
    suggestions,
    getSuggestions,
    
    // Search history
    recentSearches,
    popularSearches,
    clearHistory,
  };
};