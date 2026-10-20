# Flujo local para ampliar el banco de preguntas

## Privacidad de los apuntes

Los apuntes de terceros se guardan solo en la carpeta raíz materia-privado/ o material-privado/. Ambas quedan excluidas por .gitignore. El compilador publica únicamente la lista explícita de scripts/site-files.mjs y falla si se intenta incluir una de esas carpetas o un PDF. No cambies esa protección para compilar.

## Auditar nuevos PDFs

Con Python 3.10 o posterior y pypdf disponibles, desde la raíz del proyecto ejecuta:

    python scripts/audit-private-pdfs.py --source .\materia-privado

Si usas otra carpeta privada:

    python scripts/audit-private-pdfs.py --source .\materia-privado --source .\material-privado

El informe queda bajo .opoclaro-work/pdf-audit.json dentro de la carpeta privada. Incluye clasificación por número de tema, páginas, huella SHA-256 y encabezados breves de las primeras páginas para reconocer apartados. No extrae el cuerpo completo ni crea preguntas desde los apuntes. Resuelve manualmente temas faltantes, duplicados o ilegibles antes de continuar. Contrasta el número y título con el Anexo I vigente: https://www.boe.es/buscar/doc.php?id=BOE-A-2026-15055

## Generar y revisar candidatos

1. Usa los PDFs solo para reconocer conceptos y apartados. No reutilices su redacción, ejemplos, esquemas ni explicaciones.
2. Para cada afirmación comprobable, identifica primero la fuente pública primaria vigente (BOE, organismo oficial, estándar original o referencia oficial del idioma). Registra artículo o sección y URL directa.
3. Ollama local está disponible en este equipo con qwen3:4b y qwen3:8b. Puede ayudar a proponer borradores usando exclusivamente el temario oficial y fragmentos estrictamente necesarios de fuentes oficiales; no envíes PDFs al modelo ni uses su salida como verificación. No requiere API de pago. Los candidatos deben quedar en .opoclaro-work/candidates/ dentro de la carpeta privada, nunca en data/tests/. Si Ollama no está activo, prepara candidatos manualmente; no descargues otro modelo ni instales dependencias.
4. Revisa cada candidato contra su fuente: una sola respuesta correcta, tres distractores claramente incorrectos, explicación propia, nivel, tema, fecha y referencia. Descarta o deja en revisión cualquier punto dudoso, desactualizado, parecido a otro o sin fuente. Las pruebas automáticas validan forma y coherencia, no certifican exactitud jurídica.
5. Conserva aceptadas y pendientes por lote hasta terminar la revisión. Solo mueve las aceptadas al JSON público; usa IDs únicos y formato existente. Cada lote debe indicar tema y fuentes consultadas.
6. Añade el banco a data/tests/catalog.json y a la lista permitida de scripts/site-files.mjs. Actualiza pruebas automáticas para validar total, tema, dificultad, duplicados y selección/corrección.
7. Ejecuta npm run build y npm test. Comprueba que dist solo contiene los archivos permitidos y ningún PDF, apunte o informe privado.

## Evaluación de tamaño y rendimiento

El motor conserva el catálogo y carga solo los bancos referenciados por la oposición seleccionada. Antes de iniciar un test, comprueba el número compatible con el tema, dificultad y cantidad. Tras cada lote, mide el tiempo de carga y selección en una compilación representativa y confirma que 10, 20, 50 y 100 preguntas solo estén disponibles cuando haya suficiente banco.
