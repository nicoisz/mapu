import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  User, 
  AuthResult, 
  CreateUserRequest, 
  SocialProvider,
  UserType,
  SubscriptionType
} from '../data/models';
import { generateUser } from '../data/mock/userGenerators';

/**
 * Authentication service with mock implementation
 * Provides login, registration, social authentication, and session management
 */
export class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private readonly STORAGE_KEYS = {
    USER: '@real_estate_app:user',
    TOKEN: '@real_estate_app:token',
    REFRESH_TOKEN: '@real_estate_app:refresh_token',
    USERS_DB: '@real_estate_app:users_db'
  };

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialize the service and restore session if available
   */
  public async initialize(): Promise<void> {
    try {
      const storedUser = await AsyncStorage.getItem(this.STORAGE_KEYS.USER);
      const storedToken = await AsyncStorage.getItem(this.STORAGE_KEYS.TOKEN);
      
      if (storedUser && storedToken) {
        this.currentUser = JSON.parse(storedUser);
        // Update last login time
        if (this.currentUser) {
          this.currentUser.lastLoginAt = new Date();
          await this.saveUserSession(this.currentUser, storedToken);
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
    }
  }

  /**
   * Login with email and password (mock implementation)
   */
  public async login(email: string, password: string): Promise<AuthResult> {
    try {
      // Simulate network delay
      await this.simulateNetworkDelay();

      // Basic validation
      if (!email || !password) {
        return {
          success: false,
          error: 'Email y contraseña son requeridos'
        };
      }

      if (!this.isValidEmail(email)) {
        return {
          success: false,
          error: 'Formato de email inválido'
        };
      }

      if (password.length < 6) {
        return {
          success: false,
          error: 'La contraseña debe tener al menos 6 caracteres'
        };
      }

      // Get or create user from mock database
      const user = await this.getUserByEmail(email);
      if (!user) {
        return {
          success: false,
          error: 'Usuario no encontrado'
        };
      }

      // Mock password validation (in real app, this would be hashed)
      const isValidPassword = await this.validatePassword(email, password);
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Contraseña incorrecta'
        };
      }

      // Update last login
      user.lastLoginAt = new Date();
      user.updatedAt = new Date();

      // Generate mock tokens
      const token = this.generateMockToken(user.id);
      const refreshToken = this.generateMockRefreshToken(user.id);

      // Save session
      await this.saveUserSession(user, token, refreshToken);
      this.currentUser = user;

      return {
        success: true,
        user,
        token,
        refreshToken
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  /**
   * Register new user (mock implementation)
   */
  public async register(userData: CreateUserRequest): Promise<AuthResult> {
    try {
      // Simulate network delay
      await this.simulateNetworkDelay();

      // Validation
      const validationError = this.validateRegistrationData(userData);
      if (validationError) {
        return {
          success: false,
          error: validationError
        };
      }

      // Check if user already exists
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        return {
          success: false,
          error: 'Ya existe una cuenta con este email'
        };
      }

      // Create new user with mock data
      const newUser = this.createUserFromRequest(userData);
      
      // Save to mock database
      await this.saveUserToDatabase(newUser);

      // Generate tokens
      const token = this.generateMockToken(newUser.id);
      const refreshToken = this.generateMockRefreshToken(newUser.id);

      // Save session
      await this.saveUserSession(newUser, token, refreshToken);
      this.currentUser = newUser;

      return {
        success: true,
        user: newUser,
        token,
        refreshToken
      };

    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  /**
   * Social login (mock implementation)
   */
  public async loginWithSocial(provider: SocialProvider): Promise<AuthResult> {
    try {
      // Simulate network delay
      await this.simulateNetworkDelay();

      // Mock social login flow
      const mockSocialData = this.generateMockSocialData(provider);
      
      // Check if user exists by email
      let user = await this.getUserByEmail(mockSocialData.email);
      
      if (!user) {
        // Create new user from social data
        user = this.createUserFromSocialData(mockSocialData, provider);
        await this.saveUserToDatabase(user);
      }

      // Update last login
      user.lastLoginAt = new Date();
      user.updatedAt = new Date();

      // Generate tokens
      const token = this.generateMockToken(user.id);
      const refreshToken = this.generateMockRefreshToken(user.id);

      // Save session
      await this.saveUserSession(user, token, refreshToken);
      this.currentUser = user;

      return {
        success: true,
        user,
        token,
        refreshToken
      };

    } catch (error) {
      console.error('Social login error:', error);
      return {
        success: false,
        error: `Error al iniciar sesión con ${provider}`
      };
    }
  }

  /**
   * Logout user
   */
  public async logout(): Promise<void> {
    try {
      // Clear stored session
      await AsyncStorage.multiRemove([
        this.STORAGE_KEYS.USER,
        this.STORAGE_KEYS.TOKEN,
        this.STORAGE_KEYS.REFRESH_TOKEN
      ]);

      this.currentUser = null;
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Get current authenticated user
   */
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Refresh authentication token (mock implementation)
   */
  public async refreshToken(): Promise<AuthResult> {
    try {
      const refreshToken = await AsyncStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken || !this.currentUser) {
        return {
          success: false,
          error: 'No hay sesión activa'
        };
      }

      // Simulate token refresh
      await this.simulateNetworkDelay(500);

      const newToken = this.generateMockToken(this.currentUser.id);
      const newRefreshToken = this.generateMockRefreshToken(this.currentUser.id);

      await this.saveUserSession(this.currentUser, newToken, newRefreshToken);

      return {
        success: true,
        user: this.currentUser,
        token: newToken,
        refreshToken: newRefreshToken
      };

    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: 'Error al renovar sesión'
      };
    }
  }

  /**
   * Update user profile
   */
  public async updateProfile(updates: Partial<User>): Promise<AuthResult> {
    try {
      if (!this.currentUser) {
        return {
          success: false,
          error: 'No hay sesión activa'
        };
      }

      // Simulate network delay
      await this.simulateNetworkDelay();

      // Update user data
      const updatedUser = {
        ...this.currentUser,
        ...updates,
        updatedAt: new Date()
      };

      // Save to database
      await this.saveUserToDatabase(updatedUser);

      // Update current session
      const token = await AsyncStorage.getItem(this.STORAGE_KEYS.TOKEN);
      if (token) {
        await this.saveUserSession(updatedUser, token);
      }

      this.currentUser = updatedUser;

      return {
        success: true,
        user: updatedUser
      };

    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: 'Error al actualizar perfil'
      };
    }
  }

  // Private helper methods

  private async simulateNetworkDelay(ms: number = 1000): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validateRegistrationData(userData: CreateUserRequest): string | null {
    if (!userData.email || !userData.password || !userData.name) {
      return 'Todos los campos son requeridos';
    }

    if (!this.isValidEmail(userData.email)) {
      return 'Formato de email inválido';
    }

    if (userData.password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }

    if (userData.name.trim().length < 2) {
      return 'El nombre debe tener al menos 2 caracteres';
    }

    return null;
  }

  private async getUserByEmail(email: string): Promise<User | null> {
    try {
      const usersDb = await AsyncStorage.getItem(this.STORAGE_KEYS.USERS_DB);
      if (!usersDb) return null;

      const users: User[] = JSON.parse(usersDb);
      return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  private async validatePassword(email: string, password: string): Promise<boolean> {
    // Mock password validation - in real app, compare with hashed password
    // For demo purposes, accept any password with length >= 6
    return password.length >= 6;
  }

  private createUserFromRequest(userData: CreateUserRequest): User {
    const baseUser = generateUser(userData.userType);
    
    return {
      ...baseUser,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: userData.email,
      name: userData.name,
      userType: userData.userType,
      companyName: userData.companyName,
      licenseNumber: userData.licenseNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
      isEmailVerified: false,
      isPhoneVerified: false,
      isIdentityVerified: false
    };
  }

  private generateMockSocialData(provider: SocialProvider) {
    const mockNames = ['Juan Pérez', 'María González', 'Carlos Silva', 'Ana Rodríguez'];
    const name = mockNames[Math.floor(Math.random() * mockNames.length)];
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@${provider}.com`;

    return {
      id: `${provider}_${Date.now()}`,
      email,
      name,
      avatar: `https://i.pravatar.cc/150?u=${email}`
    };
  }

  private createUserFromSocialData(socialData: any, provider: SocialProvider): User {
    const baseUser = generateUser(UserType.INDIVIDUAL);
    
    return {
      ...baseUser,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: socialData.email,
      name: socialData.name,
      avatar: socialData.avatar,
      userType: UserType.INDIVIDUAL,
      createdAt: new Date(),
      updatedAt: new Date(),
      isEmailVerified: true, // Social logins are pre-verified
      isPhoneVerified: false,
      isIdentityVerified: false
    };
  }

  private generateMockToken(userId: string): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ 
      userId, 
      exp: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      iat: Date.now()
    }));
    const signature = btoa(`mock_signature_${userId}_${Date.now()}`);
    
    return `${header}.${payload}.${signature}`;
  }

  private generateMockRefreshToken(userId: string): string {
    return btoa(`refresh_${userId}_${Date.now()}_${Math.random().toString(36)}`);
  }

  private async saveUserSession(user: User, token: string, refreshToken?: string): Promise<void> {
    const promises = [
      AsyncStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user)),
      AsyncStorage.setItem(this.STORAGE_KEYS.TOKEN, token)
    ];

    if (refreshToken) {
      promises.push(AsyncStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, refreshToken));
    }

    await Promise.all(promises);
  }

  private async saveUserToDatabase(user: User): Promise<void> {
    try {
      const usersDb = await AsyncStorage.getItem(this.STORAGE_KEYS.USERS_DB);
      let users: User[] = usersDb ? JSON.parse(usersDb) : [];

      // Update existing user or add new one
      const existingIndex = users.findIndex(u => u.id === user.id);
      if (existingIndex >= 0) {
        users[existingIndex] = user;
      } else {
        users.push(user);
      }

      await AsyncStorage.setItem(this.STORAGE_KEYS.USERS_DB, JSON.stringify(users));
    } catch (error) {
      console.error('Error saving user to database:', error);
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();