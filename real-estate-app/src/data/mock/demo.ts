/**
 * Demo script showing how to use the mock data generators
 * This file demonstrates the capabilities of the Chilean real estate mock data system
 */

import {
  MockDataFactory,
  QuickMockData,
  generateProperty,
  generateUser,
  sampleDataService,
} from './index';
import {
  PropertyType,
  PropertyOperation,
  UserType,
  ChileanRegion
} from '../models/enums';

/**
 * Demo function to showcase mock data generation
 */
export async function runMockDataDemo(): Promise<void> {
  console.log('🇨🇱 Chilean Real Estate Mock Data Demo');
  console.log('=====================================\n');
  
  // 1. Generate individual items
  console.log('1. Generating individual items...');
  
  const sampleHouse = generateProperty({
    type: PropertyType.HOUSE,
    operation: PropertyOperation.SALE
  });
  console.log('🏠 Sample House:', {
    title: sampleHouse.title,
    price: `${sampleHouse.pricing.price.toLocaleString()} ${sampleHouse.pricing.currency}`,
    location: `${sampleHouse.location.address.city}, ${sampleHouse.location.address.region}`,
    bedrooms: sampleHouse.features.bedrooms,
    area: `${sampleHouse.features.area}m²`
  });
  
  const sampleAgent = generateUser(UserType.AGENT);
  console.log('👨‍💼 Sample Agent:', {
    name: sampleAgent.name,
    email: sampleAgent.email,
    subscription: sampleAgent.subscription.type,
    licenseNumber: sampleAgent.licenseNumber
  });
  
  console.log('\n');
  
  // 2. Generate quick datasets
  console.log('2. Generating quick datasets...');
  
  const devData = QuickMockData.development();
  console.log('🔧 Development Dataset:', {
    properties: devData.properties.length,
    users: devData.users.length,
    cities: Object.keys(devData.statistics.propertiesByCity).length
  });
  
  const santiagoData = QuickMockData.santiago();
  console.log('🏙️ Santiago Dataset:', {
    properties: santiagoData.properties.length,
    users: santiagoData.users.length,
    averagePrice: Math.round(
      santiagoData.properties.reduce((sum, p) => sum + p.pricing.price, 0) / 
      santiagoData.properties.length
    ).toLocaleString()
  });
  
  console.log('\n');
  
  // 3. Custom dataset generation
  console.log('3. Generating custom dataset...');
  
  const customFactory = new MockDataFactory({
    propertyCount: 30,
    userCount: 15,
    cityFocus: ['Valparaíso', 'Viña del Mar'],
    premiumRatio: 0.4
  });
  
  const customData = customFactory.generateDataSet();
  console.log('🎨 Custom Dataset:', {
    properties: customData.properties.length,
    users: customData.users.length,
    premiumListings: customData.statistics.premiumListings,
    cities: Object.keys(customData.statistics.propertiesByCity)
  });
  
  console.log('\n');
  
  // 4. Using the sample data service
  console.log('4. Using Sample Data Service...');
  
  sampleDataService.initialize('testing');
  
  // Search for apartments in Santiago
  const apartments = await sampleDataService.searchProperties({
    filters: {
      type: [PropertyType.APARTMENT],
      // location: {
      //   center: { latitude: -33.4489, longitude: -70.6693 }, // Santiago
      //   radius: 20 // 20km radius
      // }
    },
    sortBy: 'price',
    sortOrder: 'asc',
    limit: 5
  });
  
  console.log('🔍 Search Results - Apartments in Santiago:', 
    apartments.map((apt: any) => ({
      title: apt.title,
      price: `${apt.pricing.price.toLocaleString()} ${apt.pricing.currency}`,
      commune: apt.location.address.commune,
      bedrooms: apt.features.bedrooms,
      area: `${apt.features.area}m²`
    }))
  );
  
  // Get featured properties
  const featured = await sampleDataService.getFeaturedProperties(3);
  console.log('⭐ Featured Properties:', 
    featured.map((prop: any) => ({
      title: prop.title,
      city: prop.location.address.city,
      views: prop.listing.views,
      isPremium: prop.listing.isPremium
    }))
  );
  
  console.log('\n');
  
  // 5. Statistics overview
  console.log('5. Dataset Statistics...');
  
  const stats = sampleDataService.getStatistics();
  console.log('📊 Statistics:', {
    totalProperties: stats.totalProperties,
    totalUsers: stats.totalUsers,
    propertiesByType: stats.propertiesByType,
    propertiesByOperation: stats.propertiesByOperation,
    topCities: Object.entries(stats.propertiesByCity)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([city, count]) => `${city}: ${count}`)
  });
  
  console.log('\n✅ Demo completed successfully!');
}

/**
 * Performance test for mock data generation
 */
export function performanceTest(): void {
  console.log('⚡ Performance Test');
  console.log('==================\n');
  
  const sizes = [10, 50, 100, 500];
  
  sizes.forEach(size => {
    const startTime = Date.now();
    
    const factory = new MockDataFactory({
      propertyCount: size,
      userCount: Math.floor(size / 2)
    });
    
    const data = factory.generateDataSet();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`📈 Generated ${size} properties in ${duration}ms`);
    console.log(`   - Properties: ${data.properties.length}`);
    console.log(`   - Users: ${data.users.length}`);
    console.log(`   - Avg time per property: ${(duration / size).toFixed(2)}ms\n`);
  });
}

/**
 * Data quality validation
 */
export function validateDataQuality(): void {
  console.log('🔍 Data Quality Validation');
  console.log('==========================\n');
  
  const data = QuickMockData.testing();
  const issues: string[] = [];
  
  // Validate properties
  data.properties.forEach((property, index) => {
    if (!property.id || !property.title || !property.description) {
      issues.push(`Property ${index}: Missing required fields`);
    }
    
    if (property.pricing.price <= 0) {
      issues.push(`Property ${index}: Invalid price`);
    }
    
    if (property.features.area <= 0) {
      issues.push(`Property ${index}: Invalid area`);
    }
    
    if (!property.location.latitude || !property.location.longitude) {
      issues.push(`Property ${index}: Invalid coordinates`);
    }
    
    if (property.media.images.length === 0) {
      issues.push(`Property ${index}: No images`);
    }
  });
  
  // Validate users
  data.users.forEach((user, index) => {
    if (!user.id || !user.email || !user.name) {
      issues.push(`User ${index}: Missing required fields`);
    }
    
    if (!user.email.includes('@')) {
      issues.push(`User ${index}: Invalid email format`);
    }
    
    if (user.userType === UserType.AGENT && !user.licenseNumber) {
      issues.push(`User ${index}: Agent missing license number`);
    }
  });
  
  // Report results
  if (issues.length === 0) {
    console.log('✅ All data quality checks passed!');
  } else {
    console.log(`❌ Found ${issues.length} data quality issues:`);
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  console.log(`\n📊 Validation Summary:`);
  console.log(`   - Properties validated: ${data.properties.length}`);
  console.log(`   - Users validated: ${data.users.length}`);
  console.log(`   - Issues found: ${issues.length}`);
  console.log(`   - Success rate: ${((1 - issues.length / (data.properties.length + data.users.length)) * 100).toFixed(1)}%`);
}

// Export demo functions for use in development
export const mockDataDemo = {
  run: runMockDataDemo,
  performance: performanceTest,
  validate: validateDataQuality
};