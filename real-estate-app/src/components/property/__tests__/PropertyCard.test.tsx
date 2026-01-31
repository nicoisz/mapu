import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PropertyCard } from '../PropertyCard';
import { generateProperty } from '../../../data/mock/generators';

describe('PropertyCard', () => {
  const mockProperty = generateProperty();
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders property information correctly', () => {
    const { getByText } = render(
      <PropertyCard
        property={mockProperty}
        onPress={mockOnPress}
      />
    );

    expect(getByText(mockProperty.title)).toBeTruthy();
    expect(getByText(/\$\d+/)).toBeTruthy(); // Price format
  });

  it('calls onPress when card is tapped', () => {
    const { getByTestId } = render(
      <PropertyCard
        property={mockProperty}
        onPress={mockOnPress}
        testID="property-card"
      />
    );

    fireEvent.press(getByTestId('property-card'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('shows distance when provided', () => {
    const { getByText } = render(
      <PropertyCard
        property={mockProperty}
        onPress={mockOnPress}
        showDistance={true}
        distance={1500}
      />
    );

    expect(getByText('1.5 km')).toBeTruthy();
  });

  it('shows selected state correctly', () => {
    const { getByTestId } = render(
      <PropertyCard
        property={mockProperty}
        onPress={mockOnPress}
        isSelected={true}
        testID="property-card"
      />
    );

    const card = getByTestId('property-card');
    expect(card.props.style.borderWidth).toBe(2);
    expect(card.props.style.borderColor).toBe('#0F2A44');
  });

  it('displays property features correctly', () => {
    const propertyWithFeatures = {
      ...mockProperty,
      features: {
        ...mockProperty.features,
        bedrooms: 3,
        bathrooms: 2,
        area: 120,
      }
    };

    const { getByText } = render(
      <PropertyCard
        property={propertyWithFeatures}
        onPress={mockOnPress}
      />
    );

    expect(getByText('• 3 dorm')).toBeTruthy();
    expect(getByText('• 2 baños')).toBeTruthy();
    expect(getByText('• 120m²')).toBeTruthy();
  });
});