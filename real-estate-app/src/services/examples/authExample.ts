/**
 * Authentication Service Usage Examples
 * 
 * This file demonstrates how to use the authentication service
 * in different scenarios within the real estate mobile app.
 */

import { authService } from '../authService';
import { UserType } from '../../data/models';

/**
 * Example: Basic login flow
 */
export const loginExample = async () => {
  try {
    console.log('🔐 Attempting login...');
    
    const result = await authService.login('usuario@ejemplo.com', 'password123');
    
    if (result.success && result.user) {
      console.log('✅ Login successful!');
      console.log('User:', result.user.name);
      console.log('Email:', result.user.email);
      console.log('User Type:', result.user.userType);
      console.log('Subscription:', result.user.subscription.type);
      console.log('Remaining Listings:', result.user.subscription.remainingListings);
      
      return result.user;
    } else {
      console.log('❌ Login failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
};

/**
 * Example: User registration flow
 */
export const registerExample = async () => {
  try {
    console.log('📝 Attempting registration...');
    
    const userData = {
      email: 'nuevo.usuario@ejemplo.com',
      password: 'password123',
      name: 'Nuevo Usuario',
      userType: UserType.INDIVIDUAL
    };
    
    const result = await authService.register(userData);
    
    if (result.success && result.user) {
      console.log('✅ Registration successful!');
      console.log('User ID:', result.user.id);
      console.log('Name:', result.user.name);
      console.log('Email verified:', result.user.isEmailVerified);
      console.log('Free listings available:', result.user.subscription.remainingListings);
      
      return result.user;
    } else {
      console.log('❌ Registration failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return null;
  }
};

/**
 * Example: Social login flow
 */
export const socialLoginExample = async () => {
  try {
    console.log('🌐 Attempting Google login...');
    
    const result = await authService.loginWithSocial('google');
    
    if (result.success && result.user) {
      console.log('✅ Social login successful!');
      console.log('User:', result.user.name);
      console.log('Email verified:', result.user.isEmailVerified); // Should be true
      console.log('Avatar:', result.user.avatar);
      
      return result.user;
    } else {
      console.log('❌ Social login failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Social login error:', error);
    return null;
  }
};

/**
 * Example: Session management
 */
export const sessionExample = async () => {
  try {
    console.log('🔄 Initializing session...');
    
    // Initialize the service (restore previous session if available)
    await authService.initialize();
    
    const currentUser = authService.getCurrentUser();
    
    if (currentUser) {
      console.log('✅ Session restored!');
      console.log('Welcome back,', currentUser.name);
      console.log('Last login:', currentUser.lastLoginAt);
      
      // Refresh token if needed
      console.log('🔄 Refreshing token...');
      const refreshResult = await authService.refreshToken();
      
      if (refreshResult.success) {
        console.log('✅ Token refreshed successfully');
      } else {
        console.log('❌ Token refresh failed:', refreshResult.error);
      }
      
      return currentUser;
    } else {
      console.log('ℹ️ No active session found');
      return null;
    }
  } catch (error) {
    console.error('Session error:', error);
    return null;
  }
};

/**
 * Example: Profile management
 */
export const profileExample = async () => {
  try {
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser) {
      console.log('❌ No user logged in');
      return null;
    }
    
    console.log('👤 Updating profile...');
    
    const updates = {
      name: 'Nombre Actualizado',
      avatar: 'https://ejemplo.com/nuevo-avatar.jpg',
      preferences: {
        ...currentUser.preferences,
        language: 'en' as const,
        notifications: {
          ...currentUser.preferences.notifications,
          email: false
        }
      }
    };
    
    const result = await authService.updateProfile(updates);
    
    if (result.success && result.user) {
      console.log('✅ Profile updated successfully!');
      console.log('New name:', result.user.name);
      console.log('New avatar:', result.user.avatar);
      console.log('Language preference:', result.user.preferences.language);
      
      return result.user;
    } else {
      console.log('❌ Profile update failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Profile update error:', error);
    return null;
  }
};

/**
 * Example: Complete authentication flow
 */
export const completeAuthFlow = async () => {
  console.log('🚀 Starting complete authentication flow...\n');
  
  // 1. Initialize session
  await sessionExample();
  console.log('\n');
  
  // 2. If no session, try to register
  let user = authService.getCurrentUser();
  if (!user) {
    user = await registerExample();
    console.log('\n');
  }
  
  // 3. If registration failed, try login
  if (!user) {
    user = await loginExample();
    console.log('\n');
  }
  
  // 4. If still no user, try social login
  if (!user) {
    user = await socialLoginExample();
    console.log('\n');
  }
  
  // 5. If we have a user, update profile
  if (user) {
    await profileExample();
    console.log('\n');
    
    // 6. Show final user state
    const finalUser = authService.getCurrentUser();
    if (finalUser) {
      console.log('🎉 Authentication flow completed!');
      console.log('Final user state:');
      console.log('- Name:', finalUser.name);
      console.log('- Email:', finalUser.email);
      console.log('- Type:', finalUser.userType);
      console.log('- Subscription:', finalUser.subscription.type);
      console.log('- Authenticated:', authService.isAuthenticated());
      
      // 7. Logout
      console.log('\n🚪 Logging out...');
      await authService.logout();
      console.log('✅ Logged out successfully');
      console.log('- Authenticated:', authService.isAuthenticated());
    }
  } else {
    console.log('❌ Authentication flow failed - no user authenticated');
  }
};

/**
 * Example: Check user permissions
 */
export const permissionsExample = async () => {
  const user = authService.getCurrentUser();
  
  if (!user) {
    console.log('❌ No user logged in');
    return;
  }
  
  console.log('🔐 Checking user permissions...');
  console.log('User:', user.name);
  console.log('Type:', user.userType);
  console.log('Subscription:', user.subscription.type);
  console.log('');
  
  // Check subscription-based permissions
  const isPremium = user.subscription.type === 'premium';
  const hasRemainingListings = (user.subscription.remainingListings || 0) > 0;
  
  console.log('Permissions:');
  console.log('- Can create listings:', isPremium || hasRemainingListings);
  console.log('- Can access premium features:', isPremium);
  console.log('- Can contact owners:', true); // All authenticated users
  console.log('- Can save properties:', true); // All authenticated users
  console.log('- Can view analytics:', user.userType !== 'individual' && isPremium);
  console.log('- Remaining free listings:', user.subscription.remainingListings || 0);
  
  if (user.userType !== 'individual') {
    console.log('- Professional features available');
    console.log('- License number:', user.licenseNumber);
    if (user.contactInfo) {
      console.log('- Contact phone:', user.contactInfo.phone);
      console.log('- Response time:', user.contactInfo.responseTime);
    }
  }
};