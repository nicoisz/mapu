import { Property } from '@/types/property'
import { ShareResult } from '@/types/results'
import { buildShareText, buildWhatsAppUrl } from '@/lib/utils'

export type SharePlatform = 'whatsapp' | 'facebook' | 'twitter' | 'email' | 'clipboard'

export const shareService = {
  buildShareUrl(property: Property): string {
    if (typeof window !== 'undefined') return `${window.location.origin}/propiedad/${property.id}`
    return `/propiedad/${property.id}`
  },

  async shareToClipboard(property: Property): Promise<ShareResult> {
    const text = `${buildShareText(property)}\n${shareService.buildShareUrl(property)}`
    try {
      await navigator.clipboard.writeText(text)
      return { success: true, platform: 'clipboard' }
    } catch {
      return { success: false, platform: 'clipboard', error: 'No se pudo copiar' }
    }
  },

  shareToSocialPlatform(property: Property, platform: SharePlatform): ShareResult {
    const url = shareService.buildShareUrl(property)
    const text = buildShareText(property)

    let shareUrl = ''
    switch (platform) {
      case 'whatsapp': {
        const msg = `${text}\n${url}`
        shareUrl = buildWhatsAppUrl('', msg).replace('wa.me/?text=', 'wa.me/share?text=')
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`
        break
      }
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        break
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
        break
      case 'email': {
        const subject = encodeURIComponent(`Propiedad: ${property.title}`)
        const body = encodeURIComponent(`${text}\n\nVer más: ${url}`)
        if (typeof window !== 'undefined') window.location.href = `mailto:?subject=${subject}&body=${body}`
        return { success: true, platform: 'email' }
      }
    }

    if (shareUrl && typeof window !== 'undefined') {
      window.open(shareUrl, '_blank', 'width=600,height=400')
    }
    return { success: true, platform }
  },

  async shareProperty(property: Property, options?: { platform?: SharePlatform }): Promise<ShareResult> {
    if (options?.platform === 'clipboard') return shareService.shareToClipboard(property)
    if (options?.platform) return shareService.shareToSocialPlatform(property, options.platform)

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: buildShareText(property),
          url: shareService.buildShareUrl(property),
        })
        return { success: true }
      } catch {
        return shareService.shareToClipboard(property)
      }
    }
    return shareService.shareToClipboard(property)
  },
}
