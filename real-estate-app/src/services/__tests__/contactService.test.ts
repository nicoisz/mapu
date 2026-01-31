import { ContactService } from '../contactService';
import { ContactMethod } from '../../data/models/enums';
import { ContactInfo } from '../../data/models/contact';
import { generateProperty } from '../../data/mock/generators';
import { PropertyType, PropertyOperation } from '../../data/models/enums';

describe('ContactService', () => {
  let mockProperty: any;

  beforeEach(() => {
    mockProperty = generateProperty({
      type: PropertyType.HOUSE,
      operation: PropertyOperation.SALE,
    });

    // Add contact information
    mockProperty.contact = {
      id: 'contact-1',
      name: 'Juan Pérez',
      phone: '+56912345678',
      email: 'juan@example.com',
      whatsapp: '+56912345678',
      preferredMethod: ContactMethod.PHONE,
      isVerified: true,
    };

    // Mock console.log to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('contactProperty', () => {
    it('should successfully contact property with default method', async () => {
      const result = await ContactService.contactProperty(mockProperty);

      expect(result.success).toBe(true);
      expect(result.method).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should use preferred contact method when available', async () => {
      const result = await ContactService.contactProperty(mockProperty, {
        preferredMethod: ContactMethod.EMAIL,
      });

      expect(result.success).toBe(true);
      expect(result.method).toBe(ContactMethod.EMAIL);
    });

    it('should include custom message when provided', async () => {
      const customMessage = 'I am interested in this property';
      const consoleSpy = jest.spyOn(console, 'log');

      await ContactService.contactProperty(mockProperty, {
        message: customMessage,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sending'),
        expect.stringContaining(customMessage)
      );
    });

    it('should handle property without contact information', async () => {
      const propertyWithoutContact = {
        ...mockProperty,
        contact: null,
      };

      const result = await ContactService.contactProperty(propertyWithoutContact);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No hay información de contacto disponible');
    });

    it('should handle contact with no available methods', async () => {
      const propertyWithEmptyContact = {
        ...mockProperty,
        contact: {
          name: 'John Doe',
        },
      };

      const result = await ContactService.contactProperty(propertyWithEmptyContact);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No hay métodos de contacto disponibles');
    });
  });

  describe('contactViaPhone', () => {
    it('should successfully initiate phone call', async () => {
      const result = await ContactService.contactViaPhone(mockProperty.contact, mockProperty.id);

      expect(result.success).toBe(true);
      expect(result.method).toBe(ContactMethod.PHONE);
    });

    it('should handle contact without phone number', async () => {
      const contactWithoutPhone = {
        id: 'contact-2',
        name: 'Jane Doe',
        email: 'jane@example.com',
        preferredMethod: ContactMethod.EMAIL,
        isVerified: true,
      };

      const result = await ContactService.contactViaPhone(contactWithoutPhone);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Número de teléfono no disponible');
    });
  });

  describe('contactViaWhatsApp', () => {
    it('should successfully send WhatsApp message', async () => {
      const message = 'Hello, I am interested in your property';
      const result = await ContactService.contactViaWhatsApp(
        mockProperty.contact,
        message,
        mockProperty.id
      );

      expect(result.success).toBe(true);
      expect(result.method).toBe(ContactMethod.WHATSAPP);
    });

    it('should use phone number when WhatsApp number is not available', async () => {
      const contactWithPhoneOnly = {
        id: 'contact-3',
        name: 'John Doe',
        phone: '+56987654321',
        preferredMethod: ContactMethod.PHONE,
        isVerified: true,
      };

      const result = await ContactService.contactViaWhatsApp(
        contactWithPhoneOnly,
        'Test message'
      );

      expect(result.success).toBe(true);
      expect(result.method).toBe(ContactMethod.WHATSAPP);
    });

    it('should handle contact without WhatsApp or phone', async () => {
      const contactWithoutWhatsApp = {
        id: 'contact-4',
        name: 'Jane Doe',
        email: 'jane@example.com',
        preferredMethod: ContactMethod.EMAIL,
        isVerified: true,
      };

      const result = await ContactService.contactViaWhatsApp(
        contactWithoutWhatsApp,
        'Test message'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('WhatsApp no disponible');
    });
  });

  describe('contactViaEmail', () => {
    it('should successfully send email', async () => {
      const message = 'I am interested in your property';
      const result = await ContactService.contactViaEmail(
        mockProperty.contact,
        message,
        mockProperty.id
      );

      expect(result.success).toBe(true);
      expect(result.method).toBe(ContactMethod.EMAIL);
    });

    it('should handle contact without email', async () => {
      const contactWithoutEmail = {
        id: 'contact-5',
        name: 'John Doe',
        phone: '+56912345678',
        preferredMethod: ContactMethod.PHONE,
        isVerified: true,
      };

      const result = await ContactService.contactViaEmail(
        contactWithoutEmail,
        'Test message'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email no disponible');
    });
  });

  describe('contactViaSMS', () => {
    it('should successfully send SMS', async () => {
      const message = 'I am interested in your property';
      const result = await ContactService.contactViaSMS(
        mockProperty.contact,
        message,
        mockProperty.id
      );

      expect(result.success).toBe(true);
      expect(result.method).toBe(ContactMethod.SMS);
    });

    it('should handle contact without phone number', async () => {
      const contactWithoutPhone = {
        id: 'contact-6',
        name: 'Jane Doe',
        email: 'jane@example.com',
        preferredMethod: ContactMethod.EMAIL,
        isVerified: true,
      };

      const result = await ContactService.contactViaSMS(
        contactWithoutPhone,
        'Test message'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Número de teléfono no disponible');
    });
  });

  describe('getAvailableContactMethods', () => {
    it('should return all available methods for complete contact', () => {
      const methods = ContactService.getAvailableContactMethods(mockProperty.contact);

      expect(methods).toContain(ContactMethod.PHONE);
      expect(methods).toContain(ContactMethod.WHATSAPP);
      expect(methods).toContain(ContactMethod.EMAIL);
      expect(methods).toContain(ContactMethod.SMS);
    });

    it('should return only phone and SMS for contact with phone only', () => {
      const contactWithPhoneOnly = {
        id: 'contact-7',
        name: 'John Doe',
        phone: '+56912345678',
        preferredMethod: ContactMethod.PHONE,
        isVerified: true,
      };

      const methods = ContactService.getAvailableContactMethods(contactWithPhoneOnly);

      expect(methods).toContain(ContactMethod.PHONE);
      expect(methods).toContain(ContactMethod.SMS);
      expect(methods).toContain(ContactMethod.WHATSAPP); // Uses phone number
      expect(methods).not.toContain(ContactMethod.EMAIL);
    });

    it('should return only email for contact with email only', () => {
      const contactWithEmailOnly = {
        id: 'contact-8',
        name: 'Jane Doe',
        email: 'jane@example.com',
        preferredMethod: ContactMethod.EMAIL,
        isVerified: true,
      };

      const methods = ContactService.getAvailableContactMethods(contactWithEmailOnly);

      expect(methods).toContain(ContactMethod.EMAIL);
      expect(methods).not.toContain(ContactMethod.PHONE);
      expect(methods).not.toContain(ContactMethod.SMS);
      expect(methods).not.toContain(ContactMethod.WHATSAPP);
    });

    it('should return empty array for contact with no methods', () => {
      const contactWithNoMethods = {
        id: 'contact-9',
        name: 'John Doe',
        preferredMethod: ContactMethod.PHONE,
        isVerified: true,
      };

      const methods = ContactService.getAvailableContactMethods(contactWithNoMethods);

      expect(methods).toHaveLength(0);
    });
  });

  describe('getContactMethodDisplayName', () => {
    it('should return correct display names for contact methods', () => {
      expect(ContactService.getContactMethodDisplayName(ContactMethod.PHONE)).toBe('Llamar');
      expect(ContactService.getContactMethodDisplayName(ContactMethod.WHATSAPP)).toBe('WhatsApp');
      expect(ContactService.getContactMethodDisplayName(ContactMethod.EMAIL)).toBe('Email');
      expect(ContactService.getContactMethodDisplayName(ContactMethod.SMS)).toBe('SMS');
    });
  });

  describe('getContactMethodIcon', () => {
    it('should return correct icons for contact methods', () => {
      expect(ContactService.getContactMethodIcon(ContactMethod.PHONE)).toBe('📞');
      expect(ContactService.getContactMethodIcon(ContactMethod.WHATSAPP)).toBe('💬');
      expect(ContactService.getContactMethodIcon(ContactMethod.EMAIL)).toBe('✉️');
      expect(ContactService.getContactMethodIcon(ContactMethod.SMS)).toBe('💬');
    });
  });

  describe('Message generation', () => {
    it('should generate appropriate message for sale property', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      await ContactService.contactProperty(mockProperty);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('venta')
      );
    });

    it('should generate appropriate message for rent property', async () => {
      const rentProperty = {
        ...mockProperty,
        operation: PropertyOperation.RENT,
      };

      const consoleSpy = jest.spyOn(console, 'log');
      
      await ContactService.contactProperty(rentProperty);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('arriendo')
      );
    });

    it('should include property features in message', async () => {
      const propertyWithFeatures = {
        ...mockProperty,
        features: {
          ...mockProperty.features,
          bedrooms: 3,
          bathrooms: 2,
          area: 120,
        },
      };

      const consoleSpy = jest.spyOn(console, 'log');
      
      await ContactService.contactProperty(propertyWithFeatures);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringMatching(/3 dorm.*2 baños.*120m²/)
      );
    });

    it('should include property location in message', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      await ContactService.contactProperty(mockProperty);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining(mockProperty.location.address.commune)
      );
    });
  });
});