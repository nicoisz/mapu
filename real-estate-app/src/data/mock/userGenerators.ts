import {
  User,
  UserType,
  SubscriptionType,
  UserSubscription,
  UserPreferences,
  UserStats,
  ContactInfo,
  ContactMethod
} from '../models';
import { RandomGenerator, CHILEAN_NAMES, REAL_ESTATE_COMPANIES } from './generators';

/**
 * Generate user subscription based on user type
 */
export function generateUserSubscription(userType: UserType): UserSubscription {
  const isFree = userType === UserType.INDIVIDUAL ? 
    RandomGenerator.randomBoolean(0.7) : // 70% of individuals are free
    RandomGenerator.randomBoolean(0.3);  // 30% of agents/companies are free
  
  const type = isFree ? SubscriptionType.FREE : SubscriptionType.PREMIUM;
  const startDate = RandomGenerator.randomPastDate(365);
  
  const baseFeatures = ['search', 'save_properties', 'contact_owners'];
  const premiumFeatures = [
    ...baseFeatures,
    'unlimited_listings',
    'premium_support',
    'analytics',
    'featured_listings',
    'priority_placement'
  ];
  
  if (type === SubscriptionType.FREE) {
    return {
      type,
      startDate,
      isActive: true,
      features: baseFeatures,
      listingsLimit: userType === UserType.INDIVIDUAL ? 1 : 3,
      remainingListings: RandomGenerator.randomInt(0, userType === UserType.INDIVIDUAL ? 1 : 3)
    };
  } else {
    return {
      type,
      startDate,
      expiresAt: RandomGenerator.randomFutureDate(365),
      isActive: true,
      features: premiumFeatures
    };
  }
}

/**
 * Generate user preferences
 */
export function generateUserPreferences(): UserPreferences {
  return {
    language: RandomGenerator.randomBoolean(0.95) ? 'es' : 'en', // 95% Spanish
    currency: RandomGenerator.randomBoolean(0.9) ? 'CLP' : 'USD', // 90% CLP
    notifications: {
      email: RandomGenerator.randomBoolean(0.8),
      push: RandomGenerator.randomBoolean(0.9),
      sms: RandomGenerator.randomBoolean(0.4),
      newProperties: RandomGenerator.randomBoolean(0.7),
      priceChanges: RandomGenerator.randomBoolean(0.6),
      messages: RandomGenerator.randomBoolean(0.9)
    },
    searchRadius: RandomGenerator.randomChoice([5, 10, 15, 20, 25]), // km
    mapType: RandomGenerator.randomChoice(['standard', 'satellite', 'hybrid'])
  };
}

/**
 * Generate user statistics based on user type and subscription
 */
export function generateUserStats(userType: UserType, subscription: UserSubscription): UserStats {
  const isAgent = userType === UserType.AGENT;
  const isCompany = userType === UserType.COMPANY;
  const isPremium = subscription.type === SubscriptionType.PREMIUM;
  
  // Base multipliers for different user types
  const listingMultiplier = isCompany ? 3 : isAgent ? 2 : 1;
  const activityMultiplier = isPremium ? 2 : 1;
  
  const totalListings = RandomGenerator.randomInt(
    0, 
    (isCompany ? 50 : isAgent ? 20 : 5) * activityMultiplier
  );
  
  const activeListings = Math.min(
    totalListings,
    RandomGenerator.randomInt(0, Math.ceil(totalListings * 0.8))
  );
  
  const soldProperties = RandomGenerator.randomInt(
    0,
    Math.ceil(totalListings * (isAgent || isCompany ? 0.6 : 0.3))
  );
  
  const rentedProperties = RandomGenerator.randomInt(
    0,
    Math.ceil(totalListings * (isAgent || isCompany ? 0.4 : 0.2))
  );
  
  const totalViews = totalListings > 0 ? 
    RandomGenerator.randomInt(totalListings * 10, totalListings * 200) : 0;
  
  const totalContacts = totalListings > 0 ?
    RandomGenerator.randomInt(Math.ceil(totalViews * 0.02), Math.ceil(totalViews * 0.1)) : 0;
  
  const stats: UserStats = {
    totalListings,
    activeListings,
    soldProperties,
    rentedProperties,
    totalViews,
    totalContacts
  };
  
  // Add professional stats for agents and companies
  if (isAgent || isCompany) {
    stats.averageResponseTime = RandomGenerator.randomInt(15, 180); // 15 minutes to 3 hours
    stats.rating = RandomGenerator.randomFloat(3.5, 5.0);
    stats.reviewCount = RandomGenerator.randomInt(5, 100);
  }
  
  return stats;
}

