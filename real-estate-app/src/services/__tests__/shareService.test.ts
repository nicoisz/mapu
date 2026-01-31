import { ShareService, SocialPlatform } from '../shareService';
import { generateProperty } from '../../data/mock/generators';
import { PropertyType, PropertyOperation } from '../../data/models/enums';

describe('ShareService', () => {
  let mockProperty: any;

  beforeEach(() => {
    mockProperty = generateProperty({
      type: PropertyType.HOUSE,
      operation: PropertyOperation.SALE,
    });

    // Mock console.log to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('shareProperty', () => {
    it('should successfully share a property with default options', async () => {
      const result = await ShareService.shareProperty(mockProperty);

      expect(result.success).toBe(true);
      expect(result.platform).toBe('native_share');
      expect(result.error).toBeUndefined();
    });

    it('should successfully share a property with custom options', async () => {
      const options = {
        title: 'Custom Title',
        message: 'Custom message',
        url: 'https://example.com',
      };

      const result = await ShareService.shareProperty(mockProperty, options);

      expect(result.success).toBe(true);
      expect(result.platform).toBe('native_share');
    });

    it('should format property information correctly for sharing', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      await ShareService.shareProperty(mockProperty);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Sharing property:',
        expect.objectContaining({
          title: expect.stringContaining(mockProperty.location.address.city),
          message: expect.stringContaining(mockProperty.title),
        })
      );
    });
  });

  describe('shareToSocialPlatform', () => {
    it('should share to WhatsApp successfully', async () => {
      const result = await ShareService.shareToSocialPlatform(
        mockProperty,
        SocialPlatform.WHATSAPP
      );

      expect(result.success).toBe(true);
      expect(result.platform).toBe('whatsapp');
    });

    it('should share to Facebook successfully', async () => {
      const result = await ShareService.shareToSocialPlatform(
        mockProperty,
        SocialPlatform.FACEBOOK,
        { url: 'https://example.com' }
      );

      expect(result.success).toBe(true);
      expect(result.platform).toBe('facebook');
    });

    it('should share to Instagram successfully', async () => {
      const result = await ShareService.shareToSocialPlatform(
        mockProperty,
        SocialPlatform.INSTAGRAM
      );

      expect(result.success).toBe(true);
      expect(result.platform).toBe('instagram');
    });

    it('should share to Twitter successfully', async () => {
      const result = await ShareService.shareToSocialPlatform(
        mockProperty,
        SocialPlatform.TWITTER,
        { url: 'https://example.com' }
      );

      expect(result.success).toBe(true);
      expect(result.platform).toBe('twitter');
    });

    it('should share via email successfully', async () => {
      const result = await ShareService.shareToSocialPlatform(
        mockProperty,
        SocialPlatform.EMAIL
      );

      expect(result.success).toBe(true);
      expect(result.platform).toBe('email');
    });

    it('should share via SMS successfully', async () => {
      const result = await ShareService.shareToSocialPlatform(
        mockProperty,
        SocialPlatform.SMS
      );

      expect(result.success).toBe(true);
      expect(result.platform).toBe('sms');
    });

    it('should copy to clipboard successfully', async () => {
      const result = await ShareService.shareToSocialPlatform(
        mockProperty,
        SocialPlatform.COPY_LINK,
        { url: 'https://example.com' }
      );

      expect(result.success).toBe(true);
      expect(result.platform).toBe('clipboard');
    });

    it('should handle unsupported platform', async () => {
      const result = await ShareService.shareToSocialPlatform(
        mockProperty,
        'unsupported' as SocialPlatform
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Error al compartir en');
    });
  });

  describe('getAvailablePlatforms', () => {
    it('should return all available platforms', () => {
      const platforms = ShareService.getAvailablePlatforms();

      expect(platforms).toContain(SocialPlatform.WHATSAPP);
      expect(platforms).toContain(SocialPlatform.FACEBOOK);
      expect(platforms).toContain(SocialPlatform.INSTAGRAM);
      expect(platforms).toContain(SocialPlatform.TWITTER);
      expect(platforms).toContain(SocialPlatform.EMAIL);
      expect(platforms).toContain(SocialPlatform.SMS);
      expect(platforms).toContain(SocialPlatform.COPY_LINK);
    });
  });

  describe('getPlatformDisplayName', () => {
    it('should return correct display names for platforms', () => {
      expect(ShareService.getPlatformDisplayName(SocialPlatform.WHATSAPP)).toBe('WhatsApp');
      expect(ShareService.getPlatformDisplayName(SocialPlatform.FACEBOOK)).toBe('Facebook');
      expect(ShareService.getPlatformDisplayName(SocialPlatform.INSTAGRAM)).toBe('Instagram');
      expect(ShareService.getPlatformDisplayName(SocialPlatform.TWITTER)).toBe('Twitter');
      expect(ShareService.getPlatformDisplayName(SocialPlatform.EMAIL)).toBe('Email');
      expect(ShareService.getPlatformDisplayName(SocialPlatform.SMS)).toBe('SMS');
      expect(ShareService.getPlatformDisplayName(SocialPlatform.COPY_LINK)).toBe('Copiar enlace');
    });
  });

  describe('getPlatformIcon', () => {
    it('should return correct icons for platforms', () => {
      expect(ShareService.getPlatformIcon(SocialPlatform.WHATSAPP)).toBe('💬');
      expect(ShareService.getPlatformIcon(SocialPlatform.FACEBOOK)).toBe('📘');
      expect(ShareService.getPlatformIcon(SocialPlatform.INSTAGRAM)).toBe('📷');
      expect(ShareService.getPlatformIcon(SocialPlatform.TWITTER)).toBe('🐦');
      expect(ShareService.getPlatformIcon(SocialPlatform.EMAIL)).toBe('✉️');
      expect(ShareService.getPlatformIcon(SocialPlatform.SMS)).toBe('💬');
      expect(ShareService.getPlatformIcon(SocialPlatform.COPY_LINK)).toBe('🔗');
    });
  });

  describe('Property formatting', () => {
    it('should format sale property correctly', async () => {
      const saleProperty = generateProperty({
        type: PropertyType.APARTMENT,
        operation: PropertyOperation.SALE,
      });

      const consoleSpy = jest.spyOn(console, 'log');
      await ShareService.shareProperty(saleProperty);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Sharing property:',
        expect.objectContaining({
          message: expect.stringContaining('Venta'),
        })
      );
    });

    it('should format rent property correctly', async () => {
      const rentProperty = generateProperty({
        type: PropertyType.APARTMENT,
        operation: PropertyOperation.RENT,
      });

      const consoleSpy = jest.spyOn(console, 'log');
      await ShareService.shareProperty(rentProperty);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Sharing property:',
        expect.objectContaining({
          message: expect.stringContaining('Arriendo'),
        })
      );
    });

    it('should include property features in share text', async () => {
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
      await ShareService.shareProperty(propertyWithFeatures);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Sharing property:',
        expect.objectContaining({
          message: expect.stringMatching(/3 dorm.*2 baños.*120m²/),
        })
      );
    });

    it('should include custom message when provided', async () => {
      const customMessage = 'This is a custom message';
      
      const consoleSpy = jest.spyOn(console, 'log');
      await ShareService.shareProperty(mockProperty, { message: customMessage });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Sharing property:',
        expect.objectContaining({
          message: expect.stringContaining(customMessage),
        })
      );
    });
  });
});