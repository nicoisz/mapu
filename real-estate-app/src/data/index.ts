// Main data layer exports for the Chilean Real Estate Mobile App

// Data models and types
export * from './models';

// Mock data generators and services
export * from './mock';

// API interfaces (when backend is implemented)
export * from './api';

/**
 * Quick access to commonly used data functionality
 */
export { sampleDataService as DataService } from './mock/sampleDataService';
export { MockData } from './mock';

/**
 * Usage examples:
 * 
 * // Get mock data for development
 * import { MockData, DataService } from '@/data';
 * const data = MockData.development();
 * 
 * // Use data service for API-like operations
 * DataService.initialize('development');
 * const properties = await DataService.getProperties();
 * 
 * // Generate specific items
 * import { generateProperty, PropertyType } from '@/data';
 * const house = generateProperty({ type: PropertyType.HOUSE });
 */