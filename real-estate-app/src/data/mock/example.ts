/**
 * Example usage of the Chilean Real Estate Mock Data Generators
 * This file demonstrates how to use the mock data system in your application
 */

import { QuickMockData, sampleDataService } from './index';
import { PropertyType, PropertyOperation, UserType } from '../models/enums';

/**
 * Example 1: Generate a quick dataset for development
 */
export function example1_QuickDataset() {
  console.log('🏠 Example 1: Quick Dataset Generation');
  console.log('=====================================');
  
  // Generate a small dataset for development
  const data = QuickMockData.development();
  
  console.log(`Generated ${data.properties.length} properties and ${data.users.length} users`);
  console.log('Statistics:', data.statistics);
  
  // Show a sample property
  const sampleProperty = data.properties[0];
  console.log('\n📋 Sample Property:');
  console.log(`Title: ${sampleProperty.title}`);
  console.log(`Type: ${sampleProperty.type} for ${sampleProperty.operation}`);
  console.log(`Price: ${sampleProperty.pricing.price.toLocaleString()} ${sampleProperty.pricing.currency}`);
  console.log(`Location: ${sampleProperty.location.displayAddress}`);
  console.log(`Area: ${sampleProperty.features.area}m²`);
  console.log(`Bedrooms: ${sampleProperty.features.bedrooms || 'N/A'}`);
  console.log(`Images: ${sampleProperty.media.images.length}`);
  
  // Show a sample user
  const sampleUser = data.users[0];
  console.log('\n👤 Sample User:');
  console.log(`Name: ${sampleUser.name}`);
  console.log(`Type: ${sampleUser.userType}`);
  console.log(`Email: ${sampleUser.email}`);
  console.log(`Subscription: ${sampleUser.subscription.type}`);
  console.log(`Properties owned: ${sampleUser.properties.length}`);
  console.log(`Saved properties: ${sampleUser.savedProperties.length}`);
}

/**
 * Example 2: Using the Sample Data Service
 */
export async function example2_DataService() {
  console.log('\n🔧 Example 2: Sample Data Service');
  console.log('==================================');
  
  // Initialize the service with test data
  sampleDataService.initialize('testing');
  
  // Search for houses in Santiago
  console.log('\n🔍 Searching for houses in Santiago...');
  const houses = await sampleDataService.searchProperties({
    query: 'Santiago',
    filters: {
      type: [PropertyType.HOUSE],
      operation: PropertyOperation.SALE
    },
    sortBy: 'price',
    sortOrder: 'asc',
    limit: 3
  });
  
  console.log(`Found ${houses.length} houses:`);
  houses.forEach((house: any, index: number) => {
    console.log(`${index + 1}. ${house.title}`);
    console.log(`   Price: ${house.pricing.price.toLocaleString()} CLP`);
    console.log(`   Location: ${house.location.address.commune}, ${house.location.address.city}`);
    console.log(`   Area: ${house.features.area}m², ${house.features.bedrooms} bedrooms`);
  });
  
  // Get featured properties
  console.log('\n⭐ Featured Properties:');
  const featured = await sampleDataService.getFeaturedProperties(2);
  featured.forEach((property: any, index: number) => {
    console.log(`${index + 1}. ${property.title}`);
    console.log(`   Views: ${property.listing.views}, Premium: ${property.listing.isPremium}`);
    console.log(`   Location: ${property.location.address.city}`);
  });
  
  // Get properties near a location (Santiago center)
  console.log('\n📍 Properties near Santiago center (5km radius):');
  const nearbyProperties = await sampleDataService.getPropertiesNearLocation(-33.4489, -70.6693, 5);
  console.log(`Found ${nearbyProperties.length} properties within 5km of Santiago center`);
}

/**
 * Example 3: Generate specific types of data
 */
