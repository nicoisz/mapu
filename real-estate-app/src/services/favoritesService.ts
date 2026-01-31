import AsyncStorage from '@react-native-async-storage/async-storage';
import { Property } from '../data/models/property';

/**
 * Storage keys for favorites
 */
const STORAGE_KEYS = {
  FAVORITES: '@real_estate_app:favorites',
  FAVORITE_IDS: '@real_estate_app:favorite_ids',
} as const;

/**
 * Favorites Service
 * 
 * Handles saving and retrieving user's favorite properties.
 * Uses AsyncStorage for local persistence in the MVP.
 */
export class FavoritesService {
  private static favoriteIds: Set<string> = new Set();
  private static initialized = false;

  /**
   * Initialize the favorites service
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const storedIds = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_IDS);
      if (storedIds) {
        const ids = JSON.parse(storedIds) as string[];
        this.favoriteIds = new Set(ids);
      }
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing favorites service:', error);
      this.favoriteIds = new Set();
      this.initialized = true;
    }
  }

  /**
   * Add a property to favorites
   */
  static async addToFavorites(property: Property): Promise<boolean> {
    await this.initialize();

    try {
      // Add to in-memory set
      this.favoriteIds.add(property.id);

      // Save to storage
      await this.saveFavoriteIds();
      await this.saveFavoriteProperty(property);

      console.log(`Property ${property.id} added to favorites`);
      return true;
    } catch (error) {
      console.error('Error adding property to favorites:', error);
      // Rollback in-memory change
      this.favoriteIds.delete(property.id);
      return false;
    }
  }

  /**
   * Remove a property from favorites
   */
  static async removeFromFavorites(propertyId: string): Promise<boolean> {
    await this.initialize();

    try {
      // Remove from in-memory set
      this.favoriteIds.delete(propertyId);

      // Save to storage
      await this.saveFavoriteIds();
      await this.removeFavoriteProperty(propertyId);

      console.log(`Property ${propertyId} removed from favorites`);
      return true;
    } catch (error) {
      console.error('Error removing property from favorites:', error);
      // Rollback in-memory change
      this.favoriteIds.add(propertyId);
      return false;
    }
  }

  /**
   * Toggle favorite status of a property
   */
  static async toggleFavorite(property: Property): Promise<boolean> {
    const isFavorite = await this.isFavorite(property.id);
    
    if (isFavorite) {
      return this.removeFromFavorites(property.id);
    } else {
      return this.addToFavorites(property);
    }
  }

  /**
   * Check if a property is in favorites
   */
  static async isFavorite(propertyId: string): Promise<boolean> {
    await this.initialize();
    return this.favoriteIds.has(propertyId);
  }

  /**
   * Get all favorite property IDs
   */
  static async getFavoriteIds(): Promise<string[]> {
    await this.initialize();
    return Array.from(this.favoriteIds);
  }

  /**
   * Get all favorite properties
   */
  static async getFavoriteProperties(): Promise<Property[]> {
    await this.initialize();

    try {
      const favoriteProperties: Property[] = [];
      
      for (const propertyId of this.favoriteIds) {
        const property = await this.getFavoriteProperty(propertyId);
        if (property) {
          favoriteProperties.push(property);
        }
      }

      // Sort by date added (most recent first)
      return favoriteProperties.sort((a, b) => 
        new Date(b.listing.publishedAt).getTime() - new Date(a.listing.publishedAt).getTime()
      );
    } catch (error) {
      console.error('Error getting favorite properties:', error);
      return [];
    }
  }

  /**
   * Get count of favorite properties
   */
  static async getFavoriteCount(): Promise<number> {
    await this.initialize();
    return this.favoriteIds.size;
  }

  /**
   * Clear all favorites
   */
  static async clearAllFavorites(): Promise<boolean> {
    try {
      // Clear in-memory data
      const oldFavoriteIds = Array.from(this.favoriteIds);
      this.favoriteIds.clear();

      // Clear storage
      await AsyncStorage.removeItem(STORAGE_KEYS.FAVORITE_IDS);
      
      // Remove individual property data
      for (const propertyId of oldFavoriteIds) {
        await this.removeFavoriteProperty(propertyId);
      }

      console.log('All favorites cleared');
      return true;
    } catch (error) {
      console.error('Error clearing favorites:', error);
      return false;
    }
  }

  /**
   * Export favorites data (for backup/sync)
   */
  static async exportFavorites(): Promise<{
    ids: string[];
    properties: Property[];
    exportDate: string;
  } | null> {
    try {
      const ids = await this.getFavoriteIds();
      const properties = await this.getFavoriteProperties();

      return {
        ids,
        properties,
        exportDate: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error exporting favorites:', error);
      return null;
    }
  }

  /**
   * Import favorites data (for restore/sync)
   */
  static async importFavorites(data: {
    ids: string[];
    properties: Property[];
  }): Promise<boolean> {
    try {
      // Clear existing favorites
      await this.clearAllFavorites();

      // Import new favorites
      for (const property of data.properties) {
        await this.addToFavorites(property);
      }

      console.log(`Imported ${data.properties.length} favorite properties`);
      return true;
    } catch (error) {
      console.error('Error importing favorites:', error);
      return false;
    }
  }

  /**
   * Get favorites statistics
   */
  static async getFavoritesStats(): Promise<{
    totalCount: number;
    byType: Record<string, number>;
    byOperation: Record<string, number>;
    byCity: Record<string, number>;
    averagePrice: number;
  }> {
    const properties = await this.getFavoriteProperties();
    
    const stats = {
      totalCount: properties.length,
      byType: {} as Record<string, number>,
      byOperation: {} as Record<string, number>,
      byCity: {} as Record<string, number>,
      averagePrice: 0,
    };

    if (properties.length === 0) {
      return stats;
    }

    let totalPrice = 0;

    properties.forEach(property => {
      // Count by type
      stats.byType[property.type] = (stats.byType[property.type] || 0) + 1;
      
      // Count by operation
      stats.byOperation[property.operation] = (stats.byOperation[property.operation] || 0) + 1;
      
      // Count by city
      const city = property.location.address.city;
      stats.byCity[city] = (stats.byCity[city] || 0) + 1;
      
      // Sum prices
      totalPrice += property.pricing.price;
    });

    stats.averagePrice = Math.round(totalPrice / properties.length);

    return stats;
  }

  /**
   * Private method to save favorite IDs to storage
   */
  private static async saveFavoriteIds(): Promise<void> {
    const ids = Array.from(this.favoriteIds);
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_IDS, JSON.stringify(ids));
  }

  /**
   * Private method to save a favorite property to storage
   */
  private static async saveFavoriteProperty(property: Property): Promise<void> {
    const key = `${STORAGE_KEYS.FAVORITES}:${property.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(property));
  }

  /**
   * Private method to get a favorite property from storage
   */
  private static async getFavoriteProperty(propertyId: string): Promise<Property | null> {
    try {
      const key = `${STORAGE_KEYS.FAVORITES}:${propertyId}`;
      const data = await AsyncStorage.getItem(key);
      
      if (data) {
        return JSON.parse(data) as Property;
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting favorite property ${propertyId}:`, error);
      return null;
    }
  }

  /**
   * Private method to remove a favorite property from storage
   */
  private static async removeFavoriteProperty(propertyId: string): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.FAVORITES}:${propertyId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing favorite property ${propertyId}:`, error);
    }
  }
}