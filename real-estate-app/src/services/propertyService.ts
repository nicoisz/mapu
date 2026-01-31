import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Property, 
  CreatePropertyRequest,
  PropertySearchQuery,
  PropertySearchFilters,
  PropertyStatus
} from '../data/models';
import { sampleDataService } from '../data/mock/sampleDataService';
import { generateProperty } from '../data/mock/generators';

/**
 * Property service with mock implementation
 * Handles property creation, updates, and management
 */
export class PropertyService {
  private static instance: PropertyService;
  private readonly STORAGE_KEYS = {
    USER_PROPERTIES: '@real_estate_app:user_properties',
  };

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): PropertyService {
    if (!PropertyService.instance) {
      PropertyService.instance = new PropertyService();
    }
    return PropertyService.instance;
  }

  /**
   * Create a new property (mock implementation)
   */
  public async createProperty(
    userId: string, 
    propertyData: CreatePropertyRequest
  ): Promise<Property> {
    try {
      // Simulate network delay
      await this.simulateNetworkDelay();

      // Generate a complete property from the request
      const newProperty = this.createPropertyFromRequest(userId, propertyData);

      // Save to user's properties
      await this.saveUserProperty(userId, newProperty);

      // Update user's remaining listings (mock)
      await this.updateUserListings(userId);

      return newProperty;

    } catch (error) {
      console.error('Error creating property:', error);
      throw new Error('No se pudo crear la propiedad');
    }
  }

  /**
   * Get properties owned by user
   */
  public async getUserProperties(userId: string): Promise<Property[]> {
    try {
      // First try to get from sample data service
      const sampleProperties = await sampleDataService.getUserProperties(userId);
      
      // Then get user-created properties from storage
      const userCreatedProperties = await this.getUserCreatedProperties(userId);
      
      // Combine both lists
      return [...sampleProperties, ...userCreatedProperties];
    } catch (error) {
      console.error('Error getting user properties:', error);
      return [];
    }
  }

  /**
   * Update property
   */
  public async updateProperty(
    propertyId: string, 
    updates: Partial<Property>
  ): Promise<Property> {
    try {
      await this.simulateNetworkDelay();

      // In a real app, this would update the property in the database
      // For now, we'll just simulate the update
      const existingProperty = await this.getPropertyById(propertyId);
      if (!existingProperty) {
        throw new Error('Propiedad no encontrada');
      }

      const updatedProperty = {
        ...existingProperty,
        ...updates,
        listing: {
          ...existingProperty.listing,
          lastUpdated: new Date(),
        }
      };

      return updatedProperty;
    } catch (error) {
      console.error('Error updating property:', error);
      throw new Error('No se pudo actualizar la propiedad');
    }
  }

  /**
   * Delete property
   */
  public async deleteProperty(propertyId: string): Promise<void> {
    try {
      await this.simulateNetworkDelay();
      
      // In a real app, this would delete from the database
      console.log('Property deleted:', propertyId);
    } catch (error) {
      console.error('Error deleting property:', error);
      throw new Error('No se pudo eliminar la propiedad');
    }
  }

  /**
   * Renew expired property (mock premium feature)
   */
  public async renewProperty(propertyId: string): Promise<Property> {
    try {
      await this.simulateNetworkDelay();

      const property = await this.getPropertyById(propertyId);
      if (!property) {
        throw new Error('Propiedad no encontrada');
      }

      // Extend expiration date by 30 days
      const newExpirationDate = new Date();
      newExpirationDate.setDate(newExpirationDate.getDate() + 30);

      const renewedProperty = {
        ...property,
        status: PropertyStatus.ACTIVE,
        listing: {
          ...property.listing,
          expiresAt: newExpirationDate,
          lastUpdated: new Date(),
        }
      };

      return renewedProperty;
    } catch (error) {
      console.error('Error renewing property:', error);
      throw new Error('No se pudo renovar la propiedad');
    }
  }

  /**
   * Get property by ID
   */
  public async getPropertyById(propertyId: string): Promise<Property | null> {
    try {
      // Try sample data service first
      const sampleProperty = await sampleDataService.getPropertyById(propertyId);
      if (sampleProperty) {
        return sampleProperty;
      }

      // Then check user-created properties
      // This would need to be implemented to search through all user properties
      return null;
    } catch (error) {
      console.error('Error getting property by ID:', error);
      return null;
    }
  }

  // Private helper methods

  private async simulateNetworkDelay(ms: number = 1500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private createPropertyFromRequest(
    userId: string, 
    request: CreatePropertyRequest
  ): Property {
    // Generate a base property and override with request data
    const baseProperty = generateProperty();
    
    const now = new Date();
    const expirationDate = new Date();
    expirationDate.setDate(now.getDate() + 30); // 30 days free listing

    return {
      ...baseProperty,
      id: `user_prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: request.title,
      description: request.description,
      type: request.type,
      operation: request.operation,
      location: {
        latitude: request.location.latitude,
        longitude: request.location.longitude,
        address: request.location.address,
      },
      pricing: {
        ...baseProperty.pricing,
        price: request.pricing.price,
        currency: request.pricing.currency,
        isNegotiable: request.pricing.isNegotiable,
      },
      features: {
        ...baseProperty.features,
        ...request.features,
      },
      media: {
        images: request.images.map((url, index) => ({
          id: `img_${index}`,
          url,
          order: index,
          isMain: index === 0,
        })),
        videos: [],
      },
      ownerId: userId,
      listing: {
        ...baseProperty.listing,
        publishedAt: now,
        expiresAt: expirationDate,
        lastUpdated: now,
        views: 0,
        favorites: 0,
        inquiries: 0,
        isPremium: false,
        isHighlighted: false,
        isFeatured: false,
      },
      status: PropertyStatus.ACTIVE,
      tags: request.tags,
    };
  }

  private async saveUserProperty(userId: string, property: Property): Promise<void> {
    try {
      const existingProperties = await this.getUserCreatedProperties(userId);
      const updatedProperties = [...existingProperties, property];
      
      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.USER_PROPERTIES}_${userId}`,
        JSON.stringify(updatedProperties)
      );
    } catch (error) {
      console.error('Error saving user property:', error);
    }
  }

  private async getUserCreatedProperties(userId: string): Promise<Property[]> {
    try {
      const stored = await AsyncStorage.getItem(`${this.STORAGE_KEYS.USER_PROPERTIES}_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting user created properties:', error);
      return [];
    }
  }

  private async updateUserListings(userId: string): Promise<void> {
    try {
      // In a real app, this would update the user's subscription data
      // For now, we'll just log it
      console.log('Updated user listings for:', userId);
    } catch (error) {
      console.error('Error updating user listings:', error);
    }
  }
}

// Export singleton instance
export const propertyService = PropertyService.getInstance();