export function example3_SpecificGeneration() {
  console.log('\n🎯 Example 3: Specific Data Generation');
  console.log('======================================');
  
  // Generate specific property types
  const luxuryHouse = QuickMockData.development().properties.find(p => 
    p.type === PropertyType.HOUSE && 
    p.pricing.price > 200000000 && 
    p.location.address.commune === 'Las Condes'
  );
  
  if (luxuryHouse) {
    console.log('\n🏰 Luxury House in Las Condes:');
    console.log(`Title: ${luxuryHouse.title}`);
    console.log(`Price: ${luxuryHouse.pricing.price.toLocaleString()} CLP`);
    console.log(`Features: ${luxuryHouse.features.bedrooms} bed, ${luxuryHouse.features.bathrooms} bath`);
    console.log(`Amenities: Pool: ${luxuryHouse.features.hasPool ? 'Yes' : 'No'}, Garden: ${luxuryHouse.features.hasGarden ? 'Yes' : 'No'}`);
  }
  
  // Generate users by type
  const data = QuickMockData.development();
  const agents = data.users.filter(u => u.userType === UserType.AGENT);
  const companies = data.users.filter(u => u.userType === UserType.COMPANY);
  
  console.log(`\n👨‍💼 Real Estate Professionals:`);
  console.log(`Agents: ${agents.length}`);
  console.log(`Companies: ${companies.length}`);
  
  if (agents.length > 0) {
    const topAgent = agents.sort((a, b) => b.stats.totalListings - a.stats.totalListings)[0];
    console.log(`\nTop Agent: ${topAgent.name}`);
    console.log(`License: ${topAgent.licenseNumber}`);
    console.log(`Properties: ${topAgent.stats.totalListings}`);
    console.log(`Rating: ${topAgent.stats.rating?.toFixed(1) || 'N/A'} stars`);
  }
}

/**
 * Example 4: Regional data analysis
 */
export function example4_RegionalAnalysis() {
  console.log('\n🗺️ Example 4: Regional Data Analysis');
  console.log('====================================');
  
  const data = QuickMockData.demo(); // Larger dataset
  
  // Analyze properties by region
  const regionStats: { [region: string]: { count: number; avgPrice: number; types: { [type: string]: number } } } = {};
  
  data.properties.forEach(property => {
    const region = property.location.address.region;
    if (!regionStats[region]) {
      regionStats[region] = { count: 0, avgPrice: 0, types: {} };
    }
    
    regionStats[region].count++;
    regionStats[region].avgPrice += property.pricing.price;
    
    const type = property.type;
    regionStats[region].types[type] = (regionStats[region].types[type] || 0) + 1;
  });
  
  // Calculate averages
  Object.keys(regionStats).forEach(region => {
    regionStats[region].avgPrice = Math.round(regionStats[region].avgPrice / regionStats[region].count);
  });
  
  // Display top regions by property count
  const topRegions = Object.entries(regionStats)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 5);
  
  console.log('\n📊 Top 5 Regions by Property Count:');
  topRegions.forEach(([region, stats], index) => {
    console.log(`${index + 1}. ${region}`);
    console.log(`   Properties: ${stats.count}`);
    console.log(`   Avg Price: ${stats.avgPrice.toLocaleString()} CLP`);
    console.log(`   Types: ${Object.entries(stats.types).map(([type, count]) => `${type}: ${count}`).join(', ')}`);
  });
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('🇨🇱 Chilean Real Estate Mock Data Examples');
  console.log('===========================================\n');
  
  example1_QuickDataset();
  await example2_DataService();
  example3_SpecificGeneration();
  example4_RegionalAnalysis();
  
  console.log('\n✅ All examples completed successfully!');
  console.log('\n💡 Tips for using mock data in your app:');
  console.log('1. Use QuickMockData.development() for small datasets during development');
  console.log('2. Use sampleDataService for API-like operations with async/await');
  console.log('3. Initialize different datasets based on your testing needs');
  console.log('4. The data includes realistic Chilean addresses, prices, and names');
  console.log('5. All generated data follows Chilean real estate market patterns');
}

// Export for easy testing
export const mockDataExamples = {
  quickDataset: example1_QuickDataset,
  dataService: example2_DataService,
  specificGeneration: example3_SpecificGeneration,
  regionalAnalysis: example4_RegionalAnalysis,
  runAll: runAllExamples
};