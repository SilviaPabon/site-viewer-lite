# Site Viewer Lite — guía para Claude

Prueba técnica Full Stack 3D: una API Node y un visor web three.js para ver edificios escaneados en 3D.
Enunciado completo: `Prueba técnica Full Stack 3D (1).pdf` (no versionado). Decisiones: `docs/adr.md`.

## Prioridades (en este orden)
1. **Los datos de un cliente nunca llegan a otro.** `internal` nunca sale del servidor; un cliente no ve email/phone de contactos.
2. **Nada se rompe con entradas malas.** Un input inválido responde 4xx y nunca 500.
3. **La carga 3D se puede cancelar** y no cuelga la pestaña (Safari en iPad).
4. Acabado visual: viene después de lo anterior.

## Stack
TypeScript en todo · npm workspaces (`api/`, `visor-web/`) · Node 18+ · Fastify · Vitest · Vue 3 + Vite · three.js.
No hay base de datos: los datos viven en el kit `site-viewer-lite-starter/data/` (JSON), tal como lo entregaron. Las nubes `.pts` se generan con `site-viewer-lite-starter/tools/make-cloud.js` y no se versionan.

## Comandos
```
npm install
npm run setup     # genera site-viewer-lite-starter/data/clouds/*.pts (incluye la versión --truncate)
npm run dev       # API + visor
npm test          # pruebas (las de la API son obligatorias)
```
La API lee `DATA_DIR` (por defecto `./site-viewer-lite-starter/data`) para poder usar el kit de los evaluadores.

## Arquitectura: Screaming + Clean ligera
- **Screaming** (el qué): las carpetas tienen nombres de negocio. `src/modules/<feature>/` → `auth`, `projects`, `spaces`, `point-cloud`, `issues`; lo compartido va en `core`.
- **Clean ligera** (el cómo), dentro de cada módulo de la API: `domain/` (reglas puras, sin Fastify ni fs) → `application/` (casos de uso) → `infra/` (repositorio JSON, rutas, schemas).
- **Reglas de dependencia:** `domain` no importa nada de `infra`. Un módulo solo importa de `core` o del `index.ts` público de otro módulo.
- No usamos contenedor de inyección: `buildApp({ repos })` recibe sus dependencias a mano.
- En el visor, cada módulo tiene `components/`, `hooks/` (composables), `services/` y `lib/` según los necesite. Los objetos de three.js viven fuera de la reactividad de Vue (`markRaw`, sin `ref` profundo).
- Las pruebas van junto al módulo que prueban (`*.test.ts`).

## Reglas no negociables
- Los datos sensibles se protegen en tres capas (ADR-005): el repositorio entrega una proyección sin `internal`, el DTO se arma por **allowlist** según el rol y cada ruta declara un **response schema** que descarta en runtime cualquier campo no declarado. Nunca se usa `delete` ni spread (`...project`) para armar respuestas.
- Un proyecto ajeno responde **exactamente igual** que uno inexistente (404).
- Todo input (params, body, headers) se valida con schema. Un JSON roto responde 400.
- `GET /projects/:id` lleva ETag por usuario, `Cache-Control: private` y `Vary: Authorization`.
- En la UI no se usa `alert()`, `prompt()` ni `confirm()`. Los errores se muestran con un mensaje claro y "Try again".
- iPad: controles de al menos 44 px, inputs con font-size de al menos 16 px y nada de scroll horizontal.
- No se commitean secretos ni archivos `.pts`.

## Forma de trabajo
- **Claude nunca hace commits.** El usuario los redacta y los ejecuta. Al terminar cada paso pequeño, Claude se detiene, resume qué cambió y por qué, y espera.
- Hay que explicar el **por qué** de cada cambio: el usuario debe poder defender y modificar el código en vivo.
- Cada decisión de arquitectura nueva se agrega a `docs/adr.md` con el formato Contexto · Decisión · Alternativas descartadas · Consecuencias.
- Una regla del enunciado no está terminada hasta que tiene su prueba.
- Se prefiere la solución más simple que resuelva el problema completo: poco y sólido antes que mucho y frágil.

## OpenSpec
<!-- Lo pega el usuario -->

## Ponytail
<!-- Lo pega el usuario -->
