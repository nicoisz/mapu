import {
  Property,
  User,
  PropertySearchQuery,
  PropertySearchFilters,
  PropertyType,
  PropertyOperation,
  Currency,
  ChileanRegion
} from '../models';
import { MockDataFactory, QuickMockData, MockDataSet } from './mockDataFactory';
import { RandomGenerator } from './generators';

/**
 * Sample data service that provides mock data for the application
 * This service simulates API calls and provides realistic Chilean real estate data
 */
export class SampleDataService {
  private static instance: SampleDataService;
  private mockData: MockDataSet;
  
  private constructor() {
    // Initialize with development dataset
    this.mockData = QuickMockData.development();
  }
  
  public static getInstance(): SampleDataService {
    if (!SampleDataService.instance) {
      SampleDataService.instance = new SampleDataService();
    }
    return SampleDataService.instance;
  }
  
  /**
   * Initialize with specific dataset
   */
  public initialize(datasetType: 'development' | 'testing' | 'demo' | 'santiago' | 'coastal' = 'development'): void {
    switch (datasetType) {
      case 'development':
        this.mockData = QuickMockData.development();
        break;
      case 'testing':
        this.mockData = QuickMockData.testing();
        break;
      case 'demo':
        this.mockData = QuickMockData.demo();
        break;
      case 'santiago':
        this.mockData = QuickMockData.santiago();
        break;
      case 'coastal':
        this.mockData = QuickMockData.coastal();
        break;
    }
    
    console.log(`📊 Initialized SampleDataService with ${datasetType} dataset:`, {
      properties: this.mockData.properties.length,
      users: this.mockData.users.length,
      statistics: this.mockData.statistics
    });
  }
  
  /**
   * Get all properties
   */
  public async getProperties(): Promise<Property[]> {
    // Simulate API delay
    await this.simulateDelay();
    return [...this.mockData.properties];
  }
  
  /**
   * Get property by ID
   */
  public async getPropertyById(id: string): Promise<Property | null> {
    await this.simulateDelay();
    return this.mockData.properties.find(p => p.id === id) || null;
  }
  
