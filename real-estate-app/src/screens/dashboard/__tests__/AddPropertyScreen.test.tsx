import React from 'react';
import { render } from '@testing-library/react-native';
import { AddPropertyScreen } from '../AddPropertyScreen';
import { useAuth } from '../../../hooks/useAuth';

// Mock the useAuth hook
jest.mock('../../../hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the property service
jest.mock('../../../services/propertyService', () => ({
  propertyService: {
    createProperty: jest.fn().mockResolvedValue({ id: '1', title: 'Test Property' }),
  },
}));

describe('AddPropertyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the form fields', () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      subscription: {
        type: 'free' as const,
        remainingListings: 5,
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

    const { getByText } = render(<AddPropertyScreen />);
    
    expect(getByText('Agregar Propiedad')).toBeTruthy();
    expect(getByText('Información Básica')).toBeTruthy();
    expect(getByText('Tipo de Propiedad *')).toBeTruthy();
    expect(getByText('Casa')).toBeTruthy();
    expect(getByText('Departamento')).toBeTruthy();
    expect(getByText('Crear Propiedad')).toBeTruthy();
  });
});