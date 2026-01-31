import {
  generateProperty,
  generateAddress,
  generatePropertyLocation,
  RandomGenerator,
  CHILEAN_CITIES,
  CHILEAN_NAMES
} from '../generators';
import { generateUser, generateUsers } from '../userGenerators';
import { PropertyType, PropertyOperation, UserType, ChileanRegion } from '../../models';

describe('Mock Data Generators', () => {
  describe('RandomGenerator', () => {
    it('should generate random integers within range', () => {
      const min = 10;
      const max = 20;
      const result = RandomGenerator.randomInt(min, max);
      
      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThanOrEqual(max);
      expect(Number.isInteger(result)).toBe(true);
    });
    
    it('should generate random floats within range', () => {
      const min = 1.5;
      const max = 2.5;
      const result = RandomGenerator.randomFloat(min, max);
      
      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThanOrEqual(max);
    });
    
    it('should choose random items from array', () => {
      const array = ['a', 'b', 'c'];
      const result = RandomGenerator.randomChoice(array);
      
      expect(array).toContain(result);
    });
    
    it('should generate valid Chilean phone numbers', () => {
      const phone = RandomGenerator.randomPhone();
      
      expect(phone).toMatch(/^\+56 9 \d{4} \d{4}$/);
    });
    
    it('should generate valid email addresses', () => {
      const name = 'Juan Pérez';
      const email = RandomGenerator.randomEmail(name);
      
      expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(email.toLowerCase()).toContain('juan.pérez');
    });
  });
  
  describe('generateAddress', () => {
    it('should generate valid Chilean address', () => {
      const address = generateAddress();
      
      expect(address.street).toBeDefined();
      expect(address.number).toBeDefined();
      expect(address.city).toBeDefined();
      expect(address.region).toBeDefined();
      expect(address.country).toBe('Chile');
      expect(Object.values(ChileanRegion)).toContain(address.region);
    });
    
    it('should generate address for specific city', () => {
      const city = CHILEAN_CITIES[0];
      const address = generateAddress(city);
      
      expect(address.city).toBe(city.name);
      expect(address.region).toBe(city.region);
    });
  });
  
  describe('generatePropertyLocation', () => {
    it('should generate valid property location', () => {
      const location = generatePropertyLocation();
      
      expect(location.latitude).toBeGreaterThan(-60);
      expect(location.latitude).toBeLessThan(-15);
      expect(location.longitude).toBeGreaterThan(-110);
      expect(location.longitude).toBeLessThan(-65);
      expect(location.address).toBeDefined();
      expect(location.displayAddress).toBeDefined();
    });
  });
  
  describe('generateProperty', () => {
    it('should generate valid property', () => {
      const property = generateProperty();
      
      expect(property.id).toBeDefined();
      expect(property.title).toBeDefined();
      expect(property.description).toBeDefined();
      expect(Object.values(PropertyType)).toContain(property.type);
      expect(Object.values(PropertyOperation)).toContain(property.operation);
      expect(property.location).toBeDefined();
      expect(property.pricing).toBeDefined();
      expect(property.features).toBeDefined();
      expect(property.media).toBeDefined();
      expect(property.contact).toBeDefined();
      expect(property.listing).toBeDefined();
    });
    
    it('should generate property with specific type', () => {
      const property = generateProperty({ type: PropertyType.HOUSE });
      
      expect(property.type).toBe(PropertyType.HOUSE);
      expect(property.features.bedrooms).toBeGreaterThan(0);
      expect(property.features.lotSize).toBeGreaterThan(0);
    });
    
    it('should generate property with specific operation', () => {
      const property = generateProperty({ operation: PropertyOperation.RENT });
      
      expect(property.operation).toBe(PropertyOperation.RENT);
      expect(property.pricing.monthlyRent).toBeGreaterThan(0);
    });
    
    it('should generate property for specific city', () => {
      const city = CHILEAN_CITIES.find(c => c.name === 'Santiago');
      const property = generateProperty({ city });
      
      expect(property.location.address.city).toBe('Santiago');
      expect(property.location.address.region).toBe(ChileanRegion.METROPOLITANA);
    });
    
    it('should have valid pricing', () => {
      const property = generateProperty();
      
      expect(property.pricing.price).toBeGreaterThan(0);
      expect(property.pricing.currency).toBeDefined();
      expect(property.pricing.pricePerSquareMeter).toBeGreaterThan(0);
      expect(typeof property.pricing.isNegotiable).toBe('boolean');
    });
    
    it('should have valid features based on type', () => {
      const house = generateProperty({ type: PropertyType.HOUSE });
      const apartment = generateProperty({ type: PropertyType.APARTMENT });
      const land = generateProperty({ type: PropertyType.LAND });
      
      // House should have bedrooms and lot size
      expect(house.features.bedrooms).toBeGreaterThan(0);
      expect(house.features.lotSize).toBeGreaterThan(0);
      
      // Apartment should have bedrooms but no lot size
      expect(apartment.features.bedrooms).toBeGreaterThan(0);
      expect(apartment.features.lotSize).toBeUndefined();
      
      // Land should have no bedrooms
      expect(land.features.bedrooms).toBeUndefined();
    });
    
    it('should have valid media', () => {
      const property = generateProperty();
      
      expect(property.media.images).toBeDefined();
      expect(property.media.images.length).toBeGreaterThan(0);
      expect(property.media.images[0].isMain).toBe(true);
      
      property.media.images.forEach(image => {
        expect(image.id).toBeDefined();
        expect(image.url).toBeDefined();
        expect(image.order).toBeGreaterThanOrEqual(0);
      });
    });
  });
  
  describe('generateUser', () => {
    it('should generate valid user', () => {
      const user = generateUser();
      
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.name).toBeDefined();
      expect(Object.values(UserType)).toContain(user.userType);
      expect(user.subscription).toBeDefined();
      expect(user.preferences).toBeDefined();
      expect(user.stats).toBeDefined();
      expect(user.createdAt).toBeDefined();
      expect(user.isEmailVerified).toBeDefined();
    });
    
    it('should generate user with specific type', () => {
      const agent = generateUser(UserType.AGENT);
      
      expect(agent.userType).toBe(UserType.AGENT);
      expect(agent.licenseNumber).toBeDefined();
      expect(agent.contactInfo).toBeDefined();
      expect(agent.isIdentityVerified).toBeDefined();
    });
    
    it('should generate company user with company info', () => {
      const company = generateUser(UserType.COMPANY);
      
      expect(company.userType).toBe(UserType.COMPANY);
      expect(company.companyName).toBeDefined();
      expect(company.licenseNumber).toBeDefined();
      expect(company.isEmailVerified).toBe(true);
      expect(company.isPhoneVerified).toBe(true);
    });
    
    it('should have valid Chilean names', () => {
      const user = generateUser();
      const nameParts = user.name.split(' ');
      
      expect(nameParts.length).toBeGreaterThanOrEqual(2);
      expect(CHILEAN_NAMES.first).toContain(nameParts[0]);
      expect(CHILEAN_NAMES.last).toContain(nameParts[1]);
    });
  });
  
  describe('generateUsers', () => {
    it('should generate multiple users', () => {
      const users = generateUsers(5);
      
      expect(users).toHaveLength(5);
      users.forEach(user => {
        expect(user.id).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.name).toBeDefined();
      });
    });
    
    it('should generate users of specific type', () => {
      const agents = generateUsers(3, UserType.AGENT);
      
      expect(agents).toHaveLength(3);
      agents.forEach(agent => {
        expect(agent.userType).toBe(UserType.AGENT);
        expect(agent.licenseNumber).toBeDefined();
      });
    });
  });
  
  describe('Data consistency', () => {
    it('should generate consistent property data', () => {
      const property = generateProperty();
      
      // Price per square meter should match price and area
      const expectedPricePerSqm = Math.round(property.pricing.price / property.features.area);
      expect(property.pricing.pricePerSquareMeter).toBe(expectedPricePerSqm);
      
      // Main image should be first in order
      const mainImage = property.media.images.find(img => img.isMain);
      expect(mainImage).toBeDefined();
      expect(mainImage!.order).toBe(0);
      
      // Contact info should have valid format
      expect(property.contact.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(property.contact.phone).toMatch(/^\+56 9 \d{4} \d{4}$/);
    });
    
    it('should generate realistic Chilean data', () => {
      const property = generateProperty();
      
      // Should use Chilean regions
      expect(Object.values(ChileanRegion)).toContain(property.location.address.region);
      
      // Should use Chilean currency primarily
      expect(['CLP', 'USD']).toContain(property.pricing.currency);
      
      // Should have Spanish titles and descriptions
      expect(property.title).toBeDefined();
      expect(property.description).toBeDefined();
    });
  });
});