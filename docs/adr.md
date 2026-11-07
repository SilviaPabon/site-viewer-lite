# Architecture Decision Records

Cada entrada tiene cuatro partes: **Contexto · Decisión · Alternativas descartadas · Consecuencias**.
Estado: `Aceptada` salvo que se indique otra cosa.

---

## ADR-001 — Monorepo con npm workspaces
**Contexto:** hay que entregar una API y un visor en un solo repositorio, instalables y ejecutables con un solo comando.
**Decisión:** un `package.json` raíz con los workspaces `api/` y `visor-web/`. Los scripts `dev`, `test` y `setup` viven en la raíz.
**Alternativas descartadas:** dos repos separados (el enunciado pide uno); pnpm o turborepo (agregan herramientas que no hacen falta para dos paquetes).
**Consecuencias:** un solo `npm install`. Los tipos compartidos, si llegan a hacer falta, pueden ir en un tercer workspace.

## ADR-002 — TypeScript en servidor y cliente
**Contexto:** el código lo va a leer y modificar otra persona, en vivo.
**Decisión:** TypeScript en modo `strict` en ambos paquetes.
**Alternativas descartadas:** JavaScript con JSDoc (da menos garantías al refactorizar).
**Consecuencias:** hay un paso de build o ejecución con `tsx`, a cambio de errores detectados antes de correr el código.

## ADR-003 — Fastify como framework HTTP
**Contexto:** la regla 5 exige 4xx y nunca 500 ante ids mal formados, cuerpos inválidos o JSON roto. Además hay que probar la API de forma automática.
**Decisión:** Fastify, con JSON Schema en params y body, un error handler global y `app.inject()` en las pruebas.
**Alternativas descartadas:** Express (la validación, el parseo seguro del JSON y el manejo de errores se arman a mano) y `http` nativo (demasiado código repetitivo para 4 horas).
**Consecuencias:** hay que aprender su modelo de plugins y hooks. A cambio, la validación es declarativa y las pruebas no necesitan abrir puertos.

## ADR-004 — Screaming Architecture + Clean ligera con repositorio
**Contexto:** se pide código mantenible y explicable, pero el tiempo es corto y los datos vienen de JSON.
**Decisión:** las carpetas se organizan por feature (`modules/projects`, `modules/issues`, …). Dentro de cada una hay tres capas: `domain → application → infra`. El acceso a datos pasa por un repositorio delgado.
**Alternativas descartadas:** organizar por tipo técnico (`controllers/`, `services/`), porque esconde el negocio; Clean completa con puertos, mappers y contenedor de DI, porque es demasiada ceremonia; acceder directo al JSON desde las rutas, porque mezcla las reglas de seguridad con el transporte.
**Consecuencias:** las reglas de visibilidad se prueban sin servidor. Cambiar JSON por una base de datos solo toca `infra`. El costo es tener algunos archivos más.

## ADR-005 — Datos sensibles: proyección, allowlist y response schema
**Contexto:** `internal` (precio, factura, margen y notas) nunca debe salir. El email y el teléfono solo los ve el staff. **Los tipos de TypeScript desaparecen al compilar**, así que no protegen nada en runtime: si una respuesta se arma con `{ ...project }`, el campo sale aunque el tipo diga que no existe.
**Decisión:** hay tres capas independientes, y cualquiera de ellas basta para frenar una fuga:
1. **Proyección en el origen.** El repositorio devuelve a la capa de aplicación un `Project` que ya no trae `internal`; ese campo no pasa de `infra`. Es el equivalente a un `SELECT` de solo las columnas necesarias.
2. **DTO por allowlist.** `toPublicProject(project, user)` copia campo por campo lo permitido según el rol, incluidos los contactos sin email ni teléfono para un cliente.
3. **Response schema de Fastify.** Cada ruta declara qué campos responde. El serializador (`fast-json-stringify`) escribe solo las propiedades declaradas y descarta las demás en runtime, aunque el código anterior falle.

Una prueba recorre todas las respuestas, de cada usuario, buscando `internal|price|invoice|margin|notes`, y verifica que un cliente no reciba email ni teléfono.
**Alternativas descartadas:** `delete project.internal` (denylist: un campo sensible nuevo se filtra sin que nadie lo note) y confiar solo en los tipos (no existen en runtime).
**Consecuencias:** cada campo nuevo hay que exponerlo a propósito en dos sitios, el DTO y el schema. Ese costo es intencional.

## ADR-006 — Un proyecto ajeno responde igual que uno inexistente
**Contexto:** la regla 4 pide no revelar que existe un proyecto de otro cliente.
**Decisión:** el caso de uso devuelve "not found" tanto si el proyecto no existe como si no es visible, con el mismo status, el mismo cuerpo y los mismos headers.
**Alternativas descartadas:** responder 403 (confirma que el proyecto existe).
**Consecuencias:** el staff que depura no distingue los dos casos desde la API. Si hace falta, se distinguen en los logs del servidor.

## ADR-007 — ETag por usuario y caché privada
**Contexto:** el detalle se revalida con `If-None-Match`, pero su contenido depende de quién lo pide.
**Decisión:** el ETag se calcula como hash del cuerpo ya filtrado para ese usuario, con `Cache-Control: private, no-cache` y `Vary: Authorization`.
**Alternativas descartadas:** un ETag global por proyecto (un cliente podría recibir un 304 que valida una versión que no le corresponde) y `public`/`max-age` (un proxy o CDN compartido serviría datos de otro usuario).
**Consecuencias:** un 304 cuesta lo mismo de calcular que un 200, pero ahorra transferencia. Ninguna caché compartida guarda la respuesta.

