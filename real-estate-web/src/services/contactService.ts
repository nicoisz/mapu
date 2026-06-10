import { Property } from '@/types/property'
import { ContactInfo } from '@/types/property'
import { ContactMethod } from '@/types/enums'
import { ContactResult } from '@/types/results'
import { buildWhatsAppUrl, buildShareText } from '@/lib/utils'

export const contactService = {
  getAvailableContactMethods(contact: ContactInfo): ContactMethod[] {
    const methods: ContactMethod[] = []
    if (contact.whatsapp) methods.push(ContactMethod.WHATSAPP)
    if (contact.phone) methods.push(ContactMethod.PHONE)
    if (contact.email) methods.push(ContactMethod.EMAIL)
    return methods
  },

  contactViaWhatsApp(contact: ContactInfo, message?: string): ContactResult {
    if (!contact.whatsapp) return { success: false, method: ContactMethod.WHATSAPP, error: 'WhatsApp no disponible' }
    const msg = message ?? 'Hola, me interesa la propiedad que publicaste.'
    const url = buildWhatsAppUrl(contact.whatsapp, msg)
    if (typeof window !== 'undefined') window.open(url, '_blank')
    return { success: true, method: ContactMethod.WHATSAPP, message: 'Abriendo WhatsApp...' }
  },

  contactViaPhone(contact: ContactInfo): ContactResult {
    if (!contact.phone) return { success: false, method: ContactMethod.PHONE, error: 'Teléfono no disponible' }
    if (typeof window !== 'undefined') window.location.href = `tel:${contact.phone}`
    return { success: true, method: ContactMethod.PHONE, message: contact.phone }
  },

  contactViaEmail(contact: ContactInfo, subject?: string, body?: string): ContactResult {
    if (!contact.email) return { success: false, method: ContactMethod.EMAIL, error: 'Email no disponible' }
    const s = encodeURIComponent(subject ?? 'Consulta sobre propiedad')
    const b = encodeURIComponent(body ?? 'Hola, me interesa conocer más sobre esta propiedad.')
    if (typeof window !== 'undefined') window.location.href = `mailto:${contact.email}?subject=${s}&body=${b}`
    return { success: true, method: ContactMethod.EMAIL, message: contact.email }
  },

  contactProperty(property: Property, options?: { message?: string; preferredMethod?: ContactMethod }): ContactResult {
    const { contact } = property
    const method = options?.preferredMethod ?? contact.preferredMethod
    const shareText = buildShareText(property)
    const defaultMsg = `Hola, estoy interesado/a en la propiedad:\n${shareText}\n¿Podría darme más información?`

    switch (method) {
      case ContactMethod.WHATSAPP:
        if (contact.whatsapp) return contactService.contactViaWhatsApp(contact, options?.message ?? defaultMsg)
        if (contact.phone) return contactService.contactViaPhone(contact)
        if (contact.email) return contactService.contactViaEmail(contact)
        break
      case ContactMethod.PHONE:
        if (contact.phone) return contactService.contactViaPhone(contact)
        if (contact.whatsapp) return contactService.contactViaWhatsApp(contact, options?.message ?? defaultMsg)
        if (contact.email) return contactService.contactViaEmail(contact)
        break
      case ContactMethod.EMAIL:
        if (contact.email) return contactService.contactViaEmail(contact, 'Consulta sobre propiedad', options?.message ?? defaultMsg)
        if (contact.whatsapp) return contactService.contactViaWhatsApp(contact, options?.message ?? defaultMsg)
        break
    }
    return { success: false, method: ContactMethod.PHONE, error: 'No hay métodos de contacto disponibles' }
  },
}
