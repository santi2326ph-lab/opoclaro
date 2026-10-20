# Informe de ampliación del banco de Tests

Fecha: 20 de octubre de 2026. Rama: `feature/tests-policia-nacional`. Sin commit, push ni despliegue.

## Estado

Se conservan las 260 preguntas existentes al inicio de esta ampliación. El banco contiene **908 preguntas en 45 temas**. Cada una de las nuevas preguntas se ha redactado de forma original con cuatro opciones, una respuesta, explicación, dificultad y referencia primaria u oficial. No se ha copiado contenido de PDF privados ni se incluyen esos archivos en publicación.

## Recuento por tema

| Tema | Contenido | Preguntas | Test de 10 | Test de 20 |
|---:|---|---:|:---:|:---:|
| 1 | El Derecho y la persona | 20 | Sí | Sí |
| 2 | La Constitución Española (I) | 28 | Sí | Sí |
| 3 | La Constitución Española (II) | 20 | Sí | Sí |
| 4 | La Unión Europea y la cooperación policial | 20 | Sí | Sí |
| 5 | Administración General del Estado y Gobierno | 20 | Sí | Sí |
| 6 | Los funcionarios públicos | 20 | Sí | Sí |
| 7 | El Ministerio del Interior | 20 | Sí | Sí |
| 8 | La Dirección General de la Policía y la Policía Nacional | 20 | Sí | Sí |
| 9 | Fuerzas y Cuerpos de Seguridad | 20 | Sí | Sí |
| 10 | Extranjería: entrada, circulación y residencia | 20 | Sí | Sí |
| 11 | Infracciones y régimen sancionador de extranjería | 20 | Sí | Sí |
| 12 | Protección internacional | 20 | Sí | Sí |
| 13 | Seguridad privada | 20 | Sí | Sí |
| 14 | Protección de la seguridad ciudadana | 20 | Sí | Sí |
| 15 | Infraestructuras críticas y ciberseguridad | 20 | Sí | Sí |
| 16 | Derecho Penal: parte general | 20 | Sí | Sí |
| 17 | Derecho Penal: delitos contra las personas | 20 | Sí | Sí |
| 18 | Delitos contra el patrimonio | 20 | Sí | Sí |
| 19 | Delitos contra el orden público | 20 | Sí | Sí |
| 20 | Delitos informáticos | 20 | Sí | Sí |
| 21 | Derecho Procesal Penal y detención | 20 | Sí | Sí |
| 22 | Estatuto de la víctima del delito | 20 | Sí | Sí |
| 23 | Igualdad, violencia de género y no discriminación | 20 | Sí | Sí |
| 24 | Introducción a la prevención de riesgos laborales | 20 | Sí | Sí |
| 25 | Normativa de prevención de riesgos laborales | 20 | Sí | Sí |
| 26 | Protección de datos personales | 20 | Sí | Sí |
| 27 | Derechos Humanos | 20 | Sí | Sí |
| 28 | Globalización y antiglobalización | 20 | Sí | Sí |
| 29 | Actitudes y valores sociales | 20 | Sí | Sí |
| 30 | Principios éticos y valores de la sociedad | 20 | Sí | Sí |
| 31 | Inmigración e integración social | 20 | Sí | Sí |
| 32 | Geografía humana, población y medio ambiente | 20 | Sí | Sí |
| 33 | Seguridad y teorías de la delincuencia | 20 | Sí | Sí |
| 34 | Drogodependencias | 20 | Sí | Sí |
| 35 | Desarrollo sostenible | 20 | Sí | Sí |
| 36 | Gramática de la lengua española | 20 | Sí | Sí |
| 37 | Ortografía de la lengua española | 20 | Sí | Sí |
| 38 | Sistemas operativos | 20 | Sí | Sí |
| 39 | Redes informáticas | 20 | Sí | Sí |
| 40 | Inteligencia y fuentes abiertas | 20 | Sí | Sí |
| 41 | Ciberdelincuencia y amenazas | 20 | Sí | Sí |
| 42 | Armas de fuego y balística | 20 | Sí | Sí |
| 43 | Vehículos prioritarios | 20 | Sí | Sí |
| 44 | Seguridad en la conducción policial | 20 | Sí | Sí |
| 45 | Prevención de riesgos en seguridad vial | 20 | Sí | Sí |

Los 45 temas permiten iniciar test individuales de 10 y de 20 preguntas con dificultad «todas». La compatibilidad de dificultad, tema, modo mixto y cantidades se comprueba en las pruebas automatizadas; las opciones superiores (50/100) solo aparecen cuando la selección filtrada dispone de suficientes preguntas.

## Cobertura alcanzada

