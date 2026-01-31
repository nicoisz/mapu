import { 
  Property, 
  PropertySearchQuery, 
  PropertySearchFilters
} from '../data/models/property';
import { PropertyType, PropertyOperation } from '../data/models/enums';
import { sampleDataService } from '../data/mock/sampleDataService';

/**
 * Search service for property discovery
 * Handles search queries, filtering, and result processing
 */
export class SearchService {
  private static instance: SearchService;
  private searchHistory: string[] = [];
  private recentSearches: PropertySearchQuery[] = [];

  private constructor() {}

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  /**
   * Search properties with text query and filters
   */
  public async searchProperties(query: PropertySearchQuery): Promise<Property[]> {
    try {
      // Use the existing sample data service for search
      const results = await sampleDataService.searchProperties(query);
      
      // Add to search history if there's a text query
      if (query.query && query.query.trim()) {
        this.addToSearchHistory(query.query.trim());
      }
      
      // Add to recent searches
      this.addToRecentSearches(query);
      
      return results;
    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Failed to search properties');
    }
  }

  /**
   * Get search suggestions based on input
   */
  public getSearchSuggestions(input: string): string[] {
    if (!input || input.length < 2) {
      return this.getRecentSearchTerms().length > 0 
        ? this.getRecentSearchTerms() 
        : this.getPopularSearches().slice(0, 5);
    }

    const inputLower = input.toLowerCase();
    const suggestions: string[] = [];

    // Add location suggestions
    const locationSuggestions = this.getLocationSuggestions(inputLower);
    suggestions.push(...locationSuggestions);

    // Add property type suggestions
    const typeSuggestions = this.getPropertyTypeSuggestions(inputLower);
    suggestions.push(...typeSuggestions);

    // Add from search history
    const historySuggestions = this.searchHistory
      .filter(term => term.toLowerCase().includes(inputLower))
      .slice(0, 3);
    suggestions.push(...historySuggestions);

    // Remove duplicates and limit results
    return [...new Set(suggestions)].slice(0, 8);
  }

  /**
   * Get popular search terms
   */
  public getPopularSearches(): string[] {
    return [
      'Santiago Centro',
      'Las Condes',
      'Providencia',
      'Ñuñoa',
      'Departamento 2 dormitorios',
      'Casa con jardín',
      'Oficina comercial',
      'Terreno industrial',
    ];
  }

  /**
   * Get recent search terms
   */
  public getRecentSearchTerms(): string[] {
    return this.searchHistory.slice(-5).reverse();
  }

  /**
   * Get recent search queries
   */
  public getRecentSearches(): PropertySearchQuery[] {
    return this.recentSearches.slice(-10).reverse();
  }

  /**
   * Clear search history
   */
  public clearSearchHistory(): void {
    this.searchHistory = [];
    this.recentSearches = [];
  }

  /**
   * Build search query from text input
   */
  public buildSearchQuery(
    text: string,
    filters?: PropertySearchFilters
  ): PropertySearchQuery {
    const query: PropertySearchQuery = {};

    if (text && text.trim()) {
      query.query = text.trim();
    }

    if (filters) {
      query.filters = filters;
    }

    return query;
  }

  /**
   * Parse search text for implicit filters
   */
  public parseSearchText(text: string): {
    cleanText: string;
    implicitFilters: Partial<PropertySearchFilters>;
  } {
    let cleanText = text.toLowerCase();
    const implicitFilters: Partial<PropertySearchFilters> = {};

    // Extract property types
    const typeKeywords = {
      'casa': PropertyType.HOUSE,
      'departamento': PropertyType.APARTMENT,
      'oficina': PropertyType.OFFICE,
      'local': PropertyType.COMMERCIAL,
      'terreno': PropertyType.LAND,
      'bodega': PropertyType.WAREHOUSE,
    };

    for (const [keyword, type] of Object.entries(typeKeywords)) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      if (regex.test(cleanText)) {
        implicitFilters.type = [type];
        cleanText = cleanText.replace(regex, '').trim();
        break;
      }
    }

    // Extract operations
    const operationKeywords = {
      'venta': PropertyOperation.SALE,
      'arriendo': PropertyOperation.RENT,
      'alquiler': PropertyOperation.RENT,
    };

    for (const [keyword, operation] of Object.entries(operationKeywords)) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      if (regex.test(cleanText)) {
        implicitFilters.operation = operation;
        cleanText = cleanText.replace(regex, '').trim();
        break;
      }
    }

    // Extract bedroom count
    const bedroomMatch = cleanText.match(/(\d+)\s*dormitorio/);
    if (bedroomMatch) {
      const count = parseInt(bedroomMatch[1]);
      implicitFilters.bedrooms = { min: count, max: count };
      cleanText = cleanText.replace(bedroomMatch[0], '').trim();
    }

    return {
      cleanText: cleanText.replace(/\s+/g, ' ').trim(),
      implicitFilters,
    };
  }

  private addToSearchHistory(term: string): void {
    // Remove if already exists
    this.searchHistory = this.searchHistory.filter(t => t !== term);
    
    // Add to beginning
    this.searchHistory.unshift(term);
    
    // Keep only last 20 searches
    this.searchHistory = this.searchHistory.slice(0, 20);
  }

  private addToRecentSearches(query: PropertySearchQuery): void {
    // Remove similar queries
    this.recentSearches = this.recentSearches.filter(
      q => JSON.stringify(q) !== JSON.stringify(query)
    );
    
    // Add to beginning
    this.recentSearches.unshift(query);
    
    // Keep only last 10 searches
    this.recentSearches = this.recentSearches.slice(0, 10);
  }

  private getLocationSuggestions(input: string): string[] {
    const chileanLocations = [
      'Santiago', 'Las Condes', 'Providencia', 'Ñuñoa', 'La Reina',
      'Vitacura', 'Lo Barnechea', 'Maipú', 'Puente Alto', 'San Miguel',
      'Valparaíso', 'Viña del Mar', 'Concepción', 'La Serena', 'Antofagasta',
      'Temuco', 'Rancagua', 'Talca', 'Arica', 'Iquique',
    ];

    return chileanLocations
      .filter(location => location.toLowerCase().includes(input))
      .slice(0, 5);
  }

  private getPropertyTypeSuggestions(input: string): string[] {
    const typeMap = {
      'casa': 'Casa',
      'departamento': 'Departamento',
      'oficina': 'Oficina',
      'local': 'Local comercial',
      'terreno': 'Terreno',
      'bodega': 'Bodega',
    };

    return Object.entries(typeMap)
      .filter(([key]) => key.includes(input))
      .map(([, value]) => value)
      .slice(0, 3);
  }
}

// Export singleton instance
export const searchService = SearchService.getInstance();