/**
 * Generate contact info for agents and companies
 */
export function generateProfessionalContactInfo(): ContactInfo {
  const firstName = RandomGenerator.randomChoice(CHILEAN_NAMES.first);
  const lastName = RandomGenerator.randomChoice(CHILEAN_NAMES.last);
  const name = `${firstName} ${lastName}`;
  
  return {
    id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    phone: RandomGenerator.randomPhone(),
    email: RandomGenerator.randomEmail(name),
    preferredMethod: RandomGenerator.randomChoice([ContactMethod.PHONE, ContactMethod.EMAIL, ContactMethod.WHATSAPP]),
    isVerified: RandomGenerator.randomBoolean(0.8),
    responseTime: `Usually responds within ${RandomGenerator.randomInt(10, 120)} minutes`, // 10 minutes to 2 hours
    languages: ['es', ...(RandomGenerator.randomBoolean(0.6) ? ['en'] : [])],
  };
}

/**
 * Generate individual user
 */
export function generateIndividualUser(): User {
  const firstName = RandomGenerator.randomChoice(CHILEAN_NAMES.first);
  const lastName = RandomGenerator.randomChoice(CHILEAN_NAMES.last);
  const name = `${firstName} ${lastName}`;
  const email = RandomGenerator.randomEmail(name);
  
  const subscription = generateUserSubscription(UserType.INDIVIDUAL);
  const preferences = generateUserPreferences();
  const stats = generateUserStats(UserType.INDIVIDUAL, subscription);
  
  const createdAt = RandomGenerator.randomPastDate(730); // Up to 2 years ago
  const lastLoginAt = RandomGenerator.randomPastDate(30); // Within last month
  
  return {
    id: `user_${Date.now()}_${RandomGenerator.randomInt(1000, 9999)}`,
    email,
    name,
    avatar: RandomGenerator.randomBoolean(0.3) ? `https://i.pravatar.cc/150?u=${email}` : undefined,
    userType: UserType.INDIVIDUAL,
    subscription,
    preferences,
    stats,
    properties: [], // Will be populated when generating properties
    savedProperties: [], // Will be populated with random property IDs
    recentlyViewed: [], // Will be populated with random property IDs
    createdAt,
    updatedAt: RandomGenerator.randomDate(createdAt, new Date()),
    lastLoginAt,
    isEmailVerified: RandomGenerator.randomBoolean(0.8),
    isPhoneVerified: RandomGenerator.randomBoolean(0.6),
    isIdentityVerified: false // Not required for individuals
  };
}

/**
 * Generate agent user
 */
export function generateAgentUser(): User {
  const firstName = RandomGenerator.randomChoice(CHILEAN_NAMES.first);
  const lastName = RandomGenerator.randomChoice(CHILEAN_NAMES.last);
  const name = `${firstName} ${lastName}`;
  const email = RandomGenerator.randomEmail(name);
  
  const subscription = generateUserSubscription(UserType.AGENT);
  const preferences = generateUserPreferences();
  const stats = generateUserStats(UserType.AGENT, subscription);
  const contactInfo = generateProfessionalContactInfo();
  
  const createdAt = RandomGenerator.randomPastDate(1095); // Up to 3 years ago
  const lastLoginAt = RandomGenerator.randomPastDate(7); // Within last week
  
  return {
    id: `agent_${Date.now()}_${RandomGenerator.randomInt(1000, 9999)}`,
    email,
    name,
    avatar: RandomGenerator.randomBoolean(0.7) ? `https://i.pravatar.cc/150?u=${email}` : undefined,
    userType: UserType.AGENT,
    subscription,
    preferences,
    stats,
    properties: [], // Will be populated when generating properties
    savedProperties: [], // Will be populated with random property IDs
    recentlyViewed: [], // Will be populated with random property IDs
    contactInfo,
    licenseNumber: `AG-${RandomGenerator.randomInt(10000, 99999)}`,
    createdAt,
    updatedAt: RandomGenerator.randomDate(createdAt, new Date()),
    lastLoginAt,
    isEmailVerified: true, // Agents must verify email
    isPhoneVerified: RandomGenerator.randomBoolean(0.9),
    isIdentityVerified: RandomGenerator.randomBoolean(0.8) // Most agents are verified
  };
}

