import React from 'react';
import { render } from '@testing-library/react-native';
import { DashboardScreen } from '../DashboardScreen';
import { useAuth } from '../../../hooks/useAuth';

// Mock the useAuth hook
jest.mock('../../../hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the property service
jest.mock('../../../services/propertyService', () => ({
  propertyService: {
    getUserProperties: jest.fn().mockResolvedValue([]),
  },
}));

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login message when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      loginWithSocial: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      updateProfile: jest.fn(),
      clearError: jest.fn(),
      hasSubscription: jest.fn(),
      hasRemainingListings: jest.fn(),
      getRemainingListings: jest.fn(),
    });

    const { getByText } = render(<DashboardScreen />);
    
    expect(getByText('Debes iniciar sesión para ver tu dashboard')).toBeTruthy();
  });

  it('should render dashboard content when user is authenticated', () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      subscription: {
        type: 'free' as const,
        remainingListings: 5,
        isActive: true,
        startDate: new Date(),
        features: [],
      },
    };

    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      loginWithSocial: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      updateProfile: jest.fn(),
      clearError: jest.fn(),
      hasSubscription: jest.fn(),
      hasRemainingListings: jest.fn().mockReturnValue(true),
      getRemainingListings: jest.fn().mockReturnValue(5),
    });

    const { getByText } = render(<DashboardScreen />);
    
    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('test@example.com')).toBeTruthy();
    expect(getByText('Estado de Suscripción')).toBeTruthy();
    expect(getByText('GRATIS')).toBeTruthy();
    expect(getByText('Mis Propiedades')).toBeTruthy();
  });
});