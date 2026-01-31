import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authService';

/**
 * Session manager for handling automatic token refresh and session persistence
 */
export class SessionManager {
  private static instance: SessionManager;
  private refreshTimer: NodeJS.Timeout | null = null;
  private readonly TOKEN_REFRESH_INTERVAL = 23 * 60 * 60 * 1000; // 23 hours
  private readonly STORAGE_KEYS = {
    TOKEN_EXPIRY: '@real_estate_app:token_expiry',
    LAST_ACTIVITY: '@real_estate_app:last_activity'
  };

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Start session management
   */
  public async startSession(): Promise<void> {
    try {
      // Update last activity
      await this.updateLastActivity();
      
      // Start automatic token refresh
      this.startTokenRefreshTimer();
      
      // Check if session is still valid
      await this.validateSession();
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  }

  /**
   * Stop session management
   */
  public stopSession(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Update user activity timestamp
   */
  public async updateLastActivity(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.LAST_ACTIVITY, 
        Date.now().toString()
      );
    } catch (error) {
      console.error('Failed to update last activity:', error);
    }
  }

  /**
   * Check if session is expired based on inactivity
   */
  public async isSessionExpired(): Promise<boolean> {
    try {
      const lastActivity = await AsyncStorage.getItem(this.STORAGE_KEYS.LAST_ACTIVITY);
      
      if (!lastActivity) {
        return true;
      }

      const lastActivityTime = parseInt(lastActivity, 10);
      const now = Date.now();
      const inactivityPeriod = now - lastActivityTime;
      
      // Session expires after 30 days of inactivity
      const SESSION_EXPIRY_TIME = 30 * 24 * 60 * 60 * 1000;
      
      return inactivityPeriod > SESSION_EXPIRY_TIME;
    } catch (error) {
      console.error('Failed to check session expiry:', error);
      return true;
    }
  }

  /**
   * Validate current session
   */
  private async validateSession(): Promise<void> {
    try {
      const isExpired = await this.isSessionExpired();
      
      if (isExpired) {
        console.log('Session expired due to inactivity');
        await authService.logout();
        return;
      }

      // Check if token needs refresh
      const shouldRefresh = await this.shouldRefreshToken();
      
      if (shouldRefresh) {
        console.log('Refreshing token...');
        const result = await authService.refreshToken();
        
        if (!result.success) {
          console.log('Token refresh failed, logging out');
          await authService.logout();
        }
      }
    } catch (error) {
      console.error('Session validation error:', error);
    }
  }

  /**
   * Check if token should be refreshed
   */
  private async shouldRefreshToken(): Promise<boolean> {
    try {
      const tokenExpiry = await AsyncStorage.getItem(this.STORAGE_KEYS.TOKEN_EXPIRY);
      
      if (!tokenExpiry) {
        return true; // Refresh if no expiry info
      }

      const expiryTime = parseInt(tokenExpiry, 10);
      const now = Date.now();
      
      // Refresh token if it expires within 1 hour
      const REFRESH_THRESHOLD = 60 * 60 * 1000;
      
      return (expiryTime - now) < REFRESH_THRESHOLD;
    } catch (error) {
      console.error('Failed to check token expiry:', error);
      return true;
    }
  }

  /**
   * Start automatic token refresh timer
   */
  private startTokenRefreshTimer(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(async () => {
      try {
        if (authService.isAuthenticated()) {
          await this.validateSession();
        } else {
          this.stopSession();
        }
      } catch (error) {
        console.error('Token refresh timer error:', error);
      }
    }, this.TOKEN_REFRESH_INTERVAL);
  }

  /**
   * Set token expiry time
   */
  public async setTokenExpiry(expiryTime: number): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.TOKEN_EXPIRY, 
        expiryTime.toString()
      );
    } catch (error) {
      console.error('Failed to set token expiry:', error);
    }
  }

  /**
   * Clear session data
   */
  public async clearSessionData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.STORAGE_KEYS.TOKEN_EXPIRY,
        this.STORAGE_KEYS.LAST_ACTIVITY
      ]);
    } catch (error) {
      console.error('Failed to clear session data:', error);
    }
  }

  /**
   * Get session info for debugging
   */
  public async getSessionInfo(): Promise<{
    lastActivity: number | null;
    tokenExpiry: number | null;
    isExpired: boolean;
  }> {
    try {
      const lastActivity = await AsyncStorage.getItem(this.STORAGE_KEYS.LAST_ACTIVITY);
      const tokenExpiry = await AsyncStorage.getItem(this.STORAGE_KEYS.TOKEN_EXPIRY);
      const isExpired = await this.isSessionExpired();

      return {
        lastActivity: lastActivity ? parseInt(lastActivity, 10) : null,
        tokenExpiry: tokenExpiry ? parseInt(tokenExpiry, 10) : null,
        isExpired
      };
    } catch (error) {
      console.error('Failed to get session info:', error);
      return {
        lastActivity: null,
        tokenExpiry: null,
        isExpired: true
      };
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();