Se añadieron lotes de diez preguntas en los temas 29 y 32–45. Las fuentes empleadas incluyen: Declaración de Principios sobre la Tolerancia de UNESCO y Carta del Consejo de Europa; glosarios y metodología demográfica del INE; Directrices de prevención del delito de Naciones Unidas; clasificación CIE-11 y terminología de la OMS; Agenda 2030; gramática y ortografía RAE; documentación Microsoft Learn; RFC de IETF; Europol; Código Penal; guías de INCIBE; Reglamento de Armas; documentación forense del National Institute of Justice; Reglamento General de Circulación y materiales de seguridad vial de DGT.

La fuente forense del NIJ se usa como material técnico oficial primario para marcas de proyectiles y vainas. La lista de fuentes admitidas por el validador se amplió únicamente para permitir dominios oficiales que respaldan este lote (UNESCO y NIJ).

## Revisión editorial pendiente

Revisión editorial realizada el 20/10/2026: T29-CNP-002 y T29-CNP-004 repetían el artículo 10.1 de la Constitución. Se conservó T29-CNP-002 y se sustituyó T29-CNP-004 por una pregunta original sobre el apartado 1.3 de la Declaración de Principios sobre la Tolerancia de UNESCO. El tema mantiene 20 preguntas. Se comprobó la fuente primaria de UNESCO y la redacción es una paráfrasis, no una transcripción.

## Comprobaciones

- Compilación estática: **superada**, reconstruyó `dist` con la lista permitida de 66 archivos públicos.
- Enlaces, HTML, recursos locales y Wrangler: **superados**; 11 páginas HTML revisadas.
- Calculadora y planificador: **superados**.
- Filtros, selección aleatoria, modos, cantidades compatibles y bancos: **superados**; los 45 temas ofrecen 10 y 20 preguntas.
- Banco de preguntas: **superado**; 908 preguntas con IDs únicos, esquema correcto, cuatro opciones distintas, respuesta válida, explicación, dificultad, HTTPS en dominios institucionales/oficiales y sin duplicados exactos.
- Rendimiento: **superado**; selección de 100 preguntas entre 4.500 de muestra en 0,9 ms.
- Archivos de publicación: `dist` contiene solo los 66 archivos autorizados; no contiene PDF, README, configuración de Wrangler, scripts internos, metadatos Git ni datos privados. No se encontraron PDF dentro del proyecto fuente.
- Auditoría dedicada de PDF mediante el script Python: no ejecutada porque Python no está instalado en este entorno; el escaneo de archivos y la lista permitida de compilación no detectaron ni publicaron PDF.
- `git diff --check`: **superado**; Git solo advirtió sobre su conversión habitual de finales de línea CRLF.

## Publicación

No se creó commit, no se hizo push y no se desplegó. `dist` se genera al compilar y no debe incorporarse a Git.




## Revisión editorial y de fuentes · 20/10/2026

- Recuento comprobado directamente contra los bancos y el catálogo: **908 preguntas** en **45 temas**; Tema 2 tiene 28 y los demás, 20. Todos los temas permiten test individual de 10 y 20 preguntas con dificultad «todas».
- Redundancia detectada en T29-CNP-002/T29-CNP-004: ambas preguntaban el mismo contenido del artículo 10.1 CE. Se conservó T29-CNP-002 y se sustituyó solo T29-CNP-004 por una cuestión distinta sobre tolerancia y pluralismo, con el mismo número de preguntas en el banco.
- Muestra jurídica revisada frente a textos primarios: Constitución Española (art. 10.1, BOE-A-1978-31229); Ley 4/2015, del Estatuto de la víctima (art. 3, BOE-A-2015-4606); Ley Orgánica 2/1986 (principios de actuación policial, BOE-A-1986-6859); y Declaración de Principios sobre la Tolerancia de UNESCO (apartado 1.3). Las preguntas normativas siguen remitiendo a la convocatoria y a la versión consolidada de la norma.
- Las cifras históricas o estadísticas deben leerse con la fecha y el ámbito que indique cada fuente; no se actualizaron ni reinterpretaron cifras durante esta revisión.
- Esta revisión por muestra no equivale a una certificación jurídica de cada una de las 908 preguntas. El validador automatizado vuelve a comprobar estructura, fuentes HTTPS permitidas, IDs y duplicados textuales o por similitud.
- Se renovó la identidad visual compartida en portada, herramientas, planificador, tests, guías y páginas informativas: paleta azul noche/cobalto, nueva jerarquía tipográfica, superficies y profundidad, controles más legibles y ajustes móviles. No se modificaron los flujos ni la lógica de las herramientas.
