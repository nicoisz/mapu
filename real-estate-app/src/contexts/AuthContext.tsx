import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, AuthState } from '../hooks/useAuth';
import { 
  User, 
  AuthResult, 
  CreateUserRequest, 
  SocialProvider 
} from '../data/models';

/**
 * Authentication context interface
 */
interface AuthContextType extends AuthState {
  // Actions
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (userData: CreateUserRequest) => Promise<AuthResult>;
  loginWithSocial: (provider: SocialProvider) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<AuthResult>;
  updateProfile: (updates: Partial<User>) => Promise<AuthResult>;
  clearError: () => void;
  
  // Utilities
  hasSubscription: (subscriptionType: 'free' | 'premium') => boolean;
  hasRemainingListings: () => boolean;
  getRemainingListings: () => number;
}

/**
 * Authentication context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication provider props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication provider component
 * Provides authentication state and methods to the entire app
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 * Must be used within AuthProvider
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * Higher-order component to protect routes that require authentication
 */
interface WithAuthProps {
  fallback?: ReactNode;
}

export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthProps = {}
) => {
  const AuthenticatedComponent: React.FC<P> = (props) => {
    const { isAuthenticated, isLoading } = useAuthContext();
    const { fallback } = options;

    if (isLoading) {
      // You can customize this loading component
      return (
        <div style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          {/* Loading spinner or component */}
          <div>Cargando...</div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return fallback ? <>{fallback}</> : null;
    }

    return <Component {...props} />;
  };

  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return AuthenticatedComponent;
};

/**
 * Hook to check if user has specific permissions
 */
export const usePermissions = () => {
  const { user, hasSubscription, hasRemainingListings } = useAuthContext();

  const canCreateListing = (): boolean => {
    if (!user) return false;
    return hasSubscription('premium') || hasRemainingListings();
  };

  const canAccessPremiumFeatures = (): boolean => {
    return hasSubscription('premium');
  };

  const canContactOwners = (): boolean => {
    return user !== null;
  };

  const canSaveProperties = (): boolean => {
    return user !== null;
  };

  const canViewAnalytics = (): boolean => {
    if (!user) return false;
    return user.userType !== 'individual' && hasSubscription('premium');
  };

  const canManageMultipleListings = (): boolean => {
    if (!user) return false;
    return user.userType !== 'individual' || hasSubscription('premium');
  };

  return {
    canCreateListing,
    canAccessPremiumFeatures,
    canContactOwners,
    canSaveProperties,
    canViewAnalytics,
    canManageMultipleListings
  };
};