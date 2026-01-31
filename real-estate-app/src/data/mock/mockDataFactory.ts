import {
  Property,
  User,
  PropertyType,
  PropertyOperation,
  UserType
} from '../models';
import { generateProperty, RandomGenerator, CHILEAN_CITIES } from './generators';
import { generateUser, generateUsers, updateUserWithProperties } from './userGenerators';
import { 
  generateCityDistribution, 
  MAJOR_CHILEAN_CITIES,
  getCityInfo 
} from './locationGenerators';

/**
 * Configuration for mock data generation
 */
export interface MockDataConfig {
  propertyCount: number;
  userCount: number;
  userDistribution?: {
    individuals: number;
    agents: number;
    companies: number;
  };
  cityFocus?: string[]; // Focus on specific cities
  includeExpiredListings?: boolean;
  premiumRatio?: number; // Ratio of premium listings (0-1)
}

/**
 * Default configuration for mock data
 */
export const DEFAULT_MOCK_CONFIG: MockDataConfig = {
  propertyCount: 100,
  userCount: 50,
  userDistribution: {
    individuals: 35, // 70%
    agents: 12,      // 24%
    companies: 3     // 6%
  },
  cityFocus: ['Santiago', 'Valparaíso', 'Viña del Mar', 'Concepción'],
  includeExpiredListings: true,
  premiumRatio: 0.3
};

/**
 * Generated mock data structure
 */
export interface MockDataSet {
  properties: Property[];
  users: User[];
  statistics: {
    totalProperties: number;
    totalUsers: number;
    propertiesByType: Record<PropertyType, number>;
    propertiesByOperation: Record<PropertyOperation, number>;
    propertiesByCity: Record<string, number>;
    usersByType: Record<UserType, number>;
    premiumListings: number;
    activeListings: number;
  };
}

/**
 * Main factory class for generating mock data
 */
export class MockDataFactory {
  private config: MockDataConfig;
  
  constructor(config: Partial<MockDataConfig> = {}) {
    this.config = { ...DEFAULT_MOCK_CONFIG, ...config };
  }
  
  /**
   * Generate complete mock dataset
   */
  public generateDataSet(): MockDataSet {
    console.log('🏗️  Generating mock data for Chilean real estate app...');
    
    // Generate users first
    const users = this.generateUsers();
    console.log(`👥 Generated ${users.length} users`);
    
    // Generate properties and assign to users
    const { properties, updatedUsers } = this.generatePropertiesWithOwnership(users);
    console.log(`🏠 Generated ${properties.length} properties`);
    
    // Generate statistics
    const statistics = this.generateStatistics(properties, updatedUsers);
    
    console.log('✅ Mock data generation complete!');
    console.log(`📊 Statistics:`, statistics);
    
    return {
      properties,
      users: updatedUsers,
      statistics
    };
  }
  
  /**
   * Generate users based on configuration
   */
  private generateUsers(): User[] {
    const { userCount, userDistribution } = this.config;
    const users: User[] = [];
    
    if (userDistribution) {
      // Generate specific distribution
      users.push(...generateUsers(userDistribution.individuals, UserType.INDIVIDUAL));
      users.push(...generateUsers(userDistribution.agents, UserType.AGENT));
      users.push(...generateUsers(userDistribution.companies, UserType.COMPANY));
    } else {
      // Generate random distribution
      for (let i = 0; i < userCount; i++) {
        users.push(generateUser());
      }
    }
    
    return users;
  }
  
  /**
   * Generate properties and assign ownership to users
   */
  private generatePropertiesWithOwnership(users: User[]): { properties: Property[], updatedUsers: User[] } {
    const { propertyCount, cityFocus, includeExpiredListings, premiumRatio } = this.config;
    const properties: Property[] = [];
    
    // Distribute properties across cities
    const cityDistribution = this.generateCityDistribution();
    
    // Generate properties for each city
    for (const [cityName, count] of Object.entries(cityDistribution)) {
      const cityInfo = getCityInfo(cityName);
      
      for (let i = 0; i < count; i++) {
        const property = this.generatePropertyForCity(cityName, cityInfo);
        properties.push(property);
      }
    }
    
    // Assign ownership to users
    const updatedUsers = this.assignPropertyOwnership(users, properties);
    
    // Update property owner IDs
    properties.forEach(property => {
      const owner = updatedUsers.find(user => user.properties.includes(property.id));
      if (owner) {
        property.ownerId = owner.id;
      }
    });
    
    return { properties, updatedUsers };
  }
  
