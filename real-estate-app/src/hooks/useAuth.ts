import { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  AuthResult, 
  CreateUserRequest, 
  SocialProvider 
} from '../data/models';
import { authService } from '../services/authService';

/**
 * Authentication state interface
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Authentication hook for managing user authentication state
 * Provides methods for login, register, logout, and session management
 */
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  /**
   * Initialize authentication state
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setAuthState(prev => ({ ...prev, isLoading: true }));
        
        await authService.initialize();
        const currentUser = authService.getCurrentUser();
        
        setAuthState({
          user: currentUser,
          isAuthenticated: currentUser !== null,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Error al inicializar autenticación'
        });
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login with email and password
   */
  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await authService.login(email, password);
      
      if (result.success && result.user) {
        setAuthState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Error de autenticación'
        }));
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'Error interno del servidor';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  /**
   * Register new user
   */
  const register = useCallback(async (userData: CreateUserRequest): Promise<AuthResult> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await authService.register(userData);
      
      if (result.success && result.user) {
        setAuthState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Error de registro'
        }));
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'Error interno del servidor';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  /**
   * Social login
   */
  const loginWithSocial = useCallback(async (provider: SocialProvider): Promise<AuthResult> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await authService.loginWithSocial(provider);
      
      if (result.success && result.user) {
        setAuthState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || `Error al iniciar sesión con ${provider}`
        }));
      }
      
      return result;
    } catch (error) {
      const errorMessage = `Error al iniciar sesión con ${provider}`;
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      await authService.logout();
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear the local state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  }, []);

  /**
   * Refresh authentication token
   */
  const refreshToken = useCallback(async (): Promise<AuthResult> => {
    try {
      const result = await authService.refreshToken();
      
      if (result.success && result.user) {
        setAuthState(prev => ({
          ...prev,
          user: result.user || null,
          error: null
        }));
      } else {
        // If refresh fails, logout user
        await logout();
      }
      
      return result;
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
      
      return {
        success: false,
        error: 'Error al renovar sesión'
      };
    }
  }, [logout]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (updates: Partial<User>): Promise<AuthResult> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await authService.updateProfile(updates);
      
      if (result.success && result.user) {
        setAuthState(prev => ({
          ...prev,
          user: result.user || null,
          isLoading: false,
          error: null
        }));
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Error al actualizar perfil'
        }));
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'Error al actualizar perfil';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  /**
   * Clear authentication error
   */
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Check if user has specific subscription type
   */
  const hasSubscription = useCallback((subscriptionType: 'free' | 'premium'): boolean => {
    return authState.user?.subscription.type === subscriptionType;
  }, [authState.user]);

  /**
   * Check if user has remaining free listings
   */
  const hasRemainingListings = useCallback((): boolean => {
    if (!authState.user) return false;
    
    const { subscription } = authState.user;
    if (subscription.type === 'premium') return true;
    
    return (subscription.remainingListings || 0) > 0;
  }, [authState.user]);

  /**
   * Get remaining free listings count
   */
  const getRemainingListings = useCallback((): number => {
    if (!authState.user) return 0;
    
    const { subscription } = authState.user;
    if (subscription.type === 'premium') return Infinity;
    
    return subscription.remainingListings || 0;
  }, [authState.user]);

  return {
    // State
    ...authState,
    
    // Actions
    login,
    register,
    loginWithSocial,
    logout,
    refreshToken,
    updateProfile,
    clearError,
    
    // Utilities
    hasSubscription,
    hasRemainingListings,
    getRemainingListings
  };
};