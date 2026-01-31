# 🗺️ Configuración de Google Maps

## Estado Actual
✅ **Mapa Básico Funcionando**: El mapa ya funciona con el proveedor por defecto de React Native Maps
✅ **Navegación Mundial**: Puedes navegar por todo el mundo
✅ **Controles**: Zoom, pan, rotación funcionan correctamente

## Para Funcionalidad Completa (Opcional)

### 1. Obtener Google Maps API Key

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita las siguientes APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Places API (para búsquedas)
   - Geocoding API (para direcciones)

4. Ve a "Credentials" y crea una API Key
5. Configura restricciones (recomendado):
   - Para Android: agrega el package name de tu app
   - Para iOS: agrega el bundle identifier

### 2. Configurar la API Key

Reemplaza `YOUR_GOOGLE_MAPS_API_KEY` en `app.json`:

```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "TU_API_KEY_AQUI"
      }
    },
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "TU_API_KEY_AQUI"
        }
      }
    }
  }
}
```

### 3. Cambiar a Google Provider (Opcional)

En `RealMapView.tsx`, cambia:
```typescript
provider={PROVIDER_DEFAULT} // Actual
```
por:
```typescript
provider={PROVIDER_GOOGLE} // Con API Key
```

## Funcionalidades Disponibles

### Sin API Key (Estado Actual)
- ✅ Navegación mundial completa
- ✅ Zoom y pan
- ✅ Ubicación del usuario
- ✅ Controles básicos
- ✅ Mapas básicos de OpenStreetMap

### Con API Key de Google
- ✅ Todo lo anterior +
- ✅ Mapas de Google con mejor calidad
- ✅ Imágenes satelitales
- ✅ Información de tráfico
- ✅ Lugares de interés
- ✅ Búsqueda de direcciones
- ✅ Autocompletado de lugares

## Testing

El mapa actual funciona perfectamente para desarrollo y testing sin necesidad de API key.

## Comandos para Probar

```bash
# Ejecutar en iOS
npm run ios

# Ejecutar en Android  
npm run android

# Ejecutar en web (limitado)
npm run web
```

## Troubleshooting

### Si el mapa no se muestra:
1. Verifica que `react-native-maps` esté instalado
2. En iOS: asegúrate de que los permisos de ubicación estén configurados
3. En Android: verifica que Google Play Services esté disponible

### Si necesitas funcionalidad específica de Google:
1. Configura la API key como se describe arriba
2. Cambia el provider a `PROVIDER_GOOGLE`
3. Reinicia la app completamente

## Costos

- **Desarrollo/Testing**: Gratis con el proveedor por defecto
- **Google Maps**: Gratis hasta cierto límite de uso, luego se cobra por uso