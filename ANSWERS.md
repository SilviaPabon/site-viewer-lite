1. Un cliente reporta que en su iPad la pestaña se recarga sola mientras abre un escaneo de 300 MB; en el computador funciona. ¿Cómo lo diagnosticas y qué cambiarías?

> La pestaña se recarga porque el navegador llegó a su limite de memoria intentando abrir esos 300MB, esto se puede diagnosticar con herramientas del navegador, utilizando un archivo de menor tamaño, para ver si la sobrecarga sigue. Puede que cambie pasar los colores estén en uint normalizados, en entero, no decimal que pesa más, evitar copias del archivo o hacer decimación para cargar menos puntos. 

2. Después de publicar una versión nueva, algunos usuarios siguen viendo la anterior durante días aunque el servidor ya tiene el código nuevo. Los archivos se sirven con caché larga. ¿Qué pasa y cómo lo evitas de forma definitiva?

> 

3. Agregamos un asistente con un modelo de lenguaje que opera la interfaz por medio de herramientas ("abre el inspector", "aísla el nivel 2"). A veces responde "listo, lo abrí" y no pasó nada. ¿Cómo diseñas las herramientas para que eso no pueda pasar?

> Cada herramienta debe comprobar el estado real de la interfaz después de actuar y devolver ese resultado, de este modo el asistente solo informa lo que la herramienta le devolvió.

4. Un cliente ve en la pestaña de red del navegador el nombre de un proyecto de otro cliente. ¿Dónde buscas la causa y qué regla de diseño lo evita?

> La busco en el servidor, en la respuesta de la API, en ningún momento debe estar seleccionándose esa propiedad. El endpoint no está filtrando por cliente. Se puede construir un tipo, y en el momento de construirse solo se realiza con los campos estrictamente requeridos. Si nos traemos todo el JSON y confiamos en el tipado, en compilación puede que no esté pero en ejecución se puede seguir obteniendo. 

5. Con 2 millones de puntos el visor baja a 15 cuadros por segundo al orbitar. Nombra tres técnicas en orden de lo que probarías primero, y por qué.

> 
