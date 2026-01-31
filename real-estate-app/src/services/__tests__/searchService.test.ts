import { searchService } from '../searchService';
import { PropertyType, PropertyOperation } from '../../data/models/enums';

describe('SearchService', () => {
  beforeEach(() => {
    // Clear search history before each test
    searchService.clearSearchHistory();
  });

  describe('parseSearchText', () => {
    it('should extract property type from search text', () => {
      const result = searchService.parseSearchText('casa en santiago');
      
      expect(result.cleanText).toBe('en santiago');
      expect(result.implicitFilters.type).toEqual([PropertyType.HOUSE]);
    });

    it('should extract operation from search text', () => {
      const result = searchService.parseSearchText('departamento en venta');
      
      expect(result.cleanText).toBe('en');
      expect(result.implicitFilters.type).toEqual([PropertyType.APARTMENT]);
      expect(result.implicitFilters.operation).toBe(PropertyOperation.SALE);
    });

    it('should extract bedroom count from search text', () => {
      const result = searchService.parseSearchText('3 dormitorios en providencia');
      
      expect(result.cleanText).toBe('s en providencia');
      expect(result.implicitFilters.bedrooms).toEqual({ min: 3, max: 3 });
    });

    it('should handle multiple filters in one search', () => {
      const result = searchService.parseSearchText('casa 2 dormitorios arriendo las condes');
      
      expect(result.cleanText).toBe('s las condes');
      expect(result.implicitFilters.type).toEqual([PropertyType.HOUSE]);
      expect(result.implicitFilters.operation).toBe(PropertyOperation.RENT);
      expect(result.implicitFilters.bedrooms).toEqual({ min: 2, max: 2 });
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return popular searches for empty input', () => {
      const suggestions = searchService.getSearchSuggestions('');
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).toContain('Santiago Centro');
    });

    it('should return location suggestions for partial input', () => {
      const suggestions = searchService.getSearchSuggestions('sant');
      
      expect(suggestions).toContain('Santiago');
    });

    it('should return property type suggestions', () => {
      const suggestions = searchService.getSearchSuggestions('casa');
      
      expect(suggestions).toContain('Casa');
    });

    it('should limit suggestions to 8 items', () => {
      const suggestions = searchService.getSearchSuggestions('a');
      
      expect(suggestions.length).toBeLessThanOrEqual(8);
    });
  });

  describe('buildSearchQuery', () => {
    it('should build query with text only', () => {
      const query = searchService.buildSearchQuery('santiago');
      
      expect(query.query).toBe('santiago');
      expect(query.filters).toBeUndefined();
    });

    it('should build query with text and filters', () => {
      const filters = { type: [PropertyType.HOUSE] };
      const query = searchService.buildSearchQuery('santiago', filters);
      
      expect(query.query).toBe('santiago');
      expect(query.filters).toEqual(filters);
    });

    it('should handle empty text', () => {
      const query = searchService.buildSearchQuery('');
      
      expect(query.query).toBeUndefined();
    });
  });

  describe('getPopularSearches', () => {
    it('should return array of popular search terms', () => {
      const popular = searchService.getPopularSearches();
      
      expect(Array.isArray(popular)).toBe(true);
      expect(popular.length).toBeGreaterThan(0);
      expect(popular).toContain('Santiago Centro');
      expect(popular).toContain('Las Condes');
    });
  });

  describe('search history', () => {
    it('should start with empty history', () => {
      const recent = searchService.getRecentSearchTerms();
      expect(recent).toEqual([]);
    });

    it('should clear history', () => {
      searchService.clearSearchHistory();
      const recent = searchService.getRecentSearchTerms();
      expect(recent).toEqual([]);
    });
  });
});