  /**
   * Generate city distribution for properties
   */
  private generateCityDistribution(): Record<string, number> {
    const { propertyCount, cityFocus } = this.config;
    
    if (cityFocus && cityFocus.length > 0) {
      // Focus on specific cities
      const distribution: Record<string, number> = {};
      const perCity = Math.floor(propertyCount / cityFocus.length);
      const remainder = propertyCount % cityFocus.length;
      
      cityFocus.forEach((city, index) => {
        distribution[city] = perCity + (index < remainder ? 1 : 0);
      });
      
      return distribution;
    } else {
      // Use population-based distribution
      return generateCityDistribution(propertyCount);
    }
  }
  
  /**
   * Generate property for specific city
   */
  private generatePropertyForCity(cityName: string, cityInfo?: typeof MAJOR_CHILEAN_CITIES[0]): Property {
    // Find city in CHILEAN_CITIES array
    const city = CHILEAN_CITIES.find(c => c.name === cityName) || CHILEAN_CITIES[0];
    
    // Determine property type based on city characteristics
    const type = this.selectPropertyTypeForCity(cityName);
    const operation = RandomGenerator.randomChoice([PropertyOperation.SALE, PropertyOperation.RENT]);
    
    const property = generateProperty({
      type,
      operation,
      city
    });
    
    // Apply city-specific adjustments
    if (cityInfo) {
      this.applyCityPriceAdjustments(property, cityInfo);
    }
    
    return property;
  }
  
  /**
   * Select appropriate property type for city
   */
  private selectPropertyTypeForCity(cityName: string): PropertyType {
    // Urban areas have more apartments, suburban areas have more houses
    const urbanCities = ['Santiago', 'Valparaíso', 'Concepción', 'Antofagasta'];
    const isUrban = urbanCities.includes(cityName);
    
    if (isUrban) {
      return RandomGenerator.randomChoice([
        PropertyType.APARTMENT,
        PropertyType.APARTMENT, // Weight towards apartments
        PropertyType.HOUSE,
        PropertyType.LAND
      ]);
    } else {
      return RandomGenerator.randomChoice([
        PropertyType.HOUSE,
        PropertyType.HOUSE, // Weight towards houses
        PropertyType.APARTMENT,
        PropertyType.LAND
      ]);
    }
  }
  
  /**
   * Apply city-specific price adjustments
   */
  private applyCityPriceAdjustments(property: Property, cityInfo: typeof MAJOR_CHILEAN_CITIES[0]): void {
    const averagePrice = cityInfo.averagePrice[property.type];
    const targetPrice = property.operation === PropertyOperation.SALE ? 
      averagePrice.sale : averagePrice.rent;
    
    if (targetPrice > 0) {
      // Adjust price to be within reasonable range of city average
      const variance = 0.4; // 40% variance
      const minPrice = targetPrice * (1 - variance);
      const maxPrice = targetPrice * (1 + variance);
      
      property.pricing.price = RandomGenerator.randomInt(minPrice, maxPrice);
      
      if (property.operation === PropertyOperation.RENT && property.pricing.monthlyRent) {
        property.pricing.monthlyRent = property.pricing.price;
        property.pricing.deposit = Math.round(property.pricing.price * RandomGenerator.randomFloat(1, 2));
      }
      
      // Recalculate price per square meter
      property.pricing.pricePerSquareMeter = Math.round(property.pricing.price / property.features.area);
    }
  }
  