/**
 * Generate company user
 */
export function generateCompanyUser(): User {
  const companyName = RandomGenerator.randomChoice(REAL_ESTATE_COMPANIES);
  const firstName = RandomGenerator.randomChoice(CHILEAN_NAMES.first);
  const lastName = RandomGenerator.randomChoice(CHILEAN_NAMES.last);
  const representativeName = `${firstName} ${lastName}`;
  const email = `contacto@${companyName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.cl`;
  
  const subscription = generateUserSubscription(UserType.COMPANY);
  const preferences = generateUserPreferences();
  const stats = generateUserStats(UserType.COMPANY, subscription);
  const contactInfo = generateProfessionalContactInfo();
  
  const createdAt = RandomGenerator.randomPastDate(1460); // Up to 4 years ago
  const lastLoginAt = RandomGenerator.randomPastDate(3); // Within last 3 days
  
  return {
    id: `company_${Date.now()}_${RandomGenerator.randomInt(1000, 9999)}`,
    email,
    name: representativeName,
    avatar: RandomGenerator.randomBoolean(0.5) ? `https://i.pravatar.cc/150?u=${email}` : undefined,
    userType: UserType.COMPANY,
    subscription,
    preferences,
    stats,
    properties: [], // Will be populated when generating properties
    savedProperties: [], // Will be populated with random property IDs
    recentlyViewed: [], // Will be populated with random property IDs
    contactInfo,
    companyName,
    companyLogo: RandomGenerator.randomBoolean(0.6) ? `https://picsum.photos/200/100?random=${Date.now()}` : undefined,
    licenseNumber: `CO-${RandomGenerator.randomInt(1000, 9999)}`,
    createdAt,
    updatedAt: RandomGenerator.randomDate(createdAt, new Date()),
    lastLoginAt,
    isEmailVerified: true, // Companies must verify email
    isPhoneVerified: true, // Companies must verify phone
    isIdentityVerified: RandomGenerator.randomBoolean(0.9) // Most companies are verified
  };
}

/**
 * Generate user of random type
 */
export function generateUser(userType?: UserType): User {
  const type = userType || RandomGenerator.randomChoice([
    UserType.INDIVIDUAL,
    UserType.INDIVIDUAL, // Weight towards individuals
    UserType.INDIVIDUAL,
    UserType.AGENT,
    UserType.COMPANY
  ]);
  
  switch (type) {
    case UserType.INDIVIDUAL:
      return generateIndividualUser();
    case UserType.AGENT:
      return generateAgentUser();
    case UserType.COMPANY:
      return generateCompanyUser();
    default:
      return generateIndividualUser();
  }
}

/**
 * Generate multiple users
 */
export function generateUsers(count: number, userType?: UserType): User[] {
  return Array.from({ length: count }, () => generateUser(userType));
}

/**
 * Update user with property relationships
 */
export function updateUserWithProperties(user: User, ownedPropertyIds: string[], savedPropertyIds: string[] = [], recentlyViewedIds: string[] = []): User {
  return {
    ...user,
    properties: ownedPropertyIds,
    savedProperties: savedPropertyIds,
    recentlyViewed: recentlyViewedIds,
    stats: {
      ...user.stats,
      totalListings: ownedPropertyIds.length,
      activeListings: Math.min(user.stats.activeListings, ownedPropertyIds.length)
    }
  };
}