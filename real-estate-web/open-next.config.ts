import { defineCloudflareConfig } from '@opennextjs/cloudflare'

// ponytail: sin incremental cache (no hay revalidate en el proyecto).
// Añadir r2IncrementalCache cuando se use ISR.
export default defineCloudflareConfig()