  /**
   * Assign property ownership to users
   */
  private assignPropertyOwnership(users: User[], properties: Property[]): User[] {
    const updatedUsers = [...users];
    const availableProperties = [...properties];
    
    // Agents and companies get more properties
    const professionalUsers = updatedUsers.filter(user => 
      user.userType === UserType.AGENT || user.userType === UserType.COMPANY
    );
    
    const individualUsers = updatedUsers.filter(user => 
      user.userType === UserType.INDIVIDUAL
    );
    
    // Assign properties to professional users first
    professionalUsers.forEach(user => {
      const maxProperties = user.userType === UserType.COMPANY ? 
        RandomGenerator.randomInt(3, 15) : // Companies: 3-15 properties
        RandomGenerator.randomInt(2, 8);   // Agents: 2-8 properties
      
      const propertyCount = Math.min(maxProperties, availableProperties.length);
      const userProperties: string[] = [];
      
      for (let i = 0; i < propertyCount; i++) {
        if (availableProperties.length === 0) break;
        
        const propertyIndex = RandomGenerator.randomInt(0, availableProperties.length - 1);
        const property = availableProperties.splice(propertyIndex, 1)[0];
        userProperties.push(property.id);
      }
      
      user.properties = userProperties;
    });
    
    // Assign remaining properties to individuals
    individualUsers.forEach(user => {
      if (availableProperties.length === 0) return;
      
      // Most individuals have 0-1 properties, some have 2-3
      const maxProperties = RandomGenerator.randomBoolean(0.7) ? 
        RandomGenerator.randomInt(0, 1) : 
        RandomGenerator.randomInt(2, 3);
      
      const propertyCount = Math.min(maxProperties, availableProperties.length);
      const userProperties: string[] = [];
      
      for (let i = 0; i < propertyCount; i++) {
        if (availableProperties.length === 0) break;
        
        const propertyIndex = RandomGenerator.randomInt(0, availableProperties.length - 1);
        const property = availableProperties.splice(propertyIndex, 1)[0];
        userProperties.push(property.id);
      }
      
      user.properties = userProperties;
    });
    
    // Generate saved properties for users
    updatedUsers.forEach(user => {
      const savedCount = RandomGenerator.randomInt(0, 10);
      const savedProperties: string[] = [];
      
      for (let i = 0; i < savedCount; i++) {
        const randomProperty = RandomGenerator.randomChoice(properties);
        if (!savedProperties.includes(randomProperty.id) && !user.properties.includes(randomProperty.id)) {
          savedProperties.push(randomProperty.id);
        }
      }
      
      user.savedProperties = savedProperties;
    });
    
    return updatedUsers;
  }
  
  /**
   * Generate statistics for the dataset
   */
  private generateStatistics(properties: Property[], users: User[]): MockDataSet['statistics'] {
    const propertiesByType = properties.reduce((acc, property) => {
      acc[property.type] = (acc[property.type] || 0) + 1;
      return acc;
    }, {} as Record<PropertyType, number>);
    
    const propertiesByOperation = properties.reduce((acc, property) => {
      acc[property.operation] = (acc[property.operation] || 0) + 1;
      return acc;
    }, {} as Record<PropertyOperation, number>);
    
    const propertiesByCity = properties.reduce((acc, property) => {
      const city = property.location.address.city;
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const usersByType = users.reduce((acc, user) => {
      acc[user.userType] = (acc[user.userType] || 0) + 1;
      return acc;
    }, {} as Record<UserType, number>);
    
    const premiumListings = properties.filter(p => p.listing.isPremium).length;
    const activeListings = properties.filter(p => p.status === 'active').length;
    
    return {
      totalProperties: properties.length,
      totalUsers: users.length,
      propertiesByType,
      propertiesByOperation,
      propertiesByCity,
      usersByType,
      premiumListings,
      activeListings
    };
  }
}

/**
 * Quick generation functions for common use cases
 */
export class QuickMockData {
  /**
   * Generate small dataset for development
   */
  static development(): MockDataSet {
    const factory = new MockDataFactory({
      propertyCount: 20,
      userCount: 10,
      cityFocus: ['Santiago', 'Valparaíso']
    });
    return factory.generateDataSet();
  }
  
  /**
   * Generate medium dataset for testing
   */
  static testing(): MockDataSet {
    const factory = new MockDataFactory({
      propertyCount: 50,
      userCount: 25,
      cityFocus: ['Santiago', 'Valparaíso', 'Viña del Mar', 'Concepción']
    });
    return factory.generateDataSet();
  }
  
  /**
   * Generate large dataset for demo
   */
  static demo(): MockDataSet {
    const factory = new MockDataFactory({
      propertyCount: 200,
      userCount: 80
    });
    return factory.generateDataSet();
  }
  
  /**
   * Generate Santiago-focused dataset
   */
  static santiago(): MockDataSet {
    const factory = new MockDataFactory({
      propertyCount: 100,
      userCount: 40,
      cityFocus: ['Santiago']
    });
    return factory.generateDataSet();
  }
  
  /**
   * Generate coastal cities dataset
   */
  static coastal(): MockDataSet {
    const factory = new MockDataFactory({
      propertyCount: 80,
      userCount: 30,
      cityFocus: ['Valparaíso', 'Viña del Mar', 'La Serena', 'Antofagasta']
    });
    return factory.generateDataSet();
  }
}

/**
 * Export default factory instance
 */
export const mockDataFactory = new MockDataFactory();