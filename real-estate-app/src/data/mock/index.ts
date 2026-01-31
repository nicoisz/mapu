// Mock data generators for the Chilean Real Estate Mobile App
// This module provides comprehensive mock data generation for development, testing, and demo purposes

// Core generators
export * from './generators';
export * from './userGenerators';
export * from './locationGenerators';

// Main factory
export * from './mockDataFactory';

// Sample data service
export * from './sampleDataService';

// Quick access to common mock data sets
export { QuickMockData as MockData } from './mockDataFactory';

// Utility functions for working with mock data
export { RandomGenerator } from './generators';

// Constants for Chilean market data
export { 
  CHILEAN_CITIES,
  CHILEAN_STREETS,
  PROPERTY_TITLES,
  PROPERTY_DESCRIPTIONS,
  CHILEAN_NAMES,
  REAL_ESTATE_COMPANIES
} from './generators';

export {
  MAJOR_CHILEAN_CITIES,
  PREMIUM_NEIGHBORHOODS
} from './locationGenerators';

/**
 * Quick start guide for using mock data:
 * 
 * 1. For development:
 *    import { MockData } from '@/data/mock';
 *    const data = MockData.development();
 * 
 * 2. For testing:
 *    import { MockData } from '@/data/mock';
 *    const data = MockData.testing();
 * 
 * 3. For custom generation:
 *    import { MockDataFactory } from '@/data/mock';
 *    const factory = new MockDataFactory({ propertyCount: 50, userCount: 20 });
 *    const data = factory.generateDataSet();
 * 
 * 4. For specific properties:
 *    import { generateProperty, PropertyType, PropertyOperation } from '@/data/mock';
 *    const house = generateProperty({ type: PropertyType.HOUSE, operation: PropertyOperation.SALE });
 * 
 * 5. For specific users:
 *    import { generateUser, UserType } from '@/data/mock';
 *    const agent = generateUser(UserType.AGENT);
 */