## ADR-008 — Vue 3 + Vite en el visor
**Contexto:** hay bastante estado de UI (token, proyecto, selección, carga, errores, formulario) alrededor de una escena three.js.
**Decisión:** Vue 3 con `<script setup>` y TypeScript, usando Vite. La escena vive en un módulo propio, fuera de la reactividad (`markRaw`).
**Alternativas descartadas:** TypeScript sin framework (manejar a mano el DOM y los estados es propenso a errores) y React (no es la preferencia del equipo).
**Consecuencias:** hay que tener cuidado de no volver reactivos los objetos de three.js, porque sus proxies matan el rendimiento.

## ADR-009 — Parseo de la nube en un Web Worker con transferables
**Contexto:** la nube de 2 M de puntos pesa unos 32 MB. Parsearla en el hilo principal congela la UI, sobre todo en un iPad.
**Decisión:** el worker descarga el archivo con `fetch` en streaming, reporta el progreso real, valida el encabezado y el tamaño, y devuelve `Float32Array` y `Uint8Array` como transferables.
**Alternativas descartadas:** parsear en el hilo principal (bloquea la UI) y usar `postMessage` sin transferables (copia decenas de MB).
**Consecuencias:** hay un protocolo de mensajes que mantener. El hilo principal solo construye la `BufferGeometry`.

## ADR-010 — Cancelación con AbortController e id de carga
**Contexto:** si el usuario cambia de proyecto a mitad de una carga, ningún punto del proyecto anterior debe aparecer.
**Decisión:** cada carga tiene un id. Al cambiar de proyecto o al pulsar Cancel se aborta el fetch, se termina el worker y se ignora cualquier mensaje cuyo id no sea el actual.
**Alternativas descartadas:** abortar solo el fetch (un resultado que ya estaba parseándose podría llegar tarde).
**Consecuencias:** se protege en dos capas, abortando la carga y descartando los resultados viejos.

## ADR-011 — Se usa el kit tal cual y las nubes se generan
**Contexto:** el kit `site-viewer-lite-starter/` llega con los datos y la herramienta de nubes. Los evaluadores corren el servidor con su kit. Las nubes pesan unos 30 MB.
**Decisión:** el kit se versiona sin cambios, salvo `data/clouds/`, que va al `.gitignore`. `npm run setup` genera las nubes con su propio `tools/make-cloud.js`. La API lee `DATA_DIR`, que por defecto es `site-viewer-lite-starter/data`.
**Alternativas descartadas:** copiar los datos a un `data/` propio (los duplica y se pueden desincronizar) y versionar los `.pts` (archivos binarios pesados en git).
**Consecuencias:** se respeta la estructura en que se entregó el kit. El primer arranque tarda unos segundos más mientras se generan las nubes.

## ADR-012 — TypeBox como fuente única de tipos y schemas
**Contexto:** cada forma de datos que cruza HTTP necesitaba dos definiciones: un `type` de TypeScript (que desaparece al compilar) y un JSON Schema (que Fastify usa en runtime para validar y serializar). Las dos se podían desincronizar sin que nada avisara.
**Decisión:** las formas se escriben una vez con TypeBox (`typebox`) y el tipo se deriva con `Static<typeof X>`. Las rutas usan `FastifyPluginAsyncTypebox` (`@fastify/type-provider-typebox`, mantenido por el equipo de Fastify), que infiere `request.params`, `request.body` y la respuesta a partir de los schemas. Los schemas de las respuestas viven en `domain/` del módulo: TypeBox es una librería de schemas, no depende de Fastify.
**Alternativas descartadas:** JSON Schema a mano más `type` (duplicación); `json-schema-to-ts` (deriva tipos de JSON Schema plano, pero su sintaxis es más verbosa y los tipos son más lentos de compilar); Zod con `fastify-type-provider-zod` (popular, pero no lo mantiene Fastify y necesita convertir a JSON Schema para el serializador rápido).
**Consecuencias:** dos dependencias más. Desaparecen los genéricos manuales como `app.get<{ Params }>`. Un campo nuevo se declara en un solo lugar, y si no se declara, el serializador lo descarta.

## ADR-013 — El visor reutiliza los tipos de la API y una base de UI compartida (DRY)
**Contexto:** el visor necesita los mismos tipos que la API (`ProjectSummary`, `ProjectDetail`, `Space`), y varias pantallas repiten lo mismo: pedir datos con token y cancelar la petición anterior, mostrar un error con "Try again", y elegir una opción entre pocas (usuario, nivel, m²/ft²).
**Decisión:** `visor-web/src/modules/core/api-types.ts` reexporta con `import type` los tipos de los schemas TypeBox de la API; el compilador los borra y nada del servidor llega al navegador. En `core` vive lo compartido: `apiFetch` (único punto HTTP), `useApi` (GET reactivo con `AbortController`), `ErrorBox`, `SegmentedControl` y el estilo base de los botones en `base.css`.
**Alternativas descartadas:** copiar los tipos en el visor (se desincronizan en silencio); un paquete `shared/` aparte (otro workspace para tres tipos); una librería de componentes (dependencia grande para cuatro controles).
**Consecuencias:** si la API cambia un DTO, `npm run typecheck` falla en el visor. El visor depende de la ruta de carpetas de la API, así que mover `dto.ts` obliga a tocar `api-types.ts`. Si los repositorios se separan, la salida estándar es publicar el contrato como OpenAPI (`@fastify/swagger`) y generar los tipos del visor (`openapi-typescript`). No se hace ahora porque el enunciado no lo pide.
