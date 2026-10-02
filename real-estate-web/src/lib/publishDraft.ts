import { z } from 'zod'
import { PropertyOperation, PropertyType } from '@/types/enums'

const draftSchema = z.object({
  version: z.literal(1),
  savedAt: z.number(),
  clientRequestId: z.string().uuid(),
  operation: z.nativeEnum(PropertyOperation),
  type: z.nativeEnum(PropertyType),
  form: z.object({
    title: z.string(),
    description: z.string(),
    price: z.string(),
    street: z.string(),
    commune: z.string(),
    city: z.string(),
    region: z.string(),
    area: z.string(),
    bedrooms: z.string(),
    bathrooms: z.string(),
    parkingSpots: z.string(),
    negotiable: z.boolean(),
  }),
  coords: z.object({ lat: z.number(), lng: z.number() }).nullable(),
  files: z
    .array(z.custom<File>((value) => typeof File !== 'undefined' && value instanceof File))
    .max(10),
  resumeSubmit: z.boolean(),
})

export type PublishDraft = z.infer<typeof draftSchema>
const TTL = 7 * 24 * 60 * 60 * 1000
const DATABASE = 'mapu-publish-drafts'
const STORE = 'drafts'
const KEY = 'new-property'

export function validPublishDraft(value: unknown, now = Date.now()): PublishDraft | null {
  const parsed = draftSchema.safeParse(value)
  if (!parsed.success || now - parsed.data.savedAt > TTL || parsed.data.savedAt > now) return null
  return parsed.data
}

// IndexedDB stores actual photo files without localStorage's small string quota.
function transact<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DATABASE, 1)
    open.onupgradeneeded = () => open.result.createObjectStore(STORE)
    open.onerror = () => reject(open.error)
    open.onblocked = () =>
      reject(new Error('Cierra otras pestañas de publicación e inténtalo de nuevo.'))
    open.onsuccess = () => {
      const db = open.result
      try {
        const transaction = db.transaction(STORE, mode)
        const request = action(transaction.objectStore(STORE))
        transaction.oncomplete = () => {
          db.close()
          resolve(request.result)
        }
        transaction.onabort = () => {
          db.close()
          reject(transaction.error ?? request.error)
        }
        transaction.onerror = () => {
          db.close()
          reject(transaction.error ?? request.error)
        }
      } catch (error) {
        db.close()
        reject(error)
      }
    }
  })
}

export async function savePublishDraft(draft: PublishDraft): Promise<void> {
  await transact('readwrite', (store) => store.put(draft, KEY))
}

export async function clearPublishDraft(): Promise<void> {
  await transact('readwrite', (store) => store.delete(KEY))
}

export async function loadPublishDraft(): Promise<PublishDraft | null> {
  const value = await transact<unknown>('readonly', (store) => store.get(KEY))
  const draft = validPublishDraft(value)
  if (value && !draft) await clearPublishDraft()
  return draft
}
