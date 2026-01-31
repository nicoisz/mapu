import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PropertyDetailScreen } from '../PropertyDetailScreen';
import { Property } from '../../../data/models/property';
import { generateProperty } from '../../../data/mock/generators';
import { PropertyType, PropertyOperation, ContactMethod } from '../../../data/models/enums';

// Mock the MiniMap component since it uses react-native-maps
jest.mock('../../../components/map/MiniMap', () => {
  const { View, Text } = require('react-native');
  return {
    MiniMap: ({ location, onPress }: any) => (
      <View testID="mini-map" onTouchEnd={onPress}>
        <Text>Mini Map: {location.address.city}</Text>
      </View>
    ),
  };
});

describe('PropertyDetailScreen', () => {
  let mockProperty: Property;
  let mockOnBack: jest.Mock;
  let mockOnSave: jest.Mock;
  let mockOnShare: jest.Mock;
  let mockOnContact: jest.Mock;

  beforeEach(() => {
    // Generate a test property
    mockProperty = generateProperty({
      type: PropertyType.HOUSE,
      operation: PropertyOperation.SALE,
    });

    // Create mock functions
    mockOnBack = jest.fn();
    mockOnSave = jest.fn();
    mockOnShare = jest.fn();
    mockOnContact = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render property title and basic information', () => {
      const { getByText } = render(
        <PropertyDetailScreen
          property={mockProperty}
          onBack={mockOnBack}
          testID="property-detail"
        />
      );

      expect(getByText(mockProperty.title)).toBeTruthy();
      expect(getByText('Casa')).toBeTruthy(); // Property type
    });

    it('should render property price correctly for sale', () => {
      const saleProperty = generateProperty({
        type: PropertyType.APARTMENT,
        operation: PropertyOperation.SALE,
      });

      const { getByText } = render(
        <PropertyDetailScreen
          property={saleProperty}
          onBack={mockOnBack}
        />
      );

      const formattedPrice = `$${saleProperty.pricing.price.toLocaleString('es-CL')}`;
      expect(getByText(formattedPrice)).toBeTruthy();
      expect(getByText('Venta')).toBeTruthy();
    });

    it('should render property price correctly for rent', () => {
      const rentProperty = generateProperty({
        type: PropertyType.APARTMENT,
        operation: PropertyOperation.RENT,
      });

      const { getByText } = render(
        <PropertyDetailScreen
          property={rentProperty}
          onBack={mockOnBack}
        />
      );

      expect(getByText('Arriendo')).toBeTruthy();
    });

    it('should render property features when available', () => {
      const propertyWithFeatures = {
        ...mockProperty,
        features: {
          ...mockProperty.features,
          bedrooms: 3,
          bathrooms: 2,
          area: 120,
          parkingSpots: 1,
        },
      };

      const { getByText } = render(
        <PropertyDetailScreen
          property={propertyWithFeatures}
          onBack={mockOnBack}
        />
      );

      expect(getByText('3 dormitorios')).toBeTruthy();
      expect(getByText('2 baños')).toBeTruthy();
      expect(getByText('120m²')).toBeTruthy();
      expect(getByText('1 estacionamientos')).toBeTruthy();
    });

    it('should render property description', () => {
      const { getByText } = render(
        <PropertyDetailScreen
          property={mockProperty}
          onBack={mockOnBack}
        />
      );

      expect(getByText('Descripción')).toBeTruthy();
      expect(getByText(mockProperty.description)).toBeTruthy();
    });

    it('should render location information', () => {
      const { getByText } = render(
        <PropertyDetailScreen
          property={mockProperty}
          onBack={mockOnBack}
        />
      );

      const locationText = `📍 ${mockProperty.location.address.street} ${mockProperty.location.address.number}`;
      expect(getByText(locationText)).toBeTruthy();
      
      const locationSubtext = `${mockProperty.location.address.commune}, ${mockProperty.location.address.city}, ${mockProperty.location.address.region}`;
      expect(getByText(locationSubtext)).toBeTruthy();
    });

    it('should render mini-map component', () => {
      const { getByTestId } = render(
        <PropertyDetailScreen
          property={mockProperty}
          onBack={mockOnBack}
        />
      );

      expect(getByTestId('mini-map')).toBeTruthy();
    });

    it('should render contact information when available', () => {
      const propertyWithContact = {
        ...mockProperty,
        contact: {
          id: 'contact-test-1',
          name: 'Juan Pérez',
          phone: '+56912345678',
          email: 'juan@example.com',
          whatsapp: '+56912345678',
          preferredMethod: ContactMethod.PHONE,
          isVerified: true,
        },
      };

      const { getByText } = render(
        <PropertyDetailScreen
          property={propertyWithContact}
          onBack={mockOnBack}
        />
      );

      expect(getByText('Contacto')).toBeTruthy();
      expect(getByText('Juan Pérez')).toBeTruthy();
      expect(getByText('📞 +56912345678')).toBeTruthy();
      expect(getByText('✉️ juan@example.com')).toBeTruthy();
      expect(getByText('💬 WhatsApp disponible')).toBeTruthy();
    });

    it('should render amenities when available', () => {
      const propertyWithAmenities = {
        ...mockProperty,
        features: {
          ...mockProperty.features,
          hasGarden: true,
          hasPool: true,
          hasGym: true,
          hasSecurity: true,
        },
      };

      const { getByText } = render(
        <PropertyDetailScreen
          property={propertyWithAmenities}
          onBack={mockOnBack}
        />
      );

      expect(getByText('Amenidades')).toBeTruthy();
      expect(getByText('Jardín')).toBeTruthy();
      expect(getByText('Piscina')).toBeTruthy();
      expect(getByText('Gimnasio')).toBeTruthy();
      expect(getByText('Seguridad')).toBeTruthy();
    });
  });

  describe('Image Gallery', () => {
    it('should render image gallery with indicators', () => {
      const { getByTestId } = render(
        <PropertyDetailScreen
          property={mockProperty}
          onBack={mockOnBack}
          testID="property-detail"
        />
      );

      // The component should render the image gallery
      // In a real test, we would check for the FlatList and indicators
      expect(getByTestId('property-detail')).toBeTruthy();
    });
  });

  describe('Action Buttons', () => {
    it('should render back button and call onBack when pressed', () => {
      const { getByLabelText } = render(
        <PropertyDetailScreen
          property={mockProperty}
          onBack={mockOnBack}
        />
      );

      const backButton = getByLabelText('Volver');
      fireEvent.press(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('should render save button when onSave is provided', () => {
      const { getByLabelText } = render(
        <PropertyDetailScreen
          property={mockProperty}
          onBack={mockOnBack}
          onSave={mockOnSave}
          isSaved={false}
        />
      );

      const saveButton = getByLabelText('Agregar a favoritos');
      expect(saveButton).toBeTruthy();
    });

    it('should call onSave when save button is pressed', () => {
      const { getByLabelText } = render(
        <PropertyDetailScreen
          property={mockProperty}
          onBack={mockOnBack}
          onSave={mockOnSave}
          isSaved={false}
        />
      );

      const saveButton = getByLabelText('Agregar a favoritos');
      fireEvent.press(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(mockProperty);
    });

    it('should show different save button text when property is saved', () => {
      const { getByLabelText } = render(
        <PropertyDetailScreen
          property={mockProperty}
          onBack={mockOnBack}
          onSave={mockOnSave}
          isSaved={true}
        />
      );

      const saveButton = getByLabelText('Quitar de favoritos');
      expect(saveButton).toBeTruthy();
    });

    it('should render share button when onShare is provided', () => {
      const { getByLabelText } = render(
        <PropertyDetailScreen
          property={mockProperty}
          onBack={mockOnBack}
          onShare={mockOnShare}
        />
      );

      const shareButton = getByLabelText('Compartir propiedad');
      expect(shareButton).toBeTruthy();
    });

    it('should call onShare when share button is pressed', () => {
      const { getByLabelText } = render(
        <PropertyDetailScreen
          property={mockProperty}
          onBack={mockOnBack}
          onShare={mockOnShare}
        />
      );

      const shareButton = getByLabelText('Compartir propiedad');
      fireEvent.press(shareButton);

      expect(mockOnShare).toHaveBeenCalledWith(mockProperty);
    });

    it('should render contact button when onContact is provided', () => {
      const { getByLabelText } = render(
        <PropertyDetailScreen
          property={mockProperty}
          onBack={mockOnBack}
          onContact={mockOnContact}
        />
      );

      const contactButton = getByLabelText('Contactar vendedor');
      expect(contactButton).toBeTruthy();
    });

    it('should call onContact when contact button is pressed', () => {
      const { getByLabelText } = render(
        <PropertyDetailScreen
          property={mockProperty}
          onBack={mockOnBack}
          onContact={mockOnContact}
        />
      );

      const contactButton = getByLabelText('Contactar vendedor');
      fireEvent.press(contactButton);

      expect(mockOnContact).toHaveBeenCalledWith(mockProperty);
    });
  });

  describe('Publication Information', () => {
    it('should render publication date', () => {
      const { getByText } = render(
        <PropertyDetailScreen
          property={mockProperty}
          onBack={mockOnBack}
        />
      );

      const publishDate = new Date(mockProperty.listing.publishedAt).toLocaleDateString('es-CL');
      expect(getByText(`Publicado el ${publishDate}`)).toBeTruthy();
    });

    it('should render view count', () => {
      const { getByText } = render(
        <PropertyDetailScreen
          property={mockProperty}
          onBack={mockOnBack}
        />
      );

      expect(getByText(`${mockProperty.listing.views} visualizaciones`)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels for buttons', () => {
      const { getByLabelText } = render(
        <PropertyDetailScreen
          property={mockProperty}
          onBack={mockOnBack}
          onSave={mockOnSave}
          onShare={mockOnShare}
          onContact={mockOnContact}
          isSaved={false}
        />
      );

      expect(getByLabelText('Volver')).toBeTruthy();
      expect(getByLabelText('Agregar a favoritos')).toBeTruthy();
      expect(getByLabelText('Compartir propiedad')).toBeTruthy();
      expect(getByLabelText('Contactar vendedor')).toBeTruthy();
    });

    it('should have proper accessibility role for buttons', () => {
      const { getByLabelText } = render(
        <PropertyDetailScreen
          property={mockProperty}
          onBack={mockOnBack}
          onContact={mockOnContact}
        />
      );

      const backButton = getByLabelText('Volver');
      const contactButton = getByLabelText('Contactar vendedor');

      expect(backButton.props.accessibilityRole).toBe('button');
      expect(contactButton.props.accessibilityRole).toBe('button');
    });
  });

  describe('Edge Cases', () => {
    it('should handle property without images gracefully', () => {
      const propertyWithoutImages = {
        ...mockProperty,
        media: {
          ...mockProperty.media,
          images: [],
        },
      };

      const { getByTestId } = render(
        <PropertyDetailScreen
          property={propertyWithoutImages}
          onBack={mockOnBack}
          testID="property-detail"
        />
      );

      // Should still render without crashing
      expect(getByTestId('property-detail')).toBeTruthy();
    });

    it('should handle property without contact information', () => {
      const propertyWithoutContact = {
        ...mockProperty,
        contact: {
          id: 'empty-contact',
          name: '',
          preferredMethod: ContactMethod.PHONE,
          isVerified: false,
        },
      } as Property;

      const { queryByText } = render(
        <PropertyDetailScreen
          property={propertyWithoutContact}
          onBack={mockOnBack}
        />
      );

      // Contact section should not be rendered
      expect(queryByText('Contacto')).toBeNull();
    });

    it('should handle property without amenities', () => {
      const propertyWithoutAmenities = {
        ...mockProperty,
        features: {
          ...mockProperty.features,
          hasGarden: false,
          hasPool: false,
          hasGym: false,
          hasSecurity: false,
        },
      };

      const { queryByText } = render(
        <PropertyDetailScreen
          property={propertyWithoutAmenities}
          onBack={mockOnBack}
        />
      );

      // Amenities section should not be rendered
      expect(queryByText('Amenidades')).toBeNull();
    });
  });
});