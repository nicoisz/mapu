# Fotos de propiedades en R2

Las nuevas fotos se comprimen en el navegador y se guardan en R2 mediante el binding `PROPERTY_IMAGES`. Supabase continúa proporcionando autenticación y datos de propiedades.

## Activación en Cloudflare

1. Crear el bucket privado `mapu-property-images` en la cuenta que aloja el Worker. El nombre y binding están en `wrangler.jsonc`; cambiar el nombre si la cuenta utiliza otro.
2. Desplegar el PR después del PR de compresión y descripción manual (#94).
3. Conservar las variables de autenticación Supabase ya existentes. No hacen falta claves S3 ni secretos R2: el Worker accede mediante el binding.
4. Comprobar publicación, visualización y borrado con una cuenta de prueba en el despliegue.

No se creó ni modificó un bucket remoto desde este PR. Antes de desplegar hay que crearlo; sin binding operativo las subidas devuelven un error y conservan el borrador del formulario.

## Desarrollo local

`next dev` inicializa el emulador de Cloudflare con `initOpenNextCloudflareForDev`. El bucket local persiste en `.wrangler/state`; no usa almacenamiento de producción. `pnpm cf:types` regenera `worker-configuration.d.ts` al cambiar los bindings.

## Permisos y archivos

- POST `/api/property-images` exige sesión válida. El servidor genera la ruta `{usuario}/{uuid}.webp` o `.jpg` y valida tamaño, tipo y firma del archivo ya optimizado.
- GET `/api/property-images/{usuario}/{uuid}.{ext}` sirve las imágenes públicamente mediante streaming, con ETag y caché de un año. El bucket permanece privado y no se habilita listado público. Los nombres son únicos y no se sobrescriben.
- DELETE `/api/property-images` permite borrar únicamente rutas del usuario autenticado. Las subidas parciales se retiran si falla una foto del lote.
- Los identificadores nuevos comienzan con `r2:`. Las fotos anteriores conservan sus URLs y siguen leyéndose/borrándose en Supabase. Este PR cambia el destino de nuevas subidas; no copia ni elimina archivos existentes de producción.

El límite interno corresponde al archivo optimizado, no al original que selecciona el usuario. No se añade un límite de peso en el formulario. La integración con Gemini se revisa por separado en #95.
