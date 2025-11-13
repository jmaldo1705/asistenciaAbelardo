// En producción, la API key se inyecta desde las variables de entorno de Vercel
// Variable de entorno en Vercel: NG_APP_GOOGLE_MAPS_API_KEY
// El script build:env:prod reemplazará esta variable durante el build
export const environment = {
  production: true,
  apiUrl: 'https://asistenciaabelardoback-production.up.railway.app/api',
  // Esta variable será reemplazada por el script build:env:prod
  // Si no está configurada, quedará como string vacío
  googleMapsApiKey: 'GOOGLE_MAPS_API_KEY_PLACEHOLDER'
};
