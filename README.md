# OpoClaro

Web estática gratuita de herramientas y guías originales para opositores. Solo requiere HTML, CSS y JavaScript del navegador; no usa API, backend, base de datos, compilación ni servicios de pago. No utiliza framework ni router: cada página es un archivo HTML.

## Abrir y desarrollar en local

- Para revisar rápidamente el diseño y la navegación, abre `index.html` en el navegador. Los enlaces y recursos internos usan rutas relativas para que también funcionen en modo `file://`. Para probar el guardado del planificador con el mismo origen que producción, usa el servidor local.
- Para desarrollar con URLs HTTP como en producción, abre PowerShell en esta carpeta y ejecuta `./start-local.ps1`. Requiere Python 3 y sirve el sitio en `http://localhost:8000/`; usa `Ctrl+C` para detenerlo. Si Windows bloquea scripts locales, ejecuta `powershell -ExecutionPolicy Bypass -File .\start-local.ps1` en esa sesión.
- Si ya tienes Python instalado, también puedes ejecutar `python -m http.server 8000 --bind 127.0.0.1` desde esta carpeta.

La web fuente sigue siendo HTML, CSS y JavaScript sin framework. Para Workers se genera `dist` mediante un script de Node.js sin dependencias externas; solo incluye una lista explícita de archivos públicos.

## Publicación segura en Cloudflare Workers

Wrangler está configurado en `wrangler.jsonc` para servir únicamente `dist`. No ejecutes `npx wrangler deploy .` ni cambies el directorio de assets a `.`: eso puede incluir el repositorio Git y archivos locales.

1. Instala Node.js si aún no está instalado y abre una terminal en esta carpeta.
2. Ejecuta `npm run build`. El script elimina y vuelve a crear solo la salida generada `dist`, copiando los archivos públicos permitidos y `_headers` para conservar las cabeceras de seguridad de Workers.
3. Ejecuta `npm test` para comprobar enlaces, recursos, archivos publicados y sintaxis JavaScript.
4. Para despliegues automáticos desde GitHub, antes de subir cambios abre el Worker `opoclaro` en Cloudflare y ve a **Settings > Builds > Build configuration**. Deja el directorio raíz en `/`, configura **Build command** como `npm run build && npm test` y **Deploy command** como `npx wrangler deploy`; confirma que la rama de producción sea `main`. No dejes vacío el comando de compilación: Cloudflare ejecuta ese paso antes del despliegue. Como alternativa, configura el comando de despliegue como `npm run deploy`, que compila antes de llamar a Wrangler.
5. Para publicar manualmente desde una terminal local, ejecuta `npm run deploy`; reconstruye `dist` y después publica. `npx wrangler deploy` por sí solo usa el directorio configurado `./dist`, pero no ejecuta el script de `package.json`.

Workers Builds no aplica los comandos de Custom Builds declarados en `wrangler.jsonc`; por eso, para una integración Git, configura el Build command en el panel de Cloudflare o usa `npm run deploy` como Deploy command. No publiques el commit hasta confirmar esa configuración en el panel.

El sitio mantiene la URL de Workers `https://opoclaro.santi2326ph.workers.dev`. Para validar una publicación, comprueba la portada, las dos herramientas, las guías, `sitemap.xml`, `robots.txt` y que una ruta inexistente muestre la página 404. Los archivos fuente, `.git`, `.wrangler`, README, scripts locales y configuración de Wrangler quedan fuera de `dist`. Workers procesa `_headers` como reglas del despliegue; no lo sirve como archivo descargable.

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

- [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) y [configuración de Wrangler](https://developers.cloudflare.com/workers/wrangler/configuration/).
- [Documentación de Google Search Console](https://developers.google.com/search/docs/monitor-debug/search-console-start) y [cómo crear y enviar un sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
