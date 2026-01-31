# Data Models Documentation

This directory contains all TypeScript interfaces and enums for the Chilean Real Estate Mobile App. These models provide type safety and structure for the application's data layer.

## Overview

The data models are organized into several categories:

- **Core Models**: Property, User, Location, Contact
- **Enums**: Property types, user types, subscription types, etc.
- **API Models**: Request/response interfaces for backend communication
- **UI Models**: Interface types for user interface components

## Core Models

### Property (`property.ts`)

The `Property` interface represents a real estate listing with comprehensive information:

- **Basic Info**: Title, description, type, operation (sale/rent)
- **Location**: Geographic coordinates and Chilean address
- **Pricing**: Price, currency, additional costs, price history
- **Features**: Bedrooms, bathrooms, area, amenities
- **Media**: Images, videos, virtual tours
- **Listing**: Publication dates, views, premium status

### User (`user.ts`)

The `User` interface supports the freemium business model:

- **Profile**: Basic user information and contact details
- **Subscription**: Free/premium status with feature access
- **Preferences**: Language, currency, notification settings
- **Statistics**: Listing performance and user activity
- **Relationships**: Owned properties, saved properties

### Location (`location.ts`)

Location models support Chilean geography:

- **Location**: Basic latitude/longitude coordinates
- **Region**: Map view region with zoom deltas
- **Address**: Complete Chilean address with regions
- **PropertyLocation**: Combined coordinates and address

### Contact (`contact.ts`)

Contact models for property inquiries:

- **ContactInfo**: Owner/agent contact details
- **ContactAvailability**: Schedule and time slots
- **ContactMethod**: Preferred communication channels

## Enums (`enums.ts`)

Standardized values for consistent data:

- **PropertyType**: house, apartment, land
- **PropertyOperation**: sale, rent
- **UserType**: individual, agent, company
- **SubscriptionType**: free, premium
- **ChileanRegion**: All 16 Chilean regions
- **Currency**: CLP (Chilean Peso), USD

## API Models (`api.ts`)

Interfaces for backend communication:

- **ApiResponse**: Generic response wrapper
- **PaginatedResponse**: List responses with pagination
- **FileUploadResponse**: Image/document upload results
- **GeolocationResponse**: GPS location data

## UI Models (`ui.ts`)

Types for user interface components:

- **LoadingState**: Async operation states
- **ModalConfig**: Modal dialog configuration
- **BottomSheetConfig**: Bottom sheet settings
- **Navigation**: Route parameter types

## Usage Examples

### Creating a Property

```typescript
import { Property, PropertyType, PropertyOperation, Currency } from '@/data/models';

const newProperty: Property = {
  id: 'prop_123',
  title: 'Casa en Las Condes',
  description: 'Hermosa casa con jardín',
  type: PropertyType.HOUSE,
  operation: PropertyOperation.SALE,
  pricing: {
    price: 150000000,
    currency: Currency.CLP,
    isNegotiable: true
  },
  location: {
    latitude: -33.4089,
    longitude: -70.5045,
    address: {
      street: 'Av. Las Condes',
      number: '123',
      city: 'Santiago',
      region: ChileanRegion.METROPOLITANA,
      country: 'Chile'
    }
  },
  // ... other required fields
};
```

### User with Subscription

```typescript
import { User, UserType, SubscriptionType } from '@/data/models';

const user: User = {
  id: 'user_456',
  email: 'juan@example.com',
  name: 'Juan Pérez',
  userType: UserType.INDIVIDUAL,
  subscription: {
    type: SubscriptionType.FREE,
    startDate: new Date(),
    isActive: true,
    features: ['basic_listing', 'search'],
    listingsLimit: 1,
    remainingListings: 1
  },
  // ... other required fields
};
```

### Search Filters

```typescript
import { PropertySearchFilters, PropertyType, Currency } from '@/data/models';

const filters: PropertySearchFilters = {
  type: [PropertyType.HOUSE, PropertyType.APARTMENT],
  priceRange: {
    min: 50000000,
    max: 200000000,
    currency: Currency.CLP
  },
  bedrooms: {
    min: 2,
    max: 4
  },
  features: {
    hasGarden: true,
    parkingSpots: 1
  }
};
```

## Chilean Market Specifics

The models include Chilean-specific features:

- **Regions**: All 16 official Chilean regions
- **Currency**: Chilean Peso (CLP) as primary currency
- **Address Format**: Chilean address structure with communes
- **Legal Info**: Property registration IDs and legal status
- **Energy Rating**: Chilean energy efficiency standards (A-G)

## Type Safety Benefits

Using these TypeScript interfaces provides:

- **Compile-time validation**: Catch errors before runtime
- **IntelliSense support**: Better IDE autocomplete and suggestions
- **Refactoring safety**: Automated updates when interfaces change
- **Documentation**: Self-documenting code with clear contracts
- **API consistency**: Matching frontend and backend data structures

## Future Backend Integration

These interfaces are designed to match future API responses:

- **Consistent naming**: camelCase for JavaScript, snake_case for API
- **Optional fields**: Marked appropriately for partial updates
- **Validation ready**: Compatible with schema validation libraries
- **Extensible**: Easy to add new fields without breaking changes

## Testing Support

The models support both unit and property-based testing:

- **Mock data generation**: Structured interfaces for test data
- **Property testing**: Type-safe generators for random data
- **Validation testing**: Ensure data integrity across the app
- **API testing**: Mock responses with correct types