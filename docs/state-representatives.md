# Representantes estatales — alcance aprobado y entrega

Historia y especificación aprobadas en la conversación del 4 de octubre de 2026.
Base inicial de implementación: `c44cfc5`, rama `feat/state-representatives`, worktree
`/root/copatelmex-representatives`. Los cambios ajenos del checkout original se conservan.

## Comportamiento

En Administración → Representantes, administradores pueden consultar, buscar,
filtrar, crear, editar, dar de baja y reactivar. Moderadores solamente consultan.
El directorio admite varios contactos por estado y zona. Baja significa marcar
inactivo, con confirmación, sin eliminar antecedentes. Los campos del cónyuge y
los cumpleaños son opcionales. Los cumpleaños se capturan como DD/MM y se guardan
como MM-DD, sin año; 29/02 es válido.

La migración preserva los 33 contactos publicados, que cubren 32 estados,
incluyendo las zonas Valle de México y Valle de Toluca. Puebla conserva el nombre
compuesto tal como estaba publicado; Sonora y Tabasco conservan “Por confirmar”.
No se inventan cónyuges, cumpleaños ni teléfonos.

## Datos, consultas y permisos

- `state_representatives`: estado, zona, nombre, correo, teléfono, activo,
  identificador y fechas de creación/modificación. RLS permite lectura pública
  de activos y lectura de todos los registros a admin/moderator.
- `representative_personal_details`: nombre del cónyuge y ambos cumpleaños.
  RLS solamente permite leer a admin/moderator. La consulta pública no solicita
  ni recibe estas columnas. Ninguna credencial administrativa vive en el cliente.
- `save_state_representative`: RPC exclusiva de admin, con guardado atómico de
  ambas tablas y control de concurrencia mediante `updated_at`. Los clientes
  carecen de permisos de escritura directa y de borrado en ambas tablas.
- Índice único contra duplicados exactos de estado, zona, nombre y correo.
  La misma zona admite varios contactos diferentes.
- El mapa público lee los activos desde BBDD, con carga, error/reintento y estado
  sin operador. Conserva enlaces a correo/teléfono y añade selección de estado
  por teclado o móvil. No usa el antiguo directorio fijo como respaldo oculto.
- No hay trabajos en segundo plano, notificaciones ni dependencias nuevas.

## Archivos

- `supabase/migrations/20261004120000_state_representatives.sql`
- `src/integrations/supabase/types.ts`
- `src/lib/representativeStates.ts`, `src/lib/representativeDirectory.ts`
- `src/hooks/useRepresentatives.ts`
- `src/components/admin/AdminRepresentatives.tsx`
- `src/pages/Admin.tsx`, `src/pages/StateOperators.tsx`
- `scripts/test-representatives.mjs`, `scripts/test-representatives-browser.mjs`
- `scripts/tests/representatives-db-bootstrap.sql`, `scripts/tests/representatives-db.sql`
- Este documento y `docs/state-representatives-validation.md`.

## Pruebas reproducibles

Con dependencias de desarrollo existentes, sin instalar paquetes adicionales:

```bash
node --experimental-strip-types scripts/test-representatives.mjs
./node_modules/.bin/tsc --noEmit -p tsconfig.app.json
npm run build
npm run lint
```

Para pruebas UI se necesita un Playwright y Chromium ya instalados. El script
compila un arnés local con los componentes reales, sesión ficticia y respuestas
interceptadas. Nunca consulta la BBDD de producción. Usar las rutas locales:

```bash
PLAYWRIGHT_MODULE=/ruta/playwright/index.mjs CHROMIUM_PATH=/ruta/chrome node scripts/test-representatives-browser.mjs
```

Primero debe existir `dist/assets/index-*.css` generado por build. La prueba abre
un servidor en loopback, usa un puerto temporal y cierra servidor/navegador al
terminar. Escribe capturas en un directorio temporal.

Las pruebas SQL se ejecutan **solamente en una BBDD desechable**. El bootstrap
crea roles anon/authenticated y simula `auth.uid()`/`has_role()` mediante variables
locales. No reproduce todo Supabase ni reemplaza UAT autenticada en producción.
En esa BBDD vacía, ejecutar con ON_ERROR_STOP los siguientes archivos, en orden:

1. `scripts/tests/representatives-db-bootstrap.sql`
2. `supabase/migrations/20261004120000_state_representatives.sql`
3. `scripts/tests/representatives-db.sql`

Los registros creados por la prueba SQL se revierten al terminar. La prueba cubre
inventario, fechas, atomicidad, duplicados, concurrencia, roles, campos privados,
baja y reactivación. El archivo bootstrap jamás se aplica al entorno real.

## Aplicación y recuperación

Aplicar la migración aditiva, comprobar contactos y permisos y luego publicar el
frontend aprobado. Requieren autorización separada la aplicación en BBDD y el
despliegue. Commit/push/PR/merge fueron autorizados después de aprobar el diff;
sus recibos finales se reportan en el PR y la conversación. La migración real y
el despliegue siguen pendientes.

Antes de aplicar: confirmar la BBDD y release reales, preservar backup y verificar
la función de roles. Antes de desplegar: reconciliar esta rama con los cambios de
release posteriores a la base para no perder trabajo existente.

Si falla la publicación, restaurar el frontend anterior; las tablas nuevas se
pueden conservar sin pérdida. No eliminar tablas con contactos o datos personales
para un rollback rutinario. La migración debe aplicarse una sola vez mediante el
registro de migraciones; `ON CONFLICT DO NOTHING` protege los inserts iniciales,
pero no convierte todo el DDL en una migración repetible.

## Límites y riesgos

Pendientes aplicación real, despliegue y UAT con cuentas del entorno destino.
`npm run lint` falla por un `prefer-const` preexistente en
`src/integrations/supabase/previewAuthStorage.ts:38`; no se amplió el alcance para
corregirlo. Build advierte de tamaño de bundle y Browserslist desactualizado.
La geometría del mapa depende de la URL externa ya usada por el proyecto; el
selector de estados permite consultar contactos sin depender de esa geometría.
