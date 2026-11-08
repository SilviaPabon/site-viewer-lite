## ANSWERS

1. Un cliente reporta que en su iPad la pestaña se recarga sola mientras abre un escaneo de 300 MB; en el computador funciona. ¿Cómo lo diagnosticas y qué cambiarías?

> La pestaña se recarga porque el navegador llegó a su límite de memoria intentando abrir esos 300MB, esto se puede diagnosticar con herramientas del navegador, utilizando un archivo de menor tamaño, para ver si la sobrecarga sigue. Cambiaría los colores a Uint8 normalizado (1 byte en vez de 4), evitaría copiar el archivo en memoria, lo descargaría por partes en un worker y decimaría para cargar menos puntos. 

2. Después de publicar una versión nueva, algunos usuarios siguen viendo la anterior durante días aunque el servidor ya tiene el código nuevo. Los archivos se sirven con caché larga. ¿Qué pasa y cómo lo evitas de forma definitiva?

> Con caché larga el navegador no pregunta al servidor, y permanece usando la versión antigua de index.html y los archivos antiguos también en su interior. Podría funcionar la estrategia de hashes en los nombres de archivos haciendo que si el código cambia, el hash cambia (por ejemplo, de app.3f2a.js a app.9b8c.js). El navegador se ve obligado a descargar el nuevo archivo porque tiene un nombre diferente. Entonces se buscaría evitar guardar index.html en el caché, o sea no-cache y el uso de ETag que revalida y responde 304 como lo tenemos estipulado para este ejercicio.

3. Agregamos un asistente con un modelo de lenguaje que opera la interfaz por medio de herramientas ("abre el inspector", "aísla el nivel 2"). A veces responde "listo, lo abrí" y no pasó nada. ¿Cómo diseñas las herramientas para que eso no pueda pasar?

> La tarea del asistente solo es informar lo que la herramienta le devolvió, no actuar por su cuenta. Cada herramienta ejecuta la acción, luego lee el estado real de la interfaz y devuelve éxito o error con ese estado. El asistente solo informa lo que la herramienta devolvió y no puede decir 'listo' por su cuenta.

4. Un cliente ve en la pestaña de red del navegador el nombre de un proyecto de otro cliente. ¿Dónde buscas la causa y qué regla de diseño lo evita?

> La busco en el servidor, en la respuesta de la API, en ningún momento debe estar seleccionándose esa propiedad. El endpoint no está filtrando por cliente. Se puede construir un tipo, y en el momento de construirse solo se realiza con los campos estrictamente requeridos. Los tipos de TypeScript desaparecen al ejecutar, así que no filtran datos, hay que construir la respuesta con los campos permitidos. 

5. Con 2 millones de puntos el visor baja a 15 cuadros por segundo al orbitar. Nombra tres técnicas en orden de lo que probarías primero, y por qué.

> Podría utilizarse bajar el pixel ratio, ya que permitiría dibujar menos para que se vea, es un ajuste pequeño. También luego probaría decimar, que se requiera dibujar menos puntos, a costa del detalle y su calidad. Y también revisando niveles de detalle al mover la cámara, al orbitar podría mostrar pocos puntos y ya cuando este donde quiero los muestro todos, este para programarlo tiene más complejidad, habría que ver cuando empieza y termina el movimiento, luego configurar que solo dibuje pocos puntos, aleatoriamente pero de manera representativa.
