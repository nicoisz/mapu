import { Property } from '../data/models/property';
import { ContactInfo } from '../data/models/contact';
import { ContactMethod } from '../data/models/enums';

/**
 * Contact action result
 */
export interface ContactResult {
  /** Whether the contact action was successful */
  success: boolean;
  /** Method used for contact */
  method?: ContactMethod;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Contact options
 */
export interface ContactOptions {
  /** Custom message to include */
  message?: string;
  /** Property reference for context */
  propertyId?: string;
  /** User's preferred contact method */
  preferredMethod?: ContactMethod;
}

/**
 * Contact Service
 * 
 * Handles contacting property owners, agents, and companies.
 * This is a mock implementation for the MVP that simulates
 * various contact methods.
 */
export class ContactService {
  /**
   * Contact property owner/agent using their preferred method
   */
  static async contactProperty(
    property: Property,
    options: ContactOptions = {}
  ): Promise<ContactResult> {
    try {
      const contact = property.contact;
      
      if (!contact) {
        return {
          success: false,
          error: 'No hay información de contacto disponible',
        };
      }

      // Determine best contact method
      const method = this.determineBestContactMethod(contact, options.preferredMethod);
      
      if (!method) {
        return {
          success: false,
          error: 'No hay métodos de contacto disponibles',
        };
      }

      // Generate contact message
      const message = this.generateContactMessage(property, options.message);

      // Execute contact action
      return this.executeContactAction(contact, method, message, property.id);
    } catch (error) {
      console.error('Error contacting property:', error);
      return {
        success: false,
        error: 'Error al intentar contactar',
      };
    }
  }

  /**
   * Contact via phone call
   */
  static async contactViaPhone(
    contact: ContactInfo,
    propertyId?: string
  ): Promise<ContactResult> {
    try {
      if (!contact.phone) {
        return {
          success: false,
          error: 'Número de teléfono no disponible',
        };
      }

      // Mock implementation - would use Linking.openURL with tel: scheme
      console.log(`Calling ${contact.phone} for property ${propertyId}`);
      
      // Simulate phone call initiation
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        method: ContactMethod.PHONE,
      };
    } catch (error) {
      console.error('Error making phone call:', error);
      return {
        success: false,
        error: 'Error al realizar la llamada',
      };
    }
  }