  /**
   * Search properties with filters
   */
  public async searchProperties(query: PropertySearchQuery): Promise<Property[]> {
    await this.simulateDelay();
    
    let results = [...this.mockData.properties];
    
    // Apply text search
    if (query.query) {
      const searchTerm = query.query.toLowerCase();
      results = results.filter(property => 
        property.title.toLowerCase().includes(searchTerm) ||
        property.description.toLowerCase().includes(searchTerm) ||
        property.location.address.city.toLowerCase().includes(searchTerm) ||
        property.location.address.commune?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply filters
    if (query.filters) {
      results = this.applyFilters(results, query.filters);
    }
    
    // Apply sorting
    if (query.sortBy) {
      results = this.sortProperties(results, query.sortBy, query.sortOrder || 'desc');
    }
    
    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || results.length;
    
    return results.slice(offset, offset + limit);
  }
  
  /**
   * Get properties near location
   */
  public async getPropertiesNearLocation(
    latitude: number, 
    longitude: number, 
    radiusKm: number = 5
  ): Promise<Property[]> {
    await this.simulateDelay();
    
    return this.mockData.properties.filter(property => {
      const distance = this.calculateDistance(
        { latitude, longitude },
        { 
          latitude: property.location.latitude, 
          longitude: property.location.longitude 
        }
      );
      return distance <= radiusKm;
    });
  }
  
  /**
   * Get user by ID
   */
  public async getUserById(id: string): Promise<User | null> {
    await this.simulateDelay();
    return this.mockData.users.find(u => u.id === id) || null;
  }
  
  /**
   * Get properties owned by user
   */
  public async getUserProperties(userId: string): Promise<Property[]> {
    await this.simulateDelay();
    
    const user = this.mockData.users.find(u => u.id === userId);
    if (!user) return [];
    
    return this.mockData.properties.filter(p => user.properties.includes(p.id));
  }
  
  /**
   * Get user's saved properties
   */
  public async getUserSavedProperties(userId: string): Promise<Property[]> {
    await this.simulateDelay();
    
    const user = this.mockData.users.find(u => u.id === userId);
    if (!user) return [];
    
    return this.mockData.properties.filter(p => user.savedProperties.includes(p.id));
  }
  
  /**
   * Get featured properties
   */
  public async getFeaturedProperties(limit: number = 10): Promise<Property[]> {
    await this.simulateDelay();
    
    const featured = this.mockData.properties
      .filter(p => p.listing.isFeatured)
      .sort((a, b) => b.listing.views - a.listing.views)
      .slice(0, limit);
    
    return featured;
  }
  
  /**
   * Get recent properties
   */
  public async getRecentProperties(limit: number = 10): Promise<Property[]> {
    await this.simulateDelay();
    
    const recent = this.mockData.properties
      .filter(p => p.status === 'active')
      .sort((a, b) => b.listing.publishedAt.getTime() - a.listing.publishedAt.getTime())
      .slice(0, limit);
    
    return recent;
  }
  
  /**
   * Get properties by city
   */
  public async getPropertiesByCity(city: string): Promise<Property[]> {
    await this.simulateDelay();
    
    return this.mockData.properties.filter(p => 
      p.location.address.city.toLowerCase() === city.toLowerCase()
    );
  }
  
  /**
   * Get properties by region
   */
  public async getPropertiesByRegion(region: ChileanRegion): Promise<Property[]> {
    await this.simulateDelay();
    
    return this.mockData.properties.filter(p => p.location.address.region === region);
  }
  
  /**
   * Get dataset statistics
   */
  public getStatistics(): MockDataSet['statistics'] {
    return this.mockData.statistics;
  }
  
  /**
   * Refresh dataset with new mock data
   */
  public async refreshData(config?: ConstructorParameters<typeof MockDataFactory>[0]): Promise<void> {
    const factory = new MockDataFactory(config);
    this.mockData = factory.generateDataSet();
  }
  
  // Private helper methods
  
  private async simulateDelay(minMs: number = 100, maxMs: number = 500): Promise<void> {
    const delay = RandomGenerator.randomInt(minMs, maxMs);
    return new Promise(resolve => setTimeout(resolve, delay));
  }
  
  private applyFilters(properties: Property[], filters: PropertySearchFilters): Property[] {
    let results = properties;
    
    if (filters.operation) {
      results = results.filter(p => p.operation === filters.operation);
    }
    
    if (filters.type && filters.type.length > 0) {
      results = results.filter(p => filters.type!.includes(p.type));
    }
    
    if (filters.priceRange) {
      const { min, max, currency } = filters.priceRange;
      results = results.filter(p => {
        if (p.pricing.currency !== currency) return false;
        return p.pricing.price >= min && p.pricing.price <= max;
      });
    }
    
    if (filters.areaRange) {
      const { min, max } = filters.areaRange;
      results = results.filter(p => 
        p.features.area >= min && p.features.area <= max
      );
    }
    
    if (filters.bedrooms) {
      const { min, max } = filters.bedrooms;
      results = results.filter(p => {
        const bedrooms = p.features.bedrooms || 0;
        return (!min || bedrooms >= min) && (!max || bedrooms <= max);
      });
    }
    
    if (filters.bathrooms) {
      const { min, max } = filters.bathrooms;
      results = results.filter(p => {
        const bathrooms = p.features.bathrooms || 0;
        return (!min || bathrooms >= min) && (!max || bathrooms <= max);
      });
    }
    
    if (filters.isPremium !== undefined) {
      results = results.filter(p => p.listing.isPremium === filters.isPremium);
    }
    
    if (filters.publishedAfter) {
      results = results.filter(p => p.listing.publishedAt >= filters.publishedAfter!);
    }
    
    if (filters.location) {
      const { center, radius } = filters.location;
      results = results.filter(p => {
        const distance = this.calculateDistance(center, {
          latitude: p.location.latitude,
          longitude: p.location.longitude
        });
        return distance <= radius;
      });
    }
    
    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(p => 
        p.tags && filters.tags!.some(tag => p.tags!.includes(tag))
      );
    }
    
    return results;
  }
  
  private sortProperties(
    properties: Property[], 
    sortBy: 'price' | 'date' | 'area' | 'relevance',
    order: 'asc' | 'desc'
  ): Property[] {
    const sorted = [...properties];
    
    sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'price':
          comparison = a.pricing.price - b.pricing.price;
          break;
        case 'date':
          comparison = a.listing.publishedAt.getTime() - b.listing.publishedAt.getTime();
          break;
        case 'area':
          comparison = a.features.area - b.features.area;
          break;
        case 'relevance':
          // Sort by views and premium status
          const aScore = a.listing.views + (a.listing.isPremium ? 1000 : 0);
          const bScore = b.listing.views + (b.listing.isPremium ? 1000 : 0);
          comparison = aScore - bScore;
          break;
      }
      
      return order === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }
  
  private calculateDistance(
    coord1: { latitude: number; longitude: number },
    coord2: { latitude: number; longitude: number }
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const dLng = (coord2.longitude - coord1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

// Export singleton instance
export const sampleDataService = SampleDataService.getInstance();