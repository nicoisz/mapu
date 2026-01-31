import { Property } from '../data/models/property';

/**
 * Share options for property sharing
 */
export interface ShareOptions {
  /** Title for the share dialog */
  title?: string;
  /** Message to include with the share */
  message?: string;
  /** URL to share (if applicable) */
  url?: string;
  /** Whether to include property images */
  includeImages?: boolean;
}

/**
 * Share result
 */
export interface ShareResult {
  /** Whether the share was successful */
  success: boolean;
  /** Platform used for sharing (if successful) */
  platform?: string;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Social media platforms
 */
export enum SocialPlatform {
  WHATSAPP = 'whatsapp',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  TWITTER = 'twitter',
  EMAIL = 'email',
  SMS = 'sms',
  COPY_LINK = 'copy_link',
}

/**
 * Share Service
 * 
 * Handles sharing property information to social media platforms
 * and messaging apps. This is a mock implementation for the MVP.
 */
export class ShareService {
  /**
   * Share a property using the native share dialog
   */
  static async shareProperty(
    property: Property,
    options: ShareOptions = {}
  ): Promise<ShareResult> {
    try {
      // Format property information for sharing
      const shareText = this.formatPropertyForShare(property, options);
      
      // Mock implementation - in a real app, this would use React Native's Share API
      // or a third-party sharing library
      console.log('Sharing property:', {
        title: options.title || `Propiedad en ${property.location.address.city}`,
        message: shareText,
        url: options.url,
      });

      // Simulate sharing success
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        platform: 'native_share',
      };
    } catch (error) {
      console.error('Error sharing property:', error);
      return {
        success: false,
        error: 'Error al compartir la propiedad',
      };
    }
  }

  /**
   * Share property to a specific social platform
   */
  static async shareToSocialPlatform(
    property: Property,
    platform: SocialPlatform,
    options: ShareOptions = {}
  ): Promise<ShareResult> {
    try {
      const shareText = this.formatPropertyForShare(property, options);
      
      switch (platform) {
        case SocialPlatform.WHATSAPP:
          return this.shareToWhatsApp(shareText, property);
        
        case SocialPlatform.FACEBOOK:
          return this.shareToFacebook(shareText, property, options.url);
        
        case SocialPlatform.INSTAGRAM:
          return this.shareToInstagram(property);
        
        case SocialPlatform.TWITTER:
          return this.shareToTwitter(shareText, options.url);
        
        case SocialPlatform.EMAIL:
          return this.shareViaEmail(shareText, property);
        
        case SocialPlatform.SMS:
          return this.shareViaSMS(shareText);
        
        case SocialPlatform.COPY_LINK:
          return this.copyToClipboard(shareText, options.url);
        
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      console.error(`Error sharing to ${platform}:`, error);
      return {
        success: false,
        error: `Error al compartir en ${platform}`,
      };
    }
  }

  /**
   * Format property information for sharing
   */
  private static formatPropertyForShare(
    property: Property,
    options: ShareOptions
  ): string {
    const price = property.operation === 'rent' && property.pricing.monthlyRent
      ? `$${property.pricing.monthlyRent.toLocaleString('es-CL')}/mes`
      : `$${property.pricing.price.toLocaleString('es-CL')}`;

    const operation = property.operation === 'rent' ? 'Arriendo' : 'Venta';
    const type = this.getPropertyTypeText(property.type);
    
    const features = [];
    if (property.features.bedrooms) {
      features.push(`${property.features.bedrooms} dorm`);
    }
    if (property.features.bathrooms) {
      features.push(`${property.features.bathrooms} baños`);
    }
    if (property.features.area) {
      features.push(`${property.features.area}m²`);
    }

    const location = `${property.location.address.commune}, ${property.location.address.city}`;

    let shareText = `🏠 ${property.title}\n\n`;
    shareText += `💰 ${price} - ${operation}\n`;
    shareText += `📍 ${location}\n`;
    shareText += `🏡 ${type}`;
    
    if (features.length > 0) {
      shareText += ` • ${features.join(' • ')}`;
    }
    
    if (options.message) {
      shareText += `\n\n${options.message}`;
    }

    shareText += '\n\n¡Encuentra más propiedades en nuestra app!';

    return shareText;
  }

  /**
   * Share to WhatsApp
   */
  private static async shareToWhatsApp(
    text: string,
    property: Property
  ): Promise<ShareResult> {
    // Mock implementation - would use Linking.openURL with whatsapp:// scheme
    console.log('Sharing to WhatsApp:', text);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      platform: 'whatsapp',
    };
  }

