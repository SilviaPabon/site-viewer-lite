# Site Viewer Lite

API (Node + Fastify) y visor web (Vue + three.js) para ver edificios escaneados en 3D con datos seguros por cliente.

## Arrancar

Requiere Node 18 o superior.

```
npm install
npm run dev
```

`npm run dev` genera las nubes de puntos si faltan (`site-viewer-lite-starter/data/clouds/`), arranca la API en `:3000` y el visor en `http://localhost:5173`. Para abrirlo desde un iPad en la misma red: `http://<ip-del-computador>:5173`.

| Comando                | Qué hace                                                                  |
| ---------------------- | ------------------------------------------------------------------------- |
| `npm test`             | Pruebas automáticas de la API                                             |
| `npm run typecheck`    | Revisa los tipos de la API y del visor                                    |
| `npm run setup`        | Solo genera las nubes que falten (incluida la versión cortada `--truncate`) |
| `npm run format`       | Prettier sobre todo el repo                                               |

Para usar otro kit: `DATA_DIR=/ruta/al/kit/data npm run dev`.

## Parte A: API

Todas las rutas exigen `Authorization: Bearer <token>`. Los errores siempre llegan como `{ "error", "message" }`.

| Ruta                             | Respuesta                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| `GET /api/projects`              | Proyectos visibles: id, nombre, dirección, estado y cliente                                |
| `GET /api/projects/:id`          | Lo anterior más fechas, niveles y contactos. Lleva `ETag`, responde `304` y usa `Cache-Control: private` |
| `GET /api/projects/:id/spaces`   | Cuartos como cajas                                                                         |
| `GET /api/projects/:id/cloud`    | Binario PTS1 con soporte de `Range` (`206` / `416`) y `404` si el proyecto no tiene nube   |
| `POST /api/projects/:id/issues`  | `{ title, level, spaceId? }` → `201 { id }`                                                |

Cómo se cumplen las reglas del enunciado (cada una tiene pruebas en `api/src/modules/**/*.test.ts`):

1. **401**: un hook valida la sintaxis Bearer de RFC 6750 antes de cualquier ruta, incluidas las inexistentes.
2. **`internal` nunca sale**, gracias a tres capas independientes: el repositorio no lo carga, los DTO se arman por allowlist y el response schema descarta los campos no declarados (ADR-005).
3. **Contactos**: email y teléfono solo para el staff.
4. **Un proyecto ajeno es igual a uno inexistente**: mismo status, mismo cuerpo y mismos headers en el detalle, los espacios, la nube y los reportes.
5. **Nunca 500 por la entrada**: los params, el body y el content-type se validan con schema, sin conversión de tipos, y el JSON roto responde 400. Un error inesperado responde un 500 genérico sin detalles.
6. **ETag** calculado sobre la respuesta ya filtrada de cada usuario, con `304`, `private, no-cache` y `Vary: Authorization`.
7. **Range** servido con `@fastify/send`. Un proyecto sin nube responde 404.

Arquitectura: Screaming (un módulo por feature) con Clean ligera dentro de cada módulo. Las decisiones están en [`docs/adr.md`](docs/adr.md).

## Parte B: visor

- **Usuario → lista → ficha:** botones Staff / Acme / Brick. Las fechas vacías muestran "Not recorded"; email y teléfono aparecen solo si la API los envía (staff).
- **Escena 3D:** cuartos como cajas con eje Z hacia arriba, un color por nivel, OrbitControls (mouse y touch), tocar un cuarto abre su panel (área en m²/ft²) y filtro por nivel.
- **Nube de puntos:** se descarga y se parsea en un Web Worker con progreso real (bytes leídos / `Content-Length`). Las posiciones y los colores pasan al hilo principal como transferables, sin copiarse. Un archivo truncado se detecta comparando su tamaño con el N de la cabecera.
- **Cancelación:** botón Cancel; cambiar de proyecto o de usuario también cancela. Cada carga usa su propio worker y `terminate()` corta la descarga y el parseo. Un id de carga descarta cualquier mensaje viejo que ya estuviera en cola.
- **Errores:** todos se muestran con un mensaje y "Try again", nunca con `alert()`.
- **Rendimiento (iPad):**
  - **Un solo `THREE.Points`** con `BufferGeometry` para los 2 M de puntos: una sola llamada de dibujo.
  - **Colores en `Uint8` normalizados:** 6 MB en vez de 24 MB en float.
  - **Se dibuja solo cuando algo cambia** (cámara o datos), no 60 veces por segundo, y el pixel ratio se limita a 2.
  - **La descarga se escribe en un único buffer** reservado según `Content-Length`, sin juntar trozos en una copia aparte, y el progreso se envía como máximo unas 100 veces.
  - **Sin decimación:** con 2 M de puntos no se ve necesaria. Si en un iPad real va lento, el siguiente paso sería cargar un punto de cada k en el worker. No se ha medido en un dispositivo real.

## Pendiente / con un día más

- Los reportes de problemas se guardan en memoria y se pierden al reiniciar. Habría que persistirlos en un archivo o una base de datos.
- Comparación de tokens en tiempo constante, o tokens hasheados.
- **Pruebas del visor:** el enunciado solo exige las de la API, así que el visor no tiene pruebas automáticas. Las primeras serían el parser PTS1 (truncado y marca inválida) y la carrera de `useApi`/`useCloud` al cambiar de proyecto.
- **Tipos compartidos API ↔ visor:** hoy el visor importa los tipos con `import type` desde la carpeta de la API (ADR-013), así que quedan acoplados a la estructura del monorepo. Si se separan los repositorios: generar `openapi.json` con `@fastify/swagger` (a partir de los mismos schemas TypeBox) y los tipos del visor con `openapi-typescript`.

## Uso de IA

Claude Code (Anthropic) para planear, escribir código y pruebas, y redactar ADR. Cada decisión se revisó y discutió antes de aceptarla. Los commits realizados por @SilviaPabon.