  /**
   * Contact via WhatsApp
   */
  static async contactViaWhatsApp(
    contact: ContactInfo,
    message: string,
    propertyId?: string
  ): Promise<ContactResult> {
    try {
      if (!contact.whatsapp && !contact.phone) {
        return {
          success: false,
          error: 'WhatsApp no disponible',
        };
      }

      const whatsappNumber = contact.whatsapp || contact.phone;
      
      // Mock implementation - would use Linking.openURL with whatsapp: scheme
      console.log(`Sending WhatsApp to ${whatsappNumber}:`, message);
      
      // Simulate WhatsApp opening
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        method: ContactMethod.WHATSAPP,
      };
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      return {
        success: false,
        error: 'Error al abrir WhatsApp',
      };
    }
  }

  /**
   * Contact via email
   */
  static async contactViaEmail(
    contact: ContactInfo,
    message: string,
    propertyId?: string
  ): Promise<ContactResult> {
    try {
      if (!contact.email) {
        return {
          success: false,
          error: 'Email no disponible',
        };
      }

      // Mock implementation - would use MailComposer or Linking
      console.log(`Sending email to ${contact.email}:`, {
        subject: `Consulta sobre propiedad ${propertyId}`,
        body: message,
      });
      
      // Simulate email app opening
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        method: ContactMethod.EMAIL,
      };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: 'Error al abrir email',
      };
    }
  }

  /**
   * Contact via SMS
   */
  static async contactViaSMS(
    contact: ContactInfo,
    message: string,
    propertyId?: string
  ): Promise<ContactResult> {
    try {
      if (!contact.phone) {
        return {
          success: false,
          error: 'Número de teléfono no disponible',
        };
      }

      // Mock implementation - would use SMS composer
      console.log(`Sending SMS to ${contact.phone}:`, message);
      
      // Simulate SMS app opening
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        method: ContactMethod.SMS,
      };
    } catch (error) {
      console.error('Error sending SMS:', error);
      return {
        success: false,
        error: 'Error al abrir SMS',
      };
    }
  }

  /**
   * Get available contact methods for a contact
   */
  static getAvailableContactMethods(contact: ContactInfo): ContactMethod[] {
    const methods: ContactMethod[] = [];

    if (contact.phone) {
      methods.push(ContactMethod.PHONE);
      methods.push(ContactMethod.SMS);
    }

    if (contact.whatsapp || contact.phone) {
      methods.push(ContactMethod.WHATSAPP);
    }

    if (contact.email) {
      methods.push(ContactMethod.EMAIL);
    }

    return methods;
  }

  /**
   * Get contact method display name
   */
  static getContactMethodDisplayName(method: ContactMethod): string {
    switch (method) {
      case ContactMethod.PHONE:
        return 'Llamar';
      case ContactMethod.WHATSAPP:
        return 'WhatsApp';
      case ContactMethod.EMAIL:
        return 'Email';
      case ContactMethod.SMS:
        return 'SMS';
      default:
        return method;
    }
  }

  /**
   * Get contact method icon
   */
  static getContactMethodIcon(method: ContactMethod): string {
    switch (method) {
      case ContactMethod.PHONE:
        return '📞';
      case ContactMethod.WHATSAPP:
        return '💬';
      case ContactMethod.EMAIL:
        return '✉️';
      case ContactMethod.SMS:
        return '💬';
      default:
        return '📞';
    }
  }

  /**
   * Determine the best contact method based on availability and preference
   */
  private static determineBestContactMethod(
    contact: ContactInfo,
    preferredMethod?: ContactMethod
  ): ContactMethod | null {
    const availableMethods = this.getAvailableContactMethods(contact);

    if (availableMethods.length === 0) {
      return null;
    }

    // If preferred method is available, use it
    if (preferredMethod && availableMethods.includes(preferredMethod)) {
      return preferredMethod;
    }

    // Default priority: WhatsApp > Phone > Email > SMS
    const priority = [
      ContactMethod.WHATSAPP,
      ContactMethod.PHONE,
      ContactMethod.EMAIL,
      ContactMethod.SMS,
    ];

    for (const method of priority) {
      if (availableMethods.includes(method)) {
        return method;
      }
    }

    return availableMethods[0];
  }

  /**
   * Generate a contact message for the property
   */
  private static generateContactMessage(
    property: Property,
    customMessage?: string
  ): string {
    const operation = property.operation === 'rent' ? 'arriendo' : 'venta';
    const type = this.getPropertyTypeText(property.type);
    const location = `${property.location.address.commune}, ${property.location.address.city}`;

    let message = `Hola! Me interesa la propiedad en ${operation}:\n\n`;
    message += `🏠 ${property.title}\n`;
    message += `📍 ${location}\n`;
    message += `🏡 ${type}`;

    if (property.features.bedrooms) {
      message += ` • ${property.features.bedrooms} dorm`;
    }
    if (property.features.bathrooms) {
      message += ` • ${property.features.bathrooms} baños`;
    }
    if (property.features.area) {
      message += ` • ${property.features.area}m²`;
    }

    if (customMessage) {
      message += `\n\n${customMessage}`;
    } else {
      message += '\n\n¿Podrían darme más información?';
    }

    message += '\n\nGracias!';

    return message;
  }

  /**
   * Execute the contact action based on method
   */
  private static async executeContactAction(
    contact: ContactInfo,
    method: ContactMethod,
    message: string,
    propertyId: string
  ): Promise<ContactResult> {
    switch (method) {
      case ContactMethod.PHONE:
        return this.contactViaPhone(contact, propertyId);
      
      case ContactMethod.WHATSAPP:
        return this.contactViaWhatsApp(contact, message, propertyId);
      
      case ContactMethod.EMAIL:
        return this.contactViaEmail(contact, message, propertyId);
      
      case ContactMethod.SMS:
        return this.contactViaSMS(contact, message, propertyId);
      
      default:
        return {
          success: false,
          error: `Método de contacto no soportado: ${method}`,
        };
    }
  }

  /**
   * Get property type display text
   */
  private static getPropertyTypeText(type: string): string {
    switch (type) {
      case 'house':
        return 'Casa';
      case 'apartment':
        return 'Departamento';
      case 'land':
        return 'Terreno';
      case 'office':
        return 'Oficina';
      case 'commercial':
        return 'Local Comercial';
      case 'warehouse':
        return 'Bodega';
      default:
        return type;
    }
  }
}