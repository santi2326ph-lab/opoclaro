# OpoClaro

Web estática gratuita de herramientas y guías originales para opositores. Solo requiere HTML, CSS y JavaScript del navegador; no usa API, backend, base de datos, compilación ni servicios de pago. No utiliza framework ni router: cada página es un archivo HTML.

## Abrir y desarrollar en local

- Para revisar rápidamente el diseño y la navegación, abre `index.html` en el navegador. Los enlaces y recursos internos usan rutas relativas para que también funcionen en modo `file://`. Para probar el guardado del planificador con el mismo origen que producción, usa el servidor local.
- Para desarrollar con URLs HTTP como en producción, abre PowerShell en esta carpeta y ejecuta `./start-local.ps1`. Requiere Python 3 y sirve el sitio en `http://localhost:8000/`; usa `Ctrl+C` para detenerlo. Si Windows bloquea scripts locales, ejecuta `powershell -ExecutionPolicy Bypass -File .\start-local.ps1` en esa sesión.
- Si ya tienes Python instalado, también puedes ejecutar `python -m http.server 8000 --bind 127.0.0.1` desde esta carpeta.

La web estática no tiene compilación ni suite de pruebas configurada.

## Publicación rápida

En Cloudflare Pages, crea un proyecto mediante carga directa y sube el contenido de esta carpeta. Puedes usar el subdominio `*.pages.dev` que se asigna al proyecto; un dominio personalizado es opcional y puede tener coste de compra. Cloudflare no permite convertir después un proyecto de carga directa a integración Git, así que elige Git desde el inicio si quieres despliegues automáticos. No configures un proceso de compilación ni `dist`: el directorio raíz contiene `index.html` y está listo para publicar.

Antes de publicar, sustituye todas las apariciones de `TU-DOMINIO.pages.dev` por el hostname Pages asignado o tu dominio personalizado. Reemplaza también `REEMPLAZAR_CON_EL_CODIGO_DE_SEARCH_CONSOLE` en `index.html` con la etiqueta de verificación HTML de Search Console, si vas a verificar la propiedad por ese método.

Comprueba `https://tu-dominio/sitemap.xml` y `https://tu-dominio/robots.txt` después del despliegue. Añade `https://tu-dominio/sitemap.xml` en Search Console. Las rutas internas enlazan a los archivos HTML directamente y funcionan sin reglas de reescritura.

## Contenido

- Portada: resumen de herramientas y navegación a las guías.
- Calculadora de notas: calcula la puntuación estimada en el navegador; penalización, escala y corte configurables.
- Planificador semanal: las sesiones quedan guardadas en localStorage del navegador actual.
- Cuatro guías originales para estudiar, repasar, distribuir el temario e interpretar una nota tipo test.
- Metadatos y URL canónica individuales, datos Open Graph, HTML semántico, diseño móvil, sitemap, robots y página 404.

La canonical y las URL del sitemap empiezan con un dominio de ejemplo. Reemplázalo antes de publicar. El indicador de verificación de Search Console es solo un marcador hasta añadir el valor que Google proporcione. No se carga analítica ni publicidad; cualquier integración futura requiere incorporar sus códigos y revisar sus políticas vigentes.

## Referencias oficiales

- [Inicio de Cloudflare Pages](https://developers.cloudflare.com/pages/get-started/), [carga directa](https://developers.cloudflare.com/pages/get-started/direct-upload/) y [límites del plan gratuito](https://developers.cloudflare.com/pages/platform/limits/).
- [Documentación de Google Search Console](https://developers.google.com/search/docs/monitor-debug/search-console-start) y [cómo crear y enviar un sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