  /**
   * Share to Facebook
   */
  private static async shareToFacebook(
    text: string,
    property: Property,
    url?: string
  ): Promise<ShareResult> {
    // Mock implementation - would use Facebook SDK or web URL
    console.log('Sharing to Facebook:', { text, url });
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      platform: 'facebook',
    };
  }

  /**
   * Share to Instagram
   */
  private static async shareToInstagram(property: Property): Promise<ShareResult> {
    // Mock implementation - would use Instagram sharing
    console.log('Sharing to Instagram:', property.media.images[0]?.url);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      platform: 'instagram',
    };
  }

  /**
   * Share to Twitter
   */
  private static async shareToTwitter(
    text: string,
    url?: string
  ): Promise<ShareResult> {
    // Mock implementation - would use Twitter web intent or SDK
    console.log('Sharing to Twitter:', { text, url });
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      platform: 'twitter',
    };
  }

  /**
   * Share via email
   */
  private static async shareViaEmail(
    text: string,
    property: Property
  ): Promise<ShareResult> {
    // Mock implementation - would use MailComposer or Linking
    console.log('Sharing via email:', {
      subject: `Propiedad en ${property.location.address.city}`,
      body: text,
    });
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      platform: 'email',
    };
  }

  /**
   * Share via SMS
   */
  private static async shareViaSMS(text: string): Promise<ShareResult> {
    // Mock implementation - would use SMS composer
    console.log('Sharing via SMS:', text);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      platform: 'sms',
    };
  }

  /**
   * Copy to clipboard
   */
  private static async copyToClipboard(
    text: string,
    url?: string
  ): Promise<ShareResult> {
    // Mock implementation - would use Clipboard API
    const content = url ? `${text}\n\n${url}` : text;
    console.log('Copying to clipboard:', content);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      platform: 'clipboard',
    };
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

  /**
   * Get available sharing platforms
   */
  static getAvailablePlatforms(): SocialPlatform[] {
    // In a real app, this would check which apps are installed
    return [
      SocialPlatform.WHATSAPP,
      SocialPlatform.FACEBOOK,
      SocialPlatform.INSTAGRAM,
      SocialPlatform.TWITTER,
      SocialPlatform.EMAIL,
      SocialPlatform.SMS,
      SocialPlatform.COPY_LINK,
    ];
  }

  /**
   * Get platform display name
   */
  static getPlatformDisplayName(platform: SocialPlatform): string {
    switch (platform) {
      case SocialPlatform.WHATSAPP:
        return 'WhatsApp';
      case SocialPlatform.FACEBOOK:
        return 'Facebook';
      case SocialPlatform.INSTAGRAM:
        return 'Instagram';
      case SocialPlatform.TWITTER:
        return 'Twitter';
      case SocialPlatform.EMAIL:
        return 'Email';
      case SocialPlatform.SMS:
        return 'SMS';
      case SocialPlatform.COPY_LINK:
        return 'Copiar enlace';
      default:
        return platform;
    }
  }

  /**
   * Get platform icon/emoji
   */
  static getPlatformIcon(platform: SocialPlatform): string {
    switch (platform) {
      case SocialPlatform.WHATSAPP:
        return '💬';
      case SocialPlatform.FACEBOOK:
        return '📘';
      case SocialPlatform.INSTAGRAM:
        return '📷';
      case SocialPlatform.TWITTER:
        return '🐦';
      case SocialPlatform.EMAIL:
        return '✉️';
      case SocialPlatform.SMS:
        return '💬';
      case SocialPlatform.COPY_LINK:
        return '🔗';
      default:
        return '📤';
    }
  }
}