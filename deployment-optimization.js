// Configuración de despliegue optimizada para producción

// 1. Habilitar compresión GZIP/Brotli en el servidor
// Para Nginx, agregar en nginx.conf:
/*
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;
gzip_comp_level 6;
*/

// 2. Agregar headers de cache para recursos estáticos
// En nginx.conf:
/*
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
  expires 7d;
  add_header Cache-Control "public, immutable";
}
*/

// 3. Habilitar HTTP/2 si está disponible
// En nginx.conf:
/*
listen 443 ssl http2;
*/

// 4. Para Apache (.htaccess):
/*
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
*/

module.exports = {
  // Esta es solo una guía de referencia
  // La configuración real depende del servidor web usado
};
