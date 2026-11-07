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

En construcción.

## Pendiente / con un día más

- Los reportes de problemas se guardan en memoria y se pierden al reiniciar. Habría que persistirlos en un archivo o una base de datos.
- Comparación de tokens en tiempo constante, o tokens hasheados.

## Uso de IA

Claude Code (Anthropic) para planear, escribir código y pruebas, y redactar ADR. Cada decisión se revisó y discutió antes de aceptarla. Los commits realizados por @SilviaPabon.
