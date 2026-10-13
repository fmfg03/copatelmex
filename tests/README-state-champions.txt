Campeones estatales: alcance aprobado y verificación
==================================================

Historia y especificación aprobadas el 13 de octubre de 2026.
El home conserva la ubicación del spot después de Noticias. Con estados
publicados, muestra spot y banner en columnas iguales en computadora y
apilados en celular. El banner recorre estados alfabéticamente cada seis
segundos usando el carrusel existente; permite avanzar, retroceder y pausar.
Un solo estado queda fijo; sin publicaciones o ante error, el spot conserva
su ancho. Los errores de imágenes muestran la categoría no disponible.

Panel > Campeones estatales (solo administradores): seleccionar estado,
cargar JPG/PNG/WebP de hasta 10 MB por categoría Varonil/Juvenil/Femenil,
revisar vista previa, ajustar encuadre y guardar borrador o publicar.
Los borradores pueden estar incompletos. Publicar requiere tres categorías.
Retirar conserva el borrador. Editar un borrador mantiene intacta la versión
publicada hasta republicar. Recargar estados permite recuperar conflictos
de edición concurrente después de cerrar el editor.

Preparación en el navegador: orientación EXIF, original conservado,
banner de 900x600 WebP (PNG si el navegador no codifica WebP), encuadre
inicial sin recortar al equipo. Zoom 1..3 y posición horizontal/vertical
0..100. El encuadre es seleccionado por una persona; no detecta rostros.
La tabla/RPC valida estado, categorías, rutas, tamaño/MIME de metadata,
existencia de archivos y encuadre, además del rol y versión del registro.
Las imágenes se almacenan en gallery-media/champions, bucket público
existente. Un borrador no aparece en el home; sus archivos tienen URL pública.

No se añaden dependencias. No se vinculan equipos/jugadores/resultados.
Los registros de campeones representan el contenido editorial actual;
no incluyen un archivo histórico anual ni cambios a otros módulos.

Pruebas unitarias (Node 22 con soporte de eliminación de tipos):
  node --experimental-strip-types tests/state-champions.test.mjs

Pruebas SQL (PostgreSQL 16, usuario postgres disponible si se ejecuta como root):
  bash tests/run-state-champions-db.sh
El script crea un cluster NUEVO con socket Unix temporal, sin puerto TCP.
Instala una fixture mínima, la migración y los casos de aceptación; los
casos se revierten y el servidor temporal se apaga al terminar.
PG_BIN permite usar otra ubicación de los binarios de PostgreSQL.
La fixture simula auth.uid, has_role y metadata de storage. No demuestra
los servicios HTTP ni las políticas de Storage de una instalación real.
No ejecutar las fixtures en producción ni en una base de datos existente.

Pruebas de navegador (Playwright instalado por el operador, fuera del proyecto):
  ./node_modules/.bin/vite --config tests/vite.champions.config.mjs
En otra terminal:
  PLAYWRIGHT_MODULE_PATH=/ruta/playwright-core/index.mjs node tests/state-champions-browser.mjs
La configuración de prueba excluye el generador MCP, usa URL/API key de
prueba y escucha en localhost:4174/. Todos los destinos externos se
interceptan; las mutaciones son simuladas. ACCEPTANCE_BASE_URL,
PLAYWRIGHT_EXECUTABLE_PATH, ACCEPTANCE_SCREENSHOT_DIR y
ACCEPTANCE_CASE_FILTER permiten ajustar la ejecución.

Comprobaciones de compilación:
  ./node_modules/.bin/tsc --noEmit -p tsconfig.app.json
  npm run lint
  npm run build
El build usa la configuración de entorno existente, cuya URL/API debe
verificarse antes de cualquier promoción. Compilar no despliega.
El plugin MCP del Vite principal puede regenerar su archivo: ese cambio
generado queda fuera del alcance de esta función y debe revisarse por separado.

Integración pendiente antes de activar:
Aplicar la migración con autorización explícita en el backend correcto;
comprobar allí lectura pública solo de snapshots, roles admin/moderator/user,
uploads/downloads reales, forma de respuestas RPC, guardado/publicación/retiro,
errores de red y orientación de fotos reales. Esta comprobación no queda
sustituida por las pruebas simuladas. No hay jobs, endpoints externos nuevos,
ni autorización de despliegue en la aprobación de la especificación.

Reversión: retirar la integración del banner/panel y conservar registros
y archivos; no eliminar contenido ni la tabla automáticamente.
Los assets inmutables de versiones antiguas se conservan para proteger
publicaciones. Un resultado ambiguo de guardado conserva los assets subidos
porque el servidor pudo haber confirmado la operación. La limpieza futura
requiere comprobar referencias tanto de borradores como de publicaciones;
no se añade un recolector de archivos al alcance actual.
