import { ContactMethod } from './enums';

/**
 * Contact information for property owners or agents
 */
export interface ContactInfo {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  preferredMethod: ContactMethod;
  avatar?: string;
  isVerified: boolean;
  responseTime?: string; // e.g., "Usually responds within 1 hour"
  languages?: string[]; // e.g., ["Spanish", "English"]
}

/**
 * Contact availability schedule
 */
export interface ContactAvailability {
  contactId: string;
  timezone: string;
  schedule: {
    monday?: TimeSlot[];
    tuesday?: TimeSlot[];
    wednesday?: TimeSlot[];
    thursday?: TimeSlot[];
    friday?: TimeSlot[];
    saturday?: TimeSlot[];
    sunday?: TimeSlot[];
  };
}

/**
 * Time slot for availability
 */
export interface TimeSlot {
  start: string; // HH:MM format
  end: string;   // HH:MM format
}