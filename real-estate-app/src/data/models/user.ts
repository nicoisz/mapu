import { UserType, SubscriptionType } from './enums';
import { ContactInfo } from './contact';

/**
 * User subscription details for freemium model
 */
export interface UserSubscription {
  type: SubscriptionType;
  startDate: Date;
  expiresAt?: Date;
  isActive: boolean;
  features: string[]; // List of enabled features
  listingsLimit?: number; // Number of allowed listings
  remainingListings?: number; // Remaining free listings
}

/**
 * User preferences and settings
 */
export interface UserPreferences {
  language: 'es' | 'en'; // Spanish or English
  currency: 'CLP' | 'USD';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    newProperties: boolean;
    priceChanges: boolean;
    messages: boolean;
  };
  searchRadius: number; // in kilometers
  mapType: 'standard' | 'satellite' | 'hybrid';
}

/**
 * User profile statistics
 */
export interface UserStats {
  totalListings: number;
  activeListings: number;
  soldProperties: number;
  rentedProperties: number;
  totalViews: number;
  totalContacts: number;
  averageResponseTime?: number; // in minutes
  rating?: number; // 1-5 stars
  reviewCount?: number;
}

/**
 * Main user interface
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  userType: UserType;
  subscription: UserSubscription;
  preferences: UserPreferences;
  stats: UserStats;
  
  // Property relationships
  properties: string[]; // Property IDs owned by user
  savedProperties: string[]; // Favorited property IDs
  recentlyViewed: string[]; // Recently viewed property IDs
  
  // Contact information (for agents and companies)
  contactInfo?: ContactInfo;
  
  // Company information (for company users)
  companyName?: string;
  companyLogo?: string;
  licenseNumber?: string; // Real estate license
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  
  // Verification status
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isIdentityVerified: boolean; // For agents and companies
}

/**
 * User registration request
 */
export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  userType: UserType;
  phone?: string;
  companyName?: string;
  licenseNumber?: string;
}

/**
 * User authentication result
 */
export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  error?: string;
}

/**
 * Social login providers
 */
export type SocialProvider = 'google' | 'apple' | 'facebook';