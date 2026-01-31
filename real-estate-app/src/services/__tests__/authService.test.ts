import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../authService';
import { UserType } from '../../data/models';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiRemove: jest.fn(),
  multiSet: jest.fn(),
}));

// Mock the user generators
jest.mock('../../data/mock/userGenerators', () => ({
  generateUser: jest.fn(() => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    userType: 'individual',
    subscription: {
      type: 'free',
      startDate: new Date(),
      isActive: true,
      features: ['search', 'save_properties'],
      listingsLimit: 1,
      remainingListings: 1
    },
    preferences: {
      language: 'es',
      currency: 'CLP',
      notifications: {
        email: true,
        push: true,
        sms: false,
        newProperties: true,
        priceChanges: true,
        messages: true
      },
      searchRadius: 10,
      mapType: 'standard'
    },
    stats: {
      totalListings: 0,
      activeListings: 0,
      soldProperties: 0,
      rentedProperties: 0,
      totalViews: 0,
      totalContacts: 0
    },
    properties: [],
    savedProperties: [],
    recentlyViewed: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    isEmailVerified: false,
    isPhoneVerified: false,
    isIdentityVerified: false
  }))
}));

describe('AuthService', () => {
  let authService: AuthService;
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    authService = AuthService.getInstance();
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Mock existing user in database
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@real_estate_app:users_db') {
          return Promise.resolve(JSON.stringify([{
            id: 'existing-user',
            email: 'test@example.com',
            name: 'Test User'
          }]));
        }
        return Promise.resolve(null);
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should fail login with invalid email format', async () => {
      const result = await authService.login('invalid-email', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Formato de email inválido');
    });

    it('should fail login with short password', async () => {
      const result = await authService.login('test@example.com', '123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('La contraseña debe tener al menos 6 caracteres');
    });

    it('should fail login with empty credentials', async () => {
      const result = await authService.login('', '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email y contraseña son requeridos');
    });

    it('should fail login when user not found', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await authService.login('nonexistent@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuario no encontrado');
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null); // No existing users

      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        userType: UserType.INDIVIDUAL
      };

      const result = await authService.register(userData);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe(userData.email);
      expect(result.user?.name).toBe(userData.name);
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should fail registration with existing email', async () => {
      // Mock existing user
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@real_estate_app:users_db') {
          return Promise.resolve(JSON.stringify([{
            id: 'existing-user',
            email: 'existing@example.com',
            name: 'Existing User'
          }]));
        }
        return Promise.resolve(null);
      });

      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'New User',
        userType: UserType.INDIVIDUAL
      };

      const result = await authService.register(userData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Ya existe una cuenta con este email');
    });

    it('should fail registration with invalid data', async () => {
      const userData = {
        email: 'invalid-email',
        password: '123',
        name: '',
        userType: UserType.INDIVIDUAL
      };

      const result = await authService.register(userData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('social login', () => {
    it('should successfully login with Google', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null); // No existing users

      const result = await authService.loginWithSocial('google');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.isEmailVerified).toBe(true); // Social logins are pre-verified
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should login existing user with social provider', async () => {
      // Mock existing user with social email
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@real_estate_app:users_db') {
          return Promise.resolve(JSON.stringify([{
            id: 'existing-user',
            email: 'juan.pérez@google.com',
            name: 'Juan Pérez'
          }]));
        }
        return Promise.resolve(null);
      });

      const result = await authService.loginWithSocial('google');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
    });
  });

  describe('session management', () => {
    it('should initialize and restore session', async () => {
      const mockUser = {
        id: 'test-user',
        email: 'test@example.com',
        name: 'Test User'
      };

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@real_estate_app:user') {
          return Promise.resolve(JSON.stringify(mockUser));
        }
        if (key === '@real_estate_app:token') {
          return Promise.resolve('mock-token');
        }
        return Promise.resolve(null);
      });

      await authService.initialize();

      const currentUser = authService.getCurrentUser();
      expect(currentUser).toBeDefined();
      expect(currentUser?.email).toBe(mockUser.email);
    });

    it('should logout and clear session', async () => {
      await authService.logout();

      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        '@real_estate_app:user',
        '@real_estate_app:token',
        '@real_estate_app:refresh_token'
      ]);

      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should refresh token successfully', async () => {
      // Mock existing user in database first
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@real_estate_app:users_db') {
          return Promise.resolve(JSON.stringify([{
            id: 'test-user',
            email: 'test@example.com',
            name: 'Test User'
          }]));
        }
        if (key === '@real_estate_app:refresh_token') {
          return Promise.resolve('mock-refresh-token');
        }
        return Promise.resolve(null);
      });

      // First login to set current user
      await authService.login('test@example.com', 'password123');

      const result = await authService.refreshToken();

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe('profile management', () => {
    it('should update user profile', async () => {
      // First login to set current user
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@real_estate_app:users_db') {
          return Promise.resolve(JSON.stringify([{
            id: 'test-user',
            email: 'test@example.com',
            name: 'Test User'
          }]));
        }
        if (key === '@real_estate_app:token') {
          return Promise.resolve('mock-token');
        }
        return Promise.resolve(null);
      });

      await authService.login('test@example.com', 'password123');

      const updates = {
        name: 'Updated Name',
        avatar: 'https://example.com/avatar.jpg'
      };

      const result = await authService.updateProfile(updates);

      expect(result.success).toBe(true);
      expect(result.user?.name).toBe(updates.name);
      expect(result.user?.avatar).toBe(updates.avatar);
    });

    it('should fail to update profile when not authenticated', async () => {
      // Ensure no user is logged in
      await authService.logout();
      
      const result = await authService.updateProfile({ name: 'New Name' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No hay sesión activa');
    });
  });
});