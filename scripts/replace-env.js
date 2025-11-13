// Script para reemplazar variables de entorno en los archivos de environment
// Se ejecuta antes del build de Angular

const fs = require('fs');
const path = require('path');

const envProdPath = path.join(__dirname, '../src/environments/environment.prod.ts');

// Leer la variable de entorno (Vercel inyecta las variables durante el build)
const googleMapsApiKey = process.env.NG_APP_GOOGLE_MAPS_API_KEY || '';

// Leer el archivo
let content = fs.readFileSync(envProdPath, 'utf8');

// Reemplazar el placeholder con la variable de entorno real
content = content.replace(
  /googleMapsApiKey:\s*'GOOGLE_MAPS_API_KEY_PLACEHOLDER'/,
  `googleMapsApiKey: '${googleMapsApiKey}'`
);

// Escribir el archivo actualizado
fs.writeFileSync(envProdPath, content, 'utf8');

console.log('✅ Variables de entorno reemplazadas en environment.prod.ts');
if (googleMapsApiKey) {
  console.log('✅ Google Maps API Key configurada');
} else {
  console.warn('⚠️  Google Maps API Key no encontrada. Usa la variable NG_APP_GOOGLE_MAPS_API_KEY');
}

