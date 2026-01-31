import { PropertyService } from '../propertyService';
import { PropertyType, PropertyOperation, Currency, ChileanRegion } from '../../data/models/enums';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock sample data service
jest.mock('../../data/mock/sampleDataService', () => ({
  sampleDataService: {
    getUserProperties: jest.fn().mockResolvedValue([]),
  },
}));

describe('PropertyService', () => {
  let propertyService: PropertyService;

  beforeEach(() => {
    propertyService = PropertyService.getInstance();
    jest.clearAllMocks();
  });

  it('should create a property successfully', async () => {
    const userId = 'user123';
    const propertyData = {
      title: 'Casa de Prueba',
      description: 'Una hermosa casa para pruebas',
      type: PropertyType.HOUSE,
      operation: PropertyOperation.SALE,
      location: {
        latitude: -33.4489,
        longitude: -70.6693,
        address: {
          street: 'Av. Providencia 1234',
          city: 'Santiago',
          region: ChileanRegion.METROPOLITANA,
          country: 'Chile' as const,
          postalCode: '',
          commune: '',
        }
      },
      pricing: {
        price: 150000000,
        currency: Currency.CLP,
        isNegotiable: true,
      },
      features: {
        area: 120,
        bedrooms: 3,
        bathrooms: 2,
        parkingSpots: 1,
      },
      images: ['https://example.com/image1.jpg'],
    };

    const result = await propertyService.createProperty(userId, propertyData);

    expect(result).toBeDefined();
    expect(result.title).toBe('Casa de Prueba');
    expect(result.type).toBe(PropertyType.HOUSE);
    expect(result.operation).toBe(PropertyOperation.SALE);
    expect(result.ownerId).toBe(userId);
    expect(result.status).toBe('active');
  });

  it('should get user properties', async () => {
    const userId = 'user123';
    
    const result = await propertyService.getUserProperties(userId);
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return singleton instance', () => {
    const instance1 = PropertyService.getInstance();
    const instance2 = PropertyService.getInstance();
    
    expect(instance1).toBe(instance2);